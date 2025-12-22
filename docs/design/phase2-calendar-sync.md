# Calendar Sync - Design Document

**Feature:** 2.2 Calendar Sync
**Phase:** 2 - Integration & Sync
**Status:** Design Complete
**Created:** December 22, 2025

---

## Overview

Two-way calendar synchronization with Google Calendar, iCloud Calendar, and Outlook. Events created in Family Hub sync TO external calendars, and external events sync INTO Family Hub for a unified view.

### Key Requirements
- Two-way sync (bidirectional)
- Single calendar per provider (user selects which one)
- Unified view of all calendars
- Conflict detection with exception process
- Support Google, iCloud, Outlook

---

## Database Models

### ExternalCalendar Table
```sql
CREATE TABLE external_calendars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Provider info
    provider VARCHAR(50) NOT NULL,  -- 'google', 'icloud', 'outlook'
    provider_calendar_id VARCHAR(255) NOT NULL,  -- Provider's calendar ID
    calendar_name VARCHAR(255),
    calendar_color VARCHAR(7),

    -- OAuth credentials (encrypted)
    access_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,

    -- iCloud specific
    caldav_url TEXT,
    icloud_app_password_encrypted TEXT,

    -- Sync settings
    sync_direction VARCHAR(20) DEFAULT 'bidirectional',  -- 'bidirectional', 'pull_only', 'push_only'
    is_primary BOOLEAN DEFAULT FALSE,  -- Primary calendar for new events
    is_active BOOLEAN DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(tenant_id, provider, provider_calendar_id)
);

CREATE INDEX idx_external_calendars_tenant ON external_calendars(tenant_id);
CREATE INDEX idx_external_calendars_user ON external_calendars(user_id);
```

### CalendarSyncState Table
```sql
CREATE TABLE calendar_sync_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_calendar_id UUID NOT NULL REFERENCES external_calendars(id) ON DELETE CASCADE,

    -- Sync tracking
    last_sync_at TIMESTAMP WITH TIME ZONE,
    last_sync_status VARCHAR(50),  -- 'success', 'failed', 'partial'
    last_sync_error TEXT,

    -- Incremental sync tokens
    sync_token TEXT,  -- Google sync token
    ctag TEXT,        -- CalDAV ctag

    -- Stats
    events_synced INTEGER DEFAULT 0,
    events_created INTEGER DEFAULT 0,
    events_updated INTEGER DEFAULT 0,
    events_deleted INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### CalendarEventMapping Table
```sql
CREATE TABLE calendar_event_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Family Hub event
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,

    -- External event
    external_calendar_id UUID NOT NULL REFERENCES external_calendars(id) ON DELETE CASCADE,
    external_event_id VARCHAR(255) NOT NULL,
    external_etag VARCHAR(255),  -- For change detection

    -- Sync metadata
    last_synced_at TIMESTAMP WITH TIME ZONE,
    sync_direction VARCHAR(20),  -- 'from_external', 'to_external'
    is_deleted BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(event_id, external_calendar_id),
    UNIQUE(external_calendar_id, external_event_id)
);

CREATE INDEX idx_event_mappings_event ON calendar_event_mappings(event_id);
CREATE INDEX idx_event_mappings_external ON calendar_event_mappings(external_calendar_id);
```

### CalendarConflict Table
```sql
CREATE TABLE calendar_conflicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Conflicting events
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    external_calendar_id UUID REFERENCES external_calendars(id) ON DELETE CASCADE,
    external_event_id VARCHAR(255),

    -- Conflict details
    conflict_type VARCHAR(50) NOT NULL,  -- 'time_overlap', 'update_conflict', 'delete_conflict'
    local_data JSONB,       -- Family Hub event data at conflict time
    external_data JSONB,    -- External event data at conflict time

    -- Resolution
    status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'resolved_local', 'resolved_external', 'ignored'
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id),
    resolution_notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_calendar_conflicts_tenant ON calendar_conflicts(tenant_id, status);
```

---

## Backend Architecture

### Directory Structure
```
backend/services/calendar_sync/
├── __init__.py
├── routes.py           # API endpoints
├── schemas.py          # Pydantic models
├── crud.py             # Database operations
├── engine.py           # Main sync orchestrator
├── providers/
│   ├── __init__.py
│   ├── base.py         # Abstract provider interface
│   ├── google.py       # Google Calendar API
│   ├── icloud.py       # iCloud CalDAV
│   └── outlook.py      # Microsoft Graph API
├── conflict.py         # Conflict detection/resolution
└── utils.py            # iCal parsing, timezone handling
```

### Provider Abstraction
```python
# backend/services/calendar_sync/providers/base.py
from abc import ABC, abstractmethod
from typing import List, Optional
from datetime import datetime

class CalendarEvent:
    """Normalized event format across providers."""
    id: str
    title: str
    description: Optional[str]
    start_time: datetime
    end_time: datetime
    is_all_day: bool
    location: Optional[str]
    attendees: List[str]
    recurrence: Optional[str]  # RRULE string
    etag: Optional[str]

class CalendarSyncProvider(ABC):
    """Base class for calendar sync providers."""

    @abstractmethod
    async def authenticate(self, credentials: dict) -> bool:
        """Validate credentials."""
        pass

    @abstractmethod
    async def list_calendars(self) -> List[dict]:
        """List available calendars for user to select."""
        pass

    @abstractmethod
    async def fetch_events(
        self,
        calendar_id: str,
        since: datetime = None,
        sync_token: str = None
    ) -> tuple[List[CalendarEvent], str]:
        """Fetch events. Returns (events, new_sync_token)."""
        pass

    @abstractmethod
    async def create_event(self, calendar_id: str, event: CalendarEvent) -> str:
        """Create event, return external ID."""
        pass

    @abstractmethod
    async def update_event(self, calendar_id: str, event_id: str, event: CalendarEvent) -> bool:
        """Update existing event."""
        pass

    @abstractmethod
    async def delete_event(self, calendar_id: str, event_id: str) -> bool:
        """Delete event."""
        pass
```

### Google Calendar Implementation
```python
# backend/services/calendar_sync/providers/google.py
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

class GoogleCalendarSync(CalendarSyncProvider):
    """Google Calendar sync via Calendar API v3."""

    def __init__(self, access_token: str, refresh_token: str):
        self.credentials = Credentials(
            token=access_token,
            refresh_token=refresh_token,
            token_uri='https://oauth2.googleapis.com/token',
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET
        )
        self.service = build('calendar', 'v3', credentials=self.credentials)

    async def list_calendars(self) -> List[dict]:
        """List user's calendars."""
        result = self.service.calendarList().list().execute()
        return [
            {
                'id': cal['id'],
                'name': cal['summary'],
                'color': cal.get('backgroundColor'),
                'is_primary': cal.get('primary', False)
            }
            for cal in result.get('items', [])
        ]

    async def fetch_events(
        self,
        calendar_id: str,
        since: datetime = None,
        sync_token: str = None
    ) -> tuple[List[CalendarEvent], str]:
        """Fetch events with incremental sync support."""

        params = {
            'calendarId': calendar_id,
            'maxResults': 250,
            'singleEvents': True,
            'orderBy': 'startTime'
        }

        if sync_token:
            params['syncToken'] = sync_token
        elif since:
            params['timeMin'] = since.isoformat() + 'Z'

        events = []
        page_token = None

        while True:
            if page_token:
                params['pageToken'] = page_token

            result = self.service.events().list(**params).execute()

            for item in result.get('items', []):
                events.append(self._parse_event(item))

            page_token = result.get('nextPageToken')
            if not page_token:
                break

        new_sync_token = result.get('nextSyncToken')
        return events, new_sync_token

    async def create_event(self, calendar_id: str, event: CalendarEvent) -> str:
        """Create event in Google Calendar."""
        body = self._to_google_event(event)
        result = self.service.events().insert(
            calendarId=calendar_id,
            body=body
        ).execute()
        return result['id']

    def _parse_event(self, item: dict) -> CalendarEvent:
        """Parse Google event to normalized format."""
        start = item.get('start', {})
        end = item.get('end', {})

        return CalendarEvent(
            id=item['id'],
            title=item.get('summary', 'Untitled'),
            description=item.get('description'),
            start_time=self._parse_datetime(start),
            end_time=self._parse_datetime(end),
            is_all_day='date' in start,
            location=item.get('location'),
            attendees=[a['email'] for a in item.get('attendees', [])],
            recurrence=item.get('recurrence', [None])[0],
            etag=item.get('etag')
        )
```

### iCloud CalDAV Implementation
```python
# backend/services/calendar_sync/providers/icloud.py
import caldav
from icalendar import Calendar as iCalendar

class ICloudCalendarSync(CalendarSyncProvider):
    """iCloud Calendar sync via CalDAV."""

    CALDAV_URL = "https://caldav.icloud.com"

    def __init__(self, apple_id: str, app_password: str):
        self.client = caldav.DAVClient(
            url=self.CALDAV_URL,
            username=apple_id,
            password=app_password
        )

    async def list_calendars(self) -> List[dict]:
        """List iCloud calendars."""
        principal = self.client.principal()
        calendars = principal.calendars()

        return [
            {
                'id': str(cal.url),
                'name': cal.name,
                'color': cal.get_properties(['{http://apple.com/ns/ical/}calendar-color']).get(
                    '{http://apple.com/ns/ical/}calendar-color', '#4285f4'
                )
            }
            for cal in calendars
        ]

    async def fetch_events(
        self,
        calendar_id: str,
        since: datetime = None,
        sync_token: str = None
    ) -> tuple[List[CalendarEvent], str]:
        """Fetch events from iCloud calendar."""
        calendar = self.client.calendar(url=calendar_id)

        # Get ctag for change detection
        props = calendar.get_properties(['{http://calendarserver.org/ns/}getctag'])
        new_ctag = props.get('{http://calendarserver.org/ns/}getctag')

        # Fetch events
        if since:
            events = calendar.date_search(start=since, end=None)
        else:
            events = calendar.events()

        parsed_events = []
        for event in events:
            ical = iCalendar.from_ical(event.data)
            for component in ical.walk():
                if component.name == 'VEVENT':
                    parsed_events.append(self._parse_vevent(component, event))

        return parsed_events, new_ctag
```

### Outlook/Microsoft Graph Implementation
```python
# backend/services/calendar_sync/providers/outlook.py
import msal
import aiohttp

class OutlookCalendarSync(CalendarSyncProvider):
    """Outlook Calendar sync via Microsoft Graph API."""

    GRAPH_URL = "https://graph.microsoft.com/v1.0"

    def __init__(self, access_token: str, refresh_token: str):
        self.access_token = access_token
        self.refresh_token = refresh_token

    async def list_calendars(self) -> List[dict]:
        """List Outlook calendars."""
        async with aiohttp.ClientSession() as session:
            headers = {'Authorization': f'Bearer {self.access_token}'}
            async with session.get(
                f"{self.GRAPH_URL}/me/calendars",
                headers=headers
            ) as response:
                data = await response.json()
                return [
                    {
                        'id': cal['id'],
                        'name': cal['name'],
                        'color': self._map_outlook_color(cal.get('color')),
                        'is_primary': cal.get('isDefaultCalendar', False)
                    }
                    for cal in data.get('value', [])
                ]

    async def fetch_events(
        self,
        calendar_id: str,
        since: datetime = None,
        sync_token: str = None
    ) -> tuple[List[CalendarEvent], str]:
        """Fetch events via delta query for incremental sync."""
        async with aiohttp.ClientSession() as session:
            headers = {'Authorization': f'Bearer {self.access_token}'}

            if sync_token:
                url = sync_token  # Delta link is the full URL
            else:
                url = f"{self.GRAPH_URL}/me/calendars/{calendar_id}/events/delta"
                if since:
                    url += f"?$filter=lastModifiedDateTime ge {since.isoformat()}Z"

            events = []
            while url:
                async with session.get(url, headers=headers) as response:
                    data = await response.json()
                    for item in data.get('value', []):
                        events.append(self._parse_event(item))

                    url = data.get('@odata.nextLink')
                    delta_link = data.get('@odata.deltaLink')

            return events, delta_link
```

### Sync Engine
```python
# backend/services/calendar_sync/engine.py
from datetime import datetime, timedelta
from typing import List
import asyncio

class CalendarSyncEngine:
    """Orchestrates calendar synchronization."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def sync_calendar(self, external_calendar_id: UUID) -> SyncResult:
        """
        Perform bidirectional sync for a calendar.

        Flow:
        1. Fetch remote changes since last sync
        2. Fetch local changes since last sync
        3. Detect conflicts
        4. Apply remote changes locally
        5. Push local changes to remote
        6. Update sync state
        """
        calendar = await get_external_calendar(self.db, external_calendar_id)
        provider = self._get_provider(calendar)
        sync_state = await get_sync_state(self.db, external_calendar_id)

        result = SyncResult()

        # 1. Fetch remote changes
        remote_events, new_sync_token = await provider.fetch_events(
            calendar.provider_calendar_id,
            sync_token=sync_state.sync_token
        )

        # 2. Process each remote event
        for remote_event in remote_events:
            mapping = await get_event_mapping_by_external(
                self.db, external_calendar_id, remote_event.id
            )

            if mapping:
                # Existing event - check for conflicts
                local_event = await get_event(self.db, mapping.event_id)
                if self._has_conflict(local_event, remote_event, mapping):
                    await self._create_conflict(calendar, local_event, remote_event)
                    result.conflicts += 1
                else:
                    await self._update_local_event(local_event, remote_event)
                    result.updated += 1
            else:
                # New remote event - create locally
                local_event = await self._create_local_event(calendar, remote_event)
                result.created += 1

        # 3. Push local changes to remote
        local_changes = await get_unsynced_events(
            self.db,
            calendar.tenant_id,
            since=sync_state.last_sync_at
        )

        for local_event in local_changes:
            mapping = await get_event_mapping_by_local(
                self.db, external_calendar_id, local_event.id
            )

            if mapping:
                # Update remote
                await provider.update_event(
                    calendar.provider_calendar_id,
                    mapping.external_event_id,
                    self._to_calendar_event(local_event)
                )
            else:
                # Create remote
                external_id = await provider.create_event(
                    calendar.provider_calendar_id,
                    self._to_calendar_event(local_event)
                )
                await create_event_mapping(
                    self.db, local_event.id, external_calendar_id, external_id
                )
            result.pushed += 1

        # 4. Update sync state
        await update_sync_state(
            self.db,
            external_calendar_id,
            sync_token=new_sync_token,
            last_sync_at=datetime.utcnow(),
            status='success'
        )

        return result

    def _has_conflict(
        self,
        local: Event,
        remote: CalendarEvent,
        mapping: CalendarEventMapping
    ) -> bool:
        """Check if local and remote have conflicting changes."""
        # Both modified since last sync
        if (local.updated_at > mapping.last_synced_at and
            remote.etag != mapping.external_etag):
            return True
        return False
```

---

## API Endpoints

### Calendar Connection
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/calendar-sync/calendars` | List connected calendars |
| POST | `/calendar-sync/connect/google` | Start Google OAuth |
| GET | `/calendar-sync/connect/google/callback` | Google OAuth callback |
| POST | `/calendar-sync/connect/icloud` | Connect iCloud |
| POST | `/calendar-sync/connect/outlook` | Start Microsoft OAuth |
| GET | `/calendar-sync/connect/outlook/callback` | Microsoft OAuth callback |

### Calendar Selection
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/calendar-sync/{provider}/available` | List available calendars from provider |
| POST | `/calendar-sync/{provider}/select` | Select calendar to sync |
| DELETE | `/calendar-sync/calendars/{id}` | Disconnect calendar |

### Sync Operations
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/calendar-sync/calendars/{id}/sync` | Trigger manual sync |
| GET | `/calendar-sync/calendars/{id}/status` | Get sync status |
| GET | `/calendar-sync/conflicts` | List pending conflicts |
| POST | `/calendar-sync/conflicts/{id}/resolve` | Resolve conflict |

---

## Frontend Components

### Directory Structure
```
frontend/src/features/calendar-sync/
├── CalendarSyncSettings.tsx      # Main settings panel
├── ConnectedCalendarsList.tsx    # List of connected calendars
├── ConnectCalendarModal.tsx      # Provider selection
├── CalendarSelectionModal.tsx    # Select which calendar to sync
├── SyncStatusBadge.tsx           # Shows sync status
├── ConflictReviewModal.tsx       # Resolve sync conflicts
└── calendar-sync.css
```

### Key UI Flows

#### 1. Connecting Google Calendar
```
User clicks "Add Calendar" → "Google"
  → Redirects to Google OAuth
  → User grants calendar access
  → Callback shows CalendarSelectionModal
  → Lists user's calendars: "Personal", "Work", "Family"
  → User selects "Family"
  → Calendar added, initial sync starts
  → Shows "Syncing 45 events..."
```

#### 2. Conflict Resolution
```
ConflictReviewModal shows:
  ┌─────────────────────────────────────────────┐
  │  Sync Conflict Detected                     │
  │                                             │
  │  Event: "Dentist Appointment"               │
  │  Date: December 28, 2025                    │
  │                                             │
  │  ┌─────────────┐    ┌─────────────┐        │
  │  │ Family Hub  │    │   Google    │        │
  │  │ 2:00 PM     │    │ 3:00 PM     │        │
  │  │ Dr. Smith   │    │ Dr. Jones   │        │
  │  └─────────────┘    └─────────────┘        │
  │                                             │
  │  [Keep Family Hub] [Keep Google] [Merge]   │
  └─────────────────────────────────────────────┘
```

#### 3. Unified Calendar View
```
Calendar shows events with provider badges:
  ┌─────────────────────────────────────────────┐
  │  Monday, December 23                        │
  │                                             │
  │  9:00 AM  ● Team Standup        [Google]   │
  │  2:00 PM  ● Dentist             [iCloud]   │
  │  4:00 PM  ● Pick up Tommy       [Hub]      │
  │  6:00 PM  ● Dinner at Mum's     [Hub]      │
  └─────────────────────────────────────────────┘
```

---

## Sync Timing

### Automatic Sync
- **Pull frequency:** Every 15 minutes via background task
- **Push frequency:** Immediately when event created/updated in Family Hub
- **Full sync:** Daily at 3 AM to catch any missed changes

### Background Worker
```python
# backend/workers/calendar_sync_worker.py
from celery import Celery
from celery.schedules import crontab

app = Celery('calendar_sync')

@app.task
def sync_all_calendars():
    """Sync all active calendars."""
    calendars = get_active_calendars()
    for calendar in calendars:
        sync_calendar.delay(calendar.id)

@app.task
def sync_calendar(calendar_id: UUID):
    """Sync single calendar."""
    engine = CalendarSyncEngine(db)
    result = await engine.sync_calendar(calendar_id)
    log.info(f"Synced calendar {calendar_id}: {result}")

# Schedule
app.conf.beat_schedule = {
    'sync-calendars-every-15-minutes': {
        'task': 'sync_all_calendars',
        'schedule': crontab(minute='*/15'),
    },
}
```

---

## Implementation Phases

### Phase 2.2a: Google Calendar
1. Google OAuth setup in GCP console
2. Provider implementation
3. Calendar selection UI
4. Initial one-way pull sync
5. Two-way sync with conflict detection

### Phase 2.2b: iCloud Calendar
1. CalDAV integration
2. iCloud connect modal
3. Full sync implementation

### Phase 2.2c: Outlook Calendar
1. Microsoft App Registration
2. Graph API provider
3. Outlook connect flow

### Phase 2.2d: Unified View
1. Provider badges on events
2. Filter by provider
3. Conflict resolution UI

---

## Security Considerations

1. **Token Encryption:** All OAuth tokens encrypted with Fernet
2. **Minimal Scopes:** Request only calendar read/write, not full account
3. **Token Refresh:** Automatic refresh before expiry
4. **Revocation:** Allow users to disconnect/revoke access
5. **Audit:** Log all sync operations

---

**Document Version:** 1.0
**Last Updated:** December 22, 2025
**Owner:** James Brown
