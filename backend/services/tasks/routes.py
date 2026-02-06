"""
Tasks API routes
Location: backend/services/tasks/routes.py
"""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from sqlalchemy import select as sa_select
from sqlalchemy.orm import selectinload

from shared.database import get_db
from shared.models import User, TaskNudge as TaskNudgeModel
from services.auth.security import get_current_user, get_current_tenant_id
from services.tasks import crud, schemas

router = APIRouter()


# ============ Helper: Build task response ============

def build_task_response(task) -> dict:
    """Build a task response dict with relationships."""
    subtasks = []
    subtask_completed = 0
    for st in (task.subtasks or []):
        subtasks.append({
            "id": st.id,
            "title": st.title,
            "completed": st.completed,
            "completed_at": st.completed_at,
            "sort_order": st.sort_order,
            "created_at": st.created_at,
        })
        if st.completed:
            subtask_completed += 1

    assigned_user = None
    if task.assigned_user:
        assigned_user = {
            "id": task.assigned_user.id,
            "name": task.assigned_user.name,
            "color": task.assigned_user.color or "#3b82f6",
        }

    return {
        "id": task.id,
        "tenant_id": task.tenant_id,
        "user_id": task.user_id,
        "title": task.title,
        "description": task.description,
        "due_date": task.due_date,
        "due_time": task.due_time,
        "recurrence_rule": task.recurrence_rule,
        "status": task.status,
        "priority": task.priority,
        "points": task.points,
        "category": task.category,
        "completed_at": task.completed_at,
        "completed_by": task.completed_by,
        "created_by": task.created_by,
        "created_at": task.created_at,
        "updated_at": task.updated_at,
        "subtasks": subtasks,
        "assigned_user": assigned_user,
        "subtask_total": len(subtasks),
        "subtask_completed": subtask_completed,
    }


# ============ Task Endpoints ============

@router.get("", response_model=list[schemas.TaskResponse])
async def get_tasks(
    status_filter: Optional[str] = Query(None, alias="status"),
    user_id: Optional[UUID] = None,
    category: Optional[str] = None,
    tenant_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Get tasks for the current tenant with optional filters."""
    tasks = await crud.get_tasks_by_tenant(
        db, tenant_id, status=status_filter, user_id=user_id, category=category
    )
    return [build_task_response(t) for t in tasks]


@router.get("/stats", response_model=schemas.TaskStatsResponse)
async def get_task_stats(
    tenant_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Get task statistics for the dashboard."""
    stats = await crud.get_tenant_stats(db, tenant_id)
    return stats


# ============ Nudge Inbox Endpoints (MUST be before /{task_id} to avoid path conflict) ============

@router.get("/nudges/me", response_model=list[schemas.TaskNudgeResponse])
async def get_my_nudges(
    unread_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get nudge notifications for the current user."""
    nudges = await crud.get_user_nudges(db, current_user.id, unread_only)
    return [_build_nudge_response(n, n.task.title if n.task else "Unknown") for n in nudges]


@router.get("/nudges/unread-count", response_model=schemas.UnreadCountResponse)
async def get_unread_nudge_count(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get count of unread nudges for the current user."""
    count = await crud.get_unread_nudge_count(db, current_user.id)
    return {"count": count}


@router.put("/nudges/{nudge_id}/read", response_model=schemas.TaskNudgeResponse)
async def mark_nudge_read(
    nudge_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark a nudge as read."""
    nudge = await crud.mark_nudge_read(db, nudge_id, current_user.id)
    if not nudge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nudge not found",
        )

    # Fetch task title
    task = await crud.get_task_by_id(db, nudge.task_id, current_user.tenant_id)
    task_title = task.title if task else "Unknown"
    return _build_nudge_response(nudge, task_title)


# ============ Task Detail Endpoints ============

@router.get("/{task_id}", response_model=schemas.TaskResponse)
async def get_task(
    task_id: UUID,
    tenant_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Get a single task with full details."""
    task = await crud.get_task_by_id(db, task_id, tenant_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    return build_task_response(task)


@router.post("", response_model=schemas.TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    request: schemas.TaskCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new task."""
    task = await crud.create_task(
        db,
        tenant_id=current_user.tenant_id,
        created_by_id=current_user.id,
        task_data=request,
    )
    return build_task_response(task)


@router.put("/{task_id}", response_model=schemas.TaskResponse)
async def update_task(
    task_id: UUID,
    request: schemas.TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a task."""
    task = await crud.get_task_by_id(db, task_id, current_user.tenant_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    updated = await crud.update_task(db, task, request)
    # Re-fetch with relationships
    updated = await crud.get_task_by_id(db, task_id, current_user.tenant_id)
    return build_task_response(updated)


@router.delete("/{task_id}", response_model=schemas.MessageResponse)
async def delete_task(
    task_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a task."""
    task = await crud.get_task_by_id(db, task_id, current_user.tenant_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    await crud.delete_task(db, task)
    return {"message": "Task deleted"}


@router.post("/{task_id}/toggle", response_model=schemas.TaskResponse)
async def toggle_task(
    task_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Toggle task between pending and complete."""
    task = await crud.get_task_by_id(db, task_id, current_user.tenant_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    await crud.toggle_task_status(db, task, current_user.id)
    # Re-fetch with relationships
    task = await crud.get_task_by_id(db, task_id, current_user.tenant_id)
    return build_task_response(task)


# ============ SubTask Endpoints ============

@router.post("/{task_id}/subtasks", response_model=schemas.SubTaskResponse, status_code=status.HTTP_201_CREATED)
async def create_subtask(
    task_id: UUID,
    request: schemas.SubTaskCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a subtask to a task."""
    task = await crud.get_task_by_id(db, task_id, current_user.tenant_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    subtask = await crud.create_subtask(db, task_id, current_user.tenant_id, request)
    return subtask


@router.put("/{task_id}/subtasks/{subtask_id}", response_model=schemas.SubTaskResponse)
async def update_subtask(
    task_id: UUID,
    subtask_id: UUID,
    request: schemas.SubTaskUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a subtask."""
    # Verify task belongs to tenant
    task = await crud.get_task_by_id(db, task_id, current_user.tenant_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    subtask = await crud.get_subtask_by_id(db, subtask_id, current_user.tenant_id)
    if not subtask or subtask.task_id != task_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subtask not found",
        )

    updated = await crud.update_subtask(db, subtask, request)
    return updated


@router.delete("/{task_id}/subtasks/{subtask_id}", response_model=schemas.MessageResponse)
async def delete_subtask(
    task_id: UUID,
    subtask_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a subtask."""
    task = await crud.get_task_by_id(db, task_id, current_user.tenant_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    subtask = await crud.get_subtask_by_id(db, subtask_id, current_user.tenant_id)
    if not subtask or subtask.task_id != task_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subtask not found",
        )

    await crud.delete_subtask(db, subtask)
    return {"message": "Subtask deleted"}


# ============ Nudge Endpoints ============

@router.post("/{task_id}/nudge", response_model=schemas.TaskNudgeResponse)
async def send_nudge(
    task_id: UUID,
    request: schemas.TaskNudgeCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Send a nudge about a task to another family member."""
    task = await crud.get_task_by_id(db, task_id, current_user.tenant_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    can_nudge, hours_remaining = await crud.can_nudge_user(
        db, task_id, current_user.id, request.to_user_id
    )
    if not can_nudge:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Already nudged. Try again in {hours_remaining} hours.",
        )

    nudge = await crud.create_nudge(
        db,
        task_id=task_id,
        tenant_id=current_user.tenant_id,
        from_user_id=current_user.id,
        to_user_id=request.to_user_id,
        message=request.message,
    )

    # Fetch with relationships for response
    nudge_result = await db.execute(
        sa_select(TaskNudgeModel)
        .options(
            selectinload(TaskNudgeModel.from_user),
            selectinload(TaskNudgeModel.to_user),
        )
        .where(TaskNudgeModel.id == nudge.id)
    )
    nudge = nudge_result.scalar_one()

    return _build_nudge_response(nudge, task.title)


@router.get("/{task_id}/nudge/availability", response_model=schemas.NudgeAvailabilityResponse)
async def check_nudge_availability(
    task_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Check if current user can nudge the task's assignee."""
    task = await crud.get_task_by_id(db, task_id, current_user.tenant_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    if not task.user_id:
        return {"can_nudge": False, "hours_until_available": 0}

    can_nudge, hours_remaining = await crud.can_nudge_user(
        db, task_id, current_user.id, task.user_id
    )
    return {"can_nudge": can_nudge, "hours_until_available": hours_remaining}


# ============ Helper ============

def _build_nudge_response(nudge, task_title: str) -> dict:
    """Build a nudge response dict."""
    return {
        "id": nudge.id,
        "task_id": nudge.task_id,
        "task_title": task_title,
        "from_user": {
            "id": nudge.from_user.id,
            "name": nudge.from_user.name,
            "color": nudge.from_user.color or "#3b82f6",
        },
        "to_user": {
            "id": nudge.to_user.id,
            "name": nudge.to_user.name,
            "color": nudge.to_user.color or "#3b82f6",
        },
        "message": nudge.message,
        "is_read": nudge.is_read,
        "read_at": nudge.read_at,
        "created_at": nudge.created_at,
    }
