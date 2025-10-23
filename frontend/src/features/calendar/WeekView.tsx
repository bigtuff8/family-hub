import React from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { CalendarEvent } from './Calendar';
import './WeekView.css';

interface WeekViewProps {
  events: CalendarEvent[];
  currentDate: Dayjs;
  onEventClick: (event: CalendarEvent) => void;
}

// Family member colors for event display
const FAMILY_COLORS: { [key: string]: string } = {
  '10000000-0000-0000-0000-000000000001': '#e30613', // James - Liverpool red
  '10000000-0000-0000-0000-000000000002': '#fb7185', // Nicola - Pink
  '10000000-0000-0000-0000-000000000003': '#00B140', // Tommy - Liverpool green
  '10000000-0000-0000-0000-000000000004': '#1D428A', // Harry - Leeds blue
};

const WeekView: React.FC<WeekViewProps> = ({ events, currentDate, onEventClick }) => {
  // Get start and end of week (Sunday to Saturday)
  const startOfWeek = currentDate.startOf('week');

  // Generate array of 7 days
  const weekDays: Dayjs[] = [];
  for (let i = 0; i < 7; i++) {
    weekDays.push(startOfWeek.add(i, 'day'));
  }

  // Time slots from 7am to 10pm
  const hours = Array.from({ length: 15 }, (_, i) => i + 7);

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

  // Get events for a specific day
  const getEventsForDay = (day: Dayjs): CalendarEvent[] => {
    return events.filter(event => {
      const eventStart = dayjs(event.start_time);
      return eventStart.format('YYYY-MM-DD') === day.format('YYYY-MM-DD');
    }).sort((a, b) => {
      return dayjs(a.start_time).valueOf() - dayjs(b.start_time).valueOf();
    });
  };

  // Separate all-day and timed events
  const getAllDayEvents = (day: Dayjs): CalendarEvent[] => {
    return getEventsForDay(day).filter(event => event.all_day);
  };

  const getTimedEvents = (day: Dayjs): CalendarEvent[] => {
    return getEventsForDay(day).filter(event => !event.all_day);
  };

  // Get events for a specific hour
  const getEventsForHour = (day: Dayjs, hour: number): CalendarEvent[] => {
    const timedEvents = getTimedEvents(day);
    return timedEvents.filter(event => {
      const eventStart = dayjs(event.start_time);
      const eventHour = eventStart.hour();
      return eventHour === hour;
    });
  };

  // Check if day is today
  const isToday = (day: Dayjs): boolean => {
    return day.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD');
  };

  // Format time for event display
  const formatEventTime = (event: CalendarEvent): string => {
    const start = dayjs(event.start_time);
    const end = event.end_time ? dayjs(event.end_time) : null;

    if (end) {
      return `${start.format('HH:mm')} - ${end.format('HH:mm')}`;
    }
    return start.format('HH:mm');
  };

  return (
    <div className="week-view">
      {/* Header with day names and dates */}
      <div className="week-view-header">
        <div className="time-column-header">Time</div>
        {weekDays.map((day, index) => (
          <div
            key={index}
            className={`day-column-header ${isToday(day) ? 'today' : ''}`}
          >
            <div className="day-name">{day.format('ddd')}</div>
            <div className="day-date">{day.format('D')}</div>
          </div>
        ))}
      </div>

      {/* All-day events row */}
      <div className="week-view-allday">
        <div className="time-column-label">All Day</div>
        {weekDays.map((day, index) => {
          const allDayEvents = getAllDayEvents(day);
          return (
            <div key={index} className="day-column-allday">
              {allDayEvents.map(event => (
                <div
                  key={event.id}
                  className="week-event allday-event"
                  style={{ borderLeftColor: getEventColor(event) }}
                  onClick={() => onEventClick(event)}
                >
                  <div className="event-title">{event.title}</div>
                  {event.location && (
                    <div className="event-location">{event.location}</div>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="week-view-grid">
        <div className="time-column">
          {hours.map(hour => (
            <div key={hour} className="time-slot">
              {dayjs().hour(hour).minute(0).format('HH:mm')}
            </div>
          ))}
        </div>

        {/* Day columns */}
        {weekDays.map((day, dayIndex) => (
          <div key={dayIndex} className={`day-column ${isToday(day) ? 'today-column' : ''}`}>
            {hours.map(hour => {
              const hourEvents = getEventsForHour(day, hour);
              return (
                <div key={hour} className="hour-slot">
                  {hourEvents.map(event => (
                    <div
                      key={event.id}
                      className="week-event timed-event"
                      style={{ borderLeftColor: getEventColor(event) }}
                      onClick={() => onEventClick(event)}
                    >
                      <div className="event-time">{formatEventTime(event)}</div>
                      <div className="event-title">{event.title}</div>
                      {event.location && (
                        <div className="event-location">{event.location}</div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeekView;
