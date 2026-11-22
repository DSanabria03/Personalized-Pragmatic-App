from fastapi import FastAPI
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

init_db()   # creates backend/data/pip.db and its tables if they do not exist yet

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


@app.get("/")
def read_root():
    return {"message": "OK"}
