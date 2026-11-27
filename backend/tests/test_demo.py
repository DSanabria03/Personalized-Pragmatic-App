"""The demo accounts created the first time the backend starts (services/demo.py)."""

from conftest import make_therapist
from fastapi.testclient import TestClient

import database
from services import accounts
from services.demo import DEMO_CHILD, DEMO_THERAPIST, seed_demo_data


def count(table):
    with database.db() as con:
        return con.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]


def test_an_empty_database_gets_the_demo_accounts():
    assert seed_demo_data() is True

    therapist = accounts.login_therapist(DEMO_THERAPIST["email"], DEMO_THERAPIST["password"])["therapist"]
    child = accounts.login_child(DEMO_CHILD["code"])["child"]
    assert (therapist["display_name"], therapist["practice"]) == ("Dr. Emma", "Little Steps Therapy")
    assert (child["name"], child["age"], child["therapist_id"]) == ("Dan", "8", therapist["id"])
    assert (child["nickname"], child["pip"]) == ("", "")         # "Choose your Pip" still to do


def test_the_demo_password_follows_the_password_rules():
    password = DEMO_THERAPIST["password"]
    assert len(password) >= 12 and any(ch.isdigit() for ch in password)


def test_demo_accounts_are_created_only_once():
    assert seed_demo_data() is True
    assert seed_demo_data() is False
    assert (count("therapists"), count("children")) == (1, 1)


def test_a_database_with_data_is_not_touched():
    make_therapist()
    assert seed_demo_data() is False
    assert (count("therapists"), count("children")) == (1, 0)


def test_demo_accounts_can_be_switched_off(monkeypatch):
    monkeypatch.setenv("PIP_DEMO_DATA", "false")
    assert seed_demo_data() is False
    assert count("therapists") == 0


def test_the_server_creates_them_when_it_starts(tmp_path, monkeypatch):
    monkeypatch.setattr(database, "DB_PATH", tmp_path / "new.db")      # not even the tables exist yet
    import main
    with TestClient(main.app) as client:                               # "with" runs the start-up
        response = client.post("/api/auth/child-login", json={"code": DEMO_CHILD["code"]})
    assert response.status_code == 200
