"""
Shopping list API routes
Location: backend/services/shopping/routes.py
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from shared.database import get_db
from shared.models import User
from services.auth.security import get_current_user, get_current_tenant_id
from services.shopping import crud, schemas

router = APIRouter()


# ============ Shopping Lists ============

@router.get("/lists", response_model=list[schemas.ShoppingListSummary])
async def get_shopping_lists(
    tenant_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db)
):
    """Get all shopping lists for the current tenant."""
    lists = await crud.get_lists_by_tenant(db, tenant_id)
    return lists


@router.post("/lists", response_model=schemas.ShoppingListSummary, status_code=status.HTTP_201_CREATED)
async def create_shopping_list(
    request: schemas.ShoppingListCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new shopping list."""
    shopping_list = await crud.create_list(
        db,
        tenant_id=current_user.tenant_id,
        name=request.name,
        is_default=request.is_default,
    )
    return {
        "id": shopping_list.id,
        "name": shopping_list.name,
        "is_default": shopping_list.is_default,
        "item_count": 0,
        "checked_count": 0,
        "updated_at": shopping_list.updated_at,
    }


@router.get("/lists/{list_id}", response_model=schemas.ShoppingListResponse)
async def get_shopping_list(
    list_id: UUID,
    tenant_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db)
):
    """Get a shopping list with all its items."""
    shopping_list = await crud.get_list_by_id(db, list_id, tenant_id)
    if not shopping_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shopping list not found"
        )

    items = await crud.get_items_by_list(db, list_id, tenant_id)

    # Batch fetch all users (fixes N+1 query problem)
    user_ids = list(set(item.added_by for item in items if item.added_by))
    users_map = await crud.get_users_by_ids(db, user_ids)

    # Build response with user info
    item_responses = []
    for item in items:
        added_by = None
        if item.added_by and item.added_by in users_map:
            user = users_map[item.added_by]
            added_by = {"id": user.id, "name": user.name}

        item_responses.append(schemas.ShoppingItemResponse(
            id=item.id,
            name=item.name,
            quantity=item.quantity,
            unit=item.unit,
            category=item.category,
            checked=item.checked,
            checked_at=item.checked_at,
            source=item.source,
            recipe_id=item.recipe_id,
            added_by=added_by,
            created_at=item.created_at,
            updated_at=item.updated_at,
        ))

    # Get unique categories
    categories = sorted(set(item.category for item in items))

    return schemas.ShoppingListResponse(
        id=shopping_list.id,
        name=shopping_list.name,
        is_default=shopping_list.is_default,
        items=item_responses,
        categories=categories,
        created_at=shopping_list.created_at,
        updated_at=shopping_list.updated_at,
    )


@router.get("/default", response_model=schemas.ShoppingListResponse)
async def get_default_list(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get the default shopping list (creates one if it doesn't exist)."""
    shopping_list = await crud.get_or_create_default_list(db, current_user.tenant_id)

    items = await crud.get_items_by_list(db, shopping_list.id, current_user.tenant_id)

    # Batch fetch all users (fixes N+1 query problem)
    user_ids = list(set(item.added_by for item in items if item.added_by))
    users_map = await crud.get_users_by_ids(db, user_ids)

    # Build response with user info
    item_responses = []
    for item in items:
        added_by = None
        if item.added_by and item.added_by in users_map:
            user = users_map[item.added_by]
            added_by = {"id": user.id, "name": user.name}

        item_responses.append(schemas.ShoppingItemResponse(
            id=item.id,
            name=item.name,
            quantity=item.quantity,
            unit=item.unit,
            category=item.category,
            checked=item.checked,
            checked_at=item.checked_at,
            source=item.source,
            recipe_id=item.recipe_id,
            added_by=added_by,
            created_at=item.created_at,
            updated_at=item.updated_at,
        ))

    categories = sorted(set(item.category for item in items))

    return schemas.ShoppingListResponse(
        id=shopping_list.id,
        name=shopping_list.name,
        is_default=shopping_list.is_default,
        items=item_responses,
        categories=categories,
        created_at=shopping_list.created_at,
        updated_at=shopping_list.updated_at,
    )


# ============ Shopping Items ============

@router.post("/lists/{list_id}/items", response_model=schemas.AddItemResponse)
async def add_item(
    list_id: UUID,
    request: schemas.ShoppingItemCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Add an item to a shopping list.
    - Merges with existing unchecked duplicates
    - Detects recently completed duplicates (within 24h) and prompts for confirmation
    - Use force_add=true to bypass duplicate check
    """
    from datetime import datetime, timezone

    # Verify list exists and belongs to tenant
    shopping_list = await crud.get_list_by_id(db, list_id, current_user.tenant_id)
    if not shopping_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shopping list not found"
        )

    item, was_merged, previous_quantity, recently_completed = await crud.add_item(
        db,
        list_id=list_id,
        tenant_id=current_user.tenant_id,
        user_id=current_user.id,
        item_data=request,
        force_add=request.force_add,
    )

    # If duplicate detected and not force_add, return warning
    if recently_completed and item is None:
        hours_ago = (datetime.now(timezone.utc) - recently_completed.checked_at).total_seconds() / 3600
        return schemas.AddItemResponse(
            item=None,
            duplicate_detected=True,
            recently_completed=schemas.RecentlyCompletedDuplicate(
                id=recently_completed.id,
                name=recently_completed.name,
                checked_at=recently_completed.checked_at,
                hours_ago=round(hours_ago, 1),
            ),
        )

    # Normal response with item
    added_by = {"id": current_user.id, "name": current_user.name}

    item_response = schemas.ShoppingItemResponse(
        id=item.id,
        name=item.name,
        quantity=item.quantity,
        unit=item.unit,
        category=item.category,
        checked=item.checked,
        checked_at=item.checked_at,
        source=item.source,
        recipe_id=item.recipe_id,
        added_by=added_by,
        created_at=item.created_at,
        updated_at=item.updated_at,
        merged=was_merged,
        previous_quantity=previous_quantity,
    )

    return schemas.AddItemResponse(
        item=item_response,
        merged=was_merged,
        previous_quantity=previous_quantity,
        duplicate_detected=False,
    )


@router.put("/lists/{list_id}/items/{item_id}", response_model=schemas.ShoppingItemResponse)
async def update_item(
    list_id: UUID,
    item_id: UUID,
    request: schemas.ShoppingItemUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a shopping item."""
    item = await crud.get_item_by_id(db, item_id, current_user.tenant_id)
    if not item or item.list_id != list_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )

    updated_item = await crud.update_item(
        db,
        item,
        name=request.name,
        quantity=request.quantity,
        unit=request.unit,
        category=request.category,
    )

    added_by = None
    if updated_item.added_by:
        user = await crud.get_user_by_id(db, updated_item.added_by)
        if user:
            added_by = {"id": user.id, "name": user.name}

    return schemas.ShoppingItemResponse(
        id=updated_item.id,
        name=updated_item.name,
        quantity=updated_item.quantity,
        unit=updated_item.unit,
        category=updated_item.category,
        checked=updated_item.checked,
        checked_at=updated_item.checked_at,
        source=updated_item.source,
        recipe_id=updated_item.recipe_id,
        added_by=added_by,
        created_at=updated_item.created_at,
        updated_at=updated_item.updated_at,
    )


@router.delete("/lists/{list_id}/items/{item_id}", response_model=schemas.MessageResponse)
async def delete_item(
    list_id: UUID,
    item_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a shopping item."""
    item = await crud.get_item_by_id(db, item_id, current_user.tenant_id)
    if not item or item.list_id != list_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )

    await crud.delete_item(db, item)
    return schemas.MessageResponse(message="Item deleted")


@router.post("/lists/{list_id}/items/{item_id}/toggle", response_model=schemas.ToggleResponse)
async def toggle_item(
    list_id: UUID,
    item_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Toggle the checked state of an item."""
    item = await crud.get_item_by_id(db, item_id, current_user.tenant_id)
    if not item or item.list_id != list_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )

    toggled_item = await crud.toggle_item(db, item)
    return schemas.ToggleResponse(
        id=toggled_item.id,
        checked=toggled_item.checked,
        checked_at=toggled_item.checked_at,
    )


@router.post("/lists/{list_id}/complete", response_model=schemas.CompleteShopResponse)
async def complete_shop(
    list_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark all unchecked items as complete (bulk check-off)."""
    shopping_list = await crud.get_list_by_id(db, list_id, current_user.tenant_id)
    if not shopping_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shopping list not found"
        )

    items_completed, total_items = await crud.complete_shop(db, list_id, current_user.tenant_id)

    return schemas.CompleteShopResponse(
        message="Shopping complete" if items_completed > 0 else "All items already checked",
        items_cleared=items_completed,  # Reusing field name for backward compatibility
        items_remaining=total_items - items_completed,  # Items that were already checked
    )


# ============ Metadata Endpoints ============

@router.get("/suggestions", response_model=list[str])
async def get_item_suggestions(
    tenant_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db)
):
    """Get unique item names for autocomplete."""
    return await crud.get_unique_item_names(db, tenant_id)


@router.get("/categories", response_model=list[str])
async def get_categories():
    """Get all available categories."""
    from services.shopping.utils import get_all_categories
    return get_all_categories()


@router.get("/units", response_model=list[str])
async def get_units():
    """Get all common units."""
    from services.shopping.utils import get_all_units
    return get_all_units()


# ============ Category Management ============

@router.get("/categories/full", response_model=list[schemas.ShoppingCategoryResponse])
async def get_categories_full(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all categories with full details (icons, colors, keywords)."""
    categories = await crud.get_or_create_default_categories(db, current_user.tenant_id)
    return categories


@router.post("/categories", response_model=schemas.ShoppingCategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    request: schemas.ShoppingCategoryCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new custom category."""
    # Check if category name already exists
    existing = await crud.get_category_by_name(db, request.name, current_user.tenant_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Category '{request.name}' already exists"
        )

    category = await crud.create_category(db, current_user.tenant_id, request)
    return category


@router.put("/categories/{category_id}", response_model=schemas.ShoppingCategoryResponse)
async def update_category(
    category_id: UUID,
    request: schemas.ShoppingCategoryUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a category."""
    category = await crud.get_category_by_id(db, category_id, current_user.tenant_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )

    # Check if new name conflicts with existing
    if request.name and request.name != category.name:
        existing = await crud.get_category_by_name(db, request.name, current_user.tenant_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Category '{request.name}' already exists"
            )

    updated_category = await crud.update_category(db, category, request)
    return updated_category


@router.delete("/categories/{category_id}", response_model=schemas.MessageResponse)
async def delete_category(
    category_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a category (moves items to 'Other')."""
    category = await crud.get_category_by_id(db, category_id, current_user.tenant_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )

    # Don't allow deleting "Other" category
    if category.name == "Other":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete the 'Other' category"
        )

    await crud.delete_category(db, category, current_user.tenant_id)
    return schemas.MessageResponse(message=f"Category '{category.name}' deleted. Items moved to 'Other'.")


@router.put("/categories/reorder", response_model=list[schemas.ShoppingCategoryResponse])
async def reorder_categories(
    request: schemas.CategoryReorderRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Reorder categories."""
    categories = await crud.reorder_categories(db, current_user.tenant_id, request.category_ids)
    return categories


@router.post("/categories/{category_id}/keywords", response_model=schemas.ShoppingCategoryResponse)
async def add_keyword(
    category_id: UUID,
    request: schemas.KeywordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Add a keyword to a category."""
    category = await crud.get_category_by_id(db, category_id, current_user.tenant_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )

    updated_category = await crud.add_keyword_to_category(db, category, request.keyword)
    return updated_category


@router.delete("/categories/{category_id}/keywords/{keyword}", response_model=schemas.ShoppingCategoryResponse)
async def remove_keyword(
    category_id: UUID,
    keyword: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Remove a keyword from a category."""
    category = await crud.get_category_by_id(db, category_id, current_user.tenant_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )

    updated_category = await crud.remove_keyword_from_category(db, category, keyword)
    return updated_category
