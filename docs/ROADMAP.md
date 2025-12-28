# Family Hub Development Roadmap

**Project:** Family Hub - DIY Raspberry Pi Family Organization System
**Start Date:** October 2025
**Current Phase:** Phase 2 - Integration & Sync
**Last Updated:** December 27, 2025

---

## Current Status & Next Steps

### Status Summary
```
Phase 1 (Calendar MVP)     ✅ COMPLETE (November 2025)
Phase 1.5 (Authentication) ✅ COMPLETE (December 2025)
Phase 2 (Integration)      🔄 IN PROGRESS
  ├── Shopping Lists       ✅ COMPLETE
  ├── Basic Contacts       ✅ COMPLETE
  └── Calendar/Contact Sync 📋 DESIGNED - Ready to implement
```

### Architecture Decisions (December 27, 2025)

Major architectural changes were made to the calendar and contacts sync approach:

| Feature | Original Design | New Design |
|---------|----------------|------------|
| Calendar Sync | Bidirectional sync with external calendars | **Invite-based** - Family Hub is source of truth |
| Event Editing | Edit anywhere, sync conflicts | Edit **only in app**, external calendars respond only |
| Organizer | N/A | Dedicated **Outlook account** sends all invites |
| Contacts | Tenant-wide contacts | **User-specific** contacts with "Publish to Family" |
| Invitee Selection | Manual email entry | **Smart lookup** with typeahead search |

### Design Documents

| Document | Purpose | Location |
|----------|---------|----------|
| Calendar Sync Design | Invite-based calendar, response tracking, organizer account | `docs/design/phase2-calendar-sync.md` |
| Contacts Sync Design | User-owned contacts, publish to family, smart lookup | `docs/design/phase2-contacts-sync.md` |
| Alexa Integration Design | Shopping list voice integration | `docs/design/phase2-alexa-integration.md` |

### Implementation Plan (Next Steps)

**Foundation (Build First):**
1. Database migrations for new tables (contacts, event_invites, parental_controls, etc.)
2. Core Contacts CRUD (user-owned contacts)
3. Publish to Family functionality

**Smart Lookup:**
4. `/contacts/lookup` API endpoint
5. SmartContactSearch component (typeahead)

**Calendar Events:**
6. Organizer Account Setup (Outlook)
7. Event creation with invites
8. Response tracking

**External Sync:**
9. Google Contacts sync
10. User calendar sync (unified view)

---

## Project Vision

Build a comprehensive, customizable family organization system as an open-source alternative to commercial products. Start with proof-of-concept for Brown family, architect for future multi-tenant SaaS scaling.

**Target Users:**
- Phases 1-4: Brown family (single tenant, feature development)
- Phase 5: Commercial SaaS (100+ families)

**Key Principles:**
- Zero development cost
- Multi-tenant architecture from day 1
- Progressive enhancement (core first, features methodically)
- Privacy-focused (self-hosting option)

---

## Phase Overview

```
Phase 1     Phase 1.5    Phase 2       Phase 3      Phase 4      Phase 5
┌────────┐  ┌────────┐   ┌──────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
│Calendar│─►│  Auth  │──►│Integration│─►│  Core   │─►│ Mobile  │─►│Commercial│
│  MVP   │  │        │   │  & Sync   │  │Features │  │ & Polish│  │  SaaS   │
└────────┘  └────────┘   └──────────┘  └─────────┘  └─────────┘  └─────────┘
    ✅          ✅        ↑ CURRENT
```

---

## Phase 1: MVP Calendar ✅ COMPLETE

**Goal:** Functional calendar for Brown family use
**Status:** ✅ Complete (November 2025)

### 1.1 Calendar Management

| ID | Requirement | Status |
|----|-------------|--------|
| REQ-1.001 | Unified family calendar view | ✅ Done |
| REQ-1.002 | Colour-coded events by family member | ✅ Done |
| REQ-1.003 | Add events via touchscreen | ✅ Done |
| REQ-1.004 | Edit events via touchscreen | ✅ Done |
| REQ-1.005 | Delete events with confirmation | ✅ Done |
| REQ-1.006 | Recurring event support | ✅ Done |
| REQ-1.007 | Monthly calendar view | ✅ Done |
| REQ-1.008 | Weekly calendar view | ✅ Done |
| REQ-1.009 | Daily calendar view | ✅ Done |
| REQ-1.010 | All-day events toggle | ✅ Done |
| REQ-1.011 | Event lead selection with color inheritance | ✅ Done |
| REQ-1.012 | Family attendees multi-select | ✅ Done |
| REQ-1.013 | Address search (getAddress.io postcode lookup) | ✅ Done |
| REQ-1.014 | Event title field | ✅ Done |
| REQ-1.015 | Event description field | ✅ Done |
| REQ-1.016 | Event start date/time | ✅ Done |
| REQ-1.017 | Event end date/time | ✅ Done |
| REQ-1.018 | 30-minute auto-duration on date change | ✅ Done |
| REQ-1.019 | Color picker with family presets | ✅ Done |
| REQ-1.020 | Today's schedule view (detailed) | ✅ Done |
| REQ-1.021 | Upcoming events list view | ✅ Done |
| REQ-1.022 | Form validation | ✅ Done |
| REQ-1.023 | Error handling | ✅ Done |
| REQ-1.024 | Loading states | ✅ Done |
| REQ-1.025 | Empty states | ✅ Done |

### 1.2 Infrastructure

| ID | Requirement | Status |
|----|-------------|--------|
| REQ-1.026 | Docker containerization | ✅ Done |
| REQ-1.027 | Docker Compose orchestration | ✅ Done |
| REQ-1.028 | PostgreSQL database | ✅ Done |
| REQ-1.029 | Multi-tenant database structure | ✅ Done |
| REQ-1.030 | FastAPI backend | ✅ Done |
| REQ-1.031 | React 18 frontend | ✅ Done |
| REQ-1.032 | TypeScript | ✅ Done |
| REQ-1.033 | Ant Design component library | ✅ Done |
| REQ-1.034 | Vite build tool | ✅ Done |
| REQ-1.035 | Horizon design system (Navy/Teal/Coral/Cream) | ✅ Done |
| REQ-1.036 | Tablet landing page | ✅ Done |
| REQ-1.037 | Responsive design (tablet) | ✅ Done |
| REQ-1.038 | Responsive design (mobile) | ✅ Done |
| REQ-1.039 | Timezone handling (BST/GMT with dayjs) | ✅ Done |
| REQ-1.040 | Technical debt tracking system | ✅ Done |
| REQ-1.041 | Git version control | ✅ Done |
| REQ-1.042 | GitHub repository | ✅ Done |
| REQ-1.043 | Pi auto-deploy via GitHub Actions | ✅ Done |

---

## Phase 1.5: Authentication ✅ COMPLETE

**Goal:** Production-ready authentication + mobile access
**Status:** ✅ Complete (December 2025)

### 1.5.1 User Authentication

| ID | Requirement | Status |
|----|-------------|--------|
| REQ-1.5.001 | User login (email/password) | ✅ Done |
| REQ-1.5.002 | JWT token authentication | ✅ Done |
| REQ-1.5.003 | JWT refresh tokens | ✅ Done |
| REQ-1.5.004 | User registration (creates tenant) | ✅ Done |
| REQ-1.5.005 | Logout functionality | ✅ Done |
| REQ-1.5.006 | Protected routes | ✅ Done |
| REQ-1.5.007 | Auth context provider (useAuth hook) | ✅ Done |
| REQ-1.5.008 | Redirect unauthenticated users to login | ✅ Done |

### 1.5.2 User Management

| ID | Requirement | Status |
|----|-------------|--------|
| REQ-1.5.009 | User roles (Admin/Member/Child) | ✅ Done |
| REQ-1.5.010 | User profile (name) | ✅ Done |
| REQ-1.5.011 | User avatar (initials + colors) | ✅ Done |
| REQ-1.5.012 | User colour assignment | ✅ Done |
| REQ-1.5.013 | Tenant association per user | ✅ Done |
| REQ-1.5.014 | Tenant isolation (users see only their family data) | ✅ Done |
| REQ-1.5.015 | Dynamic tenant_id from auth (TD-001 fixed) | ✅ Done |
| REQ-1.5.016 | Database seeding script | ✅ Done |
| REQ-1.5.017 | Brown family seed data | ✅ Done |
| REQ-1.5.018 | Mobile header with user avatar | ✅ Done |
| REQ-1.5.019 | Touch-friendly UI elements | ✅ Done |
| REQ-1.5.020 | Toast notifications (Ant Design message) | ✅ Done |

---

## Phase 2: Integration & Sync 🔄 IN PROGRESS

**Goal:** External integrations and unified data across platforms
**Status:** In Progress (Started December 2025)
**Design Documents:** `docs/design/phase2-calendar-sync.md`, `docs/design/phase2-contacts-sync.md`

### 2.0 Mobile Access

| ID | Requirement | Status |
|----|-------------|--------|
| REQ-2.001 | Tailscale setup for remote access | ❌ Not started |
| REQ-2.002 | Reverse proxy configuration | ❌ Not started |
| REQ-2.003 | PWA manifest file | ❌ Not started |
| REQ-2.004 | Service worker for offline support | ❌ Not started |
| REQ-2.005 | PWA installable on mobile | ❌ Not started |
| REQ-2.006 | Offline shopping list access | ❌ Not started |

### 2.1 Contacts (User-Owned) - ARCHITECTURE UPDATED

| ID | Requirement | Status |
|----|-------------|--------|
| REQ-2.007 | User-owned contacts table (not tenant-wide) | 📋 Designed |
| REQ-2.008 | Contact create form | ✅ Done (needs migration) |
| REQ-2.009 | Contact edit form | ✅ Done (needs migration) |
| REQ-2.010 | Contact delete with confirmation | ✅ Done |
| REQ-2.011 | Contact address/postcode search | ✅ Done |
| REQ-2.012 | Contact phone with country code selector | ✅ Done |
| REQ-2.013 | Contact email field | ✅ Done |
| REQ-2.014 | Contact birthday tracking | ✅ Done |
| REQ-2.015 | Contact anniversary tracking | ✅ Done |
| REQ-2.016 | Contact favorites | ✅ Done |
| REQ-2.017 | Contact search | ✅ Done |
| REQ-2.018 | "Publish to Family" feature | 📋 Designed |
| REQ-2.019 | Family contacts shared bucket | 📋 Designed |
| REQ-2.020 | Smart contact lookup (typeahead) | 📋 Designed |
| REQ-2.021 | Prompt to create contact when inviting new email | 📋 Designed |
| REQ-2.022 | My Contacts vs Family Contacts tabs | 📋 Designed |
| REQ-2.023 | Sync from Google Contacts (user-specific) | 📋 Designed |
| REQ-2.024 | Sync from iCloud Contacts (user-specific) | 📋 Designed |
| REQ-2.025 | Sync from Outlook Contacts (user-specific) | 📋 Designed |

### 2.2 Calendar Sync - ARCHITECTURE UPDATED

| ID | Requirement | Status |
|----|-------------|--------|
| REQ-2.026 | Dedicated Outlook organizer account | 📋 Designed |
| REQ-2.027 | Family Hub as source of truth for events | 📋 Designed |
| REQ-2.028 | Event invites table (tracks responses) | 📋 Designed |
| REQ-2.029 | Send invites to all invitees via organizer | 📋 Designed |
| REQ-2.030 | Response tracking (Accept/Decline/Tentative) | 📋 Designed |
| REQ-2.031 | Response sync from organizer calendar | 📋 Designed |
| REQ-2.032 | Amendments only in app (external = response only) | 📋 Designed |
| REQ-2.033 | User email accounts table | 📋 Designed |
| REQ-2.034 | Default email per user for invites | 📋 Designed |
| REQ-2.035 | User connects own calendars (Google/iCloud/Outlook) | 📋 Designed |
| REQ-2.036 | Unified calendar view (Hub + external events) | 📋 Designed |
| REQ-2.037 | External events read-only in app | 📋 Designed |
| REQ-2.038 | Event source badges (Hub/Google/iCloud) | 📋 Designed |
| REQ-2.039 | FamilyHubEventId extended property for tracking | 📋 Designed |

### 2.3 Parental Controls

| ID | Requirement | Status |
|----|-------------|--------|
| REQ-2.040 | Parent-child relationship table | 📋 Designed |
| REQ-2.041 | Parents can view children's calendars | 📋 Designed |
| REQ-2.042 | Parents can view children's contacts | 📋 Designed |
| REQ-2.043 | Parents can respond to invites for minors | 📋 Designed |
| REQ-2.044 | Parents can manage children's contacts | 📋 Designed |

### 2.4 Shopping Lists ✅ COMPLETE

| ID | Requirement | Status |
|----|-------------|--------|
| REQ-2.045 | Default shopping list per tenant | ✅ Done |
| REQ-2.046 | Add shopping item | ✅ Done |
| REQ-2.047 | Edit shopping item | ✅ Done |
| REQ-2.048 | Delete shopping item | ✅ Done |
| REQ-2.049 | Item categories with icons | ✅ Done |
| REQ-2.050 | Check-off items (toggle) | ✅ Done |
| REQ-2.051 | Item quantity support | ✅ Done |
| REQ-2.052 | Item unit support (kg, pack, bunch) | ✅ Done |
| REQ-2.053 | Shopping list full page (/shopping route) | ✅ Done |
| REQ-2.054 | ShoppingSnapshot dashboard widget | ✅ Done |
| REQ-2.055 | Quick-add from dashboard | ✅ Done |
| REQ-2.056 | Items grouped by category | ✅ Done |
| REQ-2.057 | Per-tenant custom categories (database-backed) | ✅ Done |
| REQ-2.058 | Custom category emoji icons | ✅ Done |
| REQ-2.059 | Custom category colors | ✅ Done |
| REQ-2.060 | Keyword-based auto-categorization | ✅ Done |
| REQ-2.061 | Category reordering | ✅ Done |
| REQ-2.062 | Complete Shop (bulk mark all checked) | ✅ Done |
| REQ-2.063 | 24-hour auto-hide for checked items | ✅ Done |
| REQ-2.064 | Duplicate detection with confirmation | ✅ Done |
| REQ-2.065 | Duplicate merge (add quantities together) | ✅ Done |
| REQ-2.066 | Track who added each item | ✅ Done |
| REQ-2.067 | Track item source (manual/alexa/recipe) | ✅ Done |
| REQ-2.068 | Mobile-optimized list (large touch targets) | ✅ Done |

### 2.5 Alexa Integration

| ID | Requirement | Status |
|----|-------------|--------|
| REQ-2.069 | Add shopping items via Alexa voice | ❌ Not started |
| REQ-2.070 | Alexa Shopping List API integration | ❌ Not started |
| REQ-2.071 | One-way sync (Alexa → Family Hub) | ❌ Not started |
| REQ-2.072 | Alexa skill development | ❌ Not started |
| REQ-2.073 | Calendar queries via Alexa | ❌ Not started |
| REQ-2.074 | Two-way Alexa sync | ❌ Not started |

### Success Criteria

Phase 2 is complete when:
- ⬜ User-owned contacts with publish to family working
- ⬜ Smart contact lookup for event invitations
- ⬜ Calendar invites sending via organizer account
- ⬜ Response tracking from external calendars
- ⬜ At least one external provider sync working (Google)
- ⬜ Family actively using integrations

---

## Phase 3: Core Features

**Goal:** Essential family organization features
**Status:** Planned

### 3.1 Tasks & Chores

| ID | Requirement | Status |
|----|-------------|--------|
| REQ-3.001 | Task create | ❌ Not started |
| REQ-3.002 | Task edit | ❌ Not started |
| REQ-3.003 | Task delete | ❌ Not started |
| REQ-3.004 | Task list view | ❌ Not started |
| REQ-3.005 | Assign task to family member | ❌ Not started |
| REQ-3.006 | Task due date | ❌ Not started |
| REQ-3.007 | Task reminders | ❌ Not started |
| REQ-3.008 | Recurring chores (e.g., "every Tuesday") | ❌ Not started |
| REQ-3.009 | Task completion tracking | ❌ Not started |
| REQ-3.010 | Task status (pending/in progress/complete) | ❌ Not started |
| REQ-3.011 | Task categories (chore/homework/personal) | ❌ Not started |
| REQ-3.012 | Task dashboard widget | ❌ Not started |
| REQ-3.013 | Age-appropriate task visibility | ❌ Not started |
| REQ-3.014 | Task created by tracking | ❌ Not started |
| REQ-3.015 | Chore assignment history | ❌ Not started |

### 3.2 Chore Gamification

| ID | Requirement | Status |
|----|-------------|--------|
| REQ-3.016 | Point system for completed tasks | ❌ Not started |
| REQ-3.017 | Points value per task | ❌ Not started |
| REQ-3.018 | Reward tiers/milestones | ❌ Not started |
| REQ-3.019 | Visual progress tracking | ❌ Not started |
| REQ-3.020 | Family leaderboard (optional/configurable) | ❌ Not started |
| REQ-3.021 | Achievement badges | ❌ Not started |
| REQ-3.022 | Reward redemption system | ❌ Not started |
| REQ-3.023 | Parents define available rewards | ❌ Not started |
| REQ-3.024 | Points transaction history | ❌ Not started |

### 3.3 Meal Planning

| ID | Requirement | Status |
|----|-------------|--------|
| REQ-3.025 | Weekly meal planner grid | ❌ Not started |
| REQ-3.026 | Breakfast slot per day | ❌ Not started |
| REQ-3.027 | Lunch slot per day | ❌ Not started |
| REQ-3.028 | Dinner slot per day | ❌ Not started |
| REQ-3.029 | Snack slots (optional) | ❌ Not started |
| REQ-3.030 | Recipe storage | ❌ Not started |
| REQ-3.031 | Recipe title | ❌ Not started |
| REQ-3.032 | Recipe description | ❌ Not started |
| REQ-3.033 | Recipe ingredients list | ❌ Not started |
| REQ-3.034 | Recipe instructions (step-by-step) | ❌ Not started |
| REQ-3.035 | Recipe prep time | ❌ Not started |
| REQ-3.036 | Recipe cook time | ❌ Not started |
| REQ-3.037 | Recipe servings | ❌ Not started |
| REQ-3.038 | Recipe image | ❌ Not started |
| REQ-3.039 | Recipe source attribution | ❌ Not started |
| REQ-3.040 | Recipe tags (Italian, Quick, Kid-friendly) | ❌ Not started |
| REQ-3.041 | Ingredient name | ❌ Not started |
| REQ-3.042 | Ingredient quantity | ❌ Not started |
| REQ-3.043 | Ingredient unit | ❌ Not started |
| REQ-3.044 | Ingredient category (for shopping grouping) | ❌ Not started |
| REQ-3.045 | Optional ingredient flag | ❌ Not started |
| REQ-3.046 | Manual recipe entry form | ❌ Not started |
| REQ-3.047 | Magic Import (photo → recipe via OCR/AI) | ❌ Not started |
| REQ-3.048 | URL recipe import (web scraping) | ❌ Not started |
| REQ-3.049 | Auto-generate shopping list from meal plan | ❌ Not started |
| REQ-3.050 | "Add to shopping list" button on recipe | ❌ Not started |
| REQ-3.051 | Ingredient selection before adding to list | ❌ Not started |
| REQ-3.052 | Quantity scaling (adjust servings) | ❌ Not started |
| REQ-3.053 | Meal history | ❌ Not started |
| REQ-3.054 | Favorite meals | ❌ Not started |
| REQ-3.055 | Meal rotation suggestions | ❌ Not started |
| REQ-3.056 | Dietary preferences/restrictions | ❌ Not started |

### 3.4 Family Relationships

| ID | Requirement | Status |
|----|-------------|--------|
| REQ-3.057 | Define parent relationship | ❌ Not started |
| REQ-3.058 | Define child relationship | ❌ Not started |
| REQ-3.059 | Define partner relationship | ❌ Not started |
| REQ-3.060 | Define sibling relationship | ❌ Not started |
| REQ-3.061 | Family tree visualization | ❌ Not started |
| REQ-3.062 | Emergency contacts auto-populated from relationships | ❌ Not started |
| REQ-3.063 | "Notify parents when task done" | ❌ Not started |

### 3.5 Cross-Tenant Invites

| ID | Requirement | Status |
|----|-------------|--------|
| REQ-3.064 | Invite users from other households to events | ❌ Not started |
| REQ-3.065 | RSVP tracking for cross-tenant invites | ❌ Not started |
| REQ-3.066 | Shared event visibility across tenants | ❌ Not started |

### 3.6 Weather

| ID | Requirement | Status |
|----|-------------|--------|
| REQ-3.067 | Weather widget on dashboard | ❌ Not started |
| REQ-3.068 | Current weather conditions display | ❌ Not started |
| REQ-3.069 | 5-7 day forecast | ❌ Not started |
| REQ-3.070 | Weather alerts/warnings | ❌ Not started |
| REQ-3.071 | Location-based weather (configurable) | ❌ Not started |
| REQ-3.072 | OpenWeatherMap API integration | ❌ Not started |
| REQ-3.073 | Weather per-event (forecast at event time) | ❌ Not started |
| REQ-3.074 | Weather per-event (forecast at event location) | ❌ Not started |
| REQ-3.075 | Weather icon on calendar event cards | ❌ Not started |
| REQ-3.076 | Weather lookup when creating events | ❌ Not started |
| REQ-3.077 | Weather API response caching | ❌ Not started |
| REQ-3.078 | Click weather widget → detailed forecast | ❌ Not started |
| REQ-3.079 | Link to external weather app option | ❌ Not started |

### 3.7 Kitchen Timers

| ID | Requirement | Status |
|----|-------------|--------|
| REQ-3.080 | Multiple concurrent timers | ❌ Not started |
| REQ-3.081 | Named/labelled timers | ❌ Not started |
| REQ-3.082 | Visual timer alerts | ❌ Not started |
| REQ-3.083 | Audio timer alerts | ❌ Not started |
| REQ-3.084 | Quick preset: 1 minute | ❌ Not started |
| REQ-3.085 | Quick preset: 3 minutes | ❌ Not started |
| REQ-3.086 | Quick preset: 5 minutes | ❌ Not started |
| REQ-3.087 | Quick preset: 10 minutes | ❌ Not started |
| REQ-3.088 | Quick preset: 15 minutes | ❌ Not started |
| REQ-3.089 | Quick preset: 30 minutes | ❌ Not started |
| REQ-3.090 | Custom timer duration | ❌ Not started |
| REQ-3.091 | Timer dashboard widget | ❌ Not started |

### 3.8 Family Directory

| ID | Requirement | Status |
|----|-------------|--------|
| REQ-3.092 | Emergency contacts list | ❌ Not started |
| REQ-3.093 | Babysitter contacts | ❌ Not started |
| REQ-3.094 | Doctor/GP contacts | ❌ Not started |
| REQ-3.095 | School contacts | ❌ Not started |
| REQ-3.096 | Contact category/type field | ❌ Not started |

### 3.9 List Types

| ID | Requirement | Status |
|----|-------------|--------|
| REQ-3.097 | Packing list category | ❌ Not started |
| REQ-3.098 | Multiple list support (grocery, household, etc.) | ❌ Not started |

---

## Phase 4: Polish & Mobile

**Goal:** Native mobile experience and notifications
**Status:** Planned

### 4.1 Mobile Native Apps

| ID | Requirement | Status |
|----|-------------|--------|
| REQ-4.001 | React Native iOS app | ❌ Not started |
| REQ-4.002 | React Native Android app | ❌ Not started |
| REQ-4.003 | Shared codebase with web where possible | ❌ Not started |
| REQ-4.004 | App Store submission | ❌ Not started |
| REQ-4.005 | Play Store submission | ❌ Not started |

### 4.2 Notifications & Reminders

| ID | Requirement | Status |
|----|-------------|--------|
| REQ-4.006 | Push notifications for events | ❌ Not started |
| REQ-4.007 | Task reminder notifications | ❌ Not started |
| REQ-4.008 | Shopping list reminders | ❌ Not started |
| REQ-4.009 | On-screen alerts for upcoming events | ❌ Not started |
| REQ-4.010 | Sound notifications (configurable) | ❌ Not started |
| REQ-4.011 | Reminder cadence options (5/15/60 min before) | ❌ Not started |
| REQ-4.012 | Priority levels (urgent/normal/low) | ❌ Not started |
| REQ-4.013 | Do Not Disturb mode (time-based) | ❌ Not started |
| REQ-4.014 | Event reminders/notifications | ❌ Not started |

### 4.3 Analytics Dashboard

| ID | Requirement | Status |
|----|-------------|--------|
| REQ-4.015 | Family activity insights | ❌ Not started |
| REQ-4.016 | Meal/shopping trends | ❌ Not started |
| REQ-4.017 | Task completion stats | ❌ Not started |

### 4.4 Photo Slideshow

| ID | Requirement | Status |
|----|-------------|--------|
| REQ-4.018 | Display photos during idle time | ❌ Not started |
| REQ-4.019 | Configurable slideshow timing | ❌ Not started |
| REQ-4.020 | Photo upload via mobile | ❌ Not started |
| REQ-4.021 | Photo upload via web interface | ❌ Not started |
| REQ-4.022 | Album/folder organization | ❌ Not started |
| REQ-4.023 | Date/event-based photo filtering | ❌ Not started |
| REQ-4.024 | Photo captions | ❌ Not started |

### 4.5 Display Features

| ID | Requirement | Status |
|----|-------------|--------|
| REQ-4.025 | Screen sleep mode (60s inactivity) | ❌ Not started |
| REQ-4.026 | Pi reboot schedule (WiFi stability) | ❌ Not started |

### 4.6 User Enhancements

| ID | Requirement | Status |
|----|-------------|--------|
| REQ-4.027 | Avatar photos for users (not just initials) | ❌ Not started |
| REQ-4.028 | Avatar photos for contacts | ❌ Not started |

---

## Phase 5: Commercial SaaS

**Goal:** Production-ready commercial offering
**Status:** Future Planning

### 5.1 Cloud Deployment

| ID | Requirement | Status |
|----|-------------|--------|
| REQ-5.001 | Cloud deployment (Fly.io/Railway/Azure) | ❌ Not started |
| REQ-5.002 | Production database migration | ❌ Not started |
| REQ-5.003 | Automated daily backups | ❌ Not started |
| REQ-5.004 | Monitoring and logging | ❌ Not started |
| REQ-5.005 | CI/CD pipeline for cloud | ❌ Not started |
| REQ-5.006 | 99.9% uptime target | ❌ Not started |
| REQ-5.007 | Horizontal scaling capability | ❌ Not started |
| REQ-5.008 | Database redundancy | ❌ Not started |

### 5.2 Billing & Subscriptions

| ID | Requirement | Status |
|----|-------------|--------|
| REQ-5.009 | Stripe integration | ❌ Not started |
| REQ-5.010 | Free subscription tier | ❌ Not started |
| REQ-5.011 | Pro subscription tier | ❌ Not started |
| REQ-5.012 | Family subscription tier | ❌ Not started |
| REQ-5.013 | Billing portal | ❌ Not started |
| REQ-5.014 | Usage limits per tier | ❌ Not started |
| REQ-5.015 | Billing information storage | ❌ Not started |
| REQ-5.016 | Feature flags per tier | ❌ Not started |

### 5.3 User Onboarding

| ID | Requirement | Status |
|----|-------------|--------|
| REQ-5.017 | Welcome flow / tutorials | ❌ Not started |
| REQ-5.018 | Email marketing (welcome emails) | ❌ Not started |
| REQ-5.019 | Help documentation | ❌ Not started |

### 5.4 Marketing

| ID | Requirement | Status |
|----|-------------|--------|
| REQ-5.020 | Marketing website | ❌ Not started |
| REQ-5.021 | Documentation site | ❌ Not started |
| REQ-5.022 | Customer testimonials | ❌ Not started |

### 5.5 Compliance

| ID | Requirement | Status |
|----|-------------|--------|
| REQ-5.023 | GDPR data export capability | ❌ Not started |
| REQ-5.024 | GDPR data deletion capability | ❌ Not started |
| REQ-5.025 | Terms of service | ❌ Not started |
| REQ-5.026 | Privacy policy | ❌ Not started |
| REQ-5.027 | Cookie consent | ❌ Not started |

### 5.6 Security

| ID | Requirement | Status |
|----|-------------|--------|
| REQ-5.028 | HTTPS/SSL for all connections | ❌ Not started |
| REQ-5.029 | Regular security updates | ❌ Not started |
| REQ-5.030 | Penetration testing | ❌ Not started |
| REQ-5.031 | Bug bounty program | ❌ Not started |
| REQ-5.032 | Audit logging | ❌ Not started |

### 5.7 Advanced Integrations

| ID | Requirement | Status |
|----|-------------|--------|
| REQ-5.033 | Smart Home integration (Home Assistant) | ❌ Not started |
| REQ-5.034 | Smart Home integration (HomeKit) | ❌ Not started |
| REQ-5.035 | Smart Home integration (Google Home) | ❌ Not started |
| REQ-5.036 | Smart Home integration (Amazon Alexa devices) | ❌ Not started |
| REQ-5.037 | Voice control (local processing) | ❌ Not started |
| REQ-5.038 | Recipe API integration (external search) | ❌ Not started |
| REQ-5.039 | NHS App integration (deep links) | ❌ Not started |
| REQ-5.040 | NHS App appointment parsing | ❌ Not started |
| REQ-5.041 | Find My Phone (iOS) | ❌ Not started |
| REQ-5.042 | Find My Device (Android) | ❌ Not started |
| REQ-5.043 | Ring phone remotely | ❌ Not started |
| REQ-5.044 | Phone battery status display | ❌ Not started |
| REQ-5.045 | Tile Tracker integration | ❌ Not started |

---

## Backlog (Unscheduled)

| ID | Requirement | Notes |
|----|-------------|-------|
| REQ-B.001 | ~~Move project files from OneDrive to local~~ | ✅ Done (Dec 27) |
| REQ-B.002 | Extended family viewer role (grandparents) | View-only access |
| REQ-B.003 | Guest/viewer role | Limited interaction |

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Native mobile apps (Phases 1-3) | PWA sufficient initially |
| Video calling | Not needed |
| Multi-language support | English only |
| Budget/finance tracking | Out of scope |
| Pet care tracking | Out of scope |
| Vehicle maintenance | Out of scope |
| Inventory/pantry tracking | Out of scope |
| Family messaging | Using WhatsApp/Alexa |
| Location tracking | Using iPhone automations |
| Document storage | Deep-link to OneDrive |
| Social media integration | Beyond calendar sync |
| Advanced AI features | Beyond Magic Import |
| School/work system integration | Google Classroom, Slack, etc. |

---

## Risk Management

### Technical Risks

**High Priority:**
- Security vulnerabilities → Regular security audits, penetration testing
- Data loss → Automated backups, redundancy
- Performance at scale → Load testing, optimization

**Medium Priority:**
- Calendar invite delivery reliability → Test with multiple providers
- OAuth token refresh → Proper error handling, retry logic
- Raspberry Pi hardware failure → Spare hardware, recovery docs

### Business Risks (Phase 5)

**High Priority:**
- Low market adoption → Validate with beta testers first
- Competitive pressure → Differentiate on privacy, customization, cost
- Regulatory compliance → GDPR by design, legal review

**Medium Priority:**
- Support burden → Comprehensive docs, community support
- Infrastructure costs → Monitor usage, optimize resources

---

## Family Configuration (Brown Family)

**Family Members:**
| Name | Role | Default Email | Age |
|------|------|---------------|-----|
| James | Admin (Dad) | jamesbrownyork8@gmail.com | Adult |
| Nicola | Admin (Mum) | nicolabrown80@icloud.com | Adult |
| Tommy | Member (Child) | thomas.j.brown11@icloud.com | Minor |
| Harry | Member (Child) | harry.m.brown@icloud.com | 7 |

**Parental Controls:**
- James & Nicola can view/manage Tommy & Harry's calendars and contacts
- Harry's invite responses managed by parents

**External Accounts:**
- James: Google (jamesbrownyork8@gmail.com), iCloud (jamesbrown8@me.com), Outlook (james.brown377@outlook.com), Yahoo (bigtuff8@yahoo.com)
- Nicola: iCloud (nicolabrown80@icloud.com)
- Tommy: iCloud (thomas.j.brown11@icloud.com)
- Harry: iCloud (harry.m.brown@icloud.com) - not active

---

**Document Version:** 3.0
**Last Updated:** December 27, 2025
**Next Review:** After Phase 2 completion
**Owner:** James Brown
