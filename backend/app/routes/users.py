"""
app/routes/users.py
--------------------
User profile routes: get self, search users, update profile.
"""

from fastapi import APIRouter, Depends, Query
from app.auth.dependencies import get_current_user
from app.database.connection import get_db
from app.schemas.user_schema import UserUpdateRequest

router = APIRouter()


def _format_user(user: dict) -> dict:
    return {
        "user_id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "phone": user["phone"],
        "about": user.get("about", ""),
        "profile_picture": user.get("profile_picture"),
        "is_online": user.get("is_online", False),
        "last_seen": user.get("last_seen"),
    }


@router.get("/me")
async def get_me(current_user=Depends(get_current_user)):
    """Return the authenticated user's profile."""
    return _format_user(current_user)


@router.get("")
async def search_users(
    query: str = Query(..., min_length=1),
    limit: int = Query(20, le=50),
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    """Search users by name, email, or phone (case-insensitive partial match)."""
    import re
    pattern = re.compile(query, re.IGNORECASE)
    cursor = db.users.find({
        "$or": [
            {"name": {"$regex": pattern}},
            {"email": {"$regex": pattern}},
            {"phone": {"$regex": pattern}},
        ]
    }).limit(limit)
    users = await cursor.to_list(length=limit)
    return {"users": [_format_user(u) for u in users if str(u["_id"]) != str(current_user["_id"])]}


@router.put("/me")
async def update_profile(
    data: UserUpdateRequest,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    """Update the authenticated user's profile fields."""
    update_data = data.model_dump(exclude_none=True)
    if not update_data:
        return _format_user(current_user)

    await db.users.update_one(
        {"_id": current_user["_id"]}, {"$set": update_data}
    )
    updated = await db.users.find_one({"_id": current_user["_id"]})
    return _format_user(updated)
