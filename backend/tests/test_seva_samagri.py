import os

os.environ.setdefault("MONGO_URL", "mongodb://localhost:1")
os.environ.setdefault("DB_NAME", "test")
os.environ.setdefault("JWT_SECRET", "x" * 32)

from fastapi.testclient import TestClient

from app import main

NIJA = "93a765c0-33bd-40c3-85fa-29449f297659"
VIVAHAM = "5aa77829-8fb5-4763-a903-2ff014e1b4ff"


def test_samagri_list_is_served_for_a_seva():
    r = TestClient(main.app).get(f"/api/sevas/{NIJA}/samagri")
    assert r.status_code == 200
    body = r.json()
    assert body["seva_id"] == NIJA
    assert body["items"][0] == {"en": "Turmeric", "te": "పసుపు", "qty": "50g"}
    panch = next(i for i in body["items"] if i["en"].startswith("Panchamrutham"))
    assert [c["en"] for c in panch["children"]][:2] == ["Milk (cow's milk only)", "Curd"]


def test_notes_are_kept():
    items = TestClient(main.app).get(f"/api/sevas/{VIVAHAM}/samagri").json()["items"]
    assert any(i.get("note") == "Mandatory" for i in items)


def test_no_list_is_404():
    assert TestClient(main.app).get("/api/sevas/no-such-seva/samagri").status_code == 404


def test_every_list_has_both_languages_and_one_level_of_children():
    for seva_id, items in main.SEVA_SAMAGRI.items():
        for item in items:
            assert item["en"] and item["te"], seva_id
            for child in item.get("children", []):
                assert child["en"] and child["te"] and "children" not in child, seva_id
