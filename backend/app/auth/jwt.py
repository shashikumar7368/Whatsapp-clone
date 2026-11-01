"""
app/auth/jwt.py
---------------
JWT access and refresh token creation and verification.
Uses PyJWT (pure Python — no Rust compilation required).
"""

from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from jwt.exceptions import InvalidTokenError

from app.config import settings


# ──────────────────────────── Token Creation ──────────────────────────────────

def create_access_token(data: dict) -> str:
    """Create short-lived JWT access token (15 minutes)."""
    payload = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload.update({"exp": expire, "type": "access"})
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(data: dict) -> str:
    """Create long-lived JWT refresh token (7 days)."""
    payload = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    payload.update({"exp": expire, "type": "refresh"})
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


# ──────────────────────────── Token Verification ──────────────────────────────

def verify_token(token: str, token_type: str = "access") -> Optional[dict]:
    """
    Decode and verify a JWT token.
    Returns the payload dict on success, None on failure.
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        if payload.get("type") != token_type:
            return None
        return payload
    except InvalidTokenError:
        return None
