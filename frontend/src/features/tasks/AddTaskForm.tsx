/**
 * Add task form (inline)
 * Location: frontend/src/features/tasks/AddTaskForm.tsx
 */

import { useState } from 'react';
import { Input, Button, Select, DatePicker, Space, message } from 'antd';
import { PlusOutlined, CaretDownOutlined } from '@ant-design/icons';
import { tasksApi } from '../../services/tasks';
import type { TaskCreate } from '../../types/tasks';
import dayjs from 'dayjs';

interface AddTaskFormProps {
  familyMembers: { user_id: string; user_name: string; user_color: string }[];
  onSuccess: () => void;
}

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const CATEGORY_OPTIONS = [
  { value: 'Household', label: 'Household' },
  { value: 'School', label: 'School' },
  { value: 'Work', label: 'Work' },
  { value: 'Personal', label: 'Personal' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Health', label: 'Health' },
  { value: 'Social', label: 'Social' },
];

export function AddTaskForm({ familyMembers, onSuccess }: AddTaskFormProps) {
  const [title, setTitle] = useState('');
  const [assignee, setAssignee] = useState<string | undefined>(undefined);
  const [dueDate, setDueDate] = useState<dayjs.Dayjs | null>(null);
  const [priority, setPriority] = useState<string>('normal');
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [adding, setAdding] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setAdding(true);
    try {
      const taskData: TaskCreate = {
        title: title.trim(),
        priority,
      };
      if (assignee) taskData.user_id = assignee;
      if (dueDate) taskData.due_date = dueDate.format('YYYY-MM-DD');
      if (category) taskData.category = category;

      await tasksApi.createTask(taskData);
      message.success('Task added');
      setTitle('');
      setAssignee(undefined);
      setDueDate(null);
      setPriority('normal');
      setCategory(undefined);
      setExpanded(false);
      onSuccess();
    } catch (err) {
      message.error('Failed to add task');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: 16,
      padding: 16,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
      marginBottom: 16,
    }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <Input
          placeholder="What needs to be done?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onPressEnter={handleSubmit}
          size="large"
          style={{ borderRadius: 10, fontSize: 16 }}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleSubmit}
          loading={adding}
          disabled={!title.trim()}
          size="large"
          style={{ borderRadius: 10, minWidth: 100 }}
        >
          Add
        </Button>
      </div>

      {/* Expandable options */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          textAlign: 'center',
          padding: '8px 0 0',
          color: '#94a3b8',
          fontSize: 12,
          cursor: 'pointer',
        }}
      >
        {expanded ? 'Less options' : 'More options'} <CaretDownOutlined style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </div>

      {expanded && (
        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          <Select
            allowClear
            placeholder="Assign to..."
            value={assignee}
            onChange={setAssignee}
            style={{ minWidth: 140 }}
            options={familyMembers.map(m => ({
              value: m.user_id,
              label: m.user_name,
            }))}
          />
          <DatePicker
            placeholder="Due date"
            value={dueDate}
            onChange={setDueDate}
            style={{ minWidth: 140 }}
          />
          <Select
            value={priority}
            onChange={setPriority}
            style={{ minWidth: 110 }}
            options={PRIORITY_OPTIONS}
          />
          <Select
            allowClear
            placeholder="Category"
            value={category}
            onChange={setCategory}
            style={{ minWidth: 130 }}
            options={CATEGORY_OPTIONS}
          />
        </div>
      )}
    </div>
  );
}
