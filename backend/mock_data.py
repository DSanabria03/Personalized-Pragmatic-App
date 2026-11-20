"""
Fake data for the presentation: everything lives in memory (plain Python lists), there is no database.

Every time the backend starts, the data is created again from scratch, so the demo always begins the same way.
Whatever happens while it runs (new therapists, new children, stories played) is lost when you stop it.

Demo accounts
    Therapist   emma@littlesteps.com  /  littlesteps2026
    Children    PIP001 Dan · PIP002 Amelia · PIP003 Leo · PIP004 Maya · PIP005 Noah · PIP006 Sophie
                (the same children as frontend/src/data/mockData.js)

The "tables" are lists of dicts with the same fields the old SQLite tables had:
    THERAPISTS, CHILDREN, TOKENS, STORY_RUNS, ATTEMPTS
"""

import hashlib
import itertools
import random
import secrets
import threading
from datetime import datetime, timedelta, timezone

TIME_FORMAT = "%Y-%m-%d %H:%M:%S"   # same format SQLite used, so the frontend doesn't notice any change

THERAPISTS: list[dict] = []
CHILDREN: list[dict] = []
TOKENS: dict[str, dict] = {}        # token -> {"role": "therapist" | "child", "user_id": ...}
STORY_RUNS: list[dict] = []
ATTEMPTS: list[dict] = []

LOCK = threading.RLock()            # FastAPI answers several requests at once: change the lists one at a time

_therapist_ids = itertools.count(1)
_child_ids = itertools.count(1)
_run_ids = itertools.count(1)
_attempt_ids = itertools.count(1)


def now() -> str:
    return datetime.now(timezone.utc).strftime(TIME_FORMAT)


def new_therapist_id() -> int:
    return next(_therapist_ids)


def new_child_id() -> int:
    return next(_child_ids)


def new_run_id() -> int:
    return next(_run_ids)


def new_attempt_id() -> int:
    return next(_attempt_ids)


# ---------------------------------------------------------------- the demo data
DEMO_THERAPIST = {
    "full_name": "Dr. Emma Walker",
    "display_name": "Dr. Emma",
    "role": "Speech therapist",
    "practice": "Little Steps Therapy",
    "registration_number": "",
    "email": "emma@littlesteps.com",
    "password": "littlesteps2026",
}

# From INITIAL_CHILDREN in frontend/src/data/mockData.js:
# how many stories they played, on how many days, how many minutes, and how many days ago they last played.
DEMO_CHILDREN = [
    {"name": "Dan", "age": "8", "code": "PIP001", "activities": 6, "practice_days": 3, "minutes": 42, "days_ago": 0},
    {"name": "Amelia", "age": "7", "code": "PIP002", "activities": 8, "practice_days": 4, "minutes": 55, "days_ago": 0},
    {"name": "Leo", "age": "6", "code": "PIP003", "activities": 5, "practice_days": 2, "minutes": 38, "days_ago": 1},
    {"name": "Maya", "age": "9", "code": "PIP004", "activities": 7, "practice_days": 3, "minutes": 61, "days_ago": 2},
    {"name": "Noah", "age": "8", "code": "PIP005", "activities": 6, "practice_days": 1, "minutes": 92, "days_ago": 3},
    {"name": "Sophie", "age": "6", "code": "PIP006", "activities": 0, "practice_days": 0, "minutes": 0, "days_ago": 0},
]

# The scenes of "the_secret_message" (backend/data/stories/the_secret_message.json) and their right option.
DEMO_STORY = "the_secret_message"
DEMO_SCENES = {"ready_to_order": "C", "spilled_water": "B", "waiting_for_the_bill": "A"}


def _password_hash(password: str) -> str:
    # Same format as services/accounts.hash_password (imported lazily there to avoid a circular import).
    salt = secrets.token_hex(16)
    rounds = 200_000
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), bytes.fromhex(salt), rounds).hex()
    return f"pbkdf2_sha256${rounds}${salt}${digest}"


def _fake_history(child_id: int, demo: dict, rng: random.Random) -> None:
    """Finished story runs (with one attempt per click) spread over the child's practice days."""
    if not demo["activities"]:
        return
    # Played "days_ago" days ago and every second day before that, always before the backend started.
    started = datetime.now(timezone.utc).replace(second=0, microsecond=0)
    days = [started - timedelta(days=demo["days_ago"] + 2 * i) for i in range(demo["practice_days"])]
    minutes_per_run = min(demo["minutes"] / demo["activities"], 60)

    for n in range(demo["activities"]):
        day = days[n % len(days)]
        start = day - timedelta(minutes=60 * (1 + n // len(days)) + rng.randint(0, 20))
        end = start + timedelta(minutes=minutes_per_run)
        run_id = new_run_id()
        results = []
        moment = start
        for scene, right in DEMO_SCENES.items():
            tries = rng.choices([1, 2, 3], weights=[6, 3, 1])[0]
            for attempt in range(1, tries + 1):
                correct = attempt == tries
                moment += timedelta(seconds=40)
                ATTEMPTS.append({
                    "id": new_attempt_id(), "child_id": child_id, "run_id": run_id, "story_id": DEMO_STORY,
                    "scene_id": scene, "language": "en",
                    "choice": right if correct else rng.choice([o for o in "ABC" if o != right]),
                    "is_correct": int(correct), "attempt_number": attempt,
                    "outcome": "correct" if correct else ("hint" if attempt == 2 else "retry"), "pip_said": "",
                    "created_at": min(moment, end).strftime(TIME_FORMAT),
                })
            results.append(tries)

        first_try = sum(1 for t in results if t == 1)
        xp = sum(15 if t == 1 else 10 if t == 2 else 5 for t in results)
        STORY_RUNS.append({
            "id": run_id, "child_id": child_id, "story_id": DEMO_STORY, "language": "en",
            "started_at": start.strftime(TIME_FORMAT), "finished_at": end.strftime(TIME_FORMAT),
            "scenes_total": len(DEMO_SCENES), "scenes_first_try": first_try, "scenes_solved": len(DEMO_SCENES),
            "total_attempts": sum(results), "xp_earned": xp,
        })


def reset() -> None:
    """(Re)creates the demo data. Called once when the backend starts."""
    global _therapist_ids, _child_ids, _run_ids, _attempt_ids
    with LOCK:
        for table in (THERAPISTS, CHILDREN, STORY_RUNS, ATTEMPTS):
            table.clear()
        TOKENS.clear()
        _therapist_ids, _child_ids = itertools.count(1), itertools.count(1)
        _run_ids, _attempt_ids = itertools.count(1), itertools.count(1)

        created = now()
        therapist = {k: v for k, v in DEMO_THERAPIST.items() if k != "password"}
        therapist.update(id=new_therapist_id(), password_hash=_password_hash(DEMO_THERAPIST["password"]),
                         created_at=created)
        THERAPISTS.append(therapist)

        rng = random.Random(42)     # always the same "random" history
        for demo in DEMO_CHILDREN:
            child = {"id": new_child_id(), "therapist_id": therapist["id"], "name": demo["name"], "age": demo["age"],
                     "parent_email": "", "code": demo["code"], "created_at": created}
            CHILDREN.append(child)
            _fake_history(child["id"], demo, rng)
