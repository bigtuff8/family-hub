/**
 * Contact detail/edit drawer
 * Location: frontend/src/features/contacts/ContactDrawer.tsx
 */

import { useState } from 'react';
import {
  Drawer,
  Button,
  Space,
  Descriptions,
  Typography,
  Tag,
  Divider,
  Popconfirm,
  message,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  PhoneOutlined,
  MailOutlined,
  HomeOutlined,
  GiftOutlined,
  BuildOutlined,
  StarFilled,
  StarOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { contactsApi } from '../../services/contacts';
import { ContactForm } from './ContactForm';
import type { Contact, ContactCreate, ContactUpdate } from '../../types/contacts';

const { Title, Text, Paragraph } = Typography;

interface ContactDrawerProps {
  open: boolean;
  contact: Contact | null;
  mode: 'view' | 'edit' | 'create';
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
  onModeChange: (mode: 'view' | 'edit' | 'create') => void;
}

export function ContactDrawer({
  open,
  contact,
  mode,
  onClose,
  onSaved,
  onDeleted,
  onModeChange,
}: ContactDrawerProps) {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async (values: ContactCreate | ContactUpdate) => {
    try {
      setSaving(true);
      if (mode === 'create') {
        await contactsApi.createContact(values as ContactCreate);
        message.success('Contact created');
      } else if (contact) {
        await contactsApi.updateContact(contact.id, values as ContactUpdate);
        message.success('Contact updated');
      }
      onSaved();
    } catch {
      message.error('Failed to save contact');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!contact) return;
    try {
      setDeleting(true);
      await contactsApi.deleteContact(contact.id);
      onDeleted();
    } catch {
      message.error('Failed to delete contact');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!contact) return;
    try {
      await contactsApi.toggleFavorite(contact.id);
      onSaved();
    } catch {
      message.error('Failed to update favorite');
    }
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return '-';
    return dayjs(dateStr).format('D MMMM YYYY');
  };

  const getDisplayName = (): string => {
    if (!contact) return '';
    return contact.display_name || `${contact.first_name} ${contact.last_name || ''}`.trim();
  };

  const getFullAddress = (): string | null => {
    if (!contact) return null;
    const parts = [
      contact.address_line1,
      contact.address_line2,
      contact.city,
      contact.county,
      contact.postcode,
      contact.country,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : null;
  };

  const renderViewMode = () => {
    if (!contact) return null;

    return (
      <div className="contact-view">
        {/* Header */}
        <div className="contact-view-header">
          <Title level={3}>{getDisplayName()}</Title>
          {contact.nickname && (
            <Text type="secondary">"{contact.nickname}"</Text>
          )}
          <Space style={{ marginTop: 8 }}>
            <Button
              icon={contact.is_favorite ? <StarFilled style={{ color: '#fadb14' }} /> : <StarOutlined />}
              onClick={handleToggleFavorite}
            >
              {contact.is_favorite ? 'Favorited' : 'Add to Favorites'}
            </Button>
          </Space>
        </div>

        <Divider />

        {/* Contact Info */}
        <div className="contact-section">
          <Title level={5}>Contact Information</Title>

          {/* Phones */}
          {(contact.primary_phone || contact.phones.length > 0) && (
            <div className="contact-info-group">
              <PhoneOutlined style={{ marginRight: 8 }} />
              {contact.primary_phone && (
                <div>
                  <a href={`tel:${contact.primary_phone}`}>{contact.primary_phone}</a>
                  <Tag style={{ marginLeft: 8 }}>Primary</Tag>
                </div>
              )}
              {contact.phones.map((phone) => (
                <div key={phone.id}>
                  <a href={`tel:${phone.phone_number}`}>{phone.phone_number}</a>
                  <Tag style={{ marginLeft: 8 }}>{phone.phone_type}</Tag>
                </div>
              ))}
            </div>
          )}

          {/* Emails */}
          {(contact.primary_email || contact.emails.length > 0) && (
            <div className="contact-info-group">
              <MailOutlined style={{ marginRight: 8 }} />
              {contact.primary_email && (
                <div>
                  <a href={`mailto:${contact.primary_email}`}>{contact.primary_email}</a>
                  <Tag style={{ marginLeft: 8 }}>Primary</Tag>
                </div>
              )}
              {contact.emails.map((email) => (
                <div key={email.id}>
                  <a href={`mailto:${email.email_address}`}>{email.email_address}</a>
                  <Tag style={{ marginLeft: 8 }}>{email.email_type}</Tag>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Address */}
        {getFullAddress() && (
          <>
            <Divider />
            <div className="contact-section">
              <Title level={5}>
                <HomeOutlined /> Address
              </Title>
              <Paragraph>{getFullAddress()}</Paragraph>
            </div>
          </>
        )}

        {/* Important Dates */}
        {(contact.birthday || contact.anniversary) && (
          <>
            <Divider />
            <div className="contact-section">
              <Title level={5}>
                <GiftOutlined /> Important Dates
              </Title>
              <Descriptions column={1} size="small">
                {contact.birthday && (
                  <Descriptions.Item label="Birthday">
                    {formatDate(contact.birthday)}
                  </Descriptions.Item>
                )}
                {contact.anniversary && (
                  <Descriptions.Item label="Anniversary">
                    {formatDate(contact.anniversary)}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </div>
          </>
        )}

        {/* Work */}
        {(contact.company || contact.job_title) && (
          <>
            <Divider />
            <div className="contact-section">
              <Title level={5}>
                <BuildOutlined /> Work
              </Title>
              {contact.job_title && <Text>{contact.job_title}</Text>}
              {contact.job_title && contact.company && <Text> at </Text>}
              {contact.company && <Text strong>{contact.company}</Text>}
            </div>
          </>
        )}

        {/* Notes */}
        {contact.notes && (
          <>
            <Divider />
            <div className="contact-section">
              <Title level={5}>Notes</Title>
              <Paragraph>{contact.notes}</Paragraph>
            </div>
          </>
        )}

        {/* Sync Info */}
        {contact.external_source && contact.external_source !== 'manual' && (
          <>
            <Divider />
            <div className="contact-section">
              <Text type="secondary">
                Synced from {contact.external_source}
                {contact.last_synced_at && ` on ${formatDate(contact.last_synced_at)}`}
              </Text>
            </div>
          </>
        )}
      </div>
    );
  };

  const drawerTitle = mode === 'create' ? 'New Contact' : mode === 'edit' ? 'Edit Contact' : getDisplayName();

  return (
    <Drawer
      title={drawerTitle}
      placement="right"
      width={500}
      open={open}
      onClose={onClose}
      extra={
        mode === 'view' && contact ? (
          <Space>
            <Button icon={<EditOutlined />} onClick={() => onModeChange('edit')}>
              Edit
            </Button>
            <Popconfirm
              title="Delete this contact?"
              description="This action cannot be undone."
              onConfirm={handleDelete}
              okText="Delete"
              okType="danger"
            >
              <Button danger icon={<DeleteOutlined />} loading={deleting}>
                Delete
              </Button>
            </Popconfirm>
          </Space>
        ) : null
      }
    >
      {mode === 'view' ? (
        renderViewMode()
      ) : (
        <ContactForm
          contact={mode === 'edit' ? contact : null}
          onSave={handleSave}
          onCancel={() => {
            if (contact) {
              onModeChange('view');
            } else {
              onClose();
            }
          }}
          saving={saving}
        />
      )}
    </Drawer>
  );
}
