"""
Calendar Service - Pydantic Schemas
Location: backend/services/calendar/schemas.py
"""

from pydantic import BaseModel, Field, field_validator, model_validator
from datetime import datetime, date, time
from typing import Optional, List, Literal
from uuid import UUID

# RSVP Status type
RSVPStatus = Literal['pending', 'accepted', 'declined', 'tentative']


# =============================================================================
# Event Attendee Schemas
# =============================================================================

class EventAttendeeCreate(BaseModel):
    """Schema for creating an event attendee"""
    contact_id: Optional[UUID] = None
    email: Optional[str] = Field(None, max_length=255)
    display_name: Optional[str] = Field(None, max_length=200)

    @model_validator(mode='after')
    def validate_contact_or_email(self):
        """Either contact_id or email must be provided"""
        if not self.contact_id and not self.email:
            raise ValueError('Either contact_id or email must be provided')
        return self


class ContactSummaryForAttendee(BaseModel):
    """Lightweight contact info for attendee display"""
    id: UUID
    first_name: str
    last_name: Optional[str]
    display_name: Optional[str]
    primary_email: Optional[str]

    class Config:
        from_attributes = True


class EventAttendeeResponse(BaseModel):
    """Schema for event attendee response"""
    id: UUID
    contact_id: Optional[UUID]
    email: Optional[str]
    display_name: Optional[str]
    rsvp_status: RSVPStatus
    responded_at: Optional[datetime]
    contact: Optional[ContactSummaryForAttendee] = None

    class Config:
        from_attributes = True


class RSVPUpdate(BaseModel):
    """Schema for updating RSVP status"""
    rsvp_status: RSVPStatus


# =============================================================================
# Calendar Event Schemas
# =============================================================================

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
    attendees: List[EventAttendeeCreate] = Field(default_factory=list)

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
    attendees: Optional[List[EventAttendeeCreate]] = None  # If provided, replaces all attendees

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
    attendees: List[EventAttendeeResponse] = Field(default_factory=list)
    
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
