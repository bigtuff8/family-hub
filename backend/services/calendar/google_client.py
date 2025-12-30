from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from shared.models import UserExternalCalendar, User
from datetime import datetime
import os
import json
import logging

SCOPES = ['https://www.googleapis.com/auth/calendar.events']

class GoogleCalendarClient:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.client_id = os.getenv("GOOGLE_CLIENT_ID")
        self.client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
        # Update to match the mounted API prefix
        self.redirect_uri = "http://localhost:8000/api/v1/calendar/auth/google/callback"

    def get_auth_url(self, user_id: str, tenant_id: str):
        """Generate the Google OAuth2 consent URL."""
        flow = Flow.from_client_config(
            self._get_client_config(),
            scopes=SCOPES,
            redirect_uri=self.redirect_uri
        )
        # Pass user_id and tenant_id in state so we know who to link on callback
        state = json.dumps({"user_id": str(user_id), "tenant_id": str(tenant_id)})
        authorization_url, _ = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            state=state,
            prompt='consent' # Force consent to ensure we get refresh_token
        )
        return authorization_url

    async def handle_callback(self, code: str, state: str):
        """Exchange code for tokens and save to DB."""
        # Parse state
        state_data = json.loads(state)
        user_id = state_data["user_id"]
        tenant_id = state_data["tenant_id"]

        flow = Flow.from_client_config(
            self._get_client_config(),
            scopes=SCOPES,
            redirect_uri=self.redirect_uri
        )
        flow.fetch_token(code=code)
        creds = flow.credentials

        # Save to UserExternalCalendar
        # Check if exists first
        stmt = select(UserExternalCalendar).where(
            UserExternalCalendar.user_id == user_id,
            UserExternalCalendar.provider == 'google'
        )
        result = await self.db.execute(stmt)
        existing = result.scalar_one_or_none()

        if existing:
            calendar_link = existing
            calendar_link.access_token_encrypted = creds.token
            if creds.refresh_token:
                calendar_link.refresh_token_encrypted = creds.refresh_token
        else:
            calendar_link = UserExternalCalendar(
                user_id=user_id,
                tenant_id=tenant_id,
                provider='google',
                provider_calendar_id='primary', # Default to primary
                calendar_name='Google Calendar',
                access_token_encrypted=creds.token,
                refresh_token_encrypted=creds.refresh_token,
                is_active=True
            )
            self.db.add(calendar_link)
        
        await self.db.commit()
        return calendar_link

    def _get_client_config(self):
        return {
            "web": {
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        }

    async def sync_events(self, user_id: str):
        """Sync events for a specific user's connected calendar."""
        # Get credentials from DB
        stmt = select(UserExternalCalendar).where(
            UserExternalCalendar.user_id == user_id,
            UserExternalCalendar.provider == 'google',
            UserExternalCalendar.is_active == True
        )
        result = await self.db.execute(stmt)
        calendar_link = result.scalar_one_or_none()

        if not calendar_link:
            print(f"No active Google Calendar found for user {user_id}")
            return

        # Build credentials object
        creds = Credentials(
            token=calendar_link.access_token_encrypted,
            refresh_token=calendar_link.refresh_token_encrypted,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=self.client_id,
            client_secret=self.client_secret,
            scopes=SCOPES
        )

        # Refresh if expired
        from google.auth.transport.requests import Request
        if creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
                # Update DB with new token
                calendar_link.access_token_encrypted = creds.token
                await self.db.commit()
            except Exception as e:
                print(f"Failed to refresh token: {e}")
                # Optional: mark as inactive or needs_reauth
                return

        # Build service
        service = build('calendar', 'v3', credentials=creds)

        # List events (Sync)
        # Fetch future events only (User Preference), but increase limit to catch events far in future
        now = datetime.utcnow().isoformat() + 'Z'  # 'Z' indicates UTC time
        
        try:
            logger = logging.getLogger(__name__)
            # Log the request parameters to be sure
            logger.info(f"Fetching Google Calendar events with: calendarId='primary', timeMin={now}, maxResults=2500")

            events_result = service.events().list(
                calendarId='primary', 
                timeMin=now,
                maxResults=2500, # Keep high limit to ensure we reach July 
                singleEvents=True, # Expand recurring events
                orderBy='startTime'
            ).execute()
            events = events_result.get('items', [])

            # Import to DB
            from shared.models import CalendarEvent, User
            
            # Simple "Google Wins" strategy: 
            # 1. Delete existing future Google events for this user (simplest way to handle moves/deletes)
            # 2. Insert fresh batch
            # Note: A proper sync would match IDs and update, but this is MVP "Import" style.
            
            # Use external_calendar_id to track these events
            # First, clean up old specific Google events to avoid duplicates
            # (In a real production app, we would upsert based on external_event_id)
            
            # For this step, let's just Log what we found to verify implementation
            logger.info(f"Found {len(events)} events from Google for user {user_id}")
            # Verbose logging removed after verification
            
            for event in events:
                await self._upsert_event(event, calendar_link)
                
            # Update sync timestamp
            calendar_link.last_sync_at = datetime.utcnow()
            await self.db.commit()
            
            return len(events)

        except Exception as e:
            logger.error(f"Error calling Google API: {e}")
            raise e

    async def _upsert_event(self, google_event, calendar_link):
        """Insert or Update a single event."""
        from shared.models import CalendarEvent
        
        # Extract fields
        event_id = google_event['id']
        summary = google_event.get('summary', 'No Title')
        description = google_event.get('description', '')
        location = google_event.get('location', '')
        
        start = google_event.get('start')
        end = google_event.get('end')
        
        # Handle Date vs DateTime (All day vs Specific time)
        if 'dateTime' in start:
            start_time = datetime.fromisoformat(start['dateTime'].replace('Z', '+00:00'))
            all_day = False
        else:
            # All day event (YYYY-MM-DD)
            start_time = datetime.fromisoformat(start['date'])
            all_day = True
            
        if 'dateTime' in end:
            end_time = datetime.fromisoformat(end['dateTime'].replace('Z', '+00:00'))
        else:
            end_time = datetime.fromisoformat(end['date'])

        # Check if exists
        stmt = select(CalendarEvent).where(
            CalendarEvent.external_event_id == event_id,
            CalendarEvent.external_calendar_id == 'primary' # We are only syncing primary for now
        )
        result = await self.db.execute(stmt)
        existing_event = result.scalar_one_or_none()
        
        if existing_event:
            # Update
            existing_event.title = summary
            existing_event.description = description
            existing_event.location = location
            existing_event.start_time = start_time
            existing_event.end_time = end_time
            existing_event.all_day = all_day
            existing_event.updated_at = datetime.utcnow()
        else:
            # Create
            new_event = CalendarEvent(
                tenant_id=calendar_link.tenant_id,
                user_id=calendar_link.user_id, # Assigned to the user who owns the calendar
                title=summary,
                description=description,
                location=location,
                start_time=start_time,
                end_time=end_time,
                all_day=all_day,
                external_calendar_id='primary',
                external_event_id=event_id,
                is_family_hub_event=False, # MARKER: This is an external event
                color=calendar_link.calendar_color or '#DB4437' # Google Red default
            )
            self.db.add(new_event)

