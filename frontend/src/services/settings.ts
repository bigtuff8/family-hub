import api from './api';

export interface ConnectedAccount {
    id: string;
    provider: string; // 'google', 'outlook', 'icloud'
    email_address: string;
    display_name: string;
    is_default: boolean;
    receive_invites: boolean;
}

export const getConnectedAccounts = async (userId: string): Promise<ConnectedAccount[]> => {
    try {
        const response = await api.get(`/api/v1/calendar/connected-accounts?user_id=${userId}`);
        return response.data;
    } catch (error) {
        return [];
    }
};

export const syncGoogleCalendar = async (userId: string) => {
    const response = await api.get(`/api/v1/calendar/sync/google?user_id=${userId}`);
    return response.data;
};
