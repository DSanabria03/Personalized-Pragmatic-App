"""Progress and statistics: XP, levels, badges, days and weeks (in Italian time), the therapist's dashboard.
See services/progress.py. "Today" is Wednesday 25 November 2026 (conftest.py); times in the database are UTC."""

import pytest
from conftest import MONDAY, add_attempt, add_run, make_child, make_therapist

import database
from services import progress

STORY = "the_secret_message"


@pytest.fixture
def therapist():
    return make_therapist()["therapist"]


@pytest.fixture
def child(therapist):
    return make_child(therapist["id"])


# ---------------------------------------------------------------- XP and results of one play-through
@pytest.mark.parametrize(("attempts", "solved", "xp"), [
    (1, True, 15),
    (2, True, 10),
    (3, True, 5),
    (3, False, 5),      # Pip explained it: trying counts too
    (1, False, 5),
])
def test_xp_for_a_scene(attempts, solved, xp):
    assert progress.xp_for_scene(attempts, solved) == xp


def test_summarize_results():
    results = [{"scene_id": "a", "attempts": 1, "solved": True},
               {"scene_id": "b", "attempts": 2, "solved": True},
               {"scene_id": "c", "attempts": 3, "solved": False}]
    assert progress.summarize(results, 4) == {"tables": 4, "tables_played": 3, "solved": 2, "first_try": 1,
                                              "attempts": 6, "xp_earned": 30}


def test_a_whole_play_through_is_saved(child):
    run = progress.start_run(child["id"], STORY, "en")
    clicks = [
        ("ready_to_order", True, 1, "correct"),
        ("spilled_water", False, 1, "hint"),
        ("spilled_water", True, 2, "correct"),
        ("waiting_for_the_bill", False, 1, "hint"),
        ("waiting_for_the_bill", False, 2, "hint"),
        ("waiting_for_the_bill", False, 3, "reveal"),
        ("waiting_for_the_bill", True, 4, "correct"),    # after Pip explained it: doesn't count any more
    ]
    for scene, correct, attempt, outcome in clicks:
        progress.record_attempt(child["id"], run, STORY, scene, "en", "A", correct, attempt, outcome, "…")

    summary = progress.finish_run(child["id"], run, 3)

    assert summary == {"tables": 3, "tables_played": 3, "solved": 2, "first_try": 1, "attempts": 6, "xp_earned": 30}
    with database.db() as con:
        saved = con.execute("SELECT * FROM story_runs WHERE id = ?", (run,)).fetchone()
    assert saved["finished_at"] is not None
    assert (saved["scenes_total"], saved["scenes_first_try"], saved["scenes_solved"], saved["total_attempts"],
            saved["xp_earned"]) == (3, 1, 2, 6, 30)


def test_a_child_cannot_use_another_childs_run(therapist, child):
    other = make_child(therapist["id"], "Bea")
    run = progress.start_run(other["id"], STORY, "en")

    assert progress.finish_run(child["id"], run, 3) is None

    progress.record_attempt(child["id"], run, STORY, "ready_to_order", "en", "A", True, 1, "correct", "")
    with database.db() as con:
        saved = con.execute("SELECT child_id, run_id FROM attempts").fetchone()
    assert (saved["child_id"], saved["run_id"]) == (child["id"], None)     # saved, but not in the other child's run


# ---------------------------------------------------------------- days in Italian time
@pytest.mark.parametrize(("utc", "day"), [
    ("2026-11-22 22:59:59", "2026-11-22"),     # winter, UTC+1
    ("2026-11-22 23:30:00", "2026-11-23"),
    ("2026-07-05 21:59:59", "2026-07-05"),     # summer, UTC+2
    ("2026-07-05 22:30:00", "2026-07-06"),
])
def test_days_are_counted_in_italian_time(utc, day):
    assert progress._day(utc) == day


@pytest.mark.parametrize(("start", "end", "minutes"), [
    ("2026-11-25 10:00:00", "2026-11-25 10:12:30", 12.5),
    ("2026-11-25 10:00:00", "2026-11-25 13:00:00", 60),      # a story left open counts 60 minutes at most
    ("2026-11-25 10:00:00", "2026-11-25 09:00:00", 0),
    ("2026-11-25 10:00:00", None, 0),
])
def test_minutes_of_a_run(start, end, minutes):
    assert progress._run_minutes({"started_at": start, "finished_at": end}) == minutes


# ---------------------------------------------------------------- the child's progress
def test_progress_of_a_child_who_never_played(child):
    p = progress.child_progress(child["id"])
    assert (p["xp"], p["level"], p["xp_in_level"], p["xp_per_level"]) == (0, 1, 0, 100)
    assert (p["stories_completed"], p["secret_messages"], p["active_days"], p["practice_minutes"]) == (0, 0, 0, 0)
    assert p["streak_days"] == 0
    assert [d["date"] for d in p["week"]] == [f"2026-11-{d}" for d in range(23, 30)]   # Monday to Sunday
    assert [d["today"] for d in p["week"]] == [False, False, True, False, False, False, False]
    assert not any(d["active"] for d in p["week"])
    assert not any(b["earned"] for b in p["badges"])


def test_week_and_streak_in_italian_time(child):
    add_attempt(child["id"], "2026-11-22 12:00:00")    # Sunday: last week
    add_attempt(child["id"], "2026-11-22 23:30:00")    # Sunday in UTC, already Monday 00:30 in Italy
    add_attempt(child["id"], "2026-11-24 10:00:00")    # Tuesday
    add_attempt(child["id"], "2026-11-25 09:00:00")    # Wednesday (today)

    p = progress.child_progress(child["id"])

    assert [d["active"] for d in p["week"]] == [True, True, True, False, False, False, False]
    assert p["streak_days"] == 3
    assert p["active_days"] == 4


def test_xp_level_and_badges(child):
    add_run(child["id"], "2026-11-23 10:00:00", "2026-11-23 10:10:00", first_try=3, solved=3, xp=45)   # perfect
    add_run(child["id"], "2026-11-24 10:00:00", "2026-11-24 10:20:00", first_try=1, solved=3, xp=70)
    add_run(child["id"], "2026-11-25 10:00:00", None, xp=99)                                          # not finished

    p = progress.child_progress(child["id"])

    assert (p["xp"], p["level"], p["xp_in_level"]) == (115, 2, 15)
    assert (p["stories_completed"], p["secret_messages"], p["practice_minutes"]) == (2, 6, 30)
    badges = {b["id"]: b for b in p["badges"]}
    assert badges["first_steps"]["earned"]
    assert badges["sharp_ears"]["earned"]
    assert not badges["secret_seeker"]["earned"]
    assert (badges["secret_seeker"]["progress"], badges["secret_seeker"]["target"]) == (6, 9)


@pytest.mark.parametrize(("language", "title"), [("it", "Primi passi"), ("en", "First steps"), ("fr", "First steps")])
def test_badges_in_the_childs_language(child, language, title):
    badges = progress.child_progress(child["id"], language)["badges"]
    assert badges[0]["title"] == title


# ---------------------------------------------------------------- the therapist's dashboard
def test_overview_of_this_week(therapist):
    dan = make_child(therapist["id"], "dan")
    bea = make_child(therapist["id"], "Bea")
    carl = make_child(therapist["id"], "Carl")
    other_therapist = make_therapist("luca@littlesteps.it")["therapist"]
    make_child(other_therapist["id"], "Not mine")

    # Dan: Monday 00:30 in Italy (Sunday in UTC), Wednesday, and one run last week
    add_run(dan["id"], "2026-11-22 23:20:00", "2026-11-22 23:30:00", first_try=3, solved=3)
    add_attempt(dan["id"], "2026-11-22 23:25:00")
    add_run(dan["id"], "2026-11-25 10:00:00", "2026-11-25 10:15:00", first_try=1, solved=2)
    add_attempt(dan["id"], "2026-11-25 10:05:00")
    add_run(dan["id"], "2026-11-20 10:00:00", "2026-11-20 10:05:00", first_try=2, solved=3)
    add_attempt(dan["id"], "2026-11-20 10:02:00")
    # Bea: only last week
    add_run(bea["id"], "2026-11-18 10:00:00", "2026-11-18 10:05:00", first_try=0, solved=3)
    add_attempt(bea["id"], "2026-11-18 10:02:00")

    o = progress.therapist_overview(therapist["id"])

    assert o["week_start"] == MONDAY
    assert (o["children_registered"], o["children_active_week"], o["activities_week"]) == (3, 1, 2)
    assert o["activities_per_day"] == [1, 0, 1, 0, 0, 0, 0]
    assert o["practice_minutes_week"] == 25
    assert [c["name"] for c in o["children"]] == ["Bea", "Carl", "dan"]       # by name, whatever the case
    rows = {c["id"]: c for c in o["children"]}
    assert (rows[dan["id"]]["activities_week"], rows[dan["id"]]["practice_days_week"]) == (2, 2)
    assert rows[dan["id"]]["first_try_rate"] == 67                           # 6 of 9 scenes
    assert rows[dan["id"]]["last_active"] == "2026-11-25 10:05:00"
    assert (rows[bea["id"]]["activities_week"], rows[bea["id"]]["first_try_rate"]) == (0, 0)
    assert (rows[carl["id"]]["first_try_rate"], rows[carl["id"]]["last_active"]) == (None, None)


def test_child_detail_is_only_for_their_therapist(child):
    other_therapist = make_therapist("luca@littlesteps.it")["therapist"]
    assert progress.child_detail(other_therapist["id"], child["id"]) is None


def test_child_detail(therapist, child):
    add_run(child["id"], "2026-11-22 23:20:00", "2026-11-22 23:30:00")       # Monday in Italy
    add_run(child["id"], "2026-11-20 10:00:00", "2026-11-20 10:30:00")       # last week
    # ready_to_order played twice: found on the first try once
    add_attempt(child["id"], "2026-11-20 10:01:00", scene="ready_to_order", correct=True, attempt=1)
    add_attempt(child["id"], "2026-11-22 23:21:00", scene="ready_to_order", correct=False, attempt=1)
    add_attempt(child["id"], "2026-11-22 23:22:00", scene="ready_to_order", correct=True, attempt=2)
    # spilled_water: only a hint so far (not finished); waiting_for_the_bill: Pip explained it
    add_attempt(child["id"], "2026-11-22 23:23:00", scene="spilled_water", correct=False, attempt=1)
    add_attempt(child["id"], "2026-11-22 23:24:00", scene="waiting_for_the_bill", correct=False, attempt=3,
                outcome="reveal")

    d = progress.child_detail(therapist["id"], child["id"])

    assert d["child"]["id"] == child["id"]
    assert d["week"] == {"start": MONDAY, "activities": 1, "practice_minutes": 10, "practice_days": 1}
    assert d["last_active"] == "2026-11-22 23:24:00"
    assert d["categories"] == [{"category": "hidden_requests", "done": 2, "total": 3}]
    scenes = {s["scene_id"]: s for s in d["scenes"]}
    assert scenes["ready_to_order"] == {"scene_id": "ready_to_order", "times_played": 2, "tries": 3, "first_try": 1,
                                        "first_try_rate": 50}
    assert scenes["waiting_for_the_bill"]["first_try_rate"] is None          # no first try recorded
    assert [a["created_at"] for a in d["recent_attempts"]][0] == "2026-11-22 23:24:00"   # newest first
    assert len(d["runs"]) == 2
