"""
Outlook Calendar Client - Microsoft Graph API integration for Family Hub

Uses OAuth 2.0 to connect user's Outlook/Microsoft 365 calendar.
"""

import os
import json
import httpx
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from shared.models import UserExternalCalendar, CalendarEvent


# Microsoft Graph OAuth endpoints
MS_AUTH_ENDPOINT = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize"
MS_TOKEN_ENDPOINT = "https://login.microsoftonline.com/common/oauth2/v2.0/token"
MS_GRAPH_ENDPOINT = "https://graph.microsoft.com/v1.0"

# Scopes for calendar access (ReadWrite for 2-way sync)
SCOPES = ["offline_access", "Calendars.ReadWrite", "User.Read"]


class OutlookCalendarClient:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.client_id = os.getenv("MS_CLIENT_ID")
        self.client_secret = os.getenv("MS_CLIENT_SECRET")
        # Use API_BASE_URL for redirect, similar to Google
        base_url = os.getenv("API_BASE_URL", "http://localhost:8000")
        self.redirect_uri = f"{base_url}/api/v1/calendar/auth/outlook/callback"

    def get_auth_url(self, user_id: str, tenant_id: str) -> str:
        """Generate the Microsoft OAuth2 consent URL."""
        # Pass user_id and tenant_id in state so we know who to link on callback
        state = json.dumps({"user_id": str(user_id), "tenant_id": str(tenant_id)})

        params = {
            "client_id": self.client_id,
            "response_type": "code",
            "redirect_uri": self.redirect_uri,
            "scope": " ".join(SCOPES),
            "response_mode": "query",
            "state": state,
            "prompt": "consent"  # Force consent to ensure we get refresh_token
        }

        return f"{MS_AUTH_ENDPOINT}?{urlencode(params)}"

    async def handle_callback(self, code: str, state: str):
        """Exchange authorization code for tokens and save to DB."""
        # Parse state
        state_data = json.loads(state)
        user_id = state_data["user_id"]
        tenant_id = state_data["tenant_id"]

        # Exchange code for tokens
        token_data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "code": code,
            "redirect_uri": self.redirect_uri,
            "grant_type": "authorization_code",
            "scope": " ".join(SCOPES)
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(MS_TOKEN_ENDPOINT, data=token_data)
            if response.status_code != 200:
                raise Exception(f"Token exchange failed: {response.text}")

            tokens = response.json()

        access_token = tokens["access_token"]
        refresh_token = tokens.get("refresh_token")
        expires_in = tokens.get("expires_in", 3600)
        expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)

        # Get user info to display account name
        async with httpx.AsyncClient() as client:
            headers = {"Authorization": f"Bearer {access_token}"}
            user_response = await client.get(f"{MS_GRAPH_ENDPOINT}/me", headers=headers)
            if user_response.status_code == 200:
                user_info = user_response.json()
                calendar_name = user_info.get("displayName", "Outlook Calendar")
                email = user_info.get("mail") or user_info.get("userPrincipalName", "")
            else:
                calendar_name = "Outlook Calendar"
                email = ""

        # Save to UserExternalCalendar
        stmt = select(UserExternalCalendar).where(
            UserExternalCalendar.user_id == user_id,
            UserExternalCalendar.provider == 'outlook'
        )
        result = await self.db.execute(stmt)
        existing = result.scalar_one_or_none()

        if existing:
            calendar_link = existing
            calendar_link.access_token_encrypted = access_token
            if refresh_token:
                calendar_link.refresh_token_encrypted = refresh_token
            calendar_link.token_expires_at = expires_at
            calendar_link.calendar_name = f"{calendar_name} ({email})" if email else calendar_name
        else:
            calendar_link = UserExternalCalendar(
                user_id=user_id,
                tenant_id=tenant_id,
                provider='outlook',
                provider_calendar_id='primary',
                calendar_name=f"{calendar_name} ({email})" if email else calendar_name,
                access_token_encrypted=access_token,
                refresh_token_encrypted=refresh_token,
                token_expires_at=expires_at,
                is_active=True,
                calendar_color='#0078D4'  # Microsoft blue
            )
            self.db.add(calendar_link)

        await self.db.commit()
        return calendar_link

    async def _get_valid_token(self, user_id: str) -> str | None:
        """Get a valid access token, refreshing if necessary."""
        stmt = select(UserExternalCalendar).where(
            UserExternalCalendar.user_id == user_id,
            UserExternalCalendar.provider == 'outlook',
            UserExternalCalendar.is_active == True
        )
        result = await self.db.execute(stmt)
        calendar_link = result.scalar_one_or_none()

        if not calendar_link:
            return None

        # Check if token is expired or about to expire (5 min buffer)
        if calendar_link.token_expires_at and calendar_link.token_expires_at > datetime.now(timezone.utc) + timedelta(minutes=5):
            return calendar_link.access_token_encrypted

        # Token expired, try to refresh
        if not calendar_link.refresh_token_encrypted:
            print(f"No refresh token for Outlook calendar, user {user_id}")
            return None

        try:
            token_data = {
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "refresh_token": calendar_link.refresh_token_encrypted,
                "grant_type": "refresh_token",
                "scope": " ".join(SCOPES)
            }

            async with httpx.AsyncClient() as client:
                response = await client.post(MS_TOKEN_ENDPOINT, data=token_data)
                if response.status_code != 200:
                    print(f"Failed to refresh Outlook token: {response.text}")
                    calendar_link.last_error = f"Token refresh failed: {response.status_code}"
                    await self.db.commit()
                    return None

                tokens = response.json()

            # Update tokens
            calendar_link.access_token_encrypted = tokens["access_token"]
            if tokens.get("refresh_token"):
                calendar_link.refresh_token_encrypted = tokens["refresh_token"]
            expires_in = tokens.get("expires_in", 3600)
            calendar_link.token_expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
            calendar_link.last_error = None
            await self.db.commit()

            return calendar_link.access_token_encrypted

        except Exception as e:
            print(f"Error refreshing Outlook token: {e}")
            calendar_link.last_error = str(e)
            await self.db.commit()
            return None

    async def sync_events(self, user_id: str) -> int:
        """Sync events from Outlook Calendar to Family Hub."""
        token = await self._get_valid_token(user_id)
        if not token:
            print(f"No valid Outlook token for user {user_id}")
            return 0

        # Get calendar link for metadata
        stmt = select(UserExternalCalendar).where(
            UserExternalCalendar.user_id == user_id,
            UserExternalCalendar.provider == 'outlook',
            UserExternalCalendar.is_active == True
        )
        result = await self.db.execute(stmt)
        calendar_link = result.scalar_one_or_none()

        if not calendar_link:
            return 0

        # Fetch events from Microsoft Graph
        # Use calendarView for expanded recurring events
        now = datetime.now(timezone.utc)
        # Microsoft Graph expects ISO 8601 format without microseconds, with Z suffix
        start_time = now.strftime('%Y-%m-%dT%H:%M:%SZ')
        end_time = (now + timedelta(days=365)).strftime('%Y-%m-%dT%H:%M:%SZ')  # 1 year ahead

        headers = {"Authorization": f"Bearer {token}"}
        params = {
            "startDateTime": start_time,
            "endDateTime": end_time,
            "$top": 500,
            "$orderby": "start/dateTime",
            "$select": "id,subject,body,start,end,location,isAllDay,recurrence"
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{MS_GRAPH_ENDPOINT}/me/calendarView",
                    headers=headers,
                    params=params
                )

                if response.status_code != 200:
                    print(f"Failed to fetch Outlook events: {response.text}")
                    calendar_link.last_error = f"Sync failed: {response.status_code}"
                    await self.db.commit()
                    return 0

                data = response.json()
                events = data.get("value", [])

            print(f"Found {len(events)} Outlook events for user {user_id}")

            # Upsert events
            for event in events:
                await self._upsert_event(event, calendar_link)

            # Update sync timestamp
            calendar_link.last_sync_at = datetime.now(timezone.utc)
            calendar_link.last_error = None
            await self.db.commit()

            return len(events)

        except Exception as e:
            print(f"Error syncing Outlook events: {e}")
            calendar_link.last_error = str(e)
            await self.db.commit()
            return 0

    async def _upsert_event(self, outlook_event: dict, calendar_link: UserExternalCalendar):
        """Insert or update a single event from Outlook."""
        event_id = outlook_event["id"]
        subject = outlook_event.get("subject", "No Title")
        body = outlook_event.get("body", {}).get("content", "")
        location = outlook_event.get("location", {}).get("displayName", "")
        is_all_day = outlook_event.get("isAllDay", False)

        start = outlook_event.get("start", {})
        end = outlook_event.get("end", {})

        # Parse dates - Outlook returns dateTime and timeZone
        if is_all_day:
            # All day events have date only
            start_time = datetime.fromisoformat(start.get("dateTime", "").split("T")[0])
            end_time = datetime.fromisoformat(end.get("dateTime", "").split("T")[0])
        else:
            start_dt = start.get("dateTime", "")
            end_dt = end.get("dateTime", "")
            # Remove timezone suffix if present and parse
            start_time = datetime.fromisoformat(start_dt.replace("Z", "+00:00") if "Z" in start_dt else start_dt)
            end_time = datetime.fromisoformat(end_dt.replace("Z", "+00:00") if "Z" in end_dt else end_dt)

        # Check if event exists
        stmt = select(CalendarEvent).where(
            CalendarEvent.external_event_id == event_id,
            CalendarEvent.external_calendar_id == 'outlook_primary'
        )
        result = await self.db.execute(stmt)
        existing_event = result.scalar_one_or_none()

        if existing_event:
            # Update
            existing_event.title = subject
            existing_event.description = body[:5000] if body else ""  # Truncate HTML body
            existing_event.location = location
            existing_event.start_time = start_time
            existing_event.end_time = end_time
            existing_event.all_day = is_all_day
            existing_event.updated_at = datetime.now(timezone.utc)
        else:
            # Create
            new_event = CalendarEvent(
                tenant_id=calendar_link.tenant_id,
                user_id=calendar_link.user_id,
                title=subject,
                description=body[:5000] if body else "",
                location=location,
                start_time=start_time,
                end_time=end_time,
                all_day=is_all_day,
                external_calendar_id='outlook_primary',
                external_event_id=event_id,
                is_family_hub_event=False,
                color=calendar_link.calendar_color or '#0078D4'
            )
            self.db.add(new_event)

    async def create_outlook_event(self, user_id: str, event_data: dict) -> str | None:
        """
        Create an event on Outlook Calendar via Microsoft Graph API.
        Returns the Outlook Event ID.
        """
        token = await self._get_valid_token(user_id)
        if not token:
            print(f"No valid Outlook token for user {user_id}")
            return None

        # Build Microsoft Graph event resource
        outlook_event = {
            'subject': event_data['title'],
            'body': {
                'contentType': 'text',
                'content': event_data.get('description', '')
            },
            'location': {
                'displayName': event_data.get('location', '')
            }
        }

        # Handle dates - Microsoft Graph expects ISO 8601 with timezone
        if event_data.get('all_day'):
            # All day events use date only
            start_date = event_data['start_time'][:10]  # YYYY-MM-DD
            end_date = event_data['end_time'][:10] if event_data.get('end_time') else start_date
            outlook_event['isAllDay'] = True
            outlook_event['start'] = {
                'dateTime': f"{start_date}T00:00:00",
                'timeZone': 'Europe/London'
            }
            outlook_event['end'] = {
                'dateTime': f"{end_date}T00:00:00",
                'timeZone': 'Europe/London'
            }
        else:
            # Timed events - ensure proper format
            start_time = event_data['start_time']
            end_time = event_data.get('end_time') or start_time

            # Remove Z suffix if present, Graph API uses timeZone field
            start_time = start_time.replace('Z', '').replace('+00:00', '')
            end_time = end_time.replace('Z', '').replace('+00:00', '')

            outlook_event['start'] = {
                'dateTime': start_time,
                'timeZone': 'Europe/London'
            }
            outlook_event['end'] = {
                'dateTime': end_time,
                'timeZone': 'Europe/London'
            }

        # Handle recurrence if provided
        if event_data.get('recurrence_rule'):
            # Convert RRULE to Microsoft Graph recurrence pattern
            # This is a simplified conversion - full RRULE parsing would be more complex
            rrule = event_data['recurrence_rule']
            if 'FREQ=DAILY' in rrule:
                outlook_event['recurrence'] = {
                    'pattern': {'type': 'daily', 'interval': 1},
                    'range': {'type': 'noEnd'}
                }
            elif 'FREQ=WEEKLY' in rrule:
                outlook_event['recurrence'] = {
                    'pattern': {'type': 'weekly', 'interval': 1, 'daysOfWeek': ['monday']},
                    'range': {'type': 'noEnd'}
                }
            elif 'FREQ=MONTHLY' in rrule:
                outlook_event['recurrence'] = {
                    'pattern': {'type': 'absoluteMonthly', 'interval': 1, 'dayOfMonth': 1},
                    'range': {'type': 'noEnd'}
                }

        try:
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{MS_GRAPH_ENDPOINT}/me/events",
                    headers=headers,
                    json=outlook_event
                )

                if response.status_code not in [200, 201]:
                    print(f"Failed to create Outlook event: {response.status_code} - {response.text}")
                    return None

                created_event = response.json()
                return created_event.get('id')

        except Exception as e:
            print(f"Error creating Outlook event: {e}")
            return None

    async def update_outlook_event(self, user_id: str, external_event_id: str, event_data: dict):
        """Update an existing Outlook Calendar event via Microsoft Graph API."""
        token = await self._get_valid_token(user_id)
        if not token:
            print(f"No valid Outlook token for user {user_id}")
            return

        # Build update payload (same structure as create)
        outlook_event = {
            'subject': event_data['title'],
            'body': {
                'contentType': 'text',
                'content': event_data.get('description', '')
            },
            'location': {
                'displayName': event_data.get('location', '')
            }
        }

        # Handle dates
        if event_data.get('all_day'):
            start_date = event_data['start_time'][:10]
            end_date = event_data['end_time'][:10] if event_data.get('end_time') else start_date
            outlook_event['isAllDay'] = True
            outlook_event['start'] = {
                'dateTime': f"{start_date}T00:00:00",
                'timeZone': 'Europe/London'
            }
            outlook_event['end'] = {
                'dateTime': f"{end_date}T00:00:00",
                'timeZone': 'Europe/London'
            }
        else:
            start_time = event_data['start_time'].replace('Z', '').replace('+00:00', '')
            end_time = (event_data.get('end_time') or event_data['start_time']).replace('Z', '').replace('+00:00', '')

            outlook_event['start'] = {
                'dateTime': start_time,
                'timeZone': 'Europe/London'
            }
            outlook_event['end'] = {
                'dateTime': end_time,
                'timeZone': 'Europe/London'
            }

        try:
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }

            async with httpx.AsyncClient() as client:
                response = await client.patch(
                    f"{MS_GRAPH_ENDPOINT}/me/events/{external_event_id}",
                    headers=headers,
                    json=outlook_event
                )

                if response.status_code not in [200, 204]:
                    print(f"Failed to update Outlook event: {response.status_code} - {response.text}")

        except Exception as e:
            print(f"Error updating Outlook event: {e}")

    async def delete_outlook_event(self, user_id: str, external_event_id: str):
        """Delete an event from Outlook Calendar via Microsoft Graph API."""
        token = await self._get_valid_token(user_id)
        if not token:
            print(f"No valid Outlook token for user {user_id}")
            return

        try:
            headers = {"Authorization": f"Bearer {token}"}

            async with httpx.AsyncClient() as client:
                response = await client.delete(
                    f"{MS_GRAPH_ENDPOINT}/me/events/{external_event_id}",
                    headers=headers
                )

                # 204 No Content = success, 404 = already deleted (fine)
                if response.status_code not in [204, 404, 410]:
                    print(f"Failed to delete Outlook event: {response.status_code} - {response.text}")

        except Exception as e:
            print(f"Error deleting Outlook event: {e}")
