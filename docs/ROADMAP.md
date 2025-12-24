# Family Hub Development Roadmap

**Project:** Family Hub - DIY Raspberry Pi Family Organization System
**Start Date:** October 2025
**Current Phase:** Phase 2 - Integration & Sync
**Last Updated:** December 24, 2025

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
    ✅          ✅        ↑ YOU ARE HERE
```

---

## Phase 1: MVP Calendar ✅ COMPLETE

**Goal:** Functional calendar for Brown family use
**Status:** ✅ Complete
**Start Date:** October 2025
**Completed:** November 2025
**Owner:** James Brown

### All Items Complete ✅

- [x] Project initialization (Docker, Git, VS Code)
- [x] Database schema (PostgreSQL with multi-tenant structure)
- [x] Backend API (FastAPI with calendar endpoints)
- [x] Frontend foundation (React + TypeScript + Ant Design)
- [x] Horizon design system (Navy/Teal/Coral/Cream)
- [x] Tablet landing page (today's schedule + upcoming events)
- [x] Calendar event form (create/edit mode)
  - [x] Title, description, dates/times
  - [x] All-day event toggle
  - [x] Event lead selection (with color inheritance)
  - [x] Family attendees multi-select
  - [x] Live address search (Nominatim API)
  - [x] 30-minute auto-duration on date/time change
  - [x] Color picker with family presets
- [x] Real Brown family data integration
- [x] Timezone handling (BST/GMT with dayjs timezone plugin)
- [x] Technical debt tracking system
- [x] Events saving to database
- [x] Events rendering on tablet landing page
- [x] Calendar views (Month, Week, Day)
- [x] Event list view (upcoming)
- [x] Today's schedule (detailed view)
- [x] Edit event (populate form with existing data)
- [x] Delete event (with confirmation)
- [x] Recurring events support
- [x] Form validation
- [x] Error handling
- [x] Loading states
- [x] Empty states
- [x] Responsive design (tablet + mobile views)

### Success Criteria ✅ All Met

- ✅ Brown family can create calendar events
- ✅ Events display on tablet landing page
- ✅ Events can be edited and deleted
- ✅ Calendar works reliably
- ✅ Family actively using it
- ✅ No critical bugs or data loss

---

## Phase 1.5: Authentication & Refinement ✅ COMPLETE

**Goal:** Production-ready authentication + mobile access
**Status:** ✅ Complete
**Start Date:** November 2025
**Completed:** December 2025
**Owner:** James Brown

### All Items Complete ✅

**Authentication System:**
- [x] User registration (creates new tenant)
- [x] User login (JWT with tenant_id in claims)
- [x] Auth context provider (React) - `useAuth()` hook
- [x] Protected routes
- [x] User avatars with initials and colors
- [x] Logout functionality

**Technical Debt Resolved:**
- [x] 🔴 **TD-001: Removed hard-coded tenant_id**
  - [x] Authentication backend implemented
  - [x] Auth context in frontend
  - [x] Dynamic tenant_id from `useAuth()`
- [x] 🟢 **TD-006: Database seeding script**
  - [x] Seed data for Brown family
  - [x] Sample events and users

**Mobile & Responsive:**
- [x] Mobile-responsive design
- [x] Separate mobile and tablet components
- [x] Mobile header with user avatar
- [x] Touch-friendly UI elements

**Polish:**
- [x] Loading states throughout app
- [x] Toast notifications (Ant Design message)
- [x] Error handling

### Success Criteria ✅ All Met

- ✅ Authentication working (login, logout)
- ✅ Multiple users per tenant supported
- ✅ TD-001 resolved (dynamic tenant_id)
- ✅ Mobile views working
- ✅ No authentication security issues

---

## Phase 2: Integration & Sync 🔄 IN PROGRESS

**Goal:** External integrations and unified data across platforms
**Status:** In Progress
**Start Date:** December 2025
**Owner:** James Brown

### Completed Features ✅

**Shopping Lists:** ✅ COMPLETE
- [x] Default shopping list per tenant
- [x] Add/edit/delete items
- [x] Item categories with icons
- [x] Check-off items (toggle)
- [x] Quantity support
- [x] Shopping list full page (`/shopping` route)
- [x] ShoppingSnapshot dashboard widget
- [x] Quick-add functionality from dashboard
- [x] Edit item modal
- [x] Items grouped by category

**Category Management:** ✅ COMPLETE
- [x] Per-tenant custom categories (database-backed)
- [x] Custom emoji icons and colors
- [x] Keyword-based auto-categorization
- [x] Category reordering

**Smart Shopping Behavior:** ✅ COMPLETE
- [x] Complete Shop = bulk mark all as checked
- [x] 24-hour auto-hide for checked items
- [x] Duplicate detection with confirmation

**Dashboard & UI:** ✅ COMPLETE
- [x] 2x2 grid layout for tablet
- [x] Mobile view with stacked tiles
- [x] Unified header across all pages
- [x] Auto-deploy to Pi via GitHub Actions

### Remaining Phase 2 Features 📋

**2.0 Mobile Access:**
- [ ] Tailscale + Reverse Proxy setup for remote access

**2.1 Contacts + Address Book Sync:**
- [x] External contacts table (non-users: grandparents, friends) ✅ COMPLETE (Phase 2.1a)
- [x] Contact management UI ✅ COMPLETE (Phase 2.1a)
- [x] Birthday tracking ✅ COMPLETE (Phase 2.1a)
- [x] Event attendees/RSVP ✅ COMPLETE (Phase 2.1b)
- [ ] Sync from iCloud address book
- [ ] Sync from Google Contacts
- [ ] Sync from Yahoo address book

**2.2 Calendar Sync:**
- [ ] Two-way sync with Google Calendar
- [ ] Two-way sync with iCloud Calendar
- [ ] Two-way sync with Outlook Calendar
- [ ] Unified view of work + personal calendars
- [ ] Conflict detection

**2.3 Alexa Integration:**
- [ ] Add items to shopping list via voice
- [ ] Alexa skill development
- [ ] Explore additional Alexa capabilities (calendar, reminders)

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
**Owner:** James Brown

### Features 📋

**3.1 Tasks & Chores:**
- [ ] Task CRUD operations
- [ ] Assign tasks to family members
- [ ] Due dates and reminders
- [ ] Recurring chores (e.g., "empty dishwasher every Tuesday")
- [ ] Task completion tracking
- [ ] Dashboard widget

**3.2 Meal Planning:**
- [ ] Weekly meal planner grid
- [ ] Recipe storage
- [ ] Auto-generate shopping list from meals
- [ ] Meal history/favorites

**3.3 Family Relationships:**
- [ ] Define parent/child/partner/sibling relationships
- [ ] Family tree visualization
- [ ] Emergency contacts (auto-populated from relationships)
- [ ] "Notify parents when task done" capability

**3.4 Cross-Tenant Invites:**
- [ ] Invite users from other households to events
- [ ] RSVP tracking
- [ ] Shared event visibility

### Success Criteria

Phase 3 is complete when:
- ⬜ Tasks/chores feature working
- ⬜ Meal planning basic functionality
- ⬜ Family relationships defined
- ⬜ Can invite external family to events

---

## Phase 4: Polish & Mobile

**Goal:** Native mobile experience and notifications
**Status:** Planned
**Owner:** James Brown

### Features 📋

**4.1 Mobile Native Apps:**
- [ ] React Native iOS app
- [ ] React Native Android app
- [ ] Shared codebase with web where possible

**4.2 Notifications & Reminders:**
- [ ] Push notifications for events
- [ ] Task reminder notifications
- [ ] Shopping list reminders (location-based?)

**4.3 Analytics Dashboard:**
- [ ] Family activity insights
- [ ] Meal/shopping trends
- [ ] Task completion stats

### Success Criteria

Phase 4 is complete when:
- ⬜ Mobile apps in App Store / Play Store
- ⬜ Push notifications working
- ⬜ Analytics providing useful insights

---

## Phase 5: Commercial SaaS

**Goal:** Production-ready commercial offering
**Status:** Future Planning (Lowest Priority)
**Owner:** James Brown

### Features 📋

**5.1 Cloud Deployment:**
- [ ] Deploy to cloud (Fly.io, Railway, or Azure)
- [ ] Database migration to production
- [ ] Automated backups
- [ ] Monitoring and logging
- [ ] CI/CD pipeline

**5.2 Stripe Billing:**
- [ ] Stripe integration
- [ ] Subscription tiers (Free, Pro, Family)
- [ ] Billing portal
- [ ] Usage limits

**5.3 User Onboarding:**
- [ ] Welcome flow / tutorials
- [ ] Email marketing (welcome emails)

**5.4 Landing Page:**
- [ ] Marketing website
- [ ] Documentation site

**5.5 GDPR Compliance:**
- [ ] Data export capability
- [ ] Data deletion capability
- [ ] Terms of service
- [ ] Privacy policy

### Success Criteria

Phase 5 is complete when:
- ⬜ 100+ paying customers
- ⬜ 99.9% uptime achieved
- ⬜ Revenue exceeds infrastructure costs

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

### Business Risks (Phase 3)

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

## Progress Tracking

### Key Metrics

**Phase 2 (Current):**
- Integrations working reliably
- Sync conflicts resolved
- Alexa usage frequency

**Phase 3:**
- Task completion rates
- Meal planning adoption
- Family relationship features used

**Phase 4:**
- Mobile app downloads
- Notification engagement
- Analytics insights generated

**Phase 5:**
- Paying customers
- Monthly recurring revenue (MRR)
- Customer satisfaction (NPS)
- System uptime

---

## Review Schedule

**Weekly:** Progress check (during active development)  
**Phase End:** Comprehensive review, decide on next phase  
**Monthly:** Update roadmap with learnings

**Next Review:** End of Phase 1 (when calendar MVP complete)

---

## Backlog (Unprioritized)

Features and improvements identified but not yet scheduled into a phase.

### User Experience

- [ ] **Per-user Address Book** - Contacts should be unique to each user, not shared across all family members. Currently contacts are tenant-wide.

- [ ] **Weather Widget Enhancement** - Click weather widget to see detailed forecast:
  - Hourly conditions, temperature, precipitation
  - Multi-day forecast with scroll
  - Location selector for checking weather elsewhere
  - *Preference: Link to external weather app (e.g., open native weather app or direct to app store) rather than building custom UI*

- [ ] **Weather Lookup for Events** - When creating events, ability to see weather forecast for the event date/location to help with planning.

### Technical Improvements

- [ ] **Move project files from OneDrive to local storage** - Eliminate OneDrive sync issues that cause file modification conflicts during development. With GitHub + Pi deployment, OneDrive storage is no longer necessary.

---

## Related Documents

- `docs/technical-debt.md` - Active technical debt tracking
- `docs/session-starter-checklist.md` - Daily development checklist
- `docs/Family Hub - Requirements Document.md` - Complete requirements
- `docs/Family Hub - Project Initialization Guide.md` - Setup guide

---

**Document Version:** 3.1
**Last Updated:** December 24, 2025
**Next Review:** Phase 2 completion (Integration & Sync)
**Owner:** James Brown