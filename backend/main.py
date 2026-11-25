from pathlib import Path

from dotenv import load_dotenv

# Read settings like ELEVENLABS_API_KEY from backend/.env (never upload that file to GitHub!).
# It must run before the app's own imports: some of them read their settings when they are imported
# (PIP_DB_PATH in database.py, OLLAMA_HOST and LLM_MODEL in services/llm_service.py, APP_TIMEZONE in services/progress.py).
load_dotenv(Path(__file__).resolve().parent / ".env")

from contextlib import asynccontextmanager  # noqa: E402

from fastapi import FastAPI, Request  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from fastapi.responses import JSONResponse  # noqa: E402

from database import init_db  # noqa: E402
from routers.accounts import router as accounts_router  # noqa: E402
from routers.story import router as story_router  # noqa: E402
from routers.tts import router as tts_router  # noqa: E402
from services.accounts import AccountError  # noqa: E402


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()   # when the server starts: creates backend/data/pip.db and its tables if they do not exist yet
    yield


app = FastAPI(title="Personalized Pragmatic App", lifespan=lifespan)


@app.exception_handler(AccountError)
def account_error(_request: Request, error: AccountError):
    """A problem the user should see ('This email is already registered'): its status and message."""
    return JSONResponse({"detail": error.message}, status_code=error.status)

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
