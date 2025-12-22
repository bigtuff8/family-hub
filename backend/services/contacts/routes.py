"""
Contacts API routes
Location: backend/services/contacts/routes.py
"""

from uuid import UUID
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from shared.database import get_db
from shared.models import User
from services.auth.security import get_current_user, get_current_tenant_id
from services.contacts import crud, schemas

router = APIRouter()


# ============ Contact CRUD ============

@router.get("", response_model=schemas.ContactListResponse)
async def get_contacts(
    search: Optional[str] = Query(None, description="Search term for filtering"),
    favorites_only: bool = Query(False, description="Only return favorite contacts"),
    include_archived: bool = Query(False, description="Include archived contacts"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page"),
    tenant_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db)
):
    """Get all contacts for the current tenant with optional filtering."""
    contacts, total = await crud.get_contacts_by_tenant(
        db,
        tenant_id=tenant_id,
        include_archived=include_archived,
        search=search,
        favorites_only=favorites_only,
        page=page,
        page_size=page_size
    )

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return schemas.ContactListResponse(
        contacts=[schemas.ContactSummary.model_validate(c) for c in contacts],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/birthdays/upcoming", response_model=schemas.UpcomingBirthdaysResponse)
async def get_upcoming_birthdays(
    days_ahead: int = Query(30, ge=1, le=365, description="Days to look ahead"),
    tenant_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db)
):
    """Get contacts with upcoming birthdays."""
    birthdays = await crud.get_upcoming_birthdays(db, tenant_id, days_ahead)
    return schemas.UpcomingBirthdaysResponse(
        birthdays=[schemas.UpcomingBirthday(**b) for b in birthdays]
    )


@router.get("/search")
async def search_contacts(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(10, ge=1, le=50),
    tenant_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db)
):
    """Quick search for autocomplete."""
    contacts = await crud.search_contacts(db, tenant_id, q, limit)
    return [schemas.ContactSummary.model_validate(c) for c in contacts]


@router.get("/{contact_id}", response_model=schemas.ContactResponse)
async def get_contact(
    contact_id: UUID,
    tenant_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db)
):
    """Get a single contact with full details."""
    contact = await crud.get_contact_by_id(db, contact_id, tenant_id)
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found"
        )

    return schemas.ContactResponse(
        id=contact.id,
        first_name=contact.first_name,
        last_name=contact.last_name,
        display_name=contact.display_name,
        nickname=contact.nickname,
        primary_email=contact.primary_email,
        primary_phone=contact.primary_phone,
        birthday=contact.birthday,
        anniversary=contact.anniversary,
        address_line1=contact.address_line1,
        address_line2=contact.address_line2,
        city=contact.city,
        county=contact.county,
        postcode=contact.postcode,
        country=contact.country,
        company=contact.company,
        job_title=contact.job_title,
        notes=contact.notes,
        photo_url=contact.photo_url,
        external_source=contact.external_source,
        last_synced_at=contact.last_synced_at,
        is_favorite=contact.is_favorite,
        is_archived=contact.is_archived,
        phones=[schemas.ContactPhoneResponse.model_validate(p) for p in contact.phones],
        emails=[schemas.ContactEmailResponse.model_validate(e) for e in contact.emails],
        created_at=contact.created_at,
        updated_at=contact.updated_at
    )


@router.post("", response_model=schemas.ContactResponse, status_code=status.HTTP_201_CREATED)
async def create_contact(
    request: schemas.ContactCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new contact."""
    contact = await crud.create_contact(db, current_user.tenant_id, request)
    return await get_contact(contact.id, current_user.tenant_id, db)


@router.put("/{contact_id}", response_model=schemas.ContactResponse)
async def update_contact(
    contact_id: UUID,
    request: schemas.ContactUpdate,
    tenant_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db)
):
    """Update a contact."""
    contact = await crud.get_contact_by_id(db, contact_id, tenant_id)
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found"
        )

    updated = await crud.update_contact(db, contact, request)
    return await get_contact(updated.id, tenant_id, db)


@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_contact(
    contact_id: UUID,
    tenant_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db)
):
    """Delete a contact."""
    contact = await crud.get_contact_by_id(db, contact_id, tenant_id)
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found"
        )

    await crud.delete_contact(db, contact)


@router.post("/{contact_id}/favorite", response_model=schemas.ContactSummary)
async def toggle_favorite(
    contact_id: UUID,
    tenant_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db)
):
    """Toggle contact's favorite status."""
    contact = await crud.get_contact_by_id(db, contact_id, tenant_id)
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found"
        )

    updated = await crud.toggle_favorite(db, contact)
    return schemas.ContactSummary.model_validate(updated)


@router.post("/{contact_id}/archive", response_model=schemas.ContactSummary)
async def toggle_archive(
    contact_id: UUID,
    tenant_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db)
):
    """Archive/unarchive a contact."""
    contact = await crud.get_contact_by_id(db, contact_id, tenant_id)
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found"
        )

    updated = await crud.archive_contact(db, contact)
    return schemas.ContactSummary.model_validate(updated)


# ============ Phone Operations ============

@router.post("/{contact_id}/phones", response_model=schemas.ContactPhoneResponse, status_code=status.HTTP_201_CREATED)
async def add_phone(
    contact_id: UUID,
    request: schemas.ContactPhoneCreate,
    tenant_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db)
):
    """Add a phone number to a contact."""
    contact = await crud.get_contact_by_id(db, contact_id, tenant_id)
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found"
        )

    phone = await crud.add_phone(db, contact_id, request)
    return schemas.ContactPhoneResponse.model_validate(phone)


@router.delete("/{contact_id}/phones/{phone_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_phone(
    contact_id: UUID,
    phone_id: UUID,
    tenant_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db)
):
    """Delete a phone number."""
    contact = await crud.get_contact_by_id(db, contact_id, tenant_id)
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found"
        )

    deleted = await crud.delete_phone(db, phone_id, contact_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Phone not found"
        )


# ============ Email Operations ============

@router.post("/{contact_id}/emails", response_model=schemas.ContactEmailResponse, status_code=status.HTTP_201_CREATED)
async def add_email(
    contact_id: UUID,
    request: schemas.ContactEmailCreate,
    tenant_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db)
):
    """Add an email to a contact."""
    contact = await crud.get_contact_by_id(db, contact_id, tenant_id)
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found"
        )

    email = await crud.add_email(db, contact_id, request)
    return schemas.ContactEmailResponse.model_validate(email)


@router.delete("/{contact_id}/emails/{email_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_email(
    contact_id: UUID,
    email_id: UUID,
    tenant_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db)
):
    """Delete an email address."""
    contact = await crud.get_contact_by_id(db, contact_id, tenant_id)
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found"
        )

    deleted = await crud.delete_email(db, email_id, contact_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email not found"
        )
