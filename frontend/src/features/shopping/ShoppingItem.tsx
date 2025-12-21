/**
 * Shopping item row component
 * Location: frontend/src/features/shopping/ShoppingItem.tsx
 */

import { Checkbox, Typography, Button, Space, Popconfirm } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import type { ShoppingItem as ShoppingItemType } from '../../types/shopping';
import './ShoppingItem.css';

const { Text } = Typography;

interface Props {
  item: ShoppingItemType;
  onToggle: (id: string) => void;
  onEdit: (item: ShoppingItemType) => void;
  onDelete: (id: string) => void;
}

export function ShoppingItem({ item, onToggle, onEdit, onDelete }: Props) {
  const formatQuantity = () => {
    if (!item.quantity) return '';
    const qty = Number(item.quantity);
    const formattedQty = qty % 1 === 0 ? qty.toString() : qty.toFixed(1);
    return item.unit ? `${formattedQty} ${item.unit}` : `x${formattedQty}`;
  };

  return (
    <div className={`shopping-item ${item.checked ? 'checked' : ''}`}>
      <Checkbox
        checked={item.checked}
        onChange={() => onToggle(item.id)}
        className="item-checkbox"
      />
      <div className="item-details" onClick={() => onEdit(item)}>
        <Text
          className="item-name"
          delete={item.checked}
          type={item.checked ? 'secondary' : undefined}
        >
          {item.name}
        </Text>
        <Text type="secondary" className="item-quantity">
          {formatQuantity()}
        </Text>
      </div>
      <Space className="item-actions">
        {item.added_by && (
          <Text type="secondary" className="item-added-by">
            {item.added_by.name}
          </Text>
        )}
        <Button
          type="text"
          size="small"
          icon={<EditOutlined />}
          onClick={() => onEdit(item)}
          className="edit-btn"
        />
        <Popconfirm
          title="Delete item?"
          onConfirm={() => onDelete(item.id)}
          okText="Yes"
          cancelText="No"
        >
          <Button
            type="text"
            size="small"
            icon={<DeleteOutlined />}
            className="delete-btn"
          />
        </Popconfirm>
      </Space>
    </div>
  );
}
