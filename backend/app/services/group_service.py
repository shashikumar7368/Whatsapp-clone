"""
app/services/group_service.py
------------------------------
Business logic for group creation and membership management.
"""

from bson import ObjectId
from datetime import datetime, timezone
import secrets


async def create_group(name: str, description: str, creator_id: str, member_ids: list, db) -> dict:
    """
    Create a new group chat, insert group document, create group chat entry,
    and add all members including the creator.
    """
    now = datetime.now(timezone.utc)
    invite_token = secrets.token_urlsafe(8)

    # 1. Insert group document
    group_doc = {
        "name": name,
        "description": description,
        "icon_url": None,
        "created_by": ObjectId(creator_id),
        "admins": [ObjectId(creator_id)],
        "invite_link": f"https://wa-clone.app/join/{invite_token}",
        "invite_link_active": True,
        "settings": {"only_admins_send": False, "only_admins_edit_info": True},
        "created_at": now,
    }
    group_result = await db.groups.insert_one(group_doc)
    group_id = group_result.inserted_id

    # 2. Create a group chat entry
    all_participant_ids = list(set([creator_id] + member_ids))
    chat_result = await db.chats.insert_one(
        {
            "chat_type": "group",
            "participants": [ObjectId(uid) for uid in all_participant_ids],
            "group_id": group_id,
            "last_message": None,
            "unread_count": {},
            "created_at": now,
            "updated_at": now,
        }
    )

    # 3. Insert group_members documents
    member_docs = []
    for uid in all_participant_ids:
        member_docs.append(
            {
                "group_id": group_id,
                "user_id": ObjectId(uid),
                "role": "admin" if uid == creator_id else "member",
                "joined_at": now,
                "added_by": ObjectId(creator_id),
            }
        )
    await db.group_members.insert_many(member_docs)

    return {
        "group_id": str(group_id),
        "chat_id": str(chat_result.inserted_id),
        "invite_link": group_doc["invite_link"],
    }


async def get_group_with_members(group_id: str, db) -> dict:
    """Fetch group details and all member info."""
    group = await db.groups.find_one({"_id": ObjectId(group_id)})
    if not group:
        return None

    member_cursor = db.group_members.find({"group_id": ObjectId(group_id)})
    member_docs = await member_cursor.to_list(length=500)

    members = []
    for m in member_docs:
        user = await db.users.find_one({"_id": m["user_id"]})
        if user:
            members.append(
                {
                    "user_id": str(user["_id"]),
                    "name": user["name"],
                    "profile_picture": user.get("profile_picture"),
                    "role": m["role"],
                    "joined_at": m["joined_at"],
                }
            )

    creator = await db.users.find_one({"_id": group["created_by"]})
    return {
        "group_id": str(group["_id"]),
        "name": group["name"],
        "description": group.get("description"),
        "icon_url": group.get("icon_url"),
        "created_by": creator["name"] if creator else "Unknown",
        "invite_link": group["invite_link"],
        "members": members,
    }
