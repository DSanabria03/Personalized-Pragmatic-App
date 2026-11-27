"""
Who is calling? FastAPI dependencies shared by the routers.

After logging in, the browser sends its token with every request: "Authorization: Bearer <token>".
Use them as the type of an endpoint's parameter, and FastAPI does the check before the endpoint runs:

    def my_progress(child: CurrentChild): ...        # 401 if not logged in, 403 if it isn't a child

The token scheme is declared with HTTPBearer, so the "Authorize" button of http://localhost:8000/docs
can send it to every endpoint.
"""

from typing import Annotated

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from services import accounts

_bearer = HTTPBearer(auto_error=False, description="The token returned by a login.")


def optional_user(credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)]) -> dict | None:
    """{"role": "therapist" | "child", "token", "therapist" | "child": {...}}, or None if nobody is logged in."""
    if credentials is None:
        return None
    return accounts.user_from_token(f"Bearer {credentials.credentials}")


def current_user(user: Annotated[dict | None, Depends(optional_user)]) -> dict:
    if not user:
        raise HTTPException(401, "Please log in again.")
    return user


def current_therapist(user: Annotated[dict, Depends(current_user)]) -> dict:
    if user["role"] != "therapist":
        raise HTTPException(403, "Only for therapists.")
    return user["therapist"]


def current_child(user: Annotated[dict, Depends(current_user)]) -> dict:
    if user["role"] != "child":
        raise HTTPException(403, "Only for children.")
    return user["child"]


OptionalUser = Annotated[dict | None, Depends(optional_user)]
CurrentUser = Annotated[dict, Depends(current_user)]
CurrentTherapist = Annotated[dict, Depends(current_therapist)]
CurrentChild = Annotated[dict, Depends(current_child)]
