"""
app/services/status_service.py
--------------------------------
Business logic for posting and reading user status updates.
"""

from bson import ObjectId
from datetime import datetime, timezone, timedelta


async def post_status(user_id: str, data: dict, db) -> dict:
    """Create a new status document that expires in 24 hours (handled by TTL index)."""
    now = datetime.now(timezone.utc)
    status_doc = {
        "user_id": ObjectId(user_id),
        "type": data.get("type", "text"),
        "content": data.get("content", ""),
        "background_color": data.get("background_color", "#128C7E"),
        "media_url": data.get("media_url"),
        "viewers": [],
        "created_at": now,
        "expires_at": now + timedelta(hours=24),
    }
    result = await db.statuses.insert_one(status_doc)
    return {
        "status_id": str(result.inserted_id),
        "expires_at": status_doc["expires_at"],
    }


async def get_contact_statuses(user_id: str, db) -> list:
    """
    Fetch statuses from all contacts of the current user.
    Groups multiple statuses per contact into one feed entry.
    """
    u_oid = ObjectId(user_id)

    # Get contact user IDs
    contact_cursor = db.contacts.find({"owner_id": u_oid})
    contacts = await contact_cursor.to_list(length=500)
    contact_ids = [c["contact_user_id"] for c in contacts]

    feed = []
    for contact_id in contact_ids:
        statuses_cursor = db.statuses.find(
            {"user_id": contact_id}
        ).sort("created_at", -1)
        statuses = await statuses_cursor.to_list(length=10)

        if not statuses:
            continue

        user = await db.users.find_one({"_id": contact_id})
        if not user:
            continue

        latest = statuses[0]
        viewed_by_me = any(
            str(v.get("user_id")) == user_id for v in latest.get("viewers", [])
        )

        feed.append(
            {
                "user": {
                    "user_id": str(user["_id"]),
                    "name": user["name"],
                    "profile_picture": user.get("profile_picture"),
                },
                "latest_status": {
                    "status_id": str(latest["_id"]),
                    "type": latest["type"],
                    "content": latest["content"],
                    "background_color": latest.get("background_color"),
                    "created_at": latest["created_at"],
                    "viewer_count": len(latest.get("viewers", [])),
                    "viewed_by_me": viewed_by_me,
                },
                "total_updates": len(statuses),
            }
        )
    return feed
