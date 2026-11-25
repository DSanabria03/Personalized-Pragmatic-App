"""
Accounts API (try it at http://localhost:8000/docs: log in, then "Authorize" with the token).

Logging in and out:
    POST  /api/auth/register         create a therapist account                      -> 201, token
    POST  /api/auth/login            therapist: email + password                     -> token
    POST  /api/auth/child-login      child: their code (e.g. PIP742)                 -> token
    POST  /api/auth/logout           ends this login

Whoever is logged in (send "Authorization: Bearer <token>"):
    GET   /api/me                    who is logged in (a child also gets their therapist's name and practice)

Child only:
    GET   /api/me/progress           XP, level, badges, this week (child's home and "Great job" screen)
    PUT   /api/me/profile            nickname + chosen Pip ("Choose your Pip")

Therapist only:
    GET   /api/children              all my children with their statistics (dashboard)
    POST  /api/children              add a child -> 201, with their login code
    GET   /api/children/{id}         one child's statistics in detail
    PATCH /api/children/{id}         support level and/or weekly goal ("Edit profile")
    POST  /api/children/{id}/reset-code   new code (the old one stops working)

Problems the user should see (AccountError in services/accounts.py) are turned into HTTP errors in main.py.
"""

from typing import Annotated

from fastapi import APIRouter, HTTPException, Path
from pydantic import BaseModel

from dependencies import CurrentChild, CurrentTherapist, CurrentUser, OptionalUser
from services import accounts, progress

router = APIRouter(prefix="/api")
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


class ChildProfile(BaseModel):
    nickname: str
    pip: str = ""


class ChildChanges(BaseModel):
    """What the therapist can change about a child. Leave a field out to keep it as it is."""
    support_level: str | None = None
    weekly_goal: int | None = None


class NewChild(BaseModel):
    name: str
    age: str = ""
    parent_email: str = ""


# ---------------------------------------------------------------- logging in and out
@router.post("/auth/register", status_code=201, tags=["auth"])
def register(body: TherapistRegister):
    return accounts.register_therapist(body.full_name, body.display_name, body.email, body.password,
                                       body.role, body.practice, body.registration_number)


@router.post("/auth/login", tags=["auth"])
def therapist_login(body: TherapistLogin):
    return accounts.login_therapist(body.email, body.password)


@router.post("/auth/child-login", tags=["auth"])
def child_login(body: ChildLogin):
    return accounts.login_child(body.code)


@router.post("/auth/logout", tags=["auth"])
def logout(user: OptionalUser):
    if user:
        accounts.logout(user["token"])
    return {"ok": True}


# ---------------------------------------------------------------- whoever is logged in
@router.get("/me", tags=["me"])
def me(user: CurrentUser):
    result = {k: v for k, v in user.items() if k != "token"}
    if result["role"] == "child":
        result["therapist"] = accounts.child_therapist(result["child"]["id"])
    return result


@router.get("/me/progress", tags=["me"])
def my_progress(child: CurrentChild, language: str = "en"):
    return progress.child_progress(child["id"], language)


@router.put("/me/profile", tags=["me"])
def update_profile(body: ChildProfile, child: CurrentChild):
    return accounts.update_child_profile(child["id"], body.nickname, body.pip)


# ---------------------------------------------------------------- the therapist's children
@router.get("/children", tags=["children"])
def list_children(therapist: CurrentTherapist):
    return {"therapist": therapist, **progress.therapist_overview(therapist["id"])}


@router.post("/children", status_code=201, tags=["children"])
def add_child(body: NewChild, therapist: CurrentTherapist):
    return accounts.create_child(therapist["id"], body.name, body.age, body.parent_email)


@router.get("/children/{child_id}", tags=["children"])
def child_statistics(child_id: ChildId, therapist: CurrentTherapist):
    detail = progress.child_detail(therapist["id"], child_id)
    if not detail:
        raise HTTPException(404, "Child not found.")
    return detail


@router.patch("/children/{child_id}", tags=["children"])
def update_child(child_id: ChildId, body: ChildChanges, therapist: CurrentTherapist):
    return accounts.update_child_plan(therapist["id"], child_id, body.support_level, body.weekly_goal)


@router.post("/children/{child_id}/reset-code", tags=["children"])
def reset_code(child_id: ChildId, therapist: CurrentTherapist):
    return accounts.reset_child_code(therapist["id"], child_id)
