"""
app/database/connection.py
--------------------------
Async MongoDB connection using Motor.
Provides a shared `db` object used throughout the application.
"""

from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings


class Database:
    client: AsyncIOMotorClient = None
    db = None


mongodb = Database()


async def connect_db():
    """Create async Motor client and select the database."""
    mongodb.client = AsyncIOMotorClient(settings.MONGODB_URL)
    mongodb.db = mongodb.client[settings.DB_NAME]


async def close_db():
    """Close the Motor client connection gracefully."""
    if mongodb.client:
        mongodb.client.close()


def get_db():
    """Dependency — returns the active Motor database object."""
    return mongodb.db
