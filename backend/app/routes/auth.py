"""
app/routes/auth.py
------------------
Authentication routes: signup, login, token refresh, logout.
"""

from fastapi import APIRouter, Depends, Response, Cookie, HTTPException, status
from typing import Optional

from app.schemas.auth_schema import SignupRequest, LoginRequest
from app.services.auth_service import register_user, authenticate_user
from app.auth.jwt import verify_token, create_access_token
from app.database.connection import get_db
from app.config import settings

router = APIRouter()


@router.post("/signup", status_code=201)
async def signup(data: SignupRequest, db=Depends(get_db)):
    """Register a new user account."""
    result = await register_user(data, db)
    return {**result, "message": "Account created successfully"}


@router.post("/login")
async def login(data: LoginRequest, response: Response, db=Depends(get_db)):
    """Authenticate user and issue JWT tokens."""
    result = await authenticate_user(data, db)

    # Set refresh token as HttpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=result.pop("refresh_token"),
        httponly=True,
        secure=False,         # Set True in production (HTTPS)
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
    )
    return result


@router.post("/refresh")
async def refresh_token(
    refresh_token: Optional[str] = Cookie(None),
    db=Depends(get_db),
):
    """Issue a new access token using the refresh token cookie."""
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token missing")

    payload = verify_token(refresh_token, token_type="refresh")
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    new_access = create_access_token({"sub": payload["sub"]})
    return {
        "access_token": new_access,
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    }


@router.post("/logout")
async def logout(response: Response):
    """Clear the refresh token cookie."""
    response.delete_cookie("refresh_token")
    return {"message": "Logged out successfully"}
