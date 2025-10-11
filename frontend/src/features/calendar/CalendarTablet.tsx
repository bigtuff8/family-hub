import { Card, Tag, Avatar, Button } from 'antd';
import { ClockCircleOutlined, EnvironmentOutlined, RightOutlined } from '@ant-design/icons';
import { CalendarEvent } from '../../mockData';
import dayjs from 'dayjs';

interface CalendarTabletProps {
  events: CalendarEvent[];
}

export default function CalendarTablet({ events }: CalendarTabletProps) {
  // Group events by date
  const today = dayjs().startOf('day');
  const todayEvents = events.filter(e => dayjs(e.startTime).isSame(today, 'day'));
  const upcomingEvents = events.filter(e => dayjs(e.startTime).isAfter(today, 'day'));

  const formatTime = (date: Date) => dayjs(date).format('h:mm A');

  return (
    <>
      {/* Tablet Header */}
      <div style={{
        background: '#1a2332',
        color: 'white',
        padding: '16px 50px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
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
              <Button 
                type="text" 
                style={{ 
                  color: '#2dd4bf',
                  fontWeight: 500
                }}
              >
                View All <RightOutlined />
              </Button>
            </div>

            {/* Event List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                      {event.allDay ? 'All Day' : formatTime(event.startTime)}
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

                    {/* Avatars */}
                    <div style={{ display: 'flex', gap: -8 }}>
                      {event.assignedTo.map((person, index) => (
                        <Avatar
                          key={person.id}
                          style={{
                            background: `linear-gradient(135deg, ${person.color}, ${person.color}dd)`,
                            border: '3px solid white',
                            fontSize: 14,
                            fontWeight: 600,
                            zIndex: event.assignedTo.length - index
                          }}
                          size={40}
                        >
                          {person.avatar}
                        </Avatar>
                      ))}
                    </div>
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
    </>
  );
}