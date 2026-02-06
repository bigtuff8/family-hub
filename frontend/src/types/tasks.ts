/**
 * Task/Todo TypeScript types
 * Location: frontend/src/types/tasks.ts
 */

export interface TaskUser {
  id: string;
  name: string;
  color: string;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  completed_at: string | null;
  sort_order: number;
  created_at: string;
}

export interface Task {
  id: string;
  tenant_id: string;
  user_id: string | null;
  title: string;
  description: string | null;
  due_date: string | null;
  due_time: string | null;
  recurrence_rule: string | null;
  status: 'pending' | 'in_progress' | 'complete' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  points: number;
  category: string | null;
  completed_at: string | null;
  completed_by: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
  // Relationships
  subtasks: SubTask[];
  assigned_user: TaskUser | null;
  // Computed
  subtask_total: number;
  subtask_completed: number;
}

export interface TaskCreate {
  title: string;
  description?: string;
  due_date?: string;
  due_time?: string;
  user_id?: string;
  priority?: string;
  category?: string;
  recurrence_rule?: string;
  points?: number;
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  due_date?: string | null;
  due_time?: string | null;
  user_id?: string | null;
  priority?: string;
  category?: string | null;
  status?: string;
  recurrence_rule?: string | null;
  points?: number;
}

export interface SubTaskCreate {
  title: string;
}

export interface SubTaskUpdate {
  title?: string;
  completed?: boolean;
}

export interface TaskNudge {
  id: string;
  task_id: string;
  task_title: string;
  from_user: TaskUser;
  to_user: TaskUser;
  message: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface NudgeAvailability {
  can_nudge: boolean;
  hours_until_available: number;
}

export interface TaskStats {
  total_pending: number;
  completed_today: number;
  user_stats: {
    user_id: string;
    user_name: string;
    user_color: string;
    pending: number;
    completed_today: number;
  }[];
}
