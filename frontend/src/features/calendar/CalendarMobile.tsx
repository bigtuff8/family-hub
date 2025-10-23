import { useState } from 'react';
import { Card, List, Badge, Typography } from 'antd';
import { ClockCircleOutlined, EnvironmentOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Enable timezone plugins
dayjs.extend(utc);
dayjs.extend(timezone);

// Set default timezone to Europe/London (handles BST/GMT automatically)
dayjs.tz.setDefault('Europe/London');

const { Title, Text } = Typography;

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  start_time: string;
  end_time?: string;
  all_day: boolean;
  color?: string;
  user?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

interface CalendarMobileProps {
  events: CalendarEvent[];
  onRefresh?: () => void;
}

export default function CalendarMobile({ events }: CalendarMobileProps) {
  // Parse UTC time and convert to local timezone
  const parseEventTime = (utcTimeString: string) => {
    return dayjs.utc(utcTimeString).tz('Europe/London');
  };

  // Group events by date
  const today = dayjs().startOf('day');
  const todayEvents = events.filter(e => parseEventTime(e.start_time).isSame(today, 'day'));
  const upcomingEvents = events.filter(e => parseEventTime(e.start_time).isAfter(today, 'day'))
    .sort((a, b) => dayjs(a.start_time).unix() - dayjs(b.start_time).unix())
    .slice(0, 10);

  const formatTime = (utcTimeString: string) => parseEventTime(utcTimeString).format('h:mm A');
  const formatDate = (utcTimeString: string) => parseEventTime(utcTimeString).format('ddd, MMM D');

  return (
    <div style={{ background: '#fef7f0', minHeight: '100vh', padding: '16px', paddingBottom: '80px' }}>
      {/* Weather Widget */}
      <Card
        style={{
          marginBottom: 16,
          borderRadius: 12,
          background: 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)',
          border: 'none',
          color: 'white',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <Text style={{ color: 'white', fontSize: 14 }}>
              {dayjs().format('dddd, MMMM D, YYYY')}
            </Text>
            <Title level={2} style={{ margin: '8px 0 0 0', color: 'white' }}>
              {dayjs().format('h:mm A')}
            </Title>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 40 }}>☀️</span>
            <div style={{ fontSize: 24, fontWeight: 600 }}>18°C</div>
            <div style={{ fontSize: 12, opacity: 0.9 }}>Sunny</div>
          </div>
        </div>
      </Card>

      {/* Today's Schedule */}
      <Card
        title={<Title level={4} style={{ margin: 0 }}>Today's Schedule</Title>}
        style={{ marginBottom: 16, borderRadius: 12, border: 'none' }}
      >
        {todayEvents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#64748b' }}>
            No events scheduled for today
          </div>
        ) : (
          <List
            dataSource={todayEvents}
            renderItem={(event) => (
              <List.Item
                style={{
                  padding: '12px 0',
                  borderLeft: `4px solid ${event.color || '#2dd4bf'}`,
                  paddingLeft: 12,
                  marginBottom: 8,
                  background: '#fef7f0',
                  borderRadius: 8,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
                    {event.title}
                  </div>
                  <div style={{ fontSize: 14, color: '#64748b', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ClockCircleOutlined />
                    {event.all_day ? 'All Day' : formatTime(event.start_time)}
                    {event.location && (
                      <>
                        <EnvironmentOutlined />
                        {event.location}
                      </>
                    )}
                  </div>
                </div>
              </List.Item>
            )}
          />
        )}
      </Card>

      {/* Coming Up */}
      <Card
        title={<Title level={4} style={{ margin: 0 }}>Coming Up</Title>}
        style={{ marginBottom: 16, borderRadius: 12, border: 'none' }}
      >
        {upcomingEvents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#64748b' }}>
            No upcoming events
          </div>
        ) : (
          <List
            dataSource={upcomingEvents}
            renderItem={(event) => (
              <List.Item
                style={{
                  padding: '12px 0',
                  borderLeft: `4px solid ${event.color || '#2dd4bf'}`,
                  paddingLeft: 12,
                  marginBottom: 8,
                  background: '#fef7f0',
                  borderRadius: 8,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
                    {event.title}
                  </div>
                  <div style={{ fontSize: 14, color: '#64748b', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ClockCircleOutlined />
                    {formatDate(event.start_time)}
                    {!event.all_day && ` • ${formatTime(event.start_time)}`}
                    {event.location && (
                      <>
                        <EnvironmentOutlined />
                        {event.location}
                      </>
                    )}
                  </div>
                </div>
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
}
