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
  Segmented,
} from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  AppstoreOutlined,
  CalendarOutlined,
  PlusOutlined,
  SearchOutlined,
  StarFilled,
  StarOutlined,
  PhoneOutlined,
  MailOutlined,
  GiftOutlined,
  TeamOutlined,
  ShoppingCartOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useAuth } from '../auth/AuthContext';
import { contactsApi } from '../../services/contacts';
import { ContactDrawer } from './ContactDrawer';
import { getInitials } from '../../utils/strings';
import type { ContactSummary, Contact, ContactListResponse, ContactView } from '../../types/contacts';
import WeatherWidget from '../../components/WeatherWidget';
import './ContactsPage.css';

const { Title, Text } = Typography;
const { Search } = Input;

export function ContactsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [contacts, setContacts] = useState<ContactSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [contactView, setContactView] = useState<ContactView>('mine');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [drawerMode, setDrawerMode] = useState<'view' | 'edit' | 'create'>('view');

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      let response: ContactListResponse;
      const baseParams = { search: search || undefined, page, page_size: pageSize };

      if (contactView === 'mine') {
        response = await contactsApi.getMyContacts({ ...baseParams, favorites_only: favoritesOnly });
      } else if (contactView === 'family') {
        response = await contactsApi.getFamilyContacts(baseParams);
      } else {
        response = await contactsApi.getContacts({ ...baseParams, favorites_only: favoritesOnly, view: 'all' });
      }
      setContacts(response.contacts);
      setTotal(response.total);
    } catch (err) {
      message.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  }, [search, favoritesOnly, page, pageSize, contactView]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  // Reset contacts when user changes (fixes caching issue on user switch)
  useEffect(() => {
    setContacts([]);
    setTotal(0);
    setPage(1);
  }, [user?.id]);

  const handleSearch = (value: string) => { setSearch(value); setPage(1); };

  const handleViewChange = (value: string | number) => {
    setContactView(value as ContactView);
    setPage(1);
    if (value === 'family') setFavoritesOnly(false);
  };

  const handleToggleFavorite = async (contactId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try { await contactsApi.toggleFavorite(contactId); fetchContacts(); }
    catch { message.error('Failed to update favorite'); }
  };

  const handleContactClick = async (contact: ContactSummary) => {
    try {
      const fullContact = await contactsApi.getContact(contact.id);
      setSelectedContact(fullContact);
      setDrawerMode('view');
      setDrawerOpen(true);
    } catch { message.error('Failed to load contact details'); }
  };

  const handleCreateContact = () => { setSelectedContact(null); setDrawerMode('create'); setDrawerOpen(true); };
  const handleDrawerClose = () => { setDrawerOpen(false); setSelectedContact(null); };
  const handleContactSaved = () => { fetchContacts(); setDrawerOpen(false); setSelectedContact(null); };
  const handleContactDeleted = () => { fetchContacts(); setDrawerOpen(false); setSelectedContact(null); message.success('Contact deleted'); };
  const isOwnContact = (contact: ContactSummary): boolean => contact.owner_user_id === user?.id;

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: user?.name || 'User', disabled: true },
    { type: 'divider' as const },
    { key: 'shopping', icon: <ShoppingCartOutlined />, label: 'Shopping List', onClick: () => navigate('/shopping') },
    { key: 'contacts', icon: <TeamOutlined />, label: 'Contacts', onClick: () => navigate('/contacts') },
    { type: 'divider' as const },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Log out', danger: true, onClick: logout },
  ];

  const getContactInitials = (contact: ContactSummary): string => {
    const first = contact.first_name?.[0] || '';
    const last = contact.last_name?.[0] || '';
    return (first + last).toUpperCase() || '?';
  };

  const userInitials = getInitials(user?.name) || 'U';
  const formatBirthday = (birthday: string | null): string | null => birthday ? dayjs(birthday).format('D MMM') : null;

  const isUpcomingBirthday = (birthday: string | null): boolean => {
    if (!birthday) return false;
    const bday = dayjs(birthday);
    const thisYearBday = bday.year(dayjs().year());
    const daysUntil = thisYearBday.diff(dayjs(), 'day');
    return daysUntil >= 0 && daysUntil <= 7;
  };

  const getViewLabel = (): string => {
    if (contactView === 'mine') return favoritesOnly ? ' (my favorites)' : ' (mine)';
    if (contactView === 'family') return ' (shared by family)';
    return favoritesOnly ? ' (all favorites)' : '';
  };

  return (
    <div className="contacts-page">
      <header className="contacts-header-full">
        <div className="header-left">
          <h1 className="header-logo" onClick={() => navigate('/calendar')} style={{ cursor: 'pointer' }}>Family Hub</h1>
          <div className="header-date">
            <div className="date-main">{dayjs().format('dddd, MMMM D, YYYY')}</div>
            <div className="date-time">{dayjs().format('h:mm A')}</div>
          </div>
          <div className="header-weather"><WeatherWidget variant="full" /></div>
        </div>
        <div style={{ flex: 1 }} />
        <div className="header-center">
          <Space.Compact>
            <Button type="default" icon={<CalendarOutlined />} onClick={() => navigate('/calendar?view=calendar')}>Calendar</Button>
            <Button type="default" icon={<AppstoreOutlined />} onClick={() => navigate('/calendar')}>Dashboard</Button>
          </Space.Compact>
        </div>
        <div className="header-right">
          <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
            <div className="user-avatar" style={{ background: user?.color || '#2dd4bf' }}>{userInitials}</div>
          </Dropdown>
        </div>
      </header>

      <div className="contacts-subheader">
        <div className="subheader-left">
          <TeamOutlined className="subheader-icon" />
          <div>
            <Title level={4} className="subheader-title">Contacts</Title>
            <Text type="secondary">{total} contact{total !== 1 ? 's' : ''}{getViewLabel()}</Text>
          </div>
        </div>
        <Space wrap>
          <Segmented
            value={contactView}
            onChange={handleViewChange}
            options={[
              { label: 'My Contacts', value: 'mine', icon: <UserOutlined /> },
              { label: 'Family', value: 'family', icon: <ShareAltOutlined /> },
              { label: 'All', value: 'all', icon: <TeamOutlined /> },
            ]}
          />
          <Search placeholder="Search contacts..." allowClear onSearch={handleSearch} style={{ width: 200 }} prefix={<SearchOutlined />} />
          {contactView !== 'family' && (
            <Button type={favoritesOnly ? 'primary' : 'default'} icon={<StarFilled />} onClick={() => { setFavoritesOnly(!favoritesOnly); setPage(1); }}>Favorites</Button>
          )}
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateContact}>Add Contact</Button>
        </Space>
      </div>

      <div className="contacts-content">
        {loading ? (
          <div className="loading-container"><Spin size="large" /></div>
        ) : contacts.length === 0 ? (
          <Empty description={search ? 'No contacts found' : contactView === 'family' ? 'No family members have shared contacts yet' : 'No contacts yet'} image={Empty.PRESENTED_IMAGE_SIMPLE}>
            {!search && contactView !== 'family' && <Button type="primary" onClick={handleCreateContact}>Add Your First Contact</Button>}
          </Empty>
        ) : (
          <>
            <List className="contacts-list" itemLayout="horizontal" dataSource={contacts} renderItem={(contact) => (
              <List.Item className="contact-item" onClick={() => handleContactClick(contact)} actions={[isOwnContact(contact) ? <Button key="favorite" type="text" icon={contact.is_favorite ? <StarFilled style={{ color: '#fadb14' }} /> : <StarOutlined />} onClick={(e) => handleToggleFavorite(contact.id, e)} /> : null].filter(Boolean)}>
                <List.Item.Meta
                  avatar={contact.photo_url ? <Avatar src={contact.photo_url} size={48} /> : <Avatar size={48} style={{ backgroundColor: '#1890ff' }}>{getContactInitials(contact)}</Avatar>}
                  title={
                    <Space>
                      <span className="contact-name">{contact.display_name || `${contact.first_name} ${contact.last_name || ''}`.trim()}</span>
                      {!isOwnContact(contact) && contact.owner && <Tag color="blue" icon={<ShareAltOutlined />}>Shared by {contact.owner.name.split(' ')[0]}</Tag>}
                      {isOwnContact(contact) && contact.is_published_to_family && <Tag color="green" icon={<TeamOutlined />}>Shared</Tag>}
                      {contact.birthday && isUpcomingBirthday(contact.birthday) && <Tag color="magenta" icon={<GiftOutlined />}>{formatBirthday(contact.birthday)}</Tag>}
                    </Space>
                  }
                  description={
                    <Space size="middle" className="contact-details">
                      {contact.primary_phone && <span><PhoneOutlined /> {contact.primary_phone}</span>}
                      {contact.primary_email && <span><MailOutlined /> {contact.primary_email}</span>}
                    </Space>
                  }
                />
              </List.Item>
            )} />
            <div className="contacts-pagination">
              <Pagination current={page} total={total} pageSize={pageSize} onChange={(p) => setPage(p)} showSizeChanger={false} showTotal={(t) => `${t} contacts`} />
            </div>
          </>
        )}
      </div>

      <ContactDrawer open={drawerOpen} contact={selectedContact} mode={drawerMode} onClose={handleDrawerClose} onSaved={handleContactSaved} onDeleted={handleContactDeleted} onModeChange={setDrawerMode} />
    </div>
  );
}
