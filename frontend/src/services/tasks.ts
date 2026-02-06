/**
 * Tasks API service
 * Location: frontend/src/services/tasks.ts
 */

import { api } from './auth';
import type {
  Task,
  TaskCreate,
  TaskUpdate,
  SubTask,
  SubTaskCreate,
  SubTaskUpdate,
  TaskNudge,
  NudgeAvailability,
  TaskStats,
} from '../types/tasks';

export const tasksApi = {
  // ============ Task Operations ============

  getTasks: async (filters?: { status?: string; user_id?: string; category?: string }): Promise<Task[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.user_id) params.append('user_id', filters.user_id);
    if (filters?.category) params.append('category', filters.category);
    const query = params.toString();
    const response = await api.get(`/tasks${query ? `?${query}` : ''}`);
    return response.data;
  },

  getTask: async (taskId: string): Promise<Task> => {
    const response = await api.get(`/tasks/${taskId}`);
    return response.data;
  },

  createTask: async (task: TaskCreate): Promise<Task> => {
    const response = await api.post('/tasks', task);
    return response.data;
  },

  updateTask: async (taskId: string, updates: TaskUpdate): Promise<Task> => {
    const response = await api.put(`/tasks/${taskId}`, updates);
    return response.data;
  },

  deleteTask: async (taskId: string): Promise<{ message: string }> => {
    const response = await api.delete(`/tasks/${taskId}`);
    return response.data;
  },

  toggleTask: async (taskId: string): Promise<Task> => {
    const response = await api.post(`/tasks/${taskId}/toggle`);
    return response.data;
  },

  getStats: async (): Promise<TaskStats> => {
    const response = await api.get('/tasks/stats');
    return response.data;
  },

  // ============ SubTask Operations ============

  createSubtask: async (taskId: string, title: string): Promise<SubTask> => {
    const response = await api.post(`/tasks/${taskId}/subtasks`, { title });
    return response.data;
  },

  updateSubtask: async (taskId: string, subtaskId: string, updates: SubTaskUpdate): Promise<SubTask> => {
    const response = await api.put(`/tasks/${taskId}/subtasks/${subtaskId}`, updates);
    return response.data;
  },

  deleteSubtask: async (taskId: string, subtaskId: string): Promise<{ message: string }> => {
    const response = await api.delete(`/tasks/${taskId}/subtasks/${subtaskId}`);
    return response.data;
  },

  // ============ Nudge Operations ============

  getNudges: async (unreadOnly: boolean = false): Promise<TaskNudge[]> => {
    const response = await api.get(`/tasks/nudges/me${unreadOnly ? '?unread_only=true' : ''}`);
    return response.data;
  },

  getUnreadNudgeCount: async (): Promise<number> => {
    const response = await api.get('/tasks/nudges/unread-count');
    return response.data.count;
  },

  sendNudge: async (taskId: string, toUserId: string, message?: string): Promise<TaskNudge> => {
    const response = await api.post(`/tasks/${taskId}/nudge`, { to_user_id: toUserId, message });
    return response.data;
  },

  checkNudgeAvailability: async (taskId: string): Promise<NudgeAvailability> => {
    const response = await api.get(`/tasks/${taskId}/nudge/availability`);
    return response.data;
  },

  markNudgeRead: async (nudgeId: string): Promise<TaskNudge> => {
    const response = await api.put(`/tasks/nudges/${nudgeId}/read`);
    return response.data;
  },
};
