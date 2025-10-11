import { Card, Avatar, Button } from 'antd';
import { ClockCircleOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { CalendarEvent } from '../../mockData';
import dayjs from 'dayjs';

interface CalendarMobileProps {
  events: CalendarEvent[];
}

export default function CalendarMobile({ events }: CalendarMobileProps) {
  const today = dayjs().startOf('day');
  const todayEvents = events.filter(e => dayjs(e.startTime).isSame(today, 'day'));
  const upcomingEvents = events.filter(e => dayjs(e.startTime).isAfter(today, 'day'));

  const formatTime = (date: Date) => dayjs(date).format('h:mm A');

  return (
    <div style={{ 
      background: '#fef7f0',
      minHeight: '100vh',
      paddingBottom: 80
    }}>
      {/* Mobile Header */}
      <div style={{
        background: '#1a2332',
        padding: '16px 20px',
        color: 'white'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12
        }}>
          <h1 style={{ 
            fontSize: 22,
            fontWeight: 700,
            margin: 0,
            background: 'linear-gradient(135deg, #2dd4bf, #fb7185)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Family Hub
          </h1>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #2dd4bf, #fb7185)',
            border: '2px solid white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            fontWeight: 600
          }}>
            JB
          </div>
        </div>

        <div style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: 13 }}>
            <div style={{ fontWeight: 600, marginBottom: 2 }}>
              {dayjs().format('dddd, MMMM D')}
            </div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>
              {dayjs().format('h:mm A')}
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 12px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 12
          }}>
            <span style={{ fontSize: 24 }}>☀️</span>
            <div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>18°C</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>Sunny</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: 16 }}>
        {/* Today's Schedule */}
        <Card
          style={{
            background: 'white',
            borderRadius: 16,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            border: 'none',
            marginBottom: 16
          }}
        >
          <div style={{ 
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16
          }}>
            <h2 style={{ 
              fontSize: 18,
              fontWeight: 600,
              color: '#1a2332',
              margin: 0
            }}>
              Today's Schedule
            </h2>
            <Button 
              type="text" 
              size="small"
              style={{ 
                color: '#2dd4bf',
                fontWeight: 500,
                fontSize: 13
              }}
            >
              View All →
            </Button>
          </div>

          {/* Today's Events */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {todayEvents.length === 0 ? (
              <div style={{ 
                textAlign: 'center',
                padding: 32,
                color: '#64748b',
                fontSize: 14
              }}>
                No events scheduled for today
              </div>
            ) : (
              todayEvents.map(event => (
                <div
                  key={event.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: 14,
                    background: '#fef7f0',
                    borderRadius: 12,
                    borderLeft: `4px solid ${event.color}`
                  }}
                >
                  <div style={{ 
                    minWidth: 50,
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#1a2332'
                  }}>
                    {event.allDay ? 'All Day' : formatTime(event.startTime)}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontWeight: 600,
                      fontSize: 14,
                      color: '#2c3e50',
                      marginBottom: 2
                    }}>
                      {event.title}
                    </div>
                    <div style={{ 
                      fontSize: 12,
                      color: '#64748b'
                    }}>
                      {event.assignedTo.map(p => p.name).join(', ')}
                      {event.location && ` • ${event.location}`}
                    </div>
                  </div>

                  <Avatar
                    style={{
                      background: `linear-gradient(135deg, ${event.color}, ${event.color}dd)`,
                      border: '2px solid white',
                      fontSize: 11,
                      fontWeight: 600,
                      flexShrink: 0
                    }}
                    size={32}
                  >
                    {event.assignedTo.length === 1 
                      ? event.assignedTo[0].avatar 
                      : 'All'}
                  </Avatar>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Coming Up */}
        <Card
          style={{
            background: 'white',
            borderRadius: 16,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            border: 'none',
            marginBottom: 16
          }}
        >
          <h3 style={{ 
            fontSize: 18,
            fontWeight: 600,
            color: '#1a2332',
            marginBottom: 16
          }}>
            Coming Up
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {upcomingEvents.slice(0, 5).map(event => (
              <div
                key={event.id}
                style={{
                  padding: 12,
                  background: '#fef7f0',
                  borderRadius: 12,
                  borderLeft: `3px solid ${event.color}`
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
                  fontSize: 12,
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <ClockCircleOutlined />
                  {dayjs(event.startTime).format('ddd, MMM D')}
                  {!event.allDay && ` • ${formatTime(event.startTime)}`}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card
          style={{
            background: 'white',
            borderRadius: 16,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            border: 'none'
          }}
        >
          <h3 style={{ 
            fontSize: 18,
            fontWeight: 600,
            color: '#1a2332',
            marginBottom: 16
          }}>
            Quick Actions
          </h3>

          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 8
          }}>
            <Button style={{ height: 70, display: 'flex', flexDirection: 'column', gap: 4, background: '#f0fdfa', border: 'none', borderRadius: 12 }}>
              <span style={{ fontSize: 24 }}>⏱️</span>
              <span style={{ fontSize: 11, fontWeight: 600 }}>Timer</span>
            </Button>
            <Button style={{ height: 70, display: 'flex', flexDirection: 'column', gap: 4, background: '#f0fdfa', border: 'none', borderRadius: 12 }}>
              <span style={{ fontSize: 24 }}>🛒</span>
              <span style={{ fontSize: 11, fontWeight: 600 }}>Shopping</span>
            </Button>
            <Button style={{ height: 70, display: 'flex', flexDirection: 'column', gap: 4, background: '#f0fdfa', border: 'none', borderRadius: 12 }}>
              <span style={{ fontSize: 24 }}>📸</span>
              <span style={{ fontSize: 11, fontWeight: 600 }}>Photos</span>
            </Button>
            <Button style={{ height: 70, display: 'flex', flexDirection: 'column', gap: 4, background: '#f0fdfa', border: 'none', borderRadius: 12 }}>
              <span style={{ fontSize: 24 }}>➕</span>
              <span style={{ fontSize: 11, fontWeight: 600 }}>Add</span>
            </Button>
          </div>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'white',
        borderTop: '1px solid #e2e8f0',
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        padding: '12px 0',
        boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.08)'
      }}>
        <Button type="text" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: '#2dd4bf', border: 'none' }}>
          <span style={{ fontSize: 24 }}>🏠</span>
          <span style={{ fontSize: 10, fontWeight: 500 }}>Home</span>
        </Button>
        <Button type="text" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: '#64748b', border: 'none' }}>
          <span style={{ fontSize: 24 }}>📅</span>
          <span style={{ fontSize: 10, fontWeight: 500 }}>Calendar</span>
        </Button>
        <Button type="text" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: '#64748b', border: 'none' }}>
          <span style={{ fontSize: 24 }}>✓</span>
          <span style={{ fontSize: 10, fontWeight: 500 }}>Tasks</span>
        </Button>
        <Button type="text" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: '#64748b', border: 'none' }}>
          <span style={{ fontSize: 24 }}>🍽️</span>
          <span style={{ fontSize: 10, fontWeight: 500 }}>Meals</span>
        </Button>
        <Button type="text" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: '#64748b', border: 'none' }}>
          <span style={{ fontSize: 24 }}>⚙️</span>
          <span style={{ fontSize: 10, fontWeight: 500 }}>More</span>
        </Button>
      </div>
    </div>
  );
}