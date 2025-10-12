import { useState, useEffect } from 'react';
import { Card, List, Badge, Typography, Spin, Alert, Modal, Button, Space } from 'antd';
import { LeftOutlined, RightOutlined, CalendarOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import api from '../../services/api';

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

export default function CalendarMobile() {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');

  // Fetch events from API
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/v1/calendar/events');
      console.log('Fetched events:', response.data);
      // Ensure we're setting an array
      setEvents(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      console.error('Error fetching events:', err);
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to load events';
      setError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    } finally {
      setLoading(false);
    }
  };

  // Convert UTC time string to local dayjs object
  const parseEventTime = (utcTimeString: string): Dayjs => {
    return dayjs.utc(utcTimeString).tz('Europe/London');
  };

  // Get events for a specific date
  const getEventsForDate = (date: Dayjs) => {
    return events.filter(event => {
      const eventDate = parseEventTime(event.start_time);
      return eventDate.format('YYYY-MM-DD') === date.format('YYYY-MM-DD');
    });
  };

  // Get events for the current week
  const getEventsForWeek = () => {
    const weekStart = selectedDate.startOf('week');
    const weekEnd = selectedDate.endOf('week');
    
    return events.filter(event => {
      const eventDate = parseEventTime(event.start_time);
      return eventDate.isAfter(weekStart.subtract(1, 'day')) && 
             eventDate.isBefore(weekEnd.add(1, 'day'));
    }).sort((a, b) => {
      const timeA = parseEventTime(a.start_time);
      const timeB = parseEventTime(b.start_time);
      return timeA.diff(timeB);
    });
  };

  // Navigation functions
  const goToPreviousDay = () => {
    setSelectedDate(selectedDate.subtract(1, 'day'));
  };

  const goToNextDay = () => {
    setSelectedDate(selectedDate.add(1, 'day'));
  };

  const goToToday = () => {
    setSelectedDate(dayjs());
  };

  const goToPreviousWeek = () => {
    setSelectedDate(selectedDate.subtract(1, 'week'));
  };

  const goToNextWeek = () => {
    setSelectedDate(selectedDate.add(1, 'week'));
  };

  // Group events by day for week view
  const groupEventsByDay = () => {
    const weekStart = selectedDate.startOf('week');
    const days: { date: Dayjs; events: CalendarEvent[] }[] = [];
    
    for (let i = 0; i < 7; i++) {
      const day = weekStart.add(i, 'day');
      days.push({
        date: day,
        events: getEventsForDate(day)
      });
    }
    
    return days;
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        padding: 16
      }}>
        <Spin size="large" tip="Loading calendar..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 16 }}>
        <Alert
          message="Error Loading Calendar"
          description={error}
          type="error"
          showIcon
        />
      </div>
    );
  }

  const currentEvents = viewMode === 'day' ? getEventsForDate(selectedDate) : getEventsForWeek();

  return (
    <div style={{ background: '#f0f2f5', minHeight: '100vh', paddingBottom: 60 }}>
      {/* Header */}
      <Card 
        bordered={false} 
        style={{ 
          borderRadius: 0, 
          marginBottom: 8,
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}
      >
        <div style={{ marginBottom: 12 }}>
          <Space>
            <Button 
              type={viewMode === 'day' ? 'primary' : 'default'}
              onClick={() => setViewMode('day')}
              size="small"
            >
              Day
            </Button>
            <Button 
              type={viewMode === 'week' ? 'primary' : 'default'}
              onClick={() => setViewMode('week')}
              size="small"
            >
              Week
            </Button>
            <Button 
              icon={<CalendarOutlined />}
              onClick={goToToday}
              size="small"
            >
              Today
            </Button>
          </Space>
        </div>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <Button
            icon={<LeftOutlined />}
            onClick={viewMode === 'day' ? goToPreviousDay : goToPreviousWeek}
            type="text"
            size="large"
          />
          
          <div style={{ textAlign: 'center', flex: 1 }}>
            <Title level={4} style={{ margin: 0 }}>
              {viewMode === 'day' 
                ? selectedDate.format('MMMM D, YYYY')
                : `Week of ${selectedDate.startOf('week').format('MMM D')}`
              }
            </Title>
            <Text type="secondary">
              {viewMode === 'day' 
                ? selectedDate.format('dddd')
                : `${selectedDate.startOf('week').format('MMM D')} - ${selectedDate.endOf('week').format('MMM D')}`
              }
            </Text>
          </div>
          
          <Button
            icon={<RightOutlined />}
            onClick={viewMode === 'day' ? goToNextDay : goToNextWeek}
            type="text"
            size="large"
          />
        </div>

        <div style={{ marginTop: 12, textAlign: 'center' }}>
          <Badge
            count={currentEvents.length}
            style={{ backgroundColor: '#52c41a' }}
          >
            <Text strong>
              {currentEvents.length === 0 ? 'No events' : 
               currentEvents.length === 1 ? '1 event' : 
               `${currentEvents.length} events`}
            </Text>
          </Badge>
        </div>
      </Card>

      {/* Day View */}
      {viewMode === 'day' && (
        <>
          {currentEvents.length > 0 ? (
            <List
              dataSource={currentEvents.sort((a, b) => {
                const timeA = parseEventTime(a.start_time);
                const timeB = parseEventTime(b.start_time);
                return timeA.diff(timeB);
              })}
              renderItem={(event) => {
                const startTime = parseEventTime(event.start_time);
                const endTime = event.end_time ? parseEventTime(event.end_time) : null;

                return (
                  <Card
                    style={{ 
                      margin: '8px 12px',
                      borderLeft: `4px solid ${event.color || '#1890ff'}`,
                      cursor: 'pointer'
                    }}
                    size="small"
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                        <Text strong style={{ fontSize: '16px', flex: 1 }}>
                          {String(event.title || 'Untitled Event')}
                        </Text>
                        <Badge
                          color={event.color || '#1890ff'}
                          style={{ marginLeft: 8 }}
                        />
                      </div>
                      
                      <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                        {event.all_day ? (
                          '🕐 All day event'
                        ) : (
                          <>
                            🕐 {startTime.format('HH:mm')}
                            {endTime && ` - ${endTime.format('HH:mm')}`}
                          </>
                        )}
                      </Text>
                      
                      {event.location && (
                        <Text type="secondary" style={{ display: 'block', fontSize: '12px' }}>
                          📍 {String(event.location)}
                        </Text>
                      )}
                      
                      {event.user && event.user.name && (
                        <Text style={{ display: 'block', fontSize: '12px', marginTop: 4 }}>
                          👤 {String(event.user.name)}
                        </Text>
                      )}
                    </div>
                  </Card>
                );
              }}
            />
          ) : (
            <Card style={{ margin: '8px 12px', textAlign: 'center', padding: '40px 0' }}>
              <CalendarOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
              <div>
                <Text type="secondary" style={{ fontSize: '16px' }}>
                  No events scheduled for this day
                </Text>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Week View */}
      {viewMode === 'week' && (
        <div style={{ padding: '0 12px' }}>
          {groupEventsByDay().map(({ date, events: dayEvents }) => (
            <Card
              key={date.format('YYYY-MM-DD')}
              size="small"
              style={{ marginBottom: 8 }}
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text strong>
                    {date.format('ddd, MMM D')}
                  </Text>
                  <Badge
                    count={dayEvents.length}
                    style={{ backgroundColor: dayEvents.length > 0 ? '#52c41a' : '#d9d9d9' }}
                  />
                </div>
              }
            >
              {dayEvents.length > 0 ? (
                <List
                  size="small"
                  dataSource={dayEvents.sort((a, b) => {
                    const timeA = parseEventTime(a.start_time);
                    const timeB = parseEventTime(b.start_time);
                    return timeA.diff(timeB);
                  })}
                  renderItem={(event) => {
                    const startTime = parseEventTime(event.start_time);
                    const endTime = event.end_time ? parseEventTime(event.end_time) : null;

                    return (
                      <List.Item
                        onClick={() => setSelectedEvent(event)}
                        style={{ 
                          cursor: 'pointer',
                          borderLeft: `3px solid ${event.color || '#1890ff'}`,
                          paddingLeft: 8,
                          marginBottom: 4
                        }}
                      >
                        <List.Item.Meta
                          title={
                            <Text strong style={{ fontSize: '14px' }}>
                              {String(event.title || 'Untitled Event')}
                            </Text>
                          }
                          description={
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {event.all_day 
                                ? 'All day' 
                                : `${startTime.format('HH:mm')}${endTime ? ` - ${endTime.format('HH:mm')}` : ''}`
                              }
                              {event.location && ` • ${event.location}`}
                            </Text>
                          }
                        />
                      </List.Item>
                    );
                  }}
                />
              ) : (
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  No events
                </Text>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Event Details Modal */}
      <Modal
        title="Event Details"
        open={!!selectedEvent}
        onCancel={() => setSelectedEvent(null)}
        footer={null}
        style={{ top: 20 }}
      >
        {selectedEvent && (
          <div>
            <Title level={4} style={{ marginTop: 0 }}>
              {selectedEvent.title}
            </Title>
            
            <div style={{ marginBottom: 16 }}>
              <Text strong>Time: </Text>
              <Text>
                {selectedEvent.all_day ? (
                  'All day event'
                ) : (
                  <>
                    {parseEventTime(selectedEvent.start_time).format('ddd, MMM D, YYYY [at] HH:mm')}
                    {selectedEvent.end_time && 
                      ` - ${parseEventTime(selectedEvent.end_time).format('HH:mm')}`
                    }
                  </>
                )}
              </Text>
            </div>

            {selectedEvent.location && (
              <div style={{ marginBottom: 16 }}>
                <Text strong>Location: </Text>
                <Text>{selectedEvent.location}</Text>
              </div>
            )}

            {selectedEvent.description && (
              <div style={{ marginBottom: 16 }}>
                <Text strong>Description: </Text>
                <div style={{ marginTop: 8 }}>
                  <Text>{selectedEvent.description}</Text>
                </div>
              </div>
            )}

            {selectedEvent.user && (
              <div style={{ marginBottom: 16 }}>
                <Text strong>Assigned to: </Text>
                <Text>{selectedEvent.user.name}</Text>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}