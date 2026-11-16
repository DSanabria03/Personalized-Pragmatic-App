"""
Story API: the frontend calls these while the child plays a story.

    GET  /api/stories/{story_id}?language=en         story + scenes, WITHOUT the correct answers
    POST /api/stories/{story_id}/narrate             Pip tells what happens in a scene
    POST /api/stories/{story_id}/answer              child picked an option -> right or not + Pip reacts
    POST /api/stories/{story_id}/finish              Pip celebrates at the end

Stories live in data/stories/<story_id>.json. Text there can be a plain string or {"en": "...", "it": "..."}.
"pip_role" (story or scene) says which character Pip plays, e.g. the waiter or one of the customers.
"""

import json
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services import llm_service

router = APIRouter(prefix="/api/stories", tags=["stories"])

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
STORIES_DIR = DATA_DIR / "stories"
ANSWER_LOG = DATA_DIR / "answer_log.jsonl"
MAX_TRIES_BEFORE_REVEAL = 3


# ---------- helpers ----------
def pick(value, lang):
    """Get the text in the right language (falls back to English)."""
    if isinstance(value, dict):
        return value.get(lang) or value.get("en") or next(iter(value.values()), "")
    return value


def check_language(lang: str) -> str:
    if lang not in llm_service.LANGUAGES:
        raise HTTPException(400, f"language must be one of {list(llm_service.LANGUAGES)}")
    return lang


def load_story(story_id: str) -> dict:
    path = STORIES_DIR / f"{story_id}.json"
    if not path.is_file():
        raise HTTPException(404, f"Story '{story_id}' not found")
    return json.loads(path.read_text(encoding="utf-8"))


def localized_scene(scene: dict, lang: str) -> dict:
    """Scene in one language, including the correct answer (backend only!)."""
    options = [{"id": o["id"], "text": pick(o["text"], lang), "image": o.get("image")} for o in scene["options"]]
    return {
        "id": scene["id"],
        "speaker": scene["speaker"],
        "listener": pick(scene.get("listener", ""), lang),
        "situation": pick(scene["situation"], lang),
        "quote": pick(scene["quote"], lang),
        "question": pick(scene["question"], lang),
        "image": scene.get("image"),
        "options": options,
        "correct": scene["correct"],
        "correct_text": next(o["text"] for o in options if o["id"] == scene["correct"]),
        "hidden_meaning": pick(scene["hidden_meaning"], lang),
        "hint": pick(scene.get("hint", ""), lang),
        "after_right_action": pick(scene.get("after_right_action", ""), lang),
    }


def pip_role(story: dict, raw_scene: dict, lang: str) -> str:
    """Which character Pip plays: the scene's own pip_role if it has one, otherwise the story's."""
    return pick(raw_scene.get("pip_role") or story.get("pip_role") or "a helper in the story", lang)


def find_scene(story: dict, scene_id: str) -> tuple[int, dict]:
    for i, scene in enumerate(story["scenes"]):
        if scene["id"] == scene_id:
            return i, scene
    raise HTTPException(404, f"Scene '{scene_id}' not found in story '{story['id']}'")


def save_answer(entry: dict) -> None:
    """For now: one line per answer in data/answer_log.jsonl.
    TODO (backend): save to MySQL instead, so the therapist dashboard can show it."""
    entry["timestamp"] = datetime.now(timezone.utc).isoformat()
    with ANSWER_LOG.open("a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")


# ---------- request / response shapes ----------
class NarrateRequest(BaseModel):
    scene_id: str
    language: str = "en"
    pip_name: str = "Pip"
    child_name: str | None = None   # e.g. "Dan" - TODO: look it up in MySQL from the child's login code


class AnswerRequest(BaseModel):
    scene_id: str
    child_answer: str          # option id, e.g. "C"
    attempt: int = 1           # 1 = first try on this scene
    language: str = "en"
    pip_name: str = "Pip"
    child_code: str | None = None   # e.g. "PIP742", to link the answer to the child
    child_name: str | None = None


class FinishRequest(BaseModel):
    language: str = "en"
    pip_name: str = "Pip"
    child_name: str | None = None
    solved_scene_ids: list[str] = []


# ---------- endpoints ----------
@router.get("/{story_id}")
def get_story(story_id: str, language: str = "en"):
    lang = check_language(language)
    story = load_story(story_id)
    scenes = []
    for raw in story["scenes"]:
        s = localized_scene(raw, lang)
        scenes.append({k: s[k] for k in ("id", "speaker", "listener", "quote", "question", "image", "options")})
    return {
        "id": story["id"],
        "category": story.get("category"),
        "title": pick(story["title"], lang),
        "setting": pick(story["setting"], lang),
        "language": lang,
        "scenes": scenes,          # no "correct" here, so it can't be peeked at in the browser
    }


@router.post("/{story_id}/narrate")
def narrate(story_id: str, req: NarrateRequest):
    lang = check_language(req.language)
    story = load_story(story_id)
    index, raw = find_scene(story, req.scene_id)
    scene = localized_scene(raw, lang)
    previous = localized_scene(story["scenes"][index - 1], lang) if index > 0 else None
    speech = llm_service.narrate_scene(
        lang, req.pip_name, pip_role(story, raw, lang), pick(story["setting"], lang), scene, previous,
        is_first=(index == 0), child_name=llm_service.clean_name(req.child_name),
    )
    return {"scene_id": scene["id"], "narration": speech, "speaker": scene["speaker"],
            "listener": scene["listener"], "quote": scene["quote"]}


@router.post("/{story_id}/answer")
def answer(story_id: str, req: AnswerRequest):
    lang = check_language(req.language)
    story = load_story(story_id)
    _, raw = find_scene(story, req.scene_id)
    scene = localized_scene(raw, lang)

    picked = next((o for o in scene["options"] if o["id"] == req.child_answer), None)
    if picked is None:
        raise HTTPException(400, f"Option '{req.child_answer}' does not exist in scene '{scene['id']}'")

    is_correct = req.child_answer == scene["correct"]      # the code decides, not the LLM
    if is_correct:
        outcome = "correct"
    elif req.attempt >= MAX_TRIES_BEFORE_REVEAL:
        outcome = "reveal"
    elif req.attempt == MAX_TRIES_BEFORE_REVEAL - 1:
        outcome = "hint"
    else:
        outcome = "retry"

    speech = llm_service.react_to_answer(
        lang, req.pip_name, pip_role(story, raw, lang), scene, picked["text"], outcome, req.attempt,
        child_name=llm_service.clean_name(req.child_name),
    )
    scene_done = outcome in ("correct", "reveal")

    save_answer({
        "child_code": req.child_code, "story_id": story_id, "scene_id": scene["id"], "language": lang,
        "child_answer": req.child_answer, "is_correct": is_correct, "attempt": req.attempt,
        "outcome": outcome, "pip_said": speech, "model": llm_service.LLM_MODEL,
    })

    return {
        "is_correct": is_correct,
        "outcome": outcome,                  # correct | retry | hint | reveal
        "speech": speech,
        "scene_done": scene_done,            # true -> show "Continue"
        "correct_answer": scene["correct"] if scene_done else None,
        "hidden_meaning": scene["hidden_meaning"] if scene_done else None,
    }


@router.post("/{story_id}/finish")
def finish(story_id: str, req: FinishRequest):
    lang = check_language(req.language)
    story = load_story(story_id)
    meanings = [localized_scene(s, lang)["hidden_meaning"] for s in story["scenes"]
                if not req.solved_scene_ids or s["id"] in req.solved_scene_ids]
    role = pick(story.get("pip_role") or "a helper in the story", lang)
    speech = llm_service.finish_story(lang, req.pip_name, role, pick(story["title"], lang), meanings,
                                      child_name=llm_service.clean_name(req.child_name))
    return {"speech": speech}
