"""
app/database/indexes.py
-----------------------
Creates all MongoDB indexes required by the application.
Called once on application startup.
"""

from app.database.connection import get_db
import pymongo


async def create_indexes():
    """Create all collection indexes for query performance and data integrity."""
    db = get_db()

    # ── users ──────────────────────────────────────────────────────────────────
    await db.users.create_index("email", unique=True)
    await db.users.create_index("phone", unique=True)

    # ── contacts ──────────────────────────────────────────────────────────────
    await db.contacts.create_index(
        [("owner_id", pymongo.ASCENDING), ("contact_user_id", pymongo.ASCENDING)],
        unique=True,
    )

    # ── chats ──────────────────────────────────────────────────────────────────
    await db.chats.create_index("participants")
    await db.chats.create_index([("updated_at", pymongo.DESCENDING)])

    # ── messages ───────────────────────────────────────────────────────────────
    await db.messages.create_index(
        [("chat_id", pymongo.ASCENDING), ("timestamp", pymongo.DESCENDING)]
    )

    # ── group_members ──────────────────────────────────────────────────────────
    await db.group_members.create_index(
        [("group_id", pymongo.ASCENDING), ("user_id", pymongo.ASCENDING)],
        unique=True,
    )
    await db.group_members.create_index("user_id")

    # ── statuses — TTL (auto-delete after 24 hours) ────────────────────────────
    await db.statuses.create_index(
        "expires_at",
        expireAfterSeconds=0,  # MongoDB reads the absolute datetime in expires_at
    )

    # ── channel_followers ──────────────────────────────────────────────────────
    await db.channel_followers.create_index(
        [("channel_id", pymongo.ASCENDING), ("user_id", pymongo.ASCENDING)],
        unique=True,
    )

    print("✅ MongoDB indexes created.")
