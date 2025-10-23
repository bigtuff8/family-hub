# Family Hub Development Roadmap

**Project:** Family Hub - DIY Raspberry Pi Family Organization System  
**Start Date:** October 2025  
**Current Phase:** Phase 1 - MVP Calendar  
**Last Updated:** October 12, 2025

---

## Project Vision

Build a comprehensive, customizable family organization system as an open-source alternative to commercial products. Start with proof-of-concept for Brown family, architect for future multi-tenant SaaS scaling.

**Target Users:**
- Phase 1: Brown family (single tenant)
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
↑ YOU ARE HERE

---

## Phase 1: MVP Calendar ✅ In Progress

**Goal:** Functional calendar for Brown family use  
**Status:** ~60% Complete  
**Start Date:** October 2025  
**Target Completion:** 2-4 weeks from start  
**Owner:** James Brown

### Completed ✅

- [x] Project initialization (Docker, Git, VS Code)
- [x] Database schema (PostgreSQL with multi-tenant structure)
- [x] Backend API (FastAPI with 11 calendar endpoints)
- [x] Frontend foundation (React + TypeScript + Ant Design)
- [x] Horizon design system (Navy/Teal/Coral/Cream)
- [x] Tablet landing page (today's schedule + upcoming events)
- [x] Calendar event form (create mode)
  - [x] Title, description, dates/times
  - [x] All-day event toggle
  - [x] Event lead selection (with color inheritance)
  - [x] Family attendees multi-select
  - [x] Live address search (Nominatim API)
  - [x] External guests placeholder (Phase 1.5)
  - [x] 30-minute auto-duration on date/time change
  - [x] Color picker with family presets
- [x] Real Brown family data integration
- [x] Timezone handling (BST/GMT with manual conversion)
- [x] Technical debt tracking system

### In Progress 🔄

- [ ] **Events saving to database** ← CURRENT FOCUS
  - [x] Backend routes created
  - [x] Frontend form submission
  - [x] Tenant ID added (hard-coded for Phase 1)
  - [ ] Verify events display after creation

### Remaining Work 📋

**Calendar Display:**
- [ ] Events rendering on tablet landing page
- [ ] Calendar views
  - [ ] Month view
  - [ ] Week view
  - [ ] Day view
- [ ] Event list view (upcoming)
- [ ] Today's schedule (detailed view)

**Event Management:**
- [ ] Edit event (populate form with existing data)
- [ ] Delete event (with confirmation)
- [ ] Duplicate event (copy and modify)
- [ ] Event details modal/drawer

**Polish & Testing:**
- [ ] Form validation improvements
- [ ] Error handling (user-friendly messages)
- [ ] Loading states
- [ ] Empty states ("No events yet")
- [ ] Responsive design testing (tablet + mobile)

### Known Technical Debt 🔴

| ID | Issue | Priority | Must Fix |
|----|-------|----------|----------|
| TD-001 | Hard-coded tenant_id | 🔴 Critical | Phase 1.5 |
| TD-005 | Manual BST conversion | 🟢 Nice-to-have | Anytime |
| TD-006 | No database seeding | 🟢 Nice-to-have | Phase 1.5 |

**Decision:** Accept TD-001 (hard-coded tenant_id) to accelerate Phase 1 development. Will refactor in Phase 1.5 with authentication.

### Success Criteria

Phase 1 is complete when:
- ✅ Brown family can create calendar events
- ✅ Events display on tablet landing page
- ✅ Events can be edited and deleted
- ✅ Calendar works reliably for 7 days without intervention
- ✅ Family actually uses it daily (dogfooding)
- ✅ No critical bugs or data loss

---

## Phase 1.5: Authentication & Refinement

**Goal:** Production-ready authentication + mobile access  
**Status:** Not Started  
**Start Date:** TBD (after Phase 1 complete)  
**Duration:** 2-3 weeks  
**Owner:** James Brown

### Goals 🎯

**Authentication System:**
- [ ] User registration (creates new tenant)
- [ ] User login (JWT with tenant_id in claims)
- [ ] Password reset flow
- [ ] Auth context provider (React)
- [ ] Protected routes
- [ ] Role-based access control (admin, parent, child)

**Technical Debt Paydown:**
- [ ] 🔴 **TD-001: Remove hard-coded tenant_id**
  - [ ] Implement authentication backend
  - [ ] Add auth context to frontend
  - [ ] Replace `BROWN_FAMILY_TENANT_ID` with `useAuth().currentTenant.id`
  - [ ] Test multi-tenant isolation
- [ ] 🟢 **TD-006: Database seeding script**
  - [ ] Create `backend/scripts/seed_data.py`
  - [ ] Brown family + sample events
  - [ ] Reset command for development

**Mobile & PWA:**
- [ ] Progressive Web App configuration
- [ ] Mobile-responsive refinements
- [ ] Add to Home Screen functionality
- [ ] Push notifications setup (for Phase 2)
- [ ] Offline mode (basic)

**External Guests (Placeholder → Real):**
- [ ] External guest email collection (form working)
- [ ] Store guest list with events
- [ ] Email invitations (basic - no RSVP yet)

**Polish:**
- [ ] Loading states throughout app
- [ ] Error boundaries
- [ ] Toast notifications
- [ ] Keyboard shortcuts
- [ ] Accessibility improvements

### Dependencies

**Requires Phase 1 Complete:**
- Working calendar with CRUD operations
- Stable event storage
- Family actively using system

**External Services:**
- Supabase Auth (free tier) OR custom JWT implementation
- Email service for invitations (SendGrid free tier or similar)

### Success Criteria

Phase 1.5 is complete when:
- ✅ Authentication working (register, login, logout)
- ✅ Multiple test users can exist (different tenants)
- ✅ TD-001 resolved (no hard-coded tenant_id)
- ✅ PWA installable on mobile devices
- ✅ External guests can receive email invitations
- ✅ No authentication security issues

---

## Phase 2: Advanced Features

**Goal:** Feature parity with commercial products  
**Status:** Planned  
**Start Date:** TBD (after Phase 1.5 complete)  
**Duration:** 4-6 weeks  
**Owner:** James Brown

### Major Features 🚀

**Family Relationships:**
- [ ] 🟡 **TD-002: Family relationships table**
- [ ] Define parent/child/partner/sibling relationships
- [ ] Family tree visualization
- [ ] "Notify Tommy's parents" functionality
- [ ] Emergency contacts (auto-populated)

**External Contacts:**
- [ ] 🟡 **TD-003: Contacts table**
- [ ] Contact management UI
- [ ] Birthday tracking for non-users
- [ ] Address book
- [ ] Contact migration (when they sign up)

**Cross-Tenant Features:**
- [ ] 🟡 **TD-004: Event invitations table**
- [ ] Invite users from other tenants
- [ ] RSVP tracking
- [ ] Shared events (multiple tenants)

**Tasks & Chores:**
- [ ] Task CRUD operations
- [ ] Assign tasks to family members
- [ ] Due dates and reminders
- [ ] Task completion tracking
- [ ] Points/rewards system (gamification)

**Meal Planning:**
- [ ] Weekly meal planner
- [ ] Recipe storage
- [ ] Shopping list integration
- [ ] Recipe API integration (Spoonacular or similar)

**Shopping Lists:**
- [ ] Multiple lists (groceries, household, etc.)
- [ ] Shared list editing
- [ ] Item categories
- [ ] Check-off items

**Integrations:**
- [ ] Calendar sync (Google, iCloud, Outlook)
- [ ] Smart home basics (if time permits)

### Technical Debt Paydown

| ID | Issue | Priority | Status |
|----|-------|----------|--------|
| TD-002 | Family relationships | 🟡 Important | Must Fix |
| TD-003 | External contacts | 🟡 Important | Must Fix |
| TD-004 | Cross-tenant invites | 🟡 Important | Must Fix |
| TD-005 | Timezone handling | 🟢 Nice-to-have | Optional |

### Success Criteria

Phase 2 is complete when:
- ✅ 5-10 beta tester families using system
- ✅ All Phase 2 features working reliably
- ✅ Family relationships functional
- ✅ External contacts working
- ✅ Tasks, meals, shopping lists operational
- ✅ Positive feedback from beta testers
- ✅ No critical bugs

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

**Document Version:** 1.0  
**Last Updated:** October 12, 2025  
**Next Review:** Phase 1 completion (estimated 2-4 weeks)  
**Owner:** James Brown