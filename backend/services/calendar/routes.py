# backend/services/calendar/routes.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from shared.models import CalendarEvent, User, EventAttendee, Contact, UserExternalCalendar
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from shared.database import get_db
from services.calendar.schemas import RSVPUpdate, EventAttendeeResponse
from services.calendar.crud import CalendarCRUD

router = APIRouter()

# Helper to serialize attendees
def serialize_attendees(attendees):
    """Convert attendee ORM objects to dict format"""
    result = []
    for att in attendees:
        att_dict = {
            "id": str(att.id),
            "contact_id": str(att.contact_id) if att.contact_id else None,
            "email": att.email,
            "display_name": att.display_name,
            "rsvp_status": att.rsvp_status,
            "responded_at": att.responded_at.isoformat() if att.responded_at else None,
            "contact": None
        }
        if att.contact:
            att_dict["contact"] = {
                "id": str(att.contact.id),
                "first_name": att.contact.first_name,
                "last_name": att.contact.last_name,
                "display_name": att.contact.display_name,
                "primary_email": att.contact.primary_email
            }
        result.append(att_dict)
    return result


# ==========================================
# LIST ALL EVENTS - MUST BE FIRST!
# ==========================================
@router.get("/events")
async def list_calendar_events(
    tenant_id: Optional[str] = Query(None, description="Filter by tenant ID"),
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    start_date: Optional[datetime] = Query(None, description="Filter events starting from this date"),
    end_date: Optional[datetime] = Query(None, description="Filter events up to this date"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all calendar events with optional filters.

    ⚠️ IMPORTANT: This route MUST be defined BEFORE /events/{event_id}
    Otherwise FastAPI will try to parse 'events' as a UUID parameter.
    """
    try:
        # Build base query with eager loading of attendees
        query = select(CalendarEvent).options(
            selectinload(CalendarEvent.attendees).selectinload(EventAttendee.contact)
        )

        # Add filters if provided
        filters = []
        if tenant_id:
            filters.append(CalendarEvent.tenant_id == UUID(tenant_id))
        if user_id:
            filters.append(CalendarEvent.user_id == UUID(user_id))
        if start_date:
            filters.append(CalendarEvent.start_time >= start_date)
        if end_date:
            filters.append(CalendarEvent.start_time <= end_date)

        if filters:
            query = query.where(and_(*filters))

        # Order by start time
        query = query.order_by(CalendarEvent.start_time)

        # Execute query
        result = await db.execute(query)
        events = result.scalars().all()

        # Build response with user information
        response_events = []
        for event in events:
            event_dict = {
                "id": str(event.id),
                "tenant_id": str(event.tenant_id),
                "title": event.title,
                "description": event.description,
                "location": event.location,
                "start_time": event.start_time.isoformat() if event.start_time else None,
                "end_time": event.end_time.isoformat() if event.end_time else None,
                "all_day": event.all_day,
                "recurrence_rule": event.recurrence_rule,
                "color": event.color,
                "created_at": event.created_at.isoformat() if event.created_at else None,
                "updated_at": event.updated_at.isoformat() if event.updated_at else None,
                "external_calendar_id": event.external_calendar_id,
                "external_event_id": event.external_event_id,
                "is_family_hub_event": event.is_family_hub_event,
                "user": None,
                "attendees": serialize_attendees(event.attendees) if event.attendees else []
            }

            # Fetch user if user_id exists
            if event.user_id:
                user_result = await db.execute(
                    select(User).where(User.id == event.user_id)
                )
                user = user_result.scalar_one_or_none()
                if user:
                    event_dict["user"] = {
                        "id": str(user.id),
                        "name": user.name,
                        "avatar_url": user.avatar_url
                    }

            response_events.append(event_dict)

        return response_events

    except Exception as e:
        print(f"❌ Error fetching events: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error fetching events: {str(e)}")


# ==========================================
# GET EVENTS BY DATE RANGE - FOR CALENDAR VIEW
# ==========================================
@router.get("/range/{start_date}/{end_date}")
async def get_events_by_range(
    start_date: str,
    end_date: str,
    tenant_id: Optional[str] = Query(None, description="Filter by tenant ID"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get events within a date range (used by calendar frontend).
    Dates should be in YYYY-MM-DD format.
    """
    try:
        # Parse dates
        start = datetime.fromisoformat(start_date)
        end = datetime.fromisoformat(end_date)

        # Build query with eager loading of attendees
        query = select(CalendarEvent).options(
            selectinload(CalendarEvent.attendees).selectinload(EventAttendee.contact)
        ).where(
            and_(
                CalendarEvent.start_time >= start,
                CalendarEvent.start_time <= end
            )
        )

        # Add tenant filter if provided
        if tenant_id:
            query = query.where(CalendarEvent.tenant_id == UUID(tenant_id))

        # Order by start time
        query = query.order_by(CalendarEvent.start_time)

        # Execute query
        result = await db.execute(query)
        events = result.scalars().all()

        # Build response with user information
        response_events = []
        for event in events:
            event_dict = {
                "id": str(event.id),
                "tenant_id": str(event.tenant_id),
                "title": event.title,
                "description": event.description,
                "location": event.location,
                "start_time": event.start_time.isoformat() if event.start_time else None,
                "end_time": event.end_time.isoformat() if event.end_time else None,
                "all_day": event.all_day,
                "recurrence_rule": event.recurrence_rule,
                "color": event.color,
                "created_at": event.created_at.isoformat() if event.created_at else None,
                "updated_at": event.updated_at.isoformat() if event.updated_at else None,
                "external_calendar_id": event.external_calendar_id,
                "external_event_id": event.external_event_id,
                "is_family_hub_event": event.is_family_hub_event,
                "user": None,
                "attendees": serialize_attendees(event.attendees) if event.attendees else []
            }

            # Fetch user if user_id exists
            if event.user_id:
                user_result = await db.execute(
                    select(User).where(User.id == event.user_id)
                )
                user = user_result.scalar_one_or_none()
                if user:
                    event_dict["user"] = {
                        "id": str(user.id),
                        "name": user.name,
                        "avatar_url": user.avatar_url
                    }

            response_events.append(event_dict)

        return response_events

    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")
    except Exception as e:
        print(f"❌ Error fetching events by range: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error fetching events: {str(e)}")


# ==========================================
# GET SPECIFIC EVENT - MUST BE AFTER LIST!
# ==========================================
@router.get("/events/{event_id}")
async def get_calendar_event(
    event_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific calendar event by ID."""
    try:
        result = await db.execute(
            select(CalendarEvent).options(
                selectinload(CalendarEvent.attendees).selectinload(EventAttendee.contact)
            ).where(CalendarEvent.id == event_id)
        )
        event = result.scalar_one_or_none()

        if not event:
            raise HTTPException(status_code=404, detail="Event not found")

        # Build response
        event_dict = {
            "id": str(event.id),
            "tenant_id": str(event.tenant_id),
            "title": event.title,
            "description": event.description,
            "location": event.location,
            "start_time": event.start_time.isoformat() if event.start_time else None,
            "end_time": event.end_time.isoformat() if event.end_time else None,
            "all_day": event.all_day,
            "recurrence_rule": event.recurrence_rule,
            "color": event.color,
            "created_at": event.created_at.isoformat() if event.created_at else None,
            "updated_at": event.updated_at.isoformat() if event.updated_at else None,
            "external_calendar_id": event.external_calendar_id,
            "external_event_id": event.external_event_id,
            "is_family_hub_event": event.is_family_hub_event,
            "user": None,
            "attendees": serialize_attendees(event.attendees) if event.attendees else []
        }

        # Fetch user if user_id exists
        if event.user_id:
            user_result = await db.execute(
                select(User).where(User.id == event.user_id)
            )
            user = user_result.scalar_one_or_none()
            if user:
                event_dict["user"] = {
                    "id": str(user.id),
                    "name": user.name,
                    "avatar_url": user.avatar_url
                }

        return event_dict

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching event: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching event: {str(e)}")


# ==========================================
# CREATE EVENT
# ==========================================
@router.post("/events", status_code=201)
async def create_calendar_event(
    event_data: dict,
    db: AsyncSession = Depends(get_db)
):
    """Create a new calendar event."""
    try:
        # Create new event
        new_event = CalendarEvent(
            tenant_id=UUID(event_data["tenant_id"]),
            user_id=UUID(event_data["user_id"]) if event_data.get("user_id") else None,
            title=event_data["title"],
            description=event_data.get("description"),
            location=event_data.get("location"),
            start_time=datetime.fromisoformat(event_data["start_time"].replace("Z", "+00:00")),
            end_time=datetime.fromisoformat(event_data["end_time"].replace("Z", "+00:00")) if event_data.get("end_time") else None,
            all_day=event_data.get("all_day", False),
            recurrence_rule=event_data.get("recurrence_rule"),
            color=event_data.get("color")
        )

        db.add(new_event)
        await db.commit()
        await db.refresh(new_event)

        # Process attendees if provided
        if event_data.get("attendees"):
            for att_data in event_data["attendees"]:
                attendee = EventAttendee(
                    event_id=new_event.id,
                    tenant_id=new_event.tenant_id,
                    contact_id=UUID(att_data["contact_id"]) if att_data.get("contact_id") else None,
                    email=att_data.get("email"),
                    display_name=att_data.get("display_name"),
                    rsvp_status=att_data.get("rsvp_status", "pending")
                )
                db.add(attendee)
            await db.commit()
            # Reload event with attendees
            result = await db.execute(
                select(CalendarEvent).options(
                    selectinload(CalendarEvent.attendees).selectinload(EventAttendee.contact)
                ).where(CalendarEvent.id == new_event.id)
            )
            new_event = result.scalar_one()

        # Build response
        event_dict = {
            "id": str(new_event.id),
            "tenant_id": str(new_event.tenant_id),
            "title": new_event.title,
            "description": new_event.description,
            "location": new_event.location,
            "start_time": new_event.start_time.isoformat() if new_event.start_time else None,
            "end_time": new_event.end_time.isoformat() if new_event.end_time else None,
            "all_day": new_event.all_day,
            "recurrence_rule": new_event.recurrence_rule,
            "color": new_event.color,
            "created_at": new_event.created_at.isoformat() if new_event.created_at else None,
            "updated_at": new_event.updated_at.isoformat() if new_event.updated_at else None,
            "external_event_id": new_event.external_event_id,
            "is_family_hub_event": new_event.is_family_hub_event,
            "user": None
        }

        # Fetch user if user_id exists
        if new_event.user_id:
            user_result = await db.execute(
                select(User).where(User.id == new_event.user_id)
            )
            user = user_result.scalar_one_or_none()
            if user:
                event_dict["user"] = {
                    "id": str(user.id),
                    "name": user.name,
                    "avatar_url": user.avatar_url
                }


        # Add attendees to response - only access relationship if we loaded it
        if event_data.get("attendees"):
            event_dict["attendees"] = serialize_attendees(new_event.attendees) if new_event.attendees else []
        else:
            event_dict["attendees"] = []

        # ==========================================
        # GOOGLE SYNC HOOK (Create)
        # ==========================================
        if event_data.get("sync_to_google") and new_event.user_id:
            try:
                client = GoogleCalendarClient(db)
                # Prepare data for Google (ensure dates are strings)
                google_data = {
                     'title': new_event.title,
                     'description': new_event.description,
                     'location': new_event.location,
                     'start_time': new_event.start_time.isoformat(),
                     'end_time': new_event.end_time.isoformat() if new_event.end_time else None,
                     'all_day': new_event.all_day,
                     'recurrence_rule': new_event.recurrence_rule
                }
                external_id = await client.create_google_event(str(new_event.user_id), google_data)

                if external_id:
                    new_event.external_event_id = external_id
                    new_event.external_calendar_id = 'primary'
                    new_event.is_family_hub_event = True # Explicitly mark as local origin
                    await db.commit()

                    # Update response to include external ID
                    event_dict["external_event_id"] = external_id
                    event_dict["external_calendar_id"] = "primary"
            except Exception as e:
                # Log but treat as non-blocking for the user
                print(f"⚠️ Failed to sync new event to Google: {e}")

        # ==========================================
        # OUTLOOK SYNC HOOK (Create)
        # ==========================================
        if event_data.get("sync_to_outlook") and new_event.user_id:
            try:
                outlook_client = OutlookCalendarClient(db)
                outlook_data = {
                     'title': new_event.title,
                     'description': new_event.description,
                     'location': new_event.location,
                     'start_time': new_event.start_time.isoformat(),
                     'end_time': new_event.end_time.isoformat() if new_event.end_time else None,
                     'all_day': new_event.all_day,
                     'recurrence_rule': new_event.recurrence_rule
                }
                external_id = await outlook_client.create_outlook_event(str(new_event.user_id), outlook_data)

                if external_id:
                    new_event.external_event_id = external_id
                    new_event.external_calendar_id = 'outlook_primary'
                    new_event.is_family_hub_event = True
                    await db.commit()

                    event_dict["external_event_id"] = external_id
                    event_dict["external_calendar_id"] = "outlook_primary"
            except Exception as e:
                print(f"⚠️ Failed to sync new event to Outlook: {e}")

        return event_dict

    except Exception as e:
        await db.rollback()
        print(f"❌ Error creating event: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating event: {str(e)}")


# ==========================================
# UPDATE EVENT
# ==========================================
@router.put("/events/{event_id}")
async def update_calendar_event(
    event_id: UUID,
    event_data: dict,
    db: AsyncSession = Depends(get_db)
):
    """Update an existing calendar event."""
    try:
        # Fetch event
        result = await db.execute(
            select(CalendarEvent).where(CalendarEvent.id == event_id)
        )
        event = result.scalar_one_or_none()

        if not event:
            raise HTTPException(status_code=404, detail="Event not found")

        # Update fields
        if "title" in event_data:
            event.title = event_data["title"]
        if "description" in event_data:
            event.description = event_data["description"]
        if "location" in event_data:
            event.location = event_data["location"]
        if "start_time" in event_data:
            event.start_time = datetime.fromisoformat(event_data["start_time"].replace("Z", "+00:00"))
        if "end_time" in event_data:
            event.end_time = datetime.fromisoformat(event_data["end_time"].replace("Z", "+00:00")) if event_data["end_time"] else None
        if "all_day" in event_data:
            event.all_day = event_data["all_day"]
        if "recurrence_rule" in event_data:
            event.recurrence_rule = event_data["recurrence_rule"]
        if "color" in event_data:
            event.color = event_data["color"]
        if "user_id" in event_data:
            event.user_id = UUID(event_data["user_id"]) if event_data["user_id"] else None


        # Process attendees if provided (replace all existing)
        if "attendees" in event_data:
            # Delete existing attendees
            from sqlalchemy import delete
            await db.execute(
                delete(EventAttendee).where(EventAttendee.event_id == event_id)
            )
            # Add new attendees
            for att_data in event_data["attendees"]:
                attendee = EventAttendee(
                    event_id=event_id,
                    tenant_id=event.tenant_id,
                    contact_id=UUID(att_data["contact_id"]) if att_data.get("contact_id") else None,
                    email=att_data.get("email"),
                    display_name=att_data.get("display_name"),
                    rsvp_status=att_data.get("rsvp_status", "pending")
                )
                db.add(attendee)

        await db.commit()
        await db.commit()  # Commit with attendees

        # Reload event with attendees
        result = await db.execute(
            select(CalendarEvent).options(
                selectinload(CalendarEvent.attendees).selectinload(EventAttendee.contact)
            ).where(CalendarEvent.id == event_id)
        )
        event = result.scalar_one()


        # Build response
        event_dict = {
            "id": str(event.id),
            "tenant_id": str(event.tenant_id),
            "title": event.title,
            "description": event.description,
            "location": event.location,
            "start_time": event.start_time.isoformat() if event.start_time else None,
            "end_time": event.end_time.isoformat() if event.end_time else None,
            "all_day": event.all_day,
            "recurrence_rule": event.recurrence_rule,
            "color": event.color,
            "created_at": event.created_at.isoformat() if event.created_at else None,
            "updated_at": event.updated_at.isoformat() if event.updated_at else None,
            "external_calendar_id": event.external_calendar_id,
            "external_event_id": event.external_event_id,
            "is_family_hub_event": event.is_family_hub_event,
            "user": None,
            "attendees": serialize_attendees(event.attendees) if event.attendees else []
        }

        # Fetch user if user_id exists
        if event.user_id:
            user_result = await db.execute(
                select(User).where(User.id == event.user_id)
            )
            user = user_result.scalar_one_or_none()
            if user:
                event_dict["user"] = {
                    "id": str(user.id),
                    "name": user.name,
                    "avatar_url": user.avatar_url
                }

        event_dict["attendees"] = serialize_attendees(event.attendees) if event.attendees else []

        # ==========================================
        # GOOGLE SYNC HOOK (Update)
        # ==========================================
        # Sync if it's already linked to Google OR if user explicitly asks to start syncing
        if event.external_calendar_id == 'primary' and event.external_event_id and event.user_id:
            try:
                client = GoogleCalendarClient(db)
                google_data = {
                     'title': event.title,
                     'description': event.description,
                     'location': event.location,
                     'start_time': event.start_time.isoformat(),
                     'end_time': event.end_time.isoformat() if event.end_time else None,
                     'all_day': event.all_day,
                     'recurrence_rule': event.recurrence_rule
                }
                await client.update_google_event(str(event.user_id), event.external_event_id, google_data)
            except Exception as e:
                print(f"⚠️ Failed to sync update to Google: {e}")

        elif event_data.get("sync_to_google") and event.user_id:
            try:
                client = GoogleCalendarClient(db)
                google_data = {
                     'title': event.title,
                     'description': event.description,
                     'location': event.location,
                     'start_time': event.start_time.isoformat(),
                     'end_time': event.end_time.isoformat() if event.end_time else None,
                     'all_day': event.all_day,
                     'recurrence_rule': event.recurrence_rule
                }
                external_id = await client.create_google_event(str(event.user_id), google_data)
                if external_id:
                    event.external_event_id = external_id
                    event.external_calendar_id = 'primary'
                    event.is_family_hub_event = True
                    await db.commit()
                    event_dict["external_event_id"] = external_id
            except Exception as e:
                print(f"⚠️ Failed to sync new event to Google: {e}")

        # ==========================================
        # OUTLOOK SYNC HOOK (Update)
        # ==========================================
        # Sync if it's already linked to Outlook
        if event.external_calendar_id == 'outlook_primary' and event.external_event_id and event.user_id:
            try:
                outlook_client = OutlookCalendarClient(db)
                outlook_data = {
                     'title': event.title,
                     'description': event.description,
                     'location': event.location,
                     'start_time': event.start_time.isoformat(),
                     'end_time': event.end_time.isoformat() if event.end_time else None,
                     'all_day': event.all_day,
                     'recurrence_rule': event.recurrence_rule
                }
                await outlook_client.update_outlook_event(str(event.user_id), event.external_event_id, outlook_data)
            except Exception as e:
                print(f"⚠️ Failed to sync update to Outlook: {e}")

        elif event_data.get("sync_to_outlook") and event.user_id:
            try:
                outlook_client = OutlookCalendarClient(db)
                outlook_data = {
                     'title': event.title,
                     'description': event.description,
                     'location': event.location,
                     'start_time': event.start_time.isoformat(),
                     'end_time': event.end_time.isoformat() if event.end_time else None,
                     'all_day': event.all_day,
                     'recurrence_rule': event.recurrence_rule
                }
                external_id = await outlook_client.create_outlook_event(str(event.user_id), outlook_data)
                if external_id:
                    event.external_event_id = external_id
                    event.external_calendar_id = 'outlook_primary'
                    event.is_family_hub_event = True
                    await db.commit()
                    event_dict["external_event_id"] = external_id
            except Exception as e:
                print(f"⚠️ Failed to sync new event to Outlook: {e}")

        return event_dict

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        print(f"❌ Error updating event: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating event: {str(e)}")


# ==========================================
# DELETE EVENT
# ==========================================
@router.delete("/events/{event_id}", status_code=204)
async def delete_calendar_event(
    event_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Delete a calendar event."""
    try:
        # Fetch event
        result = await db.execute(
            select(CalendarEvent).where(CalendarEvent.id == event_id)
        )
        event = result.scalar_one_or_none()

        if not event:
            raise HTTPException(status_code=404, detail="Event not found")

        # ==========================================
        # GOOGLE SYNC HOOK (Delete)
        # ==========================================
        if event.external_calendar_id == 'primary' and event.external_event_id and event.user_id:
            try:
                client = GoogleCalendarClient(db)
                await client.delete_google_event(str(event.user_id), event.external_event_id)
            except Exception as e:
                print(f"⚠️ Failed to delete event from Google: {e}")

        # ==========================================
        # OUTLOOK SYNC HOOK (Delete)
        # ==========================================
        if event.external_calendar_id == 'outlook_primary' and event.external_event_id and event.user_id:
            try:
                outlook_client = OutlookCalendarClient(db)
                await outlook_client.delete_outlook_event(str(event.user_id), event.external_event_id)
            except Exception as e:
                print(f"⚠️ Failed to delete event from Outlook: {e}")

        await db.delete(event)
        await db.commit()

        return None

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        print(f"❌ Error deleting event: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting event: {str(e)}")

# ==========================================
# GET SINGLE ATTENDEE
# ==========================================
@router.get("/events/{event_id}/attendees/{attendee_id}", response_model=EventAttendeeResponse)
async def get_event_attendee(
    event_id: UUID,
    attendee_id: UUID,
    tenant_id: UUID = Query(..., description="Tenant ID for authorization"),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific attendee for an event."""
    try:
        attendee = await CalendarCRUD.get_attendee(db, tenant_id, event_id, attendee_id)

        if not attendee:
            raise HTTPException(
                status_code=404,
                detail="Event or attendee not found"
            )

        return attendee

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching attendee: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error fetching attendee: {str(e)}")


# ==========================================
# UPDATE ATTENDEE RSVP
# ==========================================
@router.patch("/events/{event_id}/attendees/{attendee_id}/rsvp", response_model=EventAttendeeResponse)
async def update_attendee_rsvp(
    event_id: UUID,
    attendee_id: UUID,
    rsvp_update: RSVPUpdate,
    tenant_id: UUID = Query(..., description="Tenant ID for authorization"),
    db: AsyncSession = Depends(get_db)
):
    """Update an attendee's RSVP status."""
    try:
        attendee = await CalendarCRUD.update_attendee_rsvp(
            db,
            tenant_id,
            event_id,
            attendee_id,
            rsvp_update
        )

        if not attendee:
            raise HTTPException(
                status_code=404,
                detail="Event or attendee not found"
            )

        return attendee

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        print(f"❌ Error updating RSVP: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error updating RSVP: {str(e)}")


# ==========================================
# GOOGLE CALENDAR SYNC (PHASE 2.2)
# ==========================================

from fastapi.responses import RedirectResponse
from services.calendar.google_client import GoogleCalendarClient

@router.get("/auth/google/authorize")
async def google_authorize(
    user_id: UUID,
    tenant_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Start OAuth2 flow for Google Calendar."""
    try:
        client = GoogleCalendarClient(db)
        url = client.get_auth_url(user_id, tenant_id)
        return RedirectResponse(url)
    except Exception as e:
        print(f"❌ Error generating auth URL: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating auth URL: {str(e)}")


@router.get("/auth/google/callback")
async def google_callback(
    code: str,
    state: str,
    db: AsyncSession = Depends(get_db)
):
    """Handle OAuth2 callback from Google."""
    try:
        client = GoogleCalendarClient(db)
        link = await client.handle_callback(code, state)
        
        # Redirect back to frontend settings page with success status
        import os
        base_url = os.getenv("API_BASE_URL", "http://localhost:3000")
        # Remove port if present (Caddy serves frontend on same host without port)
        frontend_url = base_url.replace(":8000", "").replace(":3000", "")
        return RedirectResponse(
            url=f"{frontend_url}/settings?status=success&provider=google",
            status_code=303
        )
    except Exception as e:
        print(f"❌ Error in OAuth callback: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error in OAuth callback: {str(e)}")


@router.get("/sync/google")
async def trigger_google_sync(
    user_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Manually trigger a Google Calendar sync for a user."""
    try:
        client = GoogleCalendarClient(db)
        count = await client.sync_events(str(user_id))
        return {"status": "success", "synced_events": count}
    except Exception as e:
        print(f"❌ Error syncing events: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error syncing events: {str(e)}")


# ==========================================
# OUTLOOK CALENDAR SYNC (PHASE 2.2)
# ==========================================

from services.calendar.outlook_client import OutlookCalendarClient

@router.get("/auth/outlook/authorize")
async def outlook_authorize(
    user_id: UUID,
    tenant_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Start OAuth2 flow for Outlook Calendar."""
    try:
        client = OutlookCalendarClient(db)
        url = client.get_auth_url(str(user_id), str(tenant_id))
        return RedirectResponse(url)
    except Exception as e:
        print(f"❌ Error generating Outlook auth URL: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating auth URL: {str(e)}")


@router.get("/auth/outlook/callback")
async def outlook_callback(
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
    error_description: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Handle OAuth2 callback from Microsoft."""
    import os
    base_url = os.getenv("API_BASE_URL", "http://localhost:3000")
    frontend_url = base_url.replace(":8000", "").replace(":3000", "")

    # Check for OAuth error from Microsoft
    if error:
        print(f"❌ Microsoft OAuth error: {error} - {error_description}")
        error_msg = error_description or error
        return RedirectResponse(
            url=f"{frontend_url}/settings?status=error&provider=outlook&message={error_msg}",
            status_code=303
        )

    # Check required params
    if not code or not state:
        print(f"❌ Missing code or state in Outlook callback")
        return RedirectResponse(
            url=f"{frontend_url}/settings?status=error&provider=outlook&message=Missing+authorization+code",
            status_code=303
        )

    try:
        client = OutlookCalendarClient(db)
        link = await client.handle_callback(code, state)

        # Redirect back to frontend settings page with success status
        return RedirectResponse(
            url=f"{frontend_url}/settings?status=success&provider=outlook",
            status_code=303
        )
    except Exception as e:
        print(f"❌ Error in Outlook OAuth callback: {str(e)}")
        return RedirectResponse(
            url=f"{frontend_url}/settings?status=error&provider=outlook&message=Token+exchange+failed",
            status_code=303
        )


@router.get("/sync/outlook")
async def trigger_outlook_sync(
    user_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Manually trigger an Outlook Calendar sync for a user."""
    try:
        client = OutlookCalendarClient(db)
        count = await client.sync_events(str(user_id))
        return {"status": "success", "synced_events": count}
    except Exception as e:
        print(f"❌ Error syncing Outlook events: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error syncing events: {str(e)}")


@router.get("/connected-accounts")
async def get_connected_accounts(
    user_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get list of connected external calendars for a user."""
    try:
        stmt = select(UserExternalCalendar).where(
            UserExternalCalendar.user_id == user_id,
            UserExternalCalendar.is_active == True
        )
        result = await db.execute(stmt)
        calendars = result.scalars().all()
        
        return [
            {
                "id": str(cal.id),
                "provider": cal.provider,
                "email_address": cal.calendar_name,  # Using calendar_name as display
                "display_name": f"{cal.provider.title()} Calendar",
                "is_default": True,  # For now, assume connected calendar is default
                "receive_invites": True
            }
            for cal in calendars
        ]
    except Exception as e:
        print(f"❌ Error fetching connected accounts: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching connected accounts: {str(e)}")

