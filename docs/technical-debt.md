# Technical Debt Register

This document tracks known technical debt, shortcuts, and future refactoring needs.

**Last Updated:** December 23, 2025
**Project Phase:** Phase 2 - Advanced Features
**Project:** Family Hub

**Legend:**
- 🔴 Critical (blocks production/scaling)
- 🟡 Important (should fix before Phase X)
- 🟢 Nice-to-have (optimize when time permits)

---

## Resolved Technical Debt ✅

### ✅ TD-001: Hard-coded Tenant ID
**Status:** ✅ RESOLVED (December 2025)
**Resolution:** Implemented JWT authentication with tenant_id in claims
**Resolved By:** Phase 1.5 Authentication Implementation

**Solution Implemented:**
- JWT authentication with `tenant_id` in token claims
- Auth context provider in React (`useAuth()` hook)
- `useAuth().user.tenant_id` replaces hard-coded value
- All API calls use dynamic tenant_id from auth context

**Related Files:**
- `frontend/src/features/auth/AuthContext.tsx`
- `backend/services/auth/routes.py`

---

### ✅ TD-005: Timezone Handling
**Status:** ✅ RESOLVED (December 2025)
**Resolution:** Implemented proper dayjs timezone plugin usage
**Resolved By:** Calendar refactoring

**Solution Implemented:**
- Using `dayjs.extend(utc)` and `dayjs.extend(timezone)`
- `dayjs.tz.setDefault('Europe/London')` for automatic BST/GMT handling
- Proper UTC conversion: `dayjs.utc(time).tz('Europe/London')`

---

### ✅ TD-006: Database Seeding
**Status:** ✅ RESOLVED (December 2025)
**Resolution:** Seed data implemented for development
**Resolved By:** Phase 1.5 Development

**Solution Implemented:**
- Brown family tenant seeded
- 4 family members (James, Nicola, Tommy, Harry)
- Sample events and data
- Shopping list with sample items

---

## Active Technical Debt

### ✅ TD-007: N+1 Query Problem in Shopping List
**Status:** ✅ RESOLVED (December 2025)
**Resolution:** Implemented batch user fetching with `get_users_by_ids()`
**Resolved By:** Tech debt cleanup session

**Solution Implemented:**
- Added `get_users_by_ids()` function in `crud.py` for batch fetching
- Updated `get_shopping_list` and `get_default_list` endpoints to use batch fetch
- Now fetches all users in single query instead of N queries

---

### ✅ TD-008: Missing Error Handling in Add Item
**Status:** ✅ RESOLVED (December 2025)
**Resolution:** Added try-catch with error message
**Resolved By:** Tech debt cleanup session

**Solution Implemented:**
- Wrapped `handleAddItem` in try-catch block
- Shows "Failed to add item" error message on failure

---

### 🟡 TD-009: Race Condition in Quick Add
**Status:** Active
**Priority:** Important
**Created:** December 21, 2025
**Files:** `ShoppingSnapshot.tsx`, `ShoppingListPage.tsx`

**Issue:**
Rapid button clicks or Enter presses can trigger multiple API requests before loading state takes effect.

**Solution:**
Disable input immediately before async call, or use debouncing.

**Estimated Effort:** 1 hour

---

### 🟡 TD-010: Missing Database Indexes
**Status:** Active
**Priority:** Important (Performance)
**Created:** December 21, 2025

**Issue:**
Queries on `name_normalized`, `category`, and `checked_at` don't have indexes. Will cause slow queries at scale.

**Solution:**
Add database indexes:
```sql
CREATE INDEX idx_shopping_items_name_normalized ON shopping_items(name_normalized);
CREATE INDEX idx_shopping_items_category ON shopping_items(category);
CREATE INDEX idx_shopping_items_checked_at ON shopping_items(checked_at);
```

**Estimated Effort:** 1 hour

---

### 🟡 TD-011: Type Inconsistency (Decimal vs Number)
**Status:** Active
**Priority:** Important
**Created:** December 21, 2025

**Issue:**
Backend uses Python `Decimal` for quantity, frontend uses `number`. Could cause precision issues.

**Files:**
- Backend: `backend/services/shopping/schemas.py`
- Frontend: `frontend/src/types/shopping.ts`

**Solution:**
Ensure consistent serialization or use string representation for decimals.

**Estimated Effort:** 2 hours

---

### 🟡 TD-012: Hardcoded Units Mismatch
**Status:** Active
**Priority:** Important
**Created:** December 21, 2025

**Issue:**
Frontend `EditItemModal.tsx` and backend `utils.py` have different unit lists.

**Solution:**
Fetch units from backend API or sync the lists.

**Estimated Effort:** 1 hour

---

### 🟢 TD-013: Missing Undo for Delete
**Status:** Active
**Priority:** Nice-to-have (UX)
**Created:** December 21, 2025

**Issue:**
Delete is permanent with no undo option. Accidental deletions cannot be recovered.

**Solution:**
Use Ant Design message with undo action, or implement soft delete with 30-second grace period.

**Estimated Effort:** 2-3 hours

---

### 🟢 TD-014: No Loading State for Item Toggle
**Status:** Active
**Priority:** Nice-to-have (UX)
**Created:** December 21, 2025
**File:** `frontend/src/features/shopping/ShoppingItem.tsx`

**Issue:**
Checkbox doesn't show loading state while API call is in progress. Can cause race conditions with rapid clicks.

**Solution:**
Add loading state to checkbox, disable during API call.

**Estimated Effort:** 1 hour

---

### 🟢 TD-015: No Confirmation for Bulk Complete
**Status:** Active
**Priority:** Nice-to-have (UX)
**Created:** December 21, 2025
**File:** `frontend/src/features/shopping/ShoppingListPage.tsx`

**Issue:**
"Complete Shop" button marks all items without confirmation.

**Solution:**
Add confirmation modal: "Mark X items as complete?"

**Estimated Effort:** 30 minutes

---

### 🟢 TD-016: Accessibility - Hidden Edit Buttons
**Status:** Active
**Priority:** Nice-to-have (Accessibility)
**Created:** December 21, 2025
**Files:** `ShoppingItem.css`, `ShoppingSnapshot.css`

**Issue:**
Edit/delete buttons use `opacity: 0` on hover, invisible to keyboard users.

**Solution:**
Use `visibility: hidden` or show buttons on keyboard focus.

**Estimated Effort:** 1 hour

---

### 🟢 TD-017: Unbounded Emoji Input
**Status:** Active
**Priority:** Nice-to-have
**Created:** December 21, 2025
**File:** `frontend/src/features/shopping/EmojiPicker.tsx`

**Issue:**
Custom emoji input allows non-emoji text to be entered.

**Solution:**
Add validation that input is actually an emoji.

**Estimated Effort:** 1 hour

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
```

**Estimated Effort:** 3-5 days
**Dependencies:** None

---

### 🟡 TD-003: Missing External Contacts System
**Status:** Planned (Phase 2)
**Must Fix By:** Phase 2
**Priority:** Important for external guest invitations
**Created:** October 12, 2025

**Issue:**
No way to store contacts outside the tenant (e.g., extended family, friends who don't have accounts).

**Use Cases Blocked:**
- Track sister's birthday (she's not in your tenant)
- Invite external guests to events
- Address book for family
- Migrate contacts to users when they sign up

**Solution:**
Add `contacts` table with cross-tenant linking.

**Estimated Effort:** 5-7 days
**Dependencies:** None

---

### 🟡 TD-004: Missing Cross-Tenant Event Invitations
**Status:** Planned (Phase 2)
**Must Fix By:** Phase 2
**Priority:** Important for multi-tenant events
**Created:** October 12, 2025

**Issue:**
No mechanism to invite users/contacts from other tenants to events.

**Use Cases Blocked:**
- Invite sister (different tenant) to Christmas dinner
- Joint family events across multiple households
- Friend invitations to birthday parties
- RSVP tracking for external guests

**Solution:**
Add `event_invitations` table.

**Estimated Effort:** 1 week
**Dependencies:** TD-003 (Contacts table)

---


### 🟢 TD-018: Emoji Characters for Icons
**Status:** ✅ RESOLVED (December 23, 2025)
**Resolution:** Replaced emoji characters with Ant Design icons and SVG
**Resolved By:** Icon rendering fix session

**Issue:**
Emoji characters (☀️, ➕, 📅, 👥) used in Quick Actions and Weather widget don't render properly on Pi browser due to missing emoji fonts.

**Solution Implemented:**
- Replace emoji characters with Ant Design icons: `<PlusOutlined />`, `<CalendarOutlined />`, `<TeamOutlined />`
- Replace weather emoji with inline SVG for consistent cross-platform rendering
- **Best Practice:** Always use icon libraries (Ant Design icons) or SVG instead of emoji for UI elements

**Related Files:**
- `frontend/src/features/calendar/CalendarTablet.tsx`
- `frontend/src/features/calendar/CalendarMobile.tsx`

---

### 🟢 TD-019: API Response Snake_case Consistency
**Status:** ✅ RESOLVED (December 23, 2025)
**Resolution:** Standardized on snake_case for API data
**Resolved By:** Event attendees feature development

**Issue:**
Frontend code was mixing camelCase (`startTime`) and snake_case (`start_time`) when accessing API response data, causing undefined values.

**Solution Implemented:**
- Backend returns snake_case (e.g., `start_time`, `end_time`, `all_day`)
- Frontend uses snake_case when accessing API response properties
- Don't convert to camelCase unnecessarily - use the format the API returns
- **Best Practice:** Keep consistent naming: API returns snake_case, frontend uses snake_case for API data

**Related Files:**
- `frontend/src/features/calendar/CalendarEventForm.tsx`
- `frontend/src/features/calendar/CalendarTablet.tsx`

---

### 🟢 TD-020: Missing Attendees in API Responses
**Status:** ✅ RESOLVED (December 23, 2025)
**Resolution:** Added selectinload for eager loading attendees
**Resolved By:** Event attendees feature development

**Issue:**
Calendar event API responses weren't including attendees data because SQLAlchemy relationships weren't being eagerly loaded.

**Solution Implemented:**
- Added `selectinload(CalendarEvent.attendees).selectinload(EventAttendee.contact)` to queries
- Created `serialize_attendees()` helper function to convert ORM objects to dict
- Explicitly include attendees in all event API responses
- **Best Practice:** Always use `selectinload()` for nested relationships and explicitly serialize related objects

**Related Files:**
- `backend/services/calendar/routes.py`

---

## Decision Log

### Decision: Hard-code Tenant ID in Phase 1
**Date:** October 12, 2025
**Decision Makers:** James Brown
**Status:** ✅ Resolved in Phase 1.5

Original decision to hard-code tenant ID was successful - allowed faster MVP development. Properly resolved with authentication system in Phase 1.5.

---

### Decision: Manual BST Timezone Conversion
**Date:** October 12, 2025
**Decision Makers:** James Brown
**Status:** ✅ Resolved

Originally used manual 1-hour subtraction for BST. Now properly resolved with dayjs timezone plugin.

---

## Prioritization Framework

**Critical (Fix Immediately)**
- Blocks production deployment
- Security vulnerability
- Data loss risk
- Cannot add new features

**Important (Fix This Phase)**
- Blocks planned features this phase
- Significantly slows development
- User-facing quality issues
- Accumulating interest (getting harder to fix)

**Nice-to-have (Fix When Convenient)**
- Code quality improvements
- Performance optimizations
- Developer experience improvements
- Not blocking anything

---

## Summary Table

| ID | Issue | Priority | Status | Effort |
|----|-------|----------|--------|--------|
| TD-001 | Hard-coded tenant_id | 🔴 Critical | ✅ Resolved | - |
| TD-005 | Timezone handling | 🟢 Nice-to-have | ✅ Resolved | - |
| TD-006 | Database seeding | 🟢 Nice-to-have | ✅ Resolved | - |
| TD-007 | N+1 query problem | 🔴 Critical | ✅ Resolved | - |
| TD-008 | Missing error handling | 🔴 Critical | ✅ Resolved | - |
| TD-009 | Race condition quick add | 🟡 Important | Active | 1 hr |
| TD-010 | Missing DB indexes | 🟡 Important | Active | 1 hr |
| TD-011 | Decimal vs Number types | 🟡 Important | Active | 2 hrs |
| TD-012 | Units list mismatch | 🟡 Important | Active | 1 hr |
| TD-013 | Missing undo for delete | 🟢 Nice-to-have | Active | 2-3 hrs |
| TD-014 | No toggle loading state | 🟢 Nice-to-have | Active | 1 hr |
| TD-015 | No bulk complete confirm | 🟢 Nice-to-have | Active | 30 min |
| TD-016 | Hidden buttons a11y | 🟢 Nice-to-have | Active | 1 hr |
| TD-017 | Unbounded emoji input | 🟢 Nice-to-have | Active | 1 hr |
| TD-002 | Family relationships | 🟡 Important | Planned | 3-5 days |
| TD-003 | External contacts | 🟡 Important | Planned | 5-7 days |
| TD-004 | Cross-tenant invites | 🟡 Important | Planned | 1 week |
| TD-018 | Emoji icons rendering | 🟢 Nice-to-have | ✅ Resolved | - |
| TD-019 | Snake_case consistency | 🟢 Nice-to-have | ✅ Resolved | - |
| TD-020 | Missing attendees in API | 🟢 Nice-to-have | ✅ Resolved | - |

**Total Active Items:** 12 (0 Critical, 5 Important, 7 Nice-to-have)

---

## Review Schedule

- **Weekly:** Review active debt during development
- **Phase End:** Prioritize debt for next phase
- **Monthly:** Update estimates and priorities
- **Next Review:** End of Phase 2

---

**Document Version:** 3.0
**Last Updated:** December 23, 2025
**Next Review:** Phase 2 completion
**Owner:** James Brown
