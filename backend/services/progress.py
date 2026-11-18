"""
Progress and statistics, all calculated from what the child actually did (tables attempts + story_runs).

For the child (friendly, "small steps, not scores"):
    XP for every table completed (more when found on the first try), levels every 100 XP, badges.
For the therapist:
    activities, practice days and time, how often the hidden meaning was found on the first try, per scene.
"""

from datetime import date, datetime, timedelta, timezone

from database import db

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
    return datetime.strptime(ts[:19], "%Y-%m-%d %H:%M:%S") if ts else None


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


def record_attempt(child_id, run_id, story_id, scene_id, language, choice, is_correct, attempt_number, outcome, pip_said):
    with db() as con:
        if run_id is not None and not con.execute(
                "SELECT 1 FROM story_runs WHERE id = ? AND child_id = ?", (run_id, child_id)).fetchone():
            run_id = None          # not this child's run: still save the attempt, without the run
        con.execute(
            "INSERT INTO attempts (child_id, run_id, story_id, scene_id, language, choice, is_correct,"
            " attempt_number, outcome, pip_said) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
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
    rows = con.execute("SELECT scene_id, attempt_number, is_correct, outcome FROM attempts WHERE run_id = ? ORDER BY id",
                       (run_id,)).fetchall()
    scenes: dict[str, dict] = {}
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
        run = con.execute("SELECT * FROM story_runs WHERE id = ? AND child_id = ?", (run_id, child_id)).fetchone()
        if not run:
            return None
        summary = summarize(_run_results(con, run_id), total_scenes)
        con.execute(
            "UPDATE story_runs SET finished_at = datetime('now'), scenes_total = ?, scenes_first_try = ?,"
            " scenes_solved = ?, total_attempts = ?, xp_earned = ? WHERE id = ?",
            (total_scenes, summary["first_try"], summary["solved"], summary["attempts"], summary["xp_earned"], run_id),
        )
        return summary


# ---------------------------------------------------------------- the child's progress
def _measures(con, child_id: int) -> dict:
    runs = con.execute("SELECT * FROM story_runs WHERE child_id = ? AND finished_at IS NOT NULL", (child_id,)).fetchall()
    days = {r["created_at"][:10] for r in con.execute("SELECT created_at FROM attempts WHERE child_id = ?", (child_id,))}
    minutes = 0.0
    for r in runs:
        start, end = _parse(r["started_at"]), _parse(r["finished_at"])
        if start and end:
            minutes += min(max((end - start).total_seconds() / 60, 0), 60)
    return {
        "xp": sum(r["xp_earned"] for r in runs),
        "stories_completed": len(runs),
        "secret_messages": sum(r["scenes_solved"] for r in runs),
        "perfect_stories": sum(1 for r in runs if r["scenes_total"] and r["scenes_first_try"] == r["scenes_total"]),
        "active_days": len(days),
        "practice_minutes": round(minutes),
        "days": days,
    }


def _week(days: set[str], today: date | None = None) -> list[dict]:
    today = today or datetime.now(timezone.utc).date()
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
        m = _measures(con, child_id)
    badges = []
    for b in BADGES:
        value = m[b["measure"]]
        badges.append({"id": b["id"], "title": b["title"][lang], "description": b["description"][lang],
                       "progress": min(value, b["target"]), "target": b["target"], "earned": value >= b["target"]})
    week = _week(m["days"])
    streak = 0
    for d in reversed([w for w in week if w["date"] <= datetime.now(timezone.utc).date().isoformat()]):
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
def therapist_overview(therapist_id: int) -> dict:
    today = datetime.now(timezone.utc).date()
    monday = (today - timedelta(days=today.weekday())).isoformat()
    with db() as con:
        children = con.execute("SELECT * FROM children WHERE therapist_id = ? ORDER BY name COLLATE NOCASE",
                               (therapist_id,)).fetchall()
        rows, per_day, active_ids, week_runs, week_minutes = [], [0] * 7, set(), 0, 0.0
        for c in children:
            m = _measures(con, c["id"])
            runs_week = con.execute(
                "SELECT * FROM story_runs WHERE child_id = ? AND finished_at IS NOT NULL AND finished_at >= ?",
                (c["id"], monday)).fetchall()
            for r in runs_week:
                per_day[_parse(r["finished_at"]).weekday()] += 1
                start, end = _parse(r["started_at"]), _parse(r["finished_at"])
                week_minutes += min(max((end - start).total_seconds() / 60, 0), 60)
            if runs_week or any(d >= monday for d in m["days"]):
                active_ids.add(c["id"])
            week_runs += len(runs_week)
            stats = con.execute(
                "SELECT COUNT(*) AS n, SUM(scenes_first_try) AS first, SUM(scenes_total) AS total"
                " FROM story_runs WHERE child_id = ? AND finished_at IS NOT NULL", (c["id"],)).fetchone()
            last = con.execute("SELECT MAX(created_at) AS last FROM attempts WHERE child_id = ?", (c["id"],)).fetchone()
            rows.append({
                "id": c["id"], "name": c["name"], "age": c["age"], "code": c["code"],
                "stories_completed": m["stories_completed"], "activities_week": len(runs_week),
                "secret_messages": m["secret_messages"],
                "first_try_rate": round(100 * (stats["first"] or 0) / stats["total"]) if stats["total"] else None,
                "level": m["xp"] // XP_PER_LEVEL + 1,
                "practice_minutes": m["practice_minutes"],
                "last_active": last["last"],
            })
    return {
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
        runs = con.execute(
            "SELECT * FROM story_runs WHERE child_id = ? AND finished_at IS NOT NULL ORDER BY id DESC LIMIT 20",
            (child_id,)).fetchall()
        scene_rows = con.execute(
            "SELECT scene_id, COUNT(*) AS tries, SUM(is_correct) AS correct,"
            " SUM(CASE WHEN attempt_number = 1 AND is_correct = 1 THEN 1 ELSE 0 END) AS first_try,"
            " SUM(CASE WHEN attempt_number = 1 THEN 1 ELSE 0 END) AS played"
            " FROM attempts WHERE child_id = ? GROUP BY scene_id ORDER BY scene_id", (child_id,)).fetchall()
        recent = con.execute(
            "SELECT scene_id, choice, is_correct, attempt_number, outcome, pip_said, language, created_at"
            " FROM attempts WHERE child_id = ? ORDER BY id DESC LIMIT 30", (child_id,)).fetchall()
    return {
        "child": {"id": child["id"], "name": child["name"], "age": child["age"], "code": child["code"],
                  "created_at": child["created_at"]},
        "progress": child_progress(child_id),
        "runs": [{"story_id": r["story_id"], "language": r["language"], "finished_at": r["finished_at"],
                  "tables": r["scenes_total"], "first_try": r["scenes_first_try"], "solved": r["scenes_solved"],
                  "attempts": r["total_attempts"], "xp": r["xp_earned"]} for r in runs],
        "scenes": [{"scene_id": s["scene_id"], "times_played": s["played"], "tries": s["tries"],
                    "first_try": s["first_try"],
                    "first_try_rate": round(100 * s["first_try"] / s["played"]) if s["played"] else None}
                   for s in scene_rows],
        "recent_attempts": [dict(r) for r in recent],
    }
