import os

os.environ.setdefault("MONGO_URL", "mongodb://localhost:1")
os.environ.setdefault("DB_NAME", "test")
os.environ.setdefault("JWT_SECRET", "x" * 32)

from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from app import main

SECRET = "cron-secret"


def _iso(minutes):
    return (datetime.now(timezone.utc) + timedelta(minutes=minutes)).isoformat(timespec="seconds")


def _matches(doc, q):
    for key, cond in q.items():
        if key == "$or":
            if not any(_matches(doc, sub) for sub in cond):
                return False
        elif isinstance(cond, dict):
            for op, val in cond.items():
                if op == "$exists" and (key in doc) != val:
                    return False
                if op == "$lte" and not (key in doc and doc[key] <= val):
                    return False
        elif doc.get(key) != cond:
            return False
    return True


class Cursor:
    def __init__(self, rows):
        self.rows = rows

    def sort(self, *a, **k):
        return self

    async def to_list(self, n):
        return self.rows[:n]


class UpdateResult:
    def __init__(self, n):
        self.matched_count = self.modified_count = n


class LiveBlog:
    def __init__(self, docs):
        self.docs = [dict(d) for d in docs]

    def find(self, q, proj=None):
        return Cursor([dict(d) for d in self.docs if _matches(d, q)])

    async def find_one(self, q, proj=None):
        return next((dict(d) for d in self.docs if _matches(d, q)), None)

    async def distinct(self, field, q):
        return sorted({d[field] for d in self.docs if _matches(d, q)})

    async def insert_one(self, doc):
        self.docs.append(dict(doc))

    async def update_one(self, q, update):
        for d in self.docs:
            if _matches(d, q):
                d.update(update["$set"])
                return UpdateResult(1)
        return UpdateResult(0)


POSTS = [
    {"id": "live", "event_name": "E", "title": "Already out", "active_flag": True, "posted_at": _iso(-60)},
    {"id": "due", "event_name": "E", "title": "Due now", "active_flag": True, "publish_at": _iso(-2),
     "posted_at": _iso(-2), "syndication_pending": True},
    {"id": "future", "event_name": "Later", "title": "Tomorrow", "active_flag": True, "publish_at": _iso(600),
     "posted_at": _iso(600), "syndication_pending": True},
]


class Roles:
    async def find_one(self, q, proj=None):
        return {"name": q["name"], "is_superuser": True, "permissions": []}


ADMIN = {"Authorization": "Bearer " + main.create_token({"sub": "u1", "name": "EO", "role": "EO"})}


@pytest.fixture
def env(monkeypatch):
    blog = LiveBlog(POSTS)

    class DB:
        live_blog = blog
        roles = Roles()

    published = []
    monkeypatch.setattr(main, "db", DB())
    monkeypatch.setattr(main, "CRON_SECRET", SECRET)
    monkeypatch.setattr(main.syndication, "publish", lambda item, path, **kw: published.append((item["id"], path)))
    return TestClient(main.app), blog, published


def test_public_reads_hide_posts_until_their_time(env):
    client, _, _ = env
    ids = [p["id"] for p in client.get("/api/live-blog").json()]
    assert ids == ["live", "due"]
    assert client.get("/api/live-blog/future").status_code == 404
    assert client.get("/api/live-blog/due").status_code == 200
    assert client.get("/api/live-blog/events").json() == ["E"]


def test_cron_publishes_due_posts_once(env):
    client, blog, published = env
    first = client.post("/api/cron/live-blog-publish", headers={"X-Cron-Secret": SECRET}).json()
    second = client.post("/api/cron/live-blog-publish", headers={"X-Cron-Secret": SECRET}).json()

    assert first == {"published": ["due"]}
    assert second == {"published": []}
    assert published == [("due", "/live-blog/due")]
    assert next(d for d in blog.docs if d["id"] == "future")["syndication_pending"] is True


def test_cron_requires_the_secret(env):
    client, _, published = env
    assert client.post("/api/cron/live-blog-publish").status_code == 401
    assert client.post("/api/cron/live-blog-publish", headers={"X-Cron-Secret": "wrong"}).status_code == 401
    assert published == []


def test_create_with_future_publish_at_schedules_instead_of_mirroring(env):
    client, blog, published = env
    body = {"event_name": "E", "title": "Day 3", "content": "x", "publish_at": "2099-01-01T06:05:00+05:30"}
    r = client.post("/api/admin/live-blog", json=body, headers=ADMIN)
    assert r.status_code == 200, r.text
    created = r.json()

    assert created["publish_at"] == "2099-01-01T00:35:00+00:00"
    assert created["posted_at"] == created["publish_at"]
    assert created["syndication_pending"] is True
    assert published == []
    assert all(p["id"] != created["id"] for p in client.get("/api/live-blog").json())


def test_publish_at_without_timezone_is_rejected(env):
    client, _, _ = env
    body = {"event_name": "E", "title": "T", "content": "x", "publish_at": "2099-01-01T06:05"}
    assert client.post("/api/admin/live-blog", json=body, headers=ADMIN).status_code == 400


def test_create_without_publish_at_still_mirrors_immediately(env):
    client, blog, published = env
    r = client.post("/api/admin/live-blog", json={"event_name": "E", "title": "Now", "content": "x"}, headers=ADMIN)
    assert r.status_code == 200, r.text
    created = r.json()
    assert "publish_at" not in created and "syndication_pending" not in created
    assert published == [(created["id"], f"/live-blog/{created['id']}")]
