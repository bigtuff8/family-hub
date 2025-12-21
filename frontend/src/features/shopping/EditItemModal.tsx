/**
 * Edit shopping item modal
 * Location: frontend/src/features/shopping/EditItemModal.tsx
 */

import { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select, message } from 'antd';
import { shoppingApi } from '../../services/shopping';
import type { ShoppingItem } from '../../types/shopping';

interface Props {
  item: ShoppingItem | null;
  listId: string;
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Common units grouped by type
const UNIT_GROUPS = [
  { label: 'Count', options: [{ value: '', label: 'items (no unit)' }] },
  { label: 'Weight', options: [
    { value: 'kg', label: 'kg' },
    { value: 'g', label: 'g' },
    { value: 'lb', label: 'lb' },
    { value: 'oz', label: 'oz' },
  ]},
  { label: 'Volume', options: [
    { value: 'l', label: 'litre' },
    { value: 'ml', label: 'ml' },
    { value: 'pint', label: 'pint' },
  ]},
  { label: 'Containers', options: [
    { value: 'pack', label: 'pack' },
    { value: 'bag', label: 'bag' },
    { value: 'box', label: 'box' },
    { value: 'tin', label: 'tin' },
    { value: 'jar', label: 'jar' },
    { value: 'bottle', label: 'bottle' },
    { value: 'carton', label: 'carton' },
  ]},
  { label: 'Other', options: [
    { value: 'bunch', label: 'bunch' },
    { value: 'loaf', label: 'loaf' },
    { value: 'dozen', label: 'dozen' },
    { value: 'slice', label: 'slice' },
    { value: 'piece', label: 'piece' },
  ]},
];

export function EditItemModal({ item, listId, visible, onClose, onSuccess }: Props) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    if (visible && item) {
      form.setFieldsValue({
        name: item.name,
        quantity: Number(item.quantity) || 1,
        unit: item.unit || '',
        category: item.category,
      });
    }
  }, [visible, item, form]);

  useEffect(() => {
    shoppingApi.getCategories().then(setCategories).catch(console.error);
  }, []);

  const handleSubmit = async () => {
    if (!item) return;

    try {
      const values = await form.validateFields();
      setLoading(true);

      await shoppingApi.updateItem(listId, item.id, {
        name: values.name,
        quantity: values.quantity,
        unit: values.unit || null,
        category: values.category,
      });

      message.success('Item updated');
      onSuccess();
      onClose();
    } catch (err) {
      if (err instanceof Error) {
        message.error(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Edit Item"
      open={visible}
      onOk={handleSubmit}
      onCancel={onClose}
      confirmLoading={loading}
      okText="Save"
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ quantity: 1, unit: '', category: 'Other' }}
      >
        <Form.Item
          name="name"
          label="Item Name"
          rules={[{ required: true, message: 'Please enter item name' }]}
        >
          <Input placeholder="e.g., Milk, Bread, Eggs" />
        </Form.Item>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Form.Item
            name="quantity"
            label="Quantity"
            rules={[{ required: true, message: 'Required' }]}
          >
            <InputNumber
              min={0.1}
              step={1}
              style={{ width: '100%' }}
              placeholder="1"
            />
          </Form.Item>

          <Form.Item
            name="unit"
            label="Unit"
          >
            <Select
              placeholder="Select unit"
              allowClear
              options={UNIT_GROUPS}
            />
          </Form.Item>
        </div>

        <Form.Item
          name="category"
          label="Category"
        >
          <Select
            placeholder="Select category"
            options={categories.map(c => ({ value: c, label: c }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
