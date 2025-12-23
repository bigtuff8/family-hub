import { Card, Avatar, Button, Space, Dropdown } from 'antd';
import { ClockCircleOutlined, EnvironmentOutlined, RightOutlined, CalendarOutlined, AppstoreOutlined, LogoutOutlined, UserOutlined, TeamOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useAuth } from '../auth';
import { ShoppingSnapshot } from '../shopping';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import CalendarEventForm from './CalendarEventForm';
import './CalendarTablet.css';

// Types - keep using the service types for now
interface CalendarEvent {
  id: string;
  tenant_id: string;
  user_id: string | null;
  title: string;
  description: string | null;
  location: string | null;
  start_time: string;
  end_time: string | null;
  all_day: boolean;
  recurrence_rule: string | null;
  external_calendar_id: string | null;
  external_event_id: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    name: string;
  };
}

// Enable timezone plugins
dayjs.extend(utc);
dayjs.extend(timezone);

// Set default timezone to Europe/London (handles BST/GMT automatically)
dayjs.tz.setDefault('Europe/London');

interface CalendarTabletProps {
  events: CalendarEvent[];
  onRefresh?: () => void;
  onNavigateToCalendar?: () => void;
  showViewToggle?: boolean;
  currentViewType?: 'dashboard' | 'calendar';
  onViewTypeChange?: (type: 'dashboard' | 'calendar') => void;
}

export default function CalendarTablet({
  events,
  onRefresh,
  onNavigateToCalendar,
  showViewToggle = false,
  currentViewType = 'dashboard',
  onViewTypeChange
}: CalendarTabletProps) {
  const [formVisible, setFormVisible] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedEvent, setSelectedEvent] = useState<any>(undefined);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Get user initials
  const userInitials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  // User dropdown menu items
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: user?.name || 'User',
      disabled: true,
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'shopping',
      icon: <ShoppingCartOutlined />,
      label: 'Shopping List',
      onClick: () => navigate('/shopping'),
    },
    {
      key: 'contacts',
      icon: <TeamOutlined />,
      label: 'Contacts',
      onClick: () => navigate('/contacts'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Log out',
      danger: true,
      onClick: logout,
    },
  ];

  // Parse UTC time and convert to local timezone
  const parseEventTime = (utcTimeString: string) => {
    return dayjs.utc(utcTimeString).tz('Europe/London');
  };

  // Group events by date
  const today = dayjs().startOf('day');
  const todayEvents = events.filter(e => parseEventTime(e.start_time).isSame(today, 'day'));
  const upcomingEvents = events.filter(e => parseEventTime(e.start_time).isAfter(today, 'day'));

  const formatTime = (utcTimeString: string) => parseEventTime(utcTimeString).format('h:mm A');

  const handleCreateEvent = () => {
    setFormMode('create');
    setSelectedEvent(undefined);
    setFormVisible(true);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setFormMode('edit');
    // Convert snake_case to camelCase for the form
    setSelectedEvent({
      id: event.id,
      tenant_id: event.tenant_id,
      user_id: event.user_id,
      title: event.title,
      description: event.description,
      location: event.location,
      start_time: event.start_time,
      end_time: event.end_time,
      all_day: event.all_day,
      recurrence_rule: event.recurrence_rule,
      external_calendar_id: event.external_calendar_id,
      external_event_id: event.external_event_id,
      color: event.color,
      created_at: event.created_at,
      updated_at: event.updated_at,
      attendees: event.attendees,
    });
    setFormVisible(true);
  };

  const handleFormClose = () => {
    setFormVisible(false);
    setSelectedEvent(undefined);
  };

  const handleFormSuccess = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  return (
    <>
      {/* Tablet Header */}
      <div style={{
        background: '#1a2332',
        color: 'white',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        minHeight: '56px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: '0 0 auto' }}>
          <h1
            onClick={() => onViewTypeChange?.('dashboard')}
            style={{
              fontSize: 28,
              fontWeight: 700,
              margin: 0,
              background: 'linear-gradient(135deg, #2dd4bf, #fb7185)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              cursor: 'pointer'
            }}
          >
            Family Hub
          </h1>
          <div style={{ fontSize: 14, opacity: 0.9 }}>
            <div style={{ fontWeight: 600 }}>
              {dayjs().format('dddd, MMMM D, YYYY')}
            </div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              {dayjs().format('h:mm A')}
            </div>
          </div>
          {/* Temperature - positioned next to date */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '8px 16px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 12
          }}>
            <span style={{ fontSize: 32 }}>☀️</span>
            <div>
              <div style={{ fontSize: 24, fontWeight: 600 }}>18°C</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>Sunny</div>
            </div>
          </div>
        </div>

        {/* Spacer to push toggle and right section to the right */}
        <div style={{ flex: 1 }}></div>

        {/* Calendar/Dashboard toggle */}
        {showViewToggle && (
          <div style={{ display: 'flex', alignItems: 'center', flex: '0 0 auto' }}>
            <Space.Compact>
              <Button
                type={currentViewType === 'calendar' ? 'primary' : 'default'}
                icon={<CalendarOutlined />}
                onClick={() => onViewTypeChange?.('calendar')}
              >
                Calendar
              </Button>
              <Button
                type={currentViewType === 'dashboard' ? 'primary' : 'default'}
                icon={<AppstoreOutlined />}
                onClick={() => onViewTypeChange?.('dashboard')}
              >
                Dashboard
              </Button>
            </Space.Compact>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: '0 0 auto' }}>
          <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
            <div style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: user?.color || 'linear-gradient(135deg, #2dd4bf, #fb7185)',
              border: '3px solid white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              fontWeight: 600,
              cursor: 'pointer',
              color: 'white',
            }}>
              {userInitials}
            </div>
          </Dropdown>
        </div>
      </div>

      {/* Dashboard Content - 2x2 Grid */}
      <div
        className="dashboard-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gridTemplateRows: '2fr 3fr',
          gap: 24,
          padding: 24,
          background: '#fef7f0',
          height: 'calc(100vh - 88px)'
        }}
      >
        {/* Top Left - Today's Schedule */}
        <Card
          style={{
            background: 'white',
            borderRadius: 20,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
          bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            flexShrink: 0
          }}>
            <h2 style={{
              fontSize: 24,
              fontWeight: 600,
              color: '#1a2332',
              margin: 0
            }}>
              Today's Schedule
            </h2>
          </div>

          {/* Event List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, overflowY: 'auto' }}>
            {todayEvents.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: 40,
                color: '#64748b'
              }}>
                No events scheduled for today
              </div>
            ) : (
              todayEvents.map(event => (
                <div
                  key={event.id}
                  onClick={() => handleEditEvent(event)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: 16,
                    background: '#fef7f0',
                    borderRadius: 12,
                    borderLeft: `4px solid ${event.color}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateX(4px)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateX(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Time */}
                  <div style={{
                    minWidth: 70,
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#1a2332'
                  }}>
                    {event.all_day ? 'All Day' : formatTime(event.start_time)}
                  </div>

                  {/* Event Details */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight: 600,
                      fontSize: 15,
                      color: '#2c3e50',
                      marginBottom: 2
                    }}>
                      {event.title}
                    </div>
                    {event.location && (
                      <div style={{
                        fontSize: 13,
                        color: '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}>
                        <EnvironmentOutlined />
                        {event.location}
                      </div>
                    )}
                  </div>

                  {/* Avatar */}
                  {event.user && (
                    <Avatar
                      style={{
                        background: event.color || '#2dd4bf',
                        border: '2px solid white',
                        fontSize: 12,
                        fontWeight: 600
                      }}
                      size={36}
                    >
                      {event.user.name.substring(0, 2).toUpperCase()}
                    </Avatar>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Top Right - Coming Up */}
        <Card
          style={{
            background: 'white',
            borderRadius: 20,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
          bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
          <h3 style={{
            fontSize: 20,
            fontWeight: 600,
            color: '#1a2332',
            marginBottom: 16,
            flexShrink: 0
          }}>
            Coming Up
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, overflowY: 'auto' }}>
            {upcomingEvents.slice(0, 5).map(event => (
              <div
                key={event.id}
                onClick={() => handleEditEvent(event)}
                style={{
                  padding: 12,
                  background: '#fef7f0',
                  borderRadius: 10,
                  borderLeft: `3px solid ${event.color}`,
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                <div style={{
                  fontWeight: 600,
                  fontSize: 14,
                  color: '#2c3e50',
                  marginBottom: 4
                }}>
                  {event.title}
                </div>
                <div style={{
                  fontSize: 12,
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <ClockCircleOutlined />
                  {parseEventTime(event.start_time).format('ddd, MMM D')}
                  {!event.all_day && ` • ${formatTime(event.start_time)}`}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Bottom Left - Shopping List */}
        <ShoppingSnapshot />

        {/* Bottom Right - Quick Actions */}
        <Card
          style={{
            background: 'white',
            borderRadius: 20,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            border: 'none',
            display: 'flex',
            flexDirection: 'column'
          }}
          bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        >
          <h3 style={{
            fontSize: 20,
            fontWeight: 600,
            color: '#1a2332',
            marginBottom: 16,
            flexShrink: 0
          }}>
            Quick Actions
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flex: 1, alignContent: 'start' }}>
            <Button
              size="large"
              onClick={handleCreateEvent}
              style={{
                height: 80,
                background: '#f0fdfa',
                border: 'none',
                borderRadius: 16,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#2dd4bf';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f0fdfa';
                e.currentTarget.style.color = 'inherit';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span style={{ fontSize: 28 }}>➕</span>
              <span style={{ fontSize: 13 }}>Add Event</span>
            </Button>

            <Button
              size="large"
              onClick={onNavigateToCalendar}
              style={{
                height: 80,
                background: '#f0fdfa',
                border: 'none',
                borderRadius: 16,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#2dd4bf';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f0fdfa';
                e.currentTarget.style.color = 'inherit';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span style={{ fontSize: 28 }}>📅</span>
              <span style={{ fontSize: 13 }}>Full Calendar</span>
            </Button>

            <Button
              size="large"
              onClick={() => navigate('/contacts')}
              style={{
                height: 80,
                background: '#f0fdfa',
                border: 'none',
                borderRadius: 16,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#2dd4bf';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f0fdfa';
                e.currentTarget.style.color = 'inherit';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span style={{ fontSize: 28 }}>👥</span>
              <span style={{ fontSize: 13 }}>Contacts</span>
            </Button>
          </div>
        </Card>
      </div>

      {/* Event Form Modal */}
      <CalendarEventForm
        mode={formMode}
        event={selectedEvent}
        visible={formVisible}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
      />
    </>
  );
}
