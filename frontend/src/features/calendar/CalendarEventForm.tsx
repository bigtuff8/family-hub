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
import { DeleteOutlined, SaveOutlined, CloseOutlined, EnvironmentOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { CalendarEvent, CalendarEventCreate, CalendarEventUpdate } from '../../types/calendar';
import { createEvent, updateEvent, deleteEvent } from '../../services/calendar';

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

  // Search addresses using Nominatim (OpenStreetMap)
  const searchAddress = async (query: string) => {
    if (!query || query.length < 3) {
      setAddressOptions([]);
      return;
    }

    setAddressLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `format=json&` +
        `q=${encodeURIComponent(query)}&` +
        `countrycodes=gb&` + // UK only
        `limit=5&` +
        `addressdetails=1`
      );
      
      const data = await response.json();
      
      const options: AddressOption[] = data.map((item: any) => ({
        value: item.display_name,
        label: item.display_name,
        displayName: item.display_name,
      }));
      
      setAddressOptions(options);
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

  useEffect(() => {
    if (visible) {
      if (mode === 'edit' && event) {
        // Populate form with event data
        const startTime = dayjs(event.startTime).tz('Europe/London');
        const endTime = event.endTime ? dayjs(event.endTime).tz('Europe/London') : null;

        setAllDay(event.allDay || false);
        setSelectedLead(event.userId || undefined);
        
        // TODO: Load attendees and external guests from event data when backend supports it
        setExternalGuests([]);

        form.setFieldsValue({
          title: event.title,
          description: event.description || '',
          startDate: startTime,
          startTime: event.allDay ? null : startTime,
          endDate: endTime,
          endTime: event.allDay || !endTime ? null : endTime,
          allDay: event.allDay || false,
          eventLead: event.userId || undefined,
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
        });
        setAllDay(false);
        setSelectedLead(undefined);
        setExternalGuests([]);
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

      // Convert to UTC for storage (subtract 1 hour for BST)
      const startTimeUTC = startTime.subtract(1, 'hour').toISOString();
      const endTimeUTC = endTime ? endTime.subtract(1, 'hour').toISOString() : null;

      const eventData = {
        title: values.title,
        description: values.description || null,
        startTime: startTimeUTC,
        endTime: endTimeUTC,
        allDay: values.allDay,
        userId: values.eventLead || null,
        location: values.location || null,
        color: typeof values.color === 'string' ? values.color : values.color.toHexString(),
        // TODO: Send attendees and externalGuests when backend supports it
        // attendees: values.attendees || [],
        // externalGuests: externalGuests,
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
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>

          {!allDay && (
            <Form.Item
              label="Start Time"
              name="startTime"
              rules={[{ required: !allDay, message: 'Required' }]}
              style={{ flex: 1 }}
            >
              <TimePicker style={{ width: '100%' }} format="HH:mm" minuteStep={15} />
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
          label="External Guests (Phase 1.5: Contact sync integration)"
          extra="Press Enter or comma to add email addresses"
        >
          <div>
            <Input
              placeholder="Add guest email addresses"
              value={guestInputValue}
              onChange={handleGuestInputChange}
              onKeyDown={handleGuestInputKeyDown}
              size="large"
              disabled
              suffix={
                <span style={{ fontSize: 12, color: '#999' }}>
                  Coming in Phase 1.5
                </span>
              }
            />
            {externalGuests.length > 0 && (
              <div style={{ marginTop: 8 }}>
                {externalGuests.map(email => (
                  <Tag
                    key={email}
                    closable
                    onClose={() => handleRemoveGuest(email)}
                    style={{ marginBottom: 4 }}
                  >
                    {email}
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