"""
Accounts: therapists log in with email + password, children log in with a code (like PIP742)
that their therapist creates for them. No child email or password needed.

The data is saved in SQLite (database.py).

Passwords are never stored: only a secure "hash" (PBKDF2 with a random salt, from Python's standard library).
After logging in, the browser gets a random token and sends it with every request
("Authorization: Bearer <token>"), so the backend knows who is playing.
"""

import hashlib
import hmac
import re
import secrets

from database import db

PBKDF2_ROUNDS = 200_000


class AccountError(Exception):
    """A problem the user should see, e.g. 'This email is already registered'."""

    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.message = message
        self.status = status


# ---------------------------------------------------------------- passwords and tokens
def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), bytes.fromhex(salt), PBKDF2_ROUNDS).hex()
    return f"pbkdf2_sha256${PBKDF2_ROUNDS}${salt}${digest}"


def check_password(password: str, stored: str) -> bool:
    try:
        _, rounds, salt, digest = stored.split("$")
        test = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), bytes.fromhex(salt), int(rounds)).hex()
        return hmac.compare_digest(test, digest)
    except (ValueError, TypeError):
        return False


def _new_token(con, role: str, user_id: int) -> str:
    token = secrets.token_urlsafe(32)
    con.execute("INSERT INTO tokens (token, role, user_id) VALUES (?, ?, ?)", (token, role, user_id))
    return token


def _therapist_public(row) -> dict:
    return {"id": row["id"], "full_name": row["full_name"], "display_name": row["display_name"],
            "role": row["role"], "practice": row["practice"], "email": row["email"]}


def _child_public(row) -> dict:
    return {"id": row["id"], "name": row["name"], "age": row["age"], "code": row["code"],
            "nickname": row["nickname"] or "", "pip": row["pip"] or "",
            "support_level": row["support_level"] or "Guided", "weekly_goal": row["weekly_goal"] or 3,
            "therapist_id": row["therapist_id"], "created_at": row["created_at"]}


# ---------------------------------------------------------------- therapists
def register_therapist(full_name, display_name, email, password, role="", practice="", registration_number=""):
    email = (email or "").strip().lower()
    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
        raise AccountError("Please enter a valid email address.")
    if len(password or "") < 12 or not re.search(r"\d", password):
        raise AccountError("The password needs at least 12 characters, including a number.")
    if not (full_name or "").strip():
        raise AccountError("Please enter your name.")
    password_hash = hash_password(password)     # slow on purpose: do it before locking the database
    with db() as con:
        con.execute("BEGIN IMMEDIATE")          # nobody else can write between the check and the insert
        if con.execute("SELECT 1 FROM therapists WHERE email = ?", (email,)).fetchone():
            raise AccountError("This email is already registered. Please log in.", 409)
        new_id = con.execute(
            "INSERT INTO therapists (full_name, display_name, role, practice, registration_number, email, password_hash)"
            " VALUES (?, ?, ?, ?, ?, ?, ?)",
            (full_name.strip(), (display_name or full_name).strip(), (role or "").strip(), (practice or "").strip(),
             (registration_number or "").strip(), email, password_hash),
        ).lastrowid
        row = con.execute("SELECT * FROM therapists WHERE id = ?", (new_id,)).fetchone()
        return {"token": _new_token(con, "therapist", row["id"]), "role": "therapist", "therapist": _therapist_public(row)}


def login_therapist(email: str, password: str):
    with db() as con:
        row = con.execute("SELECT * FROM therapists WHERE email = ?", ((email or "").strip().lower(),)).fetchone()
        if not row or not check_password(password or "", row["password_hash"]):
            raise AccountError("Email or password is not correct.", 401)
        return {"token": _new_token(con, "therapist", row["id"]), "role": "therapist", "therapist": _therapist_public(row)}


# ---------------------------------------------------------------- children
CODE_PREFIX = "PIP"


def _normalize_code(code: str) -> str:
    """'pip-001 ' -> 'PIP001'"""
    return re.sub(r"[\s-]", "", code or "").upper()


def _new_child_code(con) -> str:
    """A free code, always PIP + 3 digits (like PIP742): 6 characters, the 6 boxes of the child login.
    That makes 1000 codes for the whole app; when they are all taken, no new code can be made."""
    taken = {row["code"] for row in con.execute("SELECT code FROM children")}
    free = [code for code in (f"{CODE_PREFIX}{n:03d}" for n in range(1000)) if code not in taken]
    if not free:
        raise AccountError("All 1000 login codes are in use, so a new one can't be created.", 409)
    return secrets.choice(free)


def create_child(therapist_id: int, name: str, age: str = "", parent_email: str = ""):
    if not (name or "").strip():
        raise AccountError("Please enter the child's first name or nickname.")
    with db() as con:
        con.execute("BEGIN IMMEDIATE")          # so two children can't get the same code
        new_id = con.execute(
            "INSERT INTO children (therapist_id, name, age, parent_email, code) VALUES (?, ?, ?, ?, ?)",
            (therapist_id, name.strip()[:40], str(age or "").strip()[:20], (parent_email or "").strip(),
             _new_child_code(con)),
        ).lastrowid
        return _child_public(con.execute("SELECT * FROM children WHERE id = ?", (new_id,)).fetchone())


def reset_child_code(therapist_id: int, child_id: int):
    with db() as con:
        con.execute("BEGIN IMMEDIATE")
        child = dict(_own_child(con, therapist_id, child_id))
        child["code"] = _new_child_code(con)
        con.execute("UPDATE children SET code = ? WHERE id = ?", (child["code"], child_id))
        con.execute("DELETE FROM tokens WHERE role = 'child' AND user_id = ?", (child_id,))  # old logins stop working
        return _child_public(child)


def login_child(code: str):
    with db() as con:
        con.execute("BEGIN IMMEDIATE")          # so an old code can't log in while it is being reset
        row = con.execute("SELECT * FROM children WHERE code = ?", (_normalize_code(code),)).fetchone()
        if not row:
            raise AccountError("We couldn't find this code. Ask your therapist or your grown-up for help.", 401)
        return {"token": _new_token(con, "child", row["id"]), "role": "child", "child": _child_public(row)}


# The Pips a child can choose. Same ids as frontend/src/data/pips.js (the pictures live in the frontend).
PIP_IDS = ("milo", "bob", "henry", "thomas")


def update_child_profile(child_id: int, nickname: str, pip: str = ""):
    """What the child chose in "Choose your Pip". pip = '' means none chosen (the app then shows Pip's face)."""
    nickname = (nickname or "").strip()[:40]
    if not nickname:
        raise AccountError("Please tell Pip what to call you.")
    pip = (pip or "").strip().lower()
    if pip and pip not in PIP_IDS:
        raise AccountError("This Pip doesn't exist.")
    with db() as con:
        con.execute("UPDATE children SET nickname = ?, pip = ? WHERE id = ?", (nickname, pip, child_id))
        return _child_public(con.execute("SELECT * FROM children WHERE id = ?", (child_id,)).fetchone())


# What the therapist sets for each child in "Edit profile" (the child's page of the dashboard).
SUPPORT_LEVELS = ("Guided", "Supported", "Independent")


def update_child_plan(therapist_id: int, child_id: int, support_level: str | None = None,
                      weekly_goal: int | None = None):
    """Support level and/or weekly goal (practice days a week) of one of the therapist's children.
    None keeps the current value."""
    if support_level is not None and support_level not in SUPPORT_LEVELS:
        raise AccountError(f"The support level must be one of: {', '.join(SUPPORT_LEVELS)}.")
    if weekly_goal is not None and (not isinstance(weekly_goal, int) or not 1 <= weekly_goal <= 7):
        raise AccountError("The weekly goal must be between 1 and 7 days.")
    with db() as con:
        child = _own_child(con, therapist_id, child_id)
        support_level = support_level if support_level is not None else child["support_level"]
        weekly_goal = weekly_goal if weekly_goal is not None else child["weekly_goal"]
        con.execute("UPDATE children SET support_level = ?, weekly_goal = ? WHERE id = ?",
                    (support_level, weekly_goal, child_id))
        return _child_public(con.execute("SELECT * FROM children WHERE id = ?", (child_id,)).fetchone())


def child_therapist(child_id: int) -> dict:
    """What a child may see about their therapist: only the name and the practice."""
    with db() as con:
        row = con.execute(
            "SELECT t.display_name, t.practice FROM therapists t JOIN children c ON c.therapist_id = t.id WHERE c.id = ?",
            (child_id,),
        ).fetchone()
        return dict(row)


def _own_child(con, therapist_id: int, child_id: int):
    row = con.execute("SELECT * FROM children WHERE id = ? AND therapist_id = ?", (child_id, therapist_id)).fetchone()
    if not row:
        raise AccountError("Child not found.", 404)
    return row


# ---------------------------------------------------------------- who is logged in?
def user_from_token(authorization: str | None):
    """Reads 'Bearer <token>'. Returns {"role": ..., "therapist"/"child": {...}} or None if not logged in."""
    if not authorization or not authorization.lower().startswith("bearer "):
        return None
    token = authorization.split(" ", 1)[1].strip()
    with db() as con:
        t = con.execute("SELECT role, user_id FROM tokens WHERE token = ?", (token,)).fetchone()
        if not t:
            return None
        if t["role"] == "therapist":
            row = con.execute("SELECT * FROM therapists WHERE id = ?", (t["user_id"],)).fetchone()
            return {"role": "therapist", "token": token, "therapist": _therapist_public(row)} if row else None
        row = con.execute("SELECT * FROM children WHERE id = ?", (t["user_id"],)).fetchone()
        return {"role": "child", "token": token, "child": _child_public(row)} if row else None


def logout(token: str):
    with db() as con:
        con.execute("DELETE FROM tokens WHERE token = ?", (token,))
