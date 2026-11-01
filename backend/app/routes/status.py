"""
app/routes/status.py
---------------------
Status update routes: post a status, view contact statuses, mark as viewed.
"""

from fastapi import APIRouter, Depends
from bson import ObjectId
from datetime import datetime, timezone

from app.auth.dependencies import get_current_user
from app.database.connection import get_db
from app.schemas.status_schema import CreateStatusRequest
from app.services.status_service import post_status, get_contact_statuses

router = APIRouter()


@router.post("", status_code=201)
async def create_status(
    data: CreateStatusRequest,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    """Post a new status update. Expires in 24 hours automatically."""
    result = await post_status(str(current_user["_id"]), data.model_dump(), db)
    return result


@router.get("")
async def view_statuses(current_user=Depends(get_current_user), db=Depends(get_db)):
    """Return status updates from all contacts."""
    feed = await get_contact_statuses(str(current_user["_id"]), db)
    return {"statuses": feed}


@router.post("/{status_id}/view")
async def mark_status_viewed(
    status_id: str,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    """Record that the current user has viewed a specific status."""
    now = datetime.now(timezone.utc)
    await db.statuses.update_one(
        {"_id": ObjectId(status_id)},
        {
            "$addToSet": {
                "viewers": {"user_id": current_user["_id"], "viewed_at": now}
            }
        },
    )
    return {"message": "Status marked as viewed"}
