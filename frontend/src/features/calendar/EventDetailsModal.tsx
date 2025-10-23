import React, { useState } from 'react';
import { Modal, Button, Space, Divider, Tag, Popconfirm, message } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  CloseOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  UserOutlined,
  CalendarOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { CalendarEvent } from './Calendar';
import { deleteEvent } from '../../services/calendar';
import { getRecurrenceDescription, isRecurringEvent } from '../../utils/recurrence';
import CalendarEventForm from './CalendarEventForm';
import './EventDetailsModal.css';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Europe/London');

interface EventDetailsModalProps {
  event: CalendarEvent | null;
  visible: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

// Family member mapping
const FAMILY_MEMBERS: { [key: string]: { name: string; color: string } } = {
  '10000000-0000-0000-0000-000000000001': { name: 'James', color: '#e30613' },
  '10000000-0000-0000-0000-000000000002': { name: 'Nicola', color: '#fb7185' },
  '10000000-0000-0000-0000-000000000003': { name: 'Tommy', color: '#00B140' },
  '10000000-0000-0000-0000-000000000004': { name: 'Harry', color: '#1D428A' },
};

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  event,
  visible,
  onClose,
  onRefresh,
}) => {
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!event) return null;

  // Format date and time
  const formatDateTime = (event: CalendarEvent): string => {
    if (event.all_day) {
      const date = dayjs(event.start_time).tz('Europe/London');
      return date.format('dddd, MMMM D, YYYY');
    }

    const start = dayjs(event.start_time).tz('Europe/London');
    const end = event.end_time ? dayjs(event.end_time).tz('Europe/London') : null;

    const dateStr = start.format('dddd, MMMM D, YYYY');
    const timeStr = end
      ? `${start.format('HH:mm')} - ${end.format('HH:mm')}`
      : start.format('HH:mm');

    return `${dateStr} at ${timeStr}`;
  };

  // Get event color
  const getEventColor = (): string => {
    if (event.color) {
      return event.color;
    }
    if (event.user_id && FAMILY_MEMBERS[event.user_id]) {
      return FAMILY_MEMBERS[event.user_id].color;
    }
    return '#2dd4bf';
  };

  // Get family member name
  const getFamilyMemberName = (): string | null => {
    if (event.user_id && FAMILY_MEMBERS[event.user_id]) {
      return FAMILY_MEMBERS[event.user_id].name;
    }
    return null;
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteEvent(event.id);
      message.success('Event deleted successfully');
      onClose();
      onRefresh();
    } catch (error) {
      console.error('Failed to delete event:', error);
      message.error('Failed to delete event');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle edit
  const handleEdit = () => {
    setIsEditModalVisible(true);
  };

  // Handle edit success
  const handleEditSuccess = () => {
    setIsEditModalVisible(false);
    onRefresh();
  };

  const eventColor = getEventColor();
  const familyMemberName = getFamilyMemberName();

  return (
    <>
      <Modal
        open={visible}
        onCancel={onClose}
        footer={null}
        width={600}
        className="event-details-modal"
      >
        <div className="event-details-content">
          {/* Event header with color indicator */}
          <div className="event-header" style={{ borderLeftColor: eventColor }}>
            <h2 className="event-title">{event.title}</h2>
            {event.all_day && (
              <Tag color="blue" className="allday-tag">
                All Day
              </Tag>
            )}
            {isRecurringEvent(event) && (
              <Tag color="cyan" className="recurring-tag" icon={<SyncOutlined />}>
                Recurring
              </Tag>
            )}
          </div>

          <Divider style={{ margin: '16px 0' }} />

          {/* Event details */}
          <div className="event-details-list">
            {/* Date and Time */}
            <div className="detail-item">
              <div className="detail-icon">
                <CalendarOutlined />
              </div>
              <div className="detail-content">
                <div className="detail-label">Date & Time</div>
                <div className="detail-value">{formatDateTime(event)}</div>
              </div>
            </div>

            {/* Family Member */}
            {familyMemberName && (
              <div className="detail-item">
                <div className="detail-icon">
                  <UserOutlined />
                </div>
                <div className="detail-content">
                  <div className="detail-label">Event Lead</div>
                  <div className="detail-value">
                    <Tag color={eventColor}>{familyMemberName}</Tag>
                  </div>
                </div>
              </div>
            )}

            {/* Location */}
            {event.location && (
              <div className="detail-item">
                <div className="detail-icon">
                  <EnvironmentOutlined />
                </div>
                <div className="detail-content">
                  <div className="detail-label">Location</div>
                  <div className="detail-value">{event.location}</div>
                </div>
              </div>
            )}

            {/* Description */}
            {event.description && (
              <div className="detail-item">
                <div className="detail-icon">
                  <ClockCircleOutlined />
                </div>
                <div className="detail-content">
                  <div className="detail-label">Description</div>
                  <div className="detail-value description-text">
                    {event.description}
                  </div>
                </div>
              </div>
            )}

            {/* Recurrence Info */}
            {isRecurringEvent(event) && (
              <div className="detail-item">
                <div className="detail-icon">
                  <SyncOutlined />
                </div>
                <div className="detail-content">
                  <div className="detail-label">Repeats</div>
                  <div className="detail-value">
                    {getRecurrenceDescription(event.recurrence_rule)}
                  </div>
                </div>
              </div>
            )}
          </div>

          <Divider style={{ margin: '24px 0' }} />

          {/* Action buttons */}
          <div className="event-actions">
            <Space>
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={handleEdit}
              >
                Edit
              </Button>
              <Popconfirm
                title="Delete Event"
                description="Are you sure you want to delete this event?"
                onConfirm={handleDelete}
                okText="Yes"
                cancelText="No"
                okButtonProps={{ danger: true }}
              >
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  loading={isDeleting}
                >
                  Delete
                </Button>
              </Popconfirm>
              <Button icon={<CloseOutlined />} onClick={onClose}>
                Close
              </Button>
            </Space>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <CalendarEventForm
        mode="edit"
        event={event}
        visible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
        onSuccess={handleEditSuccess}
      />
    </>
  );
};

export default EventDetailsModal;
