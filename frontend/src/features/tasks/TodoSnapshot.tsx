/**
 * Todo list snapshot for dashboard
 * Location: frontend/src/features/tasks/TodoSnapshot.tsx
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, Checkbox, Button, Input, Spin, Empty, Avatar, message } from 'antd';
import { CheckSquareOutlined, PlusOutlined, RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { tasksApi } from '../../services/tasks';
import { getInitials } from '../../utils/strings';
import type { Task } from '../../types/tasks';
import './TodoSnapshot.css';

const PRIORITY_COLORS: Record<string, string> = {
  urgent: '#dc2626',
  high: '#f59e0b',
  normal: '#2dd4bf',
  low: '#94a3b8',
};

function formatDueLabel(dueDateStr: string | null): { label: string; urgent: boolean } | null {
  if (!dueDateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr + 'T00:00:00');
  const diffDays = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { label: 'Overdue', urgent: true };
  if (diffDays === 0) return { label: 'Today', urgent: true };
  if (diffDays === 1) return { label: 'Tomorrow', urgent: false };
  if (diffDays <= 7) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return { label: days[due.getDay()], urgent: false };
  }
  return { label: due.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), urgent: false };
}

export function TodoSnapshot() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickAddValue, setQuickAddValue] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      const data = await tasksApi.getTasks({ status: 'pending' });
      setTasks(data);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleToggle = async (task: Task) => {
    try {
      // Optimistic update
      setTasks(prev => prev.filter(t => t.id !== task.id));
      await tasksApi.toggleTask(task.id);
    } catch (err) {
      message.error('Failed to update task');
      fetchTasks();
    }
  };

  const handleQuickAdd = async () => {
    if (!quickAddValue.trim()) return;
    setAdding(true);
    try {
      await tasksApi.createTask({ title: quickAddValue.trim() });
      setQuickAddValue('');
      fetchTasks();
      message.success('Task added');
    } catch (err) {
      message.error('Failed to add task');
    } finally {
      setAdding(false);
    }
  };

  const previewTasks = tasks.slice(0, 8);
  const remainingCount = tasks.length - 8;

  if (loading) {
    return (
      <Card className="todo-snapshot loading">
        <Spin />
      </Card>
    );
  }

  return (
    <Card className="todo-snapshot">
      <div className="snapshot-header">
        <div className="header-left">
          <CheckSquareOutlined className="header-icon" />
          <div>
            <h3 className="header-title">Tasks</h3>
            <span className="header-subtitle">
              {tasks.length} pending
            </span>
          </div>
        </div>
        <Button
          type="link"
          onClick={() => navigate('/todos')}
          className="view-all-btn"
        >
          View All <RightOutlined />
        </Button>
      </div>

      {/* Quick Add */}
      <div className="quick-add">
        <Input
          placeholder="Quick add task..."
          value={quickAddValue}
          onChange={(e) => setQuickAddValue(e.target.value)}
          onPressEnter={handleQuickAdd}
          suffix={
            <Button
              type="text"
              size="small"
              icon={<PlusOutlined />}
              onClick={handleQuickAdd}
              loading={adding}
              disabled={!quickAddValue.trim()}
            />
          }
        />
      </div>

      {/* Task Preview */}
      <div className="item-list">
        {previewTasks.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No pending tasks"
            className="empty-state"
          />
        ) : (
          previewTasks.map(task => {
            const dueInfo = formatDueLabel(task.due_date);
            return (
              <div key={task.id} className="snapshot-task">
                <Checkbox
                  checked={false}
                  onChange={() => handleToggle(task)}
                />
                <span
                  className="task-priority-dot"
                  style={{ background: PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.normal }}
                />
                <span className="task-title" onClick={() => navigate('/todos')}>
                  {task.title}
                </span>
                {task.subtask_total > 0 && (
                  <span className="task-subtask-count">
                    {task.subtask_completed}/{task.subtask_total}
                  </span>
                )}
                {dueInfo && (
                  <span className={`task-due ${dueInfo.urgent ? 'urgent' : ''}`}>
                    {dueInfo.label}
                  </span>
                )}
                {task.assigned_user && (
                  <Avatar
                    size={24}
                    style={{
                      backgroundColor: task.assigned_user.color,
                      fontSize: 10,
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    {getInitials(task.assigned_user.name)}
                  </Avatar>
                )}
              </div>
            );
          })
        )}
        {remainingCount > 0 && (
          <div
            className="more-items"
            onClick={() => navigate('/todos')}
          >
            +{remainingCount} more tasks
          </div>
        )}
      </div>
    </Card>
  );
}
