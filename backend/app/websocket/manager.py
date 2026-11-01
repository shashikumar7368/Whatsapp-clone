"""
app/websocket/manager.py
------------------------
ConnectionManager — maintains an in-memory registry of all active WebSocket
connections, keyed by user_id. Provides methods to send messages to
individual users or broadcast to a list of user IDs.
"""

from fastapi import WebSocket
from typing import Dict, List
import json


class ConnectionManager:
    def __init__(self):
        # user_id (str) → WebSocket
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        """Accept a new WebSocket connection and register it."""
        await websocket.accept()
        self.active_connections[user_id] = websocket
        print(f"🔌 WS connected: {user_id} | total: {len(self.active_connections)}")

    def disconnect(self, user_id: str):
        """Remove a disconnected user from the registry."""
        self.active_connections.pop(user_id, None)
        print(f"❌ WS disconnected: {user_id} | total: {len(self.active_connections)}")

    def is_online(self, user_id: str) -> bool:
        """Check if a user has an active WebSocket connection."""
        return user_id in self.active_connections

    def get_online_users(self) -> List[str]:
        """Return a list of all currently connected user IDs."""
        return list(self.active_connections.keys())

    async def send_to_user(self, user_id: str, payload: dict):
        """Send a JSON payload to a specific connected user (no-op if offline)."""
        socket = self.active_connections.get(user_id)
        if socket:
            try:
                await socket.send_text(json.dumps(payload))
            except Exception as e:
                print(f"⚠️ Failed to send to {user_id}: {e}")
                self.disconnect(user_id)

    async def broadcast_to_users(self, user_ids: List[str], payload: dict):
        """Broadcast a JSON payload to several users."""
        for uid in user_ids:
            await self.send_to_user(uid, payload)


# Singleton instance — imported across the app
manager = ConnectionManager()
