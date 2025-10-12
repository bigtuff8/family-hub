"""
Calendar Service - Pydantic Schemas
Location: backend/services/calendar/schemas.py
"""

from pydantic import BaseModel, Field, field_validator
from datetime import datetime, date, time
from typing import Optional
from uuid import UUID

# Base schemas
class CalendarEventBase(BaseModel):
    """Base schema for calendar events"""
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    location: Optional[str] = None
    start_time: datetime
    end_time: Optional[datetime] = None
    all_day: bool = False
    recurrence_rule: Optional[str] = None
    color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    
    @field_validator('end_time')
    @classmethod
    def validate_end_time(cls, v, info):
        """Ensure end_time is after start_time"""
        if v and info.data.get('start_time') and v <= info.data['start_time']:
            raise ValueError('end_time must be after start_time')
        return v

# Request schemas
class CalendarEventCreate(CalendarEventBase):
    """Schema for creating a calendar event"""
    user_id: Optional[UUID] = None  # Assign to specific user
    external_calendar_id: Optional[str] = None
    external_event_id: Optional[str] = None

class CalendarEventUpdate(BaseModel):
    """Schema for updating a calendar event (all fields optional)"""
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = None
    location: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    all_day: Optional[bool] = None
    recurrence_rule: Optional[str] = None
    color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    user_id: Optional[UUID] = None

# Response schemas
class CalendarEventResponse(CalendarEventBase):
    """Schema for calendar event response"""
    id: UUID
    tenant_id: UUID
    user_id: Optional[UUID]
    external_calendar_id: Optional[str]
    external_event_id: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True  # Pydantic v2 (was orm_mode in v1)

class CalendarEventList(BaseModel):
    """Schema for list of calendar events"""
    events: list[CalendarEventResponse]
    total: int
    page: int
    page_size: int

# Query parameter schemas
class CalendarEventQuery(BaseModel):
    """Schema for filtering calendar events"""
    user_id: Optional[UUID] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    all_day: Optional[bool] = None
    external_calendar_id: Optional[str] = None

# Utility schemas
class CalendarEventBulkDelete(BaseModel):
    """Schema for bulk deleting events"""
    event_ids: list[UUID] = Field(..., min_length=1, max_length=100)