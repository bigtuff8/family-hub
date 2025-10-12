"""
Calendar Service - CRUD Operations
Location: backend/services/calendar/crud.py
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, delete
from sqlalchemy.orm import selectinload
from uuid import UUID
from datetime import date, datetime
from typing import Optional, List
from shared.models import CalendarEvent
from services.calendar.schemas import CalendarEventCreate, CalendarEventUpdate

class CalendarCRUD:
    """CRUD operations for calendar events"""
    
    @staticmethod
    async def create_event(
        db: AsyncSession,
        tenant_id: UUID,
        event: CalendarEventCreate
    ) -> CalendarEvent:
        """Create a new calendar event"""
        db_event = CalendarEvent(
            tenant_id=tenant_id,
            **event.model_dump()
        )
        db.add(db_event)
        await db.commit()
        await db.refresh(db_event)
        return db_event
    
    @staticmethod
    async def get_event(
        db: AsyncSession,
        tenant_id: UUID,
        event_id: UUID
    ) -> Optional[CalendarEvent]:
        """Get a single calendar event by ID"""
        result = await db.execute(
            select(CalendarEvent)
            .where(
                and_(
                    CalendarEvent.id == event_id,
                    CalendarEvent.tenant_id == tenant_id
                )
            )
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_events(
        db: AsyncSession,
        tenant_id: UUID,
        user_id: Optional[UUID] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        all_day: Optional[bool] = None,
        skip: int = 0,
        limit: int = 100
    ) -> tuple[List[CalendarEvent], int]:
        """
        Get calendar events with filtering
        Returns (events, total_count)
        """
        # Build base query
        query = select(CalendarEvent).where(CalendarEvent.tenant_id == tenant_id)
        count_query = select(func.count()).select_from(CalendarEvent).where(
            CalendarEvent.tenant_id == tenant_id
        )
        
        # Apply filters
        filters = []
        
        if user_id:
            filters.append(CalendarEvent.user_id == user_id)
        
        if start_date:
            filters.append(CalendarEvent.start_time >= datetime.combine(start_date, datetime.min.time()))
        
        if end_date:
            filters.append(CalendarEvent.start_time <= datetime.combine(end_date, datetime.max.time()))
        
        if all_day is not None:
            filters.append(CalendarEvent.all_day == all_day)
        
        if filters:
            query = query.where(and_(*filters))
            count_query = count_query.where(and_(*filters))
        
        # Order by start time
        query = query.order_by(CalendarEvent.start_time.asc())
        
        # Apply pagination
        query = query.offset(skip).limit(limit)
        
        # Execute queries
        result = await db.execute(query)
        events = result.scalars().all()
        
        count_result = await db.execute(count_query)
        total = count_result.scalar()
        
        return list(events), total
    
    @staticmethod
    async def get_events_by_date_range(
        db: AsyncSession,
        tenant_id: UUID,
        start_date: date,
        end_date: date,
        user_id: Optional[UUID] = None
    ) -> List[CalendarEvent]:
        """
        Get all events within a date range (useful for calendar view)
        No pagination - returns all events in range
        """
        query = select(CalendarEvent).where(
            and_(
                CalendarEvent.tenant_id == tenant_id,
                CalendarEvent.start_time >= datetime.combine(start_date, datetime.min.time()),
                CalendarEvent.start_time <= datetime.combine(end_date, datetime.max.time())
            )
        )
        
        if user_id:
            query = query.where(CalendarEvent.user_id == user_id)
        
        query = query.order_by(CalendarEvent.start_time.asc())
        
        result = await db.execute(query)
        return list(result.scalars().all())
    
    @staticmethod
    async def update_event(
        db: AsyncSession,
        tenant_id: UUID,
        event_id: UUID,
        event_update: CalendarEventUpdate
    ) -> Optional[CalendarEvent]:
        """Update a calendar event"""
        db_event = await CalendarCRUD.get_event(db, tenant_id, event_id)
        
        if not db_event:
            return None
        
        # Update fields
        update_data = event_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_event, field, value)
        
        await db.commit()
        await db.refresh(db_event)
        return db_event
    
    @staticmethod
    async def delete_event(
        db: AsyncSession,
        tenant_id: UUID,
        event_id: UUID
    ) -> bool:
        """Delete a calendar event"""
        result = await db.execute(
            delete(CalendarEvent)
            .where(
                and_(
                    CalendarEvent.id == event_id,
                    CalendarEvent.tenant_id == tenant_id
                )
            )
        )
        await db.commit()
        return result.rowcount > 0
    
    @staticmethod
    async def bulk_delete_events(
        db: AsyncSession,
        tenant_id: UUID,
        event_ids: List[UUID]
    ) -> int:
        """Bulk delete calendar events"""
        result = await db.execute(
            delete(CalendarEvent)
            .where(
                and_(
                    CalendarEvent.id.in_(event_ids),
                    CalendarEvent.tenant_id == tenant_id
                )
            )
        )
        await db.commit()
        return result.rowcount
    
    @staticmethod
    async def get_upcoming_events(
        db: AsyncSession,
        tenant_id: UUID,
        user_id: Optional[UUID] = None,
        limit: int = 10
    ) -> List[CalendarEvent]:
        """Get upcoming events (from now)"""
        query = select(CalendarEvent).where(
            and_(
                CalendarEvent.tenant_id == tenant_id,
                CalendarEvent.start_time >= datetime.now()
            )
        )
        
        if user_id:
            query = query.where(CalendarEvent.user_id == user_id)
        
        query = query.order_by(CalendarEvent.start_time.asc()).limit(limit)
        
        result = await db.execute(query)
        return list(result.scalars().all())
    
    @staticmethod
    async def search_events(
        db: AsyncSession,
        tenant_id: UUID,
        search_term: str,
        skip: int = 0,
        limit: int = 50
    ) -> tuple[List[CalendarEvent], int]:
        """
        Search events by title, description, or location
        Returns (events, total_count)
        """
        search_filter = or_(
            CalendarEvent.title.ilike(f'%{search_term}%'),
            CalendarEvent.description.ilike(f'%{search_term}%'),
            CalendarEvent.location.ilike(f'%{search_term}%')
        )
        
        query = select(CalendarEvent).where(
            and_(
                CalendarEvent.tenant_id == tenant_id,
                search_filter
            )
        ).order_by(CalendarEvent.start_time.desc())
        
        count_query = select(func.count()).select_from(CalendarEvent).where(
            and_(
                CalendarEvent.tenant_id == tenant_id,
                search_filter
            )
        )
        
        # Pagination
        query = query.offset(skip).limit(limit)
        
        result = await db.execute(query)
        events = result.scalars().all()
        
        count_result = await db.execute(count_query)
        total = count_result.scalar()
        
        return list(events), total