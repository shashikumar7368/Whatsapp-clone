"""
app/schemas/user_schema.py
--------------------------
Pydantic schemas for user-related endpoints.
"""

from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserResponse(BaseModel):
    user_id: str
    name: str
    email: str
    phone: str
    about: Optional[str] = "Hey there! I am using WhatsApp."
    profile_picture: Optional[str] = None
    is_online: bool = False
    last_seen: Optional[datetime] = None


class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    about: Optional[str] = None
    profile_picture: Optional[str] = None


class UserSearchResponse(BaseModel):
    users: list[UserResponse]
