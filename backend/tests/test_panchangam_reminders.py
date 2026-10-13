import os

os.environ.setdefault("MONGO_URL", "mongodb://localhost:1")
os.environ.setdefault("DB_NAME", "test")
os.environ.setdefault("JWT_SECRET", "x" * 32)

from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient

from app import main


def labels(**doc):
    return [en for en, _ in main._reminder_labels(doc)]


def test_book_symbols_are_dropped_and_notes_kept():
    assert labels(special_note="Kojagari (Kumara) Pournami, Valmiki Jayanti; Blank Circle", tithi="Chaturdashi") == \
        ["Kojagari (Kumara) Pournami, Valmiki Jayanti"]
    assert labels(special_note="Star symbol", tithi="Ekadashi") == []
    assert labels(special_note="", tithi="Dashami") == []


def test_amavasya_and_pournami_are_added_once():
    assert labels(special_note="", tithi="Amavasya") == ["Amavasya"]
    assert labels(special_note="Ashwayuja Amavasya; Blank Circle (Amavasya)", tithi="Amavasya") == ["Ashwayuja Amavasya"]
    assert labels(special_note="Pournami; Blank Circle", tithi="Pournami") == ["Pournami"]


def test_shiva_days():
    assert labels(tithi="Chaturdashi", paksha="Krishna") == ["Masa Shivaratri"]
    assert labels(tithi="Chaturdashi", paksha="Shukla") == []
    assert labels(tithi="Navami", masa="Kartikamu", vaaram="Monday") == ["Karthika Somavaram"]
    assert labels(tithi="Navami", masa="Kartikamu", vaaram="Tuesday") == []
    assert labels(tithi="Navami", masa="Ashwayujamu", vaaram="Monday") == []


class Cursor:
    def __init__(self, rows):
        self.rows = rows

    async def to_list(self, n):
        return self.rows[:n]


@pytest.fixture
def client(monkeypatch):
    today = datetime.now(main.IST).date()
    tomorrow = today + timedelta(days=1)
    docs = [
        {"date": today.isoformat(), "tithi": "Dashami", "special_note": "Star symbol"},
        {"date": tomorrow.isoformat(), "tithi": "Amavasya", "special_note": "Ashwayuja Amavasya; Blank Circle (Amavasya)"},
    ]

    class Panchangam:
        def find(self, q, proj=None):
            wanted = q["date"]["$in"]
            return Cursor([d for d in docs if d["date"] in wanted])

    class DB:
        panchangam = Panchangam()

    monkeypatch.setattr(main, "db", DB())
    return TestClient(main.app), tomorrow


def test_endpoint_lists_only_days_worth_a_reminder(client):
    c, tomorrow = client
    items = c.get("/api/panchangam/reminders").json()
    assert len(items) == 1
    item = items[0]
    assert item["when"] == "tomorrow" and item["date"] == tomorrow.isoformat()
    assert item["title"] == f"Tomorrow ({tomorrow.strftime('%a')}, {tomorrow.day} {tomorrow.strftime('%b')}): Ashwayuja Amavasya"
    assert item["title_telugu"].startswith("రేపు (") and item["title_telugu"].endswith("Ashwayuja Amavasya")
