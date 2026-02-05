from sqlalchemy import Column, String, DateTime, Boolean, Integer, Text, ForeignKey, Date, Time, Index, DECIMAL, CheckConstraint, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from shared.database import Base
import uuid


# =============================================================================
# Phase 2 Calendar Sync & Contacts Architecture
# =============================================================================
# Key Principles:
# 1. Family Hub is the SOURCE OF TRUTH for events
# 2. Dedicated Outlook organizer account sends all invites
# 3. Users can only respond (Accept/Decline/Tentative) from external calendars
# 4. Contacts are USER-OWNED (not tenant-wide) with "Publish to Family" option
# 5. Smart lookup for invitee selection across family + personal + family contacts
# =============================================================================

class Tenant(Base):
    """Family/household tenant"""
    __tablename__ = "tenants"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    subscription_tier = Column(String(50), default='free')
    settings = Column(JSONB, default=dict)  # Fixed: default=dict instead of ={}
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class User(Base):
    """Family member"""
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False)
    email = Column(String(255), unique=True)
    name = Column(String(255), nullable=False)
    hashed_password = Column(String(255))
    hashed_pin = Column(String(255))  # 4-digit PIN for kiosk login
    avatar_url = Column(Text)
    role = Column(String(50), nullable=False)  # admin, parent, child, guest
    color = Column(String(7), default='#3b82f6')  # Hex color for calendar
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime(timezone=True))
    date_of_birth = Column(Date)
    settings = Column(JSONB, default=dict)  # Fixed: default=dict
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        Index('idx_users_tenant', 'tenant_id'),
        Index('idx_users_email', 'email'),
    )


class RefreshToken(Base):
    """JWT refresh tokens for auth"""
    __tablename__ = "refresh_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    token_hash = Column(String(255), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    revoked_at = Column(DateTime(timezone=True))

    __table_args__ = (
        Index('idx_refresh_tokens_user', 'user_id'),
    )

class CalendarEvent(Base):
    """
    Calendar event - Family Hub is the source of truth.

    Phase 2 Architecture:
    - Events created in app are distributed via invites from organizer account
    - is_family_hub_event=True means this event was created in Family Hub
    - external_event_id stores the ID in the organizer's Outlook calendar
    - Users respond from their external calendars, responses sync back
    """
    __tablename__ = "calendar_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='SET NULL'))  # Creator
    title = Column(Text, nullable=False)
    description = Column(Text)
    location = Column(Text)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True))
    all_day = Column(Boolean, default=False)
    timezone = Column(String(50), default='Europe/London')

    # Recurrence
    recurrence_rule = Column(Text)  # RRULE format
    recurrence_parent_id = Column(UUID(as_uuid=True), ForeignKey('calendar_events.id'))

    # External sync tracking (for organizer account)
    external_calendar_id = Column(Text)  # Which calendar contains this event
    external_event_id = Column(Text)  # ID in organizer's calendar (for invites)
    external_etag = Column(Text)  # For change detection

    # Source tracking
    is_family_hub_event = Column(Boolean, default=True)  # Created in app (vs imported from external)
    color = Column(String(7))

    # Status
    status = Column(String(50), default='confirmed')  # 'confirmed', 'tentative', 'cancelled'

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    attendees = relationship("EventAttendee", back_populates="event", cascade="all, delete-orphan")
    recurrence_parent = relationship("CalendarEvent", remote_side=[id], backref="recurrence_instances")

    __table_args__ = (
        Index('idx_events_tenant', 'tenant_id'),
        Index('idx_events_time', 'tenant_id', 'start_time'),
        Index('idx_events_created_by', 'user_id'),
        Index('idx_events_external', 'external_event_id'),
    )


class EventAttendee(Base):
    """Links contacts or email-only guests to calendar events"""
    __tablename__ = "event_attendees"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id = Column(UUID(as_uuid=True), ForeignKey('calendar_events.id', ondelete='CASCADE'), nullable=False)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False)

    # Either contact_id OR email (not both required)
    contact_id = Column(UUID(as_uuid=True), ForeignKey('contacts.id', ondelete='CASCADE'), nullable=True)
    email = Column(String(255), nullable=True)  # For non-contact guests

    # Display name (auto-filled from contact or manual)
    display_name = Column(String(200))

    # RSVP tracking
    rsvp_status = Column(String(20), default='pending')  # pending, accepted, declined, tentative
    responded_at = Column(DateTime(timezone=True))

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    event = relationship("CalendarEvent", back_populates="attendees")
    contact = relationship("Contact")

    __table_args__ = (
        Index('idx_event_attendees_event', 'event_id'),
        Index('idx_event_attendees_tenant', 'tenant_id'),
        Index('idx_event_attendees_contact', 'contact_id'),
        UniqueConstraint('event_id', 'contact_id', name='uq_event_attendee_contact'),
        UniqueConstraint('event_id', 'email', name='uq_event_attendee_email'),
        CheckConstraint('contact_id IS NOT NULL OR email IS NOT NULL', name='ck_attendee_contact_or_email'),
    )


class Task(Base):
    """Task/chore"""
    __tablename__ = "tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='SET NULL'))
    title = Column(Text, nullable=False)
    description = Column(Text)
    due_date = Column(Date)
    due_time = Column(Time)
    recurrence_rule = Column(Text)
    status = Column(String(50), nullable=False)  # pending, in_progress, complete, cancelled
    priority = Column(String(50), default='normal')  # low, normal, high, urgent
    points = Column(Integer, default=0)
    category = Column(String(100))
    completed_at = Column(DateTime(timezone=True))
    completed_by = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    created_by = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class ShoppingList(Base):
    """Shopping list for a family"""
    __tablename__ = "shopping_lists"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False)
    name = Column(String(100), nullable=False, default='Grocery List')
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        Index('idx_shopping_lists_tenant', 'tenant_id'),
    )


class ShoppingCategory(Base):
    """Custom shopping category for a tenant"""
    __tablename__ = "shopping_categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False)
    name = Column(String(100), nullable=False)
    icon = Column(String(10), nullable=False, default='📦')  # Emoji character
    color = Column(String(7), nullable=False, default='#6b7280')  # Hex color
    keywords = Column(JSONB, default=list)  # Array of strings for auto-categorization
    sort_order = Column(Integer, nullable=False, default=0)
    is_default = Column(Boolean, default=False)  # True for system-seeded categories
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        Index('idx_shopping_categories_tenant', 'tenant_id'),
        Index('idx_shopping_categories_sort', 'tenant_id', 'sort_order'),
    )


class ShoppingItem(Base):
    """Item on a shopping list"""
    __tablename__ = "shopping_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    list_id = Column(UUID(as_uuid=True), ForeignKey('shopping_lists.id', ondelete='CASCADE'), nullable=False)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False)
    name = Column(String(200), nullable=False)
    name_normalized = Column(String(200), nullable=False)  # Lowercase, trimmed for duplicate detection
    quantity = Column(DECIMAL(10, 2), default=1)
    unit = Column(String(50))  # 'kg', 'pack', 'bunch', 'tin', etc.
    category = Column(String(100), default='Other')
    checked = Column(Boolean, default=False)
    checked_at = Column(DateTime(timezone=True))
    source = Column(String(50), default='manual')  # 'manual', 'alexa', 'recipe', 'multiple'
    recipe_id = Column(UUID(as_uuid=True))  # Will add FK to recipes table in Block 3
    added_by = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        Index('idx_shopping_items_tenant', 'tenant_id'),
        Index('idx_shopping_items_list', 'list_id', 'checked', 'category'),
    )


class Contact(Base):
    """
    User-owned contact with optional "Publish to Family" sharing.

    Phase 2 Architecture:
    - Each user OWNS their own contacts (owner_user_id)
    - Contacts can be "published" to make them visible to all family members
    - Smart lookup searches: Family users -> Personal contacts -> Family contacts
    - Syncs with external providers (Google, iCloud, Outlook) per user
    """
    __tablename__ = "contacts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False)

    # USER OWNERSHIP (Phase 2 - contacts are user-specific, not tenant-wide)
    owner_user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)

    # Core fields
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100))
    display_name = Column(String(200))  # Computed or custom
    nickname = Column(String(100))

    # Primary contact info (convenience fields for quick access)
    primary_email = Column(String(255))
    primary_phone = Column(String(50))

    # Important dates
    birthday = Column(Date)
    anniversary = Column(Date)
    anniversary_type = Column(String(50))  # wedding, friendship, first_met, engagement, other

    # Address
    address_line1 = Column(String(255))
    address_line2 = Column(String(255))
    city = Column(String(100))
    county = Column(String(100))
    postcode = Column(String(20))
    country = Column(String(100), default='United Kingdom')

    # Organization
    company = Column(String(200))
    job_title = Column(String(200))

    # Notes and metadata
    notes = Column(Text)
    photo_url = Column(String(500))

    # External sync tracking (Google, iCloud, Outlook)
    source = Column(String(50), default='manual')  # 'manual', 'google', 'icloud', 'outlook'
    external_id = Column(String(255))  # Provider's unique ID
    external_etag = Column(String(255))  # For change detection
    last_synced_at = Column(DateTime(timezone=True))

    # FAMILY SHARING (Phase 2 - "Publish to Family" feature)
    is_published_to_family = Column(Boolean, default=False)
    published_at = Column(DateTime(timezone=True))
    published_by_user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'))

    # Status
    is_favorite = Column(Boolean, default=False)
    is_archived = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    owner = relationship("User", foreign_keys=[owner_user_id], backref="owned_contacts")
    published_by = relationship("User", foreign_keys=[published_by_user_id])
    phones = relationship("ContactPhone", back_populates="contact", cascade="all, delete-orphan")
    emails = relationship("ContactEmail", back_populates="contact", cascade="all, delete-orphan")

    __table_args__ = (
        Index('idx_contacts_tenant', 'tenant_id'),
        Index('idx_contacts_owner', 'owner_user_id'),
        Index('idx_contacts_name', 'tenant_id', 'last_name', 'first_name'),
        Index('idx_contacts_birthday', 'tenant_id', 'birthday'),
        Index('idx_contacts_email', 'primary_email'),
        Index('idx_contacts_published', 'tenant_id', 'is_published_to_family'),
        Index('idx_contacts_external', 'source', 'external_id'),
        # Ensure external contacts are unique per user/provider
        UniqueConstraint('owner_user_id', 'source', 'external_id', name='uq_contact_external'),
    )


class ContactPhone(Base):
    """Phone number for a contact (supports multiple phones per contact)"""
    __tablename__ = "contact_phones"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    contact_id = Column(UUID(as_uuid=True), ForeignKey('contacts.id', ondelete='CASCADE'), nullable=False)
    phone_type = Column(String(50), default='mobile')  # mobile, home, work, other
    phone_number = Column(String(50), nullable=False)
    is_primary = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    contact = relationship("Contact", back_populates="phones")

    __table_args__ = (
        Index('idx_contact_phones_contact', 'contact_id'),
    )


class ContactEmail(Base):
    """Email address for a contact (supports multiple emails per contact)"""
    __tablename__ = "contact_emails"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    contact_id = Column(UUID(as_uuid=True), ForeignKey('contacts.id', ondelete='CASCADE'), nullable=False)
    email_type = Column(String(50), default='personal')  # personal, work, other
    email_address = Column(String(255), nullable=False)
    is_primary = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    contact = relationship("Contact", back_populates="emails")

    __table_args__ = (
        Index('idx_contact_emails_contact', 'contact_id'),
    )


# =============================================================================
# PHASE 2: CALENDAR SYNC MODELS
# =============================================================================


class UserEmailAccount(Base):
    """
    Email accounts connected by each user (for receiving calendar invites).

    Each user can have multiple email accounts. One is marked as default
    and receives calendar invites for Family Hub events.

    Example: James has jamesbrownyork8@gmail.com (default), james@work.com
    """
    __tablename__ = "user_email_accounts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False)

    # Account details
    email_address = Column(String(255), nullable=False)
    provider = Column(String(50))  # 'google', 'icloud', 'outlook', 'other'
    display_name = Column(String(255))  # "Work Email", "Personal"

    # Settings
    is_default = Column(Boolean, default=False)  # Primary for receiving invites
    is_verified = Column(Boolean, default=False)
    receive_invites = Column(Boolean, default=True)  # Send invites to this address

    # OAuth (if syncing responses from this account)
    access_token_encrypted = Column(Text)
    refresh_token_encrypted = Column(Text)
    token_expires_at = Column(DateTime(timezone=True))

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", backref="email_accounts")

    __table_args__ = (
        Index('idx_user_emails_user', 'user_id'),
        Index('idx_user_emails_default', 'user_id', 'is_default'),
        UniqueConstraint('user_id', 'email_address', name='uq_user_email'),
    )


class OrganizerAccount(Base):
    """
    The dedicated Family Hub organizer account (one per tenant).

    This Outlook account sends all calendar invites on behalf of Family Hub.
    Users respond to invites, and responses sync back to the app.

    Example: familyhub-brown@outlook.com for the Brown family
    """
    __tablename__ = "organizer_accounts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False)

    # Account details
    provider = Column(String(50), nullable=False, default='outlook')
    email_address = Column(String(255), nullable=False)
    calendar_id = Column(String(255))  # The calendar ID in the provider
    calendar_name = Column(String(255), default='Family Hub')

    # OAuth credentials (encrypted)
    access_token_encrypted = Column(Text, nullable=False)
    refresh_token_encrypted = Column(Text, nullable=False)
    token_expires_at = Column(DateTime(timezone=True))

    # Status
    is_active = Column(Boolean, default=True)
    last_sync_at = Column(DateTime(timezone=True))
    last_error = Column(Text)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint('tenant_id', name='uq_organizer_tenant'),
    )


class EventInvite(Base):
    """
    Tracks who is invited to an event and their response status.

    Invitees can be:
    1. Family users (invitee_user_id) - internal family members
    2. Contacts (invitee_contact_id) - from user's contact list
    3. Email-only (invitee_email) - one-time guests

    Responses are synced back from the organizer calendar.
    """
    __tablename__ = "event_invites"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id = Column(UUID(as_uuid=True), ForeignKey('calendar_events.id', ondelete='CASCADE'), nullable=False)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False)

    # Invitee (one of these will be set)
    invitee_user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'))  # Family member
    invitee_contact_id = Column(UUID(as_uuid=True), ForeignKey('contacts.id', ondelete='CASCADE'))  # External contact
    invitee_email = Column(String(255))  # Fallback if no user/contact record

    # Computed for queries
    invitee_type = Column(String(50), nullable=False)  # 'family_user', 'contact', 'email_only'
    invitee_display_name = Column(String(255))

    # Response tracking
    response_status = Column(String(50), default='pending')  # 'pending', 'accepted', 'declined', 'tentative'
    response_received_at = Column(DateTime(timezone=True))
    response_source = Column(String(50))  # 'google', 'outlook', 'icloud', 'manual'
    response_comment = Column(Text)

    # Invite delivery
    invite_sent_at = Column(DateTime(timezone=True))
    invite_sent_to_email = Column(String(255))  # Which email received the invite
    invite_delivery_status = Column(String(50))  # 'pending', 'sent', 'delivered', 'bounced'

    # For updates
    last_update_sent_at = Column(DateTime(timezone=True))

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    event = relationship("CalendarEvent", backref="invites")
    invitee_user = relationship("User", foreign_keys=[invitee_user_id])
    invitee_contact = relationship("Contact", foreign_keys=[invitee_contact_id])

    __table_args__ = (
        Index('idx_event_invites_event', 'event_id'),
        Index('idx_event_invites_user', 'invitee_user_id'),
        Index('idx_event_invites_pending', 'tenant_id', 'response_status'),
        UniqueConstraint('event_id', 'invitee_user_id', name='uq_event_invite_user'),
        UniqueConstraint('event_id', 'invitee_contact_id', name='uq_event_invite_contact'),
        UniqueConstraint('event_id', 'invitee_email', name='uq_event_invite_email'),
    )


class UserExternalCalendar(Base):
    """
    User's connected calendars for viewing external events in unified view.

    This allows users to see their Google/iCloud/Outlook events alongside
    Family Hub events. External events are read-only in the app.

    Example: James connects his Google Calendar to see work meetings
    """
    __tablename__ = "user_external_calendars"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False)

    # Provider info
    provider = Column(String(50), nullable=False)  # 'google', 'icloud', 'outlook'
    provider_calendar_id = Column(String(255), nullable=False)
    calendar_name = Column(String(255))
    calendar_color = Column(String(7))  # Hex color

    # OAuth credentials (encrypted)
    access_token_encrypted = Column(Text)
    refresh_token_encrypted = Column(Text)
    token_expires_at = Column(DateTime(timezone=True))

    # iCloud specific
    caldav_url = Column(Text)
    app_password_encrypted = Column(Text)

    # Sync settings
    is_active = Column(Boolean, default=True)
    show_in_unified_view = Column(Boolean, default=True)

    # Sync state
    last_sync_at = Column(DateTime(timezone=True))
    sync_token = Column(Text)  # For incremental sync
    last_error = Column(Text)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", backref="external_calendars")

    __table_args__ = (
        Index('idx_user_calendars_user', 'user_id'),
        Index('idx_user_calendars_provider', 'user_id', 'provider'),
        UniqueConstraint('user_id', 'provider', 'provider_calendar_id', name='uq_user_calendar'),
    )


class ParentalControl(Base):
    """
    Parent-child relationship for calendar and contact visibility.

    Parents can:
    - View children's calendars
    - View children's contacts
    - Create/edit events for children
    - Respond to invites on behalf of children

    Example: James and Nicola can manage Tommy and Harry's calendars
    """
    __tablename__ = "parental_controls"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False)

    # Relationship
    parent_user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    child_user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)

    # Permissions
    can_view_calendar = Column(Boolean, default=True)
    can_view_contacts = Column(Boolean, default=True)
    can_manage_calendar = Column(Boolean, default=True)  # Create/edit events for them
    can_manage_contacts = Column(Boolean, default=True)
    can_respond_on_behalf = Column(Boolean, default=True)  # Respond to invites for them

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    parent = relationship("User", foreign_keys=[parent_user_id], backref="children_controlled")
    child = relationship("User", foreign_keys=[child_user_id], backref="parents_controlling")

    __table_args__ = (
        Index('idx_parental_parent', 'parent_user_id'),
        Index('idx_parental_child', 'child_user_id'),
        UniqueConstraint('parent_user_id', 'child_user_id', name='uq_parental_relationship'),
    )


# =============================================================================
# PHASE 2: CONTACTS SYNC MODELS
# =============================================================================


class ExternalContactProvider(Base):
    """
    User's connected contact providers for sync.

    Links to calendar OAuth when possible (same credentials).
    Supports Google People API, iCloud CardDAV, Microsoft Graph.
    """
    __tablename__ = "external_contact_providers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)

    # Provider info
    provider = Column(String(50), nullable=False)  # 'google', 'icloud', 'outlook'
    external_calendar_id = Column(UUID(as_uuid=True), ForeignKey('user_external_calendars.id'))  # Shared OAuth

    # Standalone credentials (if no calendar connected)
    access_token_encrypted = Column(Text)
    refresh_token_encrypted = Column(Text)
    token_expires_at = Column(DateTime(timezone=True))

    # iCloud specific
    carddav_url = Column(Text)

    # Settings
    sync_direction = Column(String(20), default='bidirectional')  # 'pull_only', 'push_only', 'bidirectional'
    auto_link_family = Column(Boolean, default=True)  # Auto-match contacts to family members
    is_active = Column(Boolean, default=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", backref="contact_providers")
    external_calendar = relationship("UserExternalCalendar")

    __table_args__ = (
        Index('idx_contact_providers_user', 'user_id'),
        Index('idx_contact_providers_tenant', 'tenant_id'),
        UniqueConstraint('user_id', 'provider', name='uq_contact_provider'),
    )


class ContactSyncState(Base):
    """
    Tracks sync state for each contact provider.

    Stores sync tokens for incremental sync (Google, Microsoft, CardDAV).
    """
    __tablename__ = "contact_sync_states"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    external_provider_id = Column(UUID(as_uuid=True), ForeignKey('external_contact_providers.id', ondelete='CASCADE'), nullable=False)

    # Sync tracking
    last_sync_at = Column(DateTime(timezone=True))
    last_sync_status = Column(String(50))  # 'success', 'failed', 'partial'
    last_sync_error = Column(Text)

    # Incremental sync tokens
    sync_token = Column(Text)  # Google People API sync token
    ctag = Column(Text)  # CardDAV ctag
    delta_link = Column(Text)  # Microsoft Graph delta link

    # Stats
    contacts_synced = Column(Integer, default=0)
    contacts_created = Column(Integer, default=0)
    contacts_updated = Column(Integer, default=0)
    contacts_deleted = Column(Integer, default=0)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    provider = relationship("ExternalContactProvider", backref="sync_state")


class ContactConflict(Base):
    """
    Tracks conflicts between local and external contact data.

    Created when sync detects conflicting changes that need user resolution.
    """
    __tablename__ = "contact_conflicts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False)

    # Conflicting items
    contact_id = Column(UUID(as_uuid=True), ForeignKey('contacts.id', ondelete='CASCADE'))
    external_provider_id = Column(UUID(as_uuid=True), ForeignKey('external_contact_providers.id', ondelete='CASCADE'))

    # Conflict details
    conflict_type = Column(String(50), nullable=False)  # 'field_mismatch', 'duplicate_detected', 'update_conflict'
    conflicting_fields = Column(JSONB)  # ['email', 'phone', 'name']
    local_data = Column(JSONB)
    external_data = Column(JSONB)

    # Resolution
    status = Column(String(50), default='pending')  # 'pending', 'resolved_local', 'resolved_external', 'merged', 'ignored'
    resolved_at = Column(DateTime(timezone=True))
    resolved_by = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    resolution_notes = Column(Text)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    contact = relationship("Contact")
    provider = relationship("ExternalContactProvider")
    resolver = relationship("User")

    __table_args__ = (
        Index('idx_contact_conflicts_tenant', 'tenant_id', 'status'),
    )