import React, { useState, useEffect, useMemo } from 'react';
import { Button, Space, Tabs, DatePicker, Dropdown } from 'antd';
import {
  LeftOutlined,
  RightOutlined,
  CalendarOutlined,
  PlusOutlined,
  AppstoreOutlined,
  UserOutlined,
  LogoutOutlined,
  TeamOutlined,
  ShoppingCartOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { getInitials } from '../../utils/strings';
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

// Family members configuration
const FAMILY_MEMBERS = [
  { id: '10000000-0000-0000-0000-000000000001', name: 'James', color: '#e30613' },
  { id: '10000000-0000-0000-0000-000000000002', name: 'Nicola', color: '#fb7185' },
  { id: '10000000-0000-0000-0000-000000000003', name: 'Tommy', color: '#00B140' },
  { id: '10000000-0000-0000-0000-000000000004', name: 'Harry', color: '#1D428A' },
];

// Calendar source configuration
const CALENDAR_SOURCES = [
  { id: 'primary', name: 'Google', color: '#DB4437' },
  { id: 'outlook_primary', name: 'Outlook', color: '#0078D4' },
  { id: 'familyhub', name: 'Family Hub', color: '#2dd4bf' },
];

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
  onNavigateToDashboard: _onNavigateToDashboard,
  showViewToggle = false,
  currentViewType = 'calendar',
  onViewTypeChange
}) => {
  void _onNavigateToDashboard; // Reserved for future use
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [viewMode, setViewMode] = useState<ViewMode>(window.innerWidth < 768 ? 'week' : 'month');
  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [createModalDefaultDate, setCreateModalDefaultDate] = useState<Dayjs | undefined>(undefined);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Filter states - all visible by default
  const [visibleFamilyMembers, setVisibleFamilyMembers] = useState<Set<string>>(
    new Set(FAMILY_MEMBERS.map(m => m.id))
  );
  const [visibleSources, setVisibleSources] = useState<Set<string>>(
    new Set(CALENDAR_SOURCES.map(s => s.id))
  );

  // Determine which calendar sources are actually in use
  const connectedSources = useMemo(() => {
    const sourcesInUse = new Set<string>();
    events.forEach(event => {
      if (event.external_calendar_id === 'primary') {
        sourcesInUse.add('primary'); // Google
      } else if (event.external_calendar_id === 'outlook_primary') {
        sourcesInUse.add('outlook_primary'); // Outlook
      } else {
        sourcesInUse.add('familyhub'); // Family Hub (no external_calendar_id)
      }
    });
    return sourcesInUse;
  }, [events]);

  // Count events per family member
  const familyMemberCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    FAMILY_MEMBERS.forEach(m => { counts[m.id] = 0; });
    events.forEach(event => {
      if (event.user_id && counts[event.user_id] !== undefined) {
        counts[event.user_id]++;
      }
    });
    return counts;
  }, [events]);

  // Count events per source
  const sourceCounts = useMemo(() => {
    const counts: Record<string, number> = { primary: 0, outlook_primary: 0, familyhub: 0 };
    events.forEach(event => {
      if (event.external_calendar_id === 'primary') {
        counts.primary++;
      } else if (event.external_calendar_id === 'outlook_primary') {
        counts.outlook_primary++;
      } else {
        counts.familyhub++;
      }
    });
    return counts;
  }, [events]);

  // Filter events based on selected filters
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Check family member filter
      const memberVisible = !event.user_id || visibleFamilyMembers.has(event.user_id);

      // Check source filter
      let sourceId = 'familyhub';
      if (event.external_calendar_id === 'primary') {
        sourceId = 'primary';
      } else if (event.external_calendar_id === 'outlook_primary') {
        sourceId = 'outlook_primary';
      }
      const sourceVisible = visibleSources.has(sourceId);

      return memberVisible && sourceVisible;
    });
  }, [events, visibleFamilyMembers, visibleSources]);

  // Toggle family member visibility
  const toggleFamilyMember = (memberId: string) => {
    setVisibleFamilyMembers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(memberId)) {
        newSet.delete(memberId);
      } else {
        newSet.add(memberId);
      }
      return newSet;
    });
  };

  // Toggle source visibility
  const toggleSource = (sourceId: string) => {
    setVisibleSources(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sourceId)) {
        newSet.delete(sourceId);
      } else {
        newSet.add(sourceId);
      }
      return newSet;
    });
  };

  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const userInitials = getInitials(user?.name) || 'U';

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: user?.name || 'User', disabled: true },
    { type: 'divider' as const },
    { key: 'shopping', icon: <ShoppingCartOutlined />, label: 'Shopping List', onClick: () => navigate('/shopping') },
    { key: 'contacts', icon: <TeamOutlined />, label: 'Contacts', onClick: () => navigate('/contacts') },
    { key: 'settings', icon: <SettingOutlined />, label: 'Settings', onClick: () => navigate('/settings') },
    { type: 'divider' as const },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Log out', danger: true, onClick: logout },
  ];

  // Update selectedEvent with fresh data when events refresh (keeps modal in sync)
  useEffect(() => {
    if (selectedEvent && events.length > 0) {
      const freshEvent = events.find(e => e.id === selectedEvent.id);
      if (freshEvent && freshEvent !== selectedEvent) {
        setSelectedEvent(freshEvent);
      }
    }
  }, [events]);

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

  // Navigate to today (reserved for future Today button)
  const _handleToday = () => {
    setCurrentDate(dayjs());
  };
  void _handleToday;

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
          <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
            <div className="user-avatar" style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: user?.color || '#2dd4bf',
              border: '3px solid white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 600,
              cursor: 'pointer',
              marginLeft: 16,
            }}>
              {userInitials}
            </div>
          </Dropdown>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="calendar-filter-bar">
        <span className="filter-label">Family:</span>
        {FAMILY_MEMBERS.map(member => (
          <div
            key={member.id}
            className={`filter-chip ${visibleFamilyMembers.has(member.id) ? 'active' : 'inactive'}`}
            onClick={() => toggleFamilyMember(member.id)}
          >
            <span className="filter-chip-dot" style={{ backgroundColor: member.color }}></span>
            <span>{member.name}</span>
            <span className="filter-chip-count">{familyMemberCounts[member.id] || 0}</span>
          </div>
        ))}

        {/* Only show source filters if there are external calendars connected */}
        {connectedSources.size > 1 && (
          <>
            <span className="filter-divider">|</span>
            <span className="filter-label">Source:</span>
            {CALENDAR_SOURCES.filter(source => connectedSources.has(source.id)).map(source => (
              <div
                key={source.id}
                className={`filter-chip ${visibleSources.has(source.id) ? 'active' : 'inactive'}`}
                onClick={() => toggleSource(source.id)}
              >
                <span className="filter-chip-dot" style={{ backgroundColor: source.color }}></span>
                <span>{source.name}</span>
                <span className="filter-chip-count">{sourceCounts[source.id] || 0}</span>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Calendar view content */}
      <div className="calendar-views-content">
        {viewMode === 'month' && (
          <MonthView
            events={filteredEvents}
            currentDate={currentDate}
            onEventClick={handleEventClick}
            onDateClick={handleDateClick}
          />
        )}
        {viewMode === 'week' && (
          <WeekView
            events={filteredEvents}
            currentDate={currentDate}
            onEventClick={handleEventClick}
          />
        )}
        {viewMode === 'day' && (
          <DayView
            events={filteredEvents}
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
