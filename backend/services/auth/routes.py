"""
Authentication API routes
Location: backend/services/auth/routes.py
"""

from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from shared.database import get_db
from shared.models import User
from services.auth import crud, schemas
from services.auth.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user,
    get_password_hash,
    require_role,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_DAYS,
)

router = APIRouter()


@router.post("/login", response_model=schemas.TokenResponse)
async def login(
    request: schemas.LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Authenticate user and return JWT tokens.
    """
    user = await crud.authenticate_user(db, request.email, request.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Get tenant info
    tenant = await crud.get_tenant_by_id(db, user.tenant_id)
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="User tenant not found",
        )

    # Create tokens
    token_data = {
        "sub": str(user.id),
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "tenant_id": str(user.tenant_id),
    }

    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token({"sub": str(user.id)})

    # Store refresh token
    expires_at = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    await crud.store_refresh_token(db, user.id, refresh_token, expires_at)

    # Update last login
    await crud.update_last_login(db, user)

    return schemas.TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=schemas.UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            role=user.role,
            color=user.color,
            avatar_url=user.avatar_url,
            tenant_id=user.tenant_id,
            is_active=user.is_active,
            last_login=user.last_login,
            created_at=user.created_at,
        )
    )


@router.post("/refresh", response_model=schemas.AccessTokenResponse)
async def refresh_token(
    request: schemas.RefreshRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Get a new access token using a valid refresh token.
    """
    # Decode refresh token
    try:
        payload = decode_token(request.refresh_token)
    except HTTPException:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    # Verify token exists in database and is valid
    token_record = await crud.get_refresh_token(db, request.refresh_token, UUID(user_id))
    if not token_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found or expired",
        )

    # Get user
    user = await crud.get_user_by_id(db, UUID(user_id))
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    # Create new access token
    token_data = {
        "sub": str(user.id),
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "tenant_id": str(user.tenant_id),
    }
    access_token = create_access_token(token_data)

    return schemas.AccessTokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post("/logout", response_model=schemas.MessageResponse)
async def logout(
    request: schemas.LogoutRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Logout by revoking the refresh token.
    """
    revoked = await crud.revoke_refresh_token(db, request.refresh_token, current_user.id)
    if not revoked:
        # Token might already be revoked or expired, but that's fine
        pass

    return schemas.MessageResponse(message="Successfully logged out")


@router.get("/me", response_model=schemas.CurrentUserResponse)
async def get_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get current authenticated user info.
    """
    tenant = await crud.get_tenant_by_id(db, current_user.tenant_id)
    tenant_name = tenant.name if tenant else "Unknown"

    return schemas.CurrentUserResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        role=current_user.role,
        color=current_user.color,
        avatar_url=current_user.avatar_url,
        tenant_id=current_user.tenant_id,
        tenant_name=tenant_name,
        is_active=current_user.is_active,
        last_login=current_user.last_login,
    )


# ============ User Management (Admin Only) ============

@router.get("/users", response_model=list[schemas.UserResponse])
async def list_users(
    current_user: User = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_db)
):
    """
    List all users in the tenant (admin only).
    """
    users = await crud.get_users_by_tenant(db, current_user.tenant_id)
    return [
        schemas.UserResponse(
            id=u.id,
            email=u.email,
            name=u.name,
            role=u.role,
            color=u.color,
            avatar_url=u.avatar_url,
            tenant_id=u.tenant_id,
            is_active=u.is_active,
            last_login=u.last_login,
            created_at=u.created_at,
        )
        for u in users
    ]


@router.post("/users", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    request: schemas.UserCreate,
    current_user: User = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new user in the tenant (admin only).
    """
    # Check if email already exists
    existing = await crud.get_user_by_email(db, request.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user = await crud.create_user(
        db,
        tenant_id=current_user.tenant_id,
        email=request.email,
        password=request.password,
        name=request.name,
        role=request.role,
        color=request.color,
    )

    return schemas.UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role,
        color=user.color,
        avatar_url=user.avatar_url,
        tenant_id=user.tenant_id,
        is_active=user.is_active,
        last_login=user.last_login,
        created_at=user.created_at,
    )


@router.get("/users/{user_id}", response_model=schemas.UserResponse)
async def get_user(
    user_id: UUID,
    current_user: User = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific user (admin only).
    """
    user = await crud.get_user_by_id(db, user_id)
    if not user or user.tenant_id != current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return schemas.UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role,
        color=user.color,
        avatar_url=user.avatar_url,
        tenant_id=user.tenant_id,
        is_active=user.is_active,
        last_login=user.last_login,
        created_at=user.created_at,
    )


@router.put("/users/{user_id}", response_model=schemas.UserResponse)
async def update_user(
    user_id: UUID,
    request: schemas.UserUpdate,
    current_user: User = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a user (admin only).
    """
    user = await crud.get_user_by_id(db, user_id)
    if not user or user.tenant_id != current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Check email uniqueness if changing
    if request.email and request.email != user.email:
        existing = await crud.get_user_by_email(db, request.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

    updated_user = await crud.update_user(
        db,
        user,
        email=request.email,
        name=request.name,
        role=request.role,
        color=request.color,
        is_active=request.is_active,
    )

    return schemas.UserResponse(
        id=updated_user.id,
        email=updated_user.email,
        name=updated_user.name,
        role=updated_user.role,
        color=updated_user.color,
        avatar_url=updated_user.avatar_url,
        tenant_id=updated_user.tenant_id,
        is_active=updated_user.is_active,
        last_login=updated_user.last_login,
        created_at=updated_user.created_at,
    )


@router.delete("/users/{user_id}", response_model=schemas.MessageResponse)
async def delete_user(
    user_id: UUID,
    current_user: User = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_db)
):
    """
    Deactivate a user (admin only). Doesn't delete, just sets is_active=False.
    """
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate yourself",
        )

    user = await crud.get_user_by_id(db, user_id)
    if not user or user.tenant_id != current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    await crud.update_user(db, user, is_active=False)
    await crud.revoke_all_user_tokens(db, user_id)

    return schemas.MessageResponse(message="User deactivated successfully")
