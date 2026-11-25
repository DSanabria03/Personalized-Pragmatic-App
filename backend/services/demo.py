"""
Demo accounts: a therapist and one of their children, created the first time the backend starts
(when the database has no therapist yet), so the app can be tried right away on any laptop.

    Therapist   emma@example.com  /  littlesteps2026
    Child       code PIP001  (Dan, 8 years; Dr. Emma's child)

The child hasn't chosen a nickname or a Pip yet, so "Choose your Pip" can be shown too.
A database that already has a therapist is never touched. Set PIP_DEMO_DATA=false (in backend/.env)
to start with an empty database instead. These passwords are public: never use them with real data.
"""

import os

from database import db
from services.accounts import hash_password

DEMO_THERAPIST = {
    "full_name": "Dr. Emma",
    "display_name": "Dr. Emma",
    "role": "Speech and language therapist",
    "practice": "Little Steps Therapy",
    "email": "emma@example.com",
    "password": "littlesteps2026",
}
DEMO_CHILD = {"name": "Dan", "age": "8", "code": "PIP001"}


def _enabled() -> bool:
    return os.getenv("PIP_DEMO_DATA", "true").strip().lower() not in ("false", "0", "no", "off")


def seed_demo_data() -> bool:
    """Creates the demo accounts if the database has no therapist yet. Returns True if it created them."""
    if not _enabled():
        return False
    with db() as con:
        if con.execute("SELECT 1 FROM therapists LIMIT 1").fetchone():
            return False
    password_hash = hash_password(DEMO_THERAPIST["password"])     # slow on purpose: before locking the database
    t, c = DEMO_THERAPIST, DEMO_CHILD
    with db() as con:
        con.execute("BEGIN IMMEDIATE")
        if con.execute("SELECT 1 FROM therapists LIMIT 1").fetchone():      # someone was faster
            return False
        therapist_id = con.execute(
            "INSERT INTO therapists (full_name, display_name, role, practice, email, password_hash)"
            " VALUES (?, ?, ?, ?, ?, ?)",
            (t["full_name"], t["display_name"], t["role"], t["practice"], t["email"], password_hash),
        ).lastrowid
        con.execute("INSERT INTO children (therapist_id, name, age, code) VALUES (?, ?, ?, ?)",
                    (therapist_id, c["name"], c["age"], c["code"]))
    print(f"[demo] Demo accounts created. Therapist: {t['email']} / {t['password']}  -  child code: {c['code']}")
    return True
