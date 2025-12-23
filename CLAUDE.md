# Claude Code Project Configuration

**Project:** Family Hub - DIY Raspberry Pi Family Organization System
**Last Updated:** December 23, 2025

---

## Project Overview

Family Hub is a self-hosted family organization system designed to run on a Raspberry Pi with touchscreen. It provides calendar, shopping lists, contacts, and task management for families.

**Key Documents:**
- `docs/ROADMAP.md` - Development phases and progress
- `docs/technical-debt.md` - Technical debt register
- `docs/session-starter-checklist.md` - Session start reference

---

## Development Best Practices (MUST FOLLOW)

### 1. API Data Naming Convention

**Rule:** Use snake_case consistently for API data

```typescript
// ✅ CORRECT - Use snake_case as returned by API
const startTime = event.start_time;
const endTime = event.end_time;
const allDay = event.all_day;

// ❌ WRONG - Don't assume camelCase
const startTime = event.startTime;  // undefined!
```

**Why:** Backend (Python/FastAPI) returns snake_case. Don't convert to camelCase unnecessarily.

---

### 2. SQLAlchemy Relationship Loading

**Rule:** Always use `selectinload()` for nested relationships

```python
# ✅ CORRECT - Eager load relationships
from sqlalchemy.orm import selectinload

query = select(CalendarEvent).options(
    selectinload(CalendarEvent.attendees).selectinload(EventAttendee.contact)
)

# ❌ WRONG - Lazy loading causes N+1 queries and missing data
query = select(CalendarEvent)  # attendees won't be loaded!
```

**Why:** Without eager loading, related objects won't be included in API responses.

---

### 3. Serializing Related Objects

**Rule:** Explicitly serialize related objects in API responses

```python
# ✅ CORRECT - Serialize nested objects
def serialize_attendees(attendees):
    return [{
        "id": str(att.id),
        "contact_id": str(att.contact_id) if att.contact_id else None,
        "email": att.email,
        "display_name": att.display_name,
        "contact": {
            "id": str(att.contact.id),
            "display_name": att.contact.display_name,
        } if att.contact else None
    } for att in attendees]

# Include in response
event_dict["attendees"] = serialize_attendees(event.attendees)
```

**Why:** ORM objects don't auto-serialize to JSON. Always convert explicitly.

---

### 4. Cross-Platform Icon Rendering

**Rule:** Use Ant Design icons or SVG instead of emoji characters

```tsx
// ✅ CORRECT - Use Ant Design icons
import { PlusOutlined, CalendarOutlined, TeamOutlined } from '@ant-design/icons';

<PlusOutlined style={{ fontSize: 28, color: '#2dd4bf' }} />
<CalendarOutlined style={{ fontSize: 28, color: '#2dd4bf' }} />

// ✅ CORRECT - Use inline SVG for custom icons
<svg width="32" height="32" viewBox="0 0 24 24">
  <circle cx="12" cy="12" r="5" fill="#FFD93D"/>
</svg>

// ❌ WRONG - Emoji won't render on Pi browser
<span>➕</span>
<span>📅</span>
<span>☀️</span>
```

**Why:** Raspberry Pi browser lacks emoji fonts. SVG and icon libraries render consistently everywhere.

---

### 5. Docker Deployment Cache

**Rule:** Use `--no-cache` when code changes aren't appearing

```bash
# On Raspberry Pi, when changes don't appear after git pull:
docker-compose build --no-cache
docker-compose up -d

# Or rebuild specific service:
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

**Why:** Docker caches build layers. Sometimes changes require fresh build.

---

### 6. OneDrive Sync File Conflicts

**Rule:** When Edit tool fails due to file modification, use Python scripts

```python
# Create a temporary Python script for batch edits
# This avoids OneDrive sync race conditions

with open('path/to/file.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('old_text', 'new_text')

with open('path/to/file.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
```

**Why:** OneDrive syncs files during editing, causing "file unexpectedly modified" errors.

---

### 7. Form State Management

**Rule:** Always reset form state when opening for new entries

```tsx
// ✅ CORRECT - Reset state before opening
const handleCreateNew = () => {
  setSelectedItem(undefined);  // Clear any previous selection
  form.resetFields();          // Reset form fields
  setFormVisible(true);
};

// ❌ WRONG - Previous data may persist
const handleCreateNew = () => {
  setFormVisible(true);  // Previous data still in form!
};
```

**Why:** Prevents data from previous entry appearing in new entry form.

---

### 8. Event Handler Data Passing

**Rule:** Pass all required fields when opening edit forms

```tsx
// ✅ CORRECT - Pass all fields including relationships
const handleEditEvent = (event: CalendarEvent) => {
  setSelectedEvent({
    id: event.id,
    title: event.title,
    start_time: event.start_time,
    end_time: event.end_time,
    attendees: event.attendees,  // Don't forget relationships!
  });
  setFormVisible(true);
};

// ❌ WRONG - Missing attendees
const handleEditEvent = (event: CalendarEvent) => {
  setSelectedEvent({
    id: event.id,
    title: event.title,
    // Missing: attendees won't appear in form
  });
};
```

---

## Tech Stack Quick Reference

**Backend:**
- Python 3.11+ / FastAPI / PostgreSQL 15
- SQLAlchemy (async) / Pydantic schemas
- API returns snake_case

**Frontend:**
- React 18 + TypeScript / Vite
- Ant Design components
- dayjs (with timezone plugin)
- Uses snake_case for API data

**Infrastructure:**
- Docker Compose (local + Pi)
- GitHub Actions self-hosted runner for Pi deployment
- localhost:8000 (backend) / localhost:3000 (frontend)

**Target:** Raspberry Pi 5 (8GB) with touchscreen

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

## File Structure

```
backend/services/{feature}/
├── routes.py      # API endpoints
├── schemas.py     # Pydantic models
├── crud.py        # Database operations

frontend/src/features/{feature}/
├── ComponentName.tsx
├── ComponentName.css

docs/
├── ROADMAP.md
├── technical-debt.md
├── session-starter-checklist.md
```

---

## Common Pitfalls to Avoid

1. **Don't assume camelCase** - API returns snake_case
2. **Don't forget selectinload** - Relationships need eager loading
3. **Don't use emoji for icons** - Use Ant Design icons or SVG
4. **Don't skip form reset** - Clear state before new entry
5. **Don't forget to serialize** - ORM objects need explicit conversion
6. **Don't assume Docker cache invalidates** - Use --no-cache when needed

---

## Session Start Template

```
I'm continuing work on Family Hub.

Please review:
1. CLAUDE.md (this file)
2. docs/ROADMAP.md
3. docs/technical-debt.md

Current Phase: Phase 2 - Integration & Sync
Working on: [describe task]
```

---

**Document Version:** 1.0
**Created:** December 23, 2025
**Owner:** James Brown
