# Calendar Sync - Design Document

**Feature:** 2.2 Calendar Sync
**Phase:** 2 - Integration & Sync
**Status:** Design Complete
**Created:** December 22, 2025
**Updated:** December 27, 2025

---

## Overview

Family Hub acts as the **source of truth** for family events. Events created in the app are distributed to family members and external invitees via calendar invites. Users respond to invites from their external calendars (Google, iCloud, Outlook), and responses sync back to the app.

### Key Principles
1. **Family Hub is the Organizer** - All events created in the app are owned by the app
2. **Invite-Based Distribution** - Events sent as calendar invites to all invitees
3. **Response-Only External Interaction** - Users can Accept/Decline/Tentative from external calendars, but cannot edit event details
4. **Amendments Only in App** - Any changes to events must be made in Family Hub
5. **User-Specific Sync** - Each family member connects their own calendar accounts

### Family Structure Example
```
Family Hub (Brown Family)
├── James (Dad) - default: jamesbrownyork8@gmail.com
│   └── Connected: Google, Outlook, iCloud
├── Nicola (Mum) - default: nicola@icloud.com
│   └── Connected: iCloud
├── Tommy (minor) - default: tommy@icloud.com
│   └── Connected: iCloud (parent-visible)
└── Harry (minor, age 7) - default: harry@icloud.com
    └── Connected: (invites sent, no responses expected)
```

---

## Architecture

### Dedicated Organizer Account

All invites are sent FROM a dedicated Family Hub Outlook account, which serves as the calendar organizer identity.

```
Family Hub Organizer Account (Outlook)
├── Email: familyhub-brown@outlook.com
├── Calendar: "Family Hub"
├── Sends all meeting invites
├── Receives all responses
└── Future: Email notifications channel
```

**Why Outlook:**
- Microsoft Graph API has excellent invite/response management
- Free tier is sufficient
- Good webhook support for response tracking
- Clear organizer identity in all calendar apps

### Event Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     FAMILY HUB APP                          │
│                   (Source of Truth)                         │
├─────────────────────────────────────────────────────────────┤
│  1. James creates "Family Dinner - Saturday 6pm"            │
│  2. Adds invitees: Nicola, Tommy, Harry, Grandma           │
│  3. App stores event and generates invites                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │     Family Hub Organizer Account      │
        │     (familyhub-brown@outlook.com)     │
        │                                       │
        │  Creates event in "Family Hub"        │
        │  calendar with all attendees          │
        └───────────────────┬───────────────────┘
                            │
            Outlook sends ICS invites to:
                            │
    ┌───────────┬───────────┼───────────┬───────────┐
    ▼           ▼           ▼           ▼           ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│James's │ │James's │ │Nicola's│ │Tommy's │ │Grandma │
│Google  │ │iCloud  │ │iCloud  │ │iCloud  │ │Email   │
└───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘
    │          │          │          │          │
    └──────────┴────┬─────┴──────────┴──────────┘
                    │
                    ▼
        Responses sync back to app via:
        - Microsoft Graph webhooks
        - Polling organizer calendar
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│  App shows responses:                                       │
│  "Family Dinner" - Nicola ✓, Tommy ✓, Harry ?, Grandma ✗   │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Models

### User Email Accounts Table
```sql
-- Email accounts connected by each user (for receiving invites)
CREATE TABLE user_email_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Account details
    email_address VARCHAR(255) NOT NULL,
    provider VARCHAR(50),  -- 'google', 'icloud', 'outlook', 'other'
    display_name VARCHAR(255),  -- "Work Email", "Personal"

    -- Settings
    is_default BOOLEAN DEFAULT FALSE,  -- Primary for receiving invites
    is_verified BOOLEAN DEFAULT FALSE,
    receive_invites BOOLEAN DEFAULT TRUE,  -- Send invites to this address

    -- OAuth (if syncing responses from this account)
    access_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, email_address)
);

CREATE INDEX idx_user_emails_user ON user_email_accounts(user_id);
CREATE INDEX idx_user_emails_default ON user_email_accounts(user_id, is_default);
```

### Organizer Account Table
```sql
-- The dedicated Family Hub organizer account (one per tenant)
CREATE TABLE organizer_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Account details
    provider VARCHAR(50) NOT NULL DEFAULT 'outlook',
    email_address VARCHAR(255) NOT NULL,
    calendar_id VARCHAR(255),  -- The calendar ID in the provider

    -- OAuth credentials (encrypted)
    access_token_encrypted TEXT NOT NULL,
    refresh_token_encrypted TEXT NOT NULL,
    token_expires_at TIMESTAMP WITH TIME ZONE,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_sync_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(tenant_id)
);
```

### Events Table (Updated)
```sql
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Event details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(500),

    -- Timing
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    is_all_day BOOLEAN DEFAULT FALSE,
    timezone VARCHAR(50) DEFAULT 'Europe/London',

    -- Recurrence
    recurrence_rule TEXT,  -- RRULE format
    recurrence_parent_id UUID REFERENCES events(id),

    -- Ownership
    created_by_user_id UUID NOT NULL REFERENCES users(id),
    is_family_hub_event BOOLEAN DEFAULT TRUE,  -- Created in app (vs imported)

    -- External tracking (for organizer account)
    external_event_id VARCHAR(255),  -- ID in organizer's calendar
    external_etag VARCHAR(255),

    -- Status
    status VARCHAR(50) DEFAULT 'confirmed',  -- 'confirmed', 'tentative', 'cancelled'

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_events_tenant ON events(tenant_id);
CREATE INDEX idx_events_time ON events(tenant_id, start_time);
CREATE INDEX idx_events_created_by ON events(created_by_user_id);
```

### Event Invites Table
```sql
-- Tracks who is invited and their response
CREATE TABLE event_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Invitee (one of these will be set)
    invitee_user_id UUID REFERENCES users(id) ON DELETE CASCADE,  -- Family member
    invitee_contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,  -- External contact
    invitee_email VARCHAR(255),  -- Fallback if no user/contact record

    -- Computed for queries
    invitee_type VARCHAR(50) NOT NULL,  -- 'family_user', 'contact', 'email_only'
    invitee_display_name VARCHAR(255),

    -- Response tracking
    response_status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'accepted', 'declined', 'tentative'
    response_received_at TIMESTAMP WITH TIME ZONE,
    response_source VARCHAR(50),  -- 'google', 'outlook', 'icloud', 'manual'
    response_comment TEXT,

    -- Invite delivery
    invite_sent_at TIMESTAMP WITH TIME ZONE,
    invite_sent_to_email VARCHAR(255),  -- Which email received the invite
    invite_delivery_status VARCHAR(50),  -- 'sent', 'delivered', 'bounced'

    -- For updates
    last_update_sent_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(event_id, invitee_user_id),
    UNIQUE(event_id, invitee_contact_id),
    UNIQUE(event_id, invitee_email)
);

CREATE INDEX idx_event_invites_event ON event_invites(event_id);
CREATE INDEX idx_event_invites_user ON event_invites(invitee_user_id);
CREATE INDEX idx_event_invites_pending ON event_invites(tenant_id, response_status);
```

### External Calendar Sync Table (For pulling external events)
```sql
-- User's connected calendars (for viewing their external events in unified view)
CREATE TABLE user_external_calendars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Provider info
    provider VARCHAR(50) NOT NULL,  -- 'google', 'icloud', 'outlook'
    provider_calendar_id VARCHAR(255) NOT NULL,
    calendar_name VARCHAR(255),
    calendar_color VARCHAR(7),

    -- OAuth credentials (encrypted)
    access_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,

    -- iCloud specific
    caldav_url TEXT,
    app_password_encrypted TEXT,

    -- Sync settings
    is_active BOOLEAN DEFAULT TRUE,
    show_in_unified_view BOOLEAN DEFAULT TRUE,

    -- Sync state
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_token TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, provider, provider_calendar_id)
);
```

### Parental Controls Table
```sql
CREATE TABLE parental_controls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Relationship
    parent_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    child_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Permissions
    can_view_calendar BOOLEAN DEFAULT TRUE,
    can_view_contacts BOOLEAN DEFAULT TRUE,
    can_manage_calendar BOOLEAN DEFAULT TRUE,  -- Create/edit events for them
    can_manage_contacts BOOLEAN DEFAULT TRUE,
    can_respond_on_behalf BOOLEAN DEFAULT TRUE,  -- Respond to invites for them

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(parent_user_id, child_user_id)
);
```

---

## Backend Architecture

### Directory Structure
```
backend/services/calendar/
├── __init__.py
├── routes.py               # API endpoints
├── schemas.py              # Pydantic models
├── crud.py                 # Database operations
├── events.py               # Event management
├── invites.py              # Invite sending & tracking
├── responses.py            # Response sync & processing
├── organizer/
│   ├── __init__.py
│   ├── outlook.py          # Outlook Graph API for organizer
│   └── manager.py          # Organizer account management
├── user_calendars/
│   ├── __init__.py
│   ├── base.py             # Abstract provider
│   ├── google.py           # Google Calendar (user's view)
│   ├── icloud.py           # iCloud Calendar (user's view)
│   └── outlook.py          # Outlook Calendar (user's view)
└── unified_view.py         # Merge all calendars for display
```

### Organizer Account Manager
```python
# backend/services/calendar/organizer/manager.py
from datetime import datetime
from typing import List
import aiohttp

class OrganizerAccountManager:
    """Manages the dedicated Family Hub organizer Outlook account."""

    GRAPH_URL = "https://graph.microsoft.com/v1.0"

    def __init__(self, db: AsyncSession, tenant_id: UUID):
        self.db = db
        self.tenant_id = tenant_id
        self.organizer = None

    async def initialize(self):
        """Load organizer account credentials."""
        self.organizer = await get_organizer_account(self.db, self.tenant_id)
        if not self.organizer:
            raise ValueError("No organizer account configured for tenant")

    async def create_event_with_invites(
        self,
        event: Event,
        invitees: List[EventInvite]
    ) -> str:
        """
        Create event in organizer's calendar with all attendees.
        Outlook will automatically send invites to all attendees.
        """
        headers = await self._get_auth_headers()

        # Build attendee list
        attendees = []
        for invite in invitees:
            email = invite.invite_sent_to_email or invite.invitee_email
            attendees.append({
                "emailAddress": {
                    "address": email,
                    "name": invite.invitee_display_name
                },
                "type": "required"
            })

        # Create event body
        event_body = {
            "subject": event.title,
            "body": {
                "contentType": "HTML",
                "content": event.description or ""
            },
            "start": {
                "dateTime": event.start_time.isoformat(),
                "timeZone": event.timezone
            },
            "end": {
                "dateTime": event.end_time.isoformat(),
                "timeZone": event.timezone
            },
            "location": {
                "displayName": event.location or ""
            },
            "attendees": attendees,
            "isOnlineMeeting": False,
            # Custom property to identify Family Hub events
            "singleValueExtendedProperties": [{
                "id": "String {66f5a359-4659-4830-9070-00047ec6ac6e} Name FamilyHubEventId",
                "value": str(event.id)
            }]
        }

        if event.is_all_day:
            event_body["isAllDay"] = True

        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.GRAPH_URL}/me/calendars/{self.organizer.calendar_id}/events",
                headers=headers,
                json=event_body
            ) as response:
                if response.status == 201:
                    data = await response.json()
                    return data["id"]
                else:
                    error = await response.text()
                    raise Exception(f"Failed to create event: {error}")

    async def update_event(self, external_event_id: str, event: Event) -> bool:
        """
        Update event in organizer's calendar.
        Outlook will automatically send update notifications to attendees.
        """
        headers = await self._get_auth_headers()

        event_body = {
            "subject": event.title,
            "body": {
                "contentType": "HTML",
                "content": event.description or ""
            },
            "start": {
                "dateTime": event.start_time.isoformat(),
                "timeZone": event.timezone
            },
            "end": {
                "dateTime": event.end_time.isoformat(),
                "timeZone": event.timezone
            },
            "location": {
                "displayName": event.location or ""
            }
        }

        async with aiohttp.ClientSession() as session:
            async with session.patch(
                f"{self.GRAPH_URL}/me/events/{external_event_id}",
                headers=headers,
                json=event_body
            ) as response:
                return response.status == 200

    async def cancel_event(self, external_event_id: str, comment: str = None) -> bool:
        """
        Cancel event - sends cancellation to all attendees.
        """
        headers = await self._get_auth_headers()

        body = {}
        if comment:
            body["comment"] = comment

        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.GRAPH_URL}/me/events/{external_event_id}/cancel",
                headers=headers,
                json=body
            ) as response:
                return response.status == 202

    async def fetch_attendee_responses(self, external_event_id: str) -> List[dict]:
        """
        Fetch current attendee responses from the event.
        """
        headers = await self._get_auth_headers()

        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{self.GRAPH_URL}/me/events/{external_event_id}?$select=attendees",
                headers=headers
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    return [
                        {
                            "email": att["emailAddress"]["address"],
                            "name": att["emailAddress"]["name"],
                            "response": att["status"]["response"],  # 'accepted', 'declined', 'tentativelyAccepted', 'none'
                            "time": att["status"].get("time")
                        }
                        for att in data.get("attendees", [])
                    ]
                return []

    async def _get_auth_headers(self) -> dict:
        """Get authorization headers, refreshing token if needed."""
        # Check if token needs refresh
        if self.organizer.token_expires_at < datetime.utcnow():
            await self._refresh_token()

        token = decrypt(self.organizer.access_token_encrypted)
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
```

### Invite Manager
```python
# backend/services/calendar/invites.py
from typing import List, Optional
from uuid import UUID

class InviteManager:
    """Manages event invites and response tracking."""

    def __init__(self, db: AsyncSession, tenant_id: UUID):
        self.db = db
        self.tenant_id = tenant_id
        self.organizer = OrganizerAccountManager(db, tenant_id)

    async def send_invites_for_event(self, event_id: UUID) -> int:
        """
        Send invites to all invitees of an event.
        Returns number of invites sent.
        """
        await self.organizer.initialize()

        event = await get_event(self.db, event_id)
        invites = await get_event_invites(self.db, event_id)

        # Resolve email addresses for each invitee
        for invite in invites:
            if invite.invitee_user_id:
                # Family member - get their default email
                email_account = await get_default_email(
                    self.db, invite.invitee_user_id
                )
                invite.invite_sent_to_email = email_account.email_address
            elif invite.invitee_contact_id:
                # Contact - get primary email
                contact = await get_contact(self.db, invite.invitee_contact_id)
                invite.invite_sent_to_email = contact.email_primary
            # else: invitee_email is already set

        # Create event in organizer calendar (sends invites automatically)
        external_id = await self.organizer.create_event_with_invites(
            event, invites
        )

        # Update event with external ID
        await update_event_external_id(self.db, event_id, external_id)

        # Mark invites as sent
        for invite in invites:
            await update_invite_sent(
                self.db,
                invite.id,
                sent_at=datetime.utcnow(),
                sent_to=invite.invite_sent_to_email,
                status='sent'
            )

        return len(invites)

    async def sync_responses(self, event_id: UUID) -> dict:
        """
        Sync responses from organizer calendar back to app.
        Returns dict of changes.
        """
        await self.organizer.initialize()

        event = await get_event(self.db, event_id)
        if not event.external_event_id:
            return {"error": "Event not synced to organizer calendar"}

        # Fetch current responses
        responses = await self.organizer.fetch_attendee_responses(
            event.external_event_id
        )

        changes = {"updated": 0, "unchanged": 0}

        for response in responses:
            # Map Outlook response to our format
            status_map = {
                "accepted": "accepted",
                "declined": "declined",
                "tentativelyAccepted": "tentative",
                "none": "pending",
                "notResponded": "pending"
            }

            new_status = status_map.get(response["response"], "pending")

            # Find matching invite
            invite = await get_invite_by_email(
                self.db, event_id, response["email"]
            )

            if invite and invite.response_status != new_status:
                await update_invite_response(
                    self.db,
                    invite.id,
                    status=new_status,
                    received_at=response.get("time"),
                    source="outlook"
                )
                changes["updated"] += 1
            else:
                changes["unchanged"] += 1

        return changes

    async def add_invitee(
        self,
        event_id: UUID,
        invitee_user_id: UUID = None,
        invitee_contact_id: UUID = None,
        invitee_email: str = None
    ) -> EventInvite:
        """
        Add a new invitee to an existing event.
        Sends invite if event already synced.
        """
        # Determine invitee type and display name
        if invitee_user_id:
            user = await get_user(self.db, invitee_user_id)
            invitee_type = "family_user"
            display_name = user.display_name
        elif invitee_contact_id:
            contact = await get_contact(self.db, invitee_contact_id)
            invitee_type = "contact"
            display_name = contact.display_name
            invitee_email = contact.email_primary
        else:
            invitee_type = "email_only"
            display_name = invitee_email

        # Create invite record
        invite = await create_event_invite(
            self.db,
            event_id=event_id,
            invitee_user_id=invitee_user_id,
            invitee_contact_id=invitee_contact_id,
            invitee_email=invitee_email,
            invitee_type=invitee_type,
            invitee_display_name=display_name
        )

        # If event already synced, add attendee to existing event
        event = await get_event(self.db, event_id)
        if event.external_event_id:
            await self.organizer.initialize()
            await self.organizer.add_attendee(
                event.external_event_id,
                invitee_email,
                display_name
            )

        return invite
```

### Response Sync Worker
```python
# backend/workers/response_sync_worker.py
from celery import Celery
from celery.schedules import crontab

@app.task
def sync_all_event_responses():
    """Sync responses for all active events."""
    events = get_events_with_pending_responses()
    for event in events:
        sync_event_responses.delay(event.id)

@app.task
def sync_event_responses(event_id: UUID):
    """Sync responses for a single event."""
    manager = InviteManager(db, event.tenant_id)
    result = await manager.sync_responses(event_id)
    log.info(f"Synced responses for event {event_id}: {result}")

# Schedule - every 5 minutes for active response tracking
app.conf.beat_schedule = {
    'sync-responses-every-5-minutes': {
        'task': 'sync_all_event_responses',
        'schedule': crontab(minute='*/5'),
    },
}
```

---

## API Endpoints

### Event Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/events` | List events for current user |
| POST | `/events` | Create new event |
| GET | `/events/{id}` | Get event details with invitees |
| PUT | `/events/{id}` | Update event (sends update to invitees) |
| DELETE | `/events/{id}` | Cancel event (sends cancellation) |

### Invitee Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/events/{id}/invitees` | Add invitee to event |
| DELETE | `/events/{id}/invitees/{invitee_id}` | Remove invitee |
| POST | `/events/{id}/invitees/{invitee_id}/respond` | Manually set response (for minors) |

### Response Sync
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/events/{id}/sync-responses` | Manually trigger response sync |
| GET | `/events/{id}/responses` | Get all responses for event |

### User Email Accounts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/me/email-accounts` | List user's email accounts |
| POST | `/users/me/email-accounts` | Add email account |
| PUT | `/users/me/email-accounts/{id}` | Update (set default, etc.) |
| DELETE | `/users/me/email-accounts/{id}` | Remove email account |

### External Calendar Sync (Unified View)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/me/calendars` | List user's connected calendars |
| POST | `/users/me/calendars/connect/google` | Connect Google Calendar |
| POST | `/users/me/calendars/connect/icloud` | Connect iCloud Calendar |
| POST | `/users/me/calendars/connect/outlook` | Connect Outlook Calendar |
| GET | `/calendar/unified` | Get unified view of all events |

### Parental Controls
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/parental/children` | List children under parental control |
| GET | `/parental/children/{id}/calendar` | View child's calendar |
| POST | `/parental/children/{id}/respond` | Respond to invite on behalf of child |

---

## Frontend Components

### Directory Structure
```
frontend/src/features/calendar/
├── CalendarPage.tsx              # Main calendar view
├── EventDetailModal.tsx          # View/edit event
├── CreateEventModal.tsx          # Create new event
├── InviteeSelector.tsx           # Add invitees with smart search
├── ResponseTracker.tsx           # Show who's responded
├── UnifiedCalendarView.tsx       # Combined calendar display
├── components/
│   ├── EventCard.tsx
│   ├── ResponseBadge.tsx         # Accept/Decline/Tentative badge
│   ├── InviteeList.tsx
│   └── SmartContactSearch.tsx    # Typeahead contact search
└── settings/
    ├── EmailAccountsSettings.tsx
    ├── CalendarSyncSettings.tsx
    └── ParentalControls.tsx
```

### Key UI Flows

#### 1. Creating an Event with Invites
```
User clicks "New Event"
  → CreateEventModal opens
  → Fills in: Title, Date/Time, Location
  → Adds invitees via InviteeSelector:
      ┌─────────────────────────────────────────────┐
      │  Add Invitees                               │
      │  ┌─────────────────────────────────────┐   │
      │  │ Type name or email...               │   │
      │  └─────────────────────────────────────┘   │
      │                                             │
      │  Smart suggestions (as user types):        │
      │  ┌─────────────────────────────────────┐   │
      │  │ 👤 Nicola (Mum) - nicola@icloud.com│   │
      │  │ 👤 Tommy - tommy@icloud.com         │   │
      │  │ 📇 Grandma - grandma@email.com     │   │
      │  │ ➕ Invite "john@newem..." as guest  │   │
      │  └─────────────────────────────────────┘   │
      │                                             │
      │  Selected:                                  │
      │  [Nicola ×] [Tommy ×] [Harry ×]            │
      └─────────────────────────────────────────────┘
  → Clicks "Create & Send Invites"
  → Event created, invites sent
  → Shows confirmation with pending responses
```

#### 2. Viewing Event Responses
```
EventDetailModal shows:
  ┌─────────────────────────────────────────────┐
  │  Family Dinner                              │
  │  Saturday, January 4th at 6:00 PM           │
  │  📍 Home                                    │
  │                                             │
  │  Responses:                                 │
  │  ┌─────────────────────────────────────┐   │
  │  │ ✓ Nicola      Accepted   (iCloud)   │   │
  │  │ ✓ Tommy       Accepted   (iCloud)   │   │
  │  │ ? Harry       Pending               │   │
  │  │ ✗ Grandma     Declined   (Gmail)    │   │
  │  └─────────────────────────────────────┘   │
  │                                             │
  │  [Edit Event] [Cancel Event]               │
  └─────────────────────────────────────────────┘
```

#### 3. Unified Calendar View
```
Calendar displays events from all sources:
  ┌─────────────────────────────────────────────┐
  │  January 2026                    [Settings] │
  │  ◀ Week ▶                                  │
  │                                             │
  │  Monday 5th                                 │
  │  ├─ 9:00  Team Standup         [Work Cal]  │
  │  ├─ 14:00 Dentist              [Personal]  │
  │  └─ 18:00 Family Dinner        [Hub] ✓✓?✗  │
  │                                             │
  │  Tuesday 6th                                │
  │  └─ 15:30 School Pickup        [Hub] ✓     │
  │                                             │
  │  Legend:                                    │
  │  [Hub] = Family Hub event (editable)       │
  │  [Work Cal] = Synced from Google           │
  │  [Personal] = Synced from iCloud           │
  └─────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 2.2a: Organizer Account Setup
1. Create dedicated Outlook account for family
2. Microsoft App Registration for Graph API
3. OAuth flow to connect organizer account
4. Basic event creation in organizer calendar

### Phase 2.2b: Invite System
1. Event creation with invitees
2. InviteeSelector with smart search
3. Invite sending via organizer account
4. Response tracking from organizer calendar

### Phase 2.2c: User Calendar Sync (Unified View)
1. User connects their own Google/iCloud/Outlook
2. Pull external events into unified view
3. Display with source badges
4. Read-only for external events

### Phase 2.2d: Parental Controls
1. Parent-child relationship setup
2. View children's calendars
3. Respond on behalf of minors

---

## Security Considerations

1. **Organizer Account Security:** Single account with encrypted credentials
2. **Token Encryption:** All OAuth tokens encrypted with Fernet
3. **Minimal Scopes:** Request only calendar read/write for organizer
4. **User Isolation:** Each user only sees their own calendar connections
5. **Parental Consent:** Minors' accounts managed by designated parents
6. **Audit Trail:** Log all event modifications and invite sends

---

## External Event Identification

All events created in Family Hub include a custom property for identification:

**Outlook (organizer):**
```json
{
  "singleValueExtendedProperties": [{
    "id": "String {66f5a359-4659-4830-9070-00047ec6ac6e} Name FamilyHubEventId",
    "value": "evt-uuid-here"
  }]
}
```

This allows the system to:
- Identify Family Hub events when syncing
- Prevent duplicate creation
- Track events across all attendees' calendars

---

**Document Version:** 2.0
**Last Updated:** December 27, 2025
**Owner:** James Brown
