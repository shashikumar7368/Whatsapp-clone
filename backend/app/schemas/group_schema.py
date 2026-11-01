"""
app/schemas/group_schema.py
----------------------------
Pydantic schemas for group-related endpoints.
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CreateGroupRequest(BaseModel):
    name: str
    description: Optional[str] = None
    member_ids: list[str]


class GroupMemberResponse(BaseModel):
    user_id: str
    name: str
    profile_picture: Optional[str] = None
    role: str  # admin | member
    joined_at: datetime


class GroupResponse(BaseModel):
    group_id: str
    name: str
    description: Optional[str] = None
    icon_url: Optional[str] = None
    created_by: str
    invite_link: str
    members: list[GroupMemberResponse]


class CreateGroupResponse(BaseModel):
    group_id: str
    chat_id: str
    invite_link: str


class AddMemberRequest(BaseModel):
    user_id: str
