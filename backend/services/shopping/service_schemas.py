"""
Pydantic schemas for service-to-service shopping endpoints.
Location: backend/services/shopping/service_schemas.py

Used by: Alexa sync service, Alexa skill Lambda.
"""

from typing import Optional
from decimal import Decimal
from pydantic import BaseModel, Field


class ServiceItemInput(BaseModel):
    """Single item to add via service API."""
    name: str = Field(..., min_length=1, max_length=200)
    quantity: Optional[Decimal] = Field(default=Decimal("1"), ge=0)
    unit: Optional[str] = Field(None, max_length=50)
    category: Optional[str] = Field(None, max_length=100)
    source: str = Field(default="alexa")


class ServiceBulkAddRequest(BaseModel):
    """Bulk add items request."""
    items: list[ServiceItemInput] = Field(..., min_length=1, max_length=50)


class ServiceItemResult(BaseModel):
    """Result for a single item add."""
    name: str
    status: str  # "added", "merged", "skipped"
    id: Optional[str] = None
    new_quantity: Optional[float] = None


class ServiceBulkAddResponse(BaseModel):
    """Bulk add response."""
    added: int
    merged: int
    skipped: int
    details: list[ServiceItemResult]


class ServiceItemResponse(BaseModel):
    """Item in service list response."""
    id: str
    name: str
    name_normalized: str
    quantity: float
    unit: Optional[str] = None
    category: str
    checked: bool
    source: str
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class ServiceCheckItemsRequest(BaseModel):
    """Mark items as checked by name."""
    names: list[str] = Field(..., min_length=1, max_length=50)


class ServiceDeleteItemsRequest(BaseModel):
    """Delete items by name."""
    names: list[str] = Field(..., min_length=1, max_length=50)


class ServiceSyncStatusResponse(BaseModel):
    """Alexa sync service status."""
    is_enabled: bool
    sync_direction: str
    last_sync_at: Optional[str] = None
    last_sync_status: Optional[str] = None
    last_sync_error: Optional[str] = None
    items_imported_total: int = 0
    items_exported_total: int = 0
    cookie_status: str = "not_configured"


class ServiceSyncStatusUpdate(BaseModel):
    """Update sync status (called by sync service)."""
    last_sync_status: str
    last_sync_error: Optional[str] = None
    items_imported: int = 0
    items_exported: int = 0
    cookie_status: Optional[str] = None
