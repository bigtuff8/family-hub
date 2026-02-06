/**
 * Nudge notification inbox drawer
 * Location: frontend/src/features/tasks/NudgeInboxDrawer.tsx
 */

import { useState, useEffect, useCallback } from 'react';
import { Drawer, Button, Avatar, Empty, Spin, message } from 'antd';
import { BellOutlined, CheckOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { tasksApi } from '../../services/tasks';
import { getInitials } from '../../utils/strings';
import type { TaskNudge } from '../../types/tasks';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

interface NudgeInboxDrawerProps {
  visible: boolean;
  onClose: () => void;
  onCountChange?: (count: number) => void;
}

export function NudgeInboxDrawer({ visible, onClose, onCountChange }: NudgeInboxDrawerProps) {
  const navigate = useNavigate();
  const [nudges, setNudges] = useState<TaskNudge[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNudges = useCallback(async () => {
    try {
      setLoading(true);
      const data = await tasksApi.getNudges();
      setNudges(data);
    } catch (err) {
      console.error('Failed to load nudges:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      fetchNudges();
    }
  }, [visible, fetchNudges]);

  const handleMarkRead = async (nudgeId: string) => {
    try {
      await tasksApi.markNudgeRead(nudgeId);
      setNudges(prev => prev.map(n => n.id === nudgeId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n));
      // Update count
      const unreadCount = nudges.filter(n => n.id !== nudgeId && !n.is_read).length;
      onCountChange?.(unreadCount);
    } catch (err) {
      message.error('Failed to mark as read');
    }
  };

  const handleViewTask = (nudge: TaskNudge) => {
    onClose();
    navigate('/todos');
  };

  const handleMarkAllRead = async () => {
    try {
      const unreadNudges = nudges.filter(n => !n.is_read);
      await Promise.all(unreadNudges.map(n => tasksApi.markNudgeRead(n.id)));
      setNudges(prev => prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() })));
      onCountChange?.(0);
      message.success('All marked as read');
    } catch (err) {
      message.error('Failed to mark all as read');
    }
  };

  const unreadCount = nudges.filter(n => !n.is_read).length;

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>
            <BellOutlined style={{ marginRight: 8 }} />
            Notifications
            {unreadCount > 0 && (
              <span style={{
                marginLeft: 8,
                fontSize: 12,
                background: '#fb7185',
                color: 'white',
                padding: '2px 8px',
                borderRadius: 10,
              }}>
                {unreadCount}
              </span>
            )}
          </span>
          {unreadCount > 0 && (
            <Button type="link" size="small" onClick={handleMarkAllRead}>
              Mark all read
            </Button>
          )}
        </div>
      }
      placement="right"
      width={380}
      open={visible}
      onClose={onClose}
    >
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <Spin />
        </div>
      ) : nudges.length === 0 ? (
        <Empty description="No notifications" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {nudges.map(nudge => (
            <div
              key={nudge.id}
              style={{
                padding: 14,
                background: nudge.is_read ? '#f8fafc' : '#fef7f0',
                borderRadius: 12,
                borderLeft: nudge.is_read ? '3px solid #e2e8f0' : '3px solid #fb7185',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <Avatar
                  size={32}
                  style={{ backgroundColor: nudge.from_user.color, fontSize: 12, fontWeight: 600 }}
                >
                  {getInitials(nudge.from_user.name)}
                </Avatar>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#2c3e50' }}>
                    {nudge.from_user.name} nudged you
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>
                    {dayjs(nudge.created_at).fromNow()}
                  </div>
                </div>
              </div>

              <div style={{
                fontSize: 14,
                fontWeight: 600,
                color: '#1a2332',
                marginBottom: nudge.message ? 4 : 8,
              }}>
                {nudge.task_title}
              </div>

              {nudge.message && (
                <div style={{
                  fontSize: 13,
                  color: '#64748b',
                  fontStyle: 'italic',
                  marginBottom: 8,
                }}>
                  "{nudge.message}"
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <Button
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => handleViewTask(nudge)}
                  style={{ borderRadius: 8 }}
                >
                  View Task
                </Button>
                {!nudge.is_read && (
                  <Button
                    size="small"
                    icon={<CheckOutlined />}
                    onClick={() => handleMarkRead(nudge.id)}
                    style={{ borderRadius: 8 }}
                  >
                    Mark Read
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Drawer>
  );
}
