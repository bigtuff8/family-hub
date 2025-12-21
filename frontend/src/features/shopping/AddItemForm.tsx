/**
 * Quick add item form with autocomplete
 * Location: frontend/src/features/shopping/AddItemForm.tsx
 */

import { useState, useEffect, useMemo } from 'react';
import { AutoComplete, Button, Space, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { shoppingApi } from '../../services/shopping';
import './AddItemForm.css';

interface Props {
  onAdd: (name: string, quantity?: number, unit?: string) => Promise<void>;
  loading?: boolean;
}

// Parse input like "2 milk", "3x eggs", "500g chicken"
function parseItemInput(input: string): { name: string; quantity?: number; unit?: string } {
  const trimmed = input.trim();

  // Match patterns like "2 milk", "3x eggs", "500g chicken", "1kg flour"
  const quantityMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*(x|kg|g|ml|l|pint|pack|tin|bag|bunch|carton|bottle|loaf|dozen)?\s+(.+)$/i);

  if (quantityMatch) {
    const [, qty, unit, name] = quantityMatch;
    return {
      name: name.trim(),
      quantity: parseFloat(qty),
      unit: unit?.toLowerCase() === 'x' ? undefined : unit?.toLowerCase(),
    };
  }

  // Just a name
  return { name: trimmed };
}

export function AddItemForm({ onAdd, loading }: Props) {
  const [inputValue, setInputValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    shoppingApi.getSuggestions()
      .then(setSuggestions)
      .catch(err => console.error('Failed to load suggestions:', err));
  }, []);

  // Filter suggestions based on input
  const filteredOptions = useMemo(() => {
    if (!inputValue.trim()) return [];

    // Extract the item name part (after any quantity prefix)
    const parsed = parseItemInput(inputValue);
    const searchTerm = parsed.name.toLowerCase();

    return suggestions
      .filter(s => s.toLowerCase().includes(searchTerm))
      .slice(0, 10)
      .map(s => ({ value: s, label: s }));
  }, [inputValue, suggestions]);

  const handleSubmit = async () => {
    if (!inputValue.trim()) return;

    setSubmitting(true);
    try {
      const { name, quantity, unit } = parseItemInput(inputValue);
      await onAdd(name, quantity, unit);
      setInputValue('');
      // Refresh suggestions to include new item
      shoppingApi.getSuggestions().then(setSuggestions).catch(console.error);
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed to add item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelect = (value: string) => {
    // Keep any quantity prefix the user typed
    const match = inputValue.match(/^(\d+(?:\.\d+)?\s*(?:x|kg|g|ml|l|pint|pack|tin|bag|bunch|carton|bottle|loaf|dozen)?\s*)/i);
    if (match) {
      setInputValue(match[1] + value);
    } else {
      setInputValue(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.defaultPrevented) {
      // Only submit if we're not selecting from dropdown
      setTimeout(() => {
        if (inputValue.trim()) {
          handleSubmit();
        }
      }, 50);
    }
  };

  return (
    <div className="add-item-form">
      <Space.Compact style={{ width: '100%' }}>
        <AutoComplete
          value={inputValue}
          options={filteredOptions}
          onChange={setInputValue}
          onSelect={handleSelect}
          onKeyDown={handleKeyDown}
          placeholder="Add item (e.g., '2 pint milk', 'eggs')"
          disabled={submitting || loading}
          size="large"
          style={{ flex: 1 }}
          allowClear
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleSubmit}
          loading={submitting}
          disabled={!inputValue.trim() || loading}
          size="large"
        >
          Add
        </Button>
      </Space.Compact>
      <div className="add-item-hint">
        Tip: Type quantity + unit + item (e.g., "2 pint milk"). Use arrow keys to select from previous items.
      </div>
    </div>
  );
}
