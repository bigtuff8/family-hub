"""
Service-to-service shopping endpoints (API key auth).
Location: backend/services/shopping/service_routes.py

Used by: Alexa sync service, Alexa skill Lambda.
Authenticated via X-API-Key header instead of JWT.
"""

from datetime import datetime, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, and_, update
from sqlalchemy.ext.asyncio import AsyncSession

from shared.database import get_db
from shared.models import ShoppingItem, AlexaSyncState
from services.auth.api_key import get_service_auth, require_scope, ServiceContext
from services.shopping import crud, schemas as shopping_schemas
from services.shopping.utils import normalize_item_name
from services.shopping.service_schemas import (
    ServiceBulkAddRequest,
    ServiceBulkAddResponse,
    ServiceItemResult,
    ServiceItemResponse,
    ServiceCheckItemsRequest,
    ServiceDeleteItemsRequest,
    ServiceSyncStatusResponse,
    ServiceSyncStatusUpdate,
)

router = APIRouter()


@router.get("/service/items")
async def get_service_items(
    context: ServiceContext = Depends(require_scope("shopping:read")),
    db: AsyncSession = Depends(get_db)
):
    """Get all unchecked items on the default shopping list. Used by sync service to diff."""
    default_list = await crud.get_or_create_default_list(db, context.tenant_id)

    items = await crud.get_items_by_list(
        db, default_list.id, context.tenant_id, include_checked=False
    )

    return [
        ServiceItemResponse(
            id=str(item.id),
            name=item.name,
            name_normalized=item.name_normalized,
            quantity=float(item.quantity) if item.quantity else 1.0,
            unit=item.unit,
            category=item.category or "Other",
            checked=item.checked,
            source=item.source or "manual",
            created_at=item.created_at.isoformat() if item.created_at else None,
        )
        for item in items
    ]


@router.get("/service/items/all")
async def get_service_items_all(
    context: ServiceContext = Depends(require_scope("shopping:read")),
    db: AsyncSession = Depends(get_db)
):
    """Get ALL items (including checked) for full sync comparison."""
    default_list = await crud.get_or_create_default_list(db, context.tenant_id)

    items = await crud.get_items_by_list(
        db, default_list.id, context.tenant_id, include_checked=True
    )

    return [
        ServiceItemResponse(
            id=str(item.id),
            name=item.name,
            name_normalized=item.name_normalized,
            quantity=float(item.quantity) if item.quantity else 1.0,
            unit=item.unit,
            category=item.category or "Other",
            checked=item.checked,
            source=item.source or "manual",
            created_at=item.created_at.isoformat() if item.created_at else None,
        )
        for item in items
    ]


@router.post("/service/items", response_model=ServiceBulkAddResponse)
async def add_service_items(
    request: ServiceBulkAddRequest,
    context: ServiceContext = Depends(require_scope("shopping:write")),
    db: AsyncSession = Depends(get_db)
):
    """
    Bulk add items to the default shopping list.
    Uses force_add=True (no interactive duplicate prompts).
    Existing unchecked duplicates get their quantity merged.
    """
    default_list = await crud.get_or_create_default_list(db, context.tenant_id)

    added = 0
    merged = 0
    skipped = 0
    details = []

    for item_input in request.items:
        item_data = shopping_schemas.ShoppingItemCreate(
            name=item_input.name,
            quantity=item_input.quantity,
            unit=item_input.unit,
            category=item_input.category,
            source=item_input.source,
            force_add=True,
        )

        item, was_merged, prev_qty, _ = await crud.add_item(
            db=db,
            list_id=default_list.id,
            tenant_id=context.tenant_id,
            user_id=context.user_id,
            item_data=item_data,
            force_add=True,
        )

        if item and was_merged:
            merged += 1
            details.append(ServiceItemResult(
                name=item_input.name,
                status="merged",
                id=str(item.id),
                new_quantity=float(item.quantity) if item.quantity else None,
            ))
        elif item:
            added += 1
            details.append(ServiceItemResult(
                name=item_input.name,
                status="added",
                id=str(item.id),
            ))
        else:
            skipped += 1
            details.append(ServiceItemResult(
                name=item_input.name,
                status="skipped",
            ))

    return ServiceBulkAddResponse(
        added=added,
        merged=merged,
        skipped=skipped,
        details=details,
    )


@router.post("/service/items/check")
async def check_service_items(
    request: ServiceCheckItemsRequest,
    context: ServiceContext = Depends(require_scope("shopping:write")),
    db: AsyncSession = Depends(get_db)
):
    """
    Mark items as checked by name. Used for sync-back
    (item checked in Family Hub → remove from Amazon list).
    """
    default_list = await crud.get_or_create_default_list(db, context.tenant_id)
    now = datetime.now(timezone.utc)
    checked_count = 0

    for name in request.names:
        name_normalized = normalize_item_name(name)
        result = await db.execute(
            select(ShoppingItem).where(
                and_(
                    ShoppingItem.list_id == default_list.id,
                    ShoppingItem.name_normalized == name_normalized,
                    ShoppingItem.checked == False
                )
            )
        )
        item = result.scalar_one_or_none()
        if item:
            item.checked = True
            item.checked_at = now
            item.updated_at = now
            checked_count += 1

    await db.commit()
    return {"checked": checked_count, "total_requested": len(request.names)}


@router.post("/service/items/delete-by-name")
async def delete_service_items_by_name(
    request: ServiceDeleteItemsRequest,
    context: ServiceContext = Depends(require_scope("shopping:write")),
    db: AsyncSession = Depends(get_db)
):
    """Delete items by name. Used for sync operations."""
    default_list = await crud.get_or_create_default_list(db, context.tenant_id)
    deleted_count = 0

    for name in request.names:
        name_normalized = normalize_item_name(name)
        result = await db.execute(
            select(ShoppingItem).where(
                and_(
                    ShoppingItem.list_id == default_list.id,
                    ShoppingItem.name_normalized == name_normalized,
                )
            )
        )
        item = result.scalar_one_or_none()
        if item:
            await db.delete(item)
            deleted_count += 1

    await db.commit()
    return {"deleted": deleted_count, "total_requested": len(request.names)}


@router.get("/service/sync-status", response_model=ServiceSyncStatusResponse)
async def get_sync_status(
    context: ServiceContext = Depends(require_scope("shopping:read")),
    db: AsyncSession = Depends(get_db)
):
    """Get Alexa sync service status."""
    result = await db.execute(
        select(AlexaSyncState).where(AlexaSyncState.tenant_id == context.tenant_id)
    )
    state = result.scalar_one_or_none()

    if not state:
        return ServiceSyncStatusResponse(
            is_enabled=False,
            sync_direction="bidirectional",
        )

    return ServiceSyncStatusResponse(
        is_enabled=state.is_enabled,
        sync_direction=state.sync_direction or "bidirectional",
        last_sync_at=state.last_sync_at.isoformat() if state.last_sync_at else None,
        last_sync_status=state.last_sync_status,
        last_sync_error=state.last_sync_error,
        items_imported_total=state.items_imported_total or 0,
        items_exported_total=state.items_exported_total or 0,
        cookie_status=state.cookie_status or "not_configured",
    )


@router.put("/service/sync-status")
async def update_sync_status(
    request: ServiceSyncStatusUpdate,
    context: ServiceContext = Depends(require_scope("shopping:write")),
    db: AsyncSession = Depends(get_db)
):
    """Update sync status (called by the Alexa sync service after each cycle)."""
    result = await db.execute(
        select(AlexaSyncState).where(AlexaSyncState.tenant_id == context.tenant_id)
    )
    state = result.scalar_one_or_none()

    now = datetime.now(timezone.utc)

    if not state:
        state = AlexaSyncState(
            tenant_id=context.tenant_id,
            is_enabled=True,
            last_sync_at=now,
            last_sync_status=request.last_sync_status,
            last_sync_error=request.last_sync_error,
            items_imported_total=request.items_imported,
            items_exported_total=request.items_exported,
            cookie_status=request.cookie_status or "valid",
        )
        db.add(state)
    else:
        state.last_sync_at = now
        state.last_sync_status = request.last_sync_status
        state.last_sync_error = request.last_sync_error
        state.items_imported_total = (state.items_imported_total or 0) + request.items_imported
        state.items_exported_total = (state.items_exported_total or 0) + request.items_exported
        if request.cookie_status:
            state.cookie_status = request.cookie_status
        state.is_enabled = True

    await db.commit()
    return {"success": True, "message": "Sync status updated"}
