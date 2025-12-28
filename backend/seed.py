"""
Database seeding script for Family Hub
Location: backend/seed.py

Creates:
- Brown Family tenant
- 4 family members (James, Nicola, Tommy, Harry)
- Default shopping list
- Sample calendar events
- Phase 2: User email accounts
- Phase 2: Parental controls (James & Nicola control Tommy & Harry)

Usage: docker-compose exec backend python seed.py
"""

import asyncio
from datetime import datetime, timedelta, timezone, date
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from decimal import Decimal

from shared.database import engine, AsyncSessionLocal
from shared.models import (
    Tenant, User, CalendarEvent, ShoppingList, ShoppingItem,
    UserEmailAccount, ParentalControl, Contact,
)
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
            "name": "James Brown",
            "email": "james@brown.family",
            "role": "admin",
            "color": "#e30613",  # Liverpool red
        },
        {
            "id": USER_IDS["nicola"],
            "name": "Nicola Brown",
            "email": "nicola@brown.family",
            "role": "parent",
            "color": "#fb7185",  # Pink
        },
        {
            "id": USER_IDS["tommy"],
            "name": "Tommy Brown",
            "email": "tommy@brown.family",
            "role": "child",
            "color": "#00B140",  # Liverpool green
        },
        {
            "id": USER_IDS["harry"],
            "name": "Harry Brown",
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
            users[data["name"].split()[0].lower()] = existing
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
        users[data["name"].split()[0].lower()] = user  # Use first name as key

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


async def seed_user_email_accounts(db: AsyncSession, tenant: Tenant, users: dict[str, User]) -> None:
    """Create default email accounts for each user (Phase 2)."""
    # Check if we already have email accounts
    result = await db.execute(
        select(UserEmailAccount).where(UserEmailAccount.tenant_id == tenant.id)
    )
    existing = result.scalars().first()
    if existing:
        print("  User email accounts already exist, skipping...")
        return

    # Real email addresses from family configuration
    email_accounts = [
        # James has multiple accounts
        {
            "user_key": "james",
            "email_address": "jamesbrownyork8@gmail.com",
            "provider": "google",
            "display_name": "Personal Gmail",
            "is_default": True,  # Primary for invites
        },
        {
            "user_key": "james",
            "email_address": "jamesbrown8@me.com",
            "provider": "icloud",
            "display_name": "iCloud",
            "is_default": False,
        },
        {
            "user_key": "james",
            "email_address": "james.brown377@outlook.com",
            "provider": "outlook",
            "display_name": "Outlook",
            "is_default": False,
        },
        {
            "user_key": "james",
            "email_address": "bigtuff8@yahoo.com",
            "provider": "other",
            "display_name": "Yahoo",
            "is_default": False,
        },
        # Nicola's iCloud
        {
            "user_key": "nicola",
            "email_address": "nicolabrown80@icloud.com",
            "provider": "icloud",
            "display_name": "iCloud",
            "is_default": True,
        },
        # Tommy's iCloud
        {
            "user_key": "tommy",
            "email_address": "thomas.j.brown11@icloud.com",
            "provider": "icloud",
            "display_name": "iCloud",
            "is_default": True,
        },
        # Harry's iCloud (age 7, not active but set up for invites)
        {
            "user_key": "harry",
            "email_address": "harry.m.brown@icloud.com",
            "provider": "icloud",
            "display_name": "iCloud",
            "is_default": True,
        },
    ]

    for data in email_accounts:
        user = users[data["user_key"]]
        account = UserEmailAccount(
            user_id=user.id,
            tenant_id=tenant.id,
            email_address=data["email_address"],
            provider=data["provider"],
            display_name=data["display_name"],
            is_default=data["is_default"],
            is_verified=True,  # Pre-verified for dev
            receive_invites=True,
        )
        db.add(account)
        print(f"  Created email account: {data['email_address']} for {user.name}")

    await db.commit()


async def seed_parental_controls(db: AsyncSession, tenant: Tenant, users: dict[str, User]) -> None:
    """Create parental control relationships (Phase 2)."""
    # Check if we already have parental controls
    result = await db.execute(
        select(ParentalControl).where(ParentalControl.tenant_id == tenant.id)
    )
    existing = result.scalars().first()
    if existing:
        print("  Parental controls already exist, skipping...")
        return

    # Parents can control both children
    parental_relationships = [
        # James controls Tommy
        {"parent_key": "james", "child_key": "tommy"},
        # James controls Harry
        {"parent_key": "james", "child_key": "harry"},
        # Nicola controls Tommy
        {"parent_key": "nicola", "child_key": "tommy"},
        # Nicola controls Harry
        {"parent_key": "nicola", "child_key": "harry"},
    ]

    for data in parental_relationships:
        parent = users[data["parent_key"]]
        child = users[data["child_key"]]

        control = ParentalControl(
            tenant_id=tenant.id,
            parent_user_id=parent.id,
            child_user_id=child.id,
            can_view_calendar=True,
            can_view_contacts=True,
            can_manage_calendar=True,
            can_manage_contacts=True,
            can_respond_on_behalf=True,
        )
        db.add(control)
        print(f"  Created parental control: {parent.name} -> {child.name}")

    await db.commit()


async def seed_sample_contacts(db: AsyncSession, tenant: Tenant, users: dict[str, User]) -> None:
    """Create sample contacts for testing (Phase 2)."""
    # Check if we already have contacts
    result = await db.execute(
        select(Contact).where(Contact.tenant_id == tenant.id)
    )
    existing = result.scalars().first()
    if existing:
        print("  Contacts already exist, skipping...")
        return

    # Sample contacts with user ownership
    contacts_data = [
        # James's contacts
        {
            "owner_key": "james",
            "first_name": "Margaret",
            "last_name": "Brown",
            "display_name": "Grandma (Margaret)",
            "nickname": "Grandma",
            "primary_email": "grandma.brown@email.com",
            "birthday": date(1950, 3, 15),
            "is_published_to_family": True,  # Shared with family
        },
        {
            "owner_key": "james",
            "first_name": "Robert",
            "last_name": "Brown",
            "display_name": "Grandpa (Robert)",
            "nickname": "Grandpa",
            "primary_email": "grandpa.brown@email.com",
            "birthday": date(1948, 7, 22),
            "is_published_to_family": True,  # Shared with family
        },
        {
            "owner_key": "james",
            "first_name": "Mike",
            "last_name": "Thompson",
            "display_name": "Mike (Work)",
            "primary_email": "mike.t@company.com",
            "company": "TechCorp",
            "is_published_to_family": False,  # Personal work contact
        },
        # Nicola's contacts
        {
            "owner_key": "nicola",
            "first_name": "Sarah",
            "last_name": "Mitchell",
            "display_name": "Aunt Sarah",
            "nickname": "Aunt Sarah",
            "primary_email": "sarah.mitchell@email.com",
            "birthday": date(1975, 11, 8),
            "is_published_to_family": True,  # Shared with family
        },
        {
            "owner_key": "nicola",
            "first_name": "Emma",
            "last_name": "Wilson",
            "display_name": "Emma (Book Club)",
            "primary_email": "emma.wilson@email.com",
            "is_published_to_family": False,  # Personal contact
        },
    ]

    james = users["james"]

    for data in contacts_data:
        owner = users[data["owner_key"]]
        contact = Contact(
            tenant_id=tenant.id,
            owner_user_id=owner.id,
            first_name=data["first_name"],
            last_name=data.get("last_name"),
            display_name=data["display_name"],
            nickname=data.get("nickname"),
            primary_email=data.get("primary_email"),
            birthday=data.get("birthday"),
            company=data.get("company"),
            is_published_to_family=data.get("is_published_to_family", False),
            published_at=datetime.now(timezone.utc) if data.get("is_published_to_family") else None,
            published_by_user_id=owner.id if data.get("is_published_to_family") else None,
            source="manual",
        )
        db.add(contact)
        pub_status = " [Published to Family]" if data.get("is_published_to_family") else ""
        print(f"  Created contact: {data['display_name']} (owned by {owner.name}){pub_status}")

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

        print("\nCreating user email accounts (Phase 2)...")
        await seed_user_email_accounts(db, tenant, users)

        print("\nCreating parental controls (Phase 2)...")
        await seed_parental_controls(db, tenant, users)

        print("\nCreating sample contacts (Phase 2)...")
        await seed_sample_contacts(db, tenant, users)

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
    print(f"\nPhase 2 Data:")
    print(f"  - Email accounts configured with real addresses")
    print(f"  - Parental controls: James & Nicola -> Tommy & Harry")
    print(f"  - Sample contacts with 'Publish to Family' examples")
    print()


if __name__ == "__main__":
    asyncio.run(main())
