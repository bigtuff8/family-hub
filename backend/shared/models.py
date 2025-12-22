from sqlalchemy import Column, String, DateTime, Boolean, Integer, Text, ForeignKey, Date, Time, Index, DECIMAL
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from shared.database import Base
import uuid

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
    """Calendar event"""
    __tablename__ = "calendar_events"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='SET NULL'))  # Added this
    title = Column(Text, nullable=False)
    description = Column(Text)
    location = Column(Text)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True))
    all_day = Column(Boolean, default=False)
    recurrence_rule = Column(Text)
    external_calendar_id = Column(Text)
    external_event_id = Column(Text)
    color = Column(String(7))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

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
    """External contact (non-user) - grandparents, friends, extended family"""
    __tablename__ = "contacts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False)

    # Core fields
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100))
    display_name = Column(String(200))  # Computed or custom
    nickname = Column(String(100))

    # Primary contact info (convenience fields)
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

    # Sync tracking (for future iCloud/Google sync)
    external_source = Column(String(50))  # 'icloud', 'google', 'manual'
    external_id = Column(String(255))  # Provider's unique ID
    last_synced_at = Column(DateTime(timezone=True))
    sync_etag = Column(String(255))  # For change detection

    # Status
    is_favorite = Column(Boolean, default=False)
    is_archived = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    phones = relationship("ContactPhone", back_populates="contact", cascade="all, delete-orphan")
    emails = relationship("ContactEmail", back_populates="contact", cascade="all, delete-orphan")

    __table_args__ = (
        Index('idx_contacts_tenant', 'tenant_id'),
        Index('idx_contacts_name', 'tenant_id', 'last_name', 'first_name'),
        Index('idx_contacts_birthday', 'tenant_id', 'birthday'),
        Index('idx_contacts_external', 'external_source', 'external_id'),
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