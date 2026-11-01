"""
app/routes/groups.py
---------------------
Group management routes: create, get details, add members.
"""

from fastapi import APIRouter, Depends, HTTPException

from app.auth.dependencies import get_current_user
from app.database.connection import get_db
from app.schemas.group_schema import CreateGroupRequest, AddMemberRequest
from app.services.group_service import create_group, get_group_with_members
from bson import ObjectId
from datetime import datetime, timezone

router = APIRouter()


@router.post("", status_code=201)
async def create_new_group(
    data: CreateGroupRequest,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    """Create a new group with posted member IDs."""
    result = await create_group(
        name=data.name,
        description=data.description,
        creator_id=str(current_user["_id"]),
        member_ids=data.member_ids,
        db=db,
    )
    return result


@router.get("/{group_id}")
async def get_group(
    group_id: str,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    """Fetch group details and member list."""
    group = await get_group_with_members(group_id, db)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    return group


@router.post("/{group_id}/members", status_code=201)
async def add_member(
    group_id: str,
    data: AddMemberRequest,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    """Add a user to an existing group (admin only)."""
    # Check admin
    membership = await db.group_members.find_one(
        {"group_id": ObjectId(group_id), "user_id": current_user["_id"], "role": "admin"}
    )
    if not membership:
        raise HTTPException(status_code=403, detail="Only admins can add members")

    now = datetime.now(timezone.utc)
    try:
        await db.group_members.insert_one(
            {
                "group_id": ObjectId(group_id),
                "user_id": ObjectId(data.user_id),
                "role": "member",
                "joined_at": now,
                "added_by": current_user["_id"],
            }
        )
        # Add to chat participants list too
        await db.chats.update_one(
            {"group_id": ObjectId(group_id)},
            {"$addToSet": {"participants": ObjectId(data.user_id)}},
        )
        return {"message": "Member added"}
    except Exception:
        raise HTTPException(status_code=409, detail="User is already a member")
