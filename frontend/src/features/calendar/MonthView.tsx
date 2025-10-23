import React, { useState } from 'react';
import { Card, Modal, List } from 'antd';
import { ClockCircleOutlined, SyncOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { CalendarEvent } from './Calendar';
import { isRecurringEvent } from '../../utils/recurrence';
import './MonthView.css';

interface MonthViewProps {
  events: CalendarEvent[];
  currentDate: Dayjs;
  onEventClick: (event: CalendarEvent) => void;
  onDateClick?: (date: Dayjs) => void;
}

// Family member colors for event display
const FAMILY_COLORS: { [key: string]: string } = {
  '10000000-0000-0000-0000-000000000001': '#e30613', // James - Liverpool red
  '10000000-0000-0000-0000-000000000002': '#fb7185', // Nicola - Pink
  '10000000-0000-0000-0000-000000000003': '#00B140', // Tommy - Liverpool green
  '10000000-0000-0000-0000-000000000004': '#1D428A', // Harry - Leeds blue
};

const MonthView: React.FC<MonthViewProps> = ({ events, currentDate, onEventClick, onDateClick }) => {
  const [isMoreEventsModalVisible, setIsMoreEventsModalVisible] = useState(false);
  const [selectedDayEvents, setSelectedDayEvents] = useState<CalendarEvent[]>([]);
  const [selectedDay, setSelectedDay] = useState<Dayjs | null>(null);

  // Get the first day of the month
  const startOfMonth = currentDate.startOf('month');
  // Get the last day of the month
  const endOfMonth = currentDate.endOf('month');

  // Get the day of week for the first day (0 = Sunday, 1 = Monday, etc.)
  const startDayOfWeek = startOfMonth.day();

  // Calculate how many days to show (including padding days from previous month)
  const daysInMonth = endOfMonth.date();
  const totalDays = Math.ceil((startDayOfWeek + daysInMonth) / 7) * 7;

  // Generate all days to display in the calendar grid
  const days: Dayjs[] = [];
  for (let i = 0; i < totalDays; i++) {
    const day = startOfMonth.subtract(startDayOfWeek, 'day').add(i, 'day');
    days.push(day);
  }

  // Get events for a specific day
  const getEventsForDay = (day: Dayjs): CalendarEvent[] => {
    return events.filter(event => {
      const eventStart = dayjs(event.start_time);
      return eventStart.format('YYYY-MM-DD') === day.format('YYYY-MM-DD');
    }).sort((a, b) => {
      // Sort by start time
      return dayjs(a.start_time).valueOf() - dayjs(b.start_time).valueOf();
    });
  };

  // Format event time for display
  const formatEventTime = (event: CalendarEvent): string => {
    if (event.all_day) {
      return 'All day';
    }
    const start = dayjs(event.start_time);
    return start.format('HH:mm');
  };

  // Get event color
  const getEventColor = (event: CalendarEvent): string => {
    if (event.color) {
      return event.color;
    }
    if (event.user_id && FAMILY_COLORS[event.user_id]) {
      return FAMILY_COLORS[event.user_id];
    }
    return '#2dd4bf'; // Default teal
  };

  // Check if day is today
  const isToday = (day: Dayjs): boolean => {
    return day.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD');
  };

  // Check if day is in current month
  const isCurrentMonth = (day: Dayjs): boolean => {
    return day.month() === currentDate.month();
  };

  // Handle "+X more" click
  const handleMoreEventsClick = (day: Dayjs, dayEvents: CalendarEvent[], e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDay(day);
    setSelectedDayEvents(dayEvents);
    setIsMoreEventsModalVisible(true);
  };

  return (
    <>
    <div className="month-view">
      {/* Weekday headers */}
      <div className="month-view-header">
        <div className="weekday-header">Sun</div>
        <div className="weekday-header">Mon</div>
        <div className="weekday-header">Tue</div>
        <div className="weekday-header">Wed</div>
        <div className="weekday-header">Thu</div>
        <div className="weekday-header">Fri</div>
        <div className="weekday-header">Sat</div>
      </div>

      {/* Calendar grid */}
      <div className="month-view-grid">
        {days.map((day, index) => {
          const dayEvents = getEventsForDay(day);
          const isCurrentDay = isToday(day);
          const isInCurrentMonth = isCurrentMonth(day);

          return (
            <div
              key={index}
              className={`month-view-day ${!isInCurrentMonth ? 'other-month' : ''} ${isCurrentDay ? 'today' : ''}`}
              onClick={() => onDateClick && onDateClick(day)}
            >
              <div className="day-number">{day.date()}</div>
              <div className="day-events">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className="month-event"
                    style={{ borderLeftColor: getEventColor(event) }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(event);
                    }}
                  >
                    {isRecurringEvent(event) && (
                      <SyncOutlined style={{ fontSize: 9, color: '#64748b', marginRight: 2 }} />
                    )}
                    <span className="event-time">{formatEventTime(event)}</span>
                    <span className="event-title">{event.title}</span>
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div
                    className="more-events"
                    onClick={(e) => handleMoreEventsClick(day, dayEvents, e)}
                  >
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>

    {/* More Events Modal */}
    <Modal
      title={selectedDay ? `${selectedDay.format('dddd, MMMM D, YYYY')} - All Events` : 'All Events'}
      open={isMoreEventsModalVisible}
      onCancel={() => setIsMoreEventsModalVisible(false)}
      footer={null}
      width={500}
    >
      <List
        dataSource={selectedDayEvents}
        renderItem={(event) => (
          <List.Item
            style={{ cursor: 'pointer', padding: '12px 0' }}
            onClick={() => {
              setIsMoreEventsModalVisible(false);
              onEventClick(event);
            }}
          >
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 4,
                  height: 40,
                  backgroundColor: getEventColor(event),
                  borderRadius: 2,
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#1e293b', marginBottom: 4 }}>
                  {event.title}
                </div>
                <div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ClockCircleOutlined />
                  {formatEventTime(event)}
                </div>
              </div>
            </div>
          </List.Item>
        )}
      />
    </Modal>
    </>
  );
};

export default MonthView;
