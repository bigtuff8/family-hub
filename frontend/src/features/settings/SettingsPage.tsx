import { useState, useEffect } from 'react';
import { Layout, Typography, Button, Space, Dropdown, Menu, message, Modal } from 'antd';
import {
    UserOutlined,
    SettingOutlined,
    LockOutlined,
    GlobalOutlined,
    CalendarOutlined,
    AppstoreOutlined,
    LogoutOutlined,
    TeamOutlined,
    ShoppingCartOutlined,
    LeftOutlined,
    GoogleOutlined,
    SyncOutlined,
    RightOutlined
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { useAuth } from '../auth';
import WeatherWidget from '../../components/WeatherWidget';
import { getInitials } from '../../utils/strings';
import { getConnectedAccounts, ConnectedAccount, syncGoogleCalendar, syncOutlookCalendar, disconnectCalendar } from '../../services/settings';
import '../contacts/ContactsPage.css';
import './SettingsPage.css';

const { Content } = Layout;
const { Title, Text } = Typography;

type SettingsView = 'main' | 'profile' | 'accounts' | 'security' | 'system';

// Hook to detect mobile screen
const useIsMobile = (breakpoint = 768) => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < breakpoint);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [breakpoint]);

    return isMobile;
};

export const SettingsPage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const [currentView, setCurrentView] = useState<SettingsView>('accounts');
    const [mobileView, setMobileView] = useState<SettingsView>('main');
    const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [disconnecting, setDisconnecting] = useState(false);
    const [disconnectModalVisible, setDisconnectModalVisible] = useState(false);
    const [disconnectProvider, setDisconnectProvider] = useState<string | null>(null);
    const [searchParams, setSearchParams] = useSearchParams();

    const userInitials = getInitials(user?.name) || 'U';

    // Check for OAuth callback
    useEffect(() => {
        const status = searchParams.get('status');
        const provider = searchParams.get('provider');

        if (status === 'success' && provider === 'google') {
            message.success('Google Calendar connected successfully!');
            searchParams.delete('status');
            searchParams.delete('provider');
            setSearchParams(searchParams);
            setCurrentView('accounts');
            setMobileView('accounts');
        }
    }, []);

    // Load accounts when viewing accounts section
    useEffect(() => {
        const activeView = isMobile ? mobileView : currentView;
        if (activeView === 'accounts' && user) {
            loadAccounts();
        }
    }, [currentView, mobileView, user, isMobile]);

    const loadAccounts = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await getConnectedAccounts(user.id);
            setAccounts(data);
        } catch (error) {
            console.log('Could not load accounts', error);
        } finally {
            setLoading(false);
        }
    };

    const handleConnectGoogle = () => {
        if (!user) {
            message.error('You must be logged in to connect an account');
            return;
        }
        const authUrl = `${import.meta.env.VITE_API_URL}/api/v1/calendar/auth/google/authorize?user_id=${user.id}&tenant_id=${user.tenant_id}`;
        window.location.href = authUrl;
    };

    const handleConnectOutlook = () => {
        if (!user) {
            message.error('You must be logged in to connect an account');
            return;
        }
        const authUrl = `${import.meta.env.VITE_API_URL}/api/v1/calendar/auth/outlook/authorize?user_id=${user.id}&tenant_id=${user.tenant_id}`;
        window.location.href = authUrl;
    };

    const handleSyncNow = async (provider: string = 'google') => {
        if (!user) return;
        setSyncing(true);
        try {
            const result = provider === 'outlook'
                ? await syncOutlookCalendar(user.id)
                : await syncGoogleCalendar(user.id);
            message.success(`Sync complete! Processed ${result.synced_events || 0} events.`);
            await loadAccounts(); // Refresh to get updated last_sync time
        } catch (error) {
            message.error('Sync failed. Please try again.');
        } finally {
            setSyncing(false);
        }
    };

    const handleDisconnectClick = (provider: string) => {
        setDisconnectProvider(provider);
        setDisconnectModalVisible(true);
    };

    const handleDisconnectConfirm = async () => {
        if (!user || !disconnectProvider) return;
        setDisconnecting(true);
        try {
            await disconnectCalendar(user.id, disconnectProvider);
            message.success(`${disconnectProvider === 'google' ? 'Google Calendar' : 'Outlook'} disconnected successfully`);
            setDisconnectModalVisible(false);
            setDisconnectProvider(null);
            await loadAccounts(); // Refresh the list
        } catch (error) {
            message.error('Failed to disconnect. Please try again.');
        } finally {
            setDisconnecting(false);
        }
    };

    const handleDisconnectCancel = () => {
        setDisconnectModalVisible(false);
        setDisconnectProvider(null);
    };

    const userMenuItems = [
        { key: 'profile', icon: <UserOutlined />, label: user?.name || 'User', disabled: true },
        { type: 'divider' as const },
        { key: 'shopping', icon: <ShoppingCartOutlined />, label: 'Shopping List', onClick: () => navigate('/shopping') },
        { key: 'contacts', icon: <TeamOutlined />, label: 'Contacts', onClick: () => navigate('/contacts') },
        { key: 'settings', icon: <SettingOutlined />, label: 'Settings', onClick: () => navigate('/settings') },
        { type: 'divider' as const },
        { key: 'logout', icon: <LogoutOutlined />, label: 'Log out', danger: true, onClick: logout },
    ];

    const settingsCategories = [
        {
            key: 'profile',
            icon: <UserOutlined />,
            title: 'Profile',
            subtitle: 'Name, avatar, family settings',
            color: 'linear-gradient(135deg, #2dd4bf, #14b8a6)'
        },
        {
            key: 'accounts',
            icon: <GlobalOutlined />,
            title: 'Connected Accounts',
            subtitle: 'Google Calendar, Outlook sync',
            color: 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
        },
        {
            key: 'security',
            icon: <LockOutlined />,
            title: 'Security',
            subtitle: 'Password, PIN, sessions',
            color: 'linear-gradient(135deg, #fb7185, #e11d48)'
        },
        {
            key: 'system',
            icon: <SettingOutlined />,
            title: 'System',
            subtitle: 'Display, notifications, data',
            color: 'linear-gradient(135deg, #64748b, #475569)'
        }
    ];

    const sidebarMenuItems = settingsCategories.map(cat => ({
        key: cat.key,
        icon: cat.icon,
        label: cat.title
    }));

    const renderHeader = () => (
        <header className="contacts-header-full">
            <div className="header-left">
                <h1 className="header-logo" onClick={() => navigate('/calendar')} style={{ cursor: 'pointer' }}>Family Hub</h1>
                <div className="header-date">
                    <div className="date-main">{dayjs().format('dddd, MMMM D, YYYY')}</div>
                    <div className="date-time">{dayjs().format('h:mm A')}</div>
                </div>
                <div className="header-weather"><WeatherWidget variant="full" /></div>
            </div>
            <div style={{ flex: 1 }} />
            <div className="header-center">
                <Space.Compact>
                    <Button type="default" icon={<CalendarOutlined />} onClick={() => navigate('/calendar?view=calendar')}>Calendar</Button>
                    <Button type="default" icon={<AppstoreOutlined />} onClick={() => navigate('/calendar')}>Dashboard</Button>
                </Space.Compact>
            </div>
            <div className="header-right">
                <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
                    <div className="user-avatar" style={{ background: user?.color || '#2dd4bf' }}>{userInitials}</div>
                </Dropdown>
            </div>
        </header>
    );

    const renderMobileSubheader = () => {
        const isDetailView = mobileView !== 'main';
        const currentCategory = settingsCategories.find(c => c.key === mobileView);

        return (
            <div className="settings-subheader">
                {isDetailView ? (
                    <>
                        <div className="subheader-back" onClick={() => setMobileView('main')}>
                            <LeftOutlined />
                        </div>
                        <div className="subheader-title-area">
                            <Title level={4} className="subheader-title">{currentCategory?.title || 'Settings'}</Title>
                        </div>
                    </>
                ) : (
                    <div className="subheader-title-area">
                        <SettingOutlined className="subheader-icon" />
                        <Title level={4} className="subheader-title">Settings</Title>
                    </div>
                )}
            </div>
        );
    };

    const renderDesktopSubheader = () => (
        <div className="contacts-subheader">
            <div className="subheader-left">
                <SettingOutlined className="subheader-icon" />
                <div>
                    <Title level={4} className="subheader-title">Settings</Title>
                </div>
            </div>
        </div>
    );

    // ============ DETAIL CONTENT VIEWS ============

    const renderAccountsContent = () => {
        const googleAccount = accounts.find(a => a.provider === 'google');
        const outlookAccount = accounts.find(a => a.provider === 'outlook');

        return (
            <div className="settings-detail-content">
                <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
                    Connect your external calendars to see all your events in one place.
                </Text>

                <div className="settings-section">
                    <div className="settings-section-title">Calendar Sync</div>

                    {/* Google Calendar */}
                    <div className="settings-detail-item">
                        <div className="service-icon google">
                            <GoogleOutlined />
                        </div>
                        <div className="settings-detail-item-content">
                            <div className="settings-detail-item-title">Google Calendar</div>
                            <div className="settings-detail-item-value">
                                {googleAccount?.email_address || 'Not connected'}
                            </div>
                        </div>
                        {googleAccount ? (
                            <Space>
                                <span className="status-badge connected">Connected</span>
                                <Button
                                    size="small"
                                    danger
                                    onClick={() => handleDisconnectClick('google')}
                                >
                                    Disconnect
                                </Button>
                            </Space>
                        ) : (
                            <Button type="primary" size="small" onClick={handleConnectGoogle}>
                                Connect
                            </Button>
                        )}
                    </div>

                    {/* Outlook Calendar */}
                    <div className="settings-detail-item">
                        <div className="service-icon outlook">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                <path d="M12 2L2 7v10l10 5 10-5V7L12 2z"/>
                            </svg>
                        </div>
                        <div className="settings-detail-item-content">
                            <div className="settings-detail-item-title">Microsoft Outlook</div>
                            <div className="settings-detail-item-value">
                                {outlookAccount?.email_address || 'Not connected'}
                            </div>
                        </div>
                        {outlookAccount ? (
                            <Space>
                                <span className="status-badge connected">Connected</span>
                                <Button
                                    size="small"
                                    danger
                                    onClick={() => handleDisconnectClick('outlook')}
                                >
                                    Disconnect
                                </Button>
                            </Space>
                        ) : (
                            <Button type="primary" size="small" onClick={handleConnectOutlook}>
                                Connect
                            </Button>
                        )}
                    </div>
                </div>

                {/* Sync Options - only show if accounts connected */}
                {accounts.length > 0 && (
                    <div className="settings-section">
                        <div className="settings-section-title">Sync Options</div>

                        {googleAccount && (
                            <div className="settings-detail-item">
                                <div className="service-icon google" style={{ width: 32, height: 32 }}>
                                    <GoogleOutlined style={{ fontSize: 14 }} />
                                </div>
                                <div className="settings-detail-item-content">
                                    <div className="settings-detail-item-title">Sync Google Calendar</div>
                                    <div className="settings-detail-item-value">Pull latest events from Google</div>
                                </div>
                                <Button
                                    icon={<SyncOutlined spin={syncing} />}
                                    onClick={() => handleSyncNow('google')}
                                    loading={syncing}
                                    size="small"
                                >
                                    Sync
                                </Button>
                            </div>
                        )}

                        {outlookAccount && (
                            <div className="settings-detail-item">
                                <div className="service-icon outlook" style={{ width: 32, height: 32 }}>
                                    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                                        <path d="M12 2L2 7v10l10 5 10-5V7L12 2z"/>
                                    </svg>
                                </div>
                                <div className="settings-detail-item-content">
                                    <div className="settings-detail-item-title">Sync Outlook Calendar</div>
                                    <div className="settings-detail-item-value">Pull latest events from Outlook</div>
                                </div>
                                <Button
                                    icon={<SyncOutlined spin={syncing} />}
                                    onClick={() => handleSyncNow('outlook')}
                                    loading={syncing}
                                    size="small"
                                >
                                    Sync
                                </Button>
                            </div>
                        )}

                        <div className="settings-detail-item">
                            <div className="settings-detail-item-content">
                                <div className="settings-detail-item-title">Auto-sync</div>
                                <div className="settings-detail-item-value">Automatically sync every 15 minutes</div>
                            </div>
                            <div className="toggle-switch active" />
                        </div>
                    </div>
                )}

                {/* Disconnect Confirmation Modal */}
                <Modal
                    title="Disconnect Calendar"
                    open={disconnectModalVisible}
                    onOk={handleDisconnectConfirm}
                    onCancel={handleDisconnectCancel}
                    okText="Disconnect"
                    okButtonProps={{ danger: true, loading: disconnecting }}
                    cancelText="Cancel"
                >
                    <p>Are you sure you want to disconnect your {disconnectProvider === 'google' ? 'Google Calendar' : 'Outlook Calendar'}?</p>
                    <p style={{ color: '#64748b', fontSize: 13 }}>
                        Events that were synced from this calendar will be removed from Family Hub.
                        Events you created in Family Hub will not be affected.
                    </p>
                </Modal>
            </div>
        );
    };

    const renderProfileContent = () => (
        <div className="settings-detail-content">
            <div className="settings-section">
                <div className="settings-section-title">Your Information</div>

                <div className="settings-detail-item">
                    <div className="settings-detail-item-content">
                        <div className="settings-detail-item-title">Display Name</div>
                        <div className="settings-detail-item-value">{user?.name || 'Not set'}</div>
                    </div>
                    <RightOutlined style={{ color: '#ccc' }} />
                </div>

                <div className="settings-detail-item">
                    <div className="settings-detail-item-content">
                        <div className="settings-detail-item-title">Email</div>
                        <div className="settings-detail-item-value">{user?.email || 'Not set'}</div>
                    </div>
                    <RightOutlined style={{ color: '#ccc' }} />
                </div>

                <div className="settings-detail-item">
                    <div className="settings-detail-item-content">
                        <div className="settings-detail-item-title">Your Color</div>
                        <div className="settings-detail-item-value">Used for your events</div>
                    </div>
                    <div style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        background: user?.color || '#2dd4bf'
                    }} />
                </div>
            </div>

            <div className="settings-section">
                <div className="settings-section-title">Family</div>

                <div className="settings-detail-item">
                    <div className="settings-detail-item-content">
                        <div className="settings-detail-item-title">Family Role</div>
                        <div className="settings-detail-item-value">{user?.isAdmin ? 'Admin' : 'Member'}</div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderSecurityContent = () => (
        <div className="settings-detail-content">
            <div className="settings-section">
                <div className="settings-section-title">Authentication</div>

                <div className="settings-detail-item">
                    <div className="settings-detail-item-content">
                        <div className="settings-detail-item-title">Change Password</div>
                        <div className="settings-detail-item-value">Update your password</div>
                    </div>
                    <RightOutlined style={{ color: '#ccc' }} />
                </div>

                <div className="settings-detail-item">
                    <div className="settings-detail-item-content">
                        <div className="settings-detail-item-title">Enable PIN</div>
                        <div className="settings-detail-item-value">Quick unlock on shared devices</div>
                    </div>
                    <div className="toggle-switch" />
                </div>
            </div>

            <div className="settings-section">
                <div className="settings-section-title">Sessions</div>

                <div className="settings-detail-item">
                    <div className="settings-detail-item-content">
                        <div className="settings-detail-item-title">Active Sessions</div>
                        <div className="settings-detail-item-value">1 device</div>
                    </div>
                    <RightOutlined style={{ color: '#ccc' }} />
                </div>

                <div className="settings-detail-item">
                    <div className="settings-detail-item-content">
                        <div className="settings-detail-item-title">Sign Out Everywhere</div>
                        <div className="settings-detail-item-value" style={{ color: '#fb7185' }}>End all sessions</div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderSystemContent = () => (
        <div className="settings-detail-content">
            <div className="settings-section">
                <div className="settings-section-title">Display</div>

                <div className="settings-detail-item">
                    <div className="settings-detail-item-content">
                        <div className="settings-detail-item-title">Dark Mode</div>
                        <div className="settings-detail-item-value">Use dark theme</div>
                    </div>
                    <div className="toggle-switch" />
                </div>

                <div className="settings-detail-item">
                    <div className="settings-detail-item-content">
                        <div className="settings-detail-item-title">Compact View</div>
                        <div className="settings-detail-item-value">Show more items on screen</div>
                    </div>
                    <div className="toggle-switch" />
                </div>
            </div>

            <div className="settings-section">
                <div className="settings-section-title">Notifications</div>

                <div className="settings-detail-item">
                    <div className="settings-detail-item-content">
                        <div className="settings-detail-item-title">Push Notifications</div>
                        <div className="settings-detail-item-value">Event reminders</div>
                    </div>
                    <div className="toggle-switch active" />
                </div>

                <div className="settings-detail-item">
                    <div className="settings-detail-item-content">
                        <div className="settings-detail-item-title">Sound</div>
                        <div className="settings-detail-item-value">Notification sounds</div>
                    </div>
                    <div className="toggle-switch active" />
                </div>
            </div>

            <div className="settings-section">
                <div className="settings-section-title">About</div>

                <div className="settings-detail-item">
                    <div className="settings-detail-item-content">
                        <div className="settings-detail-item-title">Version</div>
                        <div className="settings-detail-item-value">1.0.0</div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderDetailContent = (view: SettingsView) => {
        switch (view) {
            case 'profile':
                return renderProfileContent();
            case 'accounts':
                return renderAccountsContent();
            case 'security':
                return renderSecurityContent();
            case 'system':
                return renderSystemContent();
            default:
                return renderAccountsContent();
        }
    };

    // ============ MOBILE LAYOUT ============

    const renderMobileMainView = () => (
        <div className="settings-cards">
            {settingsCategories.map(category => (
                <div
                    key={category.key}
                    className="settings-card"
                    onClick={() => setMobileView(category.key as SettingsView)}
                >
                    <div className="settings-card-icon" style={{ background: category.color }}>
                        {category.icon}
                    </div>
                    <div className="settings-card-content">
                        <div className="settings-card-title">{category.title}</div>
                        <div className="settings-card-subtitle">{category.subtitle}</div>
                    </div>
                    <div className="settings-card-arrow">
                        <RightOutlined />
                    </div>
                </div>
            ))}
        </div>
    );

    const renderMobileLayout = () => (
        <>
            {renderMobileSubheader()}
            <Content className="settings-content">
                {mobileView === 'main' ? renderMobileMainView() : renderDetailContent(mobileView)}
            </Content>
        </>
    );

    // ============ DESKTOP LAYOUT ============

    const renderDesktopLayout = () => (
        <>
            {renderDesktopSubheader()}
            <Content style={{ padding: '24px', background: '#f0f2f5' }}>
                <div style={{ maxWidth: 1000, margin: '0 auto' }}>
                    <div className="settings-desktop-layout">
                        <div className="settings-sidebar">
                            <Menu
                                mode="inline"
                                selectedKeys={[currentView]}
                                onClick={({ key }) => setCurrentView(key as SettingsView)}
                                style={{ border: 0, background: 'transparent' }}
                                items={sidebarMenuItems}
                            />
                        </div>
                        <div className="settings-main">
                            <Title level={4} style={{ marginBottom: 24 }}>
                                {settingsCategories.find(c => c.key === currentView)?.title}
                            </Title>
                            {renderDetailContent(currentView)}
                        </div>
                    </div>
                </div>
            </Content>
        </>
    );

    return (
        <div className="contacts-page">
            {renderHeader()}
            {isMobile ? renderMobileLayout() : renderDesktopLayout()}
        </div>
    );
};
