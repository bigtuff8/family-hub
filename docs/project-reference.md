# Family Hub - Project Reference

## Project Overview

**Name:** Family Hub
**Purpose:** DIY Raspberry Pi family organization system (personal use + potential SaaS)
**Status:** Phase 2 - Advanced Features (Shopping List + Category Management Complete)
**Architecture:** Multi-tenant from day 1 (using Brown family as proof of concept)
**Last Updated:** December 21, 2025

## Key Project Documents

### Essential References (Store in `docs/` folder)

- **`Family Hub - Requirements Document.md`** - Complete project requirements, features, user stories
- **`Family Hub - Project Initialization Guide.md`** - Setup instructions, installation steps
- **`Spin-off Project: DIY Bluetooth Item Tracker.md`** - Future Tile tracker integration plans

### Quick Access

These documents should be stored in your project at:

```
family-hub/
├── docs/
│   ├── dev-workflow.md                          # This document's companion
│   ├── project-reference.md                     # This document
│   ├── session-starter.md                       # Combined quick reference
│   ├── Family Hub - Requirements Document.md    # Full requirements
│   ├── Family Hub - Project Initialization Guide.md
│   └── Spin-off Project - DIY Bluetooth Item Tracker.md
```

**Note:** You can drag-and-drop these into Claude conversations when detailed reference is needed.

## Tech Stack

### Backend

- **Language:** Python 3.11+
- **Framework:** FastAPI
- **Database:** PostgreSQL 15
- **ORM:** SQLAlchemy (async)
- **Validation:** Pydantic schemas
- **Timezone:** Europe/London (BST/GMT handling)

### Frontend

- **Framework:** React 18 + TypeScript
- **UI Library:** Ant Design
- **State:** React hooks (useState, useEffect)
- **Date/Time:** dayjs with timezone plugin
- **Build Tool:** Vite
- **API Calls:** Axios

### Infrastructure

- **Development:** Docker + Docker Compose
- **Database Container:** PostgreSQL (port 5432)
- **Backend Container:** FastAPI (port 8000)
- **Frontend Container:** Vite dev server (port 3000)
- **Target Hardware:** Raspberry Pi 5 (8GB) with touchscreen

## Design System: "Horizon"

### Colors

- **Navy:** `#1a2332` (primary dark)
- **Teal:** `#2dd4bf` (primary brand)
- **Coral:** `#fb7185` (accent)
- **Cream:** `#fef7f0` (background)

### Responsive Breakpoints

- **Tablet:** 768px+ (2-column layout)
- **Mobile:** <768px (single column, bottom nav)

## Family Data (Real)

### Brown Family Members

```typescript
const FAMILY_MEMBERS = [
  { id: '10000000-0000-0000-0000-000000000001', name: 'James', color: '#e30613' },   // Liverpool red
  { id: '10000000-0000-0000-0000-000000000002', name: 'Nicola', color: '#fb7185' },  // Pink
  { id: '10000000-0000-0000-0000-000000000003', name: 'Tommy', color: '#00B140' },   // Liverpool green
  { id: '10000000-0000-0000-0000-000000000004', name: 'Harry', color: '#1D428A' },   // Leeds blue
];
```

## Project Structure

```
family-hub/
├── backend/
│   ├── main.py                          # FastAPI app entry
│   ├── services/
│   │   ├── auth/
│   │   │   └── routes.py               # Authentication endpoints
│   │   ├── calendar/
│   │   │   ├── routes.py               # Calendar API endpoints
│   │   │   ├── crud.py                 # Database operations
│   │   │   └── schemas.py              # Pydantic models
│   │   └── shopping/
│   │       ├── routes.py               # Shopping list endpoints
│   │       ├── crud.py                 # Database operations
│   │       └── schemas.py              # Pydantic models
│   ├── shared/
│   │   ├── database.py                 # DB connection
│   │   ├── models.py                   # SQLAlchemy models
│   │   └── constants.py                # Shared constants
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── App.tsx                     # Main app component
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   │   ├── AuthContext.tsx     # Auth provider & useAuth hook
│   │   │   │   └── Login.tsx           # Login page
│   │   │   ├── calendar/
│   │   │   │   ├── Calendar.tsx        # Main calendar (routes mobile/tablet)
│   │   │   │   ├── CalendarTablet.tsx  # Tablet dashboard (2x2 grid)
│   │   │   │   ├── CalendarMobile.tsx  # Mobile dashboard (stacked)
│   │   │   │   ├── CalendarViews.tsx   # Month/Week/Day views
│   │   │   │   ├── CalendarEventForm.tsx  # Event create/edit form
│   │   │   │   └── CalendarTablet.css  # Responsive styles
│   │   │   └── shopping/
│   │   │       ├── ShoppingListPage.tsx     # Full shopping page
│   │   │       ├── ShoppingListPage.css     # Page styles
│   │   │       ├── ShoppingSnapshot.tsx     # Dashboard widget
│   │   │       ├── ShoppingSnapshot.css     # Widget styles
│   │   │       ├── ShoppingItem.tsx         # Single item component
│   │   │       ├── ShoppingItem.css         # Item styles
│   │   │       ├── CategoryGroup.tsx        # Category grouping
│   │   │       ├── CategoryGroup.css        # Group styles
│   │   │       ├── AddItemForm.tsx          # Add item form
│   │   │       ├── AddItemForm.css          # Form styles
│   │   │       ├── EditItemModal.tsx        # Item edit modal
│   │   │       ├── CategoryManagerDrawer.tsx # Category management UI
│   │   │       ├── CategoryEditModal.tsx    # Category create/edit form
│   │   │       └── EmojiPicker.tsx          # Emoji selection for categories
│   │   ├── services/
│   │   │   ├── calendar.ts             # Calendar API service
│   │   │   └── shopping.ts             # Shopping API service
│   │   ├── types/
│   │   │   ├── calendar.ts             # Calendar TypeScript types
│   │   │   └── shopping.ts             # Shopping TypeScript types
│   │   └── components/
│   ├── package.json
│   ├── Dockerfile.dev
│   └── .env
├── docker-compose.yml
├── docs/
│   ├── ROADMAP.md                      # Development roadmap
│   ├── technical-debt.md               # Technical debt tracking
│   ├── project-reference.md            # This document
│   ├── requirements-document.md        # Full requirements
│   ├── hardware-setup-purchases.md     # Hardware specs
│   └── session-starter-checklist.md    # Dev session guide
└── .gitignore
```

## Common File Locations

### Backend

- **API Routes:** `backend/services/{feature}/routes.py`
- **Database Models:** `backend/shared/models.py`
- **Schemas:** `backend/services/{feature}/schemas.py`

### Frontend

- **Feature Components:** `frontend/src/features/{feature}/`
- **API Services:** `frontend/src/services/{feature}.ts`
- **Types:** `frontend/src/types/{feature}.ts`

## Database Schema Notes

### Multi-Tenancy

- Every table has `tenant_id` foreign key
- Tenant = Family/household
- Brown family is tenant ID: `10000000-0000-0000-0000-000000000000`

### Timezone Handling

- Store all times in UTC
- Convert to Europe/London for display
- Handle BST/GMT transitions (subtract 1 hour for BST)

## Development Commands

```bash
# Start everything
docker-compose up -d

# View logs
docker-compose logs -f

# Restart a service
docker-compose restart backend
docker-compose restart frontend

# Stop everything
docker-compose down

# Fresh start (deletes data!)
docker-compose down -v && docker-compose up -d
```

## Git Workflow

```bash
# Daily workflow
git pull                                    # Get latest
# ... make changes ...
git add .
git commit -m "Descriptive message"
git push                                    # Send to GitHub

# Repository
GitHub: https://github.com/bigtuff8/family-hub
```

## Feature Status

### Phase 1 - Calendar ✅ COMPLETE

- ✅ Calendar event CRUD (create, read, update, delete)
- ✅ Family member assignment
- ✅ Event colors by family member
- ✅ Timezone handling (BST/GMT with dayjs.tz)
- ✅ Address search (Nominatim API)
- ✅ 30-minute default duration with auto-update
- ✅ All-day events
- ✅ Recurring events support
- ✅ Calendar views (Month, Week, Day)
- ✅ Event editing/deletion

### Phase 1.5 - Auth ✅ COMPLETE

- ✅ JWT Authentication
- ✅ Login/Logout
- ✅ User avatars with initials and colors
- ✅ Auth context (`useAuth()` hook)
- ✅ Protected routes

### Phase 2 - Advanced Features 🔄 IN PROGRESS

**Shopping List ✅ COMPLETE:**
- ✅ Shopping list CRUD
- ✅ Item categories with icons
- ✅ Check-off/toggle items
- ✅ Quantity support
- ✅ Full shopping page (`/shopping`)
- ✅ Dashboard widget (ShoppingSnapshot)
- ✅ Quick-add from dashboard
- ✅ Edit item modal
- ✅ Items grouped by category

**Category Management ✅ COMPLETE:**
- ✅ Per-tenant custom categories (database-backed)
- ✅ UI to add/edit/delete shopping categories
- ✅ Custom emoji icons for categories
- ✅ Custom colors for categories
- ✅ Keyword-based auto-categorization
- ✅ Category reordering (up/down)
- ✅ CategoryManagerDrawer component
- ✅ EmojiPicker component
- ✅ CategoryEditModal component

**Smart Shopping Behavior ✅ COMPLETE:**
- ✅ Complete Shop = bulk mark all as checked (not delete)
- ✅ 24-hour auto-hide for checked items (remain in DB for suggestions)
- ✅ Duplicate detection for recently completed items
- ✅ Confirmation modal: "You completed X hours ago. Add again?"
- ✅ Force-add replaces old completed item with fresh one
- ✅ Item names retained for autocomplete suggestions

**Dashboard Layout ✅ COMPLETE:**
- ✅ 2x2 grid layout for tablet (1920x1080)
  - Top Left: Today's Schedule
  - Top Right: Coming Up
  - Bottom Left: Shopping List
  - Bottom Right: Quick Actions
- ✅ Mobile view with stacked tiles
- ✅ Separate CalendarTablet and CalendarMobile components

**Remaining Phase 2:**
- ⬜ Tasks/Chores feature
- ⬜ Meal planning
- ⬜ Family relationships (TD-002)
- ⬜ External contacts (TD-003)
- ⬜ Cross-tenant event invitations (TD-004)

## For Detailed Requirements

See: **`docs/requirements-document.md`**

- Full feature specifications
- User stories
- Non-functional requirements
- Success criteria
- Out of scope items
