"""
Tasks Pydantic schemas
Location: backend/services/tasks/schemas.py
"""

from datetime import datetime, date, time
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


# ============ Request Schemas ============

class TaskCreate(BaseModel):
    """Create a new task"""
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    due_date: Optional[date] = None
    due_time: Optional[time] = None
    user_id: Optional[UUID] = None  # Assign to family member
    priority: Optional[str] = Field(default="normal", pattern="^(low|normal|high|urgent)$")
    category: Optional[str] = Field(None, max_length=100)
    recurrence_rule: Optional[str] = None
    points: Optional[int] = Field(default=0, ge=0)


class TaskUpdate(BaseModel):
    """Update a task (all fields optional)"""
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = None
    due_date: Optional[date] = None
    due_time: Optional[time] = None
    user_id: Optional[UUID] = None
    priority: Optional[str] = Field(None, pattern="^(low|normal|high|urgent)$")
    category: Optional[str] = Field(None, max_length=100)
    status: Optional[str] = Field(None, pattern="^(pending|in_progress|complete|cancelled)$")
    recurrence_rule: Optional[str] = None
    points: Optional[int] = Field(None, ge=0)


class SubTaskCreate(BaseModel):
    """Create a subtask"""
    title: str = Field(..., min_length=1, max_length=500)


class SubTaskUpdate(BaseModel):
    """Update a subtask"""
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    completed: Optional[bool] = None


class TaskNudgeCreate(BaseModel):
    """Send a nudge about a task"""
    to_user_id: UUID
    message: Optional[str] = Field(None, max_length=500)


class SubTaskReorder(BaseModel):
    """Reorder subtasks"""
    subtask_ids: list[UUID]


# ============ Response Schemas ============

class TaskUser(BaseModel):
    """User summary for task responses"""
    id: UUID
    name: str
    color: str

    class Config:
        from_attributes = True


class SubTaskResponse(BaseModel):
    """Subtask in responses"""
    id: UUID
    title: str
    completed: bool
    completed_at: Optional[datetime]
    sort_order: int
    created_at: datetime

    class Config:
        from_attributes = True


class TaskResponse(BaseModel):
    """Task in responses"""
    id: UUID
    tenant_id: UUID
    user_id: Optional[UUID]
    title: str
    description: Optional[str]
    due_date: Optional[date]
    due_time: Optional[time]
    recurrence_rule: Optional[str]
    status: str
    priority: str
    points: int
    category: Optional[str]
    completed_at: Optional[datetime]
    completed_by: Optional[UUID]
    created_by: Optional[UUID]
    created_at: datetime
    updated_at: Optional[datetime]
    # Relationships
    subtasks: list[SubTaskResponse] = []
    assigned_user: Optional[TaskUser] = None
    # Computed
    subtask_total: int = 0
    subtask_completed: int = 0

    class Config:
        from_attributes = True


class TaskNudgeResponse(BaseModel):
    """Nudge notification in responses"""
    id: UUID
    task_id: UUID
    task_title: str
    from_user: TaskUser
    to_user: TaskUser
    message: Optional[str]
    is_read: bool
    read_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class NudgeAvailabilityResponse(BaseModel):
    """Whether a nudge can be sent"""
    can_nudge: bool
    hours_until_available: float = 0


class TaskStatsResponse(BaseModel):
    """Task statistics for dashboard"""
    total_pending: int
    completed_today: int
    user_stats: list[dict]  # [{user_id, user_name, user_color, pending, completed_today}]


class MessageResponse(BaseModel):
    """Simple message response"""
    message: str


class UnreadCountResponse(BaseModel):
    """Unread nudge count"""
    count: int
