/**
 * Individual task row component
 * Location: frontend/src/features/tasks/TaskItem.tsx
 */

import { Checkbox, Avatar } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import { getInitials } from '../../utils/strings';
import type { Task } from '../../types/tasks';

interface TaskItemProps {
  task: Task;
  onToggle: (task: Task) => void;
  onClick: (task: Task) => void;
}

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

export function TaskItem({ task, onToggle, onClick }: TaskItemProps) {
  const dueInfo = formatDueLabel(task.due_date);
  const isComplete = task.status === 'complete';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        background: 'white',
        borderRadius: 12,
        cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        minHeight: 52,
      }}
      onClick={() => onClick(task)}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
        e.currentTarget.style.transform = 'translateX(2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.04)';
        e.currentTarget.style.transform = 'translateX(0)';
      }}
    >
      {/* Checkbox */}
      <Checkbox
        checked={isComplete}
        onChange={(e) => {
          e.stopPropagation();
          onToggle(task);
        }}
        onClick={(e) => e.stopPropagation()}
        style={{ transform: 'scale(1.2)' }}
      />

      {/* Priority dot */}
      <span style={{
        width: 10,
        height: 10,
        borderRadius: '50%',
        background: PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.normal,
        flexShrink: 0,
      }} />

      {/* Title */}
      <span style={{
        flex: 1,
        fontSize: 15,
        fontWeight: 500,
        color: isComplete ? '#94a3b8' : '#2c3e50',
        textDecoration: isComplete ? 'line-through' : 'none',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {task.title}
      </span>

      {/* Subtask count */}
      {task.subtask_total > 0 && (
        <span style={{
          fontSize: 12,
          color: '#64748b',
          background: '#f1f5f9',
          padding: '2px 8px',
          borderRadius: 8,
          flexShrink: 0,
        }}>
          {task.subtask_completed}/{task.subtask_total}
        </span>
      )}

      {/* Due date */}
      {dueInfo && (
        <span style={{
          fontSize: 12,
          color: dueInfo.urgent ? '#dc2626' : '#64748b',
          background: dueInfo.urgent ? '#fee2e2' : '#f1f5f9',
          padding: '3px 10px',
          borderRadius: 10,
          fontWeight: dueInfo.urgent ? 600 : 400,
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}>
          {dueInfo.label}
        </span>
      )}

      {/* Assignee */}
      {task.assigned_user && (
        <Avatar
          size={30}
          style={{
            backgroundColor: task.assigned_user.color,
            fontSize: 11,
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {getInitials(task.assigned_user.name)}
        </Avatar>
      )}

      {/* Expand arrow */}
      <RightOutlined style={{ fontSize: 12, color: '#94a3b8', flexShrink: 0 }} />
    </div>
  );
}
