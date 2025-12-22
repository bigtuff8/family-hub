/**
 * Contact create/edit form
 * Location: frontend/src/features/contacts/ContactForm.tsx
 */

import { Form, Input, DatePicker, Button, Space, Divider, Switch } from 'antd';
import dayjs from 'dayjs';
import type { Contact, ContactCreate, ContactUpdate } from '../../types/contacts';

const { TextArea } = Input;

interface ContactFormProps {
  contact: Contact | null;
  onSave: (values: ContactCreate | ContactUpdate) => void;
  onCancel: () => void;
  saving: boolean;
}

export function ContactForm({ contact, onSave, onCancel, saving }: ContactFormProps) {
  const [form] = Form.useForm();

  const initialValues = contact
    ? {
        first_name: contact.first_name,
        last_name: contact.last_name,
        display_name: contact.display_name,
        nickname: contact.nickname,
        primary_email: contact.primary_email,
        primary_phone: contact.primary_phone,
        birthday: contact.birthday ? dayjs(contact.birthday) : null,
        anniversary: contact.anniversary ? dayjs(contact.anniversary) : null,
        address_line1: contact.address_line1,
        address_line2: contact.address_line2,
        city: contact.city,
        county: contact.county,
        postcode: contact.postcode,
        country: contact.country || 'United Kingdom',
        company: contact.company,
        job_title: contact.job_title,
        notes: contact.notes,
        is_favorite: contact.is_favorite,
      }
    : {
        country: 'United Kingdom',
        is_favorite: false,
      };

  const handleSubmit = (values: any) => {
    const data: ContactCreate | ContactUpdate = {
      ...values,
      birthday: values.birthday ? values.birthday.format('YYYY-MM-DD') : null,
      anniversary: values.anniversary ? values.anniversary.format('YYYY-MM-DD') : null,
    };
    onSave(data);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onFinish={handleSubmit}
    >
      {/* Name Section */}
      <Divider orientation="left">Name</Divider>

      <Form.Item
        name="first_name"
        label="First Name"
        rules={[{ required: true, message: 'First name is required' }]}
      >
        <Input placeholder="John" />
      </Form.Item>

      <Form.Item name="last_name" label="Last Name">
        <Input placeholder="Smith" />
      </Form.Item>

      <Form.Item
        name="display_name"
        label="Display Name"
        tooltip="Override how this contact is displayed (e.g., 'Grandma')"
      >
        <Input placeholder="Leave blank to use First + Last name" />
      </Form.Item>

      <Form.Item name="nickname" label="Nickname">
        <Input placeholder="Johnny" />
      </Form.Item>

      {/* Contact Info Section */}
      <Divider orientation="left">Contact Information</Divider>

      <Form.Item
        name="primary_email"
        label="Email"
        rules={[{ type: 'email', message: 'Please enter a valid email' }]}
      >
        <Input placeholder="john@example.com" />
      </Form.Item>

      <Form.Item name="primary_phone" label="Phone">
        <Input placeholder="+44 7700 900000" />
      </Form.Item>

      {/* Important Dates Section */}
      <Divider orientation="left">Important Dates</Divider>

      <Form.Item name="birthday" label="Birthday">
        <DatePicker format="D MMMM YYYY" style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item name="anniversary" label="Anniversary">
        <DatePicker format="D MMMM YYYY" style={{ width: '100%' }} />
      </Form.Item>

      {/* Address Section */}
      <Divider orientation="left">Address</Divider>

      <Form.Item name="address_line1" label="Address Line 1">
        <Input placeholder="123 Main Street" />
      </Form.Item>

      <Form.Item name="address_line2" label="Address Line 2">
        <Input placeholder="Flat 2" />
      </Form.Item>

      <Space style={{ width: '100%' }} size="middle">
        <Form.Item name="city" label="City" style={{ flex: 1 }}>
          <Input placeholder="London" />
        </Form.Item>

        <Form.Item name="county" label="County" style={{ flex: 1 }}>
          <Input placeholder="Greater London" />
        </Form.Item>
      </Space>

      <Space style={{ width: '100%' }} size="middle">
        <Form.Item name="postcode" label="Postcode" style={{ flex: 1 }}>
          <Input placeholder="SW1A 1AA" />
        </Form.Item>

        <Form.Item name="country" label="Country" style={{ flex: 1 }}>
          <Input placeholder="United Kingdom" />
        </Form.Item>
      </Space>

      {/* Work Section */}
      <Divider orientation="left">Work</Divider>

      <Form.Item name="company" label="Company">
        <Input placeholder="Acme Corporation" />
      </Form.Item>

      <Form.Item name="job_title" label="Job Title">
        <Input placeholder="Software Engineer" />
      </Form.Item>

      {/* Notes Section */}
      <Divider orientation="left">Notes</Divider>

      <Form.Item name="notes" label="Notes">
        <TextArea rows={4} placeholder="Any additional notes about this contact..." />
      </Form.Item>

      {/* Options */}
      <Form.Item name="is_favorite" label="Favorite" valuePropName="checked">
        <Switch />
      </Form.Item>

      {/* Actions */}
      <Form.Item style={{ marginTop: 24 }}>
        <Space>
          <Button type="primary" htmlType="submit" loading={saving}>
            {contact ? 'Save Changes' : 'Create Contact'}
          </Button>
          <Button onClick={onCancel}>Cancel</Button>
        </Space>
      </Form.Item>
    </Form>
  );
}
