"""
Brown Family - Realistic Database Seeding Script
Location: backend/scripts/seed_data.py

Run this to populate database with Brown family data:
docker-compose exec backend python scripts/seed_data.py
"""

import asyncio
import sys
from pathlib import Path
from datetime import datetime, timedelta, time
from uuid import UUID

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import AsyncSession
from shared.database import AsyncSessionLocal, engine, Base
from shared.models import Tenant, User, CalendarEvent

# Fixed UUIDs for Brown Family - MUST MATCH FRONTEND
TENANT_ID = UUID('10000000-0000-0000-0000-000000000000')  # CORRECTED
USER_JAMES_ID = UUID('10000000-0000-0000-0000-000000000001')
USER_NICOLA_ID = UUID('10000000-0000-0000-0000-000000000002')
USER_TOMMY_ID = UUID('10000000-0000-0000-0000-000000000003')
USER_HARRY_ID = UUID('10000000-0000-0000-0000-000000000004')

# Family color scheme
COLOR_JAMES = "#e30613"    # Liverpool red
COLOR_NICOLA = "#fb7185"   # Pink
COLOR_TOMMY = "#00B140"    # Liverpool 3rd kit green
COLOR_HARRY = "#1D428A"    # Leeds blue
COLOR_FAMILY = "#ffffff"   # White for family events

async def seed_database():
    """Seed the database with Brown family data"""
    
    async with AsyncSessionLocal() as session:
        try:
            print("🌱 Starting database seeding for Brown Family...")
            
            # Check if tenant already exists
            existing_tenant = await session.get(Tenant, TENANT_ID)
            if existing_tenant:
                print("⚠️  Brown family tenant already exists. Skipping seed.")
                print("   Run with --clear flag to reset: python scripts/seed_data.py --clear")
                return
            
            # Create tenant
            print("\n📋 Creating tenant...")
            tenant = Tenant(
                id=TENANT_ID,
                name="Brown Family",
                slug="brown-family",
                subscription_tier="free",
                settings={
                    "location": "Rothwell, Leeds",
                    "timezone": "Europe/London"
                }
            )
            session.add(tenant)
            await session.flush()
            print(f"✅ Created tenant: {tenant.name} (ID: {TENANT_ID})")
            
            # Create users
            print("\n👥 Creating family members...")
            users = [
                User(
                    id=USER_JAMES_ID,
                    tenant_id=TENANT_ID,
                    name="James",
                    email="bigtuff8@yahoo.com",
                    role="admin",
                    date_of_birth=datetime(1982, 3, 10).date(),
                    avatar_url=None,  # Will use initials
                    settings={"color": COLOR_JAMES}
                ),
                User(
                    id=USER_NICOLA_ID,
                    tenant_id=TENANT_ID,
                    name="Nicola",
                    email="nicolabrown80@icloud.com",
                    role="admin",
                    date_of_birth=datetime(1980, 10, 25).date(),
                    avatar_url=None,
                    settings={"color": COLOR_NICOLA}
                ),
                User(
                    id=USER_TOMMY_ID,
                    tenant_id=TENANT_ID,
                    name="Tommy",
                    email="thomas.j.brown11@icloud.com",
                    role="child",
                    date_of_birth=datetime(2012, 5, 4).date(),
                    avatar_url=None,
                    settings={"color": COLOR_TOMMY}
                ),
                User(
                    id=USER_HARRY_ID,
                    tenant_id=TENANT_ID,
                    name="Harry",
                    email="Harry.m.brown@icloud.com",  # CORRECTED - capital H
                    role="child",
                    date_of_birth=datetime(2018, 10, 23).date(),
                    avatar_url=None,
                    settings={"color": COLOR_HARRY}
                )
            ]
            
            for user in users:
                session.add(user)
                age = (datetime.now().date() - user.date_of_birth).days // 365
                print(f"✅ {user.name} (age {age}, {user.role}) - {user.email}")
            
            await session.flush()
            
            # Create calendar events
            print("\n📅 Creating calendar events...")
            
            # Helper function to get next occurrence of a weekday
            def next_weekday(weekday, start_date=None, weeks_ahead=0):
                """Get next occurrence of weekday (0=Monday, 6=Sunday)"""
                if start_date is None:
                    start_date = datetime.now().date()
                days_ahead = weekday - start_date.weekday()
                if days_ahead <= 0:
                    days_ahead += 7
                return start_date + timedelta(days=days_ahead + (weeks_ahead * 7))
            
            today = datetime.now().date()
            events = []
            
            # === RECURRING WEEKLY ACTIVITIES ===
            
            # MONDAY: Harry - Rothwell Juniors U7 Reds
            next_mon = next_weekday(0)  # Monday
            events.append(CalendarEvent(
                tenant_id=TENANT_ID,
                user_id=USER_HARRY_ID,
                title="⚽ Rothwell Juniors U7 Reds",
                description="Football training",
                location="Rothwell Juniors Football Club, 4G Astroturf",
                start_time=datetime.combine(next_mon, time(17, 30)),
                end_time=datetime.combine(next_mon, time(18, 30)),
                color=COLOR_HARRY,
                recurrence_rule="FREQ=WEEKLY;BYDAY=MO"
            ))
            
            # TUESDAY: Tommy - GT Sports Football
            next_tue = next_weekday(1)  # Tuesday
            events.append(CalendarEvent(
                tenant_id=TENANT_ID,
                user_id=USER_TOMMY_ID,
                title="⚽ GT Sports Football",
                description="Tuesday training session\nOrganised on 360Player",
                location="Springwell South, Bellisle Road, LS10 3JA, 4G Astroturf",
                start_time=datetime.combine(next_tue, time(19, 0)),
                end_time=datetime.combine(next_tue, time(20, 0)),
                color=COLOR_TOMMY,
                recurrence_rule="FREQ=WEEKLY;BYDAY=TU"
            ))
            
            # THURSDAY: Tommy - GT Sports Football
            next_thu = next_weekday(3)  # Thursday
            events.append(CalendarEvent(
                tenant_id=TENANT_ID,
                user_id=USER_TOMMY_ID,
                title="⚽ GT Sports Football",
                description="Thursday training session\nOrganised on 360Player",
                location="Castleford Academy, WF10 4JQ, 4G Astroturf",
                start_time=datetime.combine(next_thu, time(19, 0)),
                end_time=datetime.combine(next_thu, time(20, 30)),
                color=COLOR_TOMMY,
                recurrence_rule="FREQ=WEEKLY;BYDAY=TH"
            ))
            
            # FRIDAY: Tommy - Rothwell Juniors U14 Blacks
            next_fri = next_weekday(4)  # Friday
            events.append(CalendarEvent(
                tenant_id=TENANT_ID,
                user_id=USER_TOMMY_ID,
                title="⚽ Rothwell Juniors U14 Blacks",
                description="Friday training\nOrganised on Stack Team App",
                location="Rothwell Juniors Football Club, 4G Astroturf",
                start_time=datetime.combine(next_fri, time(18, 30)),
                end_time=datetime.combine(next_fri, time(19, 30)),
                color=COLOR_TOMMY,
                recurrence_rule="FREQ=WEEKLY;BYDAY=FR"
            ))
            
            # SUNDAY: Tommy - Macc Academy Cricket (until Christmas)
            next_sun = next_weekday(6)  # Sunday
            events.append(CalendarEvent(
                tenant_id=TENANT_ID,
                user_id=USER_TOMMY_ID,
                title="🏏 Macc Academy Cricket",
                description="Sunday cricket training\nRuns until Christmas",
                location="Leeds Grammar School",
                start_time=datetime.combine(next_sun, time(14, 0)),
                end_time=datetime.combine(next_sun, time(16, 30)),
                color=COLOR_TOMMY,
                recurrence_rule="FREQ=WEEKLY;BYDAY=SU;UNTIL=20251225"
            ))
            
            # === SAMPLE WEEKEND MATCHES ===
            
            # Saturday: Tommy - GT Sports Match
            next_sat = next_weekday(5)  # Saturday
            events.append(CalendarEvent(
                tenant_id=TENANT_ID,
                user_id=USER_TOMMY_ID,
                title="⚽ GT Sports Match",
                description="U14 League match\nCheck 360Player for confirmed details",
                location="TBC - check 360Player",
                start_time=datetime.combine(next_sat, time(10, 0)),
                end_time=datetime.combine(next_sat, time(11, 30)),
                color=COLOR_TOMMY
            ))
            
            # Sunday: Tommy - Rothwell Blacks Match
            events.append(CalendarEvent(
                tenant_id=TENANT_ID,
                user_id=USER_TOMMY_ID,
                title="⚽ Rothwell Blacks Match",
                description="U14 League match\nCheck Stack Team App for details",
                location="TBC - check Stack",
                start_time=datetime.combine(next_sun, time(10, 30)),
                end_time=datetime.combine(next_sun, time(12, 0)),
                color=COLOR_TOMMY
            ))
            
            # === UPCOMING BIRTHDAYS ===
            
            # Harry's birthday - 23rd October
            harry_bday = datetime(2025, 10, 23).date()
            if harry_bday >= today:
                events.append(CalendarEvent(
                    tenant_id=TENANT_ID,
                    user_id=USER_HARRY_ID,
                    title="🎂 Harry's Birthday",
                    description="Harry turns 7! 🎉",
                    start_time=datetime.combine(harry_bday, time(0, 0)),
                    all_day=True,
                    color=COLOR_HARRY
                ))
            
            # Nicola's birthday - 25th October
            nicola_bday = datetime(2025, 10, 25).date()
            if nicola_bday >= today:
                events.append(CalendarEvent(
                    tenant_id=TENANT_ID,
                    user_id=USER_NICOLA_ID,
                    title="🎂 Nicola's Birthday",
                    description="Nicola's birthday! 🎉",
                    start_time=datetime.combine(nicola_bday, time(0, 0)),
                    all_day=True,
                    color=COLOR_NICOLA
                ))
            
            # Sarah's birthday - 27th October
            sarah_bday = datetime(2025, 10, 27).date()
            if sarah_bday >= today:
                events.append(CalendarEvent(
                    tenant_id=TENANT_ID,
                    title="🎂 Sarah's Birthday",
                    description="Sarah Roberts-Brown's birthday (James's sister)",
                    start_time=datetime.combine(sarah_bday, time(0, 0)),
                    all_day=True,
                    color=COLOR_FAMILY
                ))
            
            # === FAMILY EVENTS ===
            
            events.append(CalendarEvent(
                tenant_id=TENANT_ID,
                title="🛒 Grocery Shopping",
                description="Weekly food shop",
                location="Tesco/Asda",
                start_time=datetime.combine(next_sat, time(9, 0)),
                end_time=datetime.combine(next_sat, time(10, 30)),
                color=COLOR_FAMILY,
                recurrence_rule="FREQ=WEEKLY;BYDAY=SA"
            ))
            
            # Add all events
            for event in events:
                session.add(event)
            
            await session.commit()
            
            print(f"✅ Created {len(events)} calendar events")
            
            print("\n✨ Database seeding completed successfully!")
            print(f"\n📊 Summary:")
            print(f"   - 1 tenant (Brown Family)")
            print(f"   - 4 family members (James, Nicola, Tommy, Harry)")
            print(f"   - {len(events)} calendar events")
            print(f"\n🏠 Family Details:")
            print(f"   📍 Location: Rothwell, Leeds")
            print(f"   🎨 Colors: James=Red, Nicola=Pink, Tommy=Green, Harry=Blue")
            print(f"   ⚽ Tommy: 3x football training, cricket, weekend matches")
            print(f"   ⚽ Harry: 1x football training (Monday)")
            print(f"   🎂 Upcoming: Harry (23 Oct), Nicola (25 Oct), Sarah (27 Oct)")
            print("\n🎉 You can now create events via the API!")
            
        except Exception as e:
            print(f"\n❌ Error seeding database: {e}")
            import traceback
            traceback.print_exc()
            await session.rollback()
            raise

async def clear_database():
    """Clear all data from database (useful for re-seeding)"""
    print("🗑️  Clearing database...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Database cleared and tables recreated")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--clear":
        asyncio.run(clear_database())
        print("\n💡 Now run without --clear flag to seed fresh data")
    else:
        asyncio.run(seed_database())