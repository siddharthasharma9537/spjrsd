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


# ---- upcoming festivals for the full panchangam page
def test_festivals_of_a_day_skip_the_recurring_observances():
    doc = {"observances": [{"name_en": "Mahalaya Amavasya", "name_te": "మహాలయ అమావాస్య", "recurring": False},
                           {"name_en": "Chitta Karte", "name_te": "చిత్త కార్తె", "recurring": True}],
           "special_note": "Mahalaya Amavasya; Chitta Karte"}
    assert main._festivals_of(doc) == [("Mahalaya Amavasya", "మహాలయ అమావాస్య")]


def test_festivals_of_an_older_day_come_from_its_note():
    assert main._festivals_of({"special_note": "Gauri Tritiya; Star symbol", "special_note_telugu": "గౌరీ తృతీయ; Star symbol"}) == \
        [("Gauri Tritiya", "గౌరీ తృతీయ")]
    assert main._festivals_of({"special_note": "Holi; Pournami", "special_note_telugu": "హోళీ"}) == [("Holi", "Holi"), ("Pournami", "Pournami")]


def test_upcoming_endpoint_lists_the_next_festivals(monkeypatch):
    rows = [
        {"date": "2026-10-16", "observances": [{"name_en": "Sri Saraswati Avahana", "name_te": "శ్రీ సరస్వతీ ఆవాహన", "recurring": False}]},
        {"date": "2026-10-19", "observances": [{"name_en": "Durgashtami", "name_te": "దుర్గాష్టమి", "recurring": False},
                                               {"name_en": "Maha Navami", "name_te": "మహర్నవమి", "recurring": False}]},
    ]
    seen = {}

    class Sorted:
        def __init__(self, rows):
            self.rows = rows

        def sort(self, *_):
            return Cursor(self.rows)

    class Panchangam:
        def find(self, q, proj=None):
            seen["query"] = q
            return Sorted([r for r in rows if r["date"] > q["date"]["$gt"]])

    class DB:
        panchangam = Panchangam()

    monkeypatch.setattr(main, "db", DB())
    body = TestClient(main.app).get("/api/panchangam/upcoming", params={"date": "2026-10-13", "limit": 2}).json()
    assert body == [{"date": "2026-10-16", "name": "Sri Saraswati Avahana", "name_telugu": "శ్రీ సరస్వతీ ఆవాహన"},
                    {"date": "2026-10-19", "name": "Durgashtami", "name_telugu": "దుర్గాష్టమి"}]
    assert seen["query"]["date"] == {"$gt": "2026-10-13"}
    assert TestClient(main.app).get("/api/panchangam/upcoming", params={"date": "13-10-2026"}).status_code == 400
