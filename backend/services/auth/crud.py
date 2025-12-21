"""
Authentication database operations
Location: backend/services/auth/crud.py
"""

from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID
import hashlib

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from shared.models import User, Tenant, RefreshToken
from services.auth.security import get_password_hash, verify_password


async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    """Get user by email address."""
    result = await db.execute(
        select(User).where(User.email == email)
    )
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: UUID) -> Optional[User]:
    """Get user by ID."""
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    return result.scalar_one_or_none()


async def get_tenant_by_id(db: AsyncSession, tenant_id: UUID) -> Optional[Tenant]:
    """Get tenant by ID."""
    result = await db.execute(
        select(Tenant).where(Tenant.id == tenant_id)
    )
    return result.scalar_one_or_none()


async def get_users_by_tenant(db: AsyncSession, tenant_id: UUID) -> list[User]:
    """Get all users for a tenant."""
    result = await db.execute(
        select(User)
        .where(User.tenant_id == tenant_id)
        .order_by(User.name)
    )
    return result.scalars().all()


async def create_user(
    db: AsyncSession,
    tenant_id: UUID,
    email: str,
    password: str,
    name: str,
    role: str = "member",
    color: str = "#3b82f6"
) -> User:
    """Create a new user."""
    user = User(
        tenant_id=tenant_id,
        email=email,
        hashed_password=get_password_hash(password),
        name=name,
        role=role,
        color=color,
        is_active=True
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def update_user(
    db: AsyncSession,
    user: User,
    **kwargs
) -> User:
    """Update user fields."""
    for key, value in kwargs.items():
        if value is not None and hasattr(user, key):
            setattr(user, key, value)
    await db.commit()
    await db.refresh(user)
    return user


async def update_last_login(db: AsyncSession, user: User) -> None:
    """Update user's last login timestamp."""
    user.last_login = datetime.now(timezone.utc)
    await db.commit()


async def authenticate_user(
    db: AsyncSession,
    email: str,
    password: str
) -> Optional[User]:
    """Authenticate user by email and password."""
    user = await get_user_by_email(db, email)
    if not user:
        return None
    if not user.hashed_password:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    if not user.is_active:
        return None
    return user


def hash_token(token: str) -> str:
    """Hash a refresh token for storage."""
    return hashlib.sha256(token.encode()).hexdigest()


async def store_refresh_token(
    db: AsyncSession,
    user_id: UUID,
    token: str,
    expires_at: datetime
) -> RefreshToken:
    """Store a hashed refresh token."""
    refresh_token = RefreshToken(
        user_id=user_id,
        token_hash=hash_token(token),
        expires_at=expires_at
    )
    db.add(refresh_token)
    await db.commit()
    return refresh_token


async def get_refresh_token(
    db: AsyncSession,
    token: str,
    user_id: UUID
) -> Optional[RefreshToken]:
    """Get a valid (non-revoked, non-expired) refresh token."""
    token_hash = hash_token(token)
    result = await db.execute(
        select(RefreshToken).where(
            and_(
                RefreshToken.token_hash == token_hash,
                RefreshToken.user_id == user_id,
                RefreshToken.revoked_at.is_(None),
                RefreshToken.expires_at > datetime.now(timezone.utc)
            )
        )
    )
    return result.scalar_one_or_none()


async def revoke_refresh_token(
    db: AsyncSession,
    token: str,
    user_id: UUID
) -> bool:
    """Revoke a refresh token."""
    token_record = await get_refresh_token(db, token, user_id)
    if token_record:
        token_record.revoked_at = datetime.now(timezone.utc)
        await db.commit()
        return True
    return False


async def revoke_all_user_tokens(db: AsyncSession, user_id: UUID) -> int:
    """Revoke all refresh tokens for a user."""
    result = await db.execute(
        select(RefreshToken).where(
            and_(
                RefreshToken.user_id == user_id,
                RefreshToken.revoked_at.is_(None)
            )
        )
    )
    tokens = result.scalars().all()
    count = 0
    for token in tokens:
        token.revoked_at = datetime.now(timezone.utc)
        count += 1
    await db.commit()
    return count
