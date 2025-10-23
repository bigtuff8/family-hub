import React from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { CalendarEvent } from './Calendar';
import './DayView.css';

interface DayViewProps {
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

const DayView: React.FC<DayViewProps> = ({ events, currentDate, onEventClick }) => {
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

  // Get events for the current day
  const getEventsForDay = (): CalendarEvent[] => {
    return events.filter(event => {
      const eventStart = dayjs(event.start_time);
      return eventStart.format('YYYY-MM-DD') === currentDate.format('YYYY-MM-DD');
    }).sort((a, b) => {
      return dayjs(a.start_time).valueOf() - dayjs(b.start_time).valueOf();
    });
  };

  // Separate all-day and timed events
  const getAllDayEvents = (): CalendarEvent[] => {
    return getEventsForDay().filter(event => event.all_day);
  };

  const getTimedEvents = (): CalendarEvent[] => {
    return getEventsForDay().filter(event => !event.all_day);
  };

  // Get events for a specific hour
  const getEventsForHour = (hour: number): CalendarEvent[] => {
    const timedEvents = getTimedEvents();
    return timedEvents.filter(event => {
      const eventStart = dayjs(event.start_time);
      const eventHour = eventStart.hour();
      return eventHour === hour;
    });
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

  // Check if day is today
  const isToday = (): boolean => {
    return currentDate.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD');
  };

  const allDayEvents = getAllDayEvents();

  return (
    <div className="day-view">
      {/* Header */}
      <div className="day-view-header">
        <div className="day-header-content">
          <div className="day-name">{currentDate.format('dddd')}</div>
          <div className={`day-date ${isToday() ? 'today' : ''}`}>
            {currentDate.format('D')}
          </div>
          <div className="day-month">{currentDate.format('MMMM YYYY')}</div>
        </div>
      </div>

      {/* All-day events section */}
      {allDayEvents.length > 0 && (
        <div className="day-view-allday">
          <div className="allday-label">All Day Events</div>
          <div className="allday-events-list">
            {allDayEvents.map(event => (
              <div
                key={event.id}
                className="day-event allday-event"
                style={{ borderLeftColor: getEventColor(event) }}
                onClick={() => onEventClick(event)}
              >
                <div className="event-title">{event.title}</div>
                {event.location && (
                  <div className="event-location">{event.location}</div>
                )}
                {event.description && (
                  <div className="event-description">{event.description}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Time grid */}
      <div className="day-view-grid">
        {hours.map(hour => {
          const hourEvents = getEventsForHour(hour);
          return (
            <div key={hour} className="hour-row">
              <div className="time-label">
                {dayjs().hour(hour).minute(0).format('HH:mm')}
              </div>
              <div className="hour-content">
                {hourEvents.length > 0 ? (
                  hourEvents.map(event => (
                    <div
                      key={event.id}
                      className="day-event timed-event"
                      style={{ borderLeftColor: getEventColor(event) }}
                      onClick={() => onEventClick(event)}
                    >
                      <div className="event-time">{formatEventTime(event)}</div>
                      <div className="event-title">{event.title}</div>
                      {event.location && (
                        <div className="event-location">{event.location}</div>
                      )}
                      {event.description && (
                        <div className="event-description">{event.description}</div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="empty-hour"></div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DayView;
