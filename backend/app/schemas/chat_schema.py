"""
app/schemas/chat_schema.py
--------------------------
Pydantic schemas for chat-related endpoints.
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class LastMessage(BaseModel):
    text: str
    sender_is_me: bool
    timestamp: datetime


class ContactPreview(BaseModel):
    name: str
    profile_picture: Optional[str] = None
    is_online: bool = False


class ChatResponse(BaseModel):
    chat_id: str
    chat_type: str  # "private" | "group"
    contact: Optional[ContactPreview] = None  # For private chats
    group_name: Optional[str] = None          # For group chats
    last_message: Optional[LastMessage] = None
    unread_count: int = 0


class CreateChatRequest(BaseModel):
    recipient_user_id: str


class ChatCreatedResponse(BaseModel):
    chat_id: str
