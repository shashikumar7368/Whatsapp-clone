"""
app/services/channel_service.py
---------------------------------
Business logic for creating, discovering, and following channels.
"""

from bson import ObjectId
from datetime import datetime, timezone
import secrets


async def create_channel(user_id: str, data: dict, db) -> dict:
    """Create a new channel owned by the current user."""
    invite_token = secrets.token_urlsafe(8)
    now = datetime.now(timezone.utc)
    channel_doc = {
        "name": data.get("name"),
        "description": data.get("description"),
        "icon_url": None,
        "created_by": ObjectId(user_id),
        "subscriber_count": 0,
        "is_verified": False,
        "category": data.get("category"),
        "invite_link": f"https://wa-clone.app/channel/{invite_token}",
        "created_at": now,
    }
    result = await db.channels.insert_one(channel_doc)
    return {
        "channel_id": str(result.inserted_id),
        "invite_link": channel_doc["invite_link"],
    }


async def list_channels(user_id: str, followed_only: bool, category: str, db) -> list:
    """Discover channels with optional filters."""
    query = {}
    if category:
        query["category"] = category

    cursor = db.channels.find(query).sort("subscriber_count", -1).limit(50)
    channels = await cursor.to_list(length=50)

    # Get channels followed by this user
    followed_cursor = db.channel_followers.find({"user_id": ObjectId(user_id)})
    followed_docs = await followed_cursor.to_list(length=500)
    followed_ids = {str(f["channel_id"]) for f in followed_docs}

    result = []
    for ch in channels:
        ch_id = str(ch["_id"])
        is_following = ch_id in followed_ids
        if followed_only and not is_following:
            continue
        result.append(
            {
                "channel_id": ch_id,
                "name": ch["name"],
                "description": ch.get("description"),
                "icon_url": ch.get("icon_url"),
                "subscriber_count": ch.get("subscriber_count", 0),
                "is_verified": ch.get("is_verified", False),
                "is_following": is_following,
                "category": ch.get("category"),
            }
        )
    return result


async def follow_unfollow(user_id: str, channel_id: str, action: str, db) -> str:
    """Follow or unfollow a channel."""
    u_oid = ObjectId(user_id)
    c_oid = ObjectId(channel_id)
    now = datetime.now(timezone.utc)

    channel = await db.channels.find_one({"_id": c_oid})
    if not channel:
        return None

    if action == "follow":
        try:
            await db.channel_followers.insert_one(
                {"channel_id": c_oid, "user_id": u_oid,
                 "notifications_enabled": True, "followed_at": now}
            )
            await db.channels.update_one(
                {"_id": c_oid}, {"$inc": {"subscriber_count": 1}}
            )
        except Exception:
            pass  # Already followed — ignore duplicate key error
        return f"Now following {channel['name']}"
    else:
        await db.channel_followers.delete_one(
            {"channel_id": c_oid, "user_id": u_oid}
        )
        await db.channels.update_one(
            {"_id": c_oid}, {"$inc": {"subscriber_count": -1}}
        )
        return f"Unfollowed {channel['name']}"
