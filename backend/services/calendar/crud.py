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
from shared.models import CalendarEvent, EventAttendee, Contact
from services.calendar.schemas import CalendarEventCreate, CalendarEventUpdate, EventAttendeeCreate, RSVPUpdate

class CalendarCRUD:
    """CRUD operations for calendar events"""

    @staticmethod
    async def _process_attendees(
        db: AsyncSession,
        event_id: UUID,
        tenant_id: UUID,
        attendees: List[EventAttendeeCreate]
    ) -> None:
        """Helper method to process and create event attendees"""
        for attendee_data in attendees:
            display_name = attendee_data.email  # Default to email

            # If contact_id is provided, get display_name from contact
            if attendee_data.contact_id:
                contact = await db.get(Contact, attendee_data.contact_id)
                if contact:
                    display_name = contact.display_name

            # Create EventAttendee object
            db_attendee = EventAttendee(
                event_id=event_id,
                contact_id=attendee_data.contact_id,
                email=attendee_data.email,
                display_name=display_name,
                rsvp_status='pending'
            )
            db.add(db_attendee)
    
    @staticmethod
    async def create_event(
        db: AsyncSession,
        tenant_id: UUID,
        event: CalendarEventCreate
    ) -> CalendarEvent:
        """Create a new calendar event"""
        # Extract attendees before creating the event
        attendees = event.attendees if event.attendees else []

        # Create event without attendees
        db_event = CalendarEvent(
            tenant_id=tenant_id,
            **event.model_dump(exclude={'attendees'})
        )
        db.add(db_event)
        await db.flush()  # Flush to get event ID

        # Process attendees
        if attendees:
            await CalendarCRUD._process_attendees(db, db_event.id, tenant_id, attendees)

        await db.commit()

        # Return event with attendees loaded
        result = await db.execute(
            select(CalendarEvent)
            .options(
                selectinload(CalendarEvent.attendees).selectinload(EventAttendee.contact)
            )
            .where(CalendarEvent.id == db_event.id)
        )
        return result.scalar_one()
    
    @staticmethod
    async def get_event(
        db: AsyncSession,
        tenant_id: UUID,
        event_id: UUID
    ) -> Optional[CalendarEvent]:
        """Get a single calendar event by ID"""
        result = await db.execute(
            select(CalendarEvent)
            .options(
                selectinload(CalendarEvent.attendees).selectinload(EventAttendee.contact)
            )
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
        
        # Eagerly load attendees
        query = query.options(
            selectinload(CalendarEvent.attendees).selectinload(EventAttendee.contact)
        )

        # Order by start time
        query = query.order_by(CalendarEvent.start_time.asc())
        
        # Apply pagination
        query = query.offset(skip).limit(limit)
        
        # Execute queries
        result = await db.execute(query)
        events = result.scalars().unique().all()
        
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

        # Eagerly load attendees
        query = query.options(
            selectinload(CalendarEvent.attendees).selectinload(EventAttendee.contact)
        )
        
        query = query.order_by(CalendarEvent.start_time.asc())
        
        result = await db.execute(query)
        return list(result.scalars().unique().all())
    
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
        
        # Extract attendees separately
        update_data = event_update.model_dump(exclude_unset=True)
        attendees = update_data.pop('attendees', None)
        
        # Update fields
        for field, value in update_data.items():
            setattr(db_event, field, value)
        
        # Handle attendees update
        if attendees is not None:
            # Delete existing attendees
            await db.execute(
                delete(EventAttendee)
                .where(EventAttendee.event_id == event_id)
            )
            await db.flush()
            
            # Create new attendees
            if attendees:
                await CalendarCRUD._process_attendees(db, event_id, tenant_id, attendees)
        
        await db.commit()
        
        # Return with attendees loaded
        result = await db.execute(
            select(CalendarEvent)
            .options(
                selectinload(CalendarEvent.attendees).selectinload(EventAttendee.contact)
            )
            .where(CalendarEvent.id == event_id)
        )
        return result.scalar_one()
    
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

        # Eagerly load attendees
        query = query.options(
            selectinload(CalendarEvent.attendees).selectinload(EventAttendee.contact)
        )
        
        query = query.order_by(CalendarEvent.start_time.asc()).limit(limit)
        
        result = await db.execute(query)
        return list(result.scalars().unique().all())
    
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
        
        # Eagerly load attendees
        query = query.options(
            selectinload(CalendarEvent.attendees).selectinload(EventAttendee.contact)
        )

        # Pagination
        query = query.offset(skip).limit(limit)
        
        result = await db.execute(query)
        events = result.scalars().unique().all()
        
        count_result = await db.execute(count_query)
        total = count_result.scalar()
        
        return list(events), total

    @staticmethod
    async def update_attendee_rsvp(
        db: AsyncSession,
        tenant_id: UUID,
        event_id: UUID,
        attendee_id: UUID,
        rsvp_update: RSVPUpdate
    ) -> Optional[EventAttendee]:
        """Update an attendee's RSVP status"""
        # Verify event belongs to tenant
        event = await CalendarCRUD.get_event(db, tenant_id, event_id)
        if not event:
            return None

        # Get the attendee
        result = await db.execute(
            select(EventAttendee)
            .where(
                and_(
                    EventAttendee.id == attendee_id,
                    EventAttendee.event_id == event_id
                )
            )
        )
        attendee = result.scalar_one_or_none()

        if not attendee:
            return None

        # Update RSVP status and timestamp
        attendee.rsvp_status = rsvp_update.rsvp_status
        attendee.responded_at = datetime.now()

        await db.commit()

        # Return attendee with contact loaded
        result = await db.execute(
            select(EventAttendee)
            .options(selectinload(EventAttendee.contact))
            .where(EventAttendee.id == attendee_id)
        )
        return result.scalar_one()

    @staticmethod
    async def get_attendee(
        db: AsyncSession,
        tenant_id: UUID,
        event_id: UUID,
        attendee_id: UUID
    ) -> Optional[EventAttendee]:
        """Get a specific attendee"""
        # Verify event belongs to tenant
        event = await CalendarCRUD.get_event(db, tenant_id, event_id)
        if not event:
            return None

        # Get the attendee with contact loaded
        result = await db.execute(
            select(EventAttendee)
            .options(selectinload(EventAttendee.contact))
            .where(
                and_(
                    EventAttendee.id == attendee_id,
                    EventAttendee.event_id == event_id
                )
            )
        )
        return result.scalar_one_or_none()