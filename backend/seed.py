"""
Database seeding script for Family Hub
Location: backend/seed.py

Creates:
- Brown Family tenant
- 4 family members (James, Nicola, Tommy, Harry)
- Default shopping list
- Sample calendar events

Usage: docker-compose exec backend python seed.py
"""

import asyncio
from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from decimal import Decimal

from shared.database import engine, AsyncSessionLocal
from shared.models import Tenant, User, CalendarEvent, ShoppingList, ShoppingItem
from services.auth.security import get_password_hash
from services.shopping.utils import normalize_item_name, categorize_item

# Fixed UUIDs for consistent seeding
TENANT_ID = UUID("10000000-0000-0000-0000-000000000000")
USER_IDS = {
    "james": UUID("10000000-0000-0000-0000-000000000001"),
    "nicola": UUID("10000000-0000-0000-0000-000000000002"),
    "tommy": UUID("10000000-0000-0000-0000-000000000003"),
    "harry": UUID("10000000-0000-0000-0000-000000000004"),
}

# Default password for all dev users
DEFAULT_PASSWORD = "familyhub123"


async def seed_tenant(db: AsyncSession) -> Tenant:
    """Create or get the Brown Family tenant."""
    result = await db.execute(
        select(Tenant).where(Tenant.id == TENANT_ID)
    )
    tenant = result.scalar_one_or_none()

    if tenant:
        print(f"  Tenant already exists: {tenant.name}")
        return tenant

    tenant = Tenant(
        id=TENANT_ID,
        name="Brown Family",
        slug="brown-family",
        subscription_tier="free",
        settings={}
    )
    db.add(tenant)
    await db.commit()
    await db.refresh(tenant)
    print(f"  Created tenant: {tenant.name}")
    return tenant


async def seed_users(db: AsyncSession, tenant: Tenant) -> dict[str, User]:
    """Create the Brown family members."""
    users_data = [
        {
            "id": USER_IDS["james"],
            "name": "James",
            "email": "james@brown.family",
            "role": "admin",
            "color": "#e30613",  # Liverpool red
        },
        {
            "id": USER_IDS["nicola"],
            "name": "Nicola",
            "email": "nicola@brown.family",
            "role": "parent",
            "color": "#fb7185",  # Pink
        },
        {
            "id": USER_IDS["tommy"],
            "name": "Tommy",
            "email": "tommy@brown.family",
            "role": "child",
            "color": "#00B140",  # Liverpool green
        },
        {
            "id": USER_IDS["harry"],
            "name": "Harry",
            "email": "harry@brown.family",
            "role": "child",
            "color": "#1D428A",  # Leeds blue
        },
    ]

    users = {}
    hashed_password = get_password_hash(DEFAULT_PASSWORD)

    for data in users_data:
        result = await db.execute(
            select(User).where(User.id == data["id"])
        )
        existing = result.scalar_one_or_none()

        if existing:
            print(f"  User already exists: {existing.name}")
            users[data["name"].lower()] = existing
            continue

        user = User(
            id=data["id"],
            tenant_id=tenant.id,
            name=data["name"],
            email=data["email"],
            hashed_password=hashed_password,
            role=data["role"],
            color=data["color"],
            is_active=True,
        )
        db.add(user)
        print(f"  Created user: {data['name']} ({data['email']})")
        users[data["name"].lower()] = user

    await db.commit()
    return users


async def seed_calendar_events(db: AsyncSession, tenant: Tenant, users: dict[str, User]) -> None:
    """Create sample calendar events."""
    # Check if we already have events
    result = await db.execute(
        select(CalendarEvent).where(CalendarEvent.tenant_id == tenant.id)
    )
    existing = result.scalars().first()
    if existing:
        print("  Calendar events already exist, skipping...")
        return

    now = datetime.now(timezone.utc)
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)

    events_data = [
        {
            "title": "Football Practice",
            "description": "Tommy's weekly football training",
            "start_time": today + timedelta(days=1, hours=16),
            "end_time": today + timedelta(days=1, hours=17, minutes=30),
            "location": "Sports Centre",
            "user_id": users["tommy"].id,
            "color": users["tommy"].color,
        },
        {
            "title": "School Run",
            "description": "Pick up kids from school",
            "start_time": today + timedelta(days=1, hours=15, minutes=30),
            "end_time": today + timedelta(days=1, hours=16),
            "location": "St Mary's School",
            "user_id": users["nicola"].id,
            "color": users["nicola"].color,
        },
        {
            "title": "Family Dinner",
            "description": "Sunday roast at home",
            "start_time": today + timedelta(days=3, hours=17),
            "end_time": today + timedelta(days=3, hours=19),
            "location": "Home",
            "user_id": None,
            "color": "#10b981",  # Green for family events
        },
        {
            "title": "Harry's Birthday",
            "description": "Harry turns 8!",
            "start_time": today + timedelta(days=7),
            "end_time": today + timedelta(days=7),
            "all_day": True,
            "user_id": users["harry"].id,
            "color": users["harry"].color,
        },
        {
            "title": "Dentist Appointment",
            "description": "James annual checkup",
            "start_time": today + timedelta(days=5, hours=10),
            "end_time": today + timedelta(days=5, hours=10, minutes=30),
            "location": "Smile Dental, High Street",
            "user_id": users["james"].id,
            "color": users["james"].color,
        },
    ]

    for data in events_data:
        event = CalendarEvent(
            tenant_id=tenant.id,
            title=data["title"],
            description=data.get("description"),
            start_time=data["start_time"],
            end_time=data.get("end_time", data["start_time"] + timedelta(hours=1)),
            all_day=data.get("all_day", False),
            location=data.get("location"),
            user_id=data.get("user_id"),
            color=data.get("color"),
        )
        db.add(event)
        print(f"  Created event: {data['title']}")

    await db.commit()


async def seed_shopping_list(db: AsyncSession, tenant: Tenant, users: dict[str, User]) -> None:
    """Create a default shopping list with sample items."""
    # Check if we already have a shopping list
    result = await db.execute(
        select(ShoppingList).where(ShoppingList.tenant_id == tenant.id)
    )
    existing = result.scalars().first()
    if existing:
        print("  Shopping list already exists, skipping...")
        return

    # Create default shopping list
    shopping_list = ShoppingList(
        tenant_id=tenant.id,
        name="Grocery List",
        is_default=True,
    )
    db.add(shopping_list)
    await db.flush()  # Get the ID
    print(f"  Created shopping list: {shopping_list.name}")

    # Sample shopping items
    items_data = [
        {"name": "Milk", "quantity": 2, "unit": "pint", "added_by": "nicola"},
        {"name": "Bread", "quantity": 1, "unit": "loaf", "added_by": "nicola"},
        {"name": "Eggs", "quantity": 1, "unit": "dozen", "added_by": "james"},
        {"name": "Butter", "quantity": 1, "unit": "pack", "added_by": "nicola"},
        {"name": "Chicken breast", "quantity": 500, "unit": "g", "added_by": "nicola"},
        {"name": "Bananas", "quantity": 1, "unit": "bunch", "added_by": "tommy"},
        {"name": "Apples", "quantity": 6, "unit": None, "added_by": "harry"},
        {"name": "Pasta", "quantity": 500, "unit": "g", "added_by": "nicola"},
        {"name": "Tinned tomatoes", "quantity": 2, "unit": "tin", "added_by": "james"},
        {"name": "Onions", "quantity": 3, "unit": None, "added_by": "nicola"},
        {"name": "Carrots", "quantity": 1, "unit": "bag", "added_by": "nicola"},
        {"name": "Cheese", "quantity": 200, "unit": "g", "added_by": "james"},
        {"name": "Orange juice", "quantity": 1, "unit": "carton", "added_by": "tommy"},
        {"name": "Toilet paper", "quantity": 1, "unit": "pack", "added_by": "james"},
        {"name": "Washing up liquid", "quantity": 1, "unit": "bottle", "added_by": "nicola"},
    ]

    for data in items_data:
        item = ShoppingItem(
            list_id=shopping_list.id,
            tenant_id=tenant.id,
            name=data["name"],
            name_normalized=normalize_item_name(data["name"]),
            quantity=Decimal(str(data["quantity"])),
            unit=data["unit"],
            category=categorize_item(data["name"]),
            source="manual",
            added_by=users[data["added_by"]].id,
        )
        db.add(item)
        print(f"    Added item: {data['name']} ({item.category})")

    await db.commit()


async def main():
    """Run the seed script."""
    print("\n" + "=" * 50)
    print("Family Hub - Database Seeding")
    print("=" * 50 + "\n")

    async with AsyncSessionLocal() as db:
        print("Creating tenant...")
        tenant = await seed_tenant(db)

        print("\nCreating users...")
        users = await seed_users(db, tenant)

        print("\nCreating calendar events...")
        await seed_calendar_events(db, tenant, users)

        print("\nCreating shopping list...")
        await seed_shopping_list(db, tenant, users)

    print("\n" + "=" * 50)
    print("Seeding complete!")
    print("=" * 50)
    print(f"\nLogin credentials (all users):")
    print(f"  Password: {DEFAULT_PASSWORD}")
    print(f"\nUsers created:")
    print(f"  - james@brown.family (admin)")
    print(f"  - nicola@brown.family (parent)")
    print(f"  - tommy@brown.family (child)")
    print(f"  - harry@brown.family (child)")
    print()


if __name__ == "__main__":
    asyncio.run(main())
