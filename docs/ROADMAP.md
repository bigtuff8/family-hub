# Family Hub Development Roadmap

**Project:** Family Hub - DIY Raspberry Pi Family Organization System
**Start Date:** October 2025
**Current Phase:** Phase 2 - Integration & Sync
**Last Updated:** December 27, 2025

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

### Success Criteria ✅ All Met

- ✅ Brown family can create calendar events
- ✅ Events display on tablet landing page
- ✅ Events can be edited and deleted
- ✅ Calendar works reliably
- ✅ Family actively using it
- ✅ No critical bugs or data loss

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

### Success Criteria ✅ All Met

- ✅ Authentication working (login, logout)
- ✅ Multiple users per tenant supported
- ✅ TD-001 resolved (dynamic tenant_id)
- ✅ Mobile views working
- ✅ No authentication security issues

---

## Phase 2: Integration & Sync 🔄 IN PROGRESS

**Goal:** External integrations and unified data across platforms
**Status:** In Progress (Started December 2025)

### 2.0 Mobile Access

| ID | Requirement | Status |
|----|-------------|--------|
| REQ-2.001 | Tailscale setup for remote access | ❌ Not started |
| REQ-2.002 | Reverse proxy configuration | ❌ Not started |
| REQ-2.003 | PWA manifest file | ❌ Not started |
| REQ-2.004 | Service worker for offline support | ❌ Not started |
| REQ-2.005 | PWA installable on mobile | ❌ Not started |
| REQ-2.006 | Offline shopping list access | ❌ Not started |

### 2.1 Contacts & Address Book

| ID | Requirement | Status |
|----|-------------|--------|
| REQ-2.007 | External contacts table (non-family members) | ✅ Done |
| REQ-2.008 | Contact create form | ✅ Done |
| REQ-2.009 | Contact edit form | ✅ Done |
| REQ-2.010 | Contact delete with confirmation | ✅ Done |
| REQ-2.011 | Contact address/postcode search | ✅ Done |
| REQ-2.012 | Contact phone with country code selector | ✅ Done |
| REQ-2.013 | Contact email field | ✅ Done |
| REQ-2.014 | Contact birthday tracking | ✅ Done |
| REQ-2.015 | Contact anniversary tracking | ✅ Done |
| REQ-2.016 | Contact favorites | ✅ Done |
| REQ-2.017 | Contact search | ✅ Done |
| REQ-2.018 | Event attendees (link contacts to events) | ✅ Done |
| REQ-2.019 | Email-only guests (non-contacts) | ✅ Done |
| REQ-2.020 | RSVP tracking (pending/accepted/declined/tentative) | ✅ Done |
| REQ-2.021 | Attendee display in event details | ✅ Done |
| REQ-2.022 | RSVP update functionality | ✅ Done |
| REQ-2.023 | Sync from iCloud Contacts | ❌ Not started |
| REQ-2.024 | Sync from Google Contacts | ❌ Not started |
| REQ-2.025 | Sync from Yahoo Contacts | ❌ Not started |

### 2.2 Calendar Sync

| ID | Requirement | Status |
|----|-------------|--------|
| REQ-2.026 | Two-way Google Calendar sync | ❌ Not started |
| REQ-2.027 | Two-way iCloud Calendar sync | ❌ Not started |
| REQ-2.028 | Two-way Outlook Calendar sync | ❌ Not started |
| REQ-2.029 | Calendar sync conflict detection | ❌ Not started |
| REQ-2.030 | Unified work + personal calendar view | ❌ Not started |
| REQ-2.031 | External calendar ID tracking for sync | ❌ Not started |
| REQ-2.032 | Calendar source identification (Google/iCloud/manual) | ❌ Not started |

### 2.3 Shopping Lists

| ID | Requirement | Status |
|----|-------------|--------|
| REQ-2.033 | Default shopping list per tenant | ✅ Done |
| REQ-2.034 | Add shopping item | ✅ Done |
| REQ-2.035 | Edit shopping item | ✅ Done |
| REQ-2.036 | Delete shopping item | ✅ Done |
| REQ-2.037 | Item categories with icons | ✅ Done |
| REQ-2.038 | Check-off items (toggle) | ✅ Done |
| REQ-2.039 | Item quantity support | ✅ Done |
| REQ-2.040 | Item unit support (kg, pack, bunch) | ✅ Done |
| REQ-2.041 | Shopping list full page (/shopping route) | ✅ Done |
| REQ-2.042 | ShoppingSnapshot dashboard widget | ✅ Done |
| REQ-2.043 | Quick-add from dashboard | ✅ Done |
| REQ-2.044 | Items grouped by category | ✅ Done |
| REQ-2.045 | Per-tenant custom categories (database-backed) | ✅ Done |
| REQ-2.046 | Custom category emoji icons | ✅ Done |
| REQ-2.047 | Custom category colors | ✅ Done |
| REQ-2.048 | Keyword-based auto-categorization | ✅ Done |
| REQ-2.049 | Category reordering | ✅ Done |
| REQ-2.050 | Complete Shop (bulk mark all checked) | ✅ Done |
| REQ-2.051 | 24-hour auto-hide for checked items | ✅ Done |
| REQ-2.052 | Duplicate detection with confirmation | ✅ Done |
| REQ-2.053 | Duplicate merge (add quantities together) | ✅ Done |
| REQ-2.054 | Track who added each item | ✅ Done |
| REQ-2.055 | Track item source (manual/alexa/recipe) | ✅ Done |
| REQ-2.056 | Mobile-optimized list (large touch targets) | ✅ Done |

### 2.4 Alexa Integration

| ID | Requirement | Status |
|----|-------------|--------|
| REQ-2.057 | Add shopping items via Alexa voice | ❌ Not started |
| REQ-2.058 | Alexa Shopping List API integration | ❌ Not started |
| REQ-2.059 | One-way sync (Alexa → Family Hub) | ❌ Not started |
| REQ-2.060 | Alexa skill development | ❌ Not started |
| REQ-2.061 | Calendar queries via Alexa | ❌ Not started |
| REQ-2.062 | Two-way Alexa sync | ❌ Not started |

### Success Criteria

Phase 2 is complete when:
- ⬜ Address book syncing with at least one provider
- ⬜ Calendar syncing with at least one provider
- ⬜ Alexa can add items to shopping list
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

### Success Criteria

Phase 3 is complete when:
- ⬜ Tasks/chores feature working
- ⬜ Meal planning basic functionality
- ⬜ Weather widget functional
- ⬜ Kitchen timers working
- ⬜ Can invite external family to events

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
| REQ-4.029 | Per-user address book (vs tenant-wide) | ❌ Not started |

### Success Criteria

Phase 4 is complete when:
- ⬜ Mobile apps in App Store / Play Store
- ⬜ Push notifications working
- ⬜ Photo slideshow functional
- ⬜ Analytics providing useful insights

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

### Success Criteria

Phase 5 is complete when:
- ⬜ 100+ paying customers
- ⬜ 99.9% uptime achieved
- ⬜ Revenue exceeds infrastructure costs

---

## Backlog (Unscheduled)

Items identified but not yet prioritized into a phase.

| ID | Requirement | Notes |
|----|-------------|-------|
| REQ-B.001 | Move project files from OneDrive to local | Eliminate sync issues |
| REQ-B.002 | Extended family viewer role (grandparents) | View-only access |
| REQ-B.003 | Guest/viewer role | Limited interaction |

---

## Out of Scope

Features explicitly excluded from the project.

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
- Calendar sync reliability → Extensive testing with providers
- Database performance → Proper indexing, query optimization
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

## Decision Points

Major decisions that will affect roadmap:

### After Phase 2:
**Decision:** Proceed to Phase 3 core features or refine integrations?
**Criteria:** Are calendar/contacts syncing reliably? Is Alexa integration useful?

### After Phase 4:
**Decision:** Launch commercial SaaS or remain open-source personal project?
**Criteria:** Beta tester feedback, market demand, time/resources available

---

## Requirement Statistics

| Phase | Total | Complete | Remaining |
|-------|-------|----------|-----------|
| Phase 1 | 43 | 43 | 0 |
| Phase 1.5 | 20 | 20 | 0 |
| Phase 2 | 62 | 34 | 28 |
| Phase 3 | 98 | 0 | 98 |
| Phase 4 | 29 | 0 | 29 |
| Phase 5 | 45 | 0 | 45 |
| Backlog | 3 | 0 | 3 |
| **TOTAL** | **300** | **97** | **203** |

---

## Related Documents

- `docs/technical-debt.md` - Active technical debt tracking
- `docs/session-starter-checklist.md` - Daily development checklist

---

**Document Version:** 4.0
**Last Updated:** December 27, 2025
**Next Review:** Phase 2 completion
**Owner:** James Brown
