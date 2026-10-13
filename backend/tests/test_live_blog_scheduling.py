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
                if op == "$gt" and not (key in doc and doc[key] > val):
                    return False
                if op == "$ne" and doc.get(key) == val:
                    return False
        elif doc.get(key) != cond:
            return False
    return True


def _project(doc, proj):
    hidden = {k for k, v in (proj or {}).items() if v == 0}
    return {k: v for k, v in doc.items() if k not in hidden}


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
        return Cursor([_project(d, proj) for d in self.docs if _matches(d, q)])

    async def find_one(self, q, proj=None):
        return next((_project(d, proj) for d in self.docs if _matches(d, q)), None)

    async def distinct(self, field, q):
        return sorted({d[field] for d in self.docs if _matches(d, q)})

    async def insert_one(self, doc):
        self.docs.append(dict(doc))

    async def update_one(self, q, update):
        for d in self.docs:
            if _matches(d, q):
                d.update(update.get("$set", {}))
                for k in update.get("$unset", {}):
                    d.pop(k, None)
                return UpdateResult(1)
        return UpdateResult(0)


POSTS = [
    {"id": "live", "event_name": "E", "title": "Already out", "active_flag": True, "posted_at": _iso(-60),
     "note": "staff only"},
    {"id": "draft", "event_name": "Draft event", "title": "Unfinished", "content": "x", "active_flag": True, "posted_at": _iso(-5),
     "is_draft": True, "post_to_instagram": False, "also_show_in_ticker": True},
    {"id": "due", "event_name": "E", "title": "Due now", "active_flag": True, "publish_at": _iso(-2),
     "posted_at": _iso(-2), "syndication_pending": True},
    {"id": "future", "event_name": "Later", "title": "Tomorrow", "active_flag": True, "publish_at": _iso(600),
     "posted_at": _iso(600), "syndication_pending": True},
]


class News:
    def __init__(self):
        self.docs = []

    async def insert_one(self, doc):
        self.docs.append(dict(doc))


class Roles:
    async def find_one(self, q, proj=None):
        return {"name": q["name"], "is_superuser": True, "permissions": []}


ADMIN = {"Authorization": "Bearer " + main.create_token({"sub": "u1", "name": "EO", "role": "EO"})}


@pytest.fixture
def env(monkeypatch):
    blog = LiveBlog(POSTS)

    class DB:
        live_blog = blog
        news = News()
        roles = Roles()

    published, channels = [], {}

    def publish(item, path, **kw):
        published.append((item["id"], path))
        channels[item["id"]] = kw

    monkeypatch.setattr(main, "db", DB())
    monkeypatch.setattr(main, "CRON_SECRET", SECRET)
    monkeypatch.setattr(main.syndication, "publish", publish)
    client = TestClient(main.app)
    client.news, client.channels = DB.news, channels
    return client, blog, published


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


def _get(blog, post_id):
    return next(d for d in blog.docs if d["id"] == post_id)


def test_drafts_stay_hidden_and_are_never_mirrored(env):
    client, _, published = env
    assert "draft" not in [p["id"] for p in client.get("/api/live-blog").json()]
    assert client.get("/api/live-blog/draft").status_code == 404
    assert "Draft event" not in client.get("/api/live-blog/events").json()
    client.post("/api/cron/live-blog-publish", headers={"X-Cron-Secret": SECRET})
    assert "draft" not in [p[0] for p in published]


def test_create_as_draft_stores_it_without_mirroring(env):
    client, blog, published = env
    body = {"event_name": "E", "title": "Later", "content": "x", "mode": "draft", "note": "Day 4 poster"}
    created = client.post("/api/admin/live-blog", json=body, headers=ADMIN).json()
    assert created["is_draft"] is True and "publish_at" not in created
    assert _get(blog, created["id"])["note"] == "Day 4 poster"
    assert published == []


def test_note_is_never_in_public_responses(env):
    client, _, _ = env
    assert all("note" not in p for p in client.get("/api/live-blog").json())
    assert "note" not in client.get("/api/live-blog/live").json()


def test_publish_now_on_a_draft_goes_live_with_its_saved_channels_and_news(env):
    client, blog, published = env
    r = client.post("/api/admin/live-blog/draft/publish-now", headers=ADMIN)
    assert r.status_code == 200, r.text
    doc = _get(blog, "draft")
    assert "is_draft" not in doc and "publish_at" not in doc
    assert published == [("draft", "/live-blog/draft")]
    assert client.channels["draft"] == {"facebook": True, "google": True, "instagram": False}
    assert [n["title"] for n in client.news.docs] == ["Unfinished"]
    assert "draft" in [p["id"] for p in client.get("/api/live-blog").json()]


def test_publish_now_beats_the_cron_and_is_not_repeated(env):
    client, _, published = env
    assert client.post("/api/admin/live-blog/future/publish-now", headers=ADMIN).status_code == 200
    client.post("/api/cron/live-blog-publish", headers={"X-Cron-Secret": SECRET})
    assert client.post("/api/admin/live-blog/future/publish-now", headers=ADMIN).status_code == 409
    assert [p for p in published if p[0] == "future"] == [("future", "/live-blog/future")]


def test_publish_now_refuses_an_already_published_post(env):
    client, _, published = env
    assert client.post("/api/admin/live-blog/live/publish-now", headers=ADMIN).status_code == 409
    assert published == []


def test_reschedule_and_schedule_a_draft(env):
    client, blog, _ = env
    r = client.post("/api/admin/live-blog/future/schedule", json={"publish_at": "2099-02-01T07:30:00+05:30"}, headers=ADMIN)
    assert r.status_code == 200, r.text
    assert _get(blog, "future")["publish_at"] == "2099-02-01T02:00:00+00:00"
    assert _get(blog, "future")["posted_at"] == "2099-02-01T02:00:00+00:00"

    r = client.post("/api/admin/live-blog/draft/schedule", json={"publish_at": "2099-02-02T06:05:00+05:30"}, headers=ADMIN)
    assert r.status_code == 200, r.text
    doc = _get(blog, "draft")
    assert "is_draft" not in doc and doc["syndication_pending"] is True


def test_scheduling_in_the_past_or_a_published_post_is_refused(env):
    client, _, _ = env
    past = {"publish_at": "2020-01-01T06:05:00+05:30"}
    assert client.post("/api/admin/live-blog/draft/schedule", json=past, headers=ADMIN).status_code == 400
    future = {"publish_at": "2099-01-01T06:05:00+05:30"}
    assert client.post("/api/admin/live-blog/live/schedule", json=future, headers=ADMIN).status_code == 409


def test_move_to_draft_cancels_a_schedule_but_not_a_due_post(env):
    client, blog, published = env
    assert client.post("/api/admin/live-blog/future/move-to-draft", headers=ADMIN).status_code == 200
    doc = _get(blog, "future")
    assert doc["is_draft"] is True and "publish_at" not in doc and doc["syndication_pending"] is False
    assert client.post("/api/admin/live-blog/due/move-to-draft", headers=ADMIN).status_code == 409
    client.post("/api/cron/live-blog-publish", headers={"X-Cron-Secret": SECRET})
    assert "future" not in [p[0] for p in published]


def test_editing_a_scheduled_post_changes_what_goes_out(env):
    client, blog, _ = env
    body = {"title": "Corrected title", "post_to_google": False, "note": "fixed typo"}
    assert client.put("/api/admin/live-blog/due", json=body, headers=ADMIN).status_code == 200
    client.post("/api/cron/live-blog-publish", headers={"X-Cron-Secret": SECRET})
    assert client.channels["due"] == {"facebook": True, "google": False, "instagram": True}
    assert _get(blog, "due")["title"] == "Corrected title"
