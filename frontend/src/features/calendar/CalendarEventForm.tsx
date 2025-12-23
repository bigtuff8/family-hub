import React, { useEffect, useState } from 'react';
import {
  Modal,
  Form,
  Input,
  DatePicker,
  TimePicker,
  Select,
  Switch,
  Button,
  ColorPicker,
  Space,
  Divider,
  message,
  Popconfirm,
  AutoComplete,
  Tag,
} from 'antd';
import { DeleteOutlined, SaveOutlined, CloseOutlined, EnvironmentOutlined, TeamOutlined, UserAddOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { CalendarEvent, CalendarEventCreate, CalendarEventUpdate, EventAttendeeCreate } from '../../types/calendar';
import { createEvent, updateEvent, deleteEvent } from '../../services/calendar';
import { contactsApi } from '../../services/contacts';
import type { ContactSummary } from '../../types/contacts';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Europe/London');

const { TextArea } = Input;
const { Option } = Select;

interface CalendarEventFormProps {
  mode: 'create' | 'edit';
  event?: CalendarEvent;
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultDate?: Dayjs;
}

interface User {
  id: string;
  name: string;
  color: string;
}

interface AddressOption {
  value: string;
  label: string;
  displayName: string;
}

// Real Brown Family members
const FAMILY_MEMBERS: User[] = [
  { id: '10000000-0000-0000-0000-000000000001', name: 'James', color: '#e30613' },   // Liverpool red
  { id: '10000000-0000-0000-0000-000000000002', name: 'Nicola', color: '#fb7185' },  // Pink
  { id: '10000000-0000-0000-0000-000000000003', name: 'Tommy', color: '#00B140' },   // Liverpool green
  { id: '10000000-0000-0000-0000-000000000004', name: 'Harry', color: '#1D428A' },   // Leeds blue
];

// ============================================
// 🔴 TECHNICAL DEBT - Phase 1.5 Required
// ============================================
// TODO(Phase 1.5): Replace hard-coded tenant_id with authentication context
// This is temporarily hard-coded for Phase 1 development only.
// 
// Future implementation:
//   const { currentTenant } = useAuth();
//   const eventData = {
//     tenant_id: currentTenant.id, // Dynamic from logged-in user
//     ...
//   };
// 
// Related: docs/technical-debt.md #TD-001
// ============================================
const BROWN_FAMILY_TENANT_ID = '10000000-0000-0000-0000-000000000000';

// Helper to get next 30-minute increment
const getNext30MinIncrement = (date?: Dayjs) => {
  const base = date || dayjs();
  const minutes = base.minute();
  const roundedMinutes = Math.ceil(minutes / 30) * 30;
  
  if (roundedMinutes === 60) {
    return base.add(1, 'hour').minute(0).second(0);
  }
  
  return base.minute(roundedMinutes).second(0);
};

// Debounce helper
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const CalendarEventForm: React.FC<CalendarEventFormProps> = ({
  mode,
  event,
  visible,
  onClose,
  onSuccess,
  defaultDate,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [allDay, setAllDay] = useState(false);
  const [selectedLead, setSelectedLead] = useState<string | undefined>();
  const [addressOptions, setAddressOptions] = useState<AddressOption[]>([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [externalGuests, setExternalGuests] = useState<string[]>([]);
  const [guestInputValue, setGuestInputValue] = useState('');
  const [contactSearchResults, setContactSearchResults] = useState<ContactSummary[]>([]);
  const [contactSearchLoading, setContactSearchLoading] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<ContactSummary[]>([]);
  const [selectedAttendees, setSelectedAttendees] = useState<EventAttendeeCreate[]>([]);
  const [contactSearchValue, setContactSearchValue] = useState('');
  const [recurrenceType, setRecurrenceType] = useState<string>('none');
  const [recurrenceDays, setRecurrenceDays] = useState<string[]>([]);
  const [recurrenceEndType, setRecurrenceEndType] = useState<string>('never');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Dayjs | null>(null);
  const [recurrenceCount, setRecurrenceCount] = useState<number>(10);

  // Helper function to update end date/time based on start date/time
  const updateEndDateTime = () => {
    const startDate = form.getFieldValue('startDate');
    const startTime = form.getFieldValue('startTime');
    
    if (startDate && startTime) {
      // Combine start date with start time
      const newStartDateTime = startDate
        .hour(startTime.hour())
        .minute(startTime.minute())
        .second(0);
      
      // Calculate end time (+30 minutes)
      const newEndDateTime = newStartDateTime.add(30, 'minutes');
      
      // Update both end date and end time
      form.setFieldsValue({ 
        endDate: newEndDateTime,
        endTime: newEndDateTime 
      });
    }
  };

  // Generate fuzzy search variations for compound words
  const generateSearchVariations = (query: string): string[] => {
    const variations = [query];
    const withSpaces = query.replace(/([a-z])([A-Z])/g, '$1 $2');
    if (withSpaces !== query) variations.push(withSpaces);
    query.split(' ').forEach(word => {
      if (word.length >= 8) {
        const mid = Math.floor(word.length / 2);
        for (let i = mid - 2; i <= mid + 2; i++) {
          if (i > 2 && i < word.length - 2) {
            variations.push(query.replace(word, word.slice(0, i) + ' ' + word.slice(i)));
          }
        }
      }
    });
    return [...new Set(variations)];
  };

  // Search addresses using getAddress.io autocomplete with fuzzy matching
  const searchAddress = async (query: string) => {
    if (!query || query.length < 3) { setAddressOptions([]); return; }
    const apiKey = import.meta.env.VITE_GETADDRESS_API_KEY;
    if (!apiKey) { setAddressOptions([]); return; }
    setAddressLoading(true);
    try {
      const variations = generateSearchVariations(query);
      let allSuggestions: any[] = [];
      for (const sq of variations) {
        const resp = await fetch(`https://api.getAddress.io/autocomplete/${encodeURIComponent(sq)}?api-key=${apiKey}`);
        if (resp.ok) {
          const data = await resp.json();
          if (data.suggestions) allSuggestions = [...allSuggestions, ...data.suggestions];
        }
        if (allSuggestions.length > 0) break;
      }
      const seen = new Set<string>();
      const unique = allSuggestions.filter(s => { if (seen.has(s.address)) return false; seen.add(s.address); return true; });
      setAddressOptions(unique.slice(0, 6).map((s: any) => ({ value: s.address, label: s.address, displayName: s.address })));
    } catch (error) {
      console.error('Address search error:', error);
      setAddressOptions([]);
    } finally {
      setAddressLoading(false);
    }
  };

  // Debounced address search
  const debouncedAddressSearch = debounce(searchAddress, 500);

  const handleAddressSearch = (value: string) => {
    debouncedAddressSearch(value);
  };

  // Handle external guest email input
  const handleGuestInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGuestInputValue(e.target.value);
  };

  const handleGuestInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const email = guestInputValue.trim();
      
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (email && emailRegex.test(email)) {
        if (!externalGuests.includes(email)) {
          setExternalGuests([...externalGuests, email]);
          setGuestInputValue('');
        } else {
          message.warning('This email is already added');
        }
      } else if (email) {
        message.error('Please enter a valid email address');
      }
    }
  };

  const handleRemoveGuest = (email: string) => {
    setExternalGuests(externalGuests.filter(g => g !== email));
  };

  // Search contacts
  const searchContacts = async (query: string) => {
    if (!query || query.length < 2) {
      setContactSearchResults([]);
      return;
    }

    setContactSearchLoading(true);
    try {
      const response = await contactsApi.getContacts({ search: query, page_size: 10 });
      // Filter out already selected contacts
      const selectedIds = selectedContacts.map(c => c.id);
      setContactSearchResults(response.contacts.filter(c => !selectedIds.includes(c.id)));
    } catch (error) {
      console.error('Contact search error:', error);
      setContactSearchResults([]);
    } finally {
      setContactSearchLoading(false);
    }
  };

  const debouncedContactSearch = debounce(searchContacts, 300);

  const handleContactSearch = (value: string) => {
    debouncedContactSearch(value);
  };

  const handleSelectContact = (contactId: string) => {
    const contact = contactSearchResults.find(c => c.id === contactId);
    if (contact) {
      setSelectedContacts([...selectedContacts, contact]);
      // Create an EventAttendeeCreate for this contact
      const newAttendee: EventAttendeeCreate = {
        contact_id: contact.id,
        email: contact.primary_email || undefined,
        display_name: contact.display_name || `${contact.first_name} ${contact.last_name || ''}`.trim(),
      };
      setSelectedAttendees([...selectedAttendees, newAttendee]);
      setContactSearchResults([]);
      setContactSearchValue('');
    }
  };

  const handleRemoveContact = (contactId: string) => {
    setSelectedContacts(selectedContacts.filter(c => c.id !== contactId));
    // Also remove from selectedAttendees
    setSelectedAttendees(selectedAttendees.filter(a => a.contact_id !== contactId));
  };

  const handleAddEmailGuest = () => {
    const email = guestInputValue.trim();
    if (email && email.includes('@')) {
      // Check not already added
      if (!selectedAttendees.some(a => a.email === email)) {
        const newAttendee: EventAttendeeCreate = {
          email: email,
          display_name: email,
        };
        setSelectedAttendees([...selectedAttendees, newAttendee]);
      }
      setGuestInputValue('');
    }
  };

  const handleRemoveAttendee = (attendee: EventAttendeeCreate) => {
    if (attendee.contact_id) {
      setSelectedContacts(selectedContacts.filter(c => c.id !== attendee.contact_id));
    }
    setSelectedAttendees(selectedAttendees.filter(a =>
      !(a.contact_id === attendee.contact_id && a.email === attendee.email)
    ));
  };

  useEffect(() => {
    if (visible) {
      if (mode === 'edit' && event) {
        // Populate form with event data
        const startTime = dayjs(event.start_time).tz('Europe/London');
        const endTime = event.end_time ? dayjs(event.end_time).tz('Europe/London') : null;

        setAllDay(event.all_day || false);
        setSelectedLead(event.user_id || undefined);
        
        // Load attendees from event data
        if (event.attendees && event.attendees.length > 0) {
          const loadedAttendees: EventAttendeeCreate[] = event.attendees.map(a => ({
            contact_id: a.contact_id || undefined,
            email: a.email || undefined,
            display_name: a.display_name || undefined,
          }));
          setSelectedAttendees(loadedAttendees);
        } else {
          setSelectedAttendees([]);
        }
        setSelectedContacts([]);

        form.setFieldsValue({
          title: event.title,
          description: event.description || '',
          startDate: startTime,
          startTime: event.all_day ? null : startTime,
          endDate: endTime,
          endTime: event.all_day || !endTime ? null : endTime,
          allDay: event.all_day || false,
          eventLead: event.user_id || undefined,
          attendees: [], // TODO: Load from event when backend supports
          location: event.location || '',
          color: event.color || '#1890ff',
        });
      } else {
        // Create mode - set defaults with next 30-min increment and 30-min duration
        const start = getNext30MinIncrement(defaultDate);
        const end = start.add(30, 'minutes');

        form.setFieldsValue({
          title: '',
          description: '',
          startDate: start,
          startTime: start,
          endDate: end,
          endTime: end,
          allDay: false,
          eventLead: undefined,
          attendees: [],
          location: '',
          color: '#1890ff',
          recurrenceType: 'none',
          recurrenceEndType: 'never',
          recurrenceEndDate: null,
          recurrenceCount: 10,
        });
        setAllDay(false);
        setSelectedLead(undefined);
        setExternalGuests([]);
        setSelectedContacts([]);
        setSelectedAttendees([]);
        setRecurrenceType('none');
        setRecurrenceEndType('never');
        setRecurrenceEndDate(null);
        setRecurrenceCount(10);
      }
    }
  }, [visible, mode, event, defaultDate, form]);

  const handleAllDayChange = (checked: boolean) => {
    setAllDay(checked);
    if (checked) {
      form.setFieldsValue({
        startTime: null,
        endTime: null,
      });
    }
  };

  const handleEventLeadChange = (leadId: string) => {
    setSelectedLead(leadId);
    
    // Set color to lead's color
    const leader = FAMILY_MEMBERS.find(m => m.id === leadId);
    if (leader) {
      form.setFieldsValue({ color: leader.color });
    }
    
    // Remove lead from attendees if selected
    const currentAttendees = form.getFieldValue('attendees') || [];
    if (currentAttendees.includes(leadId)) {
      form.setFieldsValue({
        attendees: currentAttendees.filter((id: string) => id !== leadId)
      });
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Construct start and end times
      let startTime: Dayjs;
      let endTime: Dayjs | null = null;

      if (values.allDay) {
        // All-day event: use date only, set time to start of day
        startTime = dayjs(values.startDate).startOf('day');
        endTime = values.endDate ? dayjs(values.endDate).endOf('day') : startTime.endOf('day');
      } else {
        // Timed event: combine date and time
        startTime = dayjs(values.startDate)
          .hour(dayjs(values.startTime).hour())
          .minute(dayjs(values.startTime).minute())
          .second(0);

        if (values.endTime && values.endDate) {
          endTime = dayjs(values.endDate)
            .hour(dayjs(values.endTime).hour())
            .minute(dayjs(values.endTime).minute())
            .second(0);
        } else {
          endTime = startTime.add(30, 'minutes');
        }
      }

      // Validate end time is after start time
      if (endTime && endTime.isBefore(startTime)) {
        message.error('End time must be after start time');
        setLoading(false);
        return;
      }

      // Convert to UTC for storage - dayjs automatically handles BST/GMT conversion
      const startTimeUTC = startTime.utc().toISOString();
      const endTimeUTC = endTime ? endTime.utc().toISOString() : null;

      // Build recurrence rule if applicable
      let recurrenceRule = null;
      if (values.recurrenceType && values.recurrenceType !== 'none') {
        const rule: any = {
          freq: values.recurrenceType === 'fortnightly' ? 'weekly' : values.recurrenceType,
        };

        // For fortnightly, set interval to 2
        if (values.recurrenceType === 'fortnightly') {
          rule.interval = 2;
        }

        // Add day of week for weekly/fortnightly recurrence
        if ((values.recurrenceType === 'weekly' || values.recurrenceType === 'fortnightly') && values.recurrenceDays && values.recurrenceDays.length > 0) {
          rule.byday = values.recurrenceDays.join(',');
        }

        if (values.recurrenceEndType === 'on_date' && values.recurrenceEndDate) {
          rule.until = dayjs(values.recurrenceEndDate).endOf('day').utc().toISOString();
        } else if (values.recurrenceEndType === 'after_count' && values.recurrenceCount) {
          rule.count = values.recurrenceCount;
        }

        recurrenceRule = JSON.stringify(rule);
      }

      const eventData = {
        tenant_id: BROWN_FAMILY_TENANT_ID,
        title: values.title,
        description: values.description || null,
        start_time: startTimeUTC,
        end_time: endTimeUTC,
        all_day: values.allDay,
        user_id: values.eventLead || null,
        location: values.location || null,
        color: typeof values.color === 'string' ? values.color : values.color.toHexString(),
        recurrence_rule: recurrenceRule,
        attendees: selectedAttendees,
      };

      if (mode === 'create') {
        await createEvent(eventData as CalendarEventCreate);
        message.success('Event created successfully');
      } else if (mode === 'edit' && event) {
        await updateEvent(event.id, eventData as CalendarEventUpdate);
        message.success('Event updated successfully');
      }

      form.resetFields();
      setExternalGuests([]);
      setSelectedAttendees([]);
      setSelectedContacts([]);
      onSuccess();
      onClose();
    } catch (error: any) {
      if (error.errorFields) {
        // Form validation error
        message.error('Please check all required fields');
      } else {
        message.error(`Failed to ${mode} event: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!event) return;

    try {
      setDeleting(true);
      await deleteEvent(event.id);
      message.success('Event deleted successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      message.error(`Failed to delete event: ${error.message}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setExternalGuests([]);
    setSelectedAttendees([]);
    setSelectedContacts([]);
    onClose();
  };

  // Get available attendees (exclude event lead)
  const availableAttendees = FAMILY_MEMBERS.filter(
    member => member.id !== selectedLead
  );

  return (
    <Modal
      title={mode === 'create' ? 'Create Event' : 'Edit Event'}
      open={visible}
      onCancel={handleCancel}
      width={700}
      footer={[
        mode === 'edit' && (
          <Popconfirm
            key="delete"
            title="Delete Event"
            description="Are you sure you want to delete this event?"
            onConfirm={handleDelete}
            okText="Delete"
            okButtonProps={{ danger: true }}
            cancelText="Cancel"
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              loading={deleting}
              style={{ float: 'left' }}
            >
              Delete
            </Button>
          </Popconfirm>
        ),
        <Button key="cancel" onClick={handleCancel} icon={<CloseOutlined />}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleSubmit}
          loading={loading}
          icon={<SaveOutlined />}
        >
          {mode === 'create' ? 'Create' : 'Save'}
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark="optional"
      >
        <Form.Item
          label="Title"
          name="title"
          rules={[{ required: true, message: 'Please enter event title' }]}
        >
          <Input placeholder="Event title" size="large" />
        </Form.Item>

        <Form.Item label="Description" name="description">
          <TextArea
            rows={3}
            placeholder="Add description (optional)"
            maxLength={500}
            showCount
          />
        </Form.Item>

        <Form.Item label="All Day Event" name="allDay" valuePropName="checked">
          <Switch onChange={handleAllDayChange} />
        </Form.Item>

        <Space direction="horizontal" size="middle" style={{ width: '100%' }}>
          <Form.Item
            label="Start Date"
            name="startDate"
            rules={[{ required: true, message: 'Required' }]}
            style={{ flex: 1 }}
          >
            <DatePicker 
              style={{ width: '100%' }} 
              format="DD/MM/YYYY"
              onChange={() => updateEndDateTime()}
            />
          </Form.Item>

          {!allDay && (
            <Form.Item
              label="Start Time"
              name="startTime"
              rules={[{ required: !allDay, message: 'Required' }]}
              style={{ flex: 1 }}
            >
              <TimePicker 
                style={{ width: '100%' }} 
                format="HH:mm" 
                minuteStep={15}
                onChange={() => updateEndDateTime()}
              />
            </Form.Item>
          )}
        </Space>

        <Space direction="horizontal" size="middle" style={{ width: '100%' }}>
          <Form.Item
            label="End Date"
            name="endDate"
            style={{ flex: 1 }}
          >
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>

          {!allDay && (
            <Form.Item
              label="End Time"
              name="endTime"
              style={{ flex: 1 }}
            >
              <TimePicker style={{ width: '100%' }} format="HH:mm" minuteStep={15} />
            </Form.Item>
          )}
        </Space>

        <Divider>Recurrence</Divider>

        <Form.Item label="Repeat" name="recurrenceType">
          <Select
            size="large"
            value={recurrenceType}
            onChange={setRecurrenceType}
            options={[
              { label: 'Does not repeat', value: 'none' },
              { label: 'Daily', value: 'daily' },
              { label: 'Weekly', value: 'weekly' },
              { label: 'Fortnightly (every 2 weeks)', value: 'fortnightly' },
              { label: 'Monthly', value: 'monthly' },
              { label: 'Annually', value: 'annually' },
            ]}
          />
        </Form.Item>

        {recurrenceType === 'weekly' && (
          <Form.Item label="Repeat on" name="recurrenceDays">
            <Select
              mode="multiple"
              size="large"
              placeholder="Select days of the week"
              value={recurrenceDays}
              onChange={setRecurrenceDays}
              options={[
                { label: 'Monday', value: 'MO' },
                { label: 'Tuesday', value: 'TU' },
                { label: 'Wednesday', value: 'WE' },
                { label: 'Thursday', value: 'TH' },
                { label: 'Friday', value: 'FR' },
                { label: 'Saturday', value: 'SA' },
                { label: 'Sunday', value: 'SU' },
              ]}
            />
          </Form.Item>
        )}

        {recurrenceType !== 'none' && (
          <>
            <Form.Item label="Ends" name="recurrenceEndType">
              <Select
                size="large"
                value={recurrenceEndType}
                onChange={setRecurrenceEndType}
                options={[
                  { label: 'Never', value: 'never' },
                  { label: 'On date', value: 'on_date' },
                  { label: 'After occurrences', value: 'after_count' },
                ]}
              />
            </Form.Item>

            {recurrenceEndType === 'on_date' && (
              <Form.Item label="End Date" name="recurrenceEndDate">
                <DatePicker
                  style={{ width: '100%' }}
                  format="DD/MM/YYYY"
                  value={recurrenceEndDate}
                  onChange={setRecurrenceEndDate}
                />
              </Form.Item>
            )}

            {recurrenceEndType === 'after_count' && (
              <Form.Item label="Number of Occurrences" name="recurrenceCount">
                <Input
                  type="number"
                  min={1}
                  max={365}
                  value={recurrenceCount}
                  onChange={(e) => setRecurrenceCount(parseInt(e.target.value) || 10)}
                  size="large"
                />
              </Form.Item>
            )}
          </>
        )}

        <Divider>People</Divider>

        <Form.Item label="Event Lead" name="eventLead">
          <Select
            placeholder="Select event lead"
            allowClear
            size="large"
            onChange={handleEventLeadChange}
          >
            {FAMILY_MEMBERS.map(member => (
              <Option key={member.id} value={member.id}>
                <Space>
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: member.color,
                      display: 'inline-block',
                    }}
                  />
                  {member.name}
                </Space>
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item 
          label="Family Attendees" 
          name="attendees"
          extra={selectedLead ? "Event lead is automatically excluded" : undefined}
        >
          <Select
            mode="multiple"
            placeholder="Select additional family members"
            size="large"
            disabled={!selectedLead && availableAttendees.length === 0}
          >
            {availableAttendees.map(member => (
              <Option key={member.id} value={member.id}>
                <Space>
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: member.color,
                      display: 'inline-block',
                    }}
                  />
                  {member.name}
                </Space>
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="External Guests"
          extra="Search for contacts or add email addresses"
        >
          <div>
            {/* Contact search */}
            <AutoComplete
              value={contactSearchValue}
              options={contactSearchResults.map(c => ({
                value: c.id,
                label: `${c.first_name} ${c.last_name || ''} ${c.primary_email ? `(${c.primary_email})` : ''}`.trim(),
              }))}
              onSearch={(value) => {
                setContactSearchValue(value);
                handleContactSearch(value);
              }}
              onSelect={handleSelectContact}
              placeholder="Search contacts by name..."
              style={{ width: '100%', marginBottom: 8 }}
              size="large"
              notFoundContent={contactSearchLoading ? 'Searching...' : contactSearchValue.length >= 2 ? 'No contacts found' : 'Type to search'}
            />

            {/* Email input */}
            <Space.Compact style={{ width: '100%', marginBottom: 8 }}>
              <Input
                placeholder="Or add email address..."
                value={guestInputValue}
                onChange={(e) => setGuestInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddEmailGuest();
                  }
                }}
                size="large"
              />
              <Button size="large" onClick={handleAddEmailGuest} icon={<UserAddOutlined />}>
                Add
              </Button>
            </Space.Compact>

            {/* Selected attendees */}
            {selectedAttendees.length > 0 && (
              <div style={{ marginTop: 8 }}>
                {selectedAttendees.map((attendee, index) => (
                  <Tag
                    key={`${attendee.contact_id || attendee.email}-${index}`}
                    closable
                    onClose={() => handleRemoveAttendee(attendee)}
                    style={{ marginBottom: 4 }}
                    color={attendee.contact_id ? 'blue' : 'default'}
                  >
                    {attendee.display_name}
                    {attendee.email && attendee.contact_id && ` (${attendee.email})`}
                  </Tag>
                ))}
              </div>
            )}
          </div>
        </Form.Item>

        <Divider>Details</Divider>

        <Form.Item 
          label="Location" 
          name="location"
          extra="Search by address or postcode"
        >
          <AutoComplete
            options={addressOptions}
            onSearch={handleAddressSearch}
            placeholder="Search for address or postcode..."
            size="large"
            notFoundContent={addressLoading ? 'Searching...' : 'No results found'}
            prefix={<EnvironmentOutlined style={{ color: '#999' }} />}
          />
        </Form.Item>

        <Form.Item label="Color" name="color">
          <ColorPicker
            showText
            presets={[
              {
                label: 'Family Colors',
                colors: [
                  '#e30613', // James - Liverpool red
                  '#fb7185', // Nicola - Pink
                  '#00B140', // Tommy - Liverpool green
                  '#1D428A', // Harry - Leeds blue
                  '#ffffff', // Family - White
                  '#2dd4bf', // Brand teal
                ],
              },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CalendarEventForm;