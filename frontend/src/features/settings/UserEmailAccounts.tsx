import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, List, Button, Tag, Space, Typography, message, Spin } from 'antd';
import { GoogleOutlined, WindowsOutlined, SyncOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAuth } from '../auth';
import { getConnectedAccounts, ConnectedAccount, syncGoogleCalendar, syncOutlookCalendar } from '../../services/settings';

const { Title, Text } = Typography;

export const UserEmailAccounts = () => {
    const { user } = useAuth();
    const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        if (!user) return;

        // Check for success redirect
        const status = searchParams.get('status');
        const provider = searchParams.get('provider');

        if (status === 'success') {
            if (provider === 'google') {
                message.success('Google Calendar connected successfully!');
            } else if (provider === 'outlook') {
                message.success('Outlook Calendar connected successfully!');
            }
            // Clean up URL
            searchParams.delete('status');
            searchParams.delete('provider');
            setSearchParams(searchParams);
        }

        loadAccounts();
    }, [user]); // Add user as dependency

    const loadAccounts = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await getConnectedAccounts(user.id);
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

    const handleConnectOutlook = () => {
        if (!user) {
            message.error('You must be logged in to connect an account');
            return;
        }

        // Redirect to Backend OAuth endpoint for Outlook
        const authUrl = `${import.meta.env.VITE_API_URL}/api/v1/calendar/auth/outlook/authorize?user_id=${user.id}&tenant_id=${user.tenant_id}`;
        window.location.href = authUrl;
    };

    const handleSyncNow = async () => {
        if (!user) return;
        setSyncing(true);
        try {
            // Sync all connected calendars
            let totalEvents = 0;
            const googleAccount = accounts.find(a => a.provider === 'google');
            const outlookAccount = accounts.find(a => a.provider === 'outlook');

            if (googleAccount) {
                const googleResult = await syncGoogleCalendar(user.id);
                totalEvents += googleResult.synced_events || 0;
            }

            if (outlookAccount) {
                const outlookResult = await syncOutlookCalendar(user.id);
                totalEvents += outlookResult.synced_events || 0;
            }

            message.success(`Sync complete! Processed ${totalEvents} events.`);
        } catch (error) {
            message.error('Sync failed. Please try again.');
        } finally {
            setSyncing(false);
        }
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
                                account.provider === 'outlook' ? <WindowsOutlined style={{ fontSize: 24, color: '#0078D4' }} /> :
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

            <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Button
                    type="primary"
                    icon={<GoogleOutlined />}
                    onClick={handleConnectGoogle}
                    style={{ backgroundColor: '#DB4437', borderColor: '#DB4437' }}
                >
                    Connect Google
                </Button>
                <Button
                    type="primary"
                    icon={<WindowsOutlined />}
                    onClick={handleConnectOutlook}
                    style={{ backgroundColor: '#0078D4', borderColor: '#0078D4' }}
                >
                    Connect Outlook
                </Button>
                <Button
                    icon={<SyncOutlined spin={syncing} />}
                    onClick={handleSyncNow}
                    loading={syncing}
                >
                    Sync Now
                </Button>
                {/* Future: iCloud */}
            </div>
        </Card>
    );
};
