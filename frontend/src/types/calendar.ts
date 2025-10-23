export interface CalendarEvent {
  id: string;
  tenant_id: string;  // Changed from tenantId
  user_id: string | null;  // Changed from userId
  title: string;
  description: string | null;
  location: string | null;
  start_time: string; // Changed from startTime - ISO 8601 string
  end_time: string | null;  // Changed from endTime
  all_day: boolean;  // Changed from allDay
  recurrence_rule: string | null;  // Changed from recurrenceRule
  external_calendar_id: string | null;  // Changed from externalCalendarId
  external_event_id: string | null;  // Changed from externalEventId
  color: string | null;
  created_at: string;  // Changed from createdAt
  updated_at: string;  // Changed from updatedAt
}

export interface CalendarEventCreate {
  tenant_id: string;  // Added - required by backend
  title: string;
  description?: string | null;
  location?: string | null;
  start_time: string; // Changed from startTime - ISO 8601 string (UTC)
  end_time?: string | null;  // Changed from endTime
  all_day: boolean;  // Changed from allDay
  user_id?: string | null;  // Changed from userId
  color?: string | null;
  recurrence_rule?: string | null;  // Changed from recurrenceRule
}

export interface CalendarEventUpdate {
  title?: string;
  description?: string | null;
  location?: string | null;
  start_time?: string;  // Changed from startTime
  end_time?: string | null;  // Changed from endTime
  all_day?: boolean;  // Changed from allDay
  user_id?: string | null;  // Changed from userId
  color?: string | null;
  recurrence_rule?: string | null;  // Changed from recurrenceRule
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