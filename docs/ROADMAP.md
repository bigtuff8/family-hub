# Family Hub Development Roadmap

**Project:** Family Hub - DIY Raspberry Pi Family Organization System
**Start Date:** October 2025
**Current Phase:** Phase 2 - Advanced Features (Shopping List Complete)
**Last Updated:** December 21, 2025

---

## Project Vision

Build a comprehensive, customizable family organization system as an open-source alternative to commercial products. Start with proof-of-concept for Brown family, architect for future multi-tenant SaaS scaling.

**Target Users:**
- Phase 1: Brown family (single tenant) ✅
- Phase 2: Beta testers (5-10 families)
- Phase 3: Commercial SaaS (100+ families)

**Key Principles:**
- Zero development cost
- Multi-tenant architecture from day 1
- Progressive enhancement (core first, features methodically)
- Privacy-focused (self-hosting option)

---

## Phase Overview
Phase 1          Phase 1.5        Phase 2          Phase 3
(2-4 weeks)      (2-3 weeks)      (4-6 weeks)      (8-12 weeks)
┌─────────┐      ┌─────────┐      ┌─────────┐      ┌─────────┐
│ Calendar│ ───► │  Auth   │ ───► │Advanced │ ───► │  SaaS   │
│   MVP   │      │ + PWA   │      │Features │      │  Launch │
└─────────┘      └─────────┘      └─────────┘      └─────────┘
    ✅               ✅           ↑ YOU ARE HERE

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

## Phase 2: Advanced Features 🔄 IN PROGRESS

**Goal:** Feature parity with commercial products
**Status:** In Progress - Shopping List Complete
**Start Date:** December 2025
**Duration:** 4-6 weeks
**Owner:** James Brown

### Completed Features ✅

**Shopping Lists:** ✅ COMPLETE
- [x] Default shopping list per tenant
- [x] Add/edit/delete items
- [x] Item categories with icons (Produce, Dairy, Meat, Fish, Bakery, Frozen, Drinks, Pantry, Eggs, Household, Baby, Pet, Other)
- [x] Check-off items (toggle)
- [x] Quantity support
- [x] Shopping list full page (`/shopping` route)
- [x] ShoppingSnapshot dashboard widget
- [x] Quick-add functionality from dashboard
- [x] Edit item modal
- [x] Items grouped by category

**Category Management:** ✅ COMPLETE
- [x] Per-tenant custom categories (database-backed)
- [x] UI to add/edit/delete shopping categories
- [x] Custom emoji icons for categories
- [x] Custom colors for categories
- [x] Keyword-based auto-categorization
- [x] Category reordering (up/down)
- [x] CategoryManagerDrawer component
- [x] EmojiPicker component
- [x] CategoryEditModal component

**Smart Shopping Behavior:** ✅ COMPLETE
- [x] Complete Shop = bulk mark all as checked (not delete)
- [x] 24-hour auto-hide for checked items (remain in DB for suggestions)
- [x] Duplicate detection for recently completed items
- [x] Confirmation modal: "You completed X hours ago. Add again?"
- [x] Force-add replaces old completed item with fresh one
- [x] Item names retained for autocomplete suggestions

**Dashboard Layout:** ✅ COMPLETE
- [x] 2x2 grid layout for tablet (1920x1080)
  - Top Left: Today's Schedule
  - Top Right: Coming Up
  - Bottom Left: Shopping List
  - Bottom Right: Quick Actions
- [x] Mobile view with stacked tiles
- [x] Separate CalendarTablet and CalendarMobile components
- [x] Consistent card styling across all tiles
- [x] Responsive design working

### In Progress 🔄

**Polish & Bug Fixes:**
- [ ] Address identified bugs from code review
- [ ] Performance optimizations

### Remaining Features 📋

**Family Relationships:**
- [ ] 🟡 **TD-002: Family relationships table**
- [ ] Define parent/child/partner/sibling relationships
- [ ] Family tree visualization
- [ ] Emergency contacts (auto-populated)

**External Contacts:**
- [ ] 🟡 **TD-003: Contacts table**
- [ ] Contact management UI
- [ ] Birthday tracking for non-users
- [ ] Address book

**Cross-Tenant Features:**
- [ ] 🟡 **TD-004: Event invitations table**
- [ ] Invite users from other tenants
- [ ] RSVP tracking

**Tasks & Chores:**
- [ ] Task CRUD operations
- [ ] Assign tasks to family members
- [ ] Due dates and reminders
- [ ] Task completion tracking

**Meal Planning:**
- [ ] Weekly meal planner
- [ ] Recipe storage
- [ ] Shopping list integration

**Integrations:**
- [ ] Calendar sync (Google, iCloud, Outlook)

### Technical Debt Status

| ID | Issue | Priority | Status |
|----|-------|----------|--------|
| TD-001 | Hard-coded tenant_id | 🔴 Critical | ✅ Resolved |
| TD-002 | Family relationships | 🟡 Important | Planned |
| TD-003 | External contacts | 🟡 Important | Planned |
| TD-004 | Cross-tenant invites | 🟡 Important | Planned |
| TD-005 | Timezone handling | 🟢 Nice-to-have | ✅ Resolved (dayjs.tz) |
| TD-006 | Database seeding | 🟢 Nice-to-have | ✅ Resolved |

### Success Criteria

Phase 2 is complete when:
- ✅ Shopping lists operational ← DONE
- ⬜ Tasks/chores feature working
- ⬜ Meal planning basic functionality
- ⬜ Family actively using all features
- ⬜ No critical bugs

---

## Phase 3: Commercial SaaS Launch

**Goal:** Production-ready commercial offering  
**Status:** Future Planning  
**Start Date:** TBD (6+ months from now)  
**Duration:** 8-12 weeks  
**Owner:** James Brown

### Major Milestones 🎯

**Infrastructure:**
- [ ] Deploy to cloud (Fly.io, Railway, or Azure)
- [ ] Database migration to production
- [ ] Automated backups
- [ ] Monitoring and logging (Application Insights)
- [ ] CI/CD pipeline (GitHub Actions)

**Multi-Tenant Production:**
- [ ] Tenant isolation verified
- [ ] Data export (GDPR compliance)
- [ ] Data deletion (GDPR compliance)
- [ ] Terms of service
- [ ] Privacy policy

**Billing & Subscriptions:**
- [ ] Stripe integration
- [ ] Subscription tiers (Free, Pro, Family)
- [ ] Billing portal
- [ ] Usage limits

**Marketing & Launch:**
- [ ] Landing page
- [ ] Documentation site
- [ ] User onboarding flow
- [ ] Email marketing (welcome emails)
- [ ] Social media presence

**Support:**
- [ ] Help center / FAQ
- [ ] Support ticket system
- [ ] Community forum (optional)

### Success Criteria

Phase 3 is complete when:
- ✅ 100+ paying customers
- ✅ 99.9% uptime achieved
- ✅ Revenue exceeds infrastructure costs
- ✅ Positive customer reviews
- ✅ All critical bugs resolved
- ✅ Support system working

---

## Future Phases (Phase 4+)

**Potential Features:**
- Advanced analytics and insights
- AI-powered suggestions
- Voice control (Alexa, Google Home)
- Smart home deep integration
- Mobile native apps (React Native)
- Wearable integration (Apple Watch, etc.)
- Advanced automation and workflows
- Team/organization features (schools, clubs)

**Open Source Strategy:**
- Open-source self-hosted version
- Dual licensing (MIT for self-host, commercial for SaaS)
- Community contributions
- Plugin/extension system

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

### After Phase 1:
**Decision:** Continue to Phase 1.5 (authentication) or add more Phase 1 features?  
**Criteria:** Is calendar working reliably? Is family using it daily?

### After Phase 1.5:
**Decision:** Continue to Phase 2 (advanced features) or onboard beta testers?  
**Criteria:** Is authentication solid? Is system stable enough for others?

### After Phase 2:
**Decision:** Launch commercial SaaS or remain open-source personal project?  
**Criteria:** Beta tester feedback, market demand, time/resources available

---

## Timeline Estimates

**Optimistic:** 16-22 weeks (4-5 months) to SaaS launch  
**Realistic:** 24-32 weeks (6-8 months) to SaaS launch  
**Conservative:** 36+ weeks (9+ months) to SaaS launch

**Assumptions:**
- 10-15 hours per week development time
- No major technical roadblocks
- Beta testers available for Phase 2
- Family actively using and providing feedback

---

## Progress Tracking

### Key Metrics

**Phase 1:**
- Features completed / total features
- Days of stable operation
- Family usage (daily active users)

**Phase 1.5:**
- Authentication success rate
- PWA install rate
- Technical debt items resolved

**Phase 2:**
- Beta testers onboarded
- Feature adoption rate
- Bug report rate

**Phase 3:**
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

## Related Documents

- `docs/technical-debt.md` - Active technical debt tracking
- `docs/session-starter-checklist.md` - Daily development checklist
- `docs/Family Hub - Requirements Document.md` - Complete requirements
- `docs/Family Hub - Project Initialization Guide.md` - Setup guide

---

**Document Version:** 2.0
**Last Updated:** December 21, 2025
**Next Review:** Phase 2 completion
**Owner:** James Brown