import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Spin, Alert, Button, Space, FloatButton, Dropdown } from 'antd';
import { CalendarOutlined, AppstoreOutlined, MenuOutlined, PlusOutlined, LogoutOutlined, UserOutlined, TeamOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import CalendarTablet from './CalendarTablet';
import CalendarMobile from './CalendarMobile';
import CalendarViews from './CalendarViews';
import CalendarEventForm from './CalendarEventForm';
import { getEvents } from '../../services/calendar';
import { generateRecurringInstances } from '../../utils/recurrence';
import { useAuth } from '../auth';
import dayjs from 'dayjs';

// Keep the CalendarEvent type definition locally since we're using snake_case from backend
export interface CalendarEvent {
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
  attendees?: {
    id: string;
    contact_id?: string;
    email?: string;
    display_name?: string;
    rsvp_status: 'pending' | 'accepted' | 'declined' | 'tentative';
    responded_at?: string;
    contact?: {
      id: string;
      first_name: string;
      last_name?: string;
      display_name?: string;
      primary_email?: string;
    };
  }[];
}

export default function Calendar() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewType, setViewType] = useState<'dashboard' | 'calendar'>(() => {
    const viewParam = searchParams.get('view');
    return viewParam === 'calendar' ? 'calendar' : 'dashboard';
  });
  const [showMobileCreateModal, setShowMobileCreateModal] = useState(false);
  const { user, logout } = useAuth();

  // Update URL when view changes
  const handleViewTypeChange = (type: 'dashboard' | 'calendar') => {
    setViewType(type);
    if (type === 'calendar') {
      setSearchParams({ view: 'calendar' });
    } else {
      setSearchParams({});
    }
  };

  // Get user initials for mobile header
  const userInitials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  // User dropdown menu items
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: user?.name || 'User',
      disabled: true,
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'shopping',
      icon: <ShoppingCartOutlined />,
      label: 'Shopping List',
      onClick: () => navigate('/shopping'),
    },
    {
      key: 'contacts',
      icon: <TeamOutlined />,
      label: 'Contacts',
      onClick: () => navigate('/contacts'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Log out',
      danger: true,
      onClick: logout,
    },
  ];

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load calendar events from API
  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get a wider date range to support all views (3 months: previous, current, next)
      const now = dayjs();
      const startDate = now.subtract(1, 'month').startOf('month').toISOString();
      const endDate = now.add(1, 'month').endOf('month').toISOString();

      // Fetch events from API
      const data = await getEvents(startDate, endDate);

      // Generate recurring instances
      const allEvents: any[] = [];
      (data as any[]).forEach(event => {
        // Add the original event
        allEvents.push(event);

        // Generate recurring instances if applicable
        if (event.recurrence_rule) {
          const instances = generateRecurringInstances(event);
          allEvents.push(...instances);
        }
      });

      setEvents(allEvents as any);
    } catch (err) {
      console.error('Failed to load calendar events:', err);
      setError('Failed to load calendar events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading spinner
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#0a0f1e'
      }}>
        <Spin size="large" />
      </div>
    );
  }

  // Show error message
  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
        />
      </div>
    );
  }


  // Mobile Header Component with toggle
  const MobileHeader = () => {
    if (!isMobile) return null;

    return (
      <div style={{
        background: '#1a2332',
        color: 'white',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <h1 style={{
          margin: 0,
          fontSize: 18,
          fontWeight: 700,
          background: 'linear-gradient(135deg, #2dd4bf, #fb7185)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          Family Hub
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button
            type="text"
            onClick={() => handleViewTypeChange(viewType === 'calendar' ? 'dashboard' : 'calendar')}
            style={{
              color: 'white',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            {viewType === 'calendar' ? 'Dashboard' : 'Calendar'}
          </Button>
          <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: user?.color || '#2dd4bf',
              border: '2px solid white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              color: 'white',
            }}>
              {userInitials}
            </div>
          </Dropdown>
        </div>
      </div>
    );
  };

  // Render calendar views (new)
  if (viewType === 'calendar') {
    return (
      <>
        <MobileHeader />
        <CalendarViews
          events={events}
          onRefresh={loadEvents}
          onNavigateToDashboard={() => handleViewTypeChange('dashboard')}
          showViewToggle={!isMobile}
          currentViewType={viewType}
          onViewTypeChange={handleViewTypeChange}
        />
        {isMobile && (
          <>
            <FloatButton
              icon={<PlusOutlined />}
              type="primary"
              style={{
                right: 24,
                bottom: 24,
                width: 56,
                height: 56,
                backgroundColor: '#2dd4bf',
                borderColor: '#2dd4bf',
              }}
              onClick={() => setShowMobileCreateModal(true)}
            />
            <CalendarEventForm
              mode="create"
              visible={showMobileCreateModal}
              onClose={() => setShowMobileCreateModal(false)}
              onSuccess={() => {
                setShowMobileCreateModal(false);
                loadEvents();
              }}
            />
          </>
        )}
      </>
    );
  }

  // Render dashboard view
  return (
    <>
      <MobileHeader />
      {isMobile ? (
        <CalendarMobile events={events} onRefresh={loadEvents} onNavigateToCalendar={() => handleViewTypeChange('calendar')} />
      ) : (
        <CalendarTablet
          events={events}
          onRefresh={loadEvents}
          onNavigateToCalendar={() => handleViewTypeChange('calendar')}
          showViewToggle={true}
          currentViewType={viewType}
          onViewTypeChange={handleViewTypeChange}
        />
      )}
    </>
  );
}
