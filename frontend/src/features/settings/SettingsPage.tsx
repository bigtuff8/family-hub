import { Layout, Typography, Menu, Button, Space, Dropdown } from 'antd';
import {
    UserOutlined,
    SettingOutlined,
    LockOutlined,
    GlobalOutlined,
    CalendarOutlined,
    AppstoreOutlined,
    LogoutOutlined,
    TeamOutlined,
    ShoppingCartOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { UserEmailAccounts } from './UserEmailAccounts';
import { useAuth } from '../auth';
import WeatherWidget from '../../components/WeatherWidget';
import { getInitials } from '../../utils/strings';
import '../contacts/ContactsPage.css'; // Reuse contacts page styles

const { Content } = Layout;
const { Title } = Typography;

export const SettingsPage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

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

    return (
        <div className="contacts-page">
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

            <div className="contacts-subheader">
                <div className="subheader-left">
                    <SettingOutlined className="subheader-icon" />
                    <div>
                        <Title level={4} className="subheader-title">Settings</Title>
                    </div>
                </div>
            </div>

            <Content style={{ padding: '24px', background: '#f0f2f5' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <div style={{
                        display: 'flex',
                        background: '#fff',
                        borderRadius: 12,
                        padding: '24px 0',
                        minHeight: 400
                    }}>
                        <div style={{
                            width: 200,
                            minWidth: 200,
                            maxWidth: 200,
                            borderRight: '1px solid #f0f0f0'
                        }}>
                            <Menu
                                mode="inline"
                                defaultSelectedKeys={['accounts']}
                                style={{ border: 0 }}
                                items={[
                                    { key: 'profile', icon: <UserOutlined />, label: 'Profile' },
                                    { key: 'accounts', icon: <GlobalOutlined />, label: 'Connected Accounts' },
                                    { key: 'security', icon: <LockOutlined />, label: 'Security' },
                                    { key: 'system', icon: <SettingOutlined />, label: 'System' },
                                ]}
                            />
                        </div>
                        <div style={{ flex: 1, padding: '0 24px', overflow: 'auto' }}>
                            <Title level={4} style={{ marginBottom: 24 }}>Connected Accounts</Title>
                            <UserEmailAccounts />
                        </div>
                    </div>
                </div>
            </Content>
        </div>
    );
};
