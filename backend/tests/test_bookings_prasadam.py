import os

os.environ.setdefault("MONGO_URL", "mongodb://localhost:1")
os.environ.setdefault("DB_NAME", "test")
os.environ.setdefault("JWT_SECRET", "x" * 32)

from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient

from app import main

TODAY = datetime.now(main.IST).date()
YESTERDAY = (TODAY - timedelta(days=1)).isoformat()
TODAY = TODAY.isoformat()


class Cursor:
    def __init__(self, rows):
        self.rows = rows

    def sort(self, *a, **k):
        return self

    async def to_list(self, n):
        return self.rows[:n]


@pytest.fixture
def env(monkeypatch):
    queries, tickets = [], {}

    class Bookings:
        def find(self, q, proj=None):
            queries.append(q)
            return Cursor([])

        async def find_one(self, q, proj=None):
            key = q.get("booking_number") or next((t["booking_number"] for t in tickets.values() if t["id"] == q.get("id")), None)
            return dict(tickets[key]) if key in tickets else None

        async def update_one(self, q, update):
            t = next(t for t in tickets.values() if t["id"] == q["id"])
            t.update(update["$set"])

    class Single:
        async def find_one(self, q, proj=None):
            return {"name": "EO", "is_superuser": True, "permissions": []} if "name" in q else None

    class DB:
        pass

    db = DB()
    db.bookings, db.roles, db.user_accounts = Bookings(), Single(), Single()
    monkeypatch.setattr(main, "db", db)
    c = TestClient(main.app)
    c.headers["Authorization"] = "Bearer " + main.create_token({"sub": "eo", "name": "EO", "role": "EO"})
    c.queries, c.tickets = queries, tickets
    return c


def add_ticket(c, **fields):
    t = {"id": "b1", "booking_number": "T1", "status": "Confirmed", "for_date": TODAY,
         "prasadam_eligible": True, "prasadam_redeemed": False, **fields}
    c.tickets[t["booking_number"]] = t
    return t


def collect(c):
    return c.post("/api/admin/bookings/scan-redeem-prasadam", json={"booking_number": "T1"})


# ---- list filters ----

def test_prasadam_pending_lists_todays_completed_uncollected_tickets(env):
    assert env.get("/api/admin/bookings", params={"view": "prasadam_pending"}).status_code == 200
    assert env.queries[-1] == {"status": "Completed", "prasadam_eligible": True,
                               "prasadam_redeemed": {"$ne": True}, "for_date": TODAY}


def test_no_show_lists_past_confirmed_tickets_and_marked_no_shows(env):
    env.get("/api/admin/bookings", params={"view": "no_show"})
    assert env.queries[-1] == {"$or": [{"status": "NoShow"}, {"status": "Confirmed", "for_date": {"$lt": TODAY}}]}


def test_without_a_view_the_query_is_unchanged(env):
    env.get("/api/admin/bookings", params={"status": "Completed", "date": "2026-10-14"})
    assert env.queries[-1] == {"for_date": "2026-10-14", "status": "Completed"}


# ---- Prasadam Counter scan ----

def test_prasadam_can_be_collected_before_the_pooja_on_the_ticket_date(env):
    add_ticket(env, status="Confirmed")
    r = collect(env)
    assert r.status_code == 200
    assert r.json()["prasadam_redeemed"] is True and r.json()["status"] == "Confirmed"


def test_prasadam_can_be_collected_after_the_pooja(env):
    add_ticket(env, status="Completed")
    assert collect(env).status_code == 200


def test_pooja_can_still_be_scanned_after_prasadam_was_collected(env):
    add_ticket(env, status="Confirmed")
    collect(env)
    r = env.post("/api/admin/bookings/scan-complete", json={"booking_number": "T1"})
    assert r.status_code == 200 and r.json()["status"] == "Completed"


def test_prasadam_is_refused_after_the_ticket_date(env):
    add_ticket(env, for_date=YESTERDAY)
    r = collect(env)
    assert r.status_code == 400 and "only be collected on the ticket date" in r.json()["detail"]


def test_prasadam_is_refused_for_a_cancelled_ticket(env):
    add_ticket(env, status="Cancelled")
    assert collect(env).status_code == 400


def test_prasadam_cannot_be_collected_twice(env):
    add_ticket(env)
    collect(env)
    r = collect(env)
    assert r.status_code == 400 and "already collected for this ticket on " in r.json()["detail"]


# ---- completing a past ticket ----

def test_a_past_ticket_cannot_be_scanned_completed(env):
    add_ticket(env, for_date=YESTERDAY)
    r = env.post("/api/admin/bookings/scan-complete", json={"booking_number": "T1"})
    assert r.status_code == 400 and "has expired - it can't be marked Completed" in r.json()["detail"]
    assert env.tickets["T1"]["status"] == "Confirmed"


def test_a_past_ticket_cannot_be_completed_with_the_button(env):
    add_ticket(env, for_date=YESTERDAY)
    r = env.put("/api/admin/bookings/b1/status", json={"status": "Completed"})
    assert r.status_code == 400
    assert env.tickets["T1"]["status"] == "Confirmed"


def test_todays_ticket_can_be_completed_with_the_button(env):
    add_ticket(env)
    r = env.put("/api/admin/bookings/b1/status", json={"status": "Completed"})
    assert r.status_code == 200 and r.json()["status"] == "Completed"


def test_an_expired_ticket_cannot_be_cancelled(env):
    add_ticket(env, for_date=YESTERDAY)
    r = env.put("/api/admin/bookings/b1/status", json={"status": "Cancelled"})
    assert r.status_code == 400 and "has expired - it can't be cancelled" in r.json()["detail"]
    assert env.tickets["T1"]["status"] == "Confirmed"


def test_no_cancellation_request_for_an_expired_ticket(env):
    add_ticket(env, for_date=YESTERDAY)
    r = env.post("/api/admin/bookings/b1/request-cancellation", json={"reason": "late"})
    assert r.status_code == 400 and "has expired" in r.json()["detail"]
