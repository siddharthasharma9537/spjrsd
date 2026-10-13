import os

os.environ.setdefault("MONGO_URL", "mongodb://localhost:1")
os.environ.setdefault("DB_NAME", "test")
os.environ.setdefault("JWT_SECRET", "x" * 32)

import pytest
from fastapi.testclient import TestClient

from app import main


class Roles:
    def __init__(self, docs):
        self.docs = docs

    async def find_one(self, q, proj=None):
        return next((dict(d) for d in self.docs if d["name"] == q.get("name")), None)


ROLES = [
    {"name": "EO", "is_superuser": True, "permissions": []},
    {"name": "Writer", "permissions": ["live_blog:view", "live_blog:create"]},
    {"name": "Editor", "permissions": ["live_blog:view", "live_blog:edit"]},
    {"name": "Viewer", "permissions": ["live_blog:view"]},
]


def _auth(role):
    return {"Authorization": "Bearer " + main.create_token({"sub": role.lower(), "name": role, "role": role})}


UPLOAD = "/api/admin/live-blog/upload"
JPEG = ("photo.jpg", b"\xff\xd8\xff\xe0 fake jpeg", "image/jpeg")


@pytest.fixture
def client(monkeypatch):
    class DB:
        roles = Roles(ROLES)

    monkeypatch.setattr(main, "db", DB())
    return TestClient(main.app)


@pytest.fixture
def r2(monkeypatch):
    uploads = []

    class FakeR2:
        def upload_fileobj(self, fileobj, bucket, key, ExtraArgs=None):
            uploads.append((key, fileobj.read(), ExtraArgs["ContentType"]))

    for name, value in {"R2_ACCOUNT_ID": "a", "R2_ACCESS_KEY_ID": "k", "R2_SECRET_ACCESS_KEY": "s",
                        "R2_PUBLIC_URL": "https://cdn.example"}.items():
        monkeypatch.setattr(main, name, value)
    monkeypatch.setattr(main, "_r2_client", lambda: FakeR2())
    return uploads


def test_upload_stores_the_photo_under_live_blog_and_returns_its_url(client, r2):
    r = client.post(UPLOAD, files={"file": JPEG}, headers=_auth("EO"))
    assert r.status_code == 200, r.text
    url = r.json()["url"]
    assert url.startswith("https://cdn.example/live-blog/") and url.endswith(".jpg")
    key, body, content_type = r2[0]
    assert url.endswith(key) and body == JPEG[1] and content_type == "image/jpeg"


def test_writers_and_editors_can_upload_viewers_cannot(client, r2):
    assert client.post(UPLOAD, files={"file": JPEG}, headers=_auth("Writer")).status_code == 200
    assert client.post(UPLOAD, files={"file": JPEG}, headers=_auth("Editor")).status_code == 200
    r = client.post(UPLOAD, files={"file": JPEG}, headers=_auth("Viewer"))
    assert r.status_code == 403 and "live_blog:create or live_blog:edit" in r.json()["detail"]
    assert client.post(UPLOAD, files={"file": JPEG}).status_code in (401, 403)
    assert len(r2) == 2


def test_type_and_size_rules(client, r2):
    eo = _auth("EO")
    assert client.post(UPLOAD, files={"file": ("a.gif", b"GIF8", "image/gif")}, headers=eo).status_code == 400
    too_big = ("a.jpg", b"x" * (5 * 1024 * 1024 + 1), "image/jpeg")
    assert client.post(UPLOAD, files={"file": too_big}, headers=eo).status_code == 400
    png = client.post(UPLOAD, files={"file": ("a.png", b"\x89PNG", "image/png")}, headers=eo)
    assert png.status_code == 200 and png.json()["url"].endswith(".png")
    assert len(r2) == 1


def test_without_storage_configured_it_says_so(client, monkeypatch):
    monkeypatch.setattr(main, "R2_PUBLIC_URL", None)
    r = client.post(UPLOAD, files={"file": JPEG}, headers=_auth("EO"))
    assert r.status_code == 500 and "not configured" in r.json()["detail"]


def test_single_permission_endpoints_are_unchanged(client):
    # require_permission now takes several permissions; one still means exactly that one.
    async def run(role):
        token = main.create_token({"sub": "x", "name": "x", "role": role})
        creds = main.HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
        return await main.require_permission("live_blog:create")(creds)

    import asyncio
    assert asyncio.run(run("Writer"))["role"] == "Writer"
    with pytest.raises(main.HTTPException) as e:
        asyncio.run(run("Editor"))
    assert e.value.status_code == 403 and e.value.detail == "Missing permission: live_blog:create"
