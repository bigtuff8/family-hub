"""
Shopping list Pydantic schemas
Location: backend/services/shopping/schemas.py
"""

from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


# ============ Request Schemas ============

class ShoppingListCreate(BaseModel):
    """Create a new shopping list"""
    name: str = Field(default="Grocery List", min_length=1, max_length=100)
    is_default: bool = False


class ShoppingListUpdate(BaseModel):
    """Update a shopping list"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    is_default: Optional[bool] = None


class ShoppingItemCreate(BaseModel):
    """Add item to shopping list"""
    name: str = Field(..., min_length=1, max_length=200)
    quantity: Optional[Decimal] = Field(default=Decimal("1"), ge=0)
    unit: Optional[str] = Field(None, max_length=50)
    category: Optional[str] = Field(None, max_length=100)  # Auto-categorized if not provided
    source: Optional[str] = Field(default="manual", pattern="^(manual|alexa|recipe|multiple)$")
    recipe_id: Optional[UUID] = None
    force_add: bool = False  # If True, add even if recently completed duplicate exists


class ShoppingItemUpdate(BaseModel):
    """Update a shopping item"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    quantity: Optional[Decimal] = Field(None, ge=0)
    unit: Optional[str] = Field(None, max_length=50)
    category: Optional[str] = Field(None, max_length=100)


class BulkAddItems(BaseModel):
    """Add multiple items at once"""
    items: list[ShoppingItemCreate]


# ============ Response Schemas ============

class AddedByUser(BaseModel):
    """User who added the item"""
    id: UUID
    name: str

    class Config:
        from_attributes = True


class ShoppingItemResponse(BaseModel):
    """Shopping item in responses"""
    id: UUID
    name: str
    quantity: Decimal
    unit: Optional[str]
    category: str
    checked: bool
    checked_at: Optional[datetime]
    source: str
    recipe_id: Optional[UUID]
    added_by: Optional[AddedByUser]
    created_at: datetime
    updated_at: Optional[datetime]
    # For merge responses
    merged: bool = False
    previous_quantity: Optional[Decimal] = None

    class Config:
        from_attributes = True


class RecentlyCompletedDuplicate(BaseModel):
    """Info about a recently completed duplicate item"""
    id: UUID
    name: str
    checked_at: datetime
    hours_ago: float


class AddItemResponse(BaseModel):
    """Response for add item - may include duplicate warning"""
    item: Optional[ShoppingItemResponse] = None
    merged: bool = False
    previous_quantity: Optional[Decimal] = None
    # Duplicate detection
    duplicate_detected: bool = False
    recently_completed: Optional[RecentlyCompletedDuplicate] = None


class ShoppingListSummary(BaseModel):
    """Shopping list summary (for list view)"""
    id: UUID
    name: str
    is_default: bool
    item_count: int
    checked_count: int
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class ShoppingListResponse(BaseModel):
    """Full shopping list with items"""
    id: UUID
    name: str
    is_default: bool
    items: list[ShoppingItemResponse]
    categories: list[str]  # Unique categories in this list
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class ToggleResponse(BaseModel):
    """Response for toggle checked"""
    id: UUID
    checked: bool
    checked_at: Optional[datetime]


class CompleteShopResponse(BaseModel):
    """Response for complete shop action"""
    message: str
    items_cleared: int
    items_remaining: int


class MessageResponse(BaseModel):
    """Simple message response"""
    message: str


# ============ Category Schemas ============

class ShoppingCategoryBase(BaseModel):
    """Base category fields"""
    name: str = Field(..., min_length=1, max_length=100)
    icon: str = Field(default='📦', max_length=10)
    color: str = Field(default='#6b7280', pattern='^#[0-9a-fA-F]{6}$')
    keywords: list[str] = Field(default_factory=list)


class ShoppingCategoryCreate(ShoppingCategoryBase):
    """Create a new category"""
    pass


class ShoppingCategoryUpdate(BaseModel):
    """Update a category"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    icon: Optional[str] = Field(None, max_length=10)
    color: Optional[str] = Field(None, pattern='^#[0-9a-fA-F]{6}$')
    keywords: Optional[list[str]] = None


class ShoppingCategoryResponse(ShoppingCategoryBase):
    """Category in responses"""
    id: UUID
    sort_order: int
    is_default: bool
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class CategoryReorderRequest(BaseModel):
    """Reorder categories"""
    category_ids: list[UUID]


class KeywordRequest(BaseModel):
    """Add a keyword to a category"""
    keyword: str = Field(..., min_length=1, max_length=100)
