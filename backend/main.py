from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from routers.accounts import router as accounts_router
from routers.story import router as story_router
from routers.tts import router as tts_router

# Read settings like ELEVENLABS_API_KEY from backend/.env (never upload that file to GitHub!)
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

init_db()   # creates backend/data/pip.db with the tables, the first time

app = FastAPI(title="Personalized Pragmatic App")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(story_router)   # Pip + LLM story endpoints (routers/story.py)
app.include_router(tts_router)     # Pip's voice (routers/tts.py)
app.include_router(accounts_router)  # therapist + child accounts, statistics (routers/accounts.py)

class LoginRequest(BaseModel):
    email: str
    password: str

class ScreenTransitionRequest(BaseModel):
    current_screen: str
    action: str  # e.g., 'to_login', 'to_register', 'to_add_child', etc.

@app.get("/")
def read_root():
    return {"message": "OK"}

# Old demo login (fixed user). The real accounts are in routers/accounts.py: /api/therapists/login etc.
@app.post("/api/login")
def login(credentials: LoginRequest):
    if credentials.email == "user@user.com" and credentials.password == "password":
        return {
            "success": True,
            "message": "Login exitoso",
            "token": "fake-jwt-token-pip",
            "next_screen": "add-child"
        }
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Email o contraseña incorrectos"
    )

@app.post("/api/navigation")
def navigate(data: ScreenTransitionRequest):
    # El backend decides the next screen based on the current screen and action
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
        ("child-login", "go_story"): "story",   # child presses "Let's go!" -> Pip's story
        ("story", "go_home"): "home"
    }
    
    next_screen = transitions.get((data.current_screen, data.action))
    if next_screen:
        return {"next_screen": next_screen}
    
    raise HTTPException(status_code=400, detail="Transición no válida")