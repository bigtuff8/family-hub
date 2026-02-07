import { api } from './auth';

export interface KioskStatus {
  running: boolean;
  autostart_enabled: boolean;
  pid: number | null;
}

export interface KioskActionResponse {
  success: boolean;
  message: string;
}

export const adminApi = {
  getKioskStatus: async (): Promise<KioskStatus> => {
    const response = await api.get('/admin/kiosk/status');
    return response.data;
  },

  exitKiosk: async (): Promise<KioskActionResponse> => {
    const response = await api.post('/admin/kiosk/exit');
    return response.data;
  },

  startKiosk: async (): Promise<KioskActionResponse> => {
    const response = await api.post('/admin/kiosk/start');
    return response.data;
  },

  enableKioskAutostart: async (): Promise<KioskActionResponse> => {
    const response = await api.post('/admin/kiosk/autostart/enable');
    return response.data;
  },

  disableKioskAutostart: async (): Promise<KioskActionResponse> => {
    const response = await api.post('/admin/kiosk/autostart/disable');
    return response.data;
  },
};
