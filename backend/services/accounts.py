"""
Accounts: therapists log in with email + password, children log in with a code (like PIP742)
that their therapist creates for them. No child email or password needed.

The data is fake and lives in memory (mock_data.py): no database for now.

Passwords are never stored: only a secure "hash" (PBKDF2 with a random salt, from Python's standard library).
After logging in, the browser gets a random token and sends it with every request
("Authorization: Bearer <token>"), so the backend knows who is playing.
"""

import hashlib
import hmac
import re
import secrets

import mock_data as store
from mock_data import CHILDREN, LOCK, THERAPISTS, TOKENS

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


def _new_token(role: str, user_id: int) -> str:
    token = secrets.token_urlsafe(32)
    TOKENS[token] = {"role": role, "user_id": user_id, "created_at": store.now()}
    return token


def _therapist_public(row) -> dict:
    return {"id": row["id"], "full_name": row["full_name"], "display_name": row["display_name"],
            "role": row["role"], "practice": row["practice"], "email": row["email"]}


def _child_public(row) -> dict:
    return {"id": row["id"], "name": row["name"], "age": row["age"], "code": row["code"],
            "therapist_id": row["therapist_id"], "created_at": row["created_at"]}


def _find(table: list[dict], **fields) -> dict | None:
    """The first row whose fields all match, e.g. _find(CHILDREN, code="PIP001")."""
    return next((row for row in table if all(row.get(k) == v for k, v in fields.items())), None)


# ---------------------------------------------------------------- therapists
def register_therapist(full_name, display_name, email, password, role="", practice="", registration_number=""):
    email = (email or "").strip().lower()
    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
        raise AccountError("Please enter a valid email address.")
    if len(password or "") < 12 or not re.search(r"\d", password):
        raise AccountError("The password needs at least 12 characters, including a number.")
    if not (full_name or "").strip():
        raise AccountError("Please enter your name.")
    with LOCK:
        if _find(THERAPISTS, email=email):
            raise AccountError("This email is already registered. Please log in.", 409)
        row = {
            "id": store.new_therapist_id(),
            "full_name": full_name.strip(),
            "display_name": (display_name or full_name).strip(),
            "role": (role or "").strip(),
            "practice": (practice or "").strip(),
            "registration_number": (registration_number or "").strip(),
            "email": email,
            "password_hash": hash_password(password),
            "created_at": store.now(),
        }
        THERAPISTS.append(row)
        return {"token": _new_token("therapist", row["id"]), "role": "therapist", "therapist": _therapist_public(row)}


def login_therapist(email: str, password: str):
    row = _find(THERAPISTS, email=(email or "").strip().lower())
    if not row or not check_password(password or "", row["password_hash"]):
        raise AccountError("Email or password is not correct.", 401)
    return {"token": _new_token("therapist", row["id"]), "role": "therapist", "therapist": _therapist_public(row)}


# ---------------------------------------------------------------- children
CODE_PREFIX = "PIP"


def _normalize_code(code: str) -> str:
    """'pip-001 ' -> 'PIP001'"""
    return re.sub(r"[\s-]", "", code or "").upper()


def _new_child_code() -> str:
    """PIP + 3 digits (like PIP742). If those run out, 4 digits."""
    used = {child["code"] for child in CHILDREN}
    for digits in (3, 3, 3, 3, 3, 4, 4, 4, 4, 5):
        code = CODE_PREFIX + "".join(secrets.choice("0123456789") for _ in range(digits))
        if code not in used:
            return code
    raise AccountError("Could not create a new code, please try again.", 500)


def create_child(therapist_id: int, name: str, age: str = "", parent_email: str = ""):
    if not (name or "").strip():
        raise AccountError("Please enter the child's first name or nickname.")
    with LOCK:
        row = {
            "id": store.new_child_id(),
            "therapist_id": therapist_id,
            "name": name.strip()[:40],
            "age": str(age or "").strip()[:20],
            "parent_email": (parent_email or "").strip(),
            "code": _new_child_code(),
            "created_at": store.now(),
        }
        CHILDREN.append(row)
        return _child_public(row)


def reset_child_code(therapist_id: int, child_id: int):
    with LOCK:
        child = _own_child(therapist_id, child_id)
        child["code"] = _new_child_code()
        for token, t in list(TOKENS.items()):          # old logins stop working
            if t["role"] == "child" and t["user_id"] == child["id"]:
                del TOKENS[token]
        return _child_public(child)


def login_child(code: str):
    row = _find(CHILDREN, code=_normalize_code(code))
    if not row:
        raise AccountError("We couldn't find this code. Ask your therapist or your grown-up for help.", 401)
    return {"token": _new_token("child", row["id"]), "role": "child", "child": _child_public(row)}


def _own_child(therapist_id: int, child_id: int):
    row = _find(CHILDREN, id=child_id, therapist_id=therapist_id)
    if not row:
        raise AccountError("Child not found.", 404)
    return row


# ---------------------------------------------------------------- who is logged in?
def user_from_token(authorization: str | None):
    """Reads 'Bearer <token>'. Returns {"role": ..., "therapist"/"child": {...}} or None if not logged in."""
    if not authorization or not authorization.lower().startswith("bearer "):
        return None
    token = authorization.split(" ", 1)[1].strip()
    t = TOKENS.get(token)
    if not t:
        return None
    if t["role"] == "therapist":
        row = _find(THERAPISTS, id=t["user_id"])
        return {"role": "therapist", "token": token, "therapist": _therapist_public(row)} if row else None
    row = _find(CHILDREN, id=t["user_id"])
    return {"role": "child", "token": token, "child": _child_public(row)} if row else None


def logout(token: str):
    TOKENS.pop(token, None)
