"""
app/schemas/status_schema.py
-----------------------------
Pydantic schemas for status-related endpoints.
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CreateStatusRequest(BaseModel):
    type: str = "text"    # text | image
    content: str
    background_color: Optional[str] = "#128C7E"
    media_url: Optional[str] = None


class StatusAuthorResponse(BaseModel):
    user_id: str
    name: str
    profile_picture: Optional[str] = None


class LatestStatus(BaseModel):
    status_id: str
    type: str
    content: str
    background_color: Optional[str] = None
    created_at: datetime
    viewer_count: int
    viewed_by_me: bool


class StatusFeedItem(BaseModel):
    user: StatusAuthorResponse
    latest_status: LatestStatus
    total_updates: int


class StatusFeedResponse(BaseModel):
    statuses: list[StatusFeedItem]


class CreateStatusResponse(BaseModel):
    status_id: str
    expires_at: datetime
