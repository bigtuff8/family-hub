"""
Contacts Pydantic schemas
Location: backend/services/contacts/schemas.py

Phase 2 Updates:
- User-owned contacts (owner_user_id)
- "Publish to Family" functionality
- Smart lookup for invitee selection
"""

from datetime import date, datetime
from typing import Optional, Literal
from uuid import UUID

from pydantic import BaseModel, Field, EmailStr


# ============ Phone/Email Sub-schemas ============

class ContactPhoneBase(BaseModel):
    """Base phone fields"""
    phone_type: str = Field(default='mobile', pattern='^(mobile|home|work|other)$')
    phone_number: str = Field(..., min_length=1, max_length=50)
    is_primary: bool = False


class ContactPhoneCreate(ContactPhoneBase):
    """Create a phone number"""
    pass


class ContactPhoneResponse(ContactPhoneBase):
    """Phone in responses"""
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class ContactEmailBase(BaseModel):
    """Base email fields"""
    email_type: str = Field(default='personal', pattern='^(personal|work|other)$')
    email_address: EmailStr
    is_primary: bool = False


class ContactEmailCreate(ContactEmailBase):
    """Create an email"""
    pass


class ContactEmailResponse(ContactEmailBase):
    """Email in responses"""
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


# ============ Owner Info ============

class OwnerInfo(BaseModel):
    """Minimal user info for contact ownership"""
    id: UUID
    name: str
    color: Optional[str] = None

    class Config:
        from_attributes = True


# ============ Contact Request Schemas ============

class ContactCreate(BaseModel):
    """Create a new contact (owned by current user)"""
    # Core fields
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    display_name: Optional[str] = Field(None, max_length=200)
    nickname: Optional[str] = Field(None, max_length=100)

    # Primary contact info
    primary_email: Optional[EmailStr] = None
    primary_phone: Optional[str] = Field(None, max_length=50)

    # Important dates
    birthday: Optional[date] = None
    anniversary: Optional[date] = None
    anniversary_type: Optional[str] = Field(None, pattern='^(wedding|engagement|friendship|first_met|dating|other)$')

    # Address
    address_line1: Optional[str] = Field(None, max_length=255)
    address_line2: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    county: Optional[str] = Field(None, max_length=100)
    postcode: Optional[str] = Field(None, max_length=20)
    country: str = Field(default='United Kingdom', max_length=100)

    # Organization
    company: Optional[str] = Field(None, max_length=200)
    job_title: Optional[str] = Field(None, max_length=200)

    # Notes
    notes: Optional[str] = None
    photo_url: Optional[str] = Field(None, max_length=500)

    # Status
    is_favorite: bool = False

    # Family sharing (Phase 2)
    is_published_to_family: bool = False

    # Additional phones/emails (optional on create)
    phones: list[ContactPhoneCreate] = Field(default_factory=list)
    emails: list[ContactEmailCreate] = Field(default_factory=list)


class ContactUpdate(BaseModel):
    """Update a contact"""
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    display_name: Optional[str] = Field(None, max_length=200)
    nickname: Optional[str] = Field(None, max_length=100)

    primary_email: Optional[EmailStr] = None
    primary_phone: Optional[str] = Field(None, max_length=50)

    birthday: Optional[date] = None
    anniversary: Optional[date] = None
    anniversary_type: Optional[str] = Field(None, pattern='^(wedding|engagement|friendship|first_met|dating|other)$')

    address_line1: Optional[str] = Field(None, max_length=255)
    address_line2: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    county: Optional[str] = Field(None, max_length=100)
    postcode: Optional[str] = Field(None, max_length=20)
    country: Optional[str] = Field(None, max_length=100)

    company: Optional[str] = Field(None, max_length=200)
    job_title: Optional[str] = Field(None, max_length=200)

    notes: Optional[str] = None
    photo_url: Optional[str] = Field(None, max_length=500)

    is_favorite: Optional[bool] = None
    is_archived: Optional[bool] = None


# ============ Contact Response Schemas ============

class ContactSummary(BaseModel):
    """Contact summary for list views"""
    id: UUID
    first_name: str
    last_name: Optional[str]
    display_name: Optional[str]
    primary_email: Optional[str]
    primary_phone: Optional[str]
    birthday: Optional[date]
    is_favorite: bool
    photo_url: Optional[str]

    # Phase 2: Ownership and sharing
    owner_user_id: UUID
    owner: Optional[OwnerInfo] = None
    is_published_to_family: bool = False
    source: str = 'manual'

    class Config:
        from_attributes = True


class ContactResponse(BaseModel):
    """Full contact details"""
    id: UUID

    # Core fields
    first_name: str
    last_name: Optional[str]
    display_name: Optional[str]
    nickname: Optional[str]

    # Primary contact info
    primary_email: Optional[str]
    primary_phone: Optional[str]

    # Important dates
    birthday: Optional[date] = None
    anniversary: Optional[date] = None
    anniversary_type: Optional[str] = None

    # Address
    address_line1: Optional[str]
    address_line2: Optional[str]
    city: Optional[str]
    county: Optional[str]
    postcode: Optional[str]
    country: Optional[str]

    # Organization
    company: Optional[str]
    job_title: Optional[str]

    # Notes
    notes: Optional[str]
    photo_url: Optional[str]

    # Phase 2: Ownership
    owner_user_id: UUID
    owner: Optional[OwnerInfo] = None

    # Phase 2: Family sharing
    is_published_to_family: bool = False
    published_at: Optional[datetime] = None
    published_by_user_id: Optional[UUID] = None

    # Sync info
    source: str = 'manual'
    external_id: Optional[str] = None
    last_synced_at: Optional[datetime] = None

    # Status
    is_favorite: bool
    is_archived: bool

    # Related data
    phones: list[ContactPhoneResponse] = []
    emails: list[ContactEmailResponse] = []

    # Timestamps
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# ============ List Response ============

class ContactListResponse(BaseModel):
    """Paginated contact list"""
    contacts: list[ContactSummary]
    total: int
    page: int
    page_size: int
    total_pages: int


# ============ Upcoming Birthdays ============

class UpcomingBirthday(BaseModel):
    """Birthday info for dashboard widget"""
    id: UUID
    first_name: str
    last_name: Optional[str]
    display_name: Optional[str]
    birthday: date
    days_until: int
    age_turning: Optional[int]  # If birth year known


class UpcomingBirthdaysResponse(BaseModel):
    """List of upcoming birthdays"""
    birthdays: list[UpcomingBirthday]


# ============ Publish to Family ============

class PublishToFamilyRequest(BaseModel):
    """Request to publish/unpublish a contact"""
    publish: bool = True


class PublishToFamilyResponse(BaseModel):
    """Response after publishing/unpublishing"""
    id: UUID
    is_published_to_family: bool
    published_at: Optional[datetime]
    message: str


# ============ Smart Lookup (for Event Invitations) ============

class LookupResultBase(BaseModel):
    """Base lookup result"""
    id: UUID
    display_name: str
    email: Optional[str]
    avatar_url: Optional[str] = None


class FamilyUserResult(LookupResultBase):
    """Family member in lookup results"""
    type: Literal['family_user'] = 'family_user'
    role: str  # 'admin', 'parent', 'child'
    color: Optional[str]
    is_minor: bool = False


class ContactResult(LookupResultBase):
    """Contact in lookup results"""
    type: Literal['contact'] = 'contact'
    source: Literal['personal', 'family']  # 'personal' = own, 'family' = published by other
    owner_name: Optional[str] = None  # For family contacts, shows who shared it


class EmailSuggestion(BaseModel):
    """Suggestion to invite by email when no match found"""
    type: Literal['email_suggestion'] = 'email_suggestion'
    email: str
    prompt: str = "Invite as guest"


class SmartLookupResponse(BaseModel):
    """Smart lookup response for invitee selection"""
    query: str
    results: list[FamilyUserResult | ContactResult | EmailSuggestion]


# ============ Email Search (for Event Email Field) ============

class EmailSearchResult(BaseModel):
    """Contact found by email search"""
    id: UUID
    display_name: str
    email: str
    first_name: str
    last_name: Optional[str] = None


class EmailSearchResponse(BaseModel):
    """Email search response"""
    query: str
    contacts: list[EmailSearchResult]


# ============ Utility Schemas ============

class MessageResponse(BaseModel):
    """Simple message response"""
    message: str
