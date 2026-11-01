"""
app/websocket/handler.py
------------------------
WebSocket route and event dispatch loop.

Supported events (client → server):
  send_message, typing, message_read

Emitted events (server → client):
  connect, receive_message, message_sent_ack,
  typing_indicator, status_update, online_status
"""

import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from bson import ObjectId
from datetime import datetime, timezone

from app.websocket.manager import manager
from app.auth.jwt import verify_token
from app.database.connection import get_db
from app.services.message_service import save_message, mark_messages_read
from app.schemas.message_schema import SendMessageRequest

websocket_router = APIRouter()


async def _get_group_member_ids(group_id: str, db) -> list:
    """Return string user IDs of all members in a group."""
    cursor = db.group_members.find({"group_id": ObjectId(group_id)})
    docs = await cursor.to_list(length=500)
    return [str(d["user_id"]) for d in docs]


@websocket_router.websocket("/ws/{user_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: str,
    token: str = Query(...),
):
    """
    Main WebSocket endpoint.
    JWT token is passed as a query parameter: /ws/{user_id}?token=<JWT>
    """
    db = get_db()

    # ── Authentication ─────────────────────────────────────────────────────────
    payload = verify_token(token, token_type="access")
    if payload is None or payload.get("sub") != user_id:
        await websocket.close(code=4001)
        return

    # ── Connect ────────────────────────────────────────────────────────────────
    await manager.connect(user_id, websocket)

    # Mark user online in DB
    await db.users.update_one(
        {"_id": ObjectId(user_id)}, {"$set": {"is_online": True}}
    )

    # Send connection ack
    await manager.send_to_user(
        user_id,
        {"type": "connect", "user_id": user_id, "status": "authenticated",
         "timestamp": datetime.now(timezone.utc).isoformat()},
    )

    # Notify contacts that this user is now online
    contacts_cursor = db.contacts.find({"contact_user_id": ObjectId(user_id)})
    contacts = await contacts_cursor.to_list(length=500)
    for c in contacts:
        await manager.send_to_user(
            str(c["owner_id"]),
            {"type": "online_status", "user_id": user_id, "is_online": True},
        )

    # ── Event Loop ────────────────────────────────────────────────────────────
    try:
        while True:
            raw = await websocket.receive_text()
            try:
                event = json.loads(raw)
            except json.JSONDecodeError:
                continue

            event_type = event.get("type")

            # ── send_message ──────────────────────────────────────────────────
            if event_type == "send_message":
                await _handle_send_message(event, user_id, db)

            # ── typing ────────────────────────────────────────────────────────
            elif event_type == "typing":
                await _handle_typing(event, user_id, db)

            # ── message_read ──────────────────────────────────────────────────
            elif event_type == "message_read":
                await _handle_message_read(event, user_id, db)

    except WebSocketDisconnect:
        pass

    finally:
        # ── Disconnect ────────────────────────────────────────────────────────
        manager.disconnect(user_id)
        now = datetime.now(timezone.utc)
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"is_online": False, "last_seen": now}},
        )
        # Notify contacts that user went offline
        for c in contacts:
            await manager.send_to_user(
                str(c["owner_id"]),
                {
                    "type": "online_status",
                    "user_id": user_id,
                    "is_online": False,
                    "last_seen": now.isoformat(),
                },
            )


# ─────────────────────── Event Handlers ──────────────────────────────────────

async def _handle_send_message(event: dict, sender_id: str, db):
    """Persist message and forward to recipient(s)."""
    chat_id = event.get("chat_id")
    client_temp_id = event.get("client_temp_id")

    if not chat_id:
        return

    req = SendMessageRequest(
        chat_id=chat_id,
        message_type=event.get("message_type", "text"),
        text=event.get("text"),
        media_url=event.get("media_url"),
        reply_to_message_id=event.get("reply_to_message_id"),
    )
    msg_doc = await save_message(req, sender_id, db)
    msg_id = str(msg_doc["_id"])
    timestamp = msg_doc["timestamp"].isoformat()

    # Fetch the chat to find recipients
    chat = await db.chats.find_one({"_id": ObjectId(chat_id)})
    if not chat:
        return

    # Build recipient list (exclude sender)
    participant_ids = [str(p) for p in chat["participants"] if str(p) != sender_id]

    # Payload for receivers
    receive_payload = {
        "type": "receive_message",
        "message_id": msg_id,
        "chat_id": chat_id,
        "sender_id": sender_id,
        "message_type": req.message_type,
        "text": req.text,
        "media_url": req.media_url,
        "reply_to_message_id": req.reply_to_message_id,
        "timestamp": timestamp,
    }
    await manager.broadcast_to_users(participant_ids, receive_payload)

    # Send ACK back to sender
    delivered = any(manager.is_online(uid) for uid in participant_ids)
    await manager.send_to_user(
        sender_id,
        {
            "type": "message_sent_ack",
            "client_temp_id": client_temp_id,
            "message_id": msg_id,
            "status": "delivered" if delivered else "sent",
            "timestamp": timestamp,
        },
    )


async def _handle_typing(event: dict, sender_id: str, db):
    """Relay typing indicator to the other participant(s) in the chat."""
    chat_id = event.get("chat_id")
    is_typing = event.get("is_typing", True)

    if not chat_id:
        return

    chat = await db.chats.find_one({"_id": ObjectId(chat_id)})
    if not chat:
        return

    sender = await db.users.find_one({"_id": ObjectId(sender_id)})
    recipient_ids = [str(p) for p in chat["participants"] if str(p) != sender_id]

    await manager.broadcast_to_users(
        recipient_ids,
        {
            "type": "typing_indicator",
            "chat_id": chat_id,
            "user_id": sender_id,
            "name": sender["name"] if sender else "User",
            "is_typing": is_typing,
        },
    )


async def _handle_message_read(event: dict, reader_id: str, db):
    """Mark messages read in DB and notify original sender."""
    chat_id = event.get("chat_id")
    if not chat_id:
        return

    await mark_messages_read(chat_id, reader_id, db)

    # Notify all other participants that messages were read
    chat = await db.chats.find_one({"_id": ObjectId(chat_id)})
    if not chat:
        return

    sender_ids = [str(p) for p in chat["participants"] if str(p) != reader_id]
    await manager.broadcast_to_users(
        sender_ids,
        {
            "type": "status_update",
            "chat_id": chat_id,
            "new_status": "read",
            "read_by_user_id": reader_id,
            "read_at": datetime.now(timezone.utc).isoformat(),
        },
    )
