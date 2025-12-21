/**
 * Collapsible category group component
 * Location: frontend/src/features/shopping/CategoryGroup.tsx
 */

import { useState } from 'react';
import { Typography, Badge } from 'antd';
import { DownOutlined, RightOutlined } from '@ant-design/icons';
import { ShoppingItem } from './ShoppingItem';
import type { ShoppingItem as ShoppingItemType, ShoppingCategory } from '../../types/shopping';
import './CategoryGroup.css';

const { Text } = Typography;

// Category icons/emojis
const CATEGORY_ICONS: Record<string, string> = {
  'Produce': '🥬',
  'Dairy': '🥛',
  'Meat': '🥩',
  'Fish': '🐟',
  'Bakery': '🍞',
  'Frozen': '🧊',
  'Drinks': '🥤',
  'Pantry': '🥫',
  'Eggs': '🥚',
  'Household': '🧹',
  'Baby': '👶',
  'Pet': '🐾',
  'Other': '📦',
};

interface Props {
  category: string;
  categoryInfo?: ShoppingCategory;
  items: ShoppingItemType[];
  onToggle: (id: string) => void;
  onEdit: (item: ShoppingItemType) => void;
  onDelete: (id: string) => void;
  defaultExpanded?: boolean;
}

export function CategoryGroup({ category, categoryInfo, items, onToggle, onEdit, onDelete, defaultExpanded = true }: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const uncheckedCount = items.filter(item => !item.checked).length;
  // Use dynamic category info if available, fall back to hardcoded defaults
  const icon = categoryInfo?.icon || CATEGORY_ICONS[category] || CATEGORY_ICONS['Other'];
  const color = categoryInfo?.color;

  return (
    <div className="category-group">
      <div
        className="category-header"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="category-icon">{icon}</span>
        <Text strong className="category-name">{category}</Text>
        <Badge
          count={uncheckedCount}
          showZero
          className="category-badge"
          style={{ backgroundColor: uncheckedCount > 0 ? (color || '#1890ff') : '#d9d9d9' }}
        />
        <span className="category-expand-icon">
          {expanded ? <DownOutlined /> : <RightOutlined />}
        </span>
      </div>
      {expanded && (
        <div className="category-items">
          {items.map(item => (
            <ShoppingItem
              key={item.id}
              item={item}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
