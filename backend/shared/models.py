from sqlalchemy import Column, String, DateTime, Boolean, Integer, Text, ForeignKey, Date, Time
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
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
    date_of_birth = Column(Date)
    settings = Column(JSONB, default=dict)  # Fixed: default=dict
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

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