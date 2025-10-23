import React, { useState, useEffect } from 'react';
import { Button, Space, Tabs, FloatButton, DatePicker } from 'antd';
import {
  LeftOutlined,
  RightOutlined,
  CalendarOutlined,
  PlusOutlined,
  HomeOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { CalendarEvent } from './Calendar';
import MonthView from './MonthView';
import WeekView from './WeekView';
import DayView from './DayView';
import EventDetailsModal from './EventDetailsModal';
import CalendarEventForm from './CalendarEventForm';
import './CalendarViews.css';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Europe/London');

interface CalendarViewsProps {
  events: CalendarEvent[];
  onRefresh: () => void;
  onNavigateToDashboard?: () => void;
  showViewToggle?: boolean;
  currentViewType?: 'dashboard' | 'calendar';
  onViewTypeChange?: (type: 'dashboard' | 'calendar') => void;
}

type ViewMode = 'month' | 'week' | 'day';

const CalendarViews: React.FC<CalendarViewsProps> = ({
  events,
  onRefresh,
  onNavigateToDashboard,
  showViewToggle = false,
  currentViewType = 'calendar',
  onViewTypeChange
}) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [viewMode, setViewMode] = useState<ViewMode>(window.innerWidth < 768 ? 'week' : 'month');
  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [createModalDefaultDate, setCreateModalDefaultDate] = useState<Dayjs | undefined>(undefined);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Navigate to previous period
  const handlePrevious = () => {
    switch (viewMode) {
      case 'month':
        setCurrentDate(currentDate.subtract(1, 'month'));
        break;
      case 'week':
        setCurrentDate(currentDate.subtract(1, 'week'));
        break;
      case 'day':
        setCurrentDate(currentDate.subtract(1, 'day'));
        break;
    }
  };

  // Navigate to next period
  const handleNext = () => {
    switch (viewMode) {
      case 'month':
        setCurrentDate(currentDate.add(1, 'month'));
        break;
      case 'week':
        setCurrentDate(currentDate.add(1, 'week'));
        break;
      case 'day':
        setCurrentDate(currentDate.add(1, 'day'));
        break;
    }
  };

  // Navigate to today
  const handleToday = () => {
    setCurrentDate(dayjs());
  };

  // Handle date picker change
  const handleDatePickerChange = (date: Dayjs | null) => {
    if (date) {
      setCurrentDate(date);
      setIsDatePickerOpen(false);
    }
  };

  // Get current date range display
  const getDateRangeDisplay = (): string => {
    switch (viewMode) {
      case 'month':
        return currentDate.format('MMMM YYYY');
      case 'week': {
        const startOfWeek = currentDate.startOf('week');
        const endOfWeek = currentDate.endOf('week');
        if (startOfWeek.month() === endOfWeek.month()) {
          return `${startOfWeek.format('MMMM D')} - ${endOfWeek.format('D, YYYY')}`;
        }
        return `${startOfWeek.format('MMM D')} - ${endOfWeek.format('MMM D, YYYY')}`;
      }
      case 'day':
        return currentDate.format('dddd, MMMM D, YYYY');
      default:
        return '';
    }
  };

  // Handle event click
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsDetailsModalVisible(true);
  };

  // Handle date click in month view
  const handleDateClick = (date: Dayjs) => {
    setCreateModalDefaultDate(date);
    setIsCreateModalVisible(true);
  };

  // Handle add event
  const handleAddEvent = () => {
    setCreateModalDefaultDate(currentDate);
    setIsCreateModalVisible(true);
  };

  // Handle details modal close
  const handleDetailsModalClose = () => {
    setIsDetailsModalVisible(false);
    setSelectedEvent(null);
  };

  // Handle create modal close
  const handleCreateModalClose = () => {
    setIsCreateModalVisible(false);
    setCreateModalDefaultDate(undefined);
  };

  // Handle success (refresh events)
  const handleSuccess = () => {
    onRefresh();
  };

  // Tab items for view switcher (remove Month on mobile)
  const tabItems = isMobile
    ? [
        {
          key: 'week',
          label: 'Week',
        },
        {
          key: 'day',
          label: 'Day',
        },
      ]
    : [
        {
          key: 'month',
          label: 'Month',
        },
        {
          key: 'week',
          label: 'Week',
        },
        {
          key: 'day',
          label: 'Day',
        },
      ];

  // Adjust view mode if on mobile and currently on month
  useEffect(() => {
    if (isMobile && viewMode === 'month') {
      setViewMode('week');
    }
  }, [isMobile, viewMode]);

  return (
    <div className="calendar-views-container">
      {/* Header with navigation and controls */}
      <div className="calendar-views-header">
        <div className="header-left">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddEvent}
            className="add-event-btn"
          >
            Add Event
          </Button>
          <DatePicker
            open={isDatePickerOpen}
            value={currentDate}
            onChange={handleDatePickerChange}
            onOpenChange={setIsDatePickerOpen}
            style={{ width: 0, height: 0, padding: 0, border: 'none', position: 'absolute', visibility: 'hidden' }}
            getPopupContainer={(trigger) => trigger.parentElement || document.body}
          />
          <Button
            icon={<CalendarOutlined />}
            onClick={() => setIsDatePickerOpen(true)}
            className="today-btn"
          >
            Jump to Date
          </Button>
        </div>

        <div className="header-center">
          <Space>
            <Button
              icon={<LeftOutlined />}
              onClick={handlePrevious}
              className="nav-btn"
            />
            <div className="date-range-display">{getDateRangeDisplay()}</div>
            <Button
              icon={<RightOutlined />}
              onClick={handleNext}
              className="nav-btn"
            />
          </Space>
          {isMobile && (
            <div className="mobile-view-selector">
              <Button
                type={viewMode === 'week' ? 'primary' : 'default'}
                onClick={() => setViewMode('week')}
                style={{
                  background: viewMode === 'week' ? '#2dd4bf' : 'white',
                  borderColor: viewMode === 'week' ? '#2dd4bf' : '#d9d9d9',
                  color: viewMode === 'week' ? 'white' : '#1a2332',
                }}
              >
                Week
              </Button>
              <Button
                icon={<CalendarOutlined />}
                onClick={() => setIsDatePickerOpen(true)}
                style={{
                  background: 'white',
                  borderColor: '#d9d9d9',
                  color: '#1a2332',
                }}
              >
                Today
              </Button>
            </div>
          )}
        </div>

        {/* Calendar/Dashboard toggle - only on desktop */}
        {showViewToggle && !isMobile && (
          <div className="header-toggle">
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

        <div className="header-right">
          <Tabs
            activeKey={viewMode}
            onChange={(key) => setViewMode(key as ViewMode)}
            items={tabItems}
            className="view-switcher"
          />
        </div>
      </div>

      {/* Calendar view content */}
      <div className="calendar-views-content">
        {viewMode === 'month' && (
          <MonthView
            events={events}
            currentDate={currentDate}
            onEventClick={handleEventClick}
            onDateClick={handleDateClick}
          />
        )}
        {viewMode === 'week' && (
          <WeekView
            events={events}
            currentDate={currentDate}
            onEventClick={handleEventClick}
          />
        )}
        {viewMode === 'day' && (
          <DayView
            events={events}
            currentDate={currentDate}
            onEventClick={handleEventClick}
          />
        )}
      </div>

      {/* Event Details Modal */}
      <EventDetailsModal
        event={selectedEvent}
        visible={isDetailsModalVisible}
        onClose={handleDetailsModalClose}
        onRefresh={handleSuccess}
      />

      {/* Create Event Modal */}
      <CalendarEventForm
        mode="create"
        visible={isCreateModalVisible}
        onClose={handleCreateModalClose}
        onSuccess={handleSuccess}
        defaultDate={createModalDefaultDate}
      />

    </div>
  );
};

export default CalendarViews;
