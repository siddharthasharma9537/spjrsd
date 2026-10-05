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

    async def to_list(self, n):
        return self.rows[:n]


class Reviews:
    """In-memory google_reviews. Counts calls so a test can assert the sync
    makes a handful of round trips, not one or two per review."""

    def __init__(self):
        self.docs, self.calls = [], 0

    async def find_one(self, q, proj=None):
        self.calls += 1
        return next((dict(d) for d in self.docs if d["google_review_id"] == q["google_review_id"]), None)

    def find(self, q, proj=None):
        self.calls += 1
        ids = set(q["google_review_id"]["$in"])
        return Cursor([dict(d) for d in self.docs if d["google_review_id"] in ids])

    async def insert_one(self, doc):
        self.calls += 1
        self.docs.append(dict(doc))

    async def insert_many(self, docs, **kw):
        self.calls += 1
        self.docs.extend(dict(d) for d in docs)

    async def update_one(self, q, update):
        self.calls += 1
        for d in self.docs:
            if d["google_review_id"] == q["google_review_id"]:
                d.update(update["$set"])
                return

    async def bulk_write(self, ops, **kw):
        self.calls += 1
        for op in ops:
            for d in self.docs:
                if d["google_review_id"] == op._filter["google_review_id"]:
                    d.update(op._doc["$set"])


class Roles:
    async def find_one(self, q, proj=None):
        return {"name": q["name"], "is_superuser": True, "permissions": []}


def google_review(i, stars="FIVE", reply=None, comment="c"):
    r = {"name": f"accounts/1/locations/2/reviews/r{i}", "starRating": stars, "comment": comment,
         "reviewer": {"displayName": f"Person{i} Surname"}, "createTime": "2026-10-01T00:00:00Z"}
    if reply:
        r["reviewReply"] = {"comment": reply, "updateTime": "2026-10-02T00:00:00Z"}
    return r


@pytest.fixture
def env(monkeypatch):
    reviews = Reviews()

    class DB:
        pass

    db = DB()
    db.google_reviews, db.roles = reviews, Roles()
    listing = []
    monkeypatch.setattr(main, "db", db)
    monkeypatch.setattr(main.syndication, "fetch_reviews", lambda: listing)
    c = TestClient(main.app)
    c.reviews, c.listing = reviews, listing
    c.headers = {"Authorization": "Bearer " + main.create_token({"sub": "u1", "role": "EO"})}
    return c


def sync(c):
    r = c.post("/api/admin/reviews/sync")
    assert r.status_code == 200, r.text
    return r.json()


def by_id(c, i):
    return next(d for d in c.reviews.docs if d["google_review_id"].endswith(f"/r{i}"))


def test_new_review_is_stored_pending_with_a_drafted_reply(env):
    env.listing.append(google_review(1))
    assert sync(env) == {"fetched": 1, "new": 1}
    doc = by_id(env, 1)
    assert doc["status"] == "pending" and doc["star_rating"] == 5
    assert doc["draft_reply"] == main._draft_review_reply(5, "Person1 Surname")


def test_a_review_that_already_has_an_owner_reply_is_stored_as_already_replied(env):
    env.listing.append(google_review(1, reply="Visit again."))
    sync(env)
    doc = by_id(env, 1)
    assert doc["status"] == "already_replied" and doc["posted_reply"] == "Visit again."


def test_resync_refreshes_the_comment_but_keeps_an_edited_draft(env):
    env.listing.append(google_review(1, comment="old"))
    sync(env)
    by_id(env, 1)["draft_reply"] = "Staff wrote this"
    env.reviews.docs[0]["draft_reply"] = "Staff wrote this"
    env.listing[0] = google_review(1, comment="edited by reviewer")
    assert sync(env) == {"fetched": 1, "new": 0}
    doc = by_id(env, 1)
    assert doc["comment"] == "edited by reviewer" and doc["draft_reply"] == "Staff wrote this"
    assert doc["status"] == "pending" and len(env.reviews.docs) == 1


def test_a_pending_review_the_owner_answered_in_the_google_app_becomes_already_replied(env):
    env.listing.append(google_review(1))
    sync(env)
    env.listing[0] = google_review(1, reply="Replied from the app")
    sync(env)
    doc = by_id(env, 1)
    assert doc["status"] == "already_replied" and doc["posted_reply"] == "Replied from the app"


def test_an_approved_review_is_not_downgraded_on_resync(env):
    env.listing.append(google_review(1))
    sync(env)
    env.reviews.docs[0].update({"status": "approved", "posted_reply": "ours"})
    env.listing[0] = google_review(1, reply="ours")
    sync(env)
    assert by_id(env, 1)["status"] == "approved" and by_id(env, 1)["posted_reply"] == "ours"


def test_entries_without_a_name_are_skipped(env):
    env.listing.extend([{"starRating": "FIVE"}, google_review(2)])
    assert sync(env) == {"fetched": 2, "new": 1}


def test_a_full_sync_makes_a_handful_of_database_round_trips(env):
    env.listing.extend(google_review(i) for i in range(100))
    sync(env)
    env.reviews.calls = 0
    env.listing.extend(google_review(i) for i in range(100, 200))
    assert sync(env) == {"fetched": 200, "new": 100}
    assert env.reviews.calls <= 5
