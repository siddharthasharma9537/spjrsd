import pytest

from app.services import syndication


class Resp:
    def __init__(self, status, body):
        self.status_code, self._body = status, body
        self.ok = status < 400

    def json(self):
        return self._body

    def raise_for_status(self):
        if not self.ok:
            raise syndication.requests.HTTPError(response=self)


@pytest.fixture
def ig(monkeypatch):
    """Instagram configured, Facebook/Google not - so only Instagram calls happen."""
    monkeypatch.setattr(syndication, "IG_USER_ID", "17841400000000000")
    monkeypatch.setattr(syndication, "FB_PAGE_TOKEN", "page-token")
    monkeypatch.setattr(syndication, "FB_PAGE_ID", None)
    monkeypatch.setattr(syndication, "GBP_ACCOUNT_ID", None)
    monkeypatch.setattr(syndication, "IG_PUBLISH_RETRY_SECONDS", 0)
    calls, replies = [], []

    def post(url, data=None, **kw):
        calls.append((url.rsplit("/", 1)[-1], data))
        return replies.pop(0)

    monkeypatch.setattr(syndication.requests, "post", post)
    return calls, replies


ITEM = {"id": "p1", "title": "Day 3", "content": "Chandraghanta", "image_url": "https://cdn.example/gallery/day3.jpg"}


def test_jpeg_post_creates_a_container_then_publishes_it(ig):
    calls, replies = ig
    replies += [Resp(200, {"id": "container-1"}), Resp(200, {"id": "media-1"})]
    syndication.publish(ITEM, "/live-blog/p1")

    assert [c[0] for c in calls] == ["media", "media_publish"]
    media = calls[0][1]
    assert media["image_url"] == ITEM["image_url"]
    assert media["caption"].endswith("https://cheruvugattu.online/live-blog/p1")
    assert "Chandraghanta" in media["caption"]
    assert calls[1][1]["creation_id"] == "container-1"


def test_publish_is_retried_while_instagram_is_still_fetching_the_image(ig):
    calls, replies = ig
    not_ready = Resp(400, {"error": {"code": 9007, "message": "Media ID is not available"}})
    replies += [Resp(200, {"id": "c"}), not_ready, not_ready, Resp(200, {"id": "m"})]
    syndication.publish(ITEM, "/live-blog/p1")
    assert [c[0] for c in calls] == ["media", "media_publish", "media_publish", "media_publish"]


@pytest.mark.parametrize("image_url", ["", "https://cdn.example/a.webp", "https://cdn.example/a.png"])
def test_items_without_a_jpeg_skip_instagram(ig, image_url):
    calls, _ = ig
    syndication.publish({**ITEM, "image_url": image_url}, "/live-blog/p1")
    assert calls == []


def test_relative_image_paths_are_made_absolute(ig):
    calls, replies = ig
    replies += [Resp(200, {"id": "c"}), Resp(200, {"id": "m"})]
    syndication.publish({**ITEM, "image_url": "/Assets/poster.jpg"}, "/live-blog/p1")
    assert calls[0][1]["image_url"] == "https://cheruvugattu.online/Assets/poster.jpg"


def test_instagram_can_be_switched_off_and_failures_do_not_raise(ig):
    calls, replies = ig
    syndication.publish(ITEM, "/news/p1", instagram=False)
    assert calls == []

    replies += [Resp(500, {"error": {"message": "boom"}})]
    syndication.publish(ITEM, "/live-blog/p1")  # must not raise
    assert [c[0] for c in calls] == ["media"]


def test_unconfigured_instagram_does_nothing(ig, monkeypatch):
    calls, _ = ig
    monkeypatch.setattr(syndication, "IG_USER_ID", None)
    syndication.publish(ITEM, "/live-blog/p1")
    assert calls == []
