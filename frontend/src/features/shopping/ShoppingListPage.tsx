/**
 * Main shopping list page
 * Location: frontend/src/features/shopping/ShoppingListPage.tsx
 */

import { useState, useEffect, useCallback } from 'react';
import { Typography, Button, Space, Spin, Empty, message, Badge, Dropdown, Modal } from 'antd';
import {
  CheckCircleOutlined,
  TeamOutlined,
  ReloadOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  LogoutOutlined,
  CalendarOutlined,
  AppstoreOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useAuth } from '../auth/AuthContext';
import { shoppingApi } from '../../services/shopping';
import { AddItemForm } from './AddItemForm';
import { CategoryGroup } from './CategoryGroup';
import { EditItemModal } from './EditItemModal';
import { CategoryManagerDrawer } from './CategoryManagerDrawer';
import { getInitials } from '../../utils/strings';
import type { ShoppingList, ShoppingItem, ShoppingCategory, RecentlyCompletedDuplicate } from '../../types/shopping';
import './ShoppingListPage.css';
import WeatherWidget from '../../components/WeatherWidget';

const { Title, Text } = Typography;

export function ShoppingListPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [list, setList] = useState<ShoppingList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [categories, setCategories] = useState<ShoppingCategory[]>([]);
  const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false);
  // Duplicate detection state
  const [pendingItem, setPendingItem] = useState<{ name: string; quantity?: number; unit?: string } | null>(null);
  const [duplicateInfo, setDuplicateInfo] = useState<RecentlyCompletedDuplicate | null>(null);

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await shoppingApi.getDefaultList();
      setList(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load shopping list');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await shoppingApi.getCategoriesFull();
      setCategories(data);
    } catch {
      // Silent fail - categories will fall back to defaults
    }
  }, []);

  useEffect(() => {
    fetchList();
    fetchCategories();
  }, [fetchList, fetchCategories]);

  const handleAddItem = async (name: string, quantity?: number, unit?: string, forceAdd = false) => {
    if (!list) return;

    try {
      const response = await shoppingApi.addItem(list.id, { name, quantity, unit, force_add: forceAdd });

      // Handle duplicate detection
      if (response.duplicate_detected && response.recently_completed) {
        setPendingItem({ name, quantity, unit });
        setDuplicateInfo(response.recently_completed);
        return;
      }

      if (response.item) {
        if (response.merged) {
          message.info(`Updated ${name} quantity`);
        } else {
          message.success(`Added ${name}`);
        }
      }

      fetchList();
    } catch (err) {
      message.error('Failed to add item');
    }
  };

  const handleConfirmDuplicate = async () => {
    if (!pendingItem) return;

    // Re-add with force_add=true
    await handleAddItem(pendingItem.name, pendingItem.quantity, pendingItem.unit, true);

    // Clear duplicate state
    setPendingItem(null);
    setDuplicateInfo(null);
  };

  const handleCancelDuplicate = () => {
    setPendingItem(null);
    setDuplicateInfo(null);
  };

  const handleToggle = async (itemId: string) => {
    if (!list) return;

    try {
      await shoppingApi.toggleItem(list.id, itemId);
      setList(prev => {
        if (!prev) return null;
        return {
          ...prev,
          items: prev.items.map(item =>
            item.id === itemId
              ? { ...item, checked: !item.checked, checked_at: item.checked ? null : new Date().toISOString() }
              : item
          ),
        };
      });
    } catch (err) {
      message.error('Failed to update item');
    }
  };

  const handleEdit = (item: ShoppingItem) => {
    setEditingItem(item);
  };

  const handleDelete = async (itemId: string) => {
    if (!list) return;

    try {
      await shoppingApi.deleteItem(list.id, itemId);
      setList(prev => {
        if (!prev) return null;
        return {
          ...prev,
          items: prev.items.filter(item => item.id !== itemId),
        };
      });
      message.success('Item deleted');
    } catch (err) {
      message.error('Failed to delete item');
    }
  };

  const handleCompleteShop = async () => {
    if (!list) return;

    const uncheckedCount = list.items.filter(i => !i.checked).length;
    if (uncheckedCount === 0) {
      message.info('All items already checked off');
      return;
    }

    try {
      const result = await shoppingApi.completeShop(list.id);
      message.success(`Marked ${result.items_cleared} item${result.items_cleared !== 1 ? 's' : ''} as complete`);
      fetchList();
    } catch (err) {
      message.error('Failed to complete shop');
    }
  };

  // Build category lookup map
  const categoryMap = categories.reduce<Record<string, ShoppingCategory>>((acc, cat) => {
    acc[cat.name] = cat;
    return acc;
  }, {});

  // Group items by category
  const itemsByCategory = list?.items.reduce<Record<string, ShoppingItem[]>>((acc, item) => {
    const category = item.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {}) || {};

  // Sort categories: unchecked items first, then alphabetically
  const sortedCategories = Object.keys(itemsByCategory).sort((a, b) => {
    const aUnchecked = itemsByCategory[a].some(i => !i.checked);
    const bUnchecked = itemsByCategory[b].some(i => !i.checked);
    if (aUnchecked && !bUnchecked) return -1;
    if (!aUnchecked && bUnchecked) return 1;
    return a.localeCompare(b);
  });

  const totalItems = list?.items.length || 0;
  const checkedItems = list?.items.filter(i => i.checked).length || 0;
  const uncheckedItems = totalItems - checkedItems;

  // Get user initials
  const userInitials = getInitials(user?.name) || 'U';

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: user?.name || 'User',
      disabled: true,
    },
    { type: 'divider' as const },
    {
      key: 'contacts',
      icon: <TeamOutlined />,
      label: 'Contacts',
      onClick: () => navigate('/contacts'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Log out',
      danger: true,
      onClick: logout,
    },
  ];

  if (loading && !list) {
    return (
      <div className="shopping-page loading">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="shopping-page error">
        <Empty
          description={error}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button onClick={fetchList}>Try Again</Button>
        </Empty>
      </div>
    );
  }

  return (
    <div className="shopping-page">
      {/* Header - matches CalendarTablet style exactly */}
      <header className="shopping-header-full">
        <div className="header-left">
          <h1 className="header-logo" onClick={() => navigate('/calendar')} style={{ cursor: 'pointer' }}>Family Hub</h1>
          <div className="header-date">
            <div className="date-main">{dayjs().format('dddd, MMMM D, YYYY')}</div>
            <div className="date-time">{dayjs().format('h:mm A')}</div>
          </div>
          {/* Weather Widget */}
          <div className="header-weather">
            <WeatherWidget variant="full" />
          </div>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Calendar/Dashboard toggle */}
        <div className="header-center">
          <Space.Compact>
            <Button
              type="default"
              icon={<CalendarOutlined />}
              onClick={() => navigate('/calendar?view=calendar')}
            >
              Calendar
            </Button>
            <Button
              type="default"
              icon={<AppstoreOutlined />}
              onClick={() => navigate('/calendar')}
            >
              Dashboard
            </Button>
          </Space.Compact>
        </div>

        <div className="header-right">
          <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
            <div
              className="user-avatar"
              style={{ background: user?.color || '#2dd4bf' }}
            >
              {userInitials}
            </div>
          </Dropdown>
        </div>
      </header>

      {/* Sub-header with list info */}
      <div className="shopping-subheader">
        <div className="subheader-left">
          <ShoppingCartOutlined className="subheader-icon" />
          <div>
            <Title level={4} className="subheader-title">{list?.name || 'Shopping List'}</Title>
            <Text type="secondary">
              {totalItems - checkedItems} to get{checkedItems > 0 && ` / ${checkedItems} done`}
            </Text>
          </div>
        </div>
        <Space>
          <Button
            icon={<SettingOutlined />}
            onClick={() => setCategoryDrawerOpen(true)}
            title="Manage Categories"
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchList}
            loading={loading}
          />
          <Badge count={uncheckedItems} showZero={false}>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={handleCompleteShop}
              disabled={uncheckedItems === 0}
            >
              Complete Shop
            </Button>
          </Badge>
        </Space>
      </div>

      <div className="shopping-content">
        <AddItemForm onAdd={handleAddItem} loading={loading} />

        {totalItems === 0 ? (
          <Empty
            description="Your shopping list is empty"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <div className="category-list">
            {sortedCategories.map(category => (
              <CategoryGroup
                key={category}
                category={category}
                categoryInfo={categoryMap[category]}
                items={itemsByCategory[category]}
                onToggle={handleToggle}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {list && (
        <EditItemModal
          item={editingItem}
          listId={list.id}
          visible={!!editingItem}
          onClose={() => setEditingItem(null)}
          onSuccess={fetchList}
        />
      )}

      {/* Category Manager Drawer */}
      <CategoryManagerDrawer
        open={categoryDrawerOpen}
        onClose={() => setCategoryDrawerOpen(false)}
        onCategoriesChanged={fetchCategories}
      />

      {/* Duplicate Detection Modal */}
      <Modal
        title="Recently Completed Item"
        open={!!duplicateInfo}
        onOk={handleConfirmDuplicate}
        onCancel={handleCancelDuplicate}
        okText="Yes, add again"
        cancelText="Cancel"
      >
        {duplicateInfo && (
          <div>
            <p>
              You completed <strong>"{duplicateInfo.name}"</strong>{' '}
              {duplicateInfo.hours_ago < 1
                ? 'less than an hour ago'
                : `${Math.round(duplicateInfo.hours_ago)} hour${Math.round(duplicateInfo.hours_ago) !== 1 ? 's' : ''} ago`}.
            </p>
            <p>Are you sure you want to add it again?</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
