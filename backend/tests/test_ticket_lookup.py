import os

os.environ.setdefault("MONGO_URL", "mongodb://localhost:1")
os.environ.setdefault("DB_NAME", "test")
os.environ.setdefault("JWT_SECRET", "x" * 32)

import pytest
from fastapi.testclient import TestClient

from app import main

MOBILE = "9876543210"

BOOKING = {
    "id": "b-uuid-1", "booking_number": "SPJRS-20261004-ABC123", "devotee_id": "d1",
    "devotee_mobile": MOBILE, "devotee_name": "Ravi", "seva_name_english": "Abhishekam",
    "seva_name_telugu": "అభిషేకం", "for_date": "2026-10-10", "slot_start_time": "06:00",
    "slot_end_time": "07:00", "status": "Confirmed", "gotram": "Bharadwaja",
    "nakshatra": "Ashwini", "rashi": "Mesha", "amount": 500,
    "booking_date_time": "2026-10-04T00:00:00",
}
# A counter-sale (walk-in) ticket has no devotee account to e-mail.
WALK_IN = {**BOOKING, "id": "b-uuid-2", "booking_number": "SPJRS-20261004-WALK01",
           "devotee_id": None, "devotee_name": "Walk In"}


class Cursor:
    def __init__(self, rows):
        self.rows = rows

    def sort(self, *a, **k):
        return self

    async def to_list(self, n):
        return self.rows[:n]


@pytest.fixture
def env(monkeypatch):
    sent = []
    devotees = {"d1": {"id": "d1", "name": "Ravi", "email": "ravi@example.com"}}
    bookings = [BOOKING, WALK_IN]

    class Bookings:
        def find(self, q, proj=None):
            return Cursor([b for b in bookings if b["devotee_mobile"] == q["devotee_mobile"]])

        async def find_one(self, q, proj=None):
            return next((b for b in bookings if b["booking_number"] == q["booking_number"]), None)

    class Devotees:
        async def find_one(self, q, proj=None):
            return devotees.get(q["id"])

        async def update_one(self, q, update):
            devotees[q["id"]].update(update["$set"])

    class DB:
        pass

    db = DB()
    db.bookings, db.devotees = Bookings(), Devotees()

    async def fake_send(recipients, subject, message):
        sent.append({"to": [r["email"] for r in recipients], "subject": subject, "message": message})

    monkeypatch.setattr(main, "db", db)
    monkeypatch.setattr(main, "send_email_via_msg91", fake_send)
    c = TestClient(main.app)
    c.sent, c.devotees = sent, devotees
    return c


def lookup(c, **params):
    return c.get("/api/bookings/lookup/ticket", params=params)


def test_mobile_lookup_does_not_return_booking_numbers_or_ids(env):
    body = lookup(env, mobile=MOBILE).text
    assert BOOKING["booking_number"] not in body
    assert BOOKING["id"] not in body
    assert WALK_IN["booking_number"] not in body


def test_mobile_lookup_reply_is_the_same_whether_or_not_anything_matches(env):
    hit = lookup(env, mobile=MOBILE)
    miss = lookup(env, mobile="0000000000")
    assert hit.status_code == miss.status_code == 200
    assert hit.json() == miss.json()


def test_mobile_lookup_emails_tickets_to_the_booking_owner(env):
    lookup(env, mobile=MOBILE)
    assert len(env.sent) == 1
    mail = env.sent[0]
    assert mail["to"] == ["ravi@example.com"]
    assert BOOKING["booking_number"] in mail["message"]
    assert f"/ticket/{BOOKING['id']}" in mail["message"]
    # the walk-in ticket belongs to nobody we can e-mail
    assert WALK_IN["booking_number"] not in mail["message"]


def test_mobile_lookup_sends_nothing_when_no_booking_matches(env):
    lookup(env, mobile="0000000000")
    assert env.sent == []


def test_repeat_mobile_lookups_do_not_flood_the_owners_inbox(env):
    for _ in range(3):
        lookup(env, mobile=MOBILE)
    assert len(env.sent) == 1


def test_a_failing_mail_send_does_not_change_the_reply(env, monkeypatch):
    async def boom(*a, **k):
        raise RuntimeError("mail down")

    ok = lookup(env, mobile=MOBILE)
    monkeypatch.setattr(main, "send_email_via_msg91", boom)
    env.devotees["d1"].pop("last_ticket_email_at", None)
    failed = lookup(env, mobile=MOBILE)
    assert failed.status_code == 200 and failed.json() == ok.json()


def test_booking_number_lookup_still_returns_the_ticket(env):
    r = lookup(env, booking_number=BOOKING["booking_number"])
    assert r.status_code == 200 and r.json()[0]["booking_number"] == BOOKING["booking_number"]


def test_lookup_needs_one_parameter(env):
    assert lookup(env).status_code == 400
