"""
API Key authentication for service-to-service communication.
Location: backend/services/auth/api_key.py

Used by: Alexa sync service, Alexa skill Lambda, future integrations.
"""

import secrets
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

import bcrypt
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import APIKeyHeader
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from shared.database import get_db
from shared.models import ApiKey

# API key format: fh_ak_<32 hex chars>
API_KEY_PREFIX = "fh_ak_"
API_KEY_LENGTH = 32  # hex chars after prefix

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


@dataclass
class ServiceContext:
    """Context returned by API key auth dependency."""
    tenant_id: UUID
    user_id: UUID  # The user who created the key (used as added_by)
    scopes: list[str]
    api_key_id: UUID


def generate_api_key(name: str) -> tuple[str, str, str]:
    """
    Generate a new API key.

    Returns:
        (plaintext_key, key_hash, key_prefix)
        The plaintext key is shown once to the user, then only the hash is stored.
    """
    random_part = secrets.token_hex(API_KEY_LENGTH)
    plaintext_key = f"{API_KEY_PREFIX}{random_part}"
    key_prefix = plaintext_key[:12]  # "fh_ak_" + first 6 hex chars

    # Hash the full key with bcrypt
    key_hash = bcrypt.hashpw(
        plaintext_key.encode('utf-8'),
        bcrypt.gensalt()
    ).decode('utf-8')

    return plaintext_key, key_hash, key_prefix


async def verify_api_key(db: AsyncSession, plaintext_key: str) -> Optional[ApiKey]:
    """
    Verify an API key by prefix lookup + bcrypt comparison.
    Returns the ApiKey record if valid, None otherwise.
    """
    if not plaintext_key or not plaintext_key.startswith(API_KEY_PREFIX):
        return None

    key_prefix = plaintext_key[:12]

    # Find candidates by prefix (should be very few, usually 1)
    result = await db.execute(
        select(ApiKey).where(
            ApiKey.key_prefix == key_prefix,
            ApiKey.is_active == True
        )
    )
    candidates = result.scalars().all()

    for candidate in candidates:
        # Check expiry
        if candidate.expires_at and candidate.expires_at < datetime.now(timezone.utc):
            continue

        # Verify bcrypt hash
        if bcrypt.checkpw(plaintext_key.encode('utf-8'), candidate.key_hash.encode('utf-8')):
            # Update last_used_at
            await db.execute(
                update(ApiKey)
                .where(ApiKey.id == candidate.id)
                .values(last_used_at=datetime.now(timezone.utc))
            )
            await db.commit()
            return candidate

    return None


async def get_service_auth(
    api_key: Optional[str] = Security(api_key_header),
    db: AsyncSession = Depends(get_db)
) -> ServiceContext:
    """
    FastAPI dependency for API key authentication.
    Use instead of get_current_user for service-to-service endpoints.
    """
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key required (X-API-Key header)"
        )

    key_record = await verify_api_key(db, api_key)
    if not key_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired API key"
        )

    return ServiceContext(
        tenant_id=key_record.tenant_id,
        user_id=key_record.created_by,
        scopes=key_record.scopes or [],
        api_key_id=key_record.id
    )


def require_scope(required_scope: str):
    """
    Dependency factory to check API key scopes.
    Usage: Depends(require_scope("shopping:write"))
    """
    async def scope_checker(
        context: ServiceContext = Depends(get_service_auth)
    ) -> ServiceContext:
        if required_scope not in context.scopes:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"API key lacks required scope: {required_scope}"
            )
        return context
    return scope_checker
