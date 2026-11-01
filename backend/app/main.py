"""
app/main.py
-----------
FastAPI application factory — registers all routers, middleware,
startup / shutdown events, and the WebSocket endpoint.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database.connection import connect_db, close_db
from app.database.indexes import create_indexes
from app.routes import auth, users, contacts, chats, messages, groups, status, channels
from app.websocket.handler import websocket_router
from app.config import settings


# ──────────────────────────── Lifespan ────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Runs once on startup, and once on shutdown."""
    await connect_db()
    await create_indexes()
    print(f"✅ Connected to MongoDB: {settings.DB_NAME}")
    yield
    await close_db()
    print("🔌 MongoDB connection closed.")


# ──────────────────────────── App Instance ────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    description="WhatsApp Web Clone — REST + WebSocket API",
    version="1.0.0",
    lifespan=lifespan,
)

# ──────────────────────────── CORS ────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "https://whatsap26.netlify.app",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ──────────────────────────── REST Routers ────────────────────────────────────
API_PREFIX = "/api/v1"

app.include_router(auth.router,     prefix=f"{API_PREFIX}/auth",     tags=["Authentication"])
app.include_router(users.router,    prefix=f"{API_PREFIX}/users",    tags=["Users"])
app.include_router(contacts.router, prefix=f"{API_PREFIX}/contacts", tags=["Contacts"])
app.include_router(chats.router,    prefix=f"{API_PREFIX}/chats",    tags=["Chats"])
app.include_router(messages.router, prefix=f"{API_PREFIX}/messages", tags=["Messages"])
app.include_router(groups.router,   prefix=f"{API_PREFIX}/groups",   tags=["Groups"])
app.include_router(status.router,   prefix=f"{API_PREFIX}/status",   tags=["Status"])
app.include_router(channels.router, prefix=f"{API_PREFIX}/channels", tags=["Channels"])

# ──────────────────────────── WebSocket ───────────────────────────────────────
app.include_router(websocket_router)


@app.get("/", tags=["Health"])
async def health_check():
    return {"status": "ok", "app": settings.APP_NAME}
