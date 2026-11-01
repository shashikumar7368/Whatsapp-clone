"""
app/schemas/auth_schema.py
--------------------------
Pydantic request/response schemas for the /auth routes.
"""

from pydantic import BaseModel, EmailStr, Field


class SignupRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=60)
    email: EmailStr
    phone: str = Field(..., min_length=7, max_length=20)
    password: str = Field(..., min_length=6)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


class SignupResponse(BaseModel):
    user_id: str
    name: str
    email: str
    message: str = "Account created successfully"
