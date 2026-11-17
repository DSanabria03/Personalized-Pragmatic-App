import hashlib
import hmac
import secrets
from copy import deepcopy
from typing import Literal

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import AliasChoices, BaseModel, EmailStr, Field, field_validator

from routers.story import router as story_router

app = FastAPI(title="Personalized Pragmatic App")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(story_router)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TherapistRegisterRequest(BaseModel):
    full_name: str = Field(validation_alias=AliasChoices("fullName", "full_name"), min_length=1)
    professional_role: str = Field(
        validation_alias=AliasChoices("professionalRole", "professional_role"), min_length=1
    )
    practice: str = Field(min_length=1)
    registration_number: str | None = Field(
        default=None,
        validation_alias=AliasChoices("registrationNumber", "registration_number"),
    )
    display_name: str = Field(
        validation_alias=AliasChoices("displayName", "display_name"), min_length=1
    )
    email: EmailStr
    password: str = Field(min_length=12)
    accepted_terms: bool = Field(
        validation_alias=AliasChoices("acceptedTerms", "accepted_terms")
    )

    @field_validator(
        "full_name", "professional_role", "practice", "display_name", mode="before"
    )
    @classmethod
    def strip_required_text(cls, value):
        return value.strip() if isinstance(value, str) else value


class AddChildRequest(BaseModel):
    name: str = Field(min_length=1)
    age: int = Field(ge=6, le=10)
    parent_email: EmailStr | None = Field(
        default=None,
        validation_alias=AliasChoices("parentEmail", "parent_email"),
    )
    accepted_permission: bool = Field(
        validation_alias=AliasChoices("acceptedPermission", "accepted_permission")
    )

    @field_validator("name", mode="before")
    @classmethod
    def strip_name(cls, value):
        return value.strip() if isinstance(value, str) else value

    @field_validator("parent_email", mode="before")
    @classmethod
    def empty_parent_email_is_optional(cls, value):
        if isinstance(value, str) and not value.strip():
            return None
        return value


class UpdateChildRequest(BaseModel):
    focus: Literal["Hidden requests", "Beyond words", "Feelings", "Metaphors"]
    support: Literal["Guided", "Supported", "Independent"]
    weekly_goal: Literal[3, 4, 5, 6, 7] = Field(
        validation_alias=AliasChoices("weeklyGoal", "weekly_goal")
    )


class ChildLoginRequest(BaseModel):
    code: str = Field(validation_alias=AliasChoices("code", "login_code", "access_code"))


class ScreenTransitionRequest(BaseModel):
    current_screen: str
    action: str


MOCK_CHILDREN = [
    {
        "id": "dan",
        "name": "Dan",
        "age": 8,
        "code": "PIP-001",
        "pip": "milo",
        "avatar": "/resources/pip-milo.png",
        "color": "#e3ecd9",
        "focus": "Hidden requests",
        "support": "Guided",
        "weeklyGoal": 5,
        "practiceDays": 3,
        "activities": 6,
        "practiceMinutes": 42,
        "lastActive": "1 Nov",
        "daysAgo": 0,
        "isNew": False,
        "progress": [
            {"label": "Hidden requests", "done": 3, "total": 4},
            {"label": "Beyond words", "done": 2, "total": 3},
            {"label": "Feelings", "done": 1, "total": 2},
        ],
    },
    {
        "id": "amelia",
        "name": "Amelia",
        "age": 7,
        "code": "PIP-002",
        "avatar": None,
        "color": "#f6e3e3",
        "focus": "Feelings",
        "support": "Guided",
        "weeklyGoal": 5,
        "practiceDays": 4,
        "activities": 8,
        "practiceMinutes": 55,
        "lastActive": "1 Nov",
        "daysAgo": 0,
        "isNew": False,
        "progress": [
            {"label": "Feelings", "done": 4, "total": 5},
            {"label": "Hidden requests", "done": 2, "total": 4},
            {"label": "Beyond words", "done": 1, "total": 3},
        ],
    },
    {
        "id": "leo",
        "name": "Leo",
        "age": 6,
        "code": "PIP-003",
        "avatar": None,
        "color": "#e6f0dc",
        "focus": "Beyond words",
        "support": "Supported",
        "weeklyGoal": 3,
        "practiceDays": 2,
        "activities": 5,
        "practiceMinutes": 38,
        "lastActive": "31 Oct",
        "daysAgo": 1,
        "isNew": False,
        "progress": [
            {"label": "Beyond words", "done": 2, "total": 3},
            {"label": "Feelings", "done": 2, "total": 4},
            {"label": "Hidden requests", "done": 1, "total": 4},
        ],
    },
    {
        "id": "maya",
        "name": "Maya",
        "age": 9,
        "code": "PIP-004",
        "avatar": None,
        "color": "#ebe6f5",
        "focus": "Hidden requests",
        "support": "Independent",
        "weeklyGoal": 3,
        "practiceDays": 3,
        "activities": 7,
        "practiceMinutes": 61,
        "lastActive": "30 Oct",
        "daysAgo": 2,
        "isNew": False,
        "progress": [
            {"label": "Hidden requests", "done": 4, "total": 4},
            {"label": "Metaphors", "done": 2, "total": 3},
            {"label": "Feelings", "done": 1, "total": 2},
        ],
    },
    {
        "id": "noah",
        "name": "Noah",
        "age": 8,
        "code": "PIP-005",
        "avatar": None,
        "color": "#f5ecdc",
        "focus": "Feelings",
        "support": "Guided",
        "weeklyGoal": 3,
        "practiceDays": 1,
        "activities": 6,
        "practiceMinutes": 92,
        "lastActive": "29 Oct",
        "daysAgo": 3,
        "isNew": False,
        "progress": [
            {"label": "Feelings", "done": 1, "total": 4},
            {"label": "Beyond words", "done": 1, "total": 3},
            {"label": "Hidden requests", "done": 0, "total": 4},
        ],
    },
    {
        "id": "sophie",
        "name": "Sophie",
        "age": 6,
        "code": "PIP-006",
        "avatar": None,
        "color": "#dcefe8",
        "focus": "Beyond words",
        "support": "Supported",
        "weeklyGoal": 3,
        "practiceDays": 0,
        "activities": 0,
        "practiceMinutes": 0,
        "lastActive": None,
        "daysAgo": 99,
        "isNew": True,
        "progress": [
            {"label": "Beyond words", "done": 0, "total": 3},
            {"label": "Feelings", "done": 0, "total": 4},
            {"label": "Hidden requests", "done": 0, "total": 4},
        ],
    },
]
MOCK_THERAPISTS: dict[str, dict] = {}
MOCK_THERAPIST_ID = 0
PASSWORD_HASH_ITERATIONS = 310_000


def _password_hash(password: str, salt: bytes) -> bytes:
    return hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PASSWORD_HASH_ITERATIONS)


def _find_child(child_id: str) -> dict:
    child = next((item for item in MOCK_CHILDREN if item["id"] == child_id), None)
    if child is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")
    return child


@app.get("/")
def read_root():
    return {"message": "OK"}


@app.post("/api/login")
def login(credentials: LoginRequest):
    email = str(credentials.email).lower()
    if email == "user@user.com" and credentials.password == "password":
        return {
            "success": True,
            "message": "Login exitoso",
            "token": "fake-jwt-token-pip",
            "next_screen": "add-child",
        }

    therapist = MOCK_THERAPISTS.get(email)
    if therapist is not None:
        submitted_hash = _password_hash(credentials.password, therapist["password_salt"])
        if hmac.compare_digest(submitted_hash, therapist["password_hash"]):
            return {
                "success": True,
                "message": "Login exitoso",
                "token": "fake-jwt-token-pip",
                "next_screen": "add-child",
            }

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Email o contraseña incorrectos",
    )


@app.post("/api/register", status_code=status.HTTP_201_CREATED)
def register_therapist(registration: TherapistRegisterRequest):
    global MOCK_THERAPIST_ID

    if not registration.accepted_terms:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Terms must be accepted")

    email = str(registration.email).lower()
    if email in MOCK_THERAPISTS:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    MOCK_THERAPIST_ID += 1
    salt = secrets.token_bytes(16)
    therapist = {
        "id": f"therapist-{MOCK_THERAPIST_ID}",
        "fullName": registration.full_name.strip(),
        "professionalRole": registration.professional_role.strip(),
        "practice": registration.practice.strip(),
        "registrationNumber": registration.registration_number,
        "displayName": registration.display_name.strip(),
        "email": email,
    }
    MOCK_THERAPISTS[email] = {
        **therapist,
        "password_salt": salt,
        "password_hash": _password_hash(registration.password, salt),
    }
    return {"success": True, "therapist": therapist}


@app.post("/api/children", status_code=status.HTTP_201_CREATED)
def create_child(child_request: AddChildRequest):
    if not child_request.accepted_permission:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Parent or guardian permission must be confirmed",
        )

    used_codes = {child["code"] for child in MOCK_CHILDREN}
    available_codes = [f"PIP{number:03d}" for number in range(100, 1000) if f"PIP{number:03d}" not in used_codes]
    if not available_codes:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No mock login codes are available",
        )

    code = secrets.choice(available_codes)
    child_id = f"child-{len(MOCK_CHILDREN) + 1}"
    child = {
        "id": child_id,
        "name": child_request.name.strip(),
        "age": child_request.age,
        "code": code,
        "avatar": None,
        "color": "#eaf2ff",
        "focus": "Hidden requests",
        "support": "Guided",
        "weeklyGoal": 5,
        "practiceDays": 0,
        "activities": 0,
        "practiceMinutes": 0,
        "lastActive": None,
        "daysAgo": 99,
        "isNew": True,
        "progress": [
            {"label": "Hidden requests", "done": 0, "total": 1},
            {"label": "Beyond words", "done": 0, "total": 1},
            {"label": "Feelings", "done": 0, "total": 1},
        ],
    }
    MOCK_CHILDREN.append(child)
    return {"success": True, "child": deepcopy(child), "login_code": code}


@app.get("/api/children")
def list_children():
    return deepcopy(MOCK_CHILDREN)


@app.get("/api/children/{child_id}")
def get_child(child_id: str):
    return deepcopy(_find_child(child_id))


@app.put("/api/children/{child_id}")
def update_child(child_id: str, update: UpdateChildRequest):
    child = _find_child(child_id)
    child.update(
        {
            "focus": update.focus,
            "support": update.support,
            "weeklyGoal": update.weekly_goal,
        }
    )
    return deepcopy(child)


@app.get("/api/children/{child_id}/progress")
def get_child_progress(child_id: str):
    child = _find_child(child_id)
    return {
        "child_id": child["id"],
        "activities": child["activities"],
        "practiceMinutes": child["practiceMinutes"],
        "practiceDays": child["practiceDays"],
        "weeklyGoal": child["weeklyGoal"],
        "lastActive": child["lastActive"],
        "progress": deepcopy(child["progress"]),
    }


@app.post("/api/auth/child-login")
def child_login(request: ChildLoginRequest):
    code = request.code.strip().upper().replace("-", "")
    child = next(
        (item for item in MOCK_CHILDREN if item["code"].upper().replace("-", "") == code),
        None,
    )
    if child is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid child login code",
        )

    profile = deepcopy(child)
    profile.pop("code", None)
    return {"success": True, "child": profile, "next_screen": "story"}


@app.post("/api/navigation")
def navigate(data: ScreenTransitionRequest):
    transitions = {
        ("home", "go_login"): "login",
        ("home", "go_child_login"): "child-login",
        ("login", "go_home"): "home",
        ("login", "go_register"): "register",
        ("login", "go_child_login"): "child-login",
        ("register", "go_home"): "home",
        ("register", "go_login"): "login",
        ("register", "go_add_child"): "add-child",
        ("add-child", "go_child_code"): "child-code",
        ("add-child", "go_register"): "register",
        ("child-code", "go_home"): "home",
        ("child-code", "go_add_child"): "add-child",
        ("child-login", "go_home"): "home",
        ("child-login", "go_story"): "story",
        ("story", "go_home"): "home",
    }

    next_screen = transitions.get((data.current_screen, data.action))
    if next_screen:
        return {"next_screen": next_screen}

    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Transición no válida")
