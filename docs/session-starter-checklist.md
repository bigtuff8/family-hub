# Session Starter Checklist

Use this document at the start of each development session to remind Claude of context, priorities, and constraints.

**Last Updated:** December 27, 2025
**Project:** Family Hub
**Current Phase:** Phase 2 - Integration & Sync

---

## Quick Start (Paste This at Session Start)

```
I'm continuing work on Family Hub. Please review:

1. docs/ROADMAP.md - Project status and requirements (READ THE "Current Status & Next Steps" SECTION FIRST)
2. docs/session-starter-checklist.md - This checklist
3. docs/design/phase2-calendar-sync.md - Calendar invite-based architecture
4. docs/design/phase2-contacts-sync.md - User-owned contacts architecture

Current Phase: Phase 2 - Integration & Sync
Working on: [describe what you're building]

Ready when you are!
```

---

## Current Status (December 27, 2025)

### What's Complete
- Phase 1: Calendar MVP
- Phase 1.5: Authentication
- Phase 2 (partial): Shopping Lists, Basic Contacts

### What's Designed (Ready to Build)
Major architectural changes were made on December 27, 2025:

| Feature | Design Doc | Summary |
|---------|------------|---------|
| Calendar Sync | `docs/design/phase2-calendar-sync.md` | **Invite-based** - Family Hub sends invites via dedicated Outlook organizer account |
| Contacts Sync | `docs/design/phase2-contacts-sync.md` | **User-owned** contacts with "Publish to Family" and smart typeahead lookup |

### Key Architecture Decisions

**Calendar System:**
- Family Hub is **source of truth** for events
- Dedicated **Outlook account** (familyhub-brown@outlook.com) sends all invites
- Users can only **respond** (Accept/Decline/Tentative) from external calendars
- **Amendments only in app** - external calendars are response-only
- Responses sync back to app automatically

**Contacts System:**
- Each user **owns their own contacts** (not tenant-wide)
- **"Publish to Family"** option to share contacts
- **Smart lookup** when adding event invitees (typeahead search)
- Search priority: Family members → Personal contacts → Family contacts → New email

### Implementation Plan (What to Build Next)

**Phase 1: Foundation (Do First)**
1. Database migrations for new tables
2. Core Contacts CRUD (user-owned)
3. Publish to Family functionality

**Phase 2: Smart Lookup**
4. `/contacts/lookup` API endpoint
5. SmartContactSearch component (typeahead)

**Phase 3: Calendar Events**
6. Organizer Account Setup (Outlook)
7. Event creation with invites
8. Response tracking

**Phase 4: External Sync**
9. Google Contacts sync
10. User calendar sync (unified view)

---

## Family Configuration (Brown Family)

**Family Members:**
| Name | Role | Default Email | All Accounts |
|------|------|---------------|--------------|
| James | Admin (Dad) | jamesbrownyork8@gmail.com | Google, iCloud (jamesbrown8@me.com), Outlook (james.brown377@outlook.com), Yahoo (bigtuff8@yahoo.com) |
| Nicola | Admin (Mum) | nicolabrown80@icloud.com | iCloud |
| Tommy | Member (Child) | thomas.j.brown11@icloud.com | iCloud |
| Harry | Member (Child, 7) | harry.m.brown@icloud.com | iCloud (not active) |

**Parental Controls:**
- James & Nicola can view/manage Tommy & Harry's data
- Harry's invite responses managed by parents

---

## Tech Stack Reference

**Backend:**
- Python 3.11+ | FastAPI | PostgreSQL 15
- SQLAlchemy (async) | Pydantic schemas
- Docker containers

**Frontend:**
- React 18 + TypeScript | Vite
- Ant Design components
- dayjs (timezone handling)
- Axios (API calls)

**Infrastructure:**
- Docker Compose (local development)
- localhost:8000 (backend)
- localhost:3000 (frontend)
- localhost:5432 (database)

**Target Hardware:**
- Raspberry Pi 5 (8GB) with touchscreen

---

## Design System: "Horizon"

**Colors:**
- Navy: `#1a2332` (primary dark)
- Teal: `#2dd4bf` (primary brand)
- Coral: `#fb7185` (accent)
- Cream: `#fef7f0` (background)

**Family Member Colors:**
- James: `#e30613` (Liverpool red)
- Nicola: `#fb7185` (pink)
- Tommy: `#00B140` (Liverpool green)
- Harry: `#1D428A` (Leeds blue)

---

## Key Project Files

### Documentation
| File | Purpose |
|------|---------|
| `docs/ROADMAP.md` | **Master requirements and status** |
| `docs/design/phase2-calendar-sync.md` | Calendar invite architecture |
| `docs/design/phase2-contacts-sync.md` | User-owned contacts architecture |
| `docs/technical-debt.md` | Known issues to fix |
| `CLAUDE.md` | Development best practices |

### Code Structure
| Location | Contents |
|----------|----------|
| `backend/services/{feature}/routes.py` | API endpoints |
| `backend/shared/models.py` | Database models |
| `backend/services/{feature}/schemas.py` | Pydantic schemas |
| `frontend/src/features/{feature}/` | React components |
| `frontend/src/services/{feature}.ts` | API service calls |
| `frontend/src/types/{feature}.ts` | TypeScript types |

---

## Development Best Practices (CRITICAL)

**API Data Naming:**
- Backend returns snake_case (`start_time`, `end_time`, `all_day`)
- Frontend MUST use snake_case when accessing API response data

**SQLAlchemy Relationships:**
- Always use `selectinload()` for nested relationships
- Example: `selectinload(CalendarEvent.attendees).selectinload(EventAttendee.contact)`

**Cross-Platform Icons:**
- Use Ant Design icons (`<PlusOutlined />`) instead of emoji
- Emoji characters don't render on Pi browser

**Docker Deployment:**
- If changes don't appear after push:
  ```bash
  docker-compose build --no-cache && docker-compose up -d
  ```

---

## Common Commands

### Docker
```bash
# Start everything
docker-compose up -d

# View logs
docker-compose logs -f
docker-compose logs backend    # Backend only

# Restart service
docker-compose restart backend

# Stop everything
docker-compose down

# Fresh start (deletes data!)
docker-compose down -v && docker-compose up -d
```

### Git
```bash
git pull                    # Get latest
# ... make changes ...
git add .
git commit -m "message"
git push                    # Send to GitHub
```

### Database
```bash
# Connect to database
docker-compose exec db psql -U familyhub -d familyhub

# Inside psql:
\dt                        # List tables
SELECT * FROM calendar_events;
\q                         # Quit
```

---

## What NOT to Do

**Never:**
- Code snippets requiring manual insertion
- "Here's what changed" summaries without full code
- Multiple features built simultaneously
- Unexpected features not requested
- Iterative "let me fix that" approaches

**Always:**
- Request existing code first
- Complete file replacements
- One feature at a time
- Explain architecture and decisions
- Reference technical debt when relevant

---

## End of Session Checklist

Before ending the session:
- [ ] All code changes saved
- [ ] Changes committed to Git
- [ ] Changes pushed to GitHub
- [ ] Any new technical debt documented
- [ ] Docker containers stopped (if needed)
- [ ] Note where you left off for next session

---

**Document Version:** 3.0
**Last Updated:** December 27, 2025
**Next Review:** After Phase 2 completion
**Owner:** James Brown
