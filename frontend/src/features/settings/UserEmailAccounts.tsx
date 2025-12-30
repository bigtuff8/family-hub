import { useState, useEffect } from 'react';
import { Card, List, Button, Tag, Space, Typography, message, Spin } from 'antd';
import { GoogleOutlined, SyncOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAuth } from '../auth';
import { getConnectedAccounts, ConnectedAccount } from '../../services/settings';

const { Title, Text } = Typography;

export const UserEmailAccounts = () => {
    const { user } = useAuth();
    const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadAccounts();
    }, []);

    const loadAccounts = async () => {
        setLoading(true);
        try {
            const data = await getConnectedAccounts();
            setAccounts(data);
        } catch (error) {
            // Silently fail for now as the endpoint might not exist yet
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

        // Redirect to Backend OAuth endpoint
        const authUrl = `${import.meta.env.VITE_API_URL}/api/v1/calendar/auth/google/authorize?user_id=${user.id}&tenant_id=${user.tenant_id}`;

        // Open in current window to ensure redirect back works smoothly, 
        // or a popup if we implement a popup handler. For now, current window is safest.
        window.location.href = authUrl;
    };

    return (
        <Card title="Connected Accounts" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ marginBottom: 24 }}>
                <Text type="secondary">
                    Connect your external calendars to see all your events in one place.
                    Family Hub uses a "Google Wins" conflict strategy for sync.
                </Text>
            </div>

            <List
                loading={loading}
                itemLayout="horizontal"
                dataSource={accounts}
                locale={{ emptyText: 'No accounts connected' }}
                renderItem={(account) => (
                    <List.Item
                        actions={[
                            <Button danger type="text" icon={<DeleteOutlined />}>Unlink</Button>
                        ]}
                    >
                        <List.Item.Meta
                            avatar={
                                account.provider === 'google' ? <GoogleOutlined style={{ fontSize: 24, color: '#DB4437' }} /> :
                                    <SyncOutlined style={{ fontSize: 24 }} />
                            }
                            title={
                                <Space>
                                    {account.display_name}
                                    {account.is_default && <Tag color="blue">Default</Tag>}
                                </Space>
                            }
                            description={account.email_address}
                        />
                    </List.Item>
                )}
            />

            <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
                <Button
                    type="primary"
                    icon={<GoogleOutlined />}
                    onClick={handleConnectGoogle}
                    style={{ backgroundColor: '#DB4437', borderColor: '#DB4437' }}
                >
                    Connect Google Calendar
                </Button>
                {/* Future: Outlook, iCloud */}
            </div>
        </Card>
    );
};
