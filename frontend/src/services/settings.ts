import api from './api';

export interface ConnectedAccount {
    id: string;
    provider: string; // 'google', 'outlook', 'icloud'
    email_address: string;
    display_name: string;
    is_default: boolean;
    receive_invites: boolean;
}

export const getConnectedAccounts = async (): Promise<ConnectedAccount[]> => {
    // TODO: Add backend endpoint for this. For now we just return empty or mock if needed.
    // We need to implement GET /api/v1/auth/accounts in backend first? 
    // Actually, let's assume we will add that backend endpoint soon.
    // For now, the implementation plan didn't specify listing accounts, just connecting.
    // So we might skip listing for this exact step, but let's prepare the service.
    try {
        const response = await api.get('/api/v1/auth/accounts');
        return response.data;
    } catch (error) {
        return [];
    }
};
