import { Card, Avatar, Button, Space } from 'antd';
import { ClockCircleOutlined, EnvironmentOutlined, RightOutlined, CalendarOutlined, AppstoreOutlined } from '@ant-design/icons';
import { useState } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import CalendarEventForm from './CalendarEventForm';

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
      tenantId: event.tenant_id,
      userId: event.user_id,
      title: event.title,
      description: event.description,
      location: event.location,
      startTime: event.start_time,
      endTime: event.end_time,
      allDay: event.all_day,
      recurrenceRule: event.recurrence_rule,
      externalCalendarId: event.external_calendar_id,
      externalEventId: event.external_event_id,
      color: event.color,
      createdAt: event.created_at,
      updatedAt: event.updated_at,
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
          <h1 style={{
            fontSize: 28,
            fontWeight: 700,
            margin: 0,
            background: 'linear-gradient(135deg, #2dd4bf, #fb7185)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
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

          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #2dd4bf, #fb7185)',
            border: '3px solid white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            fontWeight: 600,
            cursor: 'pointer'
          }}>
            JB
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: 24,
        padding: 24,
        background: '#fef7f0',
        minHeight: 'calc(100vh - 96px)'
      }}>
        {/* Left Column - Today's Schedule */}
        <div>
          <Card
            style={{
              background: 'white',
              borderRadius: 20,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              border: 'none'
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 24
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '500px', overflowY: 'auto' }}>
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
                      padding: 20,
                      background: '#fef7f0',
                      borderRadius: 16,
                      borderLeft: `4px solid ${event.color}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
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
                      minWidth: 80,
                      fontSize: 16,
                      fontWeight: 600,
                      color: '#1a2332'
                    }}>
                      {event.all_day ? 'All Day' : formatTime(event.start_time)}
                    </div>

                    {/* Event Details */}
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontWeight: 600,
                        fontSize: 16,
                        color: '#2c3e50',
                        marginBottom: 4
                      }}>
                        {event.title}
                      </div>
                      <div style={{
                        fontSize: 14,
                        color: '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                      }}>
                        {event.location && (
                          <>
                            <EnvironmentOutlined />
                            {event.location}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Avatar */}
                    {event.user && (
                      <Avatar
                        style={{
                          background: event.color || '#2dd4bf',
                          border: '3px solid white',
                          fontSize: 14,
                          fontWeight: 600
                        }}
                        size={40}
                      >
                        {event.user.name.substring(0, 2).toUpperCase()}
                      </Avatar>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Right Column - Upcoming & Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Upcoming Events */}
          <Card
            style={{
              background: 'white',
              borderRadius: 20,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              border: 'none'
            }}
          >
            <h3 style={{
              fontSize: 20,
              fontWeight: 600,
              color: '#1a2332',
              marginBottom: 20
            }}>
              Coming Up
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {upcomingEvents.slice(0, 4).map(event => (
                <div
                  key={event.id}
                  onClick={() => handleEditEvent(event)}
                  style={{
                    padding: 16,
                    background: '#fef7f0',
                    borderRadius: 12,
                    borderLeft: `3px solid ${event.color}`,
                    cursor: 'pointer'
                  }}
                >
                  <div style={{
                    fontWeight: 600,
                    fontSize: 14,
                    color: '#2c3e50',
                    marginBottom: 6
                  }}>
                    {event.title}
                  </div>
                  <div style={{
                    fontSize: 13,
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

          {/* Quick Actions */}
          <Card
            style={{
              background: 'white',
              borderRadius: 20,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              border: 'none'
            }}
          >
            <h3 style={{
              fontSize: 20,
              fontWeight: 600,
              color: '#1a2332',
              marginBottom: 20
            }}>
              Quick Actions
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
            </div>
          </Card>
        </div>
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