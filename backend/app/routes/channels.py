"""
app/routes/channels.py
-----------------------
Channel routes: create channel, discover channels, follow/unfollow.
"""

from fastapi import APIRouter, Depends, Query
from typing import Optional

from app.auth.dependencies import get_current_user
from app.database.connection import get_db
from app.schemas.channel_schema import CreateChannelRequest, FollowChannelRequest
from app.services.channel_service import create_channel, list_channels, follow_unfollow

router = APIRouter()


@router.get("")
async def discover_channels(
    category: Optional[str] = Query(None),
    followed: bool = Query(False),
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    """Discover or filter channels. Pass ?followed=true for subscribed channels."""
    channels = await list_channels(
        user_id=str(current_user["_id"]),
        followed_only=followed,
        category=category,
        db=db,
    )
    return {"channels": channels}


@router.post("", status_code=201)
async def create_new_channel(
    data: CreateChannelRequest,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    """Create a new broadcast channel."""
    result = await create_channel(str(current_user["_id"]), data.model_dump(), db)
    return result


@router.post("/{channel_id}/follow")
async def follow_channel(
    channel_id: str,
    data: FollowChannelRequest,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    """Follow or unfollow a channel. Body: {action: 'follow'|'unfollow'}"""
    message = await follow_unfollow(str(current_user["_id"]), channel_id, data.action, db)
    if message is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Channel not found")
    return {"message": message}
