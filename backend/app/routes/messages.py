"""
app/routes/messages.py
-----------------------
Message routes: paginated message history, REST send message.
"""

from fastapi import APIRouter, Depends, Query
from typing import Optional

from app.auth.dependencies import get_current_user
from app.database.connection import get_db
from app.schemas.message_schema import SendMessageRequest
from app.services.message_service import save_message, get_messages

router = APIRouter()


@router.get("/{chat_id}")
async def get_message_history(
    chat_id: str,
    before: Optional[str] = Query(None, description="ISO timestamp cursor for pagination"),
    limit: int = Query(50, le=100),
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    """
    Fetch messages for a chat (oldest first).
    Use `before` cursor timestamp for pagination (load older messages).
    """
    result = await get_messages(chat_id, limit=limit, before=before, db=db)
    return result


@router.post("")
async def send_message_rest(
    data: SendMessageRequest,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    """
    REST fallback for sending a message.
    Prefer the WebSocket `send_message` event for real-time delivery.
    """
    msg_doc = await save_message(data, str(current_user["_id"]), db)
    return {
        "message_id": str(msg_doc["_id"]),
        "status": msg_doc["status"],
        "timestamp": msg_doc["timestamp"].isoformat(),
    }
