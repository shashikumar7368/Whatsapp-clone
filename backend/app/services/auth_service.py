"""
app/services/auth_service.py
-----------------------------
Business logic for user authentication: registration, login, token generation.
"""

from bson import ObjectId
from datetime import datetime, timezone
from fastapi import HTTPException, status

from app.auth.hashing import hash_password, verify_password
from app.auth.jwt import create_access_token, create_refresh_token
from app.schemas.auth_schema import SignupRequest, LoginRequest
from app.config import settings


async def register_user(data: SignupRequest, db) -> dict:
    """Register a new user. Raises 409 if email or phone already exists."""
    # Check for duplicate email or phone
    existing = await db.users.find_one(
        {"$or": [{"email": data.email}, {"phone": data.phone}]}
    )
    if existing:
        field = "Email" if existing.get("email") == data.email else "Phone"
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"{field} already registered",
        )

    now = datetime.now(timezone.utc)
    user_doc = {
        "name": data.name,
        "email": data.email,
        "phone": data.phone,
        "password_hash": hash_password(data.password),
        "about": "Hey there! I am using WhatsApp.",
        "profile_picture": None,
        "is_online": False,
        "last_seen": now,
        "created_at": now,
    }
    result = await db.users.insert_one(user_doc)
    return {
        "user_id": str(result.inserted_id),
        "name": data.name,
        "email": data.email,
    }


async def authenticate_user(data: LoginRequest, db) -> dict:
    """
    Verify credentials and return JWT access + refresh tokens.
    Raises 401 on invalid credentials.
    """
    user = await db.users.find_one({"email": data.email})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    user_id = str(user["_id"])
    token_data = {"sub": user_id}

    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    # Mark user as online
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"is_online": True}},
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": {
            "user_id": user_id,
            "name": user["name"],
            "profile_picture": user.get("profile_picture"),
        },
    }
