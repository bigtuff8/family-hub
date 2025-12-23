import React, { useState } from 'react';
import { List, Tag, Select, Badge, Space, message } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  QuestionCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { EventAttendee, RSVPStatus } from '../../types/calendar';
import { updateAttendeeRSVP } from '../../services/calendar';
import './AttendeeList.css';

interface AttendeeListProps {
  eventId: string;
  attendees: EventAttendee[];
  onUpdate: () => void;
}

const AttendeeList: React.FC<AttendeeListProps> = ({ eventId, attendees, onUpdate }) => {
  const [updatingAttendeeId, setUpdatingAttendeeId] = useState<string | null>(null);

  // Get display name for attendee
  const getDisplayName = (attendee: EventAttendee): string => {
    if (attendee.display_name) return attendee.display_name;
    if (attendee.contact?.display_name) return attendee.contact.display_name;
    if (attendee.contact?.first_name) {
      const lastName = attendee.contact.last_name ? ` ${attendee.contact.last_name}` : '';
      return `${attendee.contact.first_name}${lastName}`;
    }
    if (attendee.email) return attendee.email;
    return 'Unknown Attendee';
  };

  // Get RSVP icon and color
  const getRSVPIcon = (status: RSVPStatus) => {
    switch (status) {
      case 'accepted':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'declined':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'tentative':
        return <QuestionCircleOutlined style={{ color: '#faad14' }} />;
      case 'pending':
      default:
        return <ClockCircleOutlined style={{ color: '#8c8c8c' }} />;
    }
  };

  // Get RSVP status tag
  const getRSVPTag = (status: RSVPStatus) => {
    const config = {
      accepted: { color: 'success', label: 'Coming' },
      declined: { color: 'error', label: 'Declined' },
      tentative: { color: 'warning', label: 'Maybe' },
      pending: { color: 'default', label: 'Pending' },
    };

    const { color, label } = config[status];
    return (
      <Tag color={color} icon={getRSVPIcon(status)}>
        {label}
      </Tag>
    );
  };

  // Handle RSVP status change
  const handleRSVPChange = async (attendeeId: string, newStatus: RSVPStatus) => {
    try {
      setUpdatingAttendeeId(attendeeId);
      await updateAttendeeRSVP(eventId, attendeeId, newStatus);
      message.success('RSVP status updated');
      onUpdate();
    } catch (error) {
      console.error('Failed to update RSVP:', error);
      message.error('Failed to update RSVP status');
    } finally {
      setUpdatingAttendeeId(null);
    }
  };

  // Calculate summary
  const summary = attendees.reduce(
    (acc, attendee) => {
      acc[attendee.rsvp_status] = (acc[attendee.rsvp_status] || 0) + 1;
      return acc;
    },
    {} as Record<RSVPStatus, number>
  );

  const summaryText = [
    summary.accepted && `${summary.accepted} coming`,
    summary.declined && `${summary.declined} declined`,
    summary.tentative && `${summary.tentative} maybe`,
    summary.pending && `${summary.pending} pending`,
  ]
    .filter(Boolean)
    .join(', ');

  if (!attendees || attendees.length === 0) {
    return null;
  }

  return (
    <div className="attendee-list-container">
      <div className="attendee-list-header">
        <h3>Attendees ({attendees.length})</h3>
        {summaryText && <div className="attendee-summary">{summaryText}</div>}
      </div>

      <List
        className="attendee-list"
        dataSource={attendees}
        renderItem={(attendee) => (
          <List.Item className="attendee-item">
            <div className="attendee-info">
              <div className="attendee-avatar">
                <Badge status="default" />
              </div>
              <div className="attendee-details">
                <div className="attendee-name">{getDisplayName(attendee)}</div>
                {attendee.contact?.primary_email && (
                  <div className="attendee-email">{attendee.contact.primary_email}</div>
                )}
              </div>
            </div>
            <div className="attendee-actions">
              <Space size="small">
                {getRSVPTag(attendee.rsvp_status)}
                <Select
                  value={attendee.rsvp_status}
                  onChange={(value) => handleRSVPChange(attendee.id, value)}
                  loading={updatingAttendeeId === attendee.id}
                  disabled={updatingAttendeeId === attendee.id}
                  style={{ width: 120 }}
                  size="small"
                  options={[
                    { value: 'accepted', label: 'Coming' },
                    { value: 'declined', label: 'Declined' },
                    { value: 'tentative', label: 'Maybe' },
                    { value: 'pending', label: 'Pending' },
                  ]}
                />
              </Space>
            </div>
          </List.Item>
        )}
      />
    </div>
  );
};

export default AttendeeList;
