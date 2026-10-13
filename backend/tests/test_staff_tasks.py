import os

os.environ.setdefault("MONGO_URL", "mongodb://localhost:1")
os.environ.setdefault("DB_NAME", "test")
os.environ.setdefault("JWT_SECRET", "x" * 32)

import pytest
from fastapi.testclient import TestClient

from app import main


def _matches(doc, q):
    for key, cond in q.items():
        if key == "$or":
            if not any(_matches(doc, sub) for sub in cond):
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


class Result:
    def __init__(self, n):
        self.matched_count = self.modified_count = self.deleted_count = n


class Collection:
    def __init__(self, docs=()):
        self.docs = [dict(d) for d in docs]

    def find(self, q, proj=None):
        return Cursor([{k: v for k, v in d.items() if k != "_id"} for d in self.docs if _matches(d, q)])

    async def find_one(self, q, proj=None):
        return next((dict(d) for d in self.docs if _matches(d, q)), None)

    async def insert_one(self, doc):
        self.docs.append(dict(doc))

    async def update_one(self, q, update):
        for d in self.docs:
            if _matches(d, q):
                d.update(update.get("$set", {}))
                for key, val in update.get("$push", {}).items():
                    d.setdefault(key, []).extend(val["$each"] if isinstance(val, dict) and "$each" in val else [val])
                return Result(1)
        return Result(0)

    async def delete_one(self, q):
        before = len(self.docs)
        self.docs = [d for d in self.docs if not _matches(d, q)]
        return Result(before - len(self.docs))


ROLES = [
    {"name": "EO", "is_superuser": True, "permissions": []},
    {"name": "Clerk", "permissions": []},
    {"name": "Cashier", "permissions": []},
]
USERS = [
    {"id": "eo", "name": "Temple EO", "role": "EO", "active_flag": True},
    {"id": "ramesh", "name": "Ramesh", "role": "Clerk", "active_flag": True},
    {"id": "sita", "name": "Sita", "role": "Cashier", "active_flag": True},
]


def _auth(user_id):
    u = next(u for u in USERS if u["id"] == user_id)
    return {"Authorization": "Bearer " + main.create_token({"sub": u["id"], "name": u["name"], "role": u["role"]})}


EO, RAMESH, SITA = _auth("eo"), _auth("ramesh"), _auth("sita")


@pytest.fixture
def env(monkeypatch):
    class DB:
        roles = Collection(ROLES)
        user_accounts = Collection(USERS)
        tasks = Collection()

    emails = []

    async def send_email(recipients, subject, message):
        emails.append((recipients, subject, message))

    monkeypatch.setattr(main, "db", DB())
    monkeypatch.setattr(main, "send_email_via_msg91", send_email)
    monkeypatch.setattr(main, "TASK_ALERT_EMAIL", "eo@example.org")
    client = TestClient(main.app)
    return client, DB.tasks, emails


def _create(client, **body):
    r = client.post("/api/admin/tasks", json={"title": "Upload Karthika posters", **body}, headers=EO)
    assert r.status_code == 200, r.text
    return r.json()


def test_eo_creates_task_for_a_person_who_sees_only_their_own(env):
    client, _, _ = env
    mine = _create(client, assigned_user_id="ramesh", due_date="2026-10-30")
    _create(client, assigned_user_id="sita")
    assert mine["assigned_user_name"] == "Ramesh" and mine["status"] == "open"

    r = client.get("/api/admin/tasks", headers=RAMESH).json()
    assert [t["id"] for t in r["tasks"]] == [mine["id"]]
    assert r["tasks"][0]["is_mine"] and not r["can_create"]
    assert len(client.get("/api/admin/tasks", headers=EO).json()["tasks"]) == 2


def test_task_for_a_role_reaches_everyone_in_that_role(env):
    client, _, _ = env
    task = _create(client, assigned_role="Cashier")
    assert [t["id"] for t in client.get("/api/admin/tasks", headers=SITA).json()["tasks"]] == [task["id"]]
    assert client.get("/api/admin/tasks", headers=RAMESH).json()["tasks"] == []


def test_staff_without_permission_cannot_create_or_edit(env):
    client, _, _ = env
    task = _create(client, assigned_user_id="ramesh")
    assert client.post("/api/admin/tasks", json={"title": "x"}, headers=RAMESH).status_code == 403
    assert client.put(f"/api/admin/tasks/{task['id']}", json={"due_date": "2026-11-01"}, headers=RAMESH).status_code == 403
    assert client.delete(f"/api/admin/tasks/{task['id']}", headers=RAMESH).status_code == 403


def test_need_help_requires_a_message_flags_the_task_and_emails(env):
    client, tasks, emails = env
    task = _create(client, assigned_user_id="ramesh")
    url = f"/api/admin/tasks/{task['id']}/status"
    assert client.post(url, json={"status": "need_help"}, headers=RAMESH).status_code == 400

    r = client.post(url, json={"status": "need_help", "text": "Which photos should I use?"}, headers=RAMESH)
    assert r.status_code == 200
    t = r.json()
    assert t["needs_attention"] and t["new_for_managers"]
    assert t["thread"][-1]["status"] == "need_help" and t["thread"][-1]["by_name"] == "Ramesh"
    assert len(emails) == 1 and "Ramesh" in emails[0][2] and emails[0][0] == [{"email": "eo@example.org"}]


def test_eo_reply_clears_the_help_flag_and_notifies_the_assignee(env):
    client, _, _ = env
    task = _create(client, assigned_user_id="ramesh")
    client.post(f"/api/admin/tasks/{task['id']}/status", json={"status": "need_help", "text": "?"}, headers=RAMESH)
    client.post(f"/api/admin/tasks/{task['id']}/seen", headers=RAMESH)

    t = client.post(f"/api/admin/tasks/{task['id']}/messages", json={"text": "Use the Day 1 photos"}, headers=EO).json()
    assert not t["needs_attention"] and t["new_for_assignee"]
    client.post(f"/api/admin/tasks/{task['id']}/seen", headers=RAMESH)
    assert not client.get("/api/admin/tasks", headers=RAMESH).json()["tasks"][0]["new_for_assignee"]


def test_note_from_assignee_does_not_email(env):
    client, _, emails = env
    task = _create(client, assigned_user_id="ramesh")
    t = client.post(f"/api/admin/tasks/{task['id']}/messages", json={"text": "Waiting for the priest"}, headers=RAMESH).json()
    assert t["new_for_managers"] and not t["needs_attention"] and emails == []


def test_someone_else_cannot_answer_or_see_the_task(env):
    client, _, _ = env
    task = _create(client, assigned_user_id="ramesh")
    assert client.post(f"/api/admin/tasks/{task['id']}/status", json={"status": "completed"}, headers=SITA).status_code == 404
    assert client.post(f"/api/admin/tasks/{task['id']}/messages", json={"text": "hi"}, headers=SITA).status_code == 404


def test_reassign_and_new_due_date_are_recorded_in_the_thread(env):
    client, _, _ = env
    task = _create(client, assigned_user_id="ramesh", due_date="2026-10-20")
    t = client.put(f"/api/admin/tasks/{task['id']}", json={"due_date": "2026-10-25", "assigned_user_id": "sita"}, headers=EO).json()
    assert t["due_date"] == "2026-10-25" and t["assigned_user_name"] == "Sita"
    assert [e["text"] for e in t["thread"]] == ["Due date changed to 2026-10-25", "Reassigned to Sita"]
    assert client.get("/api/admin/tasks", headers=RAMESH).json()["tasks"] == []


def test_completed_tasks_sort_last_and_bad_input_is_rejected(env):
    client, _, _ = env
    done = _create(client, assigned_user_id="ramesh", due_date="2026-10-14")
    later = _create(client, assigned_user_id="ramesh", due_date="2026-12-01")
    client.post(f"/api/admin/tasks/{done['id']}/status", json={"status": "completed"}, headers=RAMESH)
    assert [t["id"] for t in client.get("/api/admin/tasks", headers=EO).json()["tasks"]] == [later["id"], done["id"]]
    assert client.post("/api/admin/tasks", json={"title": "x", "due_date": "20-10-2026"}, headers=EO).status_code == 400
    assert client.post(f"/api/admin/tasks/{done['id']}/status", json={"status": "cancelled"}, headers=RAMESH).status_code == 400
