"""
Shared set-up for the tests. Run them from backend/ with:  uv run pytest

Every test gets its own empty database (a temporary file), so the real data/pip.db is never touched,
and "today" is always Wednesday 25 November 2026 (the week starts on Monday the 23rd), so the numbers
about days and weeks don't depend on when the tests run.
"""

from datetime import date

import pytest

import database
from services import accounts, progress

TODAY = date(2026, 11, 25)          # a Wednesday
MONDAY = "2026-11-23"
PASSWORD = "a-good-password-1"


@pytest.fixture(autouse=True)
def fresh_db(tmp_path, monkeypatch):
    monkeypatch.setattr(database, "DB_PATH", tmp_path / "pip.db")
    database.init_db()


@pytest.fixture(autouse=True)
def fixed_today(monkeypatch):
    monkeypatch.setattr(progress, "_today", lambda: TODAY)


@pytest.fixture
def client():
    """Calls the API like the browser does, without starting a server (the database is the test's own)."""
    from fastapi.testclient import TestClient

    import main
    return TestClient(main.app)


def make_therapist(email="emma@littlesteps.it", name="Dr. Emma"):
    """Registers a therapist. Returns what the register endpoint returns: {"token", "role", "therapist"}."""
    return accounts.register_therapist(name, "", email, PASSWORD, practice="Little Steps")


def make_child(therapist_id, name="Dan"):
    return accounts.create_child(therapist_id, name, "8")


def add_run(child_id, started_at, finished_at, *, total=3, first_try=0, solved=0, attempts=0, xp=0, story="the_secret_message"):
    """A finished story run with the given times (UTC, like the database saves them)."""
    with database.db() as con:
        return con.execute(
            "INSERT INTO story_runs (child_id, story_id, language, started_at, finished_at, scenes_total,"
            " scenes_first_try, scenes_solved, total_attempts, xp_earned) VALUES (?, ?, 'en', ?, ?, ?, ?, ?, ?, ?)",
            (child_id, story, started_at, finished_at, total, first_try, solved, attempts, xp),
        ).lastrowid


def add_attempt(child_id, created_at, *, scene="ready_to_order", correct=True, attempt=1, outcome=None, run_id=None,
                story="the_secret_message", choice="A"):
    """One click on a picture, at the given time (UTC)."""
    outcome = outcome or ("correct" if correct else "hint")
    with database.db() as con:
        con.execute(
            "INSERT INTO attempts (child_id, run_id, story_id, scene_id, language, choice, is_correct, attempt_number,"
            " outcome, pip_said, created_at) VALUES (?, ?, ?, ?, 'en', ?, ?, ?, ?, '', ?)",
            (child_id, run_id, story, scene, choice, int(correct), attempt, outcome, created_at),
        )
