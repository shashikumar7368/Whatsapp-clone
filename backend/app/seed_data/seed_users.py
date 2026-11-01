"""
app/seed_data/seed_users.py
----------------------------
Insert 10 mock users into MongoDB for development and demo purposes.
Run: python -m app.seed_data.seed_users
"""

import asyncio
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext

MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "whatsapp_clone"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

MOCK_USERS = [
    {"name": "Rahul Sharma",    "email": "rahul@example.com",   "phone": "+91-9876543210"},
    {"name": "Anitha Rao",      "email": "anitha@example.com",  "phone": "+91-9123456780"},
    {"name": "Vikram Nair",     "email": "vikram@example.com",  "phone": "+91-9234567890"},
    {"name": "Priya Menon",     "email": "priya@example.com",   "phone": "+91-9345678901"},
    {"name": "Arjun Patel",     "email": "arjun@example.com",   "phone": "+91-9456789012"},
    {"name": "Sneha Iyer",      "email": "sneha@example.com",   "phone": "+91-9567890123"},
    {"name": "Dev Kumar",       "email": "dev@example.com",     "phone": "+91-9678901234"},
    {"name": "Kavya Reddy",     "email": "kavya@example.com",   "phone": "+91-9789012345"},
    {"name": "Rohan Gupta",     "email": "rohan@example.com",   "phone": "+91-9890123456"},
    {"name": "Meera Krishnan",  "email": "meera@example.com",   "phone": "+91-9901234567"},
]

DEFAULT_PASSWORD = "password123"
ABOUT_TEXTS = [
    "Hey there! I am using WhatsApp.",
    "Busy studying for finals 📚",
    "Let's connect!",
    "Always learning something new.",
    "Coffee ☕ and code.",
]


async def seed():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    inserted = 0
    for i, u in enumerate(MOCK_USERS):
        existing = await db.users.find_one({"email": u["email"]})
        if existing:
            print(f"⏭  Skipping {u['name']} (already exists)")
            continue

        now = datetime.now(timezone.utc)
        await db.users.insert_one(
            {
                **u,
                "password_hash": pwd_context.hash(DEFAULT_PASSWORD),
                "about": ABOUT_TEXTS[i % len(ABOUT_TEXTS)],
                "profile_picture": None,
                "is_online": False,
                "last_seen": now,
                "created_at": now,
            }
        )
        inserted += 1
        print(f"✅ Inserted: {u['name']}")

    print(f"\n🌱 Seeded {inserted} users. Default password: '{DEFAULT_PASSWORD}'")
    client.close()


if __name__ == "__main__":
    asyncio.run(seed())
