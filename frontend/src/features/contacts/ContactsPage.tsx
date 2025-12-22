/**
 * Main contacts page
 * Location: frontend/src/features/contacts/ContactsPage.tsx
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Typography,
  Button,
  Space,
  Spin,
  Empty,
  message,
  Input,
  List,
  Avatar,
  Tag,
  Dropdown,
  Pagination,
} from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  AppstoreOutlined,
  PlusOutlined,
  SearchOutlined,
  StarFilled,
  StarOutlined,
  PhoneOutlined,
  MailOutlined,
  GiftOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useAuth } from '../auth/AuthContext';
import { contactsApi } from '../../services/contacts';
import { ContactDrawer } from './ContactDrawer';
import type { ContactSummary, Contact, ContactListResponse } from '../../types/contacts';
import './ContactsPage.css';

const { Title } = Typography;
const { Search } = Input;

export function ContactsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // State
  const [contacts, setContacts] = useState<ContactSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [drawerMode, setDrawerMode] = useState<'view' | 'edit' | 'create'>('view');

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      const response: ContactListResponse = await contactsApi.getContacts({
        search: search || undefined,
        favorites_only: favoritesOnly,
        page,
        page_size: pageSize,
      });
      setContacts(response.contacts);
      setTotal(response.total);
    } catch (err) {
      message.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  }, [search, favoritesOnly, page, pageSize]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleToggleFavorite = async (contactId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await contactsApi.toggleFavorite(contactId);
      fetchContacts();
    } catch {
      message.error('Failed to update favorite');
    }
  };

  const handleContactClick = async (contact: ContactSummary) => {
    try {
      const fullContact = await contactsApi.getContact(contact.id);
      setSelectedContact(fullContact);
      setDrawerMode('view');
      setDrawerOpen(true);
    } catch {
      message.error('Failed to load contact details');
    }
  };

  const handleCreateContact = () => {
    setSelectedContact(null);
    setDrawerMode('create');
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedContact(null);
  };

  const handleContactSaved = () => {
    fetchContacts();
    setDrawerOpen(false);
    setSelectedContact(null);
  };

  const handleContactDeleted = () => {
    fetchContacts();
    setDrawerOpen(false);
    setSelectedContact(null);
    message.success('Contact deleted');
  };

  // User menu items
  const userMenuItems = [
    {
      key: 'dashboard',
      icon: <AppstoreOutlined />,
      label: 'Dashboard',
      onClick: () => navigate('/'),
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: logout,
    },
  ];

  // Get initials for avatar
  const getInitials = (contact: ContactSummary): string => {
    const first = contact.first_name?.[0] || '';
    const last = contact.last_name?.[0] || '';
    return (first + last).toUpperCase() || '?';
  };

  // Format birthday
  const formatBirthday = (birthday: string | null): string | null => {
    if (!birthday) return null;
    return dayjs(birthday).format('D MMM');
  };

  // Check if birthday is upcoming (within 7 days)
  const isUpcomingBirthday = (birthday: string | null): boolean => {
    if (!birthday) return false;
    const bday = dayjs(birthday);
    const thisYearBday = bday.year(dayjs().year());
    const daysUntil = thisYearBday.diff(dayjs(), 'day');
    return daysUntil >= 0 && daysUntil <= 7;
  };

  return (
    <div className="contacts-page">
      {/* Header */}
      <header className="contacts-header">
        <div className="header-left">
          <Title
            level={4}
            className="logo-title"
            onClick={() => navigate('/')}
            style={{ cursor: 'pointer', margin: 0 }}
          >
            Family Hub
          </Title>
        </div>

        <div className="header-center">
          <Title level={3} style={{ margin: 0, color: 'white' }}>
            Contacts
          </Title>
        </div>

        <div className="header-right">
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Button
              type="text"
              className="user-button"
              icon={<UserOutlined />}
            >
              {user?.name}
            </Button>
          </Dropdown>
        </div>
      </header>

      {/* Toolbar */}
      <div className="contacts-toolbar">
        <Space>
          <Search
            placeholder="Search contacts..."
            allowClear
            onSearch={handleSearch}
            style={{ width: 250 }}
            prefix={<SearchOutlined />}
          />
          <Button
            type={favoritesOnly ? 'primary' : 'default'}
            icon={<StarFilled />}
            onClick={() => {
              setFavoritesOnly(!favoritesOnly);
              setPage(1);
            }}
          >
            Favorites
          </Button>
        </Space>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreateContact}
        >
          Add Contact
        </Button>
      </div>

      {/* Content */}
      <div className="contacts-content">
        {loading ? (
          <div className="loading-container">
            <Spin size="large" />
          </div>
        ) : contacts.length === 0 ? (
          <Empty
            description={search ? 'No contacts found' : 'No contacts yet'}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            {!search && (
              <Button type="primary" onClick={handleCreateContact}>
                Add Your First Contact
              </Button>
            )}
          </Empty>
        ) : (
          <>
            <List
              className="contacts-list"
              itemLayout="horizontal"
              dataSource={contacts}
              renderItem={(contact) => (
                <List.Item
                  className="contact-item"
                  onClick={() => handleContactClick(contact)}
                  actions={[
                    <Button
                      key="favorite"
                      type="text"
                      icon={contact.is_favorite ? <StarFilled style={{ color: '#fadb14' }} /> : <StarOutlined />}
                      onClick={(e) => handleToggleFavorite(contact.id, e)}
                    />,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      contact.photo_url ? (
                        <Avatar src={contact.photo_url} size={48} />
                      ) : (
                        <Avatar size={48} style={{ backgroundColor: '#1890ff' }}>
                          {getInitials(contact)}
                        </Avatar>
                      )
                    }
                    title={
                      <Space>
                        <span className="contact-name">
                          {contact.display_name || `${contact.first_name} ${contact.last_name || ''}`.trim()}
                        </span>
                        {contact.birthday && isUpcomingBirthday(contact.birthday) && (
                          <Tag color="magenta" icon={<GiftOutlined />}>
                            {formatBirthday(contact.birthday)}
                          </Tag>
                        )}
                      </Space>
                    }
                    description={
                      <Space size="middle" className="contact-details">
                        {contact.primary_phone && (
                          <span>
                            <PhoneOutlined /> {contact.primary_phone}
                          </span>
                        )}
                        {contact.primary_email && (
                          <span>
                            <MailOutlined /> {contact.primary_email}
                          </span>
                        )}
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
            <div className="contacts-pagination">
              <Pagination
                current={page}
                total={total}
                pageSize={pageSize}
                onChange={(p) => setPage(p)}
                showSizeChanger={false}
                showTotal={(t) => `${t} contacts`}
              />
            </div>
          </>
        )}
      </div>

      {/* Contact Drawer */}
      <ContactDrawer
        open={drawerOpen}
        contact={selectedContact}
        mode={drawerMode}
        onClose={handleDrawerClose}
        onSaved={handleContactSaved}
        onDeleted={handleContactDeleted}
        onModeChange={setDrawerMode}
      />
    </div>
  );
}
