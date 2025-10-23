# Technical Debt Register

This document tracks known technical debt, shortcuts, and future refactoring needs.

**Last Updated:** October 12, 2025  
**Project Phase:** Phase 1 - MVP Calendar Development  
**Project:** Family Hub

**Legend:**
- 🔴 Critical (blocks production/scaling)
- 🟡 Important (should fix before Phase X)
- 🟢 Nice-to-have (optimize when time permits)

---

## Active Technical Debt

### 🔴 TD-001: Hard-coded Tenant ID
**Status:** Active (Phase 1)  
**Must Fix By:** Phase 1.5 (Authentication)  
**Priority:** Critical for multi-tenant production  
**Created:** October 12, 2025

**Issue:**
Tenant ID is hard-coded in `CalendarEventForm.tsx` as the Brown family tenant ID. This prevents:
- Multiple families using the system
- User authentication
- Proper multi-tenancy
- Production deployment

**Current Code:**
- File: `frontend/src/features/calendar/CalendarEventForm.tsx` (Line ~67)
- Hard-coded: `const BROWN_FAMILY_TENANT_ID = '10000000-0000-0000-0000-000000000000'`

**Impact:**
- Only one family (Brown family) can use the system
- No user login/authentication
- Cannot test multi-tenant features
- Cannot deploy to production

**Solution:**
Implement authentication system with:
1. User registration/login → JWT with `tenant_id` in claims
2. Auth context provider in React (`useAuth()` hook)
3. Replace hard-coded value with `useAuth().currentTenant.id`
4. Update all API calls to use dynamic tenant_id

**Estimated Effort:** 1-2 weeks  
**Dependencies:** 
- JWT authentication library (python-jose)
- Auth backend routes
- Supabase or similar auth service (or custom)

**Related Files:**
- `frontend/src/features/calendar/CalendarEventForm.tsx`
- Future: `frontend/src/contexts/AuthContext.tsx`
- Future: `backend/services/auth/routes.py`

---

### 🟡 TD-002: Missing Family Relationships Table
**Status:** Planned (Phase 2)  
**Must Fix By:** Phase 2 (Advanced Features)  
**Priority:** Important for family features  
**Created:** October 12, 2025

**Issue:**
No database structure to define relationships between family members (parent/child/partner/sibling).

**Impact:**
- Cannot implement "notify Tommy's parents when task completed"
- Cannot build family tree visualization
- Cannot automatically add related family members to events
- Cannot implement emergency contacts (auto-add parents)
- Cannot filter events by "my children" or "my parents"

**Use Cases Blocked:**
- Family tree UI
- "Show me all my children's events"
- "Notify parents when child marks homework complete"
- Emergency contact auto-population
- Age-appropriate content filtering (based on parent-child relationships)

**Solution:**
Add `family_relationships` table:
```sql
CREATE TABLE family_relationships (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    related_user_id UUID NOT NULL,
    relationship_type VARCHAR(50) NOT NULL,
    FOREIGN KEY(tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY(related_user_id) REFERENCES users (id) ON DELETE CASCADE,
    UNIQUE(user_id, related_user_id, relationship_type)
);
Estimated Effort: 3-5 days
Dependencies: None
Related Issues: None yet

🟡 TD-003: Missing External Contacts System
Status: Planned (Phase 1.5/2)
Must Fix By: Phase 2
Priority: Important for external guest invitations
Created: October 12, 2025
Issue:
No way to store contacts outside the tenant (e.g., extended family, friends who don't have accounts).
Use Cases Blocked:

Track sister's birthday (she's not in your tenant)
Invite external guests to events
Address book for family
Migrate contacts to users when they sign up
"Send birthday reminder for non-Family Hub users"

Impact:

External guests feature in Phase 1.5 cannot be fully implemented
Cannot track extended family birthdays/events
No contact migration path when someone signs up

Solution:
Add contacts table with cross-tenant linking:
sqlCREATE TABLE contacts (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    date_of_birth DATE,
    address TEXT,
    relationship_to_tenant VARCHAR(100),
    linked_user_id UUID,
    notes TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    FOREIGN KEY(tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
    FOREIGN KEY(linked_user_id) REFERENCES users (id) ON DELETE SET NULL
);
Estimated Effort: 5-7 days
Dependencies: TD-001 (Authentication - for contact ownership)
Related Issues: Phase 1.5 external guests feature

🟡 TD-004: Missing Cross-Tenant Event Invitations
Status: Planned (Phase 2)
Must Fix By: Phase 2
Priority: Important for multi-tenant events
Created: October 12, 2025
Issue:
No mechanism to invite users/contacts from other tenants to events.
Use Cases Blocked:

Invite sister (different tenant) to Christmas dinner
Joint family events across multiple households
Friend invitations to birthday parties
RSVP tracking for external guests

Solution:
Add event_invitations table:
sqlCREATE TABLE event_invitations (
    id UUID PRIMARY KEY,
    event_id UUID NOT NULL,
    invited_contact_id UUID,
    invited_user_id UUID,
    invited_email VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    response_date TIMESTAMP,
    FOREIGN KEY(event_id) REFERENCES calendar_events (id) ON DELETE CASCADE,
    FOREIGN KEY(invited_contact_id) REFERENCES contacts (id) ON DELETE CASCADE,
    FOREIGN KEY(invited_user_id) REFERENCES users (id) ON DELETE CASCADE
);
Estimated Effort: 1 week
Dependencies: TD-003 (Contacts table)
Related Issues: None yet

🟢 TD-005: Timezone Handling - Manual BST Conversion
Status: Active (Phase 1)
Must Fix By: Not critical, but should improve
Priority: Nice-to-have optimization
Created: October 12, 2025
Issue:
Manually subtracting 1 hour for BST in CalendarEventForm.tsx. Should use proper timezone library handling.
Current Code:
typescript// Line ~365 in CalendarEventForm.tsx
const startTimeUTC = startTime.subtract(1, 'hour').toISOString();
Impact:

Works correctly but not "proper" implementation
Manual calculation is error-prone for future developers
Doesn't handle GMT/BST transitions automatically
Not following dayjs timezone plugin best practices

Solution:
Use dayjs timezone plugin properly:
typescriptconst startTimeUTC = startTime.tz('Europe/London').utc().toISOString();
Estimated Effort: 1-2 hours
Dependencies: None
Related Issues: None - works fine currently, just not best practice

🟢 TD-006: No Database Seeding for Development
Status: Active (Phase 1)
Must Fix By: Phase 1.5
Priority: Nice-to-have for development efficiency
Created: October 12, 2025
Issue:
No seed data script to populate database with test data. Developers must manually create events/users for testing.
Impact:

Slow development (manual data entry)
Inconsistent test data across environments
Cannot quickly reset to known good state
New developers have empty database

Solution:
Create seed script: backend/scripts/seed_data.py
python# Populate with:
# - Brown family tenant
# - 4 family members (James, Nicola, Tommy, Harry)
# - Sample events (birthdays, school runs, football practice)
# - Sample tasks/chores
Estimated Effort: 2-3 hours
Dependencies: None
Related Issues: None

Resolved Technical Debt
✅ TD-000: Example - Resolved Issue Template
Status: Resolved (Date)
Resolution: Description of how it was fixed
Resolved By: Person/PR
Lessons Learned: What we learned from this

Decision Log
Sometimes technical debt is an intentional trade-off. Document why:
Decision: Hard-code Tenant ID in Phase 1
Date: October 12, 2025
Decision Makers: James Brown
Context: Phase 1 proof-of-concept with single family
Decision:
Hard-code Brown family tenant ID to focus on calendar features first. Implement proper authentication in Phase 1.5.
Rationale:

✅ Faster development (no auth system needed yet)
✅ Can test multi-tenancy architecture with real family data
✅ Proves concept before investing in auth infrastructure
✅ Family can start using immediately (dogfooding)
⚠️ Must fix before any production use outside Brown family
⚠️ Must fix before Phase 2 (multiple families)

Trade-offs:

Gained: 1-2 weeks faster MVP, immediate family usage
Cost: 1-2 weeks of refactoring in Phase 1.5

Review Date: Phase 1.5 start (estimated 4-6 weeks from now)

Decision: Manual BST Timezone Conversion
Date: October 12, 2025
Decision Makers: James Brown
Context: Need timezone handling for BST/GMT
Decision:
Use manual subtraction of 1 hour for BST instead of full dayjs timezone implementation.
Rationale:

✅ Simple and works correctly
✅ Easier to understand for beginner
✅ No additional configuration needed
⚠️ Not "best practice" but functional

Trade-offs:

Gained: Simplicity, immediate working solution
Cost: 1-2 hours of refactoring later (low priority)

Review Date: Phase 2 or when issues arise

Prioritization Framework
When deciding which debt to pay down:
Critical (Fix Immediately)

Blocks production deployment
Security vulnerability
Data loss risk
Cannot add new features

Important (Fix This Phase)

Blocks planned features this phase
Significantly slows development
User-facing quality issues
Accumulating interest (getting harder to fix)

Nice-to-have (Fix When Convenient)

Code quality improvements
Performance optimizations
Developer experience improvements
Not blocking anything


Review Schedule
Weekly: Review active debt during development
Phase End: Prioritize debt for next phase
Monthly: Update estimates and priorities
Next Review: End of Phase 1 (when calendar MVP complete)

How to Use This Document
Adding New Debt:

Choose next TD-XXX number
Copy template from examples above
Fill in all sections (don't skip Impact or Solution)
Add TODO comment in code referencing this document
Update "Last Updated" date at top

Resolving Debt:

Move entry from "Active" to "Resolved" section
Document solution and lessons learned
Remove TODO comments from code
Update related files list

Tracking Across Sessions:

Start each session by reviewing active debt
Reference TD-XXX numbers in commit messages
Link GitHub issues to debt items


Document Version: 1.0
Last Updated: October 12, 2025
Next Review: Phase 1 completion (estimated 2-4 weeks)
Owner: James Brown