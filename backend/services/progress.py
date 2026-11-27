"""
Progress and statistics, all calculated from what the child actually did (tables attempts + story_runs in SQLite,
see database.py).

For the child (friendly, "small steps, not scores"):
    XP for every table completed (more when found on the first try), levels every 100 XP, badges.
For the therapist:
    activities, practice days and time, how often the hidden meaning was found on the first try, per scene.
"""

import json
import os
from datetime import UTC, date, datetime, timedelta
from zoneinfo import ZoneInfo

from database import DATA_DIR, db

STORIES_DIR = DATA_DIR / "stories"

# The database saves every time in UTC (datetime('now')). Days and weeks (practice days, streak, "this week",
# activities per day) are counted in the app's time zone: the app is used in Italy, so a story played at 00:30
# there counts for that day, and the week starts on Monday at midnight Italian time.
TIMEZONE = ZoneInfo(os.getenv("APP_TIMEZONE", "Europe/Rome"))

XP_FIRST_TRY = 15
XP_SECOND_TRY = 10
XP_LATER = 5          # also when Pip explained it after 3 tries: trying counts too
XP_PER_LEVEL = 100

BADGES = [
    {"id": "first_steps", "target": 1, "measure": "stories_completed",
     "title": {"en": "First steps", "it": "Primi passi"},
     "description": {"en": "Complete your first adventure.", "it": "Completa la tua prima avventura."}},
    {"id": "secret_seeker", "target": 9, "measure": "secret_messages",
     "title": {"en": "Secret-message seeker", "it": "Cercatore di messaggi segreti"},
     "description": {"en": "Discover 9 secret messages.", "it": "Scopri 9 messaggi segreti."}},
    {"id": "sharp_ears", "target": 1, "measure": "perfect_stories",
     "title": {"en": "Sharp ears", "it": "Orecchie attente"},
     "description": {"en": "Find every secret message of a story on the first try.",
                     "it": "Trova tutti i messaggi segreti di una storia al primo tentativo."}},
    {"id": "every_day", "target": 3, "measure": "active_days",
     "title": {"en": "Little steps every day", "it": "Piccoli passi ogni giorno"},
     "description": {"en": "Play on 3 different days.", "it": "Gioca in 3 giorni diversi."}},
]


def _parse(ts: str | None) -> datetime | None:
    """A time from the database (UTC, like '2026-11-01 23:30:00') in the app's time zone."""
    if not ts:
        return None
    return datetime.strptime(ts[:19], "%Y-%m-%d %H:%M:%S").replace(tzinfo=UTC).astimezone(TIMEZONE)


def _day(ts: str) -> str:
    """The day of a database time in the app's time zone: '2026-11-01 23:30:00' (UTC) -> '2026-11-02' in Italy."""
    return _parse(ts).date().isoformat()


def _today() -> date:
    return datetime.now(TIMEZONE).date()


def xp_for_scene(attempts_needed: int, solved: bool) -> int:
    if solved and attempts_needed == 1:
        return XP_FIRST_TRY
    if solved and attempts_needed == 2:
        return XP_SECOND_TRY
    return XP_LATER


# ---------------------------------------------------------------- while playing
def start_run(child_id: int, story_id: str, language: str) -> int:
    with db() as con:
        return con.execute("INSERT INTO story_runs (child_id, story_id, language) VALUES (?, ?, ?)",
                           (child_id, story_id, language)).lastrowid


def _find_run(con, run_id, child_id):
    return con.execute("SELECT * FROM story_runs WHERE id = ? AND child_id = ?", (run_id, child_id)).fetchone()


def record_attempt(child_id, run_id, story_id, scene_id, language, choice, is_correct, attempt_number, outcome, pip_said):
    with db() as con:
        if run_id is not None and not _find_run(con, run_id, child_id):
            run_id = None          # not this child's run: still save the attempt, without the run
        con.execute(
            "INSERT INTO attempts (child_id, run_id, story_id, scene_id, language, choice, is_correct, attempt_number,"
            " outcome, pip_said) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (child_id, run_id, story_id, scene_id, language, choice, int(bool(is_correct)), attempt_number, outcome,
             pip_said),
        )


def summarize(results: list[dict], total_scenes: int) -> dict:
    """results: one item per scene {"scene_id", "attempts", "solved"} -> numbers for the 'Great job' screen."""
    solved = sum(1 for r in results if r.get("solved"))
    first_try = sum(1 for r in results if r.get("solved") and r.get("attempts") == 1)
    attempts = sum(int(r.get("attempts") or 0) for r in results)
    xp = sum(xp_for_scene(int(r.get("attempts") or 0), bool(r.get("solved"))) for r in results)
    return {"tables": total_scenes, "tables_played": len(results), "solved": solved, "first_try": first_try,
            "attempts": attempts, "xp_earned": xp}


def _run_results(con, run_id: int) -> list[dict]:
    """Per scene of a run: how many tries until it was done, and whether the child found it."""
    scenes: dict[str, dict] = {}
    rows = con.execute("SELECT * FROM attempts WHERE run_id = ? ORDER BY id", (run_id,))
    for r in rows:
        s = scenes.setdefault(r["scene_id"], {"scene_id": r["scene_id"], "attempts": 0, "solved": False, "done": False})
        if s["done"]:
            continue
        s["attempts"] += 1
        if r["is_correct"]:
            s["solved"] = s["done"] = True
        elif r["outcome"] == "reveal":
            s["done"] = True
    return [{k: v for k, v in s.items() if k != "done"} for s in scenes.values()]


def finish_run(child_id: int, run_id: int, total_scenes: int) -> dict | None:
    """Closes the run and saves its results. Returns the summary, or None if the run isn't this child's."""
    with db() as con:
        con.execute("BEGIN IMMEDIATE")
        if not _find_run(con, run_id, child_id):
            return None
        summary = summarize(_run_results(con, run_id), total_scenes)
        con.execute(
            "UPDATE story_runs SET finished_at = datetime('now'), scenes_total = ?, scenes_first_try = ?,"
            " scenes_solved = ?, total_attempts = ?, xp_earned = ? WHERE id = ?",
            (total_scenes, summary["first_try"], summary["solved"], summary["attempts"], summary["xp_earned"], run_id),
        )
        return summary


# ---------------------------------------------------------------- the child's progress
def _finished_runs(con, child_id: int) -> list:
    return con.execute("SELECT * FROM story_runs WHERE child_id = ? AND finished_at IS NOT NULL ORDER BY id",
                       (child_id,)).fetchall()


def _attempts_of(con, child_id: int) -> list:
    return con.execute("SELECT * FROM attempts WHERE child_id = ? ORDER BY id", (child_id,)).fetchall()


def _run_minutes(run) -> float:
    start, end = _parse(run["started_at"]), _parse(run["finished_at"])
    return min(max((end - start).total_seconds() / 60, 0), 60) if start and end else 0.0


def _measures(runs: list, attempts: list) -> dict:
    days = {_day(a["created_at"]) for a in attempts}
    return {
        "xp": sum(r["xp_earned"] for r in runs),
        "stories_completed": len(runs),
        "secret_messages": sum(r["scenes_solved"] for r in runs),
        "perfect_stories": sum(1 for r in runs if r["scenes_total"] and r["scenes_first_try"] == r["scenes_total"]),
        "active_days": len(days),
        "practice_minutes": round(sum(_run_minutes(r) for r in runs)),
        "days": days,
    }


def _week(days: set[str], today: date | None = None) -> list[dict]:
    today = today or _today()
    monday = today - timedelta(days=today.weekday())
    week = []
    for i in range(7):
        d = monday + timedelta(days=i)
        week.append({"date": d.isoformat(), "weekday": i, "day": d.day, "active": d.isoformat() in days,
                     "today": d == today})
    return week


def child_progress(child_id: int, language: str = "en") -> dict:
    lang = "it" if language == "it" else "en"
    with db() as con:
        m = _measures(_finished_runs(con, child_id), _attempts_of(con, child_id))
    badges = []
    for b in BADGES:
        value = m[b["measure"]]
        badges.append({"id": b["id"], "title": b["title"][lang], "description": b["description"][lang],
                       "progress": min(value, b["target"]), "target": b["target"], "earned": value >= b["target"]})
    week = _week(m["days"])
    streak = 0
    for d in reversed([w for w in week if w["date"] <= _today().isoformat()]):
        if not d["active"]:
            break
        streak += 1
    return {
        "xp": m["xp"],
        "level": m["xp"] // XP_PER_LEVEL + 1,
        "xp_in_level": m["xp"] % XP_PER_LEVEL,
        "xp_per_level": XP_PER_LEVEL,
        "stories_completed": m["stories_completed"],
        "secret_messages": m["secret_messages"],
        "active_days": m["active_days"],
        "practice_minutes": m["practice_minutes"],
        "week": week,
        "streak_days": streak,
        "badges": badges,
    }


# ---------------------------------------------------------------- the therapist's dashboard
def _monday() -> date:
    today = _today()
    return today - timedelta(days=today.weekday())


def _plan(c) -> dict:
    """What the therapist set for the child (Edit profile) and the child's chosen Pip (for the avatar)."""
    return {"pip": c["pip"] or "", "support_level": c["support_level"] or "Guided", "weekly_goal": c["weekly_goal"] or 3}


def _story_scenes() -> dict[str, dict]:
    """story id -> {"category", "scenes": [scene ids]} of every story in data/stories."""
    stories = {}
    for path in sorted(STORIES_DIR.glob("*.json")):
        story = json.loads(path.read_text(encoding="utf-8"))
        stories[story["id"]] = {"category": story.get("category", ""), "scenes": [s["id"] for s in story["scenes"]]}
    return stories


def therapist_overview(therapist_id: int) -> dict:
    monday = _monday().isoformat()
    with db() as con:
        children = con.execute("SELECT * FROM children WHERE therapist_id = ? ORDER BY id", (therapist_id,)).fetchall()
        history = {c["id"]: (_finished_runs(con, c["id"]), _attempts_of(con, c["id"])) for c in children}
    children.sort(key=lambda c: c["name"].lower())      # in Python: SQLite's NOCASE doesn't handle É, Ñ...
    rows, per_day, active_ids, week_runs, week_minutes = [], [0] * 7, set(), 0, 0.0
    for c in children:
        runs, attempts = history[c["id"]]
        m = _measures(runs, attempts)
        runs_week = [r for r in runs if _day(r["finished_at"]) >= monday]
        for r in runs_week:
            per_day[_parse(r["finished_at"]).weekday()] += 1
            week_minutes += _run_minutes(r)
        if runs_week or any(d >= monday for d in m["days"]):
            active_ids.add(c["id"])
        week_runs += len(runs_week)
        first = sum(r["scenes_first_try"] for r in runs)
        total = sum(r["scenes_total"] for r in runs)
        last = max((a["created_at"] for a in attempts), default=None)
        rows.append({
            "id": c["id"], "name": c["name"], "age": c["age"], "code": c["code"], **_plan(c),
            "stories_completed": m["stories_completed"], "activities_week": len(runs_week),
            "practice_days_week": sum(1 for d in m["days"] if d >= monday),
            "secret_messages": m["secret_messages"],
            "first_try_rate": round(100 * first / total) if total else None,
            "level": m["xp"] // XP_PER_LEVEL + 1,
            "practice_minutes": m["practice_minutes"],
            "last_active": last,
        })
    return {
        "week_start": monday,                   # this week (Monday), the one all the "this week" numbers are about
        "children_registered": len(children),
        "children_active_week": len(active_ids),
        "activities_week": week_runs,
        "practice_minutes_week": round(week_minutes),
        "activities_per_day": per_day,          # Monday ... Sunday
        "children": rows,
    }


def child_detail(therapist_id: int, child_id: int) -> dict | None:
    with db() as con:
        child = con.execute("SELECT * FROM children WHERE id = ? AND therapist_id = ?", (child_id, therapist_id)).fetchone()
        if not child:
            return None
        all_runs = _finished_runs(con, child_id)
        attempts = _attempts_of(con, child_id)
    runs = sorted(all_runs, key=lambda r: r["id"], reverse=True)[:20]

    monday = _monday().isoformat()
    runs_week = [r for r in all_runs if _day(r["finished_at"]) >= monday]
    week = {
        "start": monday,
        "activities": len(runs_week),
        "practice_minutes": round(sum(_run_minutes(r) for r in runs_week)),
        "practice_days": len({day for day in map(_day, (a["created_at"] for a in attempts)) if day >= monday}),
    }

    # Per category (e.g. hidden_requests): how many of its scenes the child has finished at least once
    # (found the hidden meaning, or Pip explained it).
    done = {(a["story_id"], a["scene_id"]) for a in attempts if a["is_correct"] or a["outcome"] == "reveal"}
    categories: dict[str, dict] = {}
    for story_id, story in _story_scenes().items():
        cat = categories.setdefault(story["category"], {"category": story["category"], "done": 0, "total": 0})
        cat["total"] += len(story["scenes"])
        cat["done"] += sum(1 for scene in story["scenes"] if (story_id, scene) in done)

    scenes: dict[str, dict] = {}
    for a in attempts:
        s = scenes.setdefault(a["scene_id"], {"scene_id": a["scene_id"], "tries": 0, "first_try": 0, "played": 0})
        s["tries"] += 1
        if a["attempt_number"] == 1:
            s["played"] += 1
            s["first_try"] += a["is_correct"]

    recent = sorted(attempts, key=lambda a: a["id"], reverse=True)[:30]
    recent_fields = ("scene_id", "choice", "is_correct", "attempt_number", "outcome", "pip_said", "language", "created_at")
    return {
        "child": {"id": child["id"], "name": child["name"], "age": child["age"], "code": child["code"],
                  "created_at": child["created_at"], **_plan(child)},
        "progress": child_progress(child_id),
        "week": week,
        "last_active": max((a["created_at"] for a in attempts), default=None),
        "categories": list(categories.values()),
        "runs": [{"story_id": r["story_id"], "language": r["language"], "finished_at": r["finished_at"],
                  "tables": r["scenes_total"], "first_try": r["scenes_first_try"], "solved": r["scenes_solved"],
                  "attempts": r["total_attempts"], "xp": r["xp_earned"]} for r in runs],
        "scenes": [{"scene_id": s["scene_id"], "times_played": s["played"], "tries": s["tries"],
                    "first_try": s["first_try"],
                    "first_try_rate": round(100 * s["first_try"] / s["played"]) if s["played"] else None}
                   for s in sorted(scenes.values(), key=lambda s: s["scene_id"])],
        "recent_attempts": [{k: a[k] for k in recent_fields} for a in recent],
    }
