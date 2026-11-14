from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Personalized Pragmatic App")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class LoginRequest(BaseModel):
    email: str
    password: str


class ChildLoginRequest(BaseModel):
    code: str


class ScreenTransitionRequest(BaseModel):
    current_screen: str
    action: str  # e.g., 'go_login', 'go_register', 'go_add_child', etc.


@app.get("/")
def read_root():
    return {"message": "OK"}


@app.post("/api/login")
def login(credentials: LoginRequest):
    if credentials.email == "user@user.com" and credentials.password == "password":
        return {
            "success": True,
            "message": "Login exitoso",
            "token": "fake-jwt-token-pip",
            "next_screen": "therapist-overview",
        }
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Email o contraseña incorrectos",
    )


@app.post("/api/child-login")
def child_login(data: ChildLoginRequest):
    # Por ahora un código fijo; más adelante se generará al crear el niño
    if data.code.strip().upper() == "PIP742":
        return {"success": True, "child_name": "Dan", "next_screen": "child-setup"}
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="That code doesn’t look right. Try again!",
    )


@app.post("/api/navigation")
def navigate(data: ScreenTransitionRequest):
    # El backend decide la siguiente pantalla según la pantalla actual y la acción
    transitions = {
        # Home
        ("home", "go_home"): "home",
        ("home", "go_login"): "login",
        ("home", "go_child_login"): "child-login",
        # Terapeuta: login y registro
        ("login", "go_home"): "home",
        ("login", "go_register"): "register",
        ("login", "go_child_login"): "child-login",
        ("login", "go_overview"): "therapist-overview",
        ("login", "go_add_child"): "add-child",
        ("register", "go_home"): "home",
        ("register", "go_login"): "login",
        ("register", "go_add_child"): "add-child",
        # Terapeuta: añadir niño
        ("add-child", "go_home"): "home",
        ("add-child", "go_child_code"): "child-code",
        ("add-child", "go_register"): "register",
        ("add-child", "go_children"): "therapist-children",
        ("add-child", "go_overview"): "therapist-overview",
        ("child-code", "go_home"): "home",
        ("child-code", "go_add_child"): "add-child",
        ("child-code", "go_child_profile"): "therapist-child-profile",
        ("child-code", "go_overview"): "therapist-overview",
        # Niño
        ("child-login", "go_home"): "home",
        ("child-login", "go_child_setup"): "child-setup",
        ("child-setup", "go_home"): "home",
        ("child-setup", "go_child_home"): "child-home",
        ("child-home", "go_home"): "home",
        ("child-home", "go_child_setup"): "child-setup",
    }

    # Panel del terapeuta: desde cualquier pantalla del panel se puede ir a cualquier otra
    dashboard_screens = [
        "therapist-overview",
        "therapist-children",
        "therapist-child-profile",
        "therapist-activities",
    ]
    dashboard_actions = {
        "go_overview": "therapist-overview",
        "go_children": "therapist-children",
        "go_child_profile": "therapist-child-profile",
        "go_activities": "therapist-activities",
        "go_add_child": "add-child",
        "go_logout": "home",
        "go_home": "home",
    }
    for screen in dashboard_screens:
        for action, target in dashboard_actions.items():
            transitions[(screen, action)] = target

    next_screen = transitions.get((data.current_screen, data.action))
    if next_screen:
        return {"next_screen": next_screen}
    raise HTTPException(status_code=400, detail="Transición no válida")
