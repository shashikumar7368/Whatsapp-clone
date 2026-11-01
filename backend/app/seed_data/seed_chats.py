"""
app/seed_data/seed_chats.py
----------------------------
Create mock private chat threads and seed messages between mock users.
Run AFTER seed_users.py: python -m app.seed_data.seed_chats
"""

import asyncio
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "whatsapp_clone"

# Mock conversation data: (sender_name, recipient_name, messages[])
CONVERSATIONS = [
    {
        "users": ("rahul@example.com", "anitha@example.com"),
        "messages": [
            ("rahul@example.com", "Hey Anitha! Are you coming to college today?"),
            ("anitha@example.com", "Yes! I'll be there by 10:30"),
            ("rahul@example.com", "Great, see you at the lab 👍"),
            ("anitha@example.com", "Sure! Working on the backend today"),
            ("rahul@example.com", "Same, let's pair up on the WebSocket part"),
        ],
    },
    {
        "users": ("rahul@example.com", "vikram@example.com"),
        "messages": [
            ("vikram@example.com", "Rahul, did you push the latest code?"),
            ("rahul@example.com", "Yes! Just pushed to main branch 🚀"),
            ("vikram@example.com", "Nice work! The auth endpoints look clean"),
            ("rahul@example.com", "Thanks! JWT refresh flow was tricky"),
        ],
    },
]


async def seed():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    for convo in CONVERSATIONS:
        email_a, email_b = convo["users"]
        user_a = await db.users.find_one({"email": email_a})
        user_b = await db.users.find_one({"email": email_b})

        if not user_a or not user_b:
            print(f"⚠️  Users not found: {email_a}, {email_b} — run seed_users.py first")
            continue

        # Create or find the private chat
        existing_chat = await db.chats.find_one(
            {"chat_type": "private", "participants": {"$all": [user_a["_id"], user_b["_id"]]}}
        )
        if existing_chat:
            chat_id = existing_chat["_id"]
        else:
            now = datetime.now(timezone.utc)
            result = await db.chats.insert_one(
                {
                    "chat_type": "private",
                    "participants": [user_a["_id"], user_b["_id"]],
                    "group_id": None,
                    "last_message": None,
                    "unread_count": {},
                    "created_at": now,
                    "updated_at": now,
                }
            )
            chat_id = result.inserted_id

        # Seed messages
        users_map = {email_a: user_a, email_b: user_b}
        base_time = datetime.now(timezone.utc) - timedelta(hours=2)

        for i, (sender_email, text) in enumerate(convo["messages"]):
            sender = users_map[sender_email]
            ts = base_time + timedelta(minutes=i * 5)
            await db.messages.insert_one(
                {
                    "chat_id": chat_id,
                    "sender_id": sender["_id"],
                    "message_type": "text",
                    "text": text,
                    "media_url": None,
                    "reply_to_message_id": None,
                    "status": "read",
                    "read_by": [],
                    "is_deleted": False,
                    "deleted_for": [],
                    "timestamp": ts,
                }
            )

        # Update last_message on the chat
        last_sender_email, last_text = convo["messages"][-1]
        last_sender = users_map[last_sender_email]
        await db.chats.update_one(
            {"_id": chat_id},
            {
                "$set": {
                    "last_message": {
                        "text": last_text,
                        "sender_id": last_sender["_id"],
                        "timestamp": base_time + timedelta(minutes=(len(convo["messages"])-1) * 5),
                    },
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )
        print(f"✅ Seeded chat: {email_a} ↔ {email_b} ({len(convo['messages'])} messages)")

    print("\n🌱 Chat seeding complete.")
    client.close()


if __name__ == "__main__":
    asyncio.run(seed())
