"""
Tasks database operations
Location: backend/services/tasks/crud.py
"""

from datetime import datetime, timezone, timedelta, date
from typing import Optional
from uuid import UUID

from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from shared.models import Task, SubTask, TaskNudge, User
from services.tasks import schemas


# ============ Task Operations ============

async def get_tasks_by_tenant(
    db: AsyncSession,
    tenant_id: UUID,
    status: Optional[str] = None,
    user_id: Optional[UUID] = None,
    category: Optional[str] = None,
) -> list[Task]:
    """Get tasks for a tenant with optional filters."""
    query = (
        select(Task)
        .options(
            selectinload(Task.subtasks),
            selectinload(Task.assigned_user),
        )
        .where(Task.tenant_id == tenant_id)
    )

    if status:
        query = query.where(Task.status == status)
    if user_id:
        query = query.where(Task.user_id == user_id)
    if category:
        query = query.where(Task.category == category)

    # Sort: urgent first, then by due_date (nulls last), then created_at
    query = query.order_by(
        Task.due_date.asc().nullslast(),
        Task.created_at.desc(),
    )

    result = await db.execute(query)
    return result.scalars().all()


async def get_task_by_id(
    db: AsyncSession,
    task_id: UUID,
    tenant_id: UUID,
) -> Optional[Task]:
    """Get a single task with all relationships."""
    result = await db.execute(
        select(Task)
        .options(
            selectinload(Task.subtasks),
            selectinload(Task.assigned_user),
        )
        .where(and_(
            Task.id == task_id,
            Task.tenant_id == tenant_id,
        ))
    )
    return result.scalar_one_or_none()


async def create_task(
    db: AsyncSession,
    tenant_id: UUID,
    created_by_id: UUID,
    task_data: schemas.TaskCreate,
) -> Task:
    """Create a new task."""
    new_task = Task(
        tenant_id=tenant_id,
        user_id=task_data.user_id,
        title=task_data.title,
        description=task_data.description,
        due_date=task_data.due_date,
        due_time=task_data.due_time,
        priority=task_data.priority or "normal",
        category=task_data.category,
        recurrence_rule=task_data.recurrence_rule,
        points=task_data.points or 0,
        status="pending",
        created_by=created_by_id,
    )
    db.add(new_task)
    await db.commit()
    await db.refresh(new_task)

    # Re-fetch with relationships
    return await get_task_by_id(db, new_task.id, tenant_id)


async def update_task(
    db: AsyncSession,
    task: Task,
    task_data: schemas.TaskUpdate,
) -> Task:
    """Update a task with provided fields."""
    update_dict = task_data.model_dump(exclude_unset=True)

    for key, value in update_dict.items():
        setattr(task, key, value)

    # If being marked complete, set completed_at
    if task_data.status == "complete" and task.completed_at is None:
        task.completed_at = datetime.now(timezone.utc)

    task.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(task)
    return task


async def delete_task(db: AsyncSession, task: Task) -> None:
    """Delete a task and its subtasks (cascade)."""
    await db.delete(task)
    await db.commit()


async def toggle_task_status(
    db: AsyncSession,
    task: Task,
    user_id: UUID,
) -> Task:
    """Toggle task between pending and complete."""
    if task.status == "complete":
        task.status = "pending"
        task.completed_at = None
        task.completed_by = None
    else:
        task.status = "complete"
        task.completed_at = datetime.now(timezone.utc)
        task.completed_by = user_id

    task.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(task)
    return task


# ============ SubTask Operations ============

async def get_subtask_by_id(
    db: AsyncSession,
    subtask_id: UUID,
    tenant_id: UUID,
) -> Optional[SubTask]:
    """Get a specific subtask."""
    result = await db.execute(
        select(SubTask).where(and_(
            SubTask.id == subtask_id,
            SubTask.tenant_id == tenant_id,
        ))
    )
    return result.scalar_one_or_none()


async def create_subtask(
    db: AsyncSession,
    task_id: UUID,
    tenant_id: UUID,
    subtask_data: schemas.SubTaskCreate,
) -> SubTask:
    """Create a new subtask."""
    # Get max sort_order for this task
    result = await db.execute(
        select(func.max(SubTask.sort_order))
        .where(SubTask.task_id == task_id)
    )
    max_order = result.scalar() or 0

    new_subtask = SubTask(
        task_id=task_id,
        tenant_id=tenant_id,
        title=subtask_data.title,
        sort_order=max_order + 1,
    )
    db.add(new_subtask)
    await db.commit()
    await db.refresh(new_subtask)
    return new_subtask


async def update_subtask(
    db: AsyncSession,
    subtask: SubTask,
    subtask_data: schemas.SubTaskUpdate,
) -> SubTask:
    """Update a subtask."""
    update_dict = subtask_data.model_dump(exclude_unset=True)

    for key, value in update_dict.items():
        if key == "completed" and value is True and not subtask.completed:
            subtask.completed = True
            subtask.completed_at = datetime.now(timezone.utc)
        elif key == "completed" and value is False:
            subtask.completed = False
            subtask.completed_at = None
        elif key != "completed":
            setattr(subtask, key, value)

    subtask.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(subtask)
    return subtask


async def delete_subtask(db: AsyncSession, subtask: SubTask) -> None:
    """Delete a subtask."""
    await db.delete(subtask)
    await db.commit()


# ============ Nudge Operations ============

async def can_nudge_user(
    db: AsyncSession,
    task_id: UUID,
    from_user_id: UUID,
    to_user_id: UUID,
) -> tuple[bool, float]:
    """
    Check if a nudge can be sent. Returns (can_nudge, hours_until_available).
    Rules: 24hr cooldown per task/from_user/to_user combo, can't nudge yourself.
    """
    if from_user_id == to_user_id:
        return False, 0

    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)

    result = await db.execute(
        select(TaskNudge)
        .where(and_(
            TaskNudge.task_id == task_id,
            TaskNudge.from_user_id == from_user_id,
            TaskNudge.to_user_id == to_user_id,
            TaskNudge.created_at > cutoff,
        ))
        .order_by(TaskNudge.created_at.desc())
        .limit(1)
    )
    recent_nudge = result.scalar_one_or_none()

    if recent_nudge is None:
        return True, 0

    elapsed = (datetime.now(timezone.utc) - recent_nudge.created_at).total_seconds() / 3600
    hours_remaining = max(0, 24 - elapsed)
    return False, round(hours_remaining, 1)


async def create_nudge(
    db: AsyncSession,
    task_id: UUID,
    tenant_id: UUID,
    from_user_id: UUID,
    to_user_id: UUID,
    message: Optional[str] = None,
) -> TaskNudge:
    """Create a nudge notification."""
    nudge = TaskNudge(
        task_id=task_id,
        tenant_id=tenant_id,
        from_user_id=from_user_id,
        to_user_id=to_user_id,
        message=message,
    )
    db.add(nudge)
    await db.commit()
    await db.refresh(nudge)
    return nudge


async def get_user_nudges(
    db: AsyncSession,
    user_id: UUID,
    unread_only: bool = False,
) -> list[TaskNudge]:
    """Get nudges for a user."""
    query = (
        select(TaskNudge)
        .options(
            selectinload(TaskNudge.task),
            selectinload(TaskNudge.from_user),
            selectinload(TaskNudge.to_user),
        )
        .where(TaskNudge.to_user_id == user_id)
    )

    if unread_only:
        query = query.where(TaskNudge.is_read == False)

    query = query.order_by(TaskNudge.created_at.desc()).limit(50)

    result = await db.execute(query)
    return result.scalars().all()


async def get_unread_nudge_count(
    db: AsyncSession,
    user_id: UUID,
) -> int:
    """Get count of unread nudges for a user."""
    result = await db.execute(
        select(func.count(TaskNudge.id))
        .where(and_(
            TaskNudge.to_user_id == user_id,
            TaskNudge.is_read == False,
        ))
    )
    return result.scalar() or 0


async def mark_nudge_read(
    db: AsyncSession,
    nudge_id: UUID,
    user_id: UUID,
) -> Optional[TaskNudge]:
    """Mark a nudge as read."""
    result = await db.execute(
        select(TaskNudge).where(and_(
            TaskNudge.id == nudge_id,
            TaskNudge.to_user_id == user_id,
        ))
    )
    nudge = result.scalar_one_or_none()
    if nudge:
        nudge.is_read = True
        nudge.read_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(nudge)
    return nudge


# ============ Stats Operations ============

async def get_tenant_stats(
    db: AsyncSession,
    tenant_id: UUID,
) -> dict:
    """Get task statistics for a tenant."""
    today = date.today()

    # Total pending
    pending_result = await db.execute(
        select(func.count(Task.id))
        .where(and_(
            Task.tenant_id == tenant_id,
            Task.status.in_(["pending", "in_progress"]),
        ))
    )
    total_pending = pending_result.scalar() or 0

    # Completed today
    today_start = datetime.combine(today, datetime.min.time()).replace(tzinfo=timezone.utc)
    completed_result = await db.execute(
        select(func.count(Task.id))
        .where(and_(
            Task.tenant_id == tenant_id,
            Task.status == "complete",
            Task.completed_at >= today_start,
        ))
    )
    completed_today = completed_result.scalar() or 0

    # Per-user stats
    users_result = await db.execute(
        select(User).where(and_(
            User.tenant_id == tenant_id,
            User.is_active == True,
        ))
    )
    users = users_result.scalars().all()

    user_stats = []
    for user in users:
        # Pending for this user
        user_pending = await db.execute(
            select(func.count(Task.id))
            .where(and_(
                Task.tenant_id == tenant_id,
                Task.user_id == user.id,
                Task.status.in_(["pending", "in_progress"]),
            ))
        )

        # Completed today for this user
        user_completed = await db.execute(
            select(func.count(Task.id))
            .where(and_(
                Task.tenant_id == tenant_id,
                Task.completed_by == user.id,
                Task.status == "complete",
                Task.completed_at >= today_start,
            ))
        )

        user_stats.append({
            "user_id": str(user.id),
            "user_name": user.name,
            "user_color": user.color,
            "pending": user_pending.scalar() or 0,
            "completed_today": user_completed.scalar() or 0,
        })

    return {
        "total_pending": total_pending,
        "completed_today": completed_today,
        "user_stats": user_stats,
    }


# ============ Helper Operations ============

async def get_users_by_ids(
    db: AsyncSession,
    user_ids: list[UUID],
) -> dict[UUID, User]:
    """Batch fetch users by IDs - prevents N+1 queries."""
    if not user_ids:
        return {}
    result = await db.execute(
        select(User).where(User.id.in_(user_ids))
    )
    users = result.scalars().all()
    return {user.id: user for user in users}
