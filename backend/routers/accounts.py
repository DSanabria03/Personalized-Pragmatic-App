"""
Accounts API (try it at http://localhost:8000/docs).

    POST /api/therapists/register   create a therapist account          -> token
    POST /api/therapists/login      email + password                    -> token
    POST /api/children/login        child's code (e.g. PIP742)          -> token
    GET  /api/me                    who is logged in (+ the child's progress)
    POST /api/logout

Therapist only (send "Authorization: Bearer <token>"):
    GET  /api/children              all my children with their statistics (dashboard)
    POST /api/children              add a child -> creates their login code
    GET  /api/children/{id}         one child's statistics in detail
    POST /api/children/{id}/reset-code   new code (the old one stops working)

Child only:
    GET  /api/progress              XP, level, badges, this week (for the child's home and the "Great job" screen)
"""

from typing import Annotated

from fastapi import APIRouter, Header, HTTPException, Path
from pydantic import BaseModel

from services import accounts, progress
from services.accounts import AccountError

router = APIRouter(prefix="/api", tags=["accounts"])
ChildId = Annotated[int, Path(ge=0, lt=2**63)]   # SQLite can't take bigger numbers


class TherapistRegister(BaseModel):
    full_name: str
    display_name: str = ""
    role: str = ""
    practice: str = ""
    registration_number: str = ""
    email: str
    password: str


class TherapistLogin(BaseModel):
    email: str
    password: str


class ChildLogin(BaseModel):
    code: str


class NewChild(BaseModel):
    name: str
    age: str = ""
    parent_email: str = ""


def _fail(error: AccountError):
    raise HTTPException(error.status, error.message)


def current_user(authorization: str | None):
    user = accounts.user_from_token(authorization)
    if not user:
        raise HTTPException(401, "Please log in again.")
    return user


def current_therapist(authorization: str | None):
    user = current_user(authorization)
    if user["role"] != "therapist":
        raise HTTPException(403, "Only for therapists.")
    return user["therapist"]


def current_child(authorization: str | None):
    user = current_user(authorization)
    if user["role"] != "child":
        raise HTTPException(403, "Only for children.")
    return user["child"]


@router.post("/therapists/register")
def register(body: TherapistRegister):
    try:
        return accounts.register_therapist(body.full_name, body.display_name, body.email, body.password,
                                           body.role, body.practice, body.registration_number)
    except AccountError as error:
        _fail(error)


@router.post("/therapists/login")
def therapist_login(body: TherapistLogin):
    try:
        return accounts.login_therapist(body.email, body.password)
    except AccountError as error:
        _fail(error)


@router.post("/children/login")
def child_login(body: ChildLogin):
    try:
        return accounts.login_child(body.code)
    except AccountError as error:
        _fail(error)


@router.get("/me")
def me(language: str = "en", authorization: str | None = Header(default=None)):
    user = current_user(authorization)
    user = {k: v for k, v in user.items() if k != "token"}
    if user["role"] == "child":
        user["therapist"] = accounts.child_therapist(user["child"]["id"])
        user["progress"] = progress.child_progress(user["child"]["id"], language)
    return user


@router.post("/logout")
def logout(authorization: str | None = Header(default=None)):
    user = accounts.user_from_token(authorization)
    if user:
        accounts.logout(user["token"])
    return {"ok": True}


@router.get("/children")
def list_children(authorization: str | None = Header(default=None)):
    therapist = current_therapist(authorization)
    return {"therapist": therapist, **progress.therapist_overview(therapist["id"])}


@router.post("/children")
def add_child(body: NewChild, authorization: str | None = Header(default=None)):
    therapist = current_therapist(authorization)
    try:
        return accounts.create_child(therapist["id"], body.name, body.age, body.parent_email)
    except AccountError as error:
        _fail(error)


@router.get("/children/{child_id}")
def child_statistics(child_id: ChildId, authorization: str | None = Header(default=None)):
    therapist = current_therapist(authorization)
    detail = progress.child_detail(therapist["id"], child_id)
    if not detail:
        raise HTTPException(404, "Child not found.")
    return detail


@router.post("/children/{child_id}/reset-code")
def reset_code(child_id: ChildId, authorization: str | None = Header(default=None)):
    therapist = current_therapist(authorization)
    try:
        return accounts.reset_child_code(therapist["id"], child_id)
    except AccountError as error:
        _fail(error)


@router.get("/progress")
def my_progress(language: str = "en", authorization: str | None = Header(default=None)):
    child = current_child(authorization)
    return progress.child_progress(child["id"], language)
