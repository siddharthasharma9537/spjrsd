import os

os.environ.setdefault("MONGO_URL", "mongodb://localhost:1")
os.environ.setdefault("DB_NAME", "test")
os.environ.setdefault("JWT_SECRET", "x" * 32)

import asyncio
import copy
import itertools
import sys
import types
from datetime import datetime, timedelta, timezone

import pytest

from app.routes import whatsapp

PHONE = "919390353848"


class Collection:
    """Just enough of a Motor collection for the WhatsApp handler: equality
    filters, $set / $unset updates and upsert."""

    def __init__(self):
        self.rows = []

    def _match(self, row, query):
        return all(row.get(k) == v for k, v in query.items())

    async def find_one(self, query, projection=None):
        for row in self.rows:
            if self._match(row, query):
                return copy.deepcopy(row)
        return None

    async def insert_one(self, doc):
        self.rows.append(copy.deepcopy(doc))

    async def update_one(self, query, update, upsert=False):
        for row in self.rows:
            if self._match(row, query):
                break
        else:
            if not upsert:
                return
            row = dict(query)
            self.rows.append(row)
        for key, value in update.get("$set", {}).items():
            row[key] = copy.deepcopy(value)
        for key in update.get("$unset", {}):
            row.pop(key, None)


class FakeDB:
    def __init__(self):
        self.whatsapp_sessions = Collection()
        self.whatsapp_messages = Collection()
        self.devotees = Collection()

    def session(self, phone=PHONE):
        return next((r for r in self.whatsapp_sessions.rows if r["phone"] == phone), None)


@pytest.fixture
def bot(monkeypatch):
    db = FakeDB()
    sent = []
    registered = []

    async def fake_payload(to, message_type, payload):
        sent.append((to, message_type, payload))

    async def fake_register(data):
        registered.append(data)
        return {"mobile": data.mobile, "email": data.email}

    monkeypatch.setattr(whatsapp, "db", db)
    monkeypatch.setattr(whatsapp, "_send_whatsapp_payload", fake_payload)
    # whatsapp.py imports these lazily from app.main (circular import), so
    # stand in for that module rather than loading the whole app.
    monkeypatch.setitem(sys.modules, "app.main", types.SimpleNamespace(
        DevoteeRegister=lambda **kw: types.SimpleNamespace(**kw),
        _register_devotee=fake_register,
    ))
    db.whatsapp_sessions.rows.append({"phone": PHONE, "language": "en"})
    whatsapp._message_log.clear()
    whatsapp._rate_notified.clear()
    return types.SimpleNamespace(db=db, sent=sent, registered=registered)


_ids = itertools.count(1)


def text_message(body, wa_id=None, phone=PHONE):
    wa_id = wa_id or f"wamid.auto{next(_ids)}"
    return {"from": phone, "id": wa_id, "type": "text", "text": {"body": body}}


def say(bot, body, wa_id=None, phone=PHONE):
    asyncio.run(whatsapp._handle_inbound_message(text_message(body, wa_id, phone), {}))


def texts(bot):
    return [p["text"]["body"] for _, t, p in bot.sent if t == "text"]


def register_up_to_password(bot, newsletter="yes"):
    for answer in ("11", "Lakshmi Devi", "lakshmi@example.com", "skip", newsletter):
        say(bot, answer)


def stored_text(bot):
    return repr(bot.db.whatsapp_sessions.rows) + repr(bot.db.whatsapp_messages.rows)


# ---- registration: no plaintext password at rest ---------------------------

def test_password_is_never_stored_in_plaintext(bot):
    register_up_to_password(bot)
    say(bot, "S3cretPass")
    assert "S3cretPass" not in repr(bot.db.whatsapp_sessions.rows)
    session = bot.db.session()
    assert session["reg_state"] == "confirm_password"
    assert session["reg_data"]["password_hash_pending"].startswith("$2")

    say(bot, "S3cretPass")
    # The confirmed plaintext went straight to the account creation...
    assert len(bot.registered) == 1
    assert bot.registered[0].password == "S3cretPass"
    assert bot.registered[0].subscribe_newsletter is True
    # ...and nothing about registration is left in the session.
    session = bot.db.session()
    assert "reg_state" not in session and "reg_data" not in session
    assert "S3cretPass" not in repr(bot.db.whatsapp_sessions.rows)


def test_newsletter_answer_is_kept_until_the_end(bot):
    register_up_to_password(bot, newsletter="no")
    say(bot, "S3cretPass")
    say(bot, "S3cretPass")
    assert bot.registered[0].subscribe_newsletter is False


def test_mismatched_confirmation_goes_back_to_password(bot):
    register_up_to_password(bot)
    say(bot, "S3cretPass")
    say(bot, "different")
    session = bot.db.session()
    assert session["reg_state"] == "password"
    assert "password_hash_pending" not in session["reg_data"]
    assert bot.registered == []


def test_registration_flow_ends_with_the_done_message(bot):
    register_up_to_password(bot)
    say(bot, "S3cretPass")
    say(bot, "S3cretPass")
    assert "Registration complete" in texts(bot)[-1]


# ---- registration: expiry and escape ---------------------------------------

def age_registration(bot, minutes):
    old = (datetime.now(timezone.utc) - timedelta(minutes=minutes)).isoformat()
    bot.db.session()["reg_updated_at"] = old


def test_registration_expires_after_thirty_minutes(bot, monkeypatch):
    async def no_free_text(to, language, message):
        pass

    monkeypatch.setattr(whatsapp, "_handle_free_text", no_free_text)
    say(bot, "11")
    age_registration(bot, 31)
    say(bot, "Lakshmi Devi")
    session = bot.db.session()
    assert "reg_state" not in session and "reg_data" not in session
    assert any("cleared" in t for t in texts(bot))


def test_recent_registration_is_not_expired(bot):
    say(bot, "11")
    age_registration(bot, 10)
    say(bot, "Lakshmi Devi")
    assert bot.db.session()["reg_state"] == "email"


def test_registration_without_timestamp_counts_as_expired(bot):
    bot.db.session().update({"reg_state": "name", "reg_data": {}})
    say(bot, "Lakshmi Devi")
    assert "reg_state" not in bot.db.session()


@pytest.mark.parametrize("word", ["menu", "help", "MENU", "మెనూ"])
def test_menu_and_help_leave_a_registration(bot, word):
    say(bot, "11")
    say(bot, "Lakshmi Devi")
    bot.sent.clear()
    say(bot, word)
    session = bot.db.session()
    assert "reg_state" not in session and "reg_data" not in session
    assert any(t == "interactive" for _, t, _ in bot.sent)


def test_a_greeting_is_still_taken_as_a_name(bot):
    say(bot, "11")
    say(bot, "Hello")
    assert bot.db.session()["reg_data"]["name"] == "Hello"


def test_cancel_still_works(bot):
    say(bot, "11")
    say(bot, "cancel")
    assert "reg_state" not in bot.db.session()
    assert "cancelled" in texts(bot)[-1]


# ---- webhook: signature, duplicates, per-message errors --------------------

import hashlib
import hmac
import json

from fastapi import HTTPException


class FakeRequest:
    def __init__(self, payload, secret=None, signature=None):
        self._raw = json.dumps(payload).encode()
        sig = signature
        if sig is None and secret:
            sig = "sha256=" + hmac.new(secret.encode(), self._raw, hashlib.sha256).hexdigest()
        self.headers = {"x-hub-signature-256": sig} if sig else {}

    async def body(self):
        return self._raw

    async def json(self):
        return json.loads(self._raw)


def delivery(*messages):
    return {"entry": [{"changes": [{"value": {"messages": list(messages)}}]}]}


def post(request):
    return asyncio.run(whatsapp.receive_whatsapp_webhook(request))


def test_unset_secret_fails_closed(bot, monkeypatch, caplog):
    monkeypatch.setattr(whatsapp, "META_APP_SECRET", None)
    monkeypatch.delenv("WHATSAPP_ALLOW_UNSIGNED", raising=False)
    with caplog.at_level("WARNING"):
        with pytest.raises(HTTPException) as err:
            post(FakeRequest(delivery(text_message("hi"))))
    assert err.value.status_code == 403
    assert "META_APP_SECRET is not set" in caplog.text
    assert bot.sent == [] and bot.db.whatsapp_messages.rows == []


def test_unset_secret_can_be_allowed_for_local_development(bot, monkeypatch):
    monkeypatch.setattr(whatsapp, "META_APP_SECRET", None)
    monkeypatch.setenv("WHATSAPP_ALLOW_UNSIGNED", "true")
    assert post(FakeRequest(delivery(text_message("menu")))) == {"status": "ok"}
    assert bot.sent


def test_valid_signature_is_accepted(bot, monkeypatch):
    monkeypatch.setattr(whatsapp, "META_APP_SECRET", "topsecret")
    assert post(FakeRequest(delivery(text_message("menu")), secret="topsecret")) == {"status": "ok"}
    assert bot.sent


@pytest.mark.parametrize("signature", [None, "sha256=deadbeef", "md5=abc"])
def test_missing_or_wrong_signature_is_refused(bot, monkeypatch, signature):
    monkeypatch.setattr(whatsapp, "META_APP_SECRET", "topsecret")
    with pytest.raises(HTTPException) as err:
        post(FakeRequest(delivery(text_message("menu")), signature=signature))
    assert err.value.status_code == 403
    assert bot.sent == []


def test_a_redelivered_message_is_not_answered_twice(bot, monkeypatch):
    monkeypatch.setattr(whatsapp, "META_APP_SECRET", "topsecret")
    request = lambda: FakeRequest(delivery(text_message("menu", wa_id="wamid.same")), secret="topsecret")
    post(request())
    first = len(bot.sent)
    assert first > 0
    post(request())
    assert len(bot.sent) == first
    assert len(bot.db.whatsapp_messages.rows) == 1


def test_a_redelivered_registration_answer_does_not_advance_twice(bot):
    say(bot, "11", wa_id="wamid.a")
    say(bot, "Lakshmi Devi", wa_id="wamid.b")
    say(bot, "Lakshmi Devi", wa_id="wamid.b")
    # Had the retry been processed as the email answer, it would be rejected as
    # an invalid email and the state would still be "email"; either way no
    # second prompt is sent and the stored messages show it once.
    assert [m["wa_message_id"] for m in bot.db.whatsapp_messages.rows] == ["wamid.a", "wamid.b"]
    assert bot.db.session()["reg_state"] == "email"


def test_one_failing_message_does_not_fail_the_delivery(bot, monkeypatch, caplog):
    monkeypatch.setattr(whatsapp, "META_APP_SECRET", "topsecret")
    real = whatsapp._handle_inbound_message

    async def flaky(message, value):
        if message["id"] == "wamid.bad":
            raise RuntimeError("boom")
        await real(message, value)

    monkeypatch.setattr(whatsapp, "_handle_inbound_message", flaky)
    request = FakeRequest(
        delivery(text_message("menu", wa_id="wamid.bad"), text_message("menu", wa_id="wamid.good")),
        secret="topsecret",
    )
    with caplog.at_level("ERROR"):
        assert post(request) == {"status": "ok"}
    assert "wamid.bad" in caplog.text
    assert [m["wa_message_id"] for m in bot.db.whatsapp_messages.rows] == ["wamid.good"]
    assert bot.sent


# ---- non-text messages ------------------------------------------------------

@pytest.fixture
def no_model(monkeypatch):
    calls = []

    async def classify(message, history):
        calls.append(("classify", message))
        return "chat"

    async def ask(message, history):
        calls.append(("ask", message))
        return "answer"

    monkeypatch.setattr(whatsapp.intent_router, "classify", classify)
    monkeypatch.setattr(whatsapp.chat_agent, "ask", ask)
    return calls


@pytest.mark.parametrize("message", [
    {"type": "audio", "audio": {"id": "a1"}},
    {"type": "image", "image": {"id": "i1"}},
    {"type": "location", "location": {"latitude": 17.2, "longitude": 79.1}},
    {"type": "reaction", "reaction": {"emoji": "🙏"}},
    {"type": "sticker", "sticker": {"id": "s1"}},
    {"type": "interactive", "interactive": {"type": "nfm_reply"}},
    {"type": "text", "text": {"body": "   "}},
])
def test_non_text_gets_a_note_and_never_reaches_the_model(bot, no_model, message):
    message = {"from": PHONE, "id": "wamid.nt", **message}
    asyncio.run(whatsapp._handle_inbound_message(message, {}))
    assert no_model == []
    assert texts(bot) == [whatsapp.NON_TEXT_NOTE]
    assert "menu" in whatsapp.NON_TEXT_NOTE and "మెనూ" in whatsapp.NON_TEXT_NOTE


def test_non_text_does_not_disturb_a_registration(bot, no_model):
    say(bot, "11")
    say(bot, "Lakshmi Devi")
    message = {"from": PHONE, "id": "wamid.voice", "type": "audio", "audio": {"id": "a1"}}
    asyncio.run(whatsapp._handle_inbound_message(message, {}))
    session = bot.db.session()
    assert session["reg_state"] == "email"
    assert session["reg_data"] == {"name": "Lakshmi Devi"}


def test_normal_text_still_reaches_the_model(bot, no_model):
    say(bot, "when is the next festival")
    assert [kind for kind, _ in no_model] == ["classify", "ask"]


# ---- rate limit --------------------------------------------------------------

@pytest.fixture
def clock(monkeypatch):
    now = [1000.0]
    monkeypatch.setattr(whatsapp.time, "monotonic", lambda: now[0])
    return now


def test_a_number_over_the_limit_gets_one_notice_then_silence(bot, no_model, clock):
    for _ in range(whatsapp.RATE_LIMIT_MAX_MESSAGES):
        say(bot, "when is the next festival")
    answered = len(no_model)
    assert answered == 2 * whatsapp.RATE_LIMIT_MAX_MESSAGES
    bot.sent.clear()

    say(bot, "one more")
    assert texts(bot) == [whatsapp.RATE_LIMIT_NOTE]
    say(bot, "and another")
    say(bot, "and another")
    assert texts(bot) == [whatsapp.RATE_LIMIT_NOTE]
    assert len(no_model) == answered


def test_the_limit_clears_after_the_window(bot, no_model, clock):
    for _ in range(whatsapp.RATE_LIMIT_MAX_MESSAGES + 1):
        say(bot, "when is the next festival")
    bot.sent.clear()
    clock[0] += whatsapp.RATE_LIMIT_WINDOW_SECONDS + 1
    say(bot, "when is the next festival")
    assert texts(bot) == ["answer"]


def test_the_limit_is_per_number(bot, no_model, clock):
    other = "919000000001"
    bot.db.whatsapp_sessions.rows.append({"phone": other, "language": "en"})
    for _ in range(whatsapp.RATE_LIMIT_MAX_MESSAGES + 1):
        say(bot, "when is the next festival")
    bot.sent.clear()
    say(bot, "when is the next festival", phone=other)
    assert texts(bot) == ["answer"]
