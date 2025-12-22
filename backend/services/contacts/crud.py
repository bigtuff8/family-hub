"""
Contacts database operations
Location: backend/services/contacts/crud.py
"""

from datetime import datetime, timezone, date
from typing import Optional
from uuid import UUID

from sqlalchemy import select, and_, or_, func, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from shared.models import Contact, ContactPhone, ContactEmail
from services.contacts import schemas


# ============ Contact Operations ============

async def get_contacts_by_tenant(
    db: AsyncSession,
    tenant_id: UUID,
    include_archived: bool = False,
    search: Optional[str] = None,
    favorites_only: bool = False,
    page: int = 1,
    page_size: int = 50
) -> tuple[list[Contact], int]:
    """
    Get contacts for a tenant with optional filtering.
    Returns: (contacts, total_count)
    """
    query = select(Contact).where(Contact.tenant_id == tenant_id)

    if not include_archived:
        query = query.where(Contact.is_archived == False)

    if favorites_only:
        query = query.where(Contact.is_favorite == True)

    if search:
        search_term = f"%{search.lower()}%"
        query = query.where(
            or_(
                func.lower(Contact.first_name).like(search_term),
                func.lower(Contact.last_name).like(search_term),
                func.lower(Contact.display_name).like(search_term),
                func.lower(Contact.nickname).like(search_term),
                func.lower(Contact.primary_email).like(search_term),
                Contact.primary_phone.like(search_term),
                func.lower(Contact.company).like(search_term),
            )
        )

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Apply pagination and ordering
    query = query.order_by(Contact.last_name, Contact.first_name)
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    contacts = result.scalars().all()

    return contacts, total


async def get_contact_by_id(
    db: AsyncSession,
    contact_id: UUID,
    tenant_id: UUID
) -> Optional[Contact]:
    """Get a specific contact with phones and emails."""
    result = await db.execute(
        select(Contact)
        .options(
            selectinload(Contact.phones),
            selectinload(Contact.emails)
        )
        .where(
            and_(
                Contact.id == contact_id,
                Contact.tenant_id == tenant_id
            )
        )
    )
    return result.scalar_one_or_none()


async def get_contact_by_external_id(
    db: AsyncSession,
    tenant_id: UUID,
    external_source: str,
    external_id: str
) -> Optional[Contact]:
    """Get a contact by external sync ID."""
    result = await db.execute(
        select(Contact).where(
            and_(
                Contact.tenant_id == tenant_id,
                Contact.external_source == external_source,
                Contact.external_id == external_id
            )
        )
    )
    return result.scalar_one_or_none()


async def create_contact(
    db: AsyncSession,
    tenant_id: UUID,
    data: schemas.ContactCreate
) -> Contact:
    """Create a new contact with optional phones and emails."""
    # Build display name if not provided
    display_name = data.display_name
    if not display_name:
        if data.last_name:
            display_name = f"{data.first_name} {data.last_name}"
        else:
            display_name = data.first_name

    contact = Contact(
        tenant_id=tenant_id,
        first_name=data.first_name,
        last_name=data.last_name,
        display_name=display_name,
        nickname=data.nickname,
        primary_email=data.primary_email,
        primary_phone=data.primary_phone,
        birthday=data.birthday,
        anniversary=data.anniversary,
        address_line1=data.address_line1,
        address_line2=data.address_line2,
        city=data.city,
        county=data.county,
        postcode=data.postcode,
        country=data.country,
        company=data.company,
        job_title=data.job_title,
        notes=data.notes,
        photo_url=data.photo_url,
        is_favorite=data.is_favorite,
        external_source='manual',
    )
    db.add(contact)
    await db.flush()  # Get the contact ID

    # Add phones
    for phone_data in data.phones:
        phone = ContactPhone(
            contact_id=contact.id,
            phone_type=phone_data.phone_type,
            phone_number=phone_data.phone_number,
            is_primary=phone_data.is_primary,
        )
        db.add(phone)

    # Add emails
    for email_data in data.emails:
        email = ContactEmail(
            contact_id=contact.id,
            email_type=email_data.email_type,
            email_address=email_data.email_address,
            is_primary=email_data.is_primary,
        )
        db.add(email)

    await db.commit()
    await db.refresh(contact)

    # Load relationships
    return await get_contact_by_id(db, contact.id, tenant_id)


async def update_contact(
    db: AsyncSession,
    contact: Contact,
    data: schemas.ContactUpdate
) -> Contact:
    """Update a contact's fields."""
    update_data = data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        if hasattr(contact, field):
            setattr(contact, field, value)

    # Rebuild display name if first/last name changed
    if 'first_name' in update_data or 'last_name' in update_data:
        if not contact.display_name or contact.display_name == f"{contact.first_name} {contact.last_name}":
            if contact.last_name:
                contact.display_name = f"{contact.first_name} {contact.last_name}"
            else:
                contact.display_name = contact.first_name

    contact.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(contact)
    return contact


async def delete_contact(db: AsyncSession, contact: Contact) -> None:
    """Delete a contact (cascades to phones/emails)."""
    await db.delete(contact)
    await db.commit()


async def toggle_favorite(db: AsyncSession, contact: Contact) -> Contact:
    """Toggle contact's favorite status."""
    contact.is_favorite = not contact.is_favorite
    contact.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(contact)
    return contact


async def archive_contact(db: AsyncSession, contact: Contact) -> Contact:
    """Archive/unarchive a contact."""
    contact.is_archived = not contact.is_archived
    contact.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(contact)
    return contact


# ============ Phone Operations ============

async def add_phone(
    db: AsyncSession,
    contact_id: UUID,
    data: schemas.ContactPhoneCreate
) -> ContactPhone:
    """Add a phone number to a contact."""
    phone = ContactPhone(
        contact_id=contact_id,
        phone_type=data.phone_type,
        phone_number=data.phone_number,
        is_primary=data.is_primary,
    )
    db.add(phone)
    await db.commit()
    await db.refresh(phone)
    return phone


async def delete_phone(db: AsyncSession, phone_id: UUID, contact_id: UUID) -> bool:
    """Delete a phone number."""
    result = await db.execute(
        delete(ContactPhone).where(
            and_(
                ContactPhone.id == phone_id,
                ContactPhone.contact_id == contact_id
            )
        )
    )
    await db.commit()
    return result.rowcount > 0


# ============ Email Operations ============

async def add_email(
    db: AsyncSession,
    contact_id: UUID,
    data: schemas.ContactEmailCreate
) -> ContactEmail:
    """Add an email to a contact."""
    email = ContactEmail(
        contact_id=contact_id,
        email_type=data.email_type,
        email_address=data.email_address,
        is_primary=data.is_primary,
    )
    db.add(email)
    await db.commit()
    await db.refresh(email)
    return email


async def delete_email(db: AsyncSession, email_id: UUID, contact_id: UUID) -> bool:
    """Delete an email address."""
    result = await db.execute(
        delete(ContactEmail).where(
            and_(
                ContactEmail.id == email_id,
                ContactEmail.contact_id == contact_id
            )
        )
    )
    await db.commit()
    return result.rowcount > 0


# ============ Birthday Operations ============

async def get_upcoming_birthdays(
    db: AsyncSession,
    tenant_id: UUID,
    days_ahead: int = 30
) -> list[dict]:
    """
    Get contacts with birthdays in the next N days.
    Handles year wrap-around (Dec -> Jan).
    """
    today = date.today()

    # Get all contacts with birthdays
    result = await db.execute(
        select(Contact).where(
            and_(
                Contact.tenant_id == tenant_id,
                Contact.birthday != None,
                Contact.is_archived == False
            )
        )
    )
    contacts = result.scalars().all()

    upcoming = []
    for contact in contacts:
        birthday = contact.birthday
        # Calculate this year's birthday
        try:
            this_year_birthday = birthday.replace(year=today.year)
        except ValueError:
            # Feb 29 in non-leap year
            this_year_birthday = birthday.replace(year=today.year, day=28)

        # If already passed this year, check next year
        if this_year_birthday < today:
            try:
                this_year_birthday = birthday.replace(year=today.year + 1)
            except ValueError:
                this_year_birthday = birthday.replace(year=today.year + 1, day=28)

        days_until = (this_year_birthday - today).days

        if 0 <= days_until <= days_ahead:
            # Calculate age they're turning
            age_turning = this_year_birthday.year - birthday.year

            upcoming.append({
                "id": contact.id,
                "first_name": contact.first_name,
                "last_name": contact.last_name,
                "display_name": contact.display_name,
                "birthday": contact.birthday,
                "days_until": days_until,
                "age_turning": age_turning,
            })

    # Sort by days_until
    upcoming.sort(key=lambda x: x["days_until"])
    return upcoming


# ============ Search/Autocomplete ============

async def search_contacts(
    db: AsyncSession,
    tenant_id: UUID,
    query: str,
    limit: int = 10
) -> list[Contact]:
    """Quick search for autocomplete."""
    search_term = f"%{query.lower()}%"

    result = await db.execute(
        select(Contact)
        .where(
            and_(
                Contact.tenant_id == tenant_id,
                Contact.is_archived == False,
                or_(
                    func.lower(Contact.first_name).like(search_term),
                    func.lower(Contact.last_name).like(search_term),
                    func.lower(Contact.display_name).like(search_term),
                )
            )
        )
        .order_by(Contact.last_name, Contact.first_name)
        .limit(limit)
    )
    return result.scalars().all()
