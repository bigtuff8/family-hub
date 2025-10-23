import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export interface RecurrenceRule {
  freq: 'daily' | 'weekly' | 'monthly' | 'annually';
  interval?: number; // For fortnightly (interval=2)
  byday?: string; // For weekly: comma-separated days like "MO,WE,FR"
  until?: string; // ISO date string
  count?: number;
}

export interface EventInstance {
  id: string;
  parentId: string;
  title: string;
  description: string | null;
  location: string | null;
  start_time: string;
  end_time: string | null;
  all_day: boolean;
  user_id: string | null;
  color: string | null;
  tenant_id: string;
  recurrence_rule: string | null;
  is_recurring: boolean;
  instance_date: string; // The specific date of this instance
  created_at: string;
  updated_at: string;
}

/**
 * Generate recurring event instances based on recurrence rule
 */
/**
 * Parse recurrence rule from either JSON or RRULE format
 */
function parseRecurrenceRule(recurrenceRule: string): RecurrenceRule | null {
  if (!recurrenceRule) return null;

  try {
    // Try parsing as JSON first
    return JSON.parse(recurrenceRule);
  } catch (e) {
    // If JSON parsing fails, try parsing as RRULE format
    // RRULE format: "FREQ=WEEKLY;BYDAY=MO;UNTIL=20251231"
    if (recurrenceRule.startsWith('FREQ=')) {
      const parts = recurrenceRule.split(';');
      const rule: any = {};

      parts.forEach(part => {
        const [key, value] = part.split('=');
        if (key === 'FREQ') {
          rule.freq = value.toLowerCase();
        } else if (key === 'UNTIL') {
          // Parse RRULE date format YYYYMMDD
          const year = value.substring(0, 4);
          const month = value.substring(4, 6);
          const day = value.substring(6, 8);
          rule.until = `${year}-${month}-${day}T23:59:59Z`;
        } else if (key === 'COUNT') {
          rule.count = parseInt(value);
        }
      });

      return rule as RecurrenceRule;
    }

    console.error('Could not parse recurrence rule:', recurrenceRule);
    return null;
  }
}

export function generateRecurringInstances(
  baseEvent: any,
  maxInstances: number = 365
): EventInstance[] {
  if (!baseEvent.recurrence_rule) {
    return [];
  }

  try {
    const rule = parseRecurrenceRule(baseEvent.recurrence_rule);
    if (!rule) return [];

    const instances: EventInstance[] = [];

    const startTime = dayjs(baseEvent.start_time).tz('Europe/London');
    const endTime = baseEvent.end_time ? dayjs(baseEvent.end_time).tz('Europe/London') : null;
    const duration = endTime ? endTime.diff(startTime, 'minute') : 0;

    let currentDate = startTime;
    let instanceCount = 0;
    const maxDate = rule.until ? dayjs(rule.until) : dayjs().add(1, 'year');
    const targetCount = rule.count || maxInstances;

    while (instanceCount < targetCount && currentDate.isBefore(maxDate)) {
      // Skip the first instance as it's the original event
      if (instanceCount > 0) {
        const instanceStartTime = currentDate.utc().toISOString();
        const instanceEndTime = endTime
          ? currentDate.add(duration, 'minute').utc().toISOString()
          : null;

        instances.push({
          id: `${baseEvent.id}_${currentDate.format('YYYY-MM-DD')}`,
          parentId: baseEvent.id,
          title: baseEvent.title,
          description: baseEvent.description,
          location: baseEvent.location,
          start_time: instanceStartTime,
          end_time: instanceEndTime,
          all_day: baseEvent.all_day,
          user_id: baseEvent.user_id,
          color: baseEvent.color,
          tenant_id: baseEvent.tenant_id,
          recurrence_rule: baseEvent.recurrence_rule,
          is_recurring: true,
          instance_date: currentDate.format('YYYY-MM-DD'),
          created_at: baseEvent.created_at,
          updated_at: baseEvent.updated_at,
        });
      }

      // Move to next occurrence
      const interval = rule.interval || 1;
      switch (rule.freq) {
        case 'daily':
          currentDate = currentDate.add(interval, 'day');
          break;
        case 'weekly':
          currentDate = currentDate.add(interval, 'week');
          break;
        case 'monthly':
          currentDate = currentDate.add(interval, 'month');
          break;
        case 'annually':
          currentDate = currentDate.add(1, 'year');
          break;
      }

      instanceCount++;
    }

    return instances;
  } catch (error) {
    console.error('Error generating recurring instances:', error);
    return [];
  }
}

/**
 * Check if an event has recurrence
 */
export function isRecurringEvent(event: any): boolean {
  return !!event.recurrence_rule;
}

/**
 * Get human-readable recurrence description
 */
export function getRecurrenceDescription(recurrenceRule: string | null): string {
  if (!recurrenceRule) return '';

  try {
    const rule = parseRecurrenceRule(recurrenceRule);
    if (!rule) return '';

    let description = '';
    switch (rule.freq) {
      case 'daily':
        description = 'Daily';
        break;
      case 'weekly':
        description = 'Weekly';
        break;
      case 'monthly':
        description = 'Monthly';
        break;
    }

    if (rule.until) {
      const untilDate = dayjs(rule.until).format('MMM D, YYYY');
      description += ` until ${untilDate}`;
    } else if (rule.count) {
      description += ` (${rule.count} times)`;
    }

    return description;
  } catch (error) {
    return '';
  }
}
