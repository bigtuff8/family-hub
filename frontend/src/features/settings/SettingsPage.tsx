import { useState } from 'react';
import { Layout, Typography, Button, Space, Dropdown, message } from 'antd';
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
import { getConnectedAccounts, ConnectedAccount, syncGoogleCalendar } from '../../services/settings';
import { useEffect } from 'react';
import '../contacts/ContactsPage.css';
import './SettingsPage.css';

const { Content } = Layout;
const { Title, Text } = Typography;

type SettingsView = 'main' | 'profile' | 'accounts' | 'security' | 'system';

export const SettingsPage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [currentView, setCurrentView] = useState<SettingsView>('main');
    const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
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
        }
    }, []);

    // Load accounts when viewing accounts section
    useEffect(() => {
        if (currentView === 'accounts' && user) {
            loadAccounts();
        }
    }, [currentView, user]);

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

    const handleSyncNow = async () => {
        if (!user) return;
        setSyncing(true);
        try {
            const result = await syncGoogleCalendar(user.id);
            message.success(`Sync complete! Processed ${result.synced_events} events.`);
        } catch (error) {
            message.error('Sync failed. Please try again.');
        } finally {
            setSyncing(false);
        }
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

    const renderSubheader = () => {
        const isDetailView = currentView !== 'main';
        const currentCategory = settingsCategories.find(c => c.key === currentView);

        return (
            <div className="settings-subheader">
                {isDetailView ? (
                    <>
                        <div className="subheader-back" onClick={() => setCurrentView('main')}>
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

    const renderMainView = () => (
        <div className="settings-cards">
            {settingsCategories.map(category => (
                <div
                    key={category.key}
                    className="settings-card"
                    onClick={() => setCurrentView(category.key as SettingsView)}
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

    const renderAccountsView = () => (
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
                            {accounts.find(a => a.provider === 'google')?.email_address || 'Not connected'}
                        </div>
                    </div>
                    {accounts.find(a => a.provider === 'google') ? (
                        <span className="status-badge connected">Connected</span>
                    ) : (
                        <Button type="primary" size="small" onClick={handleConnectGoogle}>
                            Connect
                        </Button>
                    )}
                </div>

                {/* Outlook (placeholder) */}
                <div className="settings-detail-item">
                    <div className="service-icon outlook">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                            <path d="M12 2L2 7v10l10 5 10-5V7L12 2z"/>
                        </svg>
                    </div>
                    <div className="settings-detail-item-content">
                        <div className="settings-detail-item-title">Microsoft Outlook</div>
                        <div className="settings-detail-item-value">Coming soon</div>
                    </div>
                    <Button disabled size="small">Connect</Button>
                </div>
            </div>

            {accounts.length > 0 && (
                <div className="settings-section">
                    <div className="settings-section-title">Sync Options</div>

                    <div className="settings-detail-item">
                        <div className="settings-detail-item-content">
                            <div className="settings-detail-item-title">Sync Now</div>
                            <div className="settings-detail-item-value">Last synced: Just now</div>
                        </div>
                        <Button
                            icon={<SyncOutlined spin={syncing} />}
                            onClick={handleSyncNow}
                            loading={syncing}
                        >
                            Sync
                        </Button>
                    </div>

                    <div className="settings-detail-item">
                        <div className="settings-detail-item-content">
                            <div className="settings-detail-item-title">Auto-sync</div>
                            <div className="settings-detail-item-value">Every 15 minutes</div>
                        </div>
                        <div className="toggle-switch active" />
                    </div>
                </div>
            )}
        </div>
    );

    const renderProfileView = () => (
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

    const renderSecurityView = () => (
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

    const renderSystemView = () => (
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

    const renderContent = () => {
        switch (currentView) {
            case 'main':
                return renderMainView();
            case 'profile':
                return renderProfileView();
            case 'accounts':
                return renderAccountsView();
            case 'security':
                return renderSecurityView();
            case 'system':
                return renderSystemView();
            default:
                return renderMainView();
        }
    };

    return (
        <div className="contacts-page">
            {renderHeader()}
            {renderSubheader()}
            <Content className="settings-content">
                {renderContent()}
            </Content>
        </div>
    );
};
