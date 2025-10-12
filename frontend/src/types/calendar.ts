export interface CalendarEvent {
  id: string;
  tenantId: string;
  userId: string | null;
  title: string;
  description: string | null;
  location: string | null;
  startTime: string; // ISO 8601 string
  endTime: string | null;
  allDay: boolean;
  recurrenceRule: string | null;
  externalCalendarId: string | null;
  externalEventId: string | null;
  color: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEventCreate {
  title: string;
  description?: string | null;
  location?: string | null;
  startTime: string; // ISO 8601 string (UTC)
  endTime?: string | null;
  allDay: boolean;
  userId?: string | null;
  color?: string | null;
  recurrenceRule?: string | null;
}

export interface CalendarEventUpdate {
  title?: string;
  description?: string | null;
  location?: string | null;
  startTime?: string;
  endTime?: string | null;
  allDay?: boolean;
  userId?: string | null;
  color?: string | null;
  recurrenceRule?: string | null;
}

export interface EventFormValues {
  title: string;
  description?: string;
  startDate: any; // Dayjs
  startTime?: any; // Dayjs
  endDate?: any; // Dayjs
  endTime?: any; // Dayjs
  allDay: boolean;
  userId?: string;
  location?: string;
  color: string | any; // Can be ColorPicker object
}