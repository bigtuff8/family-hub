# Contacts Sync - Design Document

**Feature:** 2.3 Contacts Sync
**Phase:** 2 - Integration & Sync
**Status:** Design Complete
**Created:** December 22, 2025
**Updated:** December 27, 2025

---

## Overview

User-specific contact management with external provider sync. Each family member has their own personal contacts, with the ability to share contacts with the whole family. Contacts are used for event invitations via the smart lookup feature.

### Key Principles
1. **User-Specific Contacts** - Each user owns their own contact list
2. **Publish to Family** - Option to share contacts with all family members
3. **Smart Lookup** - Typeahead search across personal + family contacts when inviting
4. **External Sync** - Pull contacts from Google, iCloud, Outlook per user
5. **Parental Visibility** - Parents can view/manage children's contacts

### Key Requirements
- User-specific contact ownership
- "Publish to Family" shared contacts bucket
- Smart contact lookup for event invitations (typeahead)
- Two-way sync with external providers (Google, iCloud, Outlook)
- Birthday tracking integration
- Parental controls for minors' contacts

### Contact Ownership Model
```
Family Hub (Brown Family)
├── James's Contacts (private to James)
│   ├── Synced from Google (jamesbrownyork8@gmail.com)
│   ├── Synced from Outlook
│   ├── Manually added in app
│   └── Can publish any contact to family
├── Nicola's Contacts (private to Nicola)
│   ├── Synced from iCloud
│   └── Manually added in app
├── Tommy's Contacts (visible to parents)
│   └── Synced from iCloud
├── Harry's Contacts (managed by parents)
│   └── (empty for now - age 7)
└── Family Contacts (shared bucket, visible to all)
    ├── Grandma (published by James)
    ├── Grandpa (published by James)
    └── Aunt Sarah (published by Nicola)
```

### Relationship to Calendar Sync
Contacts sync shares the same provider connections as Calendar sync:
- **Google:** Same OAuth token, adds People API scope
- **iCloud:** Same Apple ID/app password, uses CardDAV
- **Outlook:** Same Microsoft token, adds Contacts.ReadWrite scope

---

## Database Models

### Contacts Table (User-Owned)
```sql
-- Main contacts table - each contact is owned by a specific user
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Contact details
    display_name VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    nickname VARCHAR(100),

    -- Primary contact methods
    email_primary VARCHAR(255),
    phone_primary VARCHAR(50),

    -- Additional contact methods (JSONB for flexibility)
    emails JSONB,  -- [{'type': 'work', 'value': 'x@y.com'}, ...]
    phones JSONB,  -- [{'type': 'mobile', 'value': '+447...'}, ...]
    addresses JSONB,

    -- Personal details
    birthday DATE,
    anniversary DATE,
    photo_url TEXT,

    -- Organization
    company VARCHAR(200),
    job_title VARCHAR(200),

    -- Notes
    notes TEXT,

    -- Source tracking
    source VARCHAR(50) DEFAULT 'manual',  -- 'manual', 'google', 'icloud', 'outlook'
    external_id VARCHAR(255),  -- ID from external provider
    external_etag VARCHAR(255),
    last_synced_at TIMESTAMP WITH TIME ZONE,

    -- Family sharing
    is_published_to_family BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP WITH TIME ZONE,
    published_by_user_id UUID REFERENCES users(id),

    -- Status
    is_favorite BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure external contacts are unique per user/provider
    UNIQUE(owner_user_id, source, external_id)
);

CREATE INDEX idx_contacts_owner ON contacts(owner_user_id);
CREATE INDEX idx_contacts_tenant ON contacts(tenant_id);
CREATE INDEX idx_contacts_email ON contacts(email_primary);
CREATE INDEX idx_contacts_published ON contacts(tenant_id, is_published_to_family) WHERE is_published_to_family = TRUE;
CREATE INDEX idx_contacts_search ON contacts USING gin(to_tsvector('english', display_name || ' ' || COALESCE(email_primary, '')));
```

### ExternalContactProvider Table
```sql
-- User's connected contact providers (for sync)
CREATE TABLE external_contact_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Provider info (links to calendar OAuth when possible)
    provider VARCHAR(50) NOT NULL,  -- 'google', 'icloud', 'outlook'
    external_calendar_id UUID REFERENCES user_external_calendars(id),  -- Shared OAuth

    -- Standalone credentials (if no calendar connected)
    access_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,

    -- iCloud specific (shared with calendar)
    carddav_url TEXT,

    -- Settings
    sync_direction VARCHAR(20) DEFAULT 'bidirectional',
    is_active BOOLEAN DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, provider)
);

CREATE INDEX idx_contact_providers_user ON external_contact_providers(user_id);
CREATE INDEX idx_contact_providers_tenant ON external_contact_providers(tenant_id);
```

### ContactSyncState Table
```sql
CREATE TABLE contact_sync_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_provider_id UUID NOT NULL REFERENCES external_contact_providers(id) ON DELETE CASCADE,

    -- Sync tracking
    last_sync_at TIMESTAMP WITH TIME ZONE,
    last_sync_status VARCHAR(50),  -- 'success', 'failed', 'partial'
    last_sync_error TEXT,

    -- Incremental sync tokens
    sync_token TEXT,      -- Google People API sync token
    ctag TEXT,            -- CardDAV ctag
    delta_link TEXT,      -- Microsoft Graph delta link

    -- Stats
    contacts_synced INTEGER DEFAULT 0,
    contacts_created INTEGER DEFAULT 0,
    contacts_updated INTEGER DEFAULT 0,
    contacts_deleted INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### ExternalContact Table
```sql
CREATE TABLE external_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    external_provider_id UUID NOT NULL REFERENCES external_contact_providers(id) ON DELETE CASCADE,

    -- External reference
    external_contact_id VARCHAR(255) NOT NULL,  -- Provider's contact ID
    external_etag VARCHAR(255),

    -- Contact data (denormalized for display)
    display_name VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email_primary VARCHAR(255),
    phone_primary VARCHAR(50),
    photo_url TEXT,

    -- Full contact data
    contact_data JSONB,  -- Complete contact record from provider

    -- Family Hub linking
    family_member_id UUID REFERENCES family_members(id) ON DELETE SET NULL,
    link_status VARCHAR(50) DEFAULT 'unlinked',  -- 'unlinked', 'auto_linked', 'manual_linked', 'ignored'

    -- Sync metadata
    last_synced_at TIMESTAMP WITH TIME ZONE,
    sync_direction VARCHAR(20),  -- 'from_external', 'to_external'
    is_deleted BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(external_provider_id, external_contact_id)
);

CREATE INDEX idx_external_contacts_tenant ON external_contacts(tenant_id);
CREATE INDEX idx_external_contacts_provider ON external_contacts(external_provider_id);
CREATE INDEX idx_external_contacts_family_member ON external_contacts(family_member_id);
CREATE INDEX idx_external_contacts_email ON external_contacts(email_primary);
```

### ContactConflict Table
```sql
CREATE TABLE contact_conflicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Conflicting contacts
    external_contact_id UUID REFERENCES external_contacts(id) ON DELETE CASCADE,
    family_member_id UUID REFERENCES family_members(id) ON DELETE SET NULL,

    -- Conflict details
    conflict_type VARCHAR(50) NOT NULL,  -- 'field_mismatch', 'duplicate_detected', 'update_conflict'
    conflicting_fields JSONB,  -- ['email', 'phone', 'name']
    local_data JSONB,
    external_data JSONB,

    -- Resolution
    status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'resolved_local', 'resolved_external', 'merged', 'ignored'
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id),
    resolution_notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_contact_conflicts_tenant ON contact_conflicts(tenant_id, status);
```

---

## Backend Architecture

### Directory Structure
```
backend/services/contacts_sync/
├── __init__.py
├── routes.py           # API endpoints
├── schemas.py          # Pydantic models
├── crud.py             # Database operations
├── engine.py           # Main sync orchestrator
├── matcher.py          # Contact-to-FamilyMember matching
├── providers/
│   ├── __init__.py
│   ├── base.py         # Abstract provider interface
│   ├── google.py       # Google People API
│   ├── icloud.py       # iCloud CardDAV
│   └── outlook.py      # Microsoft Graph API
├── conflict.py         # Conflict detection/resolution
└── utils.py            # vCard parsing, phone normalization
```

### Provider Abstraction
```python
# backend/services/contacts_sync/providers/base.py
from abc import ABC, abstractmethod
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

class Contact(BaseModel):
    """Normalized contact format across providers."""
    id: str
    display_name: str
    first_name: Optional[str]
    last_name: Optional[str]
    nickname: Optional[str]

    # Contact methods
    emails: List[dict]  # [{'type': 'home', 'value': 'x@y.com', 'primary': True}]
    phones: List[dict]  # [{'type': 'mobile', 'value': '+447...', 'primary': True}]

    # Address
    addresses: List[dict]

    # Personal
    birthday: Optional[str]  # ISO date string
    anniversary: Optional[str]

    # Organization
    organization: Optional[str]
    job_title: Optional[str]

    # Other
    notes: Optional[str]
    photo_url: Optional[str]

    # Metadata
    etag: Optional[str]
    updated_at: Optional[datetime]

class ContactsSyncProvider(ABC):
    """Base class for contacts sync providers."""

    @abstractmethod
    async def authenticate(self, credentials: dict) -> bool:
        """Validate credentials."""
        pass

    @abstractmethod
    async def fetch_contacts(
        self,
        sync_token: str = None,
        page_token: str = None
    ) -> tuple[List[Contact], str, str]:
        """
        Fetch contacts with incremental sync.
        Returns (contacts, new_sync_token, next_page_token).
        """
        pass

    @abstractmethod
    async def get_contact(self, contact_id: str) -> Contact:
        """Get single contact by ID."""
        pass

    @abstractmethod
    async def create_contact(self, contact: Contact) -> str:
        """Create contact, return external ID."""
        pass

    @abstractmethod
    async def update_contact(self, contact_id: str, contact: Contact) -> bool:
        """Update existing contact."""
        pass

    @abstractmethod
    async def delete_contact(self, contact_id: str) -> bool:
        """Delete contact."""
        pass

    @abstractmethod
    async def get_contact_photo(self, contact_id: str) -> bytes:
        """Get contact photo."""
        pass
```

### Google Contacts Implementation
```python
# backend/services/contacts_sync/providers/google.py
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

class GoogleContactsSync(ContactsSyncProvider):
    """Google Contacts sync via People API."""

    SCOPES = [
        'https://www.googleapis.com/auth/contacts',
        'https://www.googleapis.com/auth/contacts.other.readonly'
    ]

    def __init__(self, access_token: str, refresh_token: str):
        self.credentials = Credentials(
            token=access_token,
            refresh_token=refresh_token,
            token_uri='https://oauth2.googleapis.com/token',
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET
        )
        self.service = build('people', 'v1', credentials=self.credentials)

    async def fetch_contacts(
        self,
        sync_token: str = None,
        page_token: str = None
    ) -> tuple[List[Contact], str, str]:
        """Fetch contacts with sync token support."""

        person_fields = 'names,emailAddresses,phoneNumbers,addresses,birthdays,organizations,photos,metadata'

        if sync_token:
            # Incremental sync
            result = self.service.people().connections().list(
                resourceName='people/me',
                personFields=person_fields,
                syncToken=sync_token,
                pageToken=page_token,
                pageSize=100
            ).execute()
        else:
            # Full sync
            result = self.service.people().connections().list(
                resourceName='people/me',
                personFields=person_fields,
                pageToken=page_token,
                pageSize=100,
                requestSyncToken=True
            ).execute()

        contacts = []
        for person in result.get('connections', []):
            contacts.append(self._parse_person(person))

        new_sync_token = result.get('nextSyncToken')
        next_page_token = result.get('nextPageToken')

        return contacts, new_sync_token, next_page_token

    async def create_contact(self, contact: Contact) -> str:
        """Create contact in Google."""
        body = self._to_google_person(contact)
        result = self.service.people().createContact(body=body).execute()
        return result['resourceName']

    async def update_contact(self, contact_id: str, contact: Contact) -> bool:
        """Update contact in Google."""
        # First get current etag
        current = self.service.people().get(
            resourceName=contact_id,
            personFields='metadata'
        ).execute()

        body = self._to_google_person(contact)
        body['etag'] = current['etag']

        self.service.people().updateContact(
            resourceName=contact_id,
            updatePersonFields='names,emailAddresses,phoneNumbers,addresses,birthdays,organizations',
            body=body
        ).execute()
        return True

    async def delete_contact(self, contact_id: str) -> bool:
        """Delete contact from Google."""
        self.service.people().deleteContact(resourceName=contact_id).execute()
        return True

    def _parse_person(self, person: dict) -> Contact:
        """Parse Google Person to Contact."""
        names = person.get('names', [{}])[0]
        emails = [
            {
                'type': e.get('type', 'other'),
                'value': e.get('value'),
                'primary': e.get('metadata', {}).get('primary', False)
            }
            for e in person.get('emailAddresses', [])
        ]
        phones = [
            {
                'type': p.get('type', 'other'),
                'value': p.get('value'),
                'primary': p.get('metadata', {}).get('primary', False)
            }
            for p in person.get('phoneNumbers', [])
        ]

        birthday = None
        if person.get('birthdays'):
            bday = person['birthdays'][0].get('date', {})
            if bday.get('month') and bday.get('day'):
                year = bday.get('year', 1900)
                birthday = f"{year:04d}-{bday['month']:02d}-{bday['day']:02d}"

        photo_url = None
        if person.get('photos'):
            photo_url = person['photos'][0].get('url')

        org = person.get('organizations', [{}])[0]

        return Contact(
            id=person['resourceName'],
            display_name=names.get('displayName', 'Unknown'),
            first_name=names.get('givenName'),
            last_name=names.get('familyName'),
            nickname=names.get('nickname'),
            emails=emails,
            phones=phones,
            addresses=[
                {
                    'type': a.get('type', 'other'),
                    'formatted': a.get('formattedValue'),
                    'street': a.get('streetAddress'),
                    'city': a.get('city'),
                    'region': a.get('region'),
                    'postal_code': a.get('postalCode'),
                    'country': a.get('country')
                }
                for a in person.get('addresses', [])
            ],
            birthday=birthday,
            organization=org.get('name'),
            job_title=org.get('title'),
            notes=person.get('biographies', [{}])[0].get('value'),
            photo_url=photo_url,
            etag=person.get('etag'),
            updated_at=person.get('metadata', {}).get('sources', [{}])[0].get('updateTime')
        )

    def _to_google_person(self, contact: Contact) -> dict:
        """Convert Contact to Google Person format."""
        person = {
            'names': [{
                'givenName': contact.first_name,
                'familyName': contact.last_name,
                'displayName': contact.display_name
            }],
            'emailAddresses': [
                {'value': e['value'], 'type': e.get('type', 'other')}
                for e in contact.emails
            ],
            'phoneNumbers': [
                {'value': p['value'], 'type': p.get('type', 'other')}
                for p in contact.phones
            ],
            'addresses': [
                {
                    'type': a.get('type', 'other'),
                    'streetAddress': a.get('street'),
                    'city': a.get('city'),
                    'region': a.get('region'),
                    'postalCode': a.get('postal_code'),
                    'country': a.get('country')
                }
                for a in contact.addresses
            ]
        }

        if contact.birthday:
            parts = contact.birthday.split('-')
            person['birthdays'] = [{
                'date': {
                    'year': int(parts[0]) if int(parts[0]) != 1900 else None,
                    'month': int(parts[1]),
                    'day': int(parts[2])
                }
            }]

        if contact.organization or contact.job_title:
            person['organizations'] = [{
                'name': contact.organization,
                'title': contact.job_title
            }]

        return person
```

### iCloud CardDAV Implementation
```python
# backend/services/contacts_sync/providers/icloud.py
import vobject
import aiohttp
from xml.etree import ElementTree as ET

class ICloudContactsSync(ContactsSyncProvider):
    """iCloud Contacts sync via CardDAV."""

    CARDDAV_URL = "https://contacts.icloud.com"

    def __init__(self, apple_id: str, app_password: str):
        self.apple_id = apple_id
        self.app_password = app_password
        self.auth = aiohttp.BasicAuth(apple_id, app_password)

    async def _get_addressbook_url(self) -> str:
        """Get user's addressbook URL via principal discovery."""
        async with aiohttp.ClientSession() as session:
            # PROPFIND to get principal
            body = '''<?xml version="1.0"?>
            <d:propfind xmlns:d="DAV:">
                <d:prop>
                    <d:current-user-principal/>
                </d:prop>
            </d:propfind>'''

            async with session.request(
                'PROPFIND',
                f"{self.CARDDAV_URL}/",
                auth=self.auth,
                data=body,
                headers={'Depth': '0', 'Content-Type': 'application/xml'}
            ) as response:
                # Parse and extract addressbook home
                pass

    async def fetch_contacts(
        self,
        sync_token: str = None,
        page_token: str = None
    ) -> tuple[List[Contact], str, str]:
        """Fetch contacts from iCloud."""
        async with aiohttp.ClientSession() as session:
            # Get ctag for change detection
            props_body = '''<?xml version="1.0"?>
            <d:propfind xmlns:d="DAV:" xmlns:cs="http://calendarserver.org/ns/">
                <d:prop>
                    <cs:getctag/>
                </d:prop>
            </d:propfind>'''

            # REPORT for all vcards
            report_body = '''<?xml version="1.0"?>
            <card:addressbook-query xmlns:d="DAV:" xmlns:card="urn:ietf:params:xml:ns:carddav">
                <d:prop>
                    <d:getetag/>
                    <card:address-data/>
                </d:prop>
            </card:addressbook-query>'''

            addressbook_url = await self._get_addressbook_url()

            async with session.request(
                'REPORT',
                addressbook_url,
                auth=self.auth,
                data=report_body,
                headers={'Depth': '1', 'Content-Type': 'application/xml'}
            ) as response:
                content = await response.text()
                contacts = self._parse_carddav_response(content)

                # Get new ctag
                async with session.request(
                    'PROPFIND',
                    addressbook_url,
                    auth=self.auth,
                    data=props_body,
                    headers={'Depth': '0', 'Content-Type': 'application/xml'}
                ) as props_response:
                    props_content = await props_response.text()
                    new_ctag = self._extract_ctag(props_content)

                return contacts, new_ctag, None

    def _parse_vcard(self, vcard_data: str, href: str, etag: str) -> Contact:
        """Parse vCard to Contact."""
        vcard = vobject.readOne(vcard_data)

        # Extract name
        first_name = None
        last_name = None
        display_name = 'Unknown'

        if hasattr(vcard, 'n'):
            first_name = vcard.n.value.given
            last_name = vcard.n.value.family

        if hasattr(vcard, 'fn'):
            display_name = vcard.fn.value

        # Extract emails
        emails = []
        if hasattr(vcard, 'email_list'):
            for email in vcard.email_list:
                email_type = email.params.get('TYPE', ['other'])[0].lower()
                emails.append({
                    'type': email_type,
                    'value': email.value,
                    'primary': len(emails) == 0
                })

        # Extract phones
        phones = []
        if hasattr(vcard, 'tel_list'):
            for tel in vcard.tel_list:
                phone_type = tel.params.get('TYPE', ['other'])[0].lower()
                phones.append({
                    'type': phone_type,
                    'value': tel.value,
                    'primary': len(phones) == 0
                })

        # Extract birthday
        birthday = None
        if hasattr(vcard, 'bday'):
            birthday = str(vcard.bday.value)

        return Contact(
            id=href,
            display_name=display_name,
            first_name=first_name,
            last_name=last_name,
            emails=emails,
            phones=phones,
            addresses=[],
            birthday=birthday,
            etag=etag
        )

    async def create_contact(self, contact: Contact) -> str:
        """Create contact in iCloud via PUT."""
        vcard = self._to_vcard(contact)
        uid = str(uuid.uuid4())
        href = f"{await self._get_addressbook_url()}/{uid}.vcf"

        async with aiohttp.ClientSession() as session:
            async with session.put(
                href,
                auth=self.auth,
                data=vcard.serialize(),
                headers={'Content-Type': 'text/vcard'}
            ) as response:
                if response.status in (201, 204):
                    return href
                raise Exception(f"Failed to create contact: {response.status}")

        return href
```

### Outlook/Microsoft Graph Implementation
```python
# backend/services/contacts_sync/providers/outlook.py
import aiohttp

class OutlookContactsSync(ContactsSyncProvider):
    """Outlook Contacts sync via Microsoft Graph API."""

    GRAPH_URL = "https://graph.microsoft.com/v1.0"
    SCOPES = ['Contacts.ReadWrite']

    def __init__(self, access_token: str, refresh_token: str):
        self.access_token = access_token
        self.refresh_token = refresh_token

    async def fetch_contacts(
        self,
        sync_token: str = None,
        page_token: str = None
    ) -> tuple[List[Contact], str, str]:
        """Fetch contacts via delta query for incremental sync."""
        async with aiohttp.ClientSession() as session:
            headers = {'Authorization': f'Bearer {self.access_token}'}

            if sync_token:
                url = sync_token  # Delta link is the full URL
            else:
                url = f"{self.GRAPH_URL}/me/contacts/delta"
                url += "?$select=givenName,surname,displayName,emailAddresses,mobilePhone,homePhones,businessPhones,birthday,companyName,jobTitle,homeAddress,businessAddress"

            if page_token:
                url = page_token

            contacts = []
            async with session.get(url, headers=headers) as response:
                data = await response.json()

                for item in data.get('value', []):
                    if '@removed' in item:
                        # Handle deleted contacts
                        contacts.append(Contact(
                            id=item['id'],
                            display_name='DELETED',
                            emails=[],
                            phones=[],
                            addresses=[],
                            is_deleted=True
                        ))
                    else:
                        contacts.append(self._parse_contact(item))

                next_page = data.get('@odata.nextLink')
                delta_link = data.get('@odata.deltaLink')

            return contacts, delta_link, next_page

    async def create_contact(self, contact: Contact) -> str:
        """Create contact in Outlook."""
        async with aiohttp.ClientSession() as session:
            headers = {
                'Authorization': f'Bearer {self.access_token}',
                'Content-Type': 'application/json'
            }
            body = self._to_outlook_contact(contact)

            async with session.post(
                f"{self.GRAPH_URL}/me/contacts",
                headers=headers,
                json=body
            ) as response:
                data = await response.json()
                return data['id']

    async def update_contact(self, contact_id: str, contact: Contact) -> bool:
        """Update contact in Outlook."""
        async with aiohttp.ClientSession() as session:
            headers = {
                'Authorization': f'Bearer {self.access_token}',
                'Content-Type': 'application/json'
            }
            body = self._to_outlook_contact(contact)

            async with session.patch(
                f"{self.GRAPH_URL}/me/contacts/{contact_id}",
                headers=headers,
                json=body
            ) as response:
                return response.status == 200

    def _parse_contact(self, item: dict) -> Contact:
        """Parse Outlook contact to Contact."""
        emails = [
            {
                'type': e.get('name', 'other'),
                'value': e.get('address'),
                'primary': idx == 0
            }
            for idx, e in enumerate(item.get('emailAddresses', []))
        ]

        phones = []
        if item.get('mobilePhone'):
            phones.append({'type': 'mobile', 'value': item['mobilePhone'], 'primary': True})
        for hp in item.get('homePhones', []):
            phones.append({'type': 'home', 'value': hp, 'primary': len(phones) == 0})
        for bp in item.get('businessPhones', []):
            phones.append({'type': 'work', 'value': bp, 'primary': len(phones) == 0})

        addresses = []
        for addr_type in ['homeAddress', 'businessAddress']:
            addr = item.get(addr_type)
            if addr:
                addresses.append({
                    'type': 'home' if addr_type == 'homeAddress' else 'work',
                    'street': addr.get('street'),
                    'city': addr.get('city'),
                    'region': addr.get('state'),
                    'postal_code': addr.get('postalCode'),
                    'country': addr.get('countryOrRegion')
                })

        return Contact(
            id=item['id'],
            display_name=item.get('displayName', 'Unknown'),
            first_name=item.get('givenName'),
            last_name=item.get('surname'),
            emails=emails,
            phones=phones,
            addresses=addresses,
            birthday=item.get('birthday'),
            organization=item.get('companyName'),
            job_title=item.get('jobTitle'),
            etag=item.get('@odata.etag')
        )

    def _to_outlook_contact(self, contact: Contact) -> dict:
        """Convert Contact to Outlook format."""
        body = {
            'givenName': contact.first_name,
            'surname': contact.last_name,
            'displayName': contact.display_name,
            'emailAddresses': [
                {'address': e['value'], 'name': e.get('type', 'email')}
                for e in contact.emails
            ]
        }

        # Phones
        for phone in contact.phones:
            if phone.get('type') == 'mobile':
                body['mobilePhone'] = phone['value']
            elif phone.get('type') == 'home':
                body.setdefault('homePhones', []).append(phone['value'])
            elif phone.get('type') == 'work':
                body.setdefault('businessPhones', []).append(phone['value'])

        if contact.birthday:
            body['birthday'] = contact.birthday

        if contact.organization:
            body['companyName'] = contact.organization

        if contact.job_title:
            body['jobTitle'] = contact.job_title

        return body
```

### Contact Matcher (Auto-link to Family Members)
```python
# backend/services/contacts_sync/matcher.py
from typing import Optional, List, Tuple
from difflib import SequenceMatcher

class ContactMatcher:
    """Matches external contacts to Family Hub members."""

    def __init__(self, db: AsyncSession, tenant_id: UUID):
        self.db = db
        self.tenant_id = tenant_id

    async def find_matching_family_member(
        self,
        contact: Contact
    ) -> Tuple[Optional[UUID], float, str]:
        """
        Find best matching family member for a contact.
        Returns (family_member_id, confidence, match_reason).
        """
        family_members = await get_family_members(self.db, self.tenant_id)

        best_match = None
        best_score = 0
        match_reason = ""

        for member in family_members:
            score, reason = self._calculate_match_score(contact, member)
            if score > best_score:
                best_score = score
                best_match = member.id
                match_reason = reason

        # Only return if confidence > 0.7
        if best_score >= 0.7:
            return best_match, best_score, match_reason

        return None, 0, ""

    def _calculate_match_score(
        self,
        contact: Contact,
        member: FamilyMember
    ) -> Tuple[float, str]:
        """Calculate match score between contact and family member."""
        scores = []
        reasons = []

        # Email match (highest confidence)
        contact_emails = {e['value'].lower() for e in contact.emails if e.get('value')}
        member_email = member.email.lower() if member.email else None

        if member_email and member_email in contact_emails:
            return 1.0, "email_exact"

        # Phone match (high confidence)
        contact_phones = {self._normalize_phone(p['value']) for p in contact.phones if p.get('value')}
        member_phone = self._normalize_phone(member.phone) if member.phone else None

        if member_phone and member_phone in contact_phones:
            return 0.95, "phone_exact"

        # Name match
        name_score = self._name_similarity(contact, member)
        if name_score > 0:
            scores.append(name_score)
            reasons.append(f"name_similarity_{name_score:.0%}")

        if not scores:
            return 0, ""

        return max(scores), reasons[scores.index(max(scores))]

    def _name_similarity(self, contact: Contact, member: FamilyMember) -> float:
        """Calculate name similarity score."""
        contact_name = contact.display_name.lower()
        member_name = member.name.lower()

        # Exact match
        if contact_name == member_name:
            return 0.9

        # First name match
        if contact.first_name and contact.first_name.lower() == member_name.split()[0]:
            return 0.8

        # Fuzzy match
        ratio = SequenceMatcher(None, contact_name, member_name).ratio()
        if ratio > 0.8:
            return ratio * 0.85

        return 0

    def _normalize_phone(self, phone: str) -> str:
        """Normalize phone number for comparison."""
        if not phone:
            return ""
        # Strip everything except digits
        digits = ''.join(c for c in phone if c.isdigit())
        # Keep last 10 digits for comparison
        return digits[-10:] if len(digits) >= 10 else digits
```

### Sync Engine
```python
# backend/services/contacts_sync/engine.py
from datetime import datetime
from typing import List
import asyncio

class ContactsSyncEngine:
    """Orchestrates contacts synchronization."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.matcher = None

    async def sync_contacts(self, provider_id: UUID) -> SyncResult:
        """
        Perform bidirectional sync for contacts.

        Flow:
        1. Fetch remote changes since last sync
        2. Match new contacts to family members
        3. Detect conflicts for existing contacts
        4. Apply remote changes locally
        5. Push family member changes to remote
        6. Update sync state
        """
        provider = await get_contact_provider(self.db, provider_id)
        sync_provider = self._get_provider(provider)
        sync_state = await get_contact_sync_state(self.db, provider_id)
        self.matcher = ContactMatcher(self.db, provider.tenant_id)

        result = SyncResult()

        # 1. Fetch remote changes
        page_token = None
        all_contacts = []
        new_sync_token = None

        while True:
            contacts, new_sync_token, page_token = await sync_provider.fetch_contacts(
                sync_token=sync_state.sync_token if sync_state else None,
                page_token=page_token
            )
            all_contacts.extend(contacts)
            if not page_token:
                break

        # 2. Process each contact
        for remote_contact in all_contacts:
            existing = await get_external_contact_by_provider_id(
                self.db, provider_id, remote_contact.id
            )

            if existing:
                if getattr(remote_contact, 'is_deleted', False):
                    # Handle deletion
                    await mark_contact_deleted(self.db, existing.id)
                    result.deleted += 1
                elif self._has_conflict(existing, remote_contact):
                    await self._create_conflict(provider, existing, remote_contact)
                    result.conflicts += 1
                else:
                    await self._update_local_contact(existing, remote_contact)
                    result.updated += 1
            else:
                # New contact - create locally and try to match
                local_contact = await self._create_local_contact(provider, remote_contact)

                if provider.auto_link_family:
                    member_id, confidence, reason = await self.matcher.find_matching_family_member(
                        remote_contact
                    )
                    if member_id:
                        await link_contact_to_family_member(
                            self.db, local_contact.id, member_id, 'auto_linked'
                        )

                result.created += 1

        # 3. Push family member changes to remote (if bidirectional)
        if provider.sync_direction == 'bidirectional':
            unsynced_members = await get_unsynced_family_members(
                self.db,
                provider.tenant_id,
                since=sync_state.last_sync_at if sync_state else None
            )

            for member in unsynced_members:
                external_contact = await get_contact_linked_to_member(
                    self.db, provider_id, member.id
                )

                contact_data = self._family_member_to_contact(member)

                if external_contact:
                    # Update existing
                    await sync_provider.update_contact(
                        external_contact.external_contact_id,
                        contact_data
                    )
                else:
                    # Create new
                    external_id = await sync_provider.create_contact(contact_data)
                    await create_external_contact(
                        self.db, provider_id, external_id, member.id, contact_data
                    )
                result.pushed += 1

        # 4. Update sync state
        await update_contact_sync_state(
            self.db,
            provider_id,
            sync_token=new_sync_token,
            last_sync_at=datetime.utcnow(),
            status='success'
        )

        return result

    def _family_member_to_contact(self, member: FamilyMember) -> Contact:
        """Convert FamilyMember to Contact for pushing to provider."""
        emails = []
        if member.email:
            emails.append({'type': 'home', 'value': member.email, 'primary': True})

        phones = []
        if member.phone:
            phones.append({'type': 'mobile', 'value': member.phone, 'primary': True})

        return Contact(
            id='',  # Will be set by provider
            display_name=member.name,
            first_name=member.name.split()[0] if member.name else None,
            last_name=' '.join(member.name.split()[1:]) if member.name and ' ' in member.name else None,
            emails=emails,
            phones=phones,
            addresses=[],
            birthday=member.date_of_birth.isoformat() if member.date_of_birth else None
        )
```

---

## API Endpoints

### Contact CRUD (User-Owned)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/contacts` | List current user's contacts |
| POST | `/contacts` | Create new contact |
| GET | `/contacts/{id}` | Get single contact |
| PUT | `/contacts/{id}` | Update contact |
| DELETE | `/contacts/{id}` | Delete contact |
| POST | `/contacts/{id}/publish` | Publish contact to family |
| DELETE | `/contacts/{id}/publish` | Unpublish from family |

### Family Contacts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/contacts/family` | List all published family contacts |
| GET | `/contacts/family/birthdays` | Get upcoming birthdays |

### Smart Lookup (for Event Invitations)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/contacts/lookup?q={query}` | Smart search for invitee selection |

**Smart Lookup Response:**
```json
{
  "results": [
    {
      "type": "family_user",
      "id": "user-uuid",
      "display_name": "Nicola (Mum)",
      "email": "nicola@icloud.com",
      "avatar_url": "...",
      "is_minor": false
    },
    {
      "type": "contact",
      "id": "contact-uuid",
      "display_name": "Grandma",
      "email": "grandma@email.com",
      "source": "family",  // or "personal"
      "owner_name": "James"
    },
    {
      "type": "email_suggestion",
      "email": "john@newdomain.com",
      "prompt": "Invite as guest"
    }
  ]
}
```

### Provider Connection
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/contacts/providers` | List connected contact providers |
| POST | `/contacts/providers/connect/google` | Start Google OAuth (adds People API scope) |
| GET | `/contacts/providers/connect/google/callback` | Google OAuth callback |
| POST | `/contacts/providers/connect/icloud` | Connect iCloud (uses same creds as calendar) |
| POST | `/contacts/providers/connect/outlook` | Start Microsoft OAuth (adds Contacts scope) |
| GET | `/contacts/providers/connect/outlook/callback` | Microsoft OAuth callback |

### Sync Operations
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/contacts/providers/{id}/sync` | Trigger manual sync |
| GET | `/contacts/providers/{id}/status` | Get sync status |
| GET | `/contacts/conflicts` | List pending conflicts |
| POST | `/contacts/conflicts/{id}/resolve` | Resolve conflict |

### Parental Access
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/parental/children/{id}/contacts` | View child's contacts |
| POST | `/parental/children/{id}/contacts` | Add contact for child |
| DELETE | `/parental/children/{id}/contacts/{contact_id}` | Remove child's contact |

---

## Frontend Components

### Directory Structure
```
frontend/src/features/contacts/
├── ContactsPage.tsx              # Main contacts list page
├── ContactCard.tsx               # Display single contact
├── ContactDetailDrawer.tsx       # Full contact view/edit
├── ContactForm.tsx               # Create/edit form
├── MyContactsList.tsx            # User's personal contacts
├── FamilyContactsList.tsx        # Published family contacts
├── components/
│   ├── SmartContactSearch.tsx    # Typeahead for invitee selection
│   ├── ContactAvatar.tsx
│   ├── PublishToFamilyButton.tsx
│   └── ContactSourceBadge.tsx    # Google/iCloud/Manual badge
├── sync/
│   ├── ContactsSyncSettings.tsx  # Provider connection settings
│   ├── ConnectedProvidersList.tsx
│   ├── SyncStatusBadge.tsx
│   └── ContactConflictModal.tsx
└── contacts.css
```

### Key UI Flows

#### 1. Connecting Google Contacts (with existing Calendar)
```
User has Google Calendar connected
User clicks "Sync Contacts" → "Enable for Google"
  → Shows "Use same Google account as Calendar?"
  → User confirms
  → Requests additional People API scope
  → Contacts sync enabled
  → Initial sync starts
```

#### 2. Connecting Google Contacts (standalone)
```
User clicks "Add Provider" → "Google"
  → Redirects to Google OAuth with Calendar + People API scopes
  → User grants access
  → Both Calendar and Contacts sync enabled
  → Initial sync starts
```

#### 3. Smart Contact Lookup (for Event Invitations)
```
User types in invitee field:
  ┌─────────────────────────────────────────────┐
  │  Add Invitees                               │
  │  ┌─────────────────────────────────────┐   │
  │  │ gran                                │   │
  │  └─────────────────────────────────────┘   │
  │                                             │
  │  Search results (as user types "gran"):    │
  │  ┌─────────────────────────────────────┐   │
  │  │ 👤 FAMILY MEMBERS                   │   │
  │  │    (none matching)                  │   │
  │  │                                     │   │
  │  │ 📇 YOUR CONTACTS                    │   │
  │  │    Grandma - grandma@email.com     │   │
  │  │    Grandpa - grandpa@email.com     │   │
  │  │                                     │   │
  │  │ 👨‍👩‍👧‍👦 FAMILY CONTACTS                │   │
  │  │    Gran (Nicola's) - gran@mail.com │   │
  │  │                                     │   │
  │  │ ➕ Invite "gran" as new email...    │   │
  │  └─────────────────────────────────────┘   │
  └─────────────────────────────────────────────┘

Search priority:
1. Family members (embedded users)
2. User's own contacts (synced + manual)
3. Family shared contacts (published by others)
4. Option to invite as new email/create contact
```

#### 4. Publishing Contact to Family
```
ContactDetailDrawer shows:
  ┌─────────────────────────────────────────────┐
  │  Grandma                           [Edit]   │
  │                                             │
  │  📧 grandma@email.com                       │
  │  📱 07700 123456                            │
  │  🎂 March 15                                │
  │                                             │
  │  Source: Google Contacts [synced]          │
  │                                             │
  │  ┌─────────────────────────────────────┐   │
  │  │ 👨‍👩‍👧‍👦 Share with Family               │   │
  │  │                                     │   │
  │  │ [Publish to Family]                │   │
  │  │                                     │   │
  │  │ When published, all family members │   │
  │  │ can see this contact and use it    │   │
  │  │ for event invitations.             │   │
  │  └─────────────────────────────────────┘   │
  └─────────────────────────────────────────────┘

After publishing:
  ┌─────────────────────────────────────────────┐
  │  ✓ Published to Family                      │
  │    Shared by: James                         │
  │    [Unpublish]                              │
  └─────────────────────────────────────────────┘
```

#### 5. My Contacts vs Family Contacts View
```
ContactsPage with tabs:
  ┌─────────────────────────────────────────────┐
  │  Contacts                      [+ Add New]  │
  │                                             │
  │  [My Contacts] [Family Contacts]            │
  │  ─────────────                              │
  │                                             │
  │  My Contacts (showing personal):            │
  │  ┌─────────────────────────────────────┐   │
  │  │ Grandma          [Google] [Family]  │   │
  │  │ grandma@email.com                   │   │
  │  ├─────────────────────────────────────┤   │
  │  │ Work - Bob       [Google]           │   │
  │  │ bob@company.com                     │   │
  │  ├─────────────────────────────────────┤   │
  │  │ Dentist          [Manual]           │   │
  │  │ 0113 123 4567                       │   │
  │  └─────────────────────────────────────┘   │
  │                                             │
  │  Filter: [All] [Google] [iCloud] [Manual]  │
  └─────────────────────────────────────────────┘

Family Contacts tab:
  ┌─────────────────────────────────────────────┐
  │  Family Contacts (shared with everyone):    │
  │  ┌─────────────────────────────────────┐   │
  │  │ Grandma          Shared by: James   │   │
  │  │ grandma@email.com                   │   │
  │  ├─────────────────────────────────────┤   │
  │  │ Aunt Sarah       Shared by: Nicola  │   │
  │  │ sarah@email.com                     │   │
  │  └─────────────────────────────────────┘   │
  └─────────────────────────────────────────────┘
```

#### 6. Adding External Invitee (Prompt to Create Contact)
```
When user types a new email and selects "Invite as guest":
  ┌─────────────────────────────────────────────┐
  │  Add to Contacts?                           │
  │                                             │
  │  You're inviting: john@example.com          │
  │                                             │
  │  Would you like to save this as a contact? │
  │                                             │
  │  Name: [John                           ]   │
  │                                             │
  │  [Skip - Just Invite] [Save & Invite]      │
  │                                             │
  │  ☐ Also publish to Family Contacts         │
  └─────────────────────────────────────────────┘
```

---

## Sync Timing

### Automatic Sync
- **Pull frequency:** Every 30 minutes via background task
- **Push frequency:** Immediately when family member updated
- **Full sync:** Daily at 4 AM

### Background Worker
```python
# backend/workers/contacts_sync_worker.py
from celery import Celery
from celery.schedules import crontab

@app.task
def sync_all_contacts():
    """Sync all active contact providers."""
    providers = get_active_contact_providers()
    for provider in providers:
        sync_contacts.delay(provider.id)

@app.task
def sync_contacts(provider_id: UUID):
    """Sync single provider."""
    engine = ContactsSyncEngine(db)
    result = await engine.sync_contacts(provider_id)
    log.info(f"Synced contacts {provider_id}: {result}")

# Schedule
app.conf.beat_schedule = {
    'sync-contacts-every-30-minutes': {
        'task': 'sync_all_contacts',
        'schedule': crontab(minute='*/30'),
    },
}
```

---

## Implementation Phases

### Phase 2.3a: Core Contacts (User-Owned)
1. Contacts database table with user ownership
2. Contact CRUD API endpoints
3. ContactsPage with My Contacts / Family Contacts tabs
4. Contact create/edit form
5. "Publish to Family" functionality

### Phase 2.3b: Smart Contact Lookup
1. `/contacts/lookup` API endpoint
2. SmartContactSearch component (typeahead)
3. Search across family users, personal contacts, family contacts
4. "Invite as guest" option with prompt to save contact
5. Integration with CreateEventModal

### Phase 2.3c: Google Contacts Sync (jamesbrownyork8@gmail.com)
1. Add People API scope to Google OAuth
2. Implement GoogleContactsSync provider
3. Initial pull sync into user's personal contacts
4. Bidirectional sync with conflict detection

### Phase 2.3d: iCloud Contacts Sync
1. CardDAV integration (same credentials as calendar)
2. vCard parsing
3. Full sync implementation

### Phase 2.3e: Outlook Contacts Sync
1. Add Contacts.ReadWrite scope to Microsoft OAuth
2. Graph API provider
3. Delta query for incremental sync

### Phase 2.3f: Parental Controls for Contacts
1. Parents can view children's contacts
2. Parents can manage contacts for minors
3. Contact visibility rules based on parental_controls table

---

## OAuth Scope Summary

### Google
```
# Calendar only
https://www.googleapis.com/auth/calendar

# Calendar + Contacts (combined)
https://www.googleapis.com/auth/calendar
https://www.googleapis.com/auth/contacts
https://www.googleapis.com/auth/contacts.other.readonly
```

### Microsoft/Outlook
```
# Calendar only
Calendars.ReadWrite

# Calendar + Contacts (combined)
Calendars.ReadWrite
Contacts.ReadWrite
```

### iCloud
- Same Apple ID + App Password for both CalDAV and CardDAV
- No separate OAuth, credentials shared

---

## Security Considerations

1. **Shared Credentials:** Reuse OAuth tokens when possible, request minimal additional scopes
2. **Token Encryption:** All tokens encrypted with Fernet (same as calendar)
3. **Contact Privacy:** Only sync contacts user explicitly enables
4. **PII Handling:** Contact data is PII - ensure proper encryption at rest
5. **Audit:** Log all sync operations and linking actions

---

**Document Version:** 2.0
**Last Updated:** December 27, 2025
**Owner:** James Brown
