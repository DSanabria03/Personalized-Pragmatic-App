"""
Story API: the frontend calls these while the child plays a story.

    GET  /api/stories/{story_id}?language=en         story + scenes, WITHOUT the correct answers
    POST /api/stories/{story_id}/narrate             Pip tells what happens in a scene
    POST /api/stories/{story_id}/check               child picked an option -> right or not, Pip's action, the
                                                     customer's reaction (instant, no LLM, nothing saved)
    POST /api/stories/{story_id}/answer              the same + Pip's sentence (LLM), and the answer is saved
    POST /api/stories/{story_id}/start               a logged-in child starts playing -> run_id
    POST /api/stories/{story_id}/finish              Pip celebrates at the end + the results ("Great job" screen)

If a child is logged in (Authorization: Bearer <token>), every answer is saved (SQLite, database.py) and the
results count for their progress and the therapist's dashboard. Pip also uses the child's name.
Answers of guests (nobody logged in) are not saved: every attempt in the database belongs to a child.

Stories live in data/stories/<story_id>.json. Text there can be a plain string or {"en": "...", "it": "..."}.
"pip_role" (story or scene) says which character Pip plays, e.g. the waiter or one of the customers.
"""

import json
import re
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Header, HTTPException
from pydantic import AfterValidator, BaseModel, Field

from services import accounts, llm_service, progress

router = APIRouter(prefix="/api/stories", tags=["stories"])

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
STORIES_DIR = DATA_DIR / "stories"
STORY_ID = re.compile(r"[a-z0-9_]{1,64}")   # file names in data/stories (no "/" or "..")
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
    if not STORY_ID.fullmatch(story_id) or not path.is_file():
        raise HTTPException(404, f"Story '{story_id}' not found")
    return json.loads(path.read_text(encoding="utf-8"))


def localized_scene(scene: dict, lang: str) -> dict:
    """Scene in one language, including the correct answer (backend only!)."""
    options = []
    for o in scene["options"]:
        reaction = o.get("reaction") or {}
        options.append({
            "id": o["id"],
            "text": pick(o["text"], lang),
            "image": o.get("image"),
            "animation": o.get("animation"),          # future: GIF/video of Pip doing this action
            "reaction": {                              # how the customer reacts when Pip does this
                "emotion": reaction.get("emotion", "neutral"),
                "description": pick(reaction.get("description", ""), lang),
                "says": pick(reaction.get("says", ""), lang),
            },
        })
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


def logged_in_child(authorization: str | None) -> dict | None:
    """The child who is playing, if the browser sent a child's login token."""
    user = accounts.user_from_token(authorization)
    return user["child"] if user and user["role"] == "child" else None


def child_name_for(child: dict | None, fallback: str | None) -> str | None:
    return llm_service.clean_name(child["name"] if child else fallback)


# ---------- request / response shapes ----------
# Names sent by the browser end up in the LLM's instructions: keep only a safe short name.
PipName = Annotated[str, AfterValidator(lambda name: llm_service.clean_name(name) or "Pip")]
ChildName = Annotated[str | None, AfterValidator(llm_service.clean_name)]
RunId = Annotated[int, Field(ge=0, lt=2**63)]    # SQLite can't take bigger numbers

class NarrateRequest(BaseModel):
    scene_id: str
    language: str = "en"
    pip_name: PipName = "Pip"
    child_name: ChildName = None   # only used when no child is logged in (otherwise the name comes from the account)


class AnswerRequest(BaseModel):
    scene_id: str
    child_answer: str          # option id, e.g. "C"
    attempt: int = Field(default=1, ge=1, le=20)   # 1 = first try on this scene
    language: str = "en"
    pip_name: PipName = "Pip"
    child_code: str | None = None   # old: guests only (logged-in children are known from their token)
    child_name: ChildName = None
    run_id: RunId | None = None     # from /start, links the answer to this play-through


class StartRequest(BaseModel):
    language: str = "en"


class SceneResult(BaseModel):
    scene_id: str
    attempts: int = 0
    solved: bool = False


class FinishRequest(BaseModel):
    language: str = "en"
    pip_name: PipName = "Pip"
    child_name: ChildName = None
    solved_scene_ids: list[str] = []
    run_id: RunId | None = None
    results: list[SceneResult] = []   # for guests; for logged-in children the database is used


# ---------- endpoints ----------
@router.get("/{story_id}")
def get_story(story_id: str, language: str = "en"):
    lang = check_language(language)
    story = load_story(story_id)
    scenes = []
    for raw in story["scenes"]:
        s = localized_scene(raw, lang)
        public = {k: s[k] for k in ("id", "speaker", "listener", "quote", "question", "image")}
        # options without reactions: a happy reaction would give the answer away in the browser
        public["options"] = [{k: o[k] for k in ("id", "text", "image")} for o in s["options"]]
        scenes.append(public)
    return {
        "id": story["id"],
        "category": story.get("category"),
        "title": pick(story["title"], lang),
        "setting": pick(story["setting"], lang),
        "language": lang,
        "scenes": scenes,          # no "correct" here, so it can't be peeked at in the browser
    }


@router.post("/{story_id}/narrate")
def narrate(story_id: str, req: NarrateRequest, authorization: str | None = Header(default=None)):
    lang = check_language(req.language)
    story = load_story(story_id)
    index, raw = find_scene(story, req.scene_id)
    scene = localized_scene(raw, lang)
    previous = localized_scene(story["scenes"][index - 1], lang) if index > 0 else None
    speech = llm_service.narrate_scene(
        lang, req.pip_name, pip_role(story, raw, lang), pick(story["setting"], lang), scene, previous,
        is_first=(index == 0), child_name=child_name_for(logged_in_child(authorization), req.child_name),
    )
    return {"scene_id": scene["id"], "narration": speech, "speaker": scene["speaker"],
            "listener": scene["listener"], "quote": scene["quote"]}


def evaluate(story_id: str, req: AnswerRequest):
    """The part of an answer that comes from the story file, no LLM: is it right, what Pip does,
    how the customer reacts. Fast, so the screen can show it while Pip's sentence is still being written."""
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
    scene_done = outcome in ("correct", "reveal")

    result = {
        "is_correct": is_correct,
        "outcome": outcome,                  # correct | retry | hint | reveal
        "scene_done": scene_done,            # true -> show "Continue"
        "correct_answer": scene["correct"] if scene_done else None,
        "hidden_meaning": scene["hidden_meaning"] if scene_done else None,
        # what Pip does and how the customer reacts (shown and spoken before Pip's sentence)
        "action": {
            "text": llm_service.as_pip(picked["text"], req.pip_name),
            "image": picked["image"],
            "animation": picked["animation"],
        },
        "reaction": {"speaker": scene["speaker"], **picked["reaction"]},
        # for the pause after the first try: helps the therapist / grown-up talk it through with the child
        "for_grown_up": {"hint": scene["hint"], "hidden_meaning": scene["hidden_meaning"]} if outcome == "retry" else None,
    }
    return lang, story, raw, scene, picked, result


@router.post("/{story_id}/check")
def check(story_id: str, req: AnswerRequest):
    """Instant answer without Pip's sentence (nothing is saved). The screen calls this and /answer at the
    same time: it shows Pip's action and the customer's reaction right away, and Pip's sentence when it's ready."""
    return evaluate(story_id, req)[-1]


@router.post("/{story_id}/answer")
def answer(story_id: str, req: AnswerRequest, authorization: str | None = Header(default=None)):
    lang, story, raw, scene, picked, result = evaluate(story_id, req)
    child = logged_in_child(authorization)
    is_correct, outcome = result["is_correct"], result["outcome"]

    speech = llm_service.react_to_answer(
        lang, req.pip_name, pip_role(story, raw, lang), scene, picked["text"], outcome, req.attempt,
        reaction=picked["reaction"]["description"],
        child_name=child_name_for(child, req.child_name),
    )

    if child:   # saved for the child's progress and the therapist's dashboard
        progress.record_attempt(child["id"], req.run_id, story_id, scene["id"], lang, req.child_answer,
                                is_correct, req.attempt, outcome, speech)

    return {**result, "speech": speech}      # the same as /check, plus Pip's sentence


@router.post("/{story_id}/start")
def start(story_id: str, req: StartRequest, authorization: str | None = Header(default=None)):
    """A logged-in child starts the story: creates a 'run' so all answers of this play-through belong together."""
    lang = check_language(req.language)
    load_story(story_id)
    child = logged_in_child(authorization)
    if not child:
        return {"run_id": None, "child": None}
    return {"run_id": progress.start_run(child["id"], story_id, lang), "child": {"name": child["name"]}}


@router.post("/{story_id}/finish")
def finish(story_id: str, req: FinishRequest, authorization: str | None = Header(default=None)):
    lang = check_language(req.language)
    story = load_story(story_id)
    child = logged_in_child(authorization)
    total = len(story["scenes"])

    # The results of this play-through (numbers for the "Great job" screen)
    summary, before, after = None, None, None
    if child and req.run_id:
        before = progress.child_progress(child["id"], lang)
        summary = progress.finish_run(child["id"], req.run_id, total)
        after = progress.child_progress(child["id"], lang)
    if summary is None:
        summary = progress.summarize([r.model_dump() for r in req.results], total)

    solved_ids = req.solved_scene_ids or [r.scene_id for r in req.results if r.solved]
    meanings = [localized_scene(s, lang)["hidden_meaning"] for s in story["scenes"]
                if not solved_ids or s["id"] in solved_ids]
    role = pick(story.get("pip_role") or "a helper in the story", lang)
    speech = llm_service.finish_story(lang, req.pip_name, role, pick(story["title"], lang), meanings,
                                      child_name=child_name_for(child, req.child_name))

    result = {"speech": speech, "summary": summary, "progress": after, "new_badges": [], "level_up": False}
    if before and after:
        had = {b["id"] for b in before["badges"] if b["earned"]}
        result["new_badges"] = [b for b in after["badges"] if b["earned"] and b["id"] not in had]
        result["level_up"] = after["level"] > before["level"]
    return result
