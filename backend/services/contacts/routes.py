"""
Contacts API routes
Location: backend/services/contacts/routes.py

Phase 2 Updates:
- User-owned contacts (owner_user_id)
- My Contacts vs Family Contacts endpoints
- Publish to Family functionality
- Smart lookup for invitee selection
"""

from uuid import UUID
from typing import Optional, Literal
import re

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from shared.database import get_db
from shared.models import User
from services.auth.security import get_current_user, get_current_tenant_id
from services.contacts import crud, schemas

router = APIRouter()


# ============ Helper Functions ============

def build_contact_summary(contact, current_user_id: UUID) -> schemas.ContactSummary:
    """Build a ContactSummary from a Contact model."""
    owner_info = None
    if contact.owner:
        owner_info = schemas.OwnerInfo(
            id=contact.owner.id,
            name=contact.owner.name,
            color=contact.owner.color
        )

    return schemas.ContactSummary(
        id=contact.id,
        first_name=contact.first_name,
        last_name=contact.last_name,
        display_name=contact.display_name,
        primary_email=contact.primary_email,
        primary_phone=contact.primary_phone,
        birthday=contact.birthday,
        is_favorite=contact.is_favorite,
        photo_url=contact.photo_url,
        owner_user_id=contact.owner_user_id,
        owner=owner_info,
        is_published_to_family=contact.is_published_to_family,
        source=contact.source or 'manual',
    )


def build_contact_response(contact) -> schemas.ContactResponse:
    """Build a full ContactResponse from a Contact model."""
    owner_info = None
    if contact.owner:
        owner_info = schemas.OwnerInfo(
            id=contact.owner.id,
            name=contact.owner.name,
            color=contact.owner.color
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
        anniversary_type=contact.anniversary_type,
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
        owner_user_id=contact.owner_user_id,
        owner=owner_info,
        is_published_to_family=contact.is_published_to_family,
        published_at=contact.published_at,
        published_by_user_id=contact.published_by_user_id,
        source=contact.source or 'manual',
        external_id=contact.external_id,
        last_synced_at=contact.last_synced_at,
        is_favorite=contact.is_favorite,
        is_archived=contact.is_archived,
        phones=[schemas.ContactPhoneResponse.model_validate(p) for p in contact.phones],
        emails=[schemas.ContactEmailResponse.model_validate(e) for e in contact.emails],
        created_at=contact.created_at,
        updated_at=contact.updated_at,
    )


# ============ Smart Lookup (for Event Invitations) ============

@router.get("/lookup", response_model=schemas.SmartLookupResponse)
async def smart_lookup(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(10, ge=1, le=50, description="Max results per category"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Smart lookup for invitee selection when creating events.

    Returns results in priority order:
    1. Family users (other members of the family)
    2. Personal contacts (user's own contacts)
    3. Family contacts (published by other family members)

    If query looks like an email and no matches found, suggests inviting as guest.
    """
    results = await crud.smart_lookup(
        db,
        user_id=current_user.id,
        tenant_id=current_user.tenant_id,
        query=q,
        limit=limit
    )

    # Build response
    response_results = []

    # Add family users first
    for user in results["family_users"]:
        response_results.append(schemas.FamilyUserResult(
            id=user["id"],
            display_name=user["display_name"],
            email=user["email"],
            avatar_url=user["avatar_url"],
            role=user["role"],
            color=user["color"],
            is_minor=user["is_minor"],
        ))

    # Add personal contacts
    for contact in results["personal_contacts"]:
        response_results.append(schemas.ContactResult(
            id=contact["id"],
            display_name=contact["display_name"],
            email=contact["email"],
            avatar_url=contact["avatar_url"],
            source="personal",
        ))

    # Add family contacts
    for contact in results["family_contacts"]:
        response_results.append(schemas.ContactResult(
            id=contact["id"],
            display_name=contact["display_name"],
            email=contact["email"],
            avatar_url=contact["avatar_url"],
            source="family",
            owner_name=contact["owner_name"],
        ))

    # If query looks like a valid email, always offer to invite as guest
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if re.match(email_pattern, q):
        response_results.append(schemas.EmailSuggestion(
            email=q,
            prompt=f"Invite {q} as guest"
        ))

    return schemas.SmartLookupResponse(
        query=q,
        results=response_results
    )


# ============ My Contacts vs Family Contacts ============

@router.get("/mine", response_model=schemas.ContactListResponse)
async def get_my_contacts(
    search: Optional[str] = Query(None, description="Search term for filtering"),
    favorites_only: bool = Query(False, description="Only return favorite contacts"),
    include_archived: bool = Query(False, description="Include archived contacts"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get contacts owned by the current user."""
    contacts, total = await crud.get_my_contacts(
        db,
        user_id=current_user.id,
        tenant_id=current_user.tenant_id,
        include_archived=include_archived,
        search=search,
        favorites_only=favorites_only,
        page=page,
        page_size=page_size
    )

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return schemas.ContactListResponse(
        contacts=[build_contact_summary(c, current_user.id) for c in contacts],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/family", response_model=schemas.ContactListResponse)
async def get_family_contacts(
    search: Optional[str] = Query(None, description="Search term for filtering"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get contacts published to family by other members (excludes user's own)."""
    contacts, total = await crud.get_family_contacts(
        db,
        user_id=current_user.id,
        tenant_id=current_user.tenant_id,
        search=search,
        page=page,
        page_size=page_size
    )

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return schemas.ContactListResponse(
        contacts=[build_contact_summary(c, current_user.id) for c in contacts],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


# ============ Legacy All Contacts (for backwards compatibility) ============

@router.get("", response_model=schemas.ContactListResponse)
async def get_contacts(
    search: Optional[str] = Query(None, description="Search term for filtering"),
    favorites_only: bool = Query(False, description="Only return favorite contacts"),
    include_archived: bool = Query(False, description="Include archived contacts"),
    view: Literal["mine", "family", "all"] = Query("mine", description="Which contacts to show"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get contacts with flexible filtering.

    view options:
    - "mine": Only contacts owned by current user (default)
    - "family": Only contacts published by other family members
    - "all": Both mine and family contacts
    """
    if view == "mine":
        contacts, total = await crud.get_my_contacts(
            db,
            user_id=current_user.id,
            tenant_id=current_user.tenant_id,
            include_archived=include_archived,
            search=search,
            favorites_only=favorites_only,
            page=page,
            page_size=page_size
        )
    elif view == "family":
        contacts, total = await crud.get_family_contacts(
            db,
            user_id=current_user.id,
            tenant_id=current_user.tenant_id,
            search=search,
            page=page,
            page_size=page_size
        )
    else:  # "all"
        # For "all", we need to combine both queries
        # This is a simplified approach - get both and merge
        my_contacts, my_total = await crud.get_my_contacts(
            db,
            user_id=current_user.id,
            tenant_id=current_user.tenant_id,
            include_archived=include_archived,
            search=search,
            favorites_only=favorites_only,
            page=1,
            page_size=1000  # Get all for now
        )
        family_contacts, fam_total = await crud.get_family_contacts(
            db,
            user_id=current_user.id,
            tenant_id=current_user.tenant_id,
            search=search,
            page=1,
            page_size=1000
        )
        all_contacts = list(my_contacts) + list(family_contacts)
        all_contacts.sort(key=lambda c: (c.last_name or '', c.first_name))
        total = len(all_contacts)

        # Manual pagination
        start = (page - 1) * page_size
        contacts = all_contacts[start:start + page_size]

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return schemas.ContactListResponse(
        contacts=[build_contact_summary(c, current_user.id) for c in contacts],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


# ============ Birthdays ============

@router.get("/birthdays/upcoming", response_model=schemas.UpcomingBirthdaysResponse)
async def get_upcoming_birthdays(
    days_ahead: int = Query(30, ge=1, le=365, description="Days to look ahead"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get contacts with upcoming birthdays (own + family contacts)."""
    birthdays = await crud.get_upcoming_birthdays(
        db,
        user_id=current_user.id,
        tenant_id=current_user.tenant_id,
        days_ahead=days_ahead
    )
    return schemas.UpcomingBirthdaysResponse(
        birthdays=[schemas.UpcomingBirthday(**b) for b in birthdays]
    )


# ============ Quick Search ============

@router.get("/search")
async def search_contacts(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Quick search for autocomplete (own + family contacts)."""
    contacts = await crud.search_contacts(
        db,
        user_id=current_user.id,
        tenant_id=current_user.tenant_id,
        query=q,
        limit=limit
    )
    return [build_contact_summary(c, current_user.id) for c in contacts]


# ============ Single Contact CRUD ============

@router.get("/{contact_id}", response_model=schemas.ContactResponse)
async def get_contact(
    contact_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a single contact with full details."""
    contact = await crud.get_contact_by_id(
        db,
        contact_id=contact_id,
        tenant_id=current_user.tenant_id,
        user_id=current_user.id
    )
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found"
        )

    return build_contact_response(contact)


@router.post("", response_model=schemas.ContactResponse, status_code=status.HTTP_201_CREATED)
async def create_contact(
    request: schemas.ContactCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new contact (owned by current user)."""
    contact = await crud.create_contact(
        db,
        user_id=current_user.id,
        tenant_id=current_user.tenant_id,
        data=request
    )
    return build_contact_response(contact)


@router.put("/{contact_id}", response_model=schemas.ContactResponse)
async def update_contact(
    contact_id: UUID,
    request: schemas.ContactUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a contact (must own it)."""
    contact = await crud.get_contact_for_edit(
        db,
        contact_id=contact_id,
        tenant_id=current_user.tenant_id,
        user_id=current_user.id
    )
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found or you don't have permission to edit"
        )

    updated = await crud.update_contact(db, contact, request)
    # Reload with relationships
    updated = await crud.get_contact_by_id(
        db,
        contact_id=updated.id,
        tenant_id=current_user.tenant_id,
        user_id=current_user.id
    )
    return build_contact_response(updated)


@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_contact(
    contact_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a contact (must own it)."""
    contact = await crud.get_contact_for_edit(
        db,
        contact_id=contact_id,
        tenant_id=current_user.tenant_id,
        user_id=current_user.id
    )
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found or you don't have permission to delete"
        )

    await crud.delete_contact(db, contact)


# ============ Contact Actions ============

@router.post("/{contact_id}/favorite", response_model=schemas.ContactSummary)
async def toggle_favorite(
    contact_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Toggle contact's favorite status (must own it)."""
    contact = await crud.get_contact_for_edit(
        db,
        contact_id=contact_id,
        tenant_id=current_user.tenant_id,
        user_id=current_user.id
    )
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found or you don't have permission"
        )

    updated = await crud.toggle_favorite(db, contact)
    return build_contact_summary(updated, current_user.id)


@router.post("/{contact_id}/archive", response_model=schemas.ContactSummary)
async def toggle_archive(
    contact_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Archive/unarchive a contact (must own it)."""
    contact = await crud.get_contact_for_edit(
        db,
        contact_id=contact_id,
        tenant_id=current_user.tenant_id,
        user_id=current_user.id
    )
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found or you don't have permission"
        )

    updated = await crud.archive_contact(db, contact)
    return build_contact_summary(updated, current_user.id)


# ============ Publish to Family ============

@router.post("/{contact_id}/publish", response_model=schemas.PublishToFamilyResponse)
async def publish_to_family(
    contact_id: UUID,
    request: schemas.PublishToFamilyRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Publish or unpublish a contact to/from the family (must own it)."""
    contact = await crud.get_contact_for_edit(
        db,
        contact_id=contact_id,
        tenant_id=current_user.tenant_id,
        user_id=current_user.id
    )
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found or you don't have permission"
        )

    updated = await crud.publish_to_family(
        db,
        contact=contact,
        user_id=current_user.id,
        publish=request.publish
    )

    action = "published to" if request.publish else "unpublished from"
    return schemas.PublishToFamilyResponse(
        id=updated.id,
        is_published_to_family=updated.is_published_to_family,
        published_at=updated.published_at,
        message=f"Contact {action} family"
    )


# ============ Phone Operations ============

@router.post("/{contact_id}/phones", response_model=schemas.ContactPhoneResponse, status_code=status.HTTP_201_CREATED)
async def add_phone(
    contact_id: UUID,
    request: schemas.ContactPhoneCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Add a phone number to a contact (must own it)."""
    contact = await crud.get_contact_for_edit(
        db,
        contact_id=contact_id,
        tenant_id=current_user.tenant_id,
        user_id=current_user.id
    )
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found or you don't have permission"
        )

    phone = await crud.add_phone(db, contact_id, request)
    return schemas.ContactPhoneResponse.model_validate(phone)


@router.delete("/{contact_id}/phones/{phone_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_phone(
    contact_id: UUID,
    phone_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a phone number (must own the contact)."""
    contact = await crud.get_contact_for_edit(
        db,
        contact_id=contact_id,
        tenant_id=current_user.tenant_id,
        user_id=current_user.id
    )
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found or you don't have permission"
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
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Add an email to a contact (must own it)."""
    contact = await crud.get_contact_for_edit(
        db,
        contact_id=contact_id,
        tenant_id=current_user.tenant_id,
        user_id=current_user.id
    )
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found or you don't have permission"
        )

    email = await crud.add_email(db, contact_id, request)
    return schemas.ContactEmailResponse.model_validate(email)


@router.delete("/{contact_id}/emails/{email_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_email(
    contact_id: UUID,
    email_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete an email address (must own the contact)."""
    contact = await crud.get_contact_for_edit(
        db,
        contact_id=contact_id,
        tenant_id=current_user.tenant_id,
        user_id=current_user.id
    )
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found or you don't have permission"
        )

    deleted = await crud.delete_email(db, email_id, contact_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email not found"
        )
