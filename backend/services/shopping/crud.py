"""
Shopping list database operations
Location: backend/services/shopping/crud.py
"""

from datetime import datetime, timezone, timedelta
from decimal import Decimal
from typing import Optional
from uuid import UUID

from sqlalchemy import select, and_, or_, func, delete, update
from sqlalchemy.ext.asyncio import AsyncSession

from shared.models import ShoppingList, ShoppingItem, ShoppingCategory, User
from services.shopping.utils import normalize_item_name, categorize_item, get_default_categories
from services.shopping import schemas


# ============ Shopping List Operations ============

async def get_lists_by_tenant(db: AsyncSession, tenant_id: UUID) -> list[dict]:
    """Get all shopping lists for a tenant with item counts."""
    result = await db.execute(
        select(ShoppingList).where(ShoppingList.tenant_id == tenant_id)
    )
    lists = result.scalars().all()

    summaries = []
    for lst in lists:
        # Count items
        count_result = await db.execute(
            select(func.count(ShoppingItem.id))
            .where(ShoppingItem.list_id == lst.id)
        )
        item_count = count_result.scalar() or 0

        # Count checked items
        checked_result = await db.execute(
            select(func.count(ShoppingItem.id))
            .where(and_(
                ShoppingItem.list_id == lst.id,
                ShoppingItem.checked == True
            ))
        )
        checked_count = checked_result.scalar() or 0

        summaries.append({
            "id": lst.id,
            "name": lst.name,
            "is_default": lst.is_default,
            "item_count": item_count,
            "checked_count": checked_count,
            "updated_at": lst.updated_at,
        })

    return summaries


async def get_list_by_id(
    db: AsyncSession,
    list_id: UUID,
    tenant_id: UUID
) -> Optional[ShoppingList]:
    """Get a specific shopping list."""
    result = await db.execute(
        select(ShoppingList).where(
            and_(
                ShoppingList.id == list_id,
                ShoppingList.tenant_id == tenant_id
            )
        )
    )
    return result.scalar_one_or_none()


async def get_default_list(db: AsyncSession, tenant_id: UUID) -> Optional[ShoppingList]:
    """Get the default shopping list for a tenant."""
    result = await db.execute(
        select(ShoppingList).where(
            and_(
                ShoppingList.tenant_id == tenant_id,
                ShoppingList.is_default == True
            )
        )
    )
    return result.scalar_one_or_none()


async def create_list(
    db: AsyncSession,
    tenant_id: UUID,
    name: str = "Grocery List",
    is_default: bool = False
) -> ShoppingList:
    """Create a new shopping list."""
    # If this is default, unset any existing default
    if is_default:
        await db.execute(
            select(ShoppingList)
            .where(and_(
                ShoppingList.tenant_id == tenant_id,
                ShoppingList.is_default == True
            ))
        )
        existing = await get_default_list(db, tenant_id)
        if existing:
            existing.is_default = False

    shopping_list = ShoppingList(
        tenant_id=tenant_id,
        name=name,
        is_default=is_default,
    )
    db.add(shopping_list)
    await db.commit()
    await db.refresh(shopping_list)
    return shopping_list


async def get_or_create_default_list(db: AsyncSession, tenant_id: UUID) -> ShoppingList:
    """Get default list or create one if it doesn't exist."""
    default_list = await get_default_list(db, tenant_id)
    if default_list:
        return default_list

    return await create_list(db, tenant_id, "Grocery List", is_default=True)


# ============ Shopping Item Operations ============

async def get_items_by_list(
    db: AsyncSession,
    list_id: UUID,
    tenant_id: UUID,
    include_checked: bool = True,
    hide_completed_after_hours: int = 24
) -> list[ShoppingItem]:
    """
    Get all items in a shopping list.
    Items checked more than hide_completed_after_hours ago are excluded.
    """
    cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hide_completed_after_hours)

    query = select(ShoppingItem).where(
        and_(
            ShoppingItem.list_id == list_id,
            ShoppingItem.tenant_id == tenant_id,
            # Exclude items checked more than 24 hours ago
            or_(
                ShoppingItem.checked == False,
                ShoppingItem.checked_at == None,
                ShoppingItem.checked_at > cutoff_time
            )
        )
    )

    if not include_checked:
        query = query.where(ShoppingItem.checked == False)

    query = query.order_by(ShoppingItem.category, ShoppingItem.name)

    result = await db.execute(query)
    return result.scalars().all()


async def get_item_by_id(
    db: AsyncSession,
    item_id: UUID,
    tenant_id: UUID
) -> Optional[ShoppingItem]:
    """Get a specific shopping item."""
    result = await db.execute(
        select(ShoppingItem).where(
            and_(
                ShoppingItem.id == item_id,
                ShoppingItem.tenant_id == tenant_id
            )
        )
    )
    return result.scalar_one_or_none()


async def find_duplicate_item(
    db: AsyncSession,
    list_id: UUID,
    name_normalized: str
) -> Optional[ShoppingItem]:
    """Find an existing unchecked item with the same normalized name."""
    result = await db.execute(
        select(ShoppingItem).where(
            and_(
                ShoppingItem.list_id == list_id,
                ShoppingItem.name_normalized == name_normalized,
                ShoppingItem.checked == False
            )
        )
    )
    return result.scalar_one_or_none()


async def find_recently_completed_item(
    db: AsyncSession,
    list_id: UUID,
    name_normalized: str,
    hours: int = 24
) -> Optional[ShoppingItem]:
    """Find a checked item with same name completed within the last N hours."""
    cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours)
    result = await db.execute(
        select(ShoppingItem).where(
            and_(
                ShoppingItem.list_id == list_id,
                ShoppingItem.name_normalized == name_normalized,
                ShoppingItem.checked == True,
                ShoppingItem.checked_at != None,
                ShoppingItem.checked_at > cutoff_time
            )
        )
    )
    return result.scalar_one_or_none()


async def add_item(
    db: AsyncSession,
    list_id: UUID,
    tenant_id: UUID,
    user_id: UUID,
    item_data: schemas.ShoppingItemCreate,
    force_add: bool = False
) -> tuple[ShoppingItem | None, bool, Optional[Decimal], Optional[ShoppingItem]]:
    """
    Add an item to a shopping list with duplicate handling.
    Returns: (item, was_merged, previous_quantity, recently_completed_duplicate)

    If force_add=False and a recently completed duplicate exists:
      - Returns (None, False, None, recently_completed_item)
      - Caller should prompt user for confirmation

    If force_add=True and a recently completed duplicate exists:
      - Deletes the old completed item
      - Creates a fresh new item
    """
    name_normalized = normalize_item_name(item_data.name)

    # Check for existing unchecked item (always merge these)
    existing = await find_duplicate_item(db, list_id, name_normalized)

    if existing:
        # Merge: add quantities
        previous_quantity = existing.quantity
        existing.quantity = (existing.quantity or Decimal("1")) + (item_data.quantity or Decimal("1"))
        existing.source = "multiple"
        existing.updated_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(existing)
        return existing, True, previous_quantity, None

    # Check for recently completed duplicate
    recently_completed = await find_recently_completed_item(db, list_id, name_normalized)

    if recently_completed and not force_add:
        # Return the duplicate for user confirmation
        return None, False, None, recently_completed

    if recently_completed and force_add:
        # Delete the old completed item before creating new
        await db.delete(recently_completed)

    # Create new item
    category = item_data.category or categorize_item(item_data.name)

    new_item = ShoppingItem(
        list_id=list_id,
        tenant_id=tenant_id,
        name=item_data.name,
        name_normalized=name_normalized,
        quantity=item_data.quantity or Decimal("1"),
        unit=item_data.unit,
        category=category,
        source=item_data.source or "manual",
        recipe_id=item_data.recipe_id,
        added_by=user_id,
    )
    db.add(new_item)
    await db.commit()
    await db.refresh(new_item)
    return new_item, False, None, None


async def update_item(
    db: AsyncSession,
    item: ShoppingItem,
    **kwargs
) -> ShoppingItem:
    """Update a shopping item."""
    for key, value in kwargs.items():
        if value is not None and hasattr(item, key):
            setattr(item, key, value)
            # Update normalized name if name changes
            if key == "name":
                item.name_normalized = normalize_item_name(value)

    item.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(item)
    return item


async def toggle_item(db: AsyncSession, item: ShoppingItem) -> ShoppingItem:
    """Toggle the checked state of an item."""
    item.checked = not item.checked
    item.checked_at = datetime.now(timezone.utc) if item.checked else None
    item.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(item)
    return item


async def delete_item(db: AsyncSession, item: ShoppingItem) -> None:
    """Delete a shopping item."""
    await db.delete(item)
    await db.commit()


async def complete_shop(db: AsyncSession, list_id: UUID, tenant_id: UUID) -> tuple[int, int]:
    """
    Mark all unchecked items as checked (bulk complete).
    Returns: (items_completed, total_items)
    """
    now = datetime.now(timezone.utc)

    # Count unchecked items that will be completed
    unchecked_result = await db.execute(
        select(func.count(ShoppingItem.id))
        .where(and_(
            ShoppingItem.list_id == list_id,
            ShoppingItem.tenant_id == tenant_id,
            ShoppingItem.checked == False
        ))
    )
    items_completed = unchecked_result.scalar() or 0

    # Mark all unchecked items as checked
    await db.execute(
        update(ShoppingItem)
        .where(and_(
            ShoppingItem.list_id == list_id,
            ShoppingItem.tenant_id == tenant_id,
            ShoppingItem.checked == False
        ))
        .values(checked=True, checked_at=now, updated_at=now)
    )

    # Count total items
    total_result = await db.execute(
        select(func.count(ShoppingItem.id))
        .where(and_(
            ShoppingItem.list_id == list_id,
            ShoppingItem.tenant_id == tenant_id
        ))
    )
    total_items = total_result.scalar() or 0

    await db.commit()
    return items_completed, total_items


async def get_user_by_id(db: AsyncSession, user_id: UUID) -> Optional[User]:
    """Get user by ID for response building."""
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    return result.scalar_one_or_none()


async def get_users_by_ids(db: AsyncSession, user_ids: list[UUID]) -> dict[UUID, User]:
    """Batch fetch users by IDs - returns dict mapping user_id to User."""
    if not user_ids:
        return {}
    result = await db.execute(
        select(User).where(User.id.in_(user_ids))
    )
    users = result.scalars().all()
    return {user.id: user for user in users}


async def get_unique_item_names(db: AsyncSession, tenant_id: UUID) -> list[str]:
    """Get unique item names for autocomplete."""
    result = await db.execute(
        select(ShoppingItem.name)
        .where(ShoppingItem.tenant_id == tenant_id)
        .distinct()
        .order_by(ShoppingItem.name)
    )
    return [row[0] for row in result.fetchall()]


async def get_used_categories(db: AsyncSession, tenant_id: UUID) -> list[str]:
    """Get categories that have been used by this tenant."""
    result = await db.execute(
        select(ShoppingItem.category)
        .where(ShoppingItem.tenant_id == tenant_id)
        .distinct()
        .order_by(ShoppingItem.category)
    )
    return [row[0] for row in result.fetchall()]


# ============ Category Operations ============

async def get_categories_by_tenant(db: AsyncSession, tenant_id: UUID) -> list[ShoppingCategory]:
    """Get all categories for a tenant, ordered by sort_order."""
    result = await db.execute(
        select(ShoppingCategory)
        .where(ShoppingCategory.tenant_id == tenant_id)
        .order_by(ShoppingCategory.sort_order, ShoppingCategory.name)
    )
    return result.scalars().all()


async def get_category_by_id(
    db: AsyncSession,
    category_id: UUID,
    tenant_id: UUID
) -> Optional[ShoppingCategory]:
    """Get a specific category."""
    result = await db.execute(
        select(ShoppingCategory).where(
            and_(
                ShoppingCategory.id == category_id,
                ShoppingCategory.tenant_id == tenant_id
            )
        )
    )
    return result.scalar_one_or_none()


async def get_category_by_name(
    db: AsyncSession,
    name: str,
    tenant_id: UUID
) -> Optional[ShoppingCategory]:
    """Get a category by name."""
    result = await db.execute(
        select(ShoppingCategory).where(
            and_(
                ShoppingCategory.name == name,
                ShoppingCategory.tenant_id == tenant_id
            )
        )
    )
    return result.scalar_one_or_none()


async def seed_default_categories(db: AsyncSession, tenant_id: UUID) -> list[ShoppingCategory]:
    """Seed default categories for a new tenant."""
    default_cats = get_default_categories()
    categories = []

    for idx, cat_data in enumerate(default_cats):
        category = ShoppingCategory(
            tenant_id=tenant_id,
            name=cat_data["name"],
            icon=cat_data["icon"],
            color=cat_data["color"],
            keywords=cat_data["keywords"],
            sort_order=idx,
            is_default=True,
        )
        db.add(category)
        categories.append(category)

    await db.commit()
    for cat in categories:
        await db.refresh(cat)
    return categories


async def get_or_create_default_categories(db: AsyncSession, tenant_id: UUID) -> list[ShoppingCategory]:
    """Get categories for tenant, creating defaults if none exist."""
    categories = await get_categories_by_tenant(db, tenant_id)
    if categories:
        return categories

    return await seed_default_categories(db, tenant_id)


async def create_category(
    db: AsyncSession,
    tenant_id: UUID,
    data: schemas.ShoppingCategoryCreate
) -> ShoppingCategory:
    """Create a new custom category."""
    # Get max sort_order
    result = await db.execute(
        select(func.max(ShoppingCategory.sort_order))
        .where(ShoppingCategory.tenant_id == tenant_id)
    )
    max_order = result.scalar() or 0

    category = ShoppingCategory(
        tenant_id=tenant_id,
        name=data.name,
        icon=data.icon,
        color=data.color,
        keywords=data.keywords,
        sort_order=max_order + 1,
        is_default=False,
    )
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category


async def update_category(
    db: AsyncSession,
    category: ShoppingCategory,
    data: schemas.ShoppingCategoryUpdate
) -> ShoppingCategory:
    """Update a category."""
    if data.name is not None:
        category.name = data.name
    if data.icon is not None:
        category.icon = data.icon
    if data.color is not None:
        category.color = data.color
    if data.keywords is not None:
        category.keywords = data.keywords

    category.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(category)
    return category


async def delete_category(
    db: AsyncSession,
    category: ShoppingCategory,
    tenant_id: UUID
) -> None:
    """Delete a category and move its items to 'Other'."""
    # Update items with this category to "Other"
    await db.execute(
        update(ShoppingItem)
        .where(and_(
            ShoppingItem.tenant_id == tenant_id,
            ShoppingItem.category == category.name
        ))
        .values(category="Other")
    )
    await db.delete(category)
    await db.commit()


async def reorder_categories(
    db: AsyncSession,
    tenant_id: UUID,
    category_ids: list[UUID]
) -> list[ShoppingCategory]:
    """Reorder categories by updating sort_order."""
    for idx, cat_id in enumerate(category_ids):
        await db.execute(
            update(ShoppingCategory)
            .where(and_(
                ShoppingCategory.id == cat_id,
                ShoppingCategory.tenant_id == tenant_id
            ))
            .values(sort_order=idx)
        )
    await db.commit()
    return await get_categories_by_tenant(db, tenant_id)


async def add_keyword_to_category(
    db: AsyncSession,
    category: ShoppingCategory,
    keyword: str
) -> ShoppingCategory:
    """Add a keyword to a category."""
    keywords = list(category.keywords or [])
    if keyword.lower() not in [k.lower() for k in keywords]:
        keywords.append(keyword.lower())
        category.keywords = keywords
        category.updated_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(category)
    return category


async def remove_keyword_from_category(
    db: AsyncSession,
    category: ShoppingCategory,
    keyword: str
) -> ShoppingCategory:
    """Remove a keyword from a category."""
    keywords = list(category.keywords or [])
    keyword_lower = keyword.lower()
    keywords = [k for k in keywords if k.lower() != keyword_lower]
    category.keywords = keywords
    category.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(category)
    return category


async def categorize_item_for_tenant(
    db: AsyncSession,
    tenant_id: UUID,
    name: str
) -> str:
    """Auto-categorize an item based on tenant's category keywords."""
    categories = await get_or_create_default_categories(db, tenant_id)
    name_lower = name.lower()

    for category in categories:
        for keyword in (category.keywords or []):
            if keyword.lower() in name_lower:
                return category.name

    return "Other"
