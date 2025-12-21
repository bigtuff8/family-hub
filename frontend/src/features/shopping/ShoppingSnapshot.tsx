/**
 * Shopping list snapshot for dashboard
 * Location: frontend/src/features/shopping/ShoppingSnapshot.tsx
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, Checkbox, Button, Input, Spin, Empty, Badge, message } from 'antd';
import { ShoppingCartOutlined, PlusOutlined, RightOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { shoppingApi } from '../../services/shopping';
import { EditItemModal } from './EditItemModal';
import type { ShoppingList, ShoppingItem } from '../../types/shopping';
import './ShoppingSnapshot.css';

// Category icons
const CATEGORY_ICONS: Record<string, string> = {
  'Produce': '🥬', 'Dairy': '🥛', 'Meat': '🥩', 'Fish': '🐟',
  'Bakery': '🍞', 'Frozen': '🧊', 'Drinks': '🥤', 'Pantry': '🥫',
  'Eggs': '🥚', 'Household': '🧹', 'Baby': '👶', 'Pet': '🐾', 'Other': '📦',
};

export function ShoppingSnapshot() {
  const navigate = useNavigate();
  const [list, setList] = useState<ShoppingList | null>(null);
  const [loading, setLoading] = useState(true);
  const [quickAddValue, setQuickAddValue] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);

  const fetchList = useCallback(async () => {
    try {
      const data = await shoppingApi.getDefaultList();
      setList(data);
    } catch (err) {
      console.error('Failed to load shopping list:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleToggle = async (item: ShoppingItem) => {
    if (!list) return;
    try {
      await shoppingApi.toggleItem(list.id, item.id);
      setList(prev => {
        if (!prev) return null;
        return {
          ...prev,
          items: prev.items.map(i =>
            i.id === item.id ? { ...i, checked: !i.checked } : i
          ),
        };
      });
    } catch (err) {
      message.error('Failed to update item');
    }
  };

  const handleQuickAdd = async () => {
    if (!list || !quickAddValue.trim()) return;
    setAdding(true);
    try {
      // Use force_add=true for quick add to skip duplicate check
      const response = await shoppingApi.addItem(list.id, { name: quickAddValue.trim(), force_add: true });
      setQuickAddValue('');
      fetchList();
      if (response.item) {
        message.success(response.merged ? 'Quantity updated' : 'Item added');
      }
    } catch (err) {
      message.error('Failed to add item');
    } finally {
      setAdding(false);
    }
  };

  const uncheckedItems = list?.items.filter(i => !i.checked) || [];
  const checkedCount = list?.items.filter(i => i.checked).length || 0;

  // Show first 8 unchecked items (more space in new layout)
  const previewItems = uncheckedItems.slice(0, 8);
  const remainingCount = uncheckedItems.length - 8;

  if (loading) {
    return (
      <Card className="shopping-snapshot loading">
        <Spin />
      </Card>
    );
  }

  return (
    <Card className="shopping-snapshot">
      <div className="snapshot-header">
        <div className="header-left">
          <ShoppingCartOutlined className="header-icon" />
          <div>
            <h3 className="header-title">Shopping List</h3>
            <span className="header-subtitle">
              {uncheckedItems.length} items to get
              {checkedCount > 0 && ` • ${checkedCount} done`}
            </span>
          </div>
        </div>
        <Button
          type="link"
          onClick={() => navigate('/shopping')}
          className="view-all-btn"
        >
          View All <RightOutlined />
        </Button>
      </div>

      {/* Quick Add */}
      <div className="quick-add">
        <Input
          placeholder="Quick add item..."
          value={quickAddValue}
          onChange={(e) => setQuickAddValue(e.target.value)}
          onPressEnter={handleQuickAdd}
          suffix={
            <Button
              type="text"
              size="small"
              icon={<PlusOutlined />}
              onClick={handleQuickAdd}
              loading={adding}
              disabled={!quickAddValue.trim()}
            />
          }
        />
      </div>

      {/* Item Preview */}
      <div className="item-list">
        {previewItems.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Shopping list is empty"
            className="empty-state"
          />
        ) : (
          previewItems.map(item => (
            <div key={item.id} className="snapshot-item">
              <Checkbox
                checked={item.checked}
                onChange={() => handleToggle(item)}
              />
              <span className="item-icon">
                {CATEGORY_ICONS[item.category] || CATEGORY_ICONS['Other']}
              </span>
              <span className="item-name" onClick={() => setEditingItem(item)}>
                {item.name}
              </span>
              {item.quantity && Number(item.quantity) > 1 && (
                <Badge
                  count={`x${Number(item.quantity)}`}
                  className="item-qty"
                  style={{ backgroundColor: '#e5e7eb', color: '#6b7280' }}
                />
              )}
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => setEditingItem(item)}
                className="item-edit-btn"
              />
            </div>
          ))
        )}
        {remainingCount > 0 && (
          <div
            className="more-items"
            onClick={() => navigate('/shopping')}
          >
            +{remainingCount} more items →
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
    </Card>
  );
}
