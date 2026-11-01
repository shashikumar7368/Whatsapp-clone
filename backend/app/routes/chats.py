"""
app/routes/chats.py
-------------------
Chat thread routes: list all chats, start/get a private chat.
"""

from fastapi import APIRouter, Depends
from app.auth.dependencies import get_current_user
from app.database.connection import get_db
from app.services.chat_service import list_chats, get_or_create_chat
from app.schemas.chat_schema import CreateChatRequest

router = APIRouter()


@router.get("")
async def get_chats(current_user=Depends(get_current_user), db=Depends(get_db)):
    """Return all chats sorted by most recent message."""
    chats = await list_chats(str(current_user["_id"]), db)
    return {"chats": chats}


@router.post("")
async def start_chat(
    data: CreateChatRequest,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    """Get or create a private 1-to-1 chat with a contact."""
    chat_id = await get_or_create_chat(
        str(current_user["_id"]), data.recipient_user_id, db
    )
    return {"chat_id": chat_id}
