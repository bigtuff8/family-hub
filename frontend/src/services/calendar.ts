import api from './api';
import { CalendarEvent, CalendarEventCreate, CalendarEventUpdate } from '../types/calendar';

export const getEvents = async (
  startDate?: string,
  endDate?: string
): Promise<CalendarEvent[]> => {
  const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);

  const response = await api.get(`/api/v1/calendar/events?${params.toString()}`);
  return response.data;
};

export const getEvent = async (id: string): Promise<CalendarEvent> => {
  const response = await api.get(`/api/v1/calendar/events/${id}`);
  return response.data;
};

export const createEvent = async (event: CalendarEventCreate): Promise<CalendarEvent> => {
  const response = await api.post('/api/v1/calendar/events', event);
  return response.data;
};

export const updateEvent = async (
  id: string,
  event: CalendarEventUpdate
): Promise<CalendarEvent> => {
  const response = await api.put(`/api/v1/calendar/events/${id}`, event);
  return response.data;
};

export const deleteEvent = async (id: string): Promise<void> => {
  await api.delete(`/api/v1/calendar/events/${id}`);
};