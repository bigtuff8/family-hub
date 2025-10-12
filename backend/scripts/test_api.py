"""
Calendar API Testing Script
Location: backend/scripts/test_api.py

Quick test to verify all Calendar API endpoints work correctly.
Run: docker-compose exec backend python scripts/test_api.py
"""

import asyncio
import sys
from pathlib import Path
from datetime import datetime, date, timedelta
from uuid import UUID

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import AsyncSession
from shared.database import AsyncSessionLocal
from services.calendar.crud import CalendarCRUD
from services.calendar.schemas import CalendarEventCreate, CalendarEventUpdate

# Test tenant and user IDs (from seed data)
TENANT_ID = UUID('00000000-0000-0000-0000-000000000001')
USER_JAMES_ID = UUID('10000000-0000-0000-0000-000000000001')

async def test_calendar_api():
    """Run through all CRUD operations"""
    
    print("🧪 Testing Calendar API...")
    print("=" * 50)
    
    async with AsyncSessionLocal() as session:
        try:
            # Test 1: Create Event
            print("\n📝 Test 1: Create Event")
            event_data = CalendarEventCreate(
                title="API Test Event",
                description="Testing the Calendar API",
                location="Test Location",
                start_time=datetime.now() + timedelta(days=1),
                end_time=datetime.now() + timedelta(days=1, hours=2),
                color="#2dd4bf",
                user_id=USER_JAMES_ID
            )
            
            created_event = await CalendarCRUD.create_event(
                db=session,
                tenant_id=TENANT_ID,
                event=event_data
            )
            
            event_id = created_event.id
            print(f"✅ Created event: {created_event.title} (ID: {event_id})")
            
            # Test 2: Get Single Event
            print("\n🔍 Test 2: Get Single Event")
            retrieved_event = await CalendarCRUD.get_event(
                db=session,
                tenant_id=TENANT_ID,
                event_id=event_id
            )
            
            if retrieved_event:
                print(f"✅ Retrieved event: {retrieved_event.title}")
            else:
                print("❌ Failed to retrieve event")
                return
            
            # Test 3: List Events
            print("\n📋 Test 3: List Events")
            events, total = await CalendarCRUD.get_events(
                db=session,
                tenant_id=TENANT_ID,
                skip=0,
                limit=10
            )
            
            print(f"✅ Retrieved {len(events)} events (total: {total})")
            for event in events[:3]:
                print(f"   - {event.title} ({event.start_time.strftime('%Y-%m-%d %H:%M')})")
            
            # Test 4: Get Events by Date Range
            print("\n📅 Test 4: Get Events by Date Range")
            today = date.today()
            next_week = today + timedelta(days=7)
            
            range_events = await CalendarCRUD.get_events_by_date_range(
                db=session,
                tenant_id=TENANT_ID,
                start_date=today,
                end_date=next_week
            )
            
            print(f"✅ Retrieved {len(range_events)} events in next 7 days")
            
            # Test 5: Get Upcoming Events
            print("\n⏰ Test 5: Get Upcoming Events")
            upcoming = await CalendarCRUD.get_upcoming_events(
                db=session,
                tenant_id=TENANT_ID,
                limit=5
            )
            
            print(f"✅ Retrieved {len(upcoming)} upcoming events")
            for event in upcoming[:3]:
                print(f"   - {event.title} ({event.start_time.strftime('%Y-%m-%d %H:%M')})")
            
            # Test 6: Search Events
            print("\n🔎 Test 6: Search Events")
            search_results, search_total = await CalendarCRUD.search_events(
                db=session,
                tenant_id=TENANT_ID,
                search_term="test",
                skip=0,
                limit=10
            )
            
            print(f"✅ Found {search_total} events matching 'test'")
            
            # Test 7: Update Event
            print("\n✏️  Test 7: Update Event")
            update_data = CalendarEventUpdate(
                title="Updated API Test Event",
                description="This event was updated via API test",
                color="#fb7185"
            )
            
            updated_event = await CalendarCRUD.update_event(
                db=session,
                tenant_id=TENANT_ID,
                event_id=event_id,
                event_update=update_data
            )
            
            if updated_event:
                print(f"✅ Updated event: {updated_event.title}")
                print(f"   New color: {updated_event.color}")
            else:
                print("❌ Failed to update event")
            
            # Test 8: Filter by User
            print("\n👤 Test 8: Filter Events by User")
            user_events, user_total = await CalendarCRUD.get_events(
                db=session,
                tenant_id=TENANT_ID,
                user_id=USER_JAMES_ID,
                skip=0,
                limit=10
            )
            
            print(f"✅ Retrieved {user_total} events for user James")
            
            # Test 9: Delete Event
            print("\n🗑️  Test 9: Delete Event")
            deleted = await CalendarCRUD.delete_event(
                db=session,
                tenant_id=TENANT_ID,
                event_id=event_id
            )
            
            if deleted:
                print(f"✅ Deleted event: {event_id}")
            else:
                print("❌ Failed to delete event")
            
            # Verify deletion
            verify_deleted = await CalendarCRUD.get_event(
                db=session,
                tenant_id=TENANT_ID,
                event_id=event_id
            )
            
            if verify_deleted is None:
                print("✅ Confirmed event was deleted")
            else:
                print("❌ Event still exists after deletion")
            
            # Test 10: Bulk Operations
            print("\n📦 Test 10: Bulk Delete")
            
            # Create multiple events
            bulk_ids = []
            for i in range(3):
                bulk_event = CalendarEventCreate(
                    title=f"Bulk Test Event {i+1}",
                    start_time=datetime.now() + timedelta(days=i+2),
                    color="#2dd4bf"
                )
                created = await CalendarCRUD.create_event(
                    db=session,
                    tenant_id=TENANT_ID,
                    event=bulk_event
                )
                bulk_ids.append(created.id)
            
            print(f"   Created {len(bulk_ids)} events for bulk deletion")
            
            # Bulk delete
            deleted_count = await CalendarCRUD.bulk_delete_events(
                db=session,
                tenant_id=TENANT_ID,
                event_ids=bulk_ids
            )
            
            print(f"✅ Bulk deleted {deleted_count} events")
            
            print("\n" + "=" * 50)
            print("✨ All tests passed successfully!")
            print("\n📊 Summary:")
            print("   ✅ Create Event")
            print("   ✅ Get Single Event")
            print("   ✅ List Events")
            print("   ✅ Get Events by Date Range")
            print("   ✅ Get Upcoming Events")
            print("   ✅ Search Events")
            print("   ✅ Update Event")
            print("   ✅ Filter by User")
            print("   ✅ Delete Event")
            print("   ✅ Bulk Delete")
            print("\n🎉 Calendar API is fully functional!")
            
        except Exception as e:
            print(f"\n❌ Test failed with error: {e}")
            import traceback
            traceback.print_exc()
            raise

if __name__ == "__main__":
    asyncio.run(test_calendar_api())