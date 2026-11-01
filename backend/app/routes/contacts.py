"""
app/routes/contacts.py
-----------------------
Contacts management routes.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from datetime import datetime, timezone

from app.auth.dependencies import get_current_user
from app.database.connection import get_db

router = APIRouter()


def _format_contact(contact_doc: dict, user_doc: dict) -> dict:
    return {
        "contact_id": str(contact_doc["_id"]),
        "user_id": str(user_doc["_id"]),
        "name": user_doc["name"],
        "nickname": contact_doc.get("nickname"),
        "phone": user_doc.get("phone"),
        "profile_picture": user_doc.get("profile_picture"),
        "is_online": user_doc.get("is_online", False),
        "last_seen": user_doc.get("last_seen"),
        "is_blocked": contact_doc.get("is_blocked", False),
    }


@router.get("")
async def get_contacts(current_user=Depends(get_current_user), db=Depends(get_db)):
    """Return all contacts of the authenticated user."""
    cursor = db.contacts.find({"owner_id": current_user["_id"]})
    contacts = await cursor.to_list(length=500)

    result = []
    for c in contacts:
        user = await db.users.find_one({"_id": c["contact_user_id"]})
        if user:
            result.append(_format_contact(c, user))
    return {"contacts": result}


@router.post("", status_code=201)
async def add_contact(
    data: dict,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    """Add a user to contacts. Body: {contact_user_id, nickname?}"""
    contact_user_id = data.get("contact_user_id")
    if not contact_user_id:
        raise HTTPException(status_code=400, detail="contact_user_id is required")

    target = await db.users.find_one({"_id": ObjectId(contact_user_id)})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    now = datetime.now(timezone.utc)
    try:
        result = await db.contacts.insert_one(
            {
                "owner_id": current_user["_id"],
                "contact_user_id": ObjectId(contact_user_id),
                "nickname": data.get("nickname"),
                "is_blocked": False,
                "added_at": now,
            }
        )
        return {"message": "Contact added", "contact_id": str(result.inserted_id)}
    except Exception:
        raise HTTPException(status_code=409, detail="Contact already exists")
