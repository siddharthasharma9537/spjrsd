import os

os.environ.setdefault("MONGO_URL", "mongodb://localhost:1")
os.environ.setdefault("DB_NAME", "test")
os.environ.setdefault("JWT_SECRET", "x" * 32)

import asyncio
import copy
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
    return types.SimpleNamespace(db=db, sent=sent, registered=registered)


def text_message(body, wa_id="wamid.1", phone=PHONE):
    return {"from": phone, "id": wa_id, "type": "text", "text": {"body": body}}


def say(bot, body, wa_id="wamid.1", phone=PHONE):
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
