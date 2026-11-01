"""
app/schemas/channel_schema.py
------------------------------
Pydantic schemas for channel-related endpoints.
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CreateChannelRequest(BaseModel):
    name: str
    description: Optional[str] = None
    category: Optional[str] = None


class ChannelResponse(BaseModel):
    channel_id: str
    name: str
    description: Optional[str] = None
    icon_url: Optional[str] = None
    subscriber_count: int
    is_verified: bool = False
    is_following: bool = False
    category: Optional[str] = None


class ChannelListResponse(BaseModel):
    channels: list[ChannelResponse]


class FollowChannelRequest(BaseModel):
    action: str  # "follow" | "unfollow"


class CreateChannelResponse(BaseModel):
    channel_id: str
    invite_link: str
