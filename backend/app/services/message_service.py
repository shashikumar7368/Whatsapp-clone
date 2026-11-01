"""
app/services/message_service.py
--------------------------------
Business logic for creating, fetching, and updating message status.
"""

from bson import ObjectId
from datetime import datetime, timezone
from typing import Optional

from app.schemas.message_schema import SendMessageRequest


async def save_message(data: SendMessageRequest, sender_id: str, db) -> dict:
    """
    Persist a new message to MongoDB and update the parent chat's last_message snapshot.
    Returns the inserted message document with its generated _id.
    """
    now = datetime.now(timezone.utc)
    msg_doc = {
        "chat_id": ObjectId(data.chat_id),
        "sender_id": ObjectId(sender_id),
        "message_type": data.message_type,
        "text": data.text,
        "media_url": data.media_url,
        "reply_to_message_id": (
            ObjectId(data.reply_to_message_id) if data.reply_to_message_id else None
        ),
        "status": "sent",
        "read_by": [],
        "is_deleted": False,
        "deleted_for": [],
        "timestamp": now,
    }

    result = await db.messages.insert_one(msg_doc)
    msg_doc["_id"] = result.inserted_id

    # Denormalize last_message on the chat document for sidebar display
    await db.chats.update_one(
        {"_id": ObjectId(data.chat_id)},
        {
            "$set": {
                "last_message": {
                    "text": data.text or f"[{data.message_type}]",
                    "sender_id": ObjectId(sender_id),
                    "timestamp": now,
                },
                "updated_at": now,
            },
            "$inc": {f"unread_count.{data.chat_id}": 1},  # Placeholder; refined per-user
        },
    )
    return msg_doc


async def get_messages(
    chat_id: str,
    limit: int = 50,
    before: Optional[str] = None,
    db=None,
) -> dict:
    """
    Fetch paginated messages for a chat (cursor-based pagination via timestamp).
    Returns messages in ascending order (oldest first).
    """
    query: dict = {"chat_id": ObjectId(chat_id)}
    if before:
        try:
            cursor_dt = datetime.fromisoformat(before)
            query["timestamp"] = {"$lt": cursor_dt}
        except ValueError:
            pass

    cursor = db.messages.find(query).sort("timestamp", -1).limit(limit + 1)
    docs = await cursor.to_list(length=limit + 1)

    has_more = len(docs) > limit
    docs = docs[:limit]
    docs.reverse()  # Return in ascending (chronological) order

    next_cursor = None
    if has_more and docs:
        next_cursor = docs[0]["timestamp"].isoformat()

    messages = [_format_message(doc) for doc in docs]
    return {"messages": messages, "has_more": has_more, "next_cursor": next_cursor}


async def mark_messages_read(chat_id: str, user_id: str, db) -> None:
    """Mark all unread messages in a chat as read for the given user."""
    now = datetime.now(timezone.utc)
    await db.messages.update_many(
        {
            "chat_id": ObjectId(chat_id),
            "sender_id": {"$ne": ObjectId(user_id)},
            "status": {"$ne": "read"},
        },
        {
            "$set": {"status": "read"},
            "$addToSet": {"read_by": {"user_id": ObjectId(user_id), "read_at": now}},
        },
    )


def _format_message(doc: dict) -> dict:
    """Convert a MongoDB message document to a serialisable dict."""
    return {
        "message_id": str(doc["_id"]),
        "chat_id": str(doc["chat_id"]),
        "sender_id": str(doc["sender_id"]),
        "message_type": doc.get("message_type", "text"),
        "text": doc.get("text"),
        "media_url": doc.get("media_url"),
        "status": doc.get("status", "sent"),
        "timestamp": doc["timestamp"].isoformat(),
        "reply_to_message_id": (
            str(doc["reply_to_message_id"]) if doc.get("reply_to_message_id") else None
        ),
    }
