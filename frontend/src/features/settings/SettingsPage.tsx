import { Layout, Typography, Row, Col, Menu } from 'antd';
import { UserOutlined, SettingOutlined, LockOutlined, GlobalOutlined } from '@ant-design/icons';
import { UserEmailAccounts } from './UserEmailAccounts';
import { useAuth } from '../auth';

const { Content, Sider } = Layout;
const { Title } = Typography;

export const SettingsPage = () => {
    const { user } = useAuth();

    return (
        <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
            <Content style={{ padding: '24px 50px' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <div style={{ marginBottom: 24 }}>
                        <Title level={2} style={{ margin: 0 }}>Settings</Title>
                    </div>

                    <Layout style={{ padding: '24px 0', background: '#fff', borderRadius: 12 }}>
                        <Sider width={250} style={{ background: '#fff' }}>
                            <Menu
                                mode="inline"
                                defaultSelectedKeys={['accounts']}
                                style={{ height: '100%', borderRight: 0 }}
                                items={[
                                    { key: 'profile', icon: <UserOutlined />, label: 'Profile' },
                                    { key: 'accounts', icon: <GlobalOutlined />, label: 'Connected Accounts' },
                                    { key: 'security', icon: <LockOutlined />, label: 'Security' },
                                    { key: 'system', icon: <SettingOutlined />, label: 'System' },
                                ]}
                            />
                        </Sider>
                        <Content style={{ padding: '0 24px', minHeight: 280 }}>
                            <div style={{ maxWidth: 800 }}>
                                <Title level={4} style={{ marginBottom: 24 }}>Connected Accounts</Title>
                                <UserEmailAccounts />
                            </div>
                        </Content>
                    </Layout>
                </div>
            </Content>
        </Layout>
    );
};
