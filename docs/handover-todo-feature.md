# Todo/Tasks Feature - Handover Document

**Date:** 6 February 2026
**Status:** Code complete, pushed to GitHub. Pi deployment pending.

---

## What Was Built

A full-stack Todo/Tasks feature for Family Hub, replacing the Quick Actions card on the dashboard with a task management system including subtasks and a nudge notification system.

### Feature Summary
- **Dashboard widget** (TodoSnapshot) - shows top pending tasks with quick-add and toggle
- **Full task list page** (`/todos`) - filterable, sortable, grouped by category
- **Task detail drawer** - edit title/description/priority/due date, manage subtasks
- **Nudge system** - family members can nudge each other about tasks (24hr cooldown)
- **Notification inbox** - drawer showing received nudges with mark-read functionality
- **Notification badge** - on user avatar, polls every 30 seconds

---

## Deployment Status

| Step | Status |
|------|--------|
| Code written and tested locally | Done |
| Committed to git | Done (commit `56fc4f6`) |
| Pushed to GitHub | Done |
| Pi: git pull | Done (said "Already up to date" - previous push landed) |
| Pi: Backend Docker build | Done (completed successfully) |
| Pi: Frontend Docker build | **Partial** - npm install completed, SSH disconnected during Vite build step |
| Pi: docker-compose up -d | **Not run** |

### To Complete Deployment

SSH into the Pi and run:
```bash
ssh bigtuff8@100.118.56.111
cd family-hub
docker-compose build --no-cache
docker-compose up -d
```

If only the frontend needs rebuilding:
```bash
docker-compose build --no-cache frontend
docker-compose up -d
```

**Note:** The Pi became unreachable after the heavy Docker build (likely resource exhaustion). It may need a physical power cycle before SSH works again.

---

## Files Created

### Backend (4 new files, 2 modified)

| File | Description |
|------|-------------|
| `backend/shared/models.py` | **MODIFIED** - Added relationships/indexes to Task model, new SubTask and TaskNudge models |
| `backend/main.py` | **MODIFIED** - Registered tasks router: `app.include_router(tasks_router, prefix="/api/v1/tasks")` |
| `backend/services/tasks/__init__.py` | Package init |
| `backend/services/tasks/schemas.py` | Pydantic request/response models (TaskCreate, TaskUpdate, TaskResponse, SubTaskResponse, TaskNudgeResponse, etc.) |
| `backend/services/tasks/crud.py` | All database operations (CRUD for tasks, subtasks, nudges, stats) |
| `backend/services/tasks/routes.py` | FastAPI endpoints (see API Endpoints below) |

### Frontend (10 new files, 2 modified)

| File | Description |
|------|-------------|
| `frontend/src/App.tsx` | **MODIFIED** - Added `/todos` route with ProtectedRoute |
| `frontend/src/features/calendar/CalendarTablet.tsx` | **MODIFIED** - Replaced Quick Actions with TodoSnapshot, added nudge badge/drawer, added Tasks + Notifications to user dropdown |
| `frontend/src/types/tasks.ts` | TypeScript interfaces (Task, SubTask, TaskNudge, TaskStats, etc.) |
| `frontend/src/services/tasks.ts` | API client (`tasksApi` object with all methods) |
| `frontend/src/features/tasks/index.ts` | Feature barrel exports |
| `frontend/src/features/tasks/TodoSnapshot.tsx` | Dashboard widget card |
| `frontend/src/features/tasks/TodoSnapshot.css` | Widget styles |
| `frontend/src/features/tasks/TaskListPage.tsx` | Full task management page |
| `frontend/src/features/tasks/TaskListPage.css` | Page styles |
| `frontend/src/features/tasks/AddTaskForm.tsx` | Inline task creation form |
| `frontend/src/features/tasks/TaskItem.tsx` | Single task row component |
| `frontend/src/features/tasks/TaskDetailDrawer.tsx` | Slide-out task detail panel |
| `frontend/src/features/tasks/NudgeInboxDrawer.tsx` | Notification inbox drawer |

---

## API Endpoints

All endpoints are under `/api/v1/tasks` and require authentication.

**IMPORTANT:** Nudge inbox routes are placed BEFORE `/{task_id}` to avoid FastAPI treating "nudges" as a UUID path parameter.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/tasks` | List tasks (query: status, user_id, category) |
| GET | `/tasks/stats` | Tenant task statistics |
| GET | `/tasks/nudges/me` | Current user's received nudges |
| GET | `/tasks/nudges/unread-count` | Unread nudge count |
| PUT | `/tasks/nudges/{nudge_id}/read` | Mark nudge as read |
| GET | `/tasks/{task_id}` | Get single task with subtasks |
| POST | `/tasks` | Create task |
| PUT | `/tasks/{task_id}` | Update task |
| DELETE | `/tasks/{task_id}` | Delete task and subtasks |
| POST | `/tasks/{task_id}/toggle` | Toggle task complete/pending |
| POST | `/tasks/{task_id}/subtasks` | Create subtask |
| PUT | `/tasks/{task_id}/subtasks/{subtask_id}` | Update subtask |
| DELETE | `/tasks/{task_id}/subtasks/{subtask_id}` | Delete subtask |
| POST | `/tasks/{task_id}/nudge` | Send nudge to assignee |
| GET | `/tasks/{task_id}/nudge/availability` | Check nudge cooldown |

---

## Database Models

### Task (existing, extended)
- Added relationships: `subtasks`, `assigned_user`, `completed_by_user`, `created_by_user`
- Added indexes: `idx_tasks_tenant`, `idx_tasks_user`, `idx_tasks_status`, `idx_tasks_due_date`
- Changed default status from `'todo'` to `'pending'`

### SubTask (new)
- Fields: id, task_id, tenant_id, title, completed, completed_at, sort_order, created_at, updated_at
- Belongs to Task via cascade delete

### TaskNudge (new)
- Fields: id, task_id, tenant_id, from_user_id, to_user_id, message, is_read, read_at, created_at
- 24-hour cooldown enforced in `crud.can_nudge_user()`

**No Alembic migration needed** - `init_db()` uses `Base.metadata.create_all()` which creates new tables on startup.

---

## Key Design Decisions

1. **Route ordering**: Nudge routes (`/nudges/me`, `/nudges/unread-count`) placed before `/{task_id}` to prevent FastAPI UUID parsing conflict
2. **Optimistic UI**: TodoSnapshot removes tasks from the list immediately on toggle, before API confirms
3. **Nudge cooldown**: 24 hours between nudges from the same user to the same user on the same task
4. **Polling**: Nudge count polls every 30 seconds from CalendarTablet
5. **No emoji**: All icons use Ant Design icon components (Pi browser lacks emoji fonts)
6. **snake_case**: All API data uses snake_case matching the Python backend

---

## Known Issues / Things to Verify After Deploy

1. **New database tables**: SubTask and TaskNudge tables will be created automatically on first backend startup via `init_db()`
2. **Frontend build**: Verify Vite build completes on Pi (was interrupted during first attempt)
3. **Touch targets**: All interactive elements are min 44x44px for touchscreen use
4. **Task status values**: The existing Task model used `'todo'` as default - changed to `'pending'`. If there are existing tasks in the DB with status `'todo'`, they won't show up in filtered views that look for `'pending'`. May need a manual DB update: `UPDATE tasks SET status='pending' WHERE status='todo';`

---

## Testing Checklist

After deployment, verify:

- [ ] Dashboard shows TodoSnapshot widget (bottom-right of 2x2 grid)
- [ ] Can quick-add a task from dashboard
- [ ] Can toggle task complete from dashboard
- [ ] "View All" navigates to `/todos`
- [ ] Full task list page loads with header, filters, stats bar
- [ ] Can create task with title, assignee, due date, priority, category
- [ ] Can open task detail drawer by clicking a task
- [ ] Can edit task (title, description, priority, due date)
- [ ] Can add/toggle/delete subtasks in detail drawer
- [ ] Can delete a task
- [ ] Nudge badge appears on avatar when nudges exist
- [ ] Can open nudge inbox from avatar dropdown > Notifications
- [ ] Can send nudge to another user's task
- [ ] Nudge 24hr cooldown works
- [ ] Can mark nudges as read
- [ ] Navigation works: Dashboard > Tasks page > back to Dashboard
