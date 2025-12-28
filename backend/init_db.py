import asyncio
from shared.database import Base, engine
from shared.models import (
    # Core models
    Tenant, User, RefreshToken,
    # Calendar models
    CalendarEvent, EventAttendee, Task,
    # Shopping models
    ShoppingList, ShoppingCategory, ShoppingItem,
    # Contact models
    Contact, ContactPhone, ContactEmail,
    # Phase 2: Calendar Sync models
    UserEmailAccount, OrganizerAccount, EventInvite,
    UserExternalCalendar, ParentalControl,
    # Phase 2: Contacts Sync models
    ExternalContactProvider, ContactSyncState, ContactConflict,
)

async def init_db():
    """Initialize database tables"""
    async with engine.begin() as conn:
        # Drop all tables (be careful in production!)
        await conn.run_sync(Base.metadata.drop_all)
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
    print("Database tables created successfully!")
    print("Phase 2 tables included:")
    print("  - user_email_accounts")
    print("  - organizer_accounts")
    print("  - event_invites")
    print("  - user_external_calendars")
    print("  - parental_controls")
    print("  - external_contact_providers")
    print("  - contact_sync_states")
    print("  - contact_conflicts")
    print("  - contacts (updated with user ownership)")
    print("  - calendar_events (updated with invite system fields)")

if __name__ == "__main__":
    asyncio.run(init_db())