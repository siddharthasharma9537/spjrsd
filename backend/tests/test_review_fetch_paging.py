import os

os.environ.setdefault("MONGO_URL", "mongodb://localhost:1")
os.environ.setdefault("DB_NAME", "test")
os.environ.setdefault("JWT_SECRET", "x" * 32)

import pytest

from app.services import syndication


class FakeResponse:
    def __init__(self, payload):
        self._payload = payload

    def raise_for_status(self):
        pass

    def json(self):
        return self._payload


@pytest.fixture
def google(monkeypatch):
    """A fake Google listing with `total` reviews, served 50 per page."""
    state = {"total": 2554, "calls": []}

    def fake_get(url, headers=None, params=None, timeout=None):
        params = params or {}
        state["calls"].append(dict(params))
        start = int(params.get("pageToken") or 0)
        size = int(params.get("pageSize", 50))
        end = min(start + size, state["total"])
        page = {"reviews": [{"name": f"r{i}"} for i in range(start, end)], "totalReviewCount": state["total"]}
        if end < state["total"]:
            page["nextPageToken"] = str(end)
        return FakeResponse(page)

    monkeypatch.setattr(syndication, "GBP_ACCOUNT_ID", "a")
    monkeypatch.setattr(syndication, "GBP_LOCATION_ID", "l")
    monkeypatch.setattr(syndication, "GBP_CLIENT_ID", "c")
    monkeypatch.setattr(syndication, "GBP_CLIENT_SECRET", "s")
    monkeypatch.setattr(syndication, "GBP_REFRESH_TOKEN", "r")
    monkeypatch.setattr(syndication, "_gbp_access_token", lambda: "tok")
    monkeypatch.setattr(syndication.requests, "get", fake_get)
    return state


def test_follows_next_page_token_up_to_the_cap(google):
    reviews = syndication.fetch_reviews()
    assert len(reviews) == 200
    assert reviews[0]["name"] == "r0" and reviews[-1]["name"] == "r199"
    assert len(google["calls"]) == 4


def test_stops_when_the_listing_has_fewer_reviews_than_the_cap(google):
    google["total"] = 120
    assert len(syndication.fetch_reviews()) == 120
    assert len(google["calls"]) == 3


def test_a_single_page_listing_makes_one_call(google):
    google["total"] = 7
    assert len(syndication.fetch_reviews()) == 7
    assert len(google["calls"]) == 1


def test_an_empty_listing_returns_nothing(google):
    google["total"] = 0
    assert syndication.fetch_reviews() == []


def test_the_cap_is_not_a_multiple_of_the_page_size(google):
    reviews = syndication.fetch_reviews(max_reviews=75)
    assert len(reviews) == 75
    assert len(google["calls"]) == 2


def test_requires_gbp_configuration(google, monkeypatch):
    monkeypatch.setattr(syndication, "GBP_REFRESH_TOKEN", None)
    with pytest.raises(RuntimeError):
        syndication.fetch_reviews()
