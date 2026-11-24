"""
The app's database: therapists, children (with login codes), and what each child did in the stories.

It uses SQLite, which is built into Python: nothing to install, the data is one file
(backend/data/pip.db, created automatically, not uploaded to GitHub because it contains children's data).
To move to MySQL later, only this file (and the SQL in services/accounts.py + services/progress.py) changes.

Tables
    therapists   one row per therapist account (password stored as a secure hash, never in plain text)
    children     one row per child, linked to a therapist, with a login code like PIP742,
                 and what the child chose in "Choose your Pip" (nickname and Pip, empty until then)
    tokens       who is logged in (a random key per login, sent by the browser with every request)
    story_runs   one row per time a child plays a story (start, end, results, XP)
    attempts     one row per picture the child clicks (which scene, which option, right or not, what Pip said)
"""

import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent / "data"
DB_PATH = Path(os.getenv("PIP_DB_PATH", DATA_DIR / "pip.db"))

SCHEMA = """
CREATE TABLE IF NOT EXISTS therapists (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name     TEXT NOT NULL,
    display_name  TEXT NOT NULL,
    role          TEXT DEFAULT '',
    practice      TEXT DEFAULT '',
    registration_number TEXT DEFAULT '',
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS children (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    therapist_id  INTEGER NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
    name          TEXT NOT NULL,
    age           TEXT DEFAULT '',
    parent_email  TEXT DEFAULT '',
    code          TEXT NOT NULL UNIQUE,
    nickname      TEXT DEFAULT '',          -- what Pip calls the child ('' = their name)
    pip           TEXT DEFAULT '',          -- the chosen Pip: milo, bob, henry or thomas ('' = none yet)
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS tokens (
    token         TEXT PRIMARY KEY,
    role          TEXT NOT NULL,            -- 'therapist' or 'child'
    user_id       INTEGER NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS story_runs (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    child_id      INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    story_id      TEXT NOT NULL,
    language      TEXT NOT NULL,
    started_at    TEXT NOT NULL DEFAULT (datetime('now')),
    finished_at   TEXT,
    scenes_total  INTEGER DEFAULT 0,
    scenes_first_try INTEGER DEFAULT 0,
    scenes_solved INTEGER DEFAULT 0,
    total_attempts INTEGER DEFAULT 0,
    xp_earned     INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS attempts (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    child_id      INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    run_id        INTEGER REFERENCES story_runs(id) ON DELETE CASCADE,
    story_id      TEXT NOT NULL,
    scene_id      TEXT NOT NULL,
    language      TEXT NOT NULL,
    choice        TEXT NOT NULL,
    is_correct    INTEGER NOT NULL,
    attempt_number INTEGER NOT NULL,
    outcome       TEXT NOT NULL,
    pip_said      TEXT DEFAULT '',
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_attempts_child ON attempts(child_id);
CREATE INDEX IF NOT EXISTS idx_runs_child ON story_runs(child_id);
"""


def connect() -> sqlite3.Connection:
    """A new connection for each request (safe with FastAPI). Rows behave like dicts: row["name"]."""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(DB_PATH, timeout=10)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA foreign_keys = ON")
    return con


@contextmanager
def db():
    """Use as:  with db() as con: con.execute(...)   - saves (commit) and closes automatically."""
    con = connect()
    try:
        yield con
        con.commit()
    finally:
        con.close()


# Columns added after the first version: a database created before them gets them here (its data is kept).
NEW_COLUMNS = {
    "children": {"nickname": "TEXT DEFAULT ''", "pip": "TEXT DEFAULT ''"},
}


def init_db() -> None:
    """Creates the tables if they don't exist yet, and adds any missing column. Called once when the backend starts."""
    with db() as con:
        con.executescript(SCHEMA)
        for table, columns in NEW_COLUMNS.items():
            existing = {row["name"] for row in con.execute(f"PRAGMA table_info({table})")}
            for name, definition in columns.items():
                if name not in existing:
                    con.execute(f"ALTER TABLE {table} ADD COLUMN {name} {definition}")
