import os

os.environ.setdefault("MONGO_URL", "mongodb://localhost:1")
os.environ.setdefault("DB_NAME", "test")
os.environ.setdefault("JWT_SECRET", "x" * 32)

import pytest
from fastapi.testclient import TestClient

from app import main

CLIENT_ID = "test-client.apps.googleusercontent.com"
EMAIL = "devotee@example.com"


class FakeResponse:
    def __init__(self, status_code, payload):
        self.status_code, self._payload = status_code, payload

    def json(self):
        return self._payload


def matches(doc, q):
    if "$or" in q:
        return any(matches(doc, sub) for sub in q["$or"])
    return all(doc.get(k) == v for k, v in q.items())


@pytest.fixture
def env(monkeypatch):
    devotees, mails = [], []
    google = {"aud": CLIENT_ID, "email": EMAIL, "email_verified": "true", "sub": "g-sub-1", "name": "Ravi"}

    class Devotees:
        async def find_one(self, q, proj=None):
            return next((dict(d) for d in devotees if matches(d, q)), None)

        async def insert_one(self, doc):
            devotees.append(dict(doc))

        async def update_one(self, q, update):
            for d in devotees:
                if matches(d, q):
                    d.update(update.get("$set", {}))
                    return

    class DB:
        pass

    db = DB()
    db.devotees = Devotees()

    async def fake_mail(recipients, subject, message):
        mails.append(recipients[0]["email"])

    monkeypatch.setattr(main, "db", db)
    monkeypatch.setattr(main, "GOOGLE_CLIENT_ID", CLIENT_ID)
    monkeypatch.setattr(main, "send_email_via_msg91", fake_mail)
    monkeypatch.setattr(main.requests, "get", lambda *a, **k: FakeResponse(200, google))
    c = TestClient(main.app)
    c.devotees, c.mails, c.google = devotees, mails, google
    return c


def sign_in(c):
    return c.post("/api/auth/devotee/google", json={"credential": "any"})


def test_new_google_devotee_is_email_verified_so_they_can_book(env):
    assert sign_in(env).status_code == 200
    assert env.devotees[0]["email_verified"] is True


def test_returning_google_devotee_created_before_the_fix_is_healed(env):
    env.devotees.append({"id": "d1", "name": "Ravi", "email": EMAIL, "google_sub": "g-sub-1"})
    assert sign_in(env).status_code == 200
    assert env.devotees[0]["email_verified"] is True


def test_google_signin_links_to_an_existing_verified_account(env):
    env.devotees.append({"id": "d1", "name": "Ravi", "email": EMAIL, "email_verified": True, "password_hash": "h"})
    r = sign_in(env)
    assert r.status_code == 200 and r.json()["devotee"]["id"] == "d1"
    assert env.devotees[0]["google_sub"] == "g-sub-1"
    assert len(env.devotees) == 1


def test_google_signin_does_not_log_into_an_unverified_account_made_with_that_email(env):
    # Someone registered the victim's address with their own password and never
    # verified it. The real owner signing in with Google must not land in it.
    env.devotees.append({"id": "attacker-made", "name": "X", "email": EMAIL, "email_verified": False, "password_hash": "h"})
    r = sign_in(env)
    assert r.status_code == 409
    assert "token" not in r.json()
    assert "google_sub" not in env.devotees[0]
    assert len(env.devotees) == 1


def test_refusing_an_unverified_account_sends_no_verification_mail(env):
    # A mail from here would steer the real owner into verifying the squatter's
    # account, handing it over with the squatter's password still set.
    env.devotees.append({"id": "x", "name": "X", "email": EMAIL, "email_verified": False, "password_hash": "h"})
    sign_in(env)
    assert env.mails == []


def test_google_signin_never_matches_on_mobile(env):
    env.devotees.append({"id": "d1", "name": "Other", "email": "other@example.com", "mobile": "9876543210",
                         "email_verified": True, "password_hash": "h"})
    env.google["mobile"] = "9876543210"
    r = sign_in(env)
    assert r.status_code == 200 and r.json()["devotee"]["id"] != "d1"
    assert len(env.devotees) == 2


def test_google_account_without_verified_email_is_still_refused(env):
    env.google["email_verified"] = "false"
    assert sign_in(env).status_code == 401
