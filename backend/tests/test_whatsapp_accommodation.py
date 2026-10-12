import os

os.environ.setdefault("MONGO_URL", "mongodb://localhost:1")
os.environ.setdefault("DB_NAME", "test")
os.environ.setdefault("JWT_SECRET", "x" * 32)

import asyncio

import pytest

from app.routes import whatsapp

ROOMS = [
    {"name": "Gowri Sadan - AC Room", "name_telugu": "గౌరీ సదన్ - ఏసీ రూమ్", "price_per_day": 1500, "active_flag": True},
    {"name": "Parvathi Sadanam - Non-AC Room", "name_telugu": "పార్వతి సదనం - నాన్ ఏసీ రూమ్", "price_per_day": 500, "active_flag": True},
    {"name": "Ganga Sadan", "name_telugu": "గంగా సదన్ ", "price_per_day": 700.0, "active_flag": True},
    {"name": "Gowri Sadan Non-AC Room", "name_telugu": "", "price_per_day": 1000, "active_flag": True},
    {"name": "Pilgrim Dormitory", "name_telugu": "యాత్రికుల డార్మిటరీ", "price_per_day": 100, "active_flag": False},
]


class Cursor:
    def __init__(self, rows):
        self.rows = rows

    def sort(self, key, direction):
        self.rows = sorted(self.rows, key=lambda r: r[key], reverse=direction == -1)
        return self

    async def to_list(self, n):
        return self.rows[:n]


@pytest.fixture
def fake_db(monkeypatch):
    queries = []

    class Accommodations:
        def find(self, q, proj=None):
            queries.append(q)
            return Cursor([r for r in ROOMS if all(r.get(k) == v for k, v in q.items())])

    class DB:
        accommodations = Accommodations()

    monkeypatch.setattr(whatsapp, "db", DB())
    return queries


def test_english_lists_active_rooms_cheapest_first(fake_db):
    reply = asyncio.run(whatsapp._accommodation_reply("en"))

    assert fake_db == [{"active_flag": True}]
    assert reply == (
        "🛏️ Accommodation\n\n"
        "- Parvathi Sadanam - Non-AC Room – ₹500/day\n"
        "- Ganga Sadan – ₹700/day\n"
        "- Gowri Sadan Non-AC Room – ₹1000/day\n"
        "- Gowri Sadan - AC Room – ₹1500/day\n\n"
        "Check availability and book: https://cheruvugattu.online/accommodation"
    )


def test_telugu_uses_telugu_names_and_falls_back_to_english(fake_db):
    reply = asyncio.run(whatsapp._accommodation_reply("te"))

    assert "- పార్వతి సదనం - నాన్ ఏసీ రూమ్ – ₹500/రోజు" in reply
    # Trailing space in the stored Telugu name is stripped.
    assert "- గంగా సదన్ – ₹700/రోజు" in reply
    # No Telugu name stored -> the English name rather than a blank line item.
    assert "- Gowri Sadan Non-AC Room – ₹1000/రోజు" in reply
    assert "డార్మిటరీ" not in reply
    assert reply.endswith("లభ్యత చూసి బుక్ చేసుకోండి: https://cheruvugattu.online/accommodation")


def test_old_hard_coded_rooms_are_gone(fake_db):
    for language in ("en", "te"):
        reply = asyncio.run(whatsapp._accommodation_reply(language))
        for stale in ("Siva Nilayam", "Nandi Cottage", "శివ నిలయం", "నంది కాటేజ్", "₹400", "₹800"):
            assert stale not in reply
