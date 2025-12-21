/**
 * Modal for creating/editing shopping categories
 * Location: frontend/src/features/shopping/CategoryEditModal.tsx
 */

import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, ColorPicker, Tag, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { Color } from 'antd/es/color-picker';
import { EmojiPicker } from './EmojiPicker';
import { shoppingApi } from '../../services/shopping';
import type { ShoppingCategory, ShoppingCategoryCreate, ShoppingCategoryUpdate } from '../../types/shopping';

interface CategoryEditModalProps {
  open: boolean;
  category?: ShoppingCategory | null; // null = create mode
  onClose: () => void;
  onSaved: (category: ShoppingCategory) => void;
}

export const CategoryEditModal: React.FC<CategoryEditModalProps> = ({
  open,
  category,
  onClose,
  onSaved,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [showKeywordInput, setShowKeywordInput] = useState(false);

  const isEditMode = !!category;

  useEffect(() => {
    if (open) {
      if (category) {
        form.setFieldsValue({
          name: category.name,
          icon: category.icon,
          color: category.color,
        });
        setKeywords(category.keywords || []);
      } else {
        form.resetFields();
        form.setFieldsValue({
          icon: '📦',
          color: '#6b7280',
        });
        setKeywords([]);
      }
    }
  }, [open, category, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Extract color string from ColorPicker value
      let colorValue = values.color;
      if (typeof colorValue === 'object' && colorValue !== null) {
        colorValue = (colorValue as Color).toHexString();
      }

      if (isEditMode && category) {
        const updates: ShoppingCategoryUpdate = {
          name: values.name,
          icon: values.icon,
          color: colorValue,
          keywords,
        };
        const updated = await shoppingApi.updateCategory(category.id, updates);
        message.success(`Category "${updated.name}" updated`);
        onSaved(updated);
      } else {
        const createData: ShoppingCategoryCreate = {
          name: values.name,
          icon: values.icon,
          color: colorValue,
          keywords,
        };
        const created = await shoppingApi.createCategory(createData);
        message.success(`Category "${created.name}" created`);
        onSaved(created);
      }
      onClose();
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { detail?: string } } };
        message.error(axiosError.response?.data?.detail || 'Failed to save category');
      } else if (error instanceof Error && error.message !== 'Validation Error') {
        message.error('Failed to save category');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddKeyword = () => {
    const trimmed = newKeyword.trim().toLowerCase();
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords([...keywords, trimmed]);
    }
    setNewKeyword('');
    setShowKeywordInput(false);
  };

  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter((k) => k !== keyword));
  };

  return (
    <Modal
      title={isEditMode ? 'Edit Category' : 'New Category'}
      open={open}
      onOk={handleSubmit}
      onCancel={onClose}
      okText={isEditMode ? 'Save' : 'Create'}
      confirmLoading={loading}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        style={{ marginTop: 16 }}
      >
        <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
          <Form.Item
            name="icon"
            label="Icon"
            style={{ margin: 0 }}
          >
            <EmojiPicker />
          </Form.Item>

          <Form.Item
            name="name"
            label="Category Name"
            rules={[{ required: true, message: 'Please enter a name' }]}
            style={{ flex: 1, margin: 0 }}
          >
            <Input placeholder="e.g., Bakery" maxLength={100} />
          </Form.Item>
        </div>

        <Form.Item
          name="color"
          label="Color"
        >
          <ColorPicker
            showText
            format="hex"
            presets={[
              {
                label: 'Recommended',
                colors: [
                  '#22c55e', '#16a34a', '#15803d', // Greens
                  '#ef4444', '#dc2626', '#b91c1c', // Reds
                  '#f97316', '#ea580c', '#c2410c', // Oranges
                  '#eab308', '#ca8a04', '#a16207', // Yellows
                  '#3b82f6', '#2563eb', '#1d4ed8', // Blues
                  '#8b5cf6', '#7c3aed', '#6d28d9', // Purples
                  '#ec4899', '#db2777', '#be185d', // Pinks
                  '#6b7280', '#4b5563', '#374151', // Grays
                ],
              },
            ]}
          />
        </Form.Item>

        <Form.Item label="Keywords (for auto-categorization)">
          <div style={{
            border: '1px solid #d9d9d9',
            borderRadius: 6,
            padding: 8,
            minHeight: 60,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            alignItems: 'flex-start',
          }}>
            {keywords.map((keyword) => (
              <Tag
                key={keyword}
                closable
                onClose={() => handleRemoveKeyword(keyword)}
                style={{ margin: 0 }}
              >
                {keyword}
              </Tag>
            ))}
            {showKeywordInput ? (
              <Input
                size="small"
                style={{ width: 100 }}
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onBlur={handleAddKeyword}
                onPressEnter={handleAddKeyword}
                autoFocus
                placeholder="keyword"
              />
            ) : (
              <Tag
                onClick={() => setShowKeywordInput(true)}
                style={{
                  background: '#fff',
                  borderStyle: 'dashed',
                  cursor: 'pointer',
                  margin: 0,
                }}
              >
                <PlusOutlined /> Add keyword
              </Tag>
            )}
          </div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
            Items containing these words will auto-assign to this category
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CategoryEditModal;
