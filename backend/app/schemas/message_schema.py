"""
app/schemas/message_schema.py
------------------------------
Pydantic schemas for message-related endpoints.
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SendMessageRequest(BaseModel):
    chat_id: str
    message_type: str = "text"    # text | image | audio | video | document
    text: Optional[str] = None
    media_url: Optional[str] = None
    reply_to_message_id: Optional[str] = None


class MessageResponse(BaseModel):
    message_id: str
    chat_id: str
    sender_id: str
    message_type: str
    text: Optional[str] = None
    media_url: Optional[str] = None
    status: str  # sent | delivered | read
    timestamp: datetime
    reply_to_message_id: Optional[str] = None


class MessageListResponse(BaseModel):
    messages: list[MessageResponse]
    has_more: bool
    next_cursor: Optional[str] = None


class SendMessageResponse(BaseModel):
    message_id: str
    status: str
    timestamp: datetime
