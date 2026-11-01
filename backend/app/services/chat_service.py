"""
app/services/chat_service.py
-----------------------------
Business logic for creating and listing chat threads.
"""

from bson import ObjectId
from datetime import datetime, timezone


async def get_or_create_chat(sender_id: str, recipient_id: str, db) -> str:
    """
    Find an existing private chat between two users, or create one.
    Returns the chat_id string.
    """
    s_oid = ObjectId(sender_id)
    r_oid = ObjectId(recipient_id)

    existing = await db.chats.find_one(
        {
            "chat_type": "private",
            "participants": {"$all": [s_oid, r_oid], "$size": 2},
        }
    )
    if existing:
        return str(existing["_id"])

    # Create new chat
    now = datetime.now(timezone.utc)
    result = await db.chats.insert_one(
        {
            "chat_type": "private",
            "participants": [s_oid, r_oid],
            "group_id": None,
            "last_message": None,
            "unread_count": {sender_id: 0, recipient_id: 0},
            "created_at": now,
            "updated_at": now,
        }
    )
    return str(result.inserted_id)


async def list_chats(user_id: str, db) -> list:
    """
    Return all chats for a user, sorted by most recent activity.
    Populates contact details for private chats.
    """
    u_oid = ObjectId(user_id)
    cursor = db.chats.find({"participants": u_oid}).sort("updated_at", -1)
    chats = await cursor.to_list(length=100)

    result = []
    for chat in chats:
        chat_id = str(chat["_id"])
        entry = {
            "chat_id": chat_id,
            "chat_type": chat["chat_type"],
            "unread_count": chat.get("unread_count", {}).get(user_id, 0),
            "last_message": None,
            "contact": None,
            "group_name": None,
        }

        # Populate last_message
        if chat.get("last_message"):
            lm = chat["last_message"]
            entry["last_message"] = {
                "text": lm.get("text", ""),
                "sender_is_me": str(lm.get("sender_id")) == user_id,
                "timestamp": lm["timestamp"].isoformat(),
            }

        # Populate contact for private chats
        if chat["chat_type"] == "private":
            other_id = next(
                (p for p in chat["participants"] if p != u_oid), None
            )
            if other_id:
                contact = await db.users.find_one({"_id": other_id})
                if contact:
                    entry["contact"] = {
                        "name": contact["name"],
                        "profile_picture": contact.get("profile_picture"),
                        "is_online": contact.get("is_online", False),
                    }

        # Populate group name
        elif chat["chat_type"] == "group" and chat.get("group_id"):
            group = await db.groups.find_one({"_id": chat["group_id"]})
            if group:
                entry["group_name"] = group["name"]

        result.append(entry)
    return result
