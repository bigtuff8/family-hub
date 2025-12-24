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

### ✅ TD-003: External Contacts System
**Status:** ✅ RESOLVED (December 2025)
**Resolution:** Implemented external contacts table and management UI
**Resolved By:** Phase 2.1a Contacts Implementation

**Solution Implemented:**
- External contacts table with cross-tenant linking
- Contact management UI (CRUD operations)
- Birthday tracking for contacts
- Address book functionality

**Related Files:**
- `backend/services/contacts/routes.py`
- `frontend/src/features/contacts/`

---

### ✅ TD-004: Cross-Tenant Event Invitations
**Status:** ✅ RESOLVED (December 2025)
**Resolution:** Implemented event attendees and RSVP system
**Resolved By:** Phase 2.1b Event Attendees Implementation

**Solution Implemented:**
- Event invitations table for cross-tenant invites
- RSVP tracking for external guests
- Multi-tenant event participation

**Related Files:**
- `backend/services/events/routes.py`
- `frontend/src/features/events/`

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
**Status:** Planned (Phase 3)
**Must Fix By:** Phase 3 (Core Features)
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
| TD-003 | External contacts | 🟡 Important | ✅ Resolved | - |
| TD-004 | Cross-tenant invites | 🟡 Important | ✅ Resolved | - |

**Total Active Items:** 10 (0 Critical, 4 Important, 6 Nice-to-have)

---

## Review Schedule

- **Weekly:** Review active debt during development
- **Phase End:** Prioritize debt for next phase
- **Monthly:** Update estimates and priorities
- **Next Review:** End of Phase 2

---

**Document Version:** 4.0
**Last Updated:** December 23, 2025
**Next Review:** Phase 2 completion
**Owner:** James Brown
