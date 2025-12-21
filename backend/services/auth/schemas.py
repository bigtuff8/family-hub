"""
Authentication Pydantic schemas
Location: backend/services/auth/schemas.py
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


# ============ Request Schemas ============

class LoginRequest(BaseModel):
    """Login request body"""
    email: EmailStr
    password: str = Field(..., min_length=1)


class RefreshRequest(BaseModel):
    """Token refresh request body"""
    refresh_token: str


class LogoutRequest(BaseModel):
    """Logout request body"""
    refresh_token: str


class UserCreate(BaseModel):
    """Create new user request"""
    email: EmailStr
    password: str = Field(..., min_length=6)
    name: str = Field(..., min_length=1, max_length=100)
    role: str = Field(default="member", pattern="^(admin|parent|child)$")
    color: str = Field(default="#3b82f6", pattern="^#[0-9a-fA-F]{6}$")


class UserUpdate(BaseModel):
    """Update user request"""
    email: Optional[EmailStr] = None
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    role: Optional[str] = Field(None, pattern="^(admin|parent|child)$")
    color: Optional[str] = Field(None, pattern="^#[0-9a-fA-F]{6}$")
    is_active: Optional[bool] = None


class PasswordChange(BaseModel):
    """Change password request"""
    current_password: str
    new_password: str = Field(..., min_length=6)


# ============ Response Schemas ============

class UserResponse(BaseModel):
    """User data in responses"""
    id: UUID
    email: str
    name: str
    role: str
    color: str
    avatar_url: Optional[str] = None
    tenant_id: UUID
    is_active: bool
    last_login: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Login/refresh token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds
    user: UserResponse


class AccessTokenResponse(BaseModel):
    """Refresh token response (access token only)"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


class MessageResponse(BaseModel):
    """Simple message response"""
    message: str


class CurrentUserResponse(BaseModel):
    """Current user with tenant info"""
    id: UUID
    email: str
    name: str
    role: str
    color: str
    avatar_url: Optional[str] = None
    tenant_id: UUID
    tenant_name: str
    is_active: bool
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True
