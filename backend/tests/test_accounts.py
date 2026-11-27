"""Accounts: therapists (email + password), children (login code), tokens. See services/accounts.py."""

import re

import pytest
from conftest import PASSWORD, make_child, make_therapist

import database
from services import accounts
from services.accounts import AccountError


def bearer(token):
    return f"Bearer {token}"


# ---------------------------------------------------------------- passwords
def test_password_hash_checks_the_right_password_only():
    stored = accounts.hash_password(PASSWORD)
    assert PASSWORD not in stored
    assert accounts.check_password(PASSWORD, stored)
    assert not accounts.check_password("another-password-1", stored)


def test_same_password_gets_a_different_hash_each_time():
    assert accounts.hash_password(PASSWORD) != accounts.hash_password(PASSWORD)


@pytest.mark.parametrize("stored", ["", "nonsense", "pbkdf2_sha256$x$zz$00"])
def test_a_broken_stored_hash_never_matches(stored):
    assert not accounts.check_password(PASSWORD, stored)


# ---------------------------------------------------------------- therapists
def test_register_logs_the_therapist_in():
    result = accounts.register_therapist(" Dr. Emma ", "", " Emma@LittleSteps.IT ", PASSWORD, practice="Little Steps")
    assert result["role"] == "therapist"
    assert result["token"]
    therapist = result["therapist"]
    assert therapist["email"] == "emma@littlesteps.it"      # trimmed and lower case
    assert therapist["full_name"] == "Dr. Emma"
    assert therapist["display_name"] == "Dr. Emma"          # empty display name -> the full name
    assert "password_hash" not in therapist
    assert accounts.user_from_token(bearer(result["token"]))["therapist"]["id"] == therapist["id"]


@pytest.mark.parametrize(("email", "password", "name", "message"), [
    ("not-an-email", PASSWORD, "Emma", "valid email"),
    ("emma@example.com", "short-1", "Emma", "12 characters"),
    ("emma@example.com", "long-enough-but-no-digit", "Emma", "12 characters"),
    ("emma@example.com", PASSWORD, "   ", "your name"),
])
def test_register_rejects_bad_data(email, password, name, message):
    with pytest.raises(AccountError, match=message) as error:
        accounts.register_therapist(name, "", email, password)
    assert error.value.status == 400


def test_an_email_can_only_be_registered_once():
    make_therapist("emma@littlesteps.it")
    with pytest.raises(AccountError, match="already registered") as error:
        make_therapist("EMMA@littlesteps.it")
    assert error.value.status == 409


def test_login_with_email_and_password():
    registered = make_therapist()
    result = accounts.login_therapist("  EMMA@littlesteps.it ", PASSWORD)
    assert result["therapist"]["id"] == registered["therapist"]["id"]
    assert result["token"] != registered["token"]           # every login gets its own token


@pytest.mark.parametrize(("email", "password"), [
    ("emma@littlesteps.it", "wrong-password-1"),
    ("nobody@littlesteps.it", PASSWORD),
    ("", ""),
])
def test_login_fails_with_the_same_message(email, password):
    make_therapist()
    with pytest.raises(AccountError, match="Email or password is not correct") as error:
        accounts.login_therapist(email, password)
    assert error.value.status == 401


# ---------------------------------------------------------------- children and their codes
def test_a_new_child_gets_a_code_of_six_characters():
    therapist = make_therapist()["therapist"]
    child = accounts.create_child(therapist["id"], "  Dan  ", " 8 ", "parent@example.com")
    assert re.fullmatch(r"PIP\d{3}", child["code"])
    assert child["name"] == "Dan"
    assert child["age"] == "8"
    assert child["therapist_id"] == therapist["id"]
    assert (child["nickname"], child["pip"], child["support_level"], child["weekly_goal"]) == ("", "", "Guided", 3)


def test_very_long_names_are_cut_to_40_characters():
    therapist = make_therapist()["therapist"]
    assert len(make_child(therapist["id"], "A" * 100)["name"]) == 40


def test_a_child_needs_a_name():
    therapist = make_therapist()["therapist"]
    with pytest.raises(AccountError, match="first name"):
        make_child(therapist["id"], "   ")


def test_every_child_gets_a_different_code():
    therapist = make_therapist()["therapist"]
    codes = {make_child(therapist["id"], f"Child {i}")["code"] for i in range(50)}
    assert len(codes) == 50


def test_no_new_code_when_all_1000_are_taken():
    therapist = make_therapist()["therapist"]
    with database.db() as con:
        con.executemany("INSERT INTO children (therapist_id, name, code) VALUES (?, 'x', ?)",
                        [(therapist["id"], f"PIP{n:03d}") for n in range(1000)])
    with pytest.raises(AccountError, match="1000") as error:
        make_child(therapist["id"])
    assert error.value.status == 409


@pytest.mark.parametrize("typed", ["{code}", "{lower}", " {lower} ", "{dashed}"])
def test_child_logs_in_with_their_code_however_it_is_typed(typed):
    therapist = make_therapist()["therapist"]
    child = make_child(therapist["id"])
    code = child["code"]
    result = accounts.login_child(typed.format(code=code, lower=code.lower(), dashed=f"{code[:3]}-{code[3:]}"))
    assert result["role"] == "child"
    assert result["child"]["id"] == child["id"]


def test_an_unknown_code_does_not_log_in():
    with pytest.raises(AccountError, match="couldn't find this code") as error:
        accounts.login_child("PIP999")
    assert error.value.status == 401


def test_a_new_code_logs_out_the_old_one():
    therapist = make_therapist()["therapist"]
    child = make_child(therapist["id"])
    old_login = accounts.login_child(child["code"])

    updated = accounts.reset_child_code(therapist["id"], child["id"])

    assert updated["code"] != child["code"]
    assert accounts.user_from_token(bearer(old_login["token"])) is None
    with pytest.raises(AccountError):
        accounts.login_child(child["code"])
    assert accounts.login_child(updated["code"])["child"]["id"] == child["id"]


def test_a_therapist_cannot_touch_another_therapists_child():
    emma = make_therapist("emma@littlesteps.it")["therapist"]
    luca = make_therapist("luca@littlesteps.it")["therapist"]
    child = make_child(emma["id"])
    for change in (lambda: accounts.reset_child_code(luca["id"], child["id"]),
                   lambda: accounts.update_child_plan(luca["id"], child["id"], "Supported", 5)):
        with pytest.raises(AccountError, match="Child not found") as error:
            change()
        assert error.value.status == 404


# ---------------------------------------------------------------- "Choose your Pip" and "Edit profile"
def test_child_chooses_nickname_and_pip():
    child = make_child(make_therapist()["therapist"]["id"])
    updated = accounts.update_child_profile(child["id"], "  Danny ", " MILO ")
    assert (updated["nickname"], updated["pip"]) == ("Danny", "milo")
    assert accounts.update_child_profile(child["id"], "Danny", "")["pip"] == ""     # no Pip chosen


@pytest.mark.parametrize(("nickname", "pip", "message"), [
    ("  ", "milo", "what to call you"),
    ("Danny", "dragon", "doesn't exist"),
])
def test_child_profile_rejects_bad_data(nickname, pip, message):
    child = make_child(make_therapist()["therapist"]["id"])
    with pytest.raises(AccountError, match=message):
        accounts.update_child_profile(child["id"], nickname, pip)


def test_therapist_sets_support_level_and_weekly_goal():
    therapist = make_therapist()["therapist"]
    child = make_child(therapist["id"])
    updated = accounts.update_child_plan(therapist["id"], child["id"], "Independent", 7)
    assert (updated["support_level"], updated["weekly_goal"]) == ("Independent", 7)


@pytest.mark.parametrize(("level", "goal", "message"), [
    ("Expert", 3, "support level"),
    ("Guided", 0, "between 1 and 7"),
    ("Guided", 8, "between 1 and 7"),
])
def test_plan_rejects_bad_values(level, goal, message):
    therapist = make_therapist()["therapist"]
    child = make_child(therapist["id"])
    with pytest.raises(AccountError, match=message):
        accounts.update_child_plan(therapist["id"], child["id"], level, goal)


def test_a_child_only_sees_the_name_and_practice_of_their_therapist():
    child = make_child(make_therapist()["therapist"]["id"])
    assert accounts.child_therapist(child["id"]) == {"display_name": "Dr. Emma", "practice": "Little Steps"}


# ---------------------------------------------------------------- tokens
@pytest.mark.parametrize("header", [None, "", "Bearer", "Bearer nonsense", "Token abc", "nonsense"])
def test_no_valid_token_means_not_logged_in(header):
    assert accounts.user_from_token(header) is None


def test_token_identifies_the_child():
    child = make_child(make_therapist()["therapist"]["id"])
    token = accounts.login_child(child["code"])["token"]
    user = accounts.user_from_token(f"bearer  {token} ")     # any case, extra spaces
    assert user["role"] == "child"
    assert user["child"]["id"] == child["id"]
    assert user["token"] == token


def test_logout_ends_only_that_login():
    make_therapist()
    first = accounts.login_therapist("emma@littlesteps.it", PASSWORD)["token"]
    second = accounts.login_therapist("emma@littlesteps.it", PASSWORD)["token"]
    accounts.logout(first)
    assert accounts.user_from_token(bearer(first)) is None
    assert accounts.user_from_token(bearer(second)) is not None
