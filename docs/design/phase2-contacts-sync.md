# Contacts + Address Book Sync - Design Document

**Feature:** 2.1 Contacts + Address Book Sync
**Phase:** 2 - Integration & Sync
**Status:** Design Complete
**Created:** December 22, 2025

---

## Overview

External contacts system for storing non-user contacts (grandparents, friends, extended family) with sync capabilities from iCloud and Google Contacts.

### Key Requirements
- Pull-only sync (read from providers, don't push back)
- iCloud priority, then Google (Yahoo excluded)
- Duplicate detection with user-controlled merge
- Birthday tracking
- Contact management UI

---

## Database Models

### Contact Table
```sql
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Core fields
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    display_name VARCHAR(200),  -- Computed or custom
    nickname VARCHAR(100),

    -- Contact info (primary)
    primary_email VARCHAR(255),
    primary_phone VARCHAR(50),

    -- Important dates
    birthday DATE,
    anniversary DATE,

    -- Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    county VARCHAR(100),
    postcode VARCHAR(20),
    country VARCHAR(100) DEFAULT 'United Kingdom',

    -- Organization
    company VARCHAR(200),
    job_title VARCHAR(200),

    -- Notes and metadata
    notes TEXT,
    photo_url VARCHAR(500),

    -- Sync tracking
    external_source VARCHAR(50),  -- 'icloud', 'google', 'manual'
    external_id VARCHAR(255),     -- Provider's unique ID
    last_synced_at TIMESTAMP WITH TIME ZONE,
    sync_etag VARCHAR(255),       -- For change detection

    -- Status
    is_favorite BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(tenant_id, external_source, external_id)
);

CREATE INDEX idx_contacts_tenant ON contacts(tenant_id);
CREATE INDEX idx_contacts_name ON contacts(tenant_id, last_name, first_name);
CREATE INDEX idx_contacts_birthday ON contacts(tenant_id, birthday);
CREATE INDEX idx_contacts_external ON contacts(external_source, external_id);
```

### ContactPhone Table (Multiple phones per contact)
```sql
CREATE TABLE contact_phones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    phone_type VARCHAR(50) DEFAULT 'mobile',  -- mobile, home, work, other
    phone_number VARCHAR(50) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_contact_phones_contact ON contact_phones(contact_id);
```

### ContactEmail Table (Multiple emails per contact)
```sql
CREATE TABLE contact_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    email_type VARCHAR(50) DEFAULT 'personal',  -- personal, work, other
    email_address VARCHAR(255) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_contact_emails_contact ON contact_emails(contact_id);
```

### ContactRelationship Table (Link contacts to family members)
```sql
CREATE TABLE contact_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,  -- Family member
    related_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    relationship_type VARCHAR(50) NOT NULL,  -- grandparent, aunt, uncle, cousin, friend, etc.
    relationship_label VARCHAR(100),  -- Custom label like "Tommy's Godfather"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(contact_id, user_id, relationship_type),
    CHECK (user_id IS NOT NULL OR related_contact_id IS NOT NULL)
);
```

### ExternalContactSource Table (OAuth credentials per provider)
```sql
CREATE TABLE external_contact_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    provider VARCHAR(50) NOT NULL,  -- 'icloud', 'google'
    account_email VARCHAR(255),

    -- OAuth tokens (encrypted)
    access_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,

    -- iCloud specific
    icloud_app_password_encrypted TEXT,

    -- Sync state
    is_active BOOLEAN DEFAULT TRUE,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    last_sync_status VARCHAR(50),  -- 'success', 'failed', 'partial'
    last_sync_error TEXT,
    sync_cursor TEXT,  -- For incremental sync

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(tenant_id, user_id, provider)
);
```

### PendingContactMerge Table (Duplicate detection queue)
```sql
CREATE TABLE pending_contact_merges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    existing_contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    incoming_contact_data JSONB NOT NULL,  -- Full contact data from sync
    incoming_source VARCHAR(50) NOT NULL,
    incoming_external_id VARCHAR(255),

    match_score DECIMAL(5,2),  -- 0-100 confidence
    match_reasons TEXT[],  -- ['same_email', 'similar_name', 'same_phone']

    status VARCHAR(50) DEFAULT 'pending',  -- pending, merged, skipped, kept_both
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_pending_merges_tenant ON pending_contact_merges(tenant_id, status);
```

---

## Backend Architecture

### Directory Structure
```
backend/services/contacts/
├── __init__.py
├── routes.py           # API endpoints
├── schemas.py          # Pydantic models
├── crud.py             # Database operations
├── sync/
│   ├── __init__.py
│   ├── base.py         # Abstract sync provider
│   ├── icloud.py       # iCloud CardDAV sync
│   ├── google.py       # Google People API sync
│   └── merger.py       # Duplicate detection/merge logic
└── utils.py            # Helper functions
```

### Provider Abstraction
```python
# backend/services/contacts/sync/base.py
from abc import ABC, abstractmethod
from typing import List
from ..schemas import ContactSyncData

class ContactSyncProvider(ABC):
    """Base class for contact sync providers."""

    @abstractmethod
    async def authenticate(self, credentials: dict) -> bool:
        """Validate credentials and establish connection."""
        pass

    @abstractmethod
    async def fetch_contacts(self, since: datetime = None) -> List[ContactSyncData]:
        """Fetch contacts from provider. If since provided, fetch only changes."""
        pass

    @abstractmethod
    async def test_connection(self) -> bool:
        """Test if credentials are still valid."""
        pass
```

### iCloud Implementation
```python
# backend/services/contacts/sync/icloud.py
import aiohttp
from typing import List
import vobject  # For parsing vCard format

class ICloudContactSync(ContactSyncProvider):
    """
    iCloud contacts sync via CardDAV.
    Uses app-specific password (not OAuth).
    """

    CARDDAV_URL = "https://contacts.icloud.com"

    def __init__(self, apple_id: str, app_password: str):
        self.apple_id = apple_id
        self.app_password = app_password

    async def authenticate(self, credentials: dict) -> bool:
        """Test iCloud credentials via CardDAV PROPFIND."""
        async with aiohttp.ClientSession() as session:
            auth = aiohttp.BasicAuth(self.apple_id, self.app_password)
            async with session.request(
                'PROPFIND',
                f"{self.CARDDAV_URL}/",
                auth=auth,
                headers={'Depth': '0'}
            ) as response:
                return response.status == 207

    async def fetch_contacts(self, since: datetime = None) -> List[ContactSyncData]:
        """Fetch all contacts via CardDAV REPORT request."""
        contacts = []

        # 1. Get address book URL
        addressbook_url = await self._get_addressbook_url()

        # 2. Fetch all vCards
        vcards = await self._fetch_vcards(addressbook_url)

        # 3. Parse vCards into ContactSyncData
        for vcard_data, etag, href in vcards:
            contact = self._parse_vcard(vcard_data)
            contact.external_id = href
            contact.sync_etag = etag
            contacts.append(contact)

        return contacts

    def _parse_vcard(self, vcard_str: str) -> ContactSyncData:
        """Parse vCard 3.0/4.0 into ContactSyncData."""
        vcard = vobject.readOne(vcard_str)

        return ContactSyncData(
            first_name=vcard.n.value.given if hasattr(vcard, 'n') else '',
            last_name=vcard.n.value.family if hasattr(vcard, 'n') else '',
            emails=self._extract_emails(vcard),
            phones=self._extract_phones(vcard),
            birthday=self._extract_birthday(vcard),
            # ... other fields
        )
```

### Google Implementation
```python
# backend/services/contacts/sync/google.py
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

class GoogleContactSync(ContactSyncProvider):
    """
    Google Contacts sync via People API.
    Uses OAuth 2.0.
    """

    def __init__(self, access_token: str, refresh_token: str):
        self.credentials = Credentials(
            token=access_token,
            refresh_token=refresh_token,
            token_uri='https://oauth2.googleapis.com/token',
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET
        )

    async def fetch_contacts(self, since: datetime = None) -> List[ContactSyncData]:
        """Fetch contacts via Google People API."""
        service = build('people', 'v1', credentials=self.credentials)

        contacts = []
        page_token = None

        while True:
            results = service.people().connections().list(
                resourceName='people/me',
                pageSize=100,
                pageToken=page_token,
                personFields='names,emailAddresses,phoneNumbers,birthdays,addresses,organizations,photos'
            ).execute()

            for person in results.get('connections', []):
                contacts.append(self._parse_person(person))

            page_token = results.get('nextPageToken')
            if not page_token:
                break

        return contacts
```

### Duplicate Detection
```python
# backend/services/contacts/sync/merger.py
from difflib import SequenceMatcher
from typing import Tuple, List

class ContactMerger:
    """Handles duplicate detection and merge logic."""

    MATCH_THRESHOLD = 70  # Minimum score to consider a match

    def find_duplicates(
        self,
        incoming: ContactSyncData,
        existing: List[Contact]
    ) -> List[Tuple[Contact, float, List[str]]]:
        """
        Find potential duplicates for incoming contact.
        Returns list of (contact, score, reasons) tuples.
        """
        matches = []

        for contact in existing:
            score, reasons = self._calculate_match_score(incoming, contact)
            if score >= self.MATCH_THRESHOLD:
                matches.append((contact, score, reasons))

        return sorted(matches, key=lambda x: x[1], reverse=True)

    def _calculate_match_score(
        self,
        incoming: ContactSyncData,
        existing: Contact
    ) -> Tuple[float, List[str]]:
        """Calculate match score between two contacts."""
        score = 0
        reasons = []

        # Exact email match = 50 points
        if self._emails_match(incoming.emails, existing):
            score += 50
            reasons.append('same_email')

        # Exact phone match = 40 points
        if self._phones_match(incoming.phones, existing):
            score += 40
            reasons.append('same_phone')

        # Name similarity = up to 30 points
        name_score = self._name_similarity(incoming, existing)
        if name_score > 0.8:
            score += 30
            reasons.append('similar_name')
        elif name_score > 0.6:
            score += 15
            reasons.append('partial_name_match')

        return min(score, 100), reasons

    def merge_contacts(
        self,
        existing: Contact,
        incoming: ContactSyncData,
        strategy: str = 'prefer_existing'
    ) -> Contact:
        """
        Merge incoming data into existing contact.
        Strategy: 'prefer_existing', 'prefer_incoming', 'fill_gaps'
        """
        if strategy == 'fill_gaps':
            # Only fill in missing fields
            if not existing.birthday and incoming.birthday:
                existing.birthday = incoming.birthday
            # ... etc

        return existing
```

---

## API Endpoints

### Contact CRUD
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/contacts` | List contacts (paginated, searchable) |
| GET | `/contacts/{id}` | Get single contact |
| POST | `/contacts` | Create manual contact |
| PUT | `/contacts/{id}` | Update contact |
| DELETE | `/contacts/{id}` | Delete contact |
| GET | `/contacts/birthdays/upcoming` | Get upcoming birthdays |

### Sync Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/contacts/sources` | List connected sync sources |
| POST | `/contacts/sources/icloud` | Connect iCloud (app password) |
| POST | `/contacts/sources/google` | Start Google OAuth flow |
| GET | `/contacts/sources/google/callback` | Google OAuth callback |
| DELETE | `/contacts/sources/{id}` | Disconnect sync source |
| POST | `/contacts/sources/{id}/sync` | Trigger manual sync |
| GET | `/contacts/sources/{id}/status` | Get sync status |

### Duplicate Resolution
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/contacts/pending-merges` | List pending duplicates |
| POST | `/contacts/pending-merges/{id}/merge` | Merge contacts |
| POST | `/contacts/pending-merges/{id}/keep-both` | Keep as separate |
| POST | `/contacts/pending-merges/{id}/skip` | Skip incoming |

---

## Frontend Components

### Directory Structure
```
frontend/src/features/contacts/
├── ContactsPage.tsx           # Main contacts list page
├── ContactCard.tsx            # Individual contact display
├── ContactDetailDrawer.tsx    # Full contact view/edit
├── ContactForm.tsx            # Create/edit form
├── ContactSearch.tsx          # Search and filter bar
├── SyncSourcesPanel.tsx       # Manage sync connections
├── ICloudConnectModal.tsx     # iCloud setup (app password)
├── GoogleConnectButton.tsx    # Google OAuth button
├── DuplicateReviewModal.tsx   # Resolve duplicates
├── BirthdayWidget.tsx         # Dashboard widget
└── contacts.css
```

### Key UI Flows

#### 1. Adding iCloud Sync
```
User clicks "Connect iCloud"
  → ICloudConnectModal opens
  → Shows instructions for generating app-specific password
  → User enters Apple ID + app password
  → Backend validates via CardDAV
  → On success: starts initial sync
  → Shows progress: "Syncing 150 contacts..."
  → Displays any duplicates for review
```

#### 2. Adding Google Sync
```
User clicks "Connect Google"
  → Redirects to Google OAuth consent
  → User grants "View contacts" permission
  → Callback saves tokens
  → Starts initial sync
  → Displays any duplicates for review
```

#### 3. Duplicate Resolution
```
DuplicateReviewModal shows:
  ┌─────────────────────────────────────────────┐
  │  Potential Duplicate Found                  │
  │                                             │
  │  ┌─────────────┐    ┌─────────────┐        │
  │  │ Existing    │    │ From iCloud │        │
  │  │ John Smith  │    │ John Smith  │        │
  │  │ 07700...    │    │ 07700...    │        │
  │  │ No birthday │    │ 15 Mar 1985 │        │
  │  └─────────────┘    └─────────────┘        │
  │                                             │
  │  Match: 90% (same phone, similar name)     │
  │                                             │
  │  [Merge] [Keep Both] [Skip Incoming]       │
  └─────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 2.1a: Core Contacts (No Sync)
1. Database migrations
2. Contact CRUD API
3. Contact list UI
4. Contact form (create/edit)
5. Birthday widget for dashboard

### Phase 2.1b: iCloud Sync
1. CardDAV integration
2. iCloud connect modal
3. Initial sync logic
4. Duplicate detection

### Phase 2.1c: Google Sync
1. Google OAuth setup
2. People API integration
3. Google connect flow
4. Unified duplicate handling

---

## Security Considerations

1. **Token Encryption:** All OAuth tokens and passwords encrypted at rest using Fernet
2. **Scopes:** Request minimal OAuth scopes (read-only contacts)
3. **App Passwords:** iCloud uses app-specific passwords, not main password
4. **Token Refresh:** Automatic token refresh before expiry
5. **Audit Log:** Log all sync operations for debugging

---

## Testing Strategy

1. **Unit Tests:** Duplicate detection logic, vCard parsing
2. **Integration Tests:** Provider API mocking
3. **E2E Tests:** Full sync flow with test accounts
4. **Manual Testing:** Real iCloud/Google accounts

---

**Document Version:** 1.0
**Last Updated:** December 22, 2025
**Owner:** James Brown
