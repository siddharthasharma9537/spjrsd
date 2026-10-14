import os

os.environ.setdefault("MONGO_URL", "mongodb://localhost:1")
os.environ.setdefault("DB_NAME", "test")
os.environ.setdefault("JWT_SECRET", "x" * 32)

import pytest
from fastapi.testclient import TestClient

from app import main


class Cursor:
    def __init__(self, rows):
        self.rows = rows

    def sort(self, *a, **k):
        return self

    async def to_list(self, n):
        return self.rows[:n]


@pytest.fixture
def env(monkeypatch):
    queries = []

    class Bookings:
        def find(self, q, proj=None):
            queries.append(q)
            return Cursor([])

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
    c.queries = queries
    return c


def test_prasadam_pending_lists_completed_eligible_unredeemed_tickets(env):
    assert env.get("/api/admin/bookings", params={"prasadam": "pending"}).status_code == 200
    assert env.queries[-1] == {"status": "Completed", "prasadam_eligible": True, "prasadam_redeemed": {"$ne": True}}


def test_without_the_prasadam_filter_the_query_is_unchanged(env):
    env.get("/api/admin/bookings", params={"status": "Completed", "date": "2026-10-14"})
    assert env.queries[-1] == {"for_date": "2026-10-14", "status": "Completed"}
