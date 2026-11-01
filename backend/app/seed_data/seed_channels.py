"""
app/seed_data/seed_channels.py
--------------------------------
Insert mock broadcast channels and follow relationships.
Run AFTER seed_users.py: python -m app.seed_data.seed_channels
"""

import asyncio
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
import secrets

MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "whatsapp_clone"

MOCK_CHANNELS = [
    {"name": "Tech News Daily",       "description": "Latest in technology, AI, and software.", "category": "Technology", "is_verified": True,  "subscriber_count": 4820},
    {"name": "Python Mastery",         "description": "Python tips, tricks and tutorials.",       "category": "Education",  "is_verified": False, "subscriber_count": 1230},
    {"name": "Campus Updates",         "description": "Official college announcements.",           "category": "Education",  "is_verified": True,  "subscriber_count": 8400},
    {"name": "Movie Reviews",          "description": "No spoilers, only opinions 🎬",           "category": "Entertainment", "is_verified": False, "subscriber_count": 560},
    {"name": "Startup Founders Hub",   "description": "For builders and dreamers.",              "category": "Business",   "is_verified": False, "subscriber_count": 2100},
]


async def seed():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    # Get the first user as channel creator
    creator = await db.users.find_one({})
    if not creator:
        print("⚠️  No users found. Run seed_users.py first.")
        client.close()
        return

    inserted = 0
    for ch in MOCK_CHANNELS:
        existing = await db.channels.find_one({"name": ch["name"]})
        if existing:
            print(f"⏭  Skipping channel '{ch['name']}' (already exists)")
            continue

        now = datetime.now(timezone.utc)
        token = secrets.token_urlsafe(8)
        await db.channels.insert_one(
            {
                **ch,
                "icon_url": None,
                "created_by": creator["_id"],
                "invite_link": f"https://wa-clone.app/channel/{token}",
                "created_at": now,
            }
        )
        inserted += 1
        print(f"✅ Inserted channel: {ch['name']}")

    print(f"\n🌱 Seeded {inserted} channels.")
    client.close()


if __name__ == "__main__":
    asyncio.run(seed())
