 Session Starter Checklist

Use this document at the start of each development session to remind Claude of context, priorities, and constraints.

**Last Updated:** October 12, 2025  
**Project:** Family Hub  
**Current Phase:** Phase 1 - MVP Calendar Development

---

## Quick Start (Paste This at Session Start)
I'm continuing work on Family Hub. Please review:

docs/technical-debt.md - Current technical debt
docs/session-starter-checklist.md - This checklist

Current Phase: Phase 1 - Calendar MVP
Working on: [describe what you're building]

---

## Before Starting Work

### ✅ 1. Technical Debt Status
📖 **Review:** `docs/technical-debt.md`

**Questions to ask:**
- Any critical debt blocking current work?
- Any debt expiring soon (must fix by Phase X)?
- Any new debt added since last session?

**Current Active Debt (Quick Reference):**

| ID | Issue | Priority | Fix By | Blocks |
|----|-------|----------|--------|--------|
| TD-001 | Hard-coded tenant_id | 🔴 Critical | Phase 1.5 | Multi-tenant, Auth |
| TD-002 | Family relationships | 🟡 Important | Phase 2 | Family features |
| TD-003 | External contacts | 🟡 Important | Phase 2 | Guest invites |
| TD-004 | Cross-tenant invites | 🟡 Important | Phase 2 | Multi-tenant events |
| TD-005 | Timezone handling | 🟢 Nice-to-have | Anytime | None |
| TD-006 | Database seeding | 🟢 Nice-to-have | Phase 1.5 | Dev efficiency |

---

### ✅ 2. Current Phase Goals
📖 **Review:** Project status below

**Phase 1 Goals (MVP Calendar):**
- [x] Docker environment setup
- [x] Database schema created
- [x] Calendar event form (create mode)
- [x] Event form: 30-min auto-duration
- [x] Event form: Family member assignment
- [x] Event form: Address search (Nominatim)
- [x] Event form: External guests (Phase 1.5 placeholder)
- [ ] **IN PROGRESS:** Events saving to database ← YOU ARE HERE
- [ ] Events displaying on tablet landing page
- [ ] Calendar views (week/month/day)
- [ ] Event editing
- [ ] Event deletion
- [ ] Event duplication

**What NOT to build yet:**
- ❌ Authentication (Phase 1.5)
- ❌ User registration (Phase 1.5)
- ❌ Mobile PWA (Phase 1.5)
- ❌ Family relationships (Phase 2)
- ❌ External contacts (Phase 2)
- ❌ Smart home integration (Phase 2)

---

### ✅ 3. Development Methodology (NON-NEGOTIABLE)

**Code Delivery Process:**
1. ✅ **Request existing code FIRST** - Never write without seeing current state
2. ✅ **Assess thoroughly** - What needs preservation vs removal?
3. ✅ **Provide COMPLETE file replacements** - Never snippets or partial code
4. ✅ **Preserve existing functionality** - Only add necessary enhancements
5. ✅ **Include file path** - Always state which file after code delivery

**Response Requirements:**
- ✅ Use copyable code boxes with syntax highlighting
- ✅ Provide thorough explanations before code
- ✅ One feature at a time - Never build multiple features simultaneously
- ✅ Stay focused on original requirements - No unexpected features
- ✅ Surgical changes only - Minimal, targeted modifications
- ✅ Reference previous work - Maintain consistency

**Communication Style:**
- ✅ Beginner-friendly (skill level 0)
- ✅ Architecture focus - Explain WHY, not just HOW
- ✅ No automated tools - Understanding over shortcuts
- ✅ Patient explanations

---

### ✅ 4. Tech Stack Reference

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

### ✅ 5. Design System: "Horizon"

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

**Responsive Breakpoints:**
- Tablet: 768px+ (2-column layout)
- Mobile: <768px (single column, bottom nav)

---

### ✅ 6. Real Data (Brown Family)

**Tenant ID:**
10000000-0000-0000-0000-000000000000

**Family Members:**
```typescript
const FAMILY_MEMBERS = [
  { id: '10000000-0000-0000-0000-000000000001', name: 'James', color: '#e30613' },
  { id: '10000000-0000-0000-0000-000000000002', name: 'Nicola', color: '#fb7185' },
  { id: '10000000-0000-0000-0000-000000000003', name: 'Tommy', color: '#00B140' },
  { id: '10000000-0000-0000-0000-000000000004', name: 'Harry', color: '#1D428A' },
];

✅ 7. Key Constraints
Project Constraints:

💰 Zero development cost (no paid services during dev)
🏗️ Multi-tenant from day 1 (Brown family = proof of concept)
📱 Multi-device support (Pi, tablets, phones)
📈 Progressive enhancement (core first, features methodically)
🕐 Timezone: Europe/London (handle BST/GMT - subtract 1 hour for BST)


✅ 8. Common Commands
Docker:
bash# Start everything
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
Git:
bashgit pull                    # Get latest
# ... make changes ...
git add .
git commit -m "message"
git push                    # Send to GitHub
Database:
bash# Connect to database
docker-compose exec db psql -U familyhub -d familyhub

# Inside psql:
\dt                        # List tables
SELECT * FROM calendar_events;
\q                         # Quit

✅ 9. File Structure Quick Reference
Backend:

API Routes: backend/services/{feature}/routes.py
Database Models: backend/shared/models.py
Schemas: backend/services/{feature}/schemas.py

Frontend:

Feature Components: frontend/src/features/{feature}/
API Services: frontend/src/services/{feature}.ts
Types: frontend/src/types/{feature}.ts

Documentation:

Technical Debt: docs/technical-debt.md
Session Starter: docs/session-starter-checklist.md (this file)


✅ 10. Code Search Commands
Find TODOs:
bash# In VS Code: Ctrl+Shift+F
# Search for: TODO(Phase
Find Technical Debt:
bash# Search for: TECHNICAL DEBT
# Search for: FIXME
# Search for: TD-0

During Development Session
When Hitting Issues:
Backend Error:

Check logs: docker-compose logs backend
Look for red ERROR lines or Traceback
Paste error to Claude with context

Frontend Error:

Open browser console (F12 → Console tab)
Look for red errors
Check Network tab for failed API calls
Paste error to Claude with context

Database Error:

Check backend logs first
Connect to database to inspect data
Check if tables exist: \dt
Paste SQL error to Claude


Git Workflow:
After Each Feature:
bashgit add .
git commit -m "feat: [what you added]"
git push
Commit Message Format:
feat: Add calendar event creation
fix: Resolve timezone conversion issue
docs: Update technical debt register
refactor: Improve form validation logic
chore: Update dependencies

End of Session Checklist
Before ending the session:

 All code changes saved (Ctrl+S in VS Code)
 Changes committed to Git
 Changes pushed to GitHub
 Any new technical debt documented in docs/technical-debt.md
 Any TODOs added with proper references
 Docker containers stopped (if needed): docker-compose down
 Note where you left off for next session


What NOT to Do ❌
Never:

❌ Code snippets requiring manual insertion
❌ "Here's what changed" summaries without full code
❌ Multiple features built simultaneously
❌ Unexpected features not requested
❌ Responses assuming knowledge of file locations
❌ Iterative "let me fix that" approaches

Always:

✅ Request existing code first
✅ Complete file replacements
✅ One feature at a time
✅ Explain architecture and decisions
✅ Reference technical debt when relevant


Quick Phase Reference
Phase 1 (Current): MVP Calendar

Focus: Get calendar working perfectly
Duration: 2-4 weeks
Accept: Hard-coded tenant_id (will fix Phase 1.5)

Phase 1.5 (Next): Auth & Polish

Focus: Authentication, mobile PWA
Duration: 2-3 weeks
Must Fix: TD-001 (hard-coded tenant_id)

Phase 2 (Future): Advanced Features

Focus: Relationships, contacts, integrations
Duration: 4-6 weeks
Must Fix: TD-002, TD-003, TD-004

Phase 3 (Future): Commercial SaaS

Focus: Production deployment, scaling
Duration: 8-12 weeks
Must Fix: All critical debt


Additional Reference Documents
Full Documentation:

docs/Family Hub - Requirements Document.md - Complete requirements
docs/Family Hub - Project Initialization Guide.md - Setup guide
docs/Spin-off Project - DIY Bluetooth Item Tracker.md - Future Tile integration

When to Reference:

Requirements doc: When planning features or unclear about scope
Initialization guide: When setting up new environment
Bluetooth tracker: When discussing Phase 2 integrations


Document Version: 1.0
Last Updated: October 12, 2025
Next Review: Phase 1 completion
Owner: James Brown

Template: New Session Start Message
Copy/paste this to start a new session:
I'm continuing work on Family Hub (DIY Raspberry Pi family organization system).

Please review these documents:
1. docs/technical-debt.md
2. docs/session-starter-checklist.md

Current Status:
- Phase: Phase 1 - Calendar MVP
- Working on: [describe current task]
- Last completed: [what you finished last session]

Today's goal: [what you want to accomplish]

Ready when you are!