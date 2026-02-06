/**
 * Task detail drawer (slide-out panel)
 * Location: frontend/src/features/tasks/TaskDetailDrawer.tsx
 */

import { useState, useEffect } from 'react';
import { Drawer, Button, Input, Checkbox, Avatar, Select, DatePicker, Space, Popconfirm, message, Divider } from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  BellOutlined,
  PlusOutlined,
  ClockCircleOutlined,
  UserOutlined,
  FlagOutlined,
  FolderOutlined,
} from '@ant-design/icons';
import { useAuth } from '../auth/AuthContext';
import { tasksApi } from '../../services/tasks';
import { getInitials } from '../../utils/strings';
import type { Task, SubTask, NudgeAvailability } from '../../types/tasks';
import dayjs from 'dayjs';

interface TaskDetailDrawerProps {
  task: Task | null;
  visible: boolean;
  onClose: () => void;
  onTaskUpdated: () => void;
  onTaskDeleted: () => void;
}

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const PRIORITY_COLORS: Record<string, string> = {
  urgent: '#dc2626',
  high: '#f59e0b',
  normal: '#2dd4bf',
  low: '#94a3b8',
};

export function TaskDetailDrawer({ task, visible, onClose, onTaskUpdated, onTaskDeleted }: TaskDetailDrawerProps) {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState('normal');
  const [editDueDate, setEditDueDate] = useState<dayjs.Dayjs | null>(null);
  const [newSubtask, setNewSubtask] = useState('');
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [nudgeAvail, setNudgeAvail] = useState<NudgeAvailability | null>(null);
  const [nudging, setNudging] = useState(false);
  const [fullTask, setFullTask] = useState<Task | null>(null);

  // Fetch full task details when drawer opens
  useEffect(() => {
    if (task && visible) {
      tasksApi.getTask(task.id).then(setFullTask).catch(() => setFullTask(task));
      // Check nudge availability
      if (task.user_id && task.user_id !== user?.id) {
        tasksApi.checkNudgeAvailability(task.id).then(setNudgeAvail).catch(() => {});
      } else {
        setNudgeAvail(null);
      }
    }
  }, [task, visible, user?.id]);

  // Sync edit state
  useEffect(() => {
    if (fullTask && editing) {
      setEditTitle(fullTask.title);
      setEditDescription(fullTask.description || '');
      setEditPriority(fullTask.priority);
      setEditDueDate(fullTask.due_date ? dayjs(fullTask.due_date) : null);
    }
  }, [fullTask, editing]);

  const currentTask = fullTask || task;
  if (!currentTask) return null;

  const handleSave = async () => {
    try {
      await tasksApi.updateTask(currentTask.id, {
        title: editTitle,
        description: editDescription || undefined,
        priority: editPriority,
        due_date: editDueDate ? editDueDate.format('YYYY-MM-DD') : null,
      });
      message.success('Task updated');
      setEditing(false);
      onTaskUpdated();
      // Refresh detail
      const updated = await tasksApi.getTask(currentTask.id);
      setFullTask(updated);
    } catch (err) {
      message.error('Failed to update task');
    }
  };

  const handleDelete = async () => {
    try {
      await tasksApi.deleteTask(currentTask.id);
      message.success('Task deleted');
      onTaskDeleted();
    } catch (err) {
      message.error('Failed to delete task');
    }
  };

  const handleAddSubtask = async () => {
    if (!newSubtask.trim()) return;
    setAddingSubtask(true);
    try {
      await tasksApi.createSubtask(currentTask.id, newSubtask.trim());
      setNewSubtask('');
      const updated = await tasksApi.getTask(currentTask.id);
      setFullTask(updated);
      onTaskUpdated();
    } catch (err) {
      message.error('Failed to add subtask');
    } finally {
      setAddingSubtask(false);
    }
  };

  const handleToggleSubtask = async (subtask: SubTask) => {
    try {
      await tasksApi.updateSubtask(currentTask.id, subtask.id, { completed: !subtask.completed });
      const updated = await tasksApi.getTask(currentTask.id);
      setFullTask(updated);
      onTaskUpdated();
    } catch (err) {
      message.error('Failed to update subtask');
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    try {
      await tasksApi.deleteSubtask(currentTask.id, subtaskId);
      const updated = await tasksApi.getTask(currentTask.id);
      setFullTask(updated);
      onTaskUpdated();
    } catch (err) {
      message.error('Failed to delete subtask');
    }
  };

  const handleNudge = async () => {
    if (!currentTask.user_id) return;
    setNudging(true);
    try {
      await tasksApi.sendNudge(currentTask.id, currentTask.user_id);
      message.success(`Nudge sent to ${currentTask.assigned_user?.name || 'assignee'}`);
      setNudgeAvail({ can_nudge: false, hours_until_available: 24 });
    } catch (err: any) {
      message.error(err?.response?.data?.detail || 'Failed to send nudge');
    } finally {
      setNudging(false);
    }
  };

  return (
    <Drawer
      title={null}
      placement="right"
      width={420}
      open={visible}
      onClose={() => { setEditing(false); onClose(); }}
      styles={{ body: { padding: 0 } }}
    >
      <div style={{ padding: 24 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            {editing ? (
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}
              />
            ) : (
              <h2 style={{ fontSize: 20, fontWeight: 600, color: '#1a2332', margin: 0 }}>
                {currentTask.title}
              </h2>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <span style={{
                fontSize: 12,
                padding: '3px 10px',
                borderRadius: 10,
                background: PRIORITY_COLORS[currentTask.priority] + '20',
                color: PRIORITY_COLORS[currentTask.priority],
                fontWeight: 600,
              }}>
                {currentTask.priority}
              </span>
              <span style={{
                fontSize: 12,
                padding: '3px 10px',
                borderRadius: 10,
                background: currentTask.status === 'complete' ? '#dcfce7' : '#fef3c7',
                color: currentTask.status === 'complete' ? '#16a34a' : '#d97706',
              }}>
                {currentTask.status}
              </span>
            </div>
          </div>
          <Space>
            {!editing ? (
              <Button icon={<EditOutlined />} onClick={() => setEditing(true)} />
            ) : (
              <>
                <Button onClick={() => setEditing(false)}>Cancel</Button>
                <Button type="primary" onClick={handleSave}>Save</Button>
              </>
            )}
          </Space>
        </div>

        {/* Description */}
        {editing ? (
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, color: '#64748b', display: 'block', marginBottom: 4 }}>Notes</label>
            <Input.TextArea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={3}
              placeholder="Add notes..."
            />
          </div>
        ) : currentTask.description ? (
          <div style={{ marginBottom: 16, padding: 12, background: '#f8fafc', borderRadius: 8 }}>
            <p style={{ margin: 0, color: '#475569', fontSize: 14, whiteSpace: 'pre-wrap' }}>
              {currentTask.description}
            </p>
          </div>
        ) : null}

        {/* Details Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          {/* Due Date */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ClockCircleOutlined style={{ color: '#64748b' }} />
            <span style={{ fontSize: 13, color: '#64748b', width: 70 }}>Due</span>
            {editing ? (
              <DatePicker
                value={editDueDate}
                onChange={setEditDueDate}
                style={{ flex: 1 }}
              />
            ) : (
              <span style={{ fontSize: 14, color: '#2c3e50' }}>
                {currentTask.due_date ? dayjs(currentTask.due_date).format('ddd, MMM D YYYY') : 'No due date'}
              </span>
            )}
          </div>

          {/* Priority */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FlagOutlined style={{ color: '#64748b' }} />
            <span style={{ fontSize: 13, color: '#64748b', width: 70 }}>Priority</span>
            {editing ? (
              <Select
                value={editPriority}
                onChange={setEditPriority}
                options={PRIORITY_OPTIONS}
                style={{ flex: 1 }}
              />
            ) : (
              <span style={{
                fontSize: 14,
                color: PRIORITY_COLORS[currentTask.priority],
                fontWeight: 600,
              }}>
                {currentTask.priority.charAt(0).toUpperCase() + currentTask.priority.slice(1)}
              </span>
            )}
          </div>

          {/* Assignee */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <UserOutlined style={{ color: '#64748b' }} />
            <span style={{ fontSize: 13, color: '#64748b', width: 70 }}>Assigned</span>
            {currentTask.assigned_user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar
                  size={24}
                  style={{ backgroundColor: currentTask.assigned_user.color, fontSize: 10, fontWeight: 600 }}
                >
                  {getInitials(currentTask.assigned_user.name)}
                </Avatar>
                <span style={{ fontSize: 14, color: '#2c3e50' }}>
                  {currentTask.assigned_user.name}
                </span>
              </div>
            ) : (
              <span style={{ fontSize: 14, color: '#94a3b8' }}>Unassigned</span>
            )}
          </div>

          {/* Category */}
          {currentTask.category && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FolderOutlined style={{ color: '#64748b' }} />
              <span style={{ fontSize: 13, color: '#64748b', width: 70 }}>Category</span>
              <span style={{ fontSize: 14, color: '#2c3e50' }}>{currentTask.category}</span>
            </div>
          )}
        </div>

        <Divider />

        {/* Subtasks */}
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ fontSize: 16, fontWeight: 600, color: '#1a2332', marginBottom: 12 }}>
            Subtasks
            {currentTask.subtask_total > 0 && (
              <span style={{ fontWeight: 400, color: '#64748b', marginLeft: 8, fontSize: 14 }}>
                {currentTask.subtask_completed}/{currentTask.subtask_total}
              </span>
            )}
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(currentTask.subtasks || []).map(st => (
              <div key={st.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 10px',
                background: '#f8fafc',
                borderRadius: 8,
              }}>
                <Checkbox
                  checked={st.completed}
                  onChange={() => handleToggleSubtask(st)}
                />
                <span style={{
                  flex: 1,
                  fontSize: 14,
                  color: st.completed ? '#94a3b8' : '#2c3e50',
                  textDecoration: st.completed ? 'line-through' : 'none',
                }}>
                  {st.title}
                </span>
                <Button
                  type="text"
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => handleDeleteSubtask(st.id)}
                  style={{ color: '#94a3b8', padding: 2 }}
                />
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Input
              placeholder="Add subtask..."
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              onPressEnter={handleAddSubtask}
              size="small"
              style={{ borderRadius: 8 }}
            />
            <Button
              type="text"
              size="small"
              icon={<PlusOutlined />}
              onClick={handleAddSubtask}
              loading={addingSubtask}
              disabled={!newSubtask.trim()}
            />
          </div>
        </div>

        <Divider />

        {/* Nudge Button */}
        {currentTask.assigned_user && currentTask.assigned_user.id !== user?.id && (
          <div style={{ marginBottom: 20 }}>
            <Button
              icon={<BellOutlined />}
              onClick={handleNudge}
              loading={nudging}
              disabled={nudgeAvail !== null && !nudgeAvail.can_nudge}
              block
              size="large"
              style={{
                borderRadius: 12,
                height: 48,
                fontSize: 15,
                background: nudgeAvail?.can_nudge !== false ? '#fef3c7' : '#f1f5f9',
                borderColor: nudgeAvail?.can_nudge !== false ? '#fbbf24' : '#e2e8f0',
                color: nudgeAvail?.can_nudge !== false ? '#92400e' : '#94a3b8',
              }}
            >
              {nudgeAvail?.can_nudge === false
                ? `Already nudged (${Math.ceil(nudgeAvail.hours_until_available)}h cooldown)`
                : `Nudge ${currentTask.assigned_user.name}`
              }
            </Button>
          </div>
        )}

        {/* Delete */}
        <Popconfirm
          title="Delete this task?"
          description="This will also delete all subtasks."
          onConfirm={handleDelete}
          okText="Delete"
          okButtonProps={{ danger: true }}
        >
          <Button
            danger
            icon={<DeleteOutlined />}
            block
            style={{ borderRadius: 12, height: 44 }}
          >
            Delete Task
          </Button>
        </Popconfirm>
      </div>
    </Drawer>
  );
}
