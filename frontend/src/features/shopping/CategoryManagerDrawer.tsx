/**
 * Drawer for managing shopping categories
 * Location: frontend/src/features/shopping/CategoryManagerDrawer.tsx
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Drawer, Button, List, Popconfirm, message, Spin, Empty } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import { shoppingApi } from '../../services/shopping';
import type { ShoppingCategory } from '../../types/shopping';
import { CategoryEditModal } from './CategoryEditModal';

interface CategoryManagerDrawerProps {
  open: boolean;
  onClose: () => void;
  onCategoriesChanged?: () => void;
}

export const CategoryManagerDrawer: React.FC<CategoryManagerDrawerProps> = ({
  open,
  onClose,
  onCategoriesChanged,
}) => {
  const [categories, setCategories] = useState<ShoppingCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ShoppingCategory | null>(null);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await shoppingApi.getCategoriesFull();
      setCategories(data);
    } catch {
      message.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadCategories();
    }
  }, [open, loadCategories]);

  const handleEdit = (category: ShoppingCategory) => {
    setEditingCategory(category);
    setEditModalOpen(true);
  };

  const handleCreate = () => {
    setEditingCategory(null);
    setEditModalOpen(true);
  };

  const handleDelete = async (category: ShoppingCategory) => {
    try {
      await shoppingApi.deleteCategory(category.id);
      message.success(`Category "${category.name}" deleted`);
      await loadCategories();
      onCategoriesChanged?.();
    } catch {
      message.error('Failed to delete category');
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const newOrder = [...categories];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    const ids = newOrder.map((c) => c.id);

    try {
      const updated = await shoppingApi.reorderCategories(ids);
      setCategories(updated);
      onCategoriesChanged?.();
    } catch {
      message.error('Failed to reorder categories');
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === categories.length - 1) return;
    const newOrder = [...categories];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    const ids = newOrder.map((c) => c.id);

    try {
      const updated = await shoppingApi.reorderCategories(ids);
      setCategories(updated);
      onCategoriesChanged?.();
    } catch {
      message.error('Failed to reorder categories');
    }
  };

  const handleCategorySaved = (category: ShoppingCategory) => {
    // Update local state
    const existing = categories.findIndex((c) => c.id === category.id);
    if (existing >= 0) {
      const updated = [...categories];
      updated[existing] = category;
      setCategories(updated);
    } else {
      setCategories([...categories, category]);
    }
    onCategoriesChanged?.();
  };

  return (
    <>
      <Drawer
        title="Manage Categories"
        open={open}
        onClose={onClose}
        width={400}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            Add Category
          </Button>
        }
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" />
          </div>
        ) : categories.length === 0 ? (
          <Empty description="No categories found" />
        ) : (
          <List
            dataSource={categories}
            renderItem={(category, index) => (
              <List.Item
                style={{
                  padding: '12px 0',
                  borderBottom: index < categories.length - 1 ? '1px solid #f0f0f0' : 'none',
                }}
                actions={[
                  <Button
                    key="up"
                    type="text"
                    size="small"
                    icon={<ArrowUpOutlined />}
                    disabled={index === 0}
                    onClick={() => handleMoveUp(index)}
                  />,
                  <Button
                    key="down"
                    type="text"
                    size="small"
                    icon={<ArrowDownOutlined />}
                    disabled={index === categories.length - 1}
                    onClick={() => handleMoveDown(index)}
                  />,
                  <Button
                    key="edit"
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => handleEdit(category)}
                  />,
                  category.name !== 'Other' ? (
                    <Popconfirm
                      key="delete"
                      title="Delete category?"
                      description={`Items in "${category.name}" will be moved to "Other"`}
                      onConfirm={() => handleDelete(category)}
                      okText="Delete"
                      okButtonProps={{ danger: true }}
                    >
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                      />
                    </Popconfirm>
                  ) : (
                    <Button
                      key="delete-disabled"
                      type="text"
                      size="small"
                      icon={<DeleteOutlined />}
                      disabled
                      title="Cannot delete 'Other' category"
                    />
                  ),
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        backgroundColor: `${category.color}20`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20,
                      }}
                    >
                      {category.icon}
                    </div>
                  }
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>{category.name}</span>
                      <div
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: category.color,
                        }}
                      />
                    </div>
                  }
                  description={
                    category.keywords && category.keywords.length > 0 ? (
                      <span style={{ fontSize: 12, color: '#888' }}>
                        {category.keywords.slice(0, 3).join(', ')}
                        {category.keywords.length > 3 && ` +${category.keywords.length - 3} more`}
                      </span>
                    ) : (
                      <span style={{ fontSize: 12, color: '#aaa', fontStyle: 'italic' }}>
                        No keywords
                      </span>
                    )
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Drawer>

      <CategoryEditModal
        open={editModalOpen}
        category={editingCategory}
        onClose={() => setEditModalOpen(false)}
        onSaved={handleCategorySaved}
      />
    </>
  );
};

export default CategoryManagerDrawer;
