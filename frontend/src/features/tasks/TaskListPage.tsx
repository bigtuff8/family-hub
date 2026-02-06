/**
 * Full task list page
 * Location: frontend/src/features/tasks/TaskListPage.tsx
 */

import { useState, useEffect, useCallback } from 'react';
import { Button, Space, Spin, Empty, message, Dropdown, Select, Collapse, Avatar, Badge } from 'antd';
import {
  CheckSquareOutlined,
  ReloadOutlined,
  UserOutlined,
  LogoutOutlined,
  CalendarOutlined,
  AppstoreOutlined,
  TeamOutlined,
  ShoppingCartOutlined,
  SettingOutlined,
  FilterOutlined,
  SortAscendingOutlined,
  CaretDownOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useAuth } from '../auth/AuthContext';
import { tasksApi } from '../../services/tasks';
import { AddTaskForm } from './AddTaskForm';
import { TaskItem } from './TaskItem';
import { TaskDetailDrawer } from './TaskDetailDrawer';
import { getInitials } from '../../utils/strings';
import type { Task, TaskStats } from '../../types/tasks';
import './TaskListPage.css';
import WeatherWidget from '../../components/WeatherWidget';

export function TaskListPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [filterUser, setFilterUser] = useState<string | undefined>(undefined);
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [sortBy, setSortBy] = useState<string>('due_date');

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const filters: { status?: string; user_id?: string } = {};
      if (filterStatus && filterStatus !== 'all') filters.status = filterStatus;
      if (filterUser) filters.user_id = filterUser;
      const data = await tasksApi.getTasks(filters);
      setTasks(data);
    } catch (err) {
      message.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterUser]);

  const fetchStats = useCallback(async () => {
    try {
      const data = await tasksApi.getStats();
      setStats(data);
    } catch {
      // Silent fail
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchStats();
  }, [fetchTasks, fetchStats]);

  const handleToggle = async (task: Task) => {
    try {
      const updated = await tasksApi.toggleTask(task.id);
      if (updated.status === 'complete') {
        // Remove from list if filtering pending
        setTasks(prev => prev.filter(t => t.id !== task.id));
        message.success('Task completed!');
      } else {
        setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
      }
      fetchStats();
    } catch (err) {
      message.error('Failed to update task');
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setDrawerVisible(true);
  };

  const handleDrawerClose = () => {
    setDrawerVisible(false);
    setSelectedTask(null);
  };

  const handleTaskUpdated = () => {
    fetchTasks();
    fetchStats();
  };

  const handleTaskDeleted = () => {
    setDrawerVisible(false);
    setSelectedTask(null);
    fetchTasks();
    fetchStats();
  };

  // Sort tasks
  const sortedTasks = [...tasks].sort((a, b) => {
    if (sortBy === 'due_date') {
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return a.due_date.localeCompare(b.due_date);
    }
    if (sortBy === 'priority') {
      const order = { urgent: 0, high: 1, normal: 2, low: 3 };
      return (order[a.priority] || 2) - (order[b.priority] || 2);
    }
    return 0; // created_at - default from API
  });

  // Group by category
  const tasksByCategory = sortedTasks.reduce<Record<string, Task[]>>((acc, task) => {
    const cat = task.category || 'Uncategorised';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(task);
    return acc;
  }, {});

  const categories = Object.keys(tasksByCategory).sort();

  const pendingCount = tasks.filter(t => t.status !== 'complete').length;
  const userInitials = getInitials(user?.name) || 'U';

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: user?.name || 'User', disabled: true },
    { type: 'divider' as const },
    { key: 'shopping', icon: <ShoppingCartOutlined />, label: 'Shopping List', onClick: () => navigate('/shopping') },
    { key: 'contacts', icon: <TeamOutlined />, label: 'Contacts', onClick: () => navigate('/contacts') },
    { key: 'settings', icon: <SettingOutlined />, label: 'Settings', onClick: () => navigate('/settings') },
    { type: 'divider' as const },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Log out', danger: true, onClick: logout },
  ];

  return (
    <div className="task-list-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-left-group">
          <h1
            className="header-logo"
            onClick={() => navigate('/calendar')}
          >
            Family Hub
          </h1>
          <div className="header-info">
            <div className="header-date">{dayjs().format('dddd, MMMM D, YYYY')}</div>
            <div className="header-time">{dayjs().format('h:mm A')}</div>
          </div>
          <div className="header-weather">
            <WeatherWidget variant="full" />
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <Space.Compact>
          <Button
            type="default"
            icon={<CalendarOutlined />}
            onClick={() => navigate('/calendar')}
          >
            Calendar
          </Button>
          <Button
            type="primary"
            icon={<AppstoreOutlined />}
            onClick={() => navigate('/calendar')}
          >
            Dashboard
          </Button>
        </Space.Compact>

        <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
          <div className="header-avatar" style={{ background: user?.color || '#2dd4bf' }}>
            {userInitials}
          </div>
        </Dropdown>
      </div>

      {/* Sub-header */}
      <div className="sub-header">
        <div className="sub-header-left">
          <CheckSquareOutlined style={{ fontSize: 28, color: '#2dd4bf' }} />
          <div>
            <h2 className="sub-header-title">Tasks</h2>
            <span className="sub-header-subtitle">
              {pendingCount} pending
              {stats && ` \u2022 ${stats.completed_today} done today`}
            </span>
          </div>
        </div>
        <Space>
          <Select
            value={filterStatus}
            onChange={setFilterStatus}
            style={{ width: 130 }}
            options={[
              { value: 'pending', label: 'Pending' },
              { value: 'complete', label: 'Completed' },
              { value: 'all', label: 'All Tasks' },
            ]}
            suffixIcon={<FilterOutlined />}
          />
          <Select
            value={sortBy}
            onChange={setSortBy}
            style={{ width: 130 }}
            options={[
              { value: 'due_date', label: 'Due Date' },
              { value: 'priority', label: 'Priority' },
              { value: 'created_at', label: 'Newest' },
            ]}
            suffixIcon={<SortAscendingOutlined />}
          />
          {stats && stats.user_stats.length > 0 && (
            <Select
              allowClear
              placeholder="All members"
              value={filterUser}
              onChange={setFilterUser}
              style={{ width: 150 }}
              options={stats.user_stats.map(u => ({
                value: u.user_id,
                label: u.user_name,
              }))}
            />
          )}
          <Button icon={<ReloadOutlined />} onClick={() => { fetchTasks(); fetchStats(); }} />
        </Space>
      </div>

      {/* Add Task Form */}
      <div className="content-area">
        <AddTaskForm
          familyMembers={stats?.user_stats || []}
          onSuccess={() => { fetchTasks(); fetchStats(); }}
        />

        {/* Task List */}
        {loading ? (
          <div className="loading-container"><Spin size="large" /></div>
        ) : sortedTasks.length === 0 ? (
          <Empty description="No tasks found" style={{ padding: 40 }} />
        ) : (
          <div className="task-groups">
            {categories.map(category => (
              <div key={category} className="task-category-group">
                {categories.length > 1 && (
                  <h3 className="category-title">{category}</h3>
                )}
                {tasksByCategory[category].map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={handleToggle}
                    onClick={handleTaskClick}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="stats-bar">
          <span className="stats-text">
            {stats.completed_today} done today \u2022 {stats.total_pending} pending
          </span>
          <div className="stats-users">
            {stats.user_stats.map(u => (
              <div key={u.user_id} className="stats-user" title={`${u.user_name}: ${u.completed_today} done, ${u.pending} pending`}>
                <Avatar
                  size={28}
                  style={{ backgroundColor: u.user_color, fontSize: 11, fontWeight: 600 }}
                >
                  {getInitials(u.user_name)}
                </Avatar>
                <span className="stats-user-count">{u.completed_today}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Task Detail Drawer */}
      <TaskDetailDrawer
        task={selectedTask}
        visible={drawerVisible}
        onClose={handleDrawerClose}
        onTaskUpdated={handleTaskUpdated}
        onTaskDeleted={handleTaskDeleted}
      />
    </div>
  );
}
