"""The HTTP API of accounts and the dashboard (routers/accounts.py): URLs, who may call them, status codes.
The rules behind them (passwords, codes, statistics) are tested in test_accounts.py and test_progress.py.
The story endpoints that call the LLM are not tested here."""

import pytest
from conftest import PASSWORD

THERAPIST = {"full_name": "Dr. Emma", "practice": "Little Steps", "email": "emma@littlesteps.it", "password": PASSWORD}


def auth(token):
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def therapist_token(client):
    return client.post("/api/auth/register", json=THERAPIST).json()["token"]


@pytest.fixture
def child(client, therapist_token):
    """A child of Dr. Emma, logged in: {"id", "code", "token"}."""
    created = client.post("/api/children", json={"name": "Dan", "age": "8"}, headers=auth(therapist_token)).json()
    token = client.post("/api/auth/child-login", json={"code": created["code"]}).json()["token"]
    return {"id": created["id"], "code": created["code"], "token": token}


@pytest.fixture
def other_therapist_token(client):
    return client.post("/api/auth/register", json={**THERAPIST, "email": "luca@littlesteps.it"}).json()["token"]


# ---------------------------------------------------------------- logging in and out
def test_register_creates_the_account_and_logs_in(client):
    response = client.post("/api/auth/register", json=THERAPIST)
    assert response.status_code == 201
    body = response.json()
    assert body["role"] == "therapist"
    assert client.get("/api/me", headers=auth(body["token"])).json()["therapist"]["email"] == THERAPIST["email"]


def test_register_twice_says_why(client):
    client.post("/api/auth/register", json=THERAPIST)
    response = client.post("/api/auth/register", json=THERAPIST)
    assert response.status_code == 409
    assert response.json() == {"detail": "This email is already registered. Please log in."}


def test_register_with_missing_fields_is_rejected(client):
    assert client.post("/api/auth/register", json={"email": "emma@littlesteps.it"}).status_code == 422


def test_therapist_login(client, therapist_token):
    good = client.post("/api/auth/login", json={"email": THERAPIST["email"], "password": PASSWORD})
    bad = client.post("/api/auth/login", json={"email": THERAPIST["email"], "password": "wrong-password-1"})
    assert good.status_code == 200 and good.json()["token"]
    assert bad.status_code == 401
    assert bad.json() == {"detail": "Email or password is not correct."}


def test_child_login(client, child):
    good = client.post("/api/auth/child-login", json={"code": child["code"].lower()})
    bad = client.post("/api/auth/child-login", json={"code": "XYZ123"})
    assert good.status_code == 200 and good.json()["child"]["id"] == child["id"]
    assert bad.status_code == 401


def test_logout_ends_the_login(client, therapist_token):
    assert client.post("/api/auth/logout", headers=auth(therapist_token)).status_code == 200
    assert client.get("/api/me", headers=auth(therapist_token)).status_code == 401


def test_logout_without_a_login_is_fine(client):
    assert client.post("/api/auth/logout").json() == {"ok": True}


# ---------------------------------------------------------------- whoever is logged in
@pytest.mark.parametrize("headers", [{}, {"Authorization": "Bearer nonsense"}, {"Authorization": "Basic abc"}])
def test_me_needs_a_valid_login(client, headers):
    response = client.get("/api/me", headers=headers)
    assert response.status_code == 401
    assert response.json() == {"detail": "Please log in again."}


def test_me_as_therapist(client, therapist_token):
    body = client.get("/api/me", headers=auth(therapist_token)).json()
    assert body["role"] == "therapist"
    assert body["therapist"]["display_name"] == "Dr. Emma"
    assert "token" not in body


def test_me_as_child_is_light(client, child):
    body = client.get("/api/me", headers=auth(child["token"])).json()
    assert body["role"] == "child"
    assert body["child"]["id"] == child["id"]
    assert body["therapist"] == {"display_name": "Dr. Emma", "practice": "Little Steps"}
    assert "progress" not in body and "token" not in body


def test_child_progress(client, child, therapist_token):
    response = client.get("/api/me/progress?language=it", headers=auth(child["token"]))
    assert response.status_code == 200
    assert response.json()["level"] == 1
    assert response.json()["badges"][0]["title"] == "Primi passi"
    assert client.get("/api/me/progress", headers=auth(therapist_token)).status_code == 403
    assert client.get("/api/me/progress").status_code == 401


def test_child_profile(client, child, therapist_token):
    response = client.put("/api/me/profile", json={"nickname": "Danny", "pip": "milo"}, headers=auth(child["token"]))
    assert response.status_code == 200
    assert (response.json()["nickname"], response.json()["pip"]) == ("Danny", "milo")
    bad_pip = client.put("/api/me/profile", json={"nickname": "Danny", "pip": "dragon"}, headers=auth(child["token"]))
    assert bad_pip.status_code == 400
    assert client.put("/api/me/profile", json={"nickname": "Danny"}, headers=auth(therapist_token)).status_code == 403


# ---------------------------------------------------------------- the therapist's children
def test_children_are_only_for_therapists(client, child):
    assert client.get("/api/children").status_code == 401
    assert client.get("/api/children", headers=auth(child["token"])).status_code == 403
    assert client.post("/api/children", json={"name": "Bea"}, headers=auth(child["token"])).status_code == 403


def test_add_and_list_children(client, therapist_token):
    response = client.post("/api/children", json={"name": "Bea", "age": "7"}, headers=auth(therapist_token))
    assert response.status_code == 201
    assert response.json()["code"].startswith("PIP")
    listed = client.get("/api/children", headers=auth(therapist_token)).json()
    assert [c["name"] for c in listed["children"]] == ["Bea"]
    assert listed["therapist"]["display_name"] == "Dr. Emma"


def test_one_childs_statistics(client, child, therapist_token, other_therapist_token):
    response = client.get(f"/api/children/{child['id']}", headers=auth(therapist_token))
    assert response.status_code == 200
    assert response.json()["child"]["code"] == child["code"]
    assert client.get(f"/api/children/{child['id']}", headers=auth(other_therapist_token)).status_code == 404
    assert client.get("/api/children/999", headers=auth(therapist_token)).status_code == 404
    assert client.get(f"/api/children/{2**63}", headers=auth(therapist_token)).status_code == 422


def test_patch_changes_only_what_is_sent(client, child, therapist_token):
    url = f"/api/children/{child['id']}"
    first = client.patch(url, json={"weekly_goal": 5}, headers=auth(therapist_token))
    assert first.status_code == 200
    assert (first.json()["support_level"], first.json()["weekly_goal"]) == ("Guided", 5)
    second = client.patch(url, json={"support_level": "Independent"}, headers=auth(therapist_token))
    assert (second.json()["support_level"], second.json()["weekly_goal"]) == ("Independent", 5)
    unchanged = client.patch(url, json={}, headers=auth(therapist_token))
    assert (unchanged.json()["support_level"], unchanged.json()["weekly_goal"]) == ("Independent", 5)


@pytest.mark.parametrize(("body", "status"), [
    ({"support_level": "Expert"}, 400),
    ({"weekly_goal": 9}, 400),
    ({"weekly_goal": "often"}, 422),
])
def test_patch_rejects_bad_values(client, child, therapist_token, body, status):
    assert client.patch(f"/api/children/{child['id']}", json=body, headers=auth(therapist_token)).status_code == status


def test_patch_another_therapists_child(client, child, other_therapist_token):
    response = client.patch(f"/api/children/{child['id']}", json={"weekly_goal": 2}, headers=auth(other_therapist_token))
    assert response.status_code == 404


def test_reset_code_logs_the_child_out(client, child, therapist_token):
    response = client.post(f"/api/children/{child['id']}/reset-code", headers=auth(therapist_token))
    assert response.status_code == 200
    assert response.json()["code"] != child["code"]
    assert client.get("/api/me", headers=auth(child["token"])).status_code == 401


# ---------------------------------------------------------------- the API's shape
@pytest.mark.parametrize(("method", "url"), [
    ("post", "/api/therapists/register"),
    ("post", "/api/therapists/login"),
    ("post", "/api/children/login"),
    ("post", "/api/logout"),
    ("get", "/api/progress"),
    ("put", "/api/profile"),
    ("put", "/api/children/1/plan"),
])
def test_old_urls_are_gone(client, method, url):
    assert client.request(method.upper(), url, json={}).status_code in (404, 405)


def test_docs_have_the_authorize_button(client):
    schema = client.get("/openapi.json").json()
    assert schema["components"]["securitySchemes"]["HTTPBearer"]["scheme"] == "bearer"


def test_story_list_is_only_for_therapists(client, child, therapist_token):
    assert client.get("/api/stories").status_code == 401
    assert client.get("/api/stories", headers=auth(child["token"])).status_code == 403
    stories = client.get("/api/stories", headers=auth(therapist_token)).json()["stories"]
    assert stories[0]["id"] == "the_secret_message"
