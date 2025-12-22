/**
 * Contact create/edit form with validations
 * Location: frontend/src/features/contacts/ContactForm.tsx
 */

import { useState, useEffect } from 'react';
import {
  Form,
  Input,
  DatePicker,
  Button,
  Space,
  Divider,
  Switch,
  Select,
  message,
  Spin,
  Modal,
  AutoComplete,
} from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Contact, ContactCreate, ContactUpdate } from '../../types/contacts';

const { TextArea } = Input;
const { Option } = Select;

// Country codes for phone input
const COUNTRY_CODES = [
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+1', country: 'US/CA', flag: '🇺🇸' },
  { code: '+353', country: 'Ireland', flag: '🇮🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+34', country: 'Spain', flag: '🇪🇸' },
  { code: '+39', country: 'Italy', flag: '🇮🇹' },
  { code: '+31', country: 'Netherlands', flag: '🇳🇱' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+64', country: 'New Zealand', flag: '🇳🇿' },
];

// Anniversary types
const ANNIVERSARY_TYPES = [
  { value: 'wedding', label: 'Wedding Anniversary' },
  { value: 'engagement', label: 'Engagement' },
  { value: 'dating', label: 'Started Dating' },
  { value: 'first_met', label: 'First Met' },
  { value: 'friendship', label: 'Friendship Anniversary' },
  { value: 'other', label: 'Other' },
];

interface ContactFormProps {
  contact: Contact | null;
  onSave: (values: ContactCreate | ContactUpdate) => void;
  onCancel: () => void;
  saving: boolean;
}

// Helper to extract country code from phone number
const extractCountryCode = (phone: string | null): { countryCode: string; number: string } => {
  if (!phone) return { countryCode: '+44', number: '' };

  for (const { code } of COUNTRY_CODES) {
    if (phone.startsWith(code)) {
      return { countryCode: code, number: phone.slice(code.length).trim() };
    }
  }
  // Default to UK if no code found
  return { countryCode: '+44', number: phone.replace(/^\+\d+\s*/, '') };
};

// Phone number validation - digits, spaces, and dashes only
const validatePhoneNumber = (_: any, value: string) => {
  if (!value) return Promise.resolve();
  const cleaned = value.replace(/[\s\-()]/g, '');
  if (!/^\d{6,15}$/.test(cleaned)) {
    return Promise.reject(new Error('Phone must be 6-15 digits'));
  }
  return Promise.resolve();
};

// Birthday validation - cannot be in the future
const validateBirthday = (_: any, value: dayjs.Dayjs | null) => {
  if (!value) return Promise.resolve();
  if (value.isAfter(dayjs())) {
    return Promise.reject(new Error('Birthday cannot be in the future'));
  }
  return Promise.resolve();
};

// Check if anniversary_type is a custom value (not in predefined list)
const isCustomAnniversaryType = (type: string | null | undefined): boolean => {
  if (!type) return false;
  return !ANNIVERSARY_TYPES.some(t => t.value === type);
};

export function ContactForm({ contact, onSave, onCancel, saving }: ContactFormProps) {
  const [form] = Form.useForm();

  // Phone country code state
  const phoneData = extractCountryCode(contact?.primary_phone || null);
  const [countryCode, setCountryCode] = useState(phoneData.countryCode);

  // Address lookup state
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressOptions, setAddressOptions] = useState<{ value: string; label: string; data?: any }[]>([]);
  const [addressSearchValue, setAddressSearchValue] = useState('');

  // Anniversary "Other" state
  const [showCustomAnniversary, setShowCustomAnniversary] = useState(
    isCustomAnniversaryType(contact?.anniversary_type) || contact?.anniversary_type === 'other'
  );
  const [customAnniversaryType, setCustomAnniversaryType] = useState(
    isCustomAnniversaryType(contact?.anniversary_type) ? contact?.anniversary_type || '' : ''
  );

  // Track if form has been modified
  const [formModified, setFormModified] = useState(false);

  // Watch for form changes
  const handleFormChange = () => {
    setFormModified(true);
  };

  const initialValues = contact
    ? {
        first_name: contact.first_name,
        last_name: contact.last_name,
        display_name: contact.display_name,
        nickname: contact.nickname,
        primary_email: contact.primary_email,
        primary_phone: phoneData.number,
        birthday: contact.birthday ? dayjs(contact.birthday) : null,
        anniversary: contact.anniversary ? dayjs(contact.anniversary) : null,
        anniversary_type: isCustomAnniversaryType(contact.anniversary_type) ? 'other' : contact.anniversary_type,
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
    // Combine country code with phone number
    let fullPhone = null;
    if (values.primary_phone) {
      fullPhone = `${countryCode} ${values.primary_phone}`.trim();
    }

    // Handle anniversary type - use custom value if "other" selected
    let anniversaryType = values.anniversary_type;
    if (values.anniversary_type === 'other' && customAnniversaryType) {
      anniversaryType = customAnniversaryType;
    }

    const data: ContactCreate | ContactUpdate = {
      ...values,
      primary_phone: fullPhone,
      birthday: values.birthday ? values.birthday.format('YYYY-MM-DD') : null,
      anniversary: values.anniversary ? values.anniversary.format('YYYY-MM-DD') : null,
      anniversary_type: anniversaryType,
    };
    onSave(data);
  };

  // Handle cancel with unsaved changes warning
  const handleCancel = () => {
    if (formModified) {
      Modal.confirm({
        title: 'Unsaved Changes',
        content: 'You have unsaved changes. Are you sure you want to discard them?',
        okText: 'Discard',
        cancelText: 'Keep Editing',
        okButtonProps: { danger: true },
        onOk: onCancel,
      });
    } else {
      onCancel();
    }
  };

  // Handle anniversary type change
  const handleAnniversaryTypeChange = (value: string) => {
    if (value === 'other') {
      setShowCustomAnniversary(true);
    } else {
      setShowCustomAnniversary(false);
      setCustomAnniversaryType('');
    }
  };

  // Generate fuzzy search variations for compound words
  const generateSearchVariations = (query: string): string[] => {
    const variations = [query];

    // Try inserting spaces before uppercase letters (e.g., "Sandybank" -> "Sandy bank")
    const withSpaces = query.replace(/([a-z])([A-Z])/g, '$1 $2');
    if (withSpaces !== query) {
      variations.push(withSpaces);
    }

    // Try inserting space in the middle of long words (for compound words)
    const words = query.split(' ');
    words.forEach(word => {
      if (word.length >= 8) {
        // Try splitting at common positions (middle-ish)
        const mid = Math.floor(word.length / 2);
        for (let i = mid - 2; i <= mid + 2; i++) {
          if (i > 2 && i < word.length - 2) {
            variations.push(query.replace(word, word.slice(0, i) + ' ' + word.slice(i)));
          }
        }
      }
    });

    return [...new Set(variations)]; // Remove duplicates
  };

  // Address search using getAddress.io autocomplete with fuzzy matching
  const handleAddressSearch = async (query: string) => {
    if (!query || query.length < 3) {
      setAddressOptions([]);
      return;
    }

    const apiKey = import.meta.env.VITE_GETADDRESS_API_KEY;
    if (!apiKey) {
      return;
    }

    setAddressLoading(true);
    try {
      // Try multiple search variations for fuzzy matching
      const variations = generateSearchVariations(query);
      let allSuggestions: any[] = [];

      for (const searchQuery of variations) {
        const response = await fetch(
          `https://api.getAddress.io/autocomplete/${encodeURIComponent(searchQuery)}?api-key=${apiKey}`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.suggestions) {
            allSuggestions = [...allSuggestions, ...data.suggestions];
          }
        }

        // If we found results with the first variation, don't try others
        if (allSuggestions.length > 0) break;
      }

      // Deduplicate by id
      const seen = new Set<string>();
      const uniqueSuggestions = allSuggestions.filter(s => {
        if (seen.has(s.id)) return false;
        seen.add(s.id);
        return true;
      });

      if (uniqueSuggestions.length > 0) {
        const options = uniqueSuggestions.slice(0, 6).map((suggestion: any) => ({
          value: suggestion.id,
          label: suggestion.address,
        }));
        setAddressOptions(options);
      } else {
        setAddressOptions([]);
      }
    } catch (error) {
      console.error('Address search error:', error);
      setAddressOptions([]);
    } finally {
      setAddressLoading(false);
    }
  };

  const handleAddressSelect = async (value: string) => {
    const apiKey = import.meta.env.VITE_GETADDRESS_API_KEY;
    if (!apiKey) return;

    setAddressLoading(true);
    try {
      const response = await fetch(
        `https://api.getAddress.io/get/${encodeURIComponent(value)}?api-key=${apiKey}`
      );

      if (!response.ok) {
        message.error('Failed to get address details');
        return;
      }

      const addr = await response.json();

      form.setFieldsValue({
        address_line1: addr.line_1 || '',
        address_line2: addr.line_2 || '',
        city: addr.town_or_city || '',
        county: addr.county || '',
        postcode: addr.postcode || '',
      });
      setAddressOptions([]);
      setAddressSearchValue('');
      setFormModified(true);
    } catch (error) {
      console.error('Address fetch error:', error);
      message.error('Failed to get address details');
    } finally {
      setAddressLoading(false);
    }
  };

  // Country code selector
  const countryCodeSelector = (
    <Select
      value={countryCode}
      onChange={(val) => {
        setCountryCode(val);
        setFormModified(true);
      }}
      style={{ width: 100 }}
      dropdownMatchSelectWidth={false}
    >
      {COUNTRY_CODES.map(({ code, country, flag }) => (
        <Option key={code} value={code}>
          {flag} {code}
        </Option>
      ))}
    </Select>
  );

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onFinish={handleSubmit}
      onValuesChange={handleFormChange}
    >
      {/* Name Section */}
      <Divider orientation="left">Name</Divider>

      <Form.Item
        name="first_name"
        label="First Name"
        rules={[
          { required: true, message: 'First name is required' },
          { max: 100, message: 'Maximum 100 characters' },
          { pattern: /^[a-zA-Z\s\-']+$/, message: 'Letters, spaces, hyphens and apostrophes only' },
        ]}
      >
        <Input placeholder="John" />
      </Form.Item>

      <Form.Item
        name="last_name"
        label="Last Name"
        rules={[
          { max: 100, message: 'Maximum 100 characters' },
          { pattern: /^[a-zA-Z\s\-']*$/, message: 'Letters, spaces, hyphens and apostrophes only' },
        ]}
      >
        <Input placeholder="Smith" />
      </Form.Item>

      <Form.Item
        name="display_name"
        label="Display Name"
        tooltip="Override how this contact is displayed (e.g., 'Grandma')"
        rules={[{ max: 200, message: 'Maximum 200 characters' }]}
      >
        <Input placeholder="Leave blank to use First + Last name" />
      </Form.Item>

      <Form.Item
        name="nickname"
        label="Nickname"
        rules={[{ max: 100, message: 'Maximum 100 characters' }]}
      >
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

      <Form.Item
        name="primary_phone"
        label="Phone"
        rules={[{ validator: validatePhoneNumber }]}
      >
        <Input
          addonBefore={countryCodeSelector}
          placeholder="7700 900000"
          maxLength={20}
        />
      </Form.Item>

      {/* Important Dates Section */}
      <Divider orientation="left">Important Dates</Divider>

      <Form.Item
        name="birthday"
        label="Birthday"
        rules={[{ validator: validateBirthday }]}
      >
        <DatePicker
          format="D MMMM YYYY"
          style={{ width: '100%' }}
          disabledDate={(current) => current && current > dayjs()}
          placeholder="Select birthday"
        />
      </Form.Item>

      <Space style={{ width: '100%', alignItems: 'flex-start' }} size="middle">
        <Form.Item name="anniversary" label="Anniversary" style={{ flex: 1 }}>
          <DatePicker
            format="D MMMM YYYY"
            style={{ width: '100%' }}
            placeholder="Select date"
          />
        </Form.Item>

        <Form.Item name="anniversary_type" label="Type" style={{ flex: 1 }}>
          <Select
            placeholder="Select type"
            allowClear
            onChange={handleAnniversaryTypeChange}
          >
            {ANNIVERSARY_TYPES.map(({ value, label }) => (
              <Option key={value} value={value}>
                {label}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Space>

      {showCustomAnniversary && (
        <Form.Item label="Custom Anniversary Type">
          <Input
            placeholder="e.g., Business Partnership, Memorial"
            value={customAnniversaryType}
            onChange={(e) => {
              setCustomAnniversaryType(e.target.value);
              setFormModified(true);
            }}
            maxLength={50}
          />
        </Form.Item>
      )}

      {/* Address Section */}
      <Divider orientation="left">Address</Divider>

      <Form.Item
        label="Address Search"
        extra="Start typing your postcode or address to search"
      >
        <AutoComplete
          value={addressSearchValue}
          options={addressOptions}
          onSearch={(value) => {
            setAddressSearchValue(value);
            handleAddressSearch(value);
          }}
          onChange={setAddressSearchValue}
          onSelect={handleAddressSelect}
          placeholder="Type postcode or address to search..."
          style={{ width: '100%' }}
          notFoundContent={addressLoading ? <Spin size="small" /> : null}
        />
      </Form.Item>

      <Form.Item
        name="address_line1"
        label="Address Line 1"
        rules={[{ max: 255, message: 'Maximum 255 characters' }]}
      >
        <Input placeholder="123 Main Street" />
      </Form.Item>

      <Form.Item
        name="address_line2"
        label="Address Line 2"
        rules={[{ max: 255, message: 'Maximum 255 characters' }]}
      >
        <Input placeholder="Flat 2" />
      </Form.Item>

      <Space style={{ width: '100%' }} size="middle">
        <Form.Item
          name="city"
          label="City"
          style={{ flex: 1 }}
          rules={[{ max: 100, message: 'Maximum 100 characters' }]}
        >
          <Input placeholder="London" />
        </Form.Item>

        <Form.Item
          name="county"
          label="County"
          style={{ flex: 1 }}
          rules={[{ max: 100, message: 'Maximum 100 characters' }]}
        >
          <Input placeholder="Greater London" />
        </Form.Item>
      </Space>

      <Space style={{ width: '100%' }} size="middle">
        <Form.Item
          name="postcode"
          label="Postcode"
          style={{ flex: 1 }}
          rules={[{ max: 20, message: 'Maximum 20 characters' }]}
        >
          <Input placeholder="LS26 0ER" />
        </Form.Item>

        <Form.Item
          name="country"
          label="Country"
          style={{ flex: 1 }}
          rules={[{ max: 100, message: 'Maximum 100 characters' }]}
        >
          <Input placeholder="United Kingdom" />
        </Form.Item>
      </Space>

      {/* Work Section */}
      <Divider orientation="left">Work</Divider>

      <Form.Item
        name="company"
        label="Company"
        rules={[{ max: 200, message: 'Maximum 200 characters' }]}
      >
        <Input placeholder="Acme Corporation" />
      </Form.Item>

      <Form.Item
        name="job_title"
        label="Job Title"
        rules={[{ max: 200, message: 'Maximum 200 characters' }]}
      >
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
          <Button onClick={handleCancel}>Cancel</Button>
        </Space>
      </Form.Item>
    </Form>
  );
}
