/**
 * Emoji picker for category icons
 * Location: frontend/src/features/shopping/EmojiPicker.tsx
 */

import React, { useState } from 'react';
import { Popover, Input, Button } from 'antd';

// Shopping-relevant emoji categories
const EMOJI_CATEGORIES = {
  'Produce': ['🥬', '🥦', '🥕', '🍎', '🍌', '🍊', '🍋', '🍇', '🍓', '🥑', '🍅', '🌽', '🥒', '🍆', '🥔'],
  'Meat & Protein': ['🥩', '🍖', '🍗', '🥓', '🌭', '🍔', '🐟', '🦐', '🥚', '🐄', '🐷', '🐔'],
  'Dairy': ['🥛', '🧀', '🧈', '🍦', '🥣', '🍶'],
  'Bakery': ['🍞', '🥖', '🥐', '🥯', '🧁', '🍰', '🥧', '🍩', '🍪'],
  'Beverages': ['🥤', '☕', '🍵', '🧃', '🍷', '🍺', '🥂', '🧊', '💧'],
  'Frozen': ['🧊', '❄️', '🍨', '🍧'],
  'Household': ['🧹', '🧺', '🧼', '🧴', '🪥', '🧻', '🧽', '🪣', '🏠'],
  'Personal Care': ['💊', '🩹', '🧴', '💅', '🪒', '🧸'],
  'Other': ['📦', '🛒', '🏷️', '✨', '⭐', '❤️', '💚', '💙', '💜', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣'],
};

interface EmojiPickerProps {
  value?: string;
  onChange?: (emoji: string) => void;
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ value = '📦', onChange }) => {
  const [open, setOpen] = useState(false);
  const [customEmoji, setCustomEmoji] = useState('');

  const handleSelect = (emoji: string) => {
    onChange?.(emoji);
    setOpen(false);
  };

  const handleCustomSubmit = () => {
    if (customEmoji.trim()) {
      onChange?.(customEmoji.trim());
      setCustomEmoji('');
      setOpen(false);
    }
  };

  const content = (
    <div style={{ width: 280, maxHeight: 350, overflowY: 'auto' }}>
      {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
        <div key={category} style={{ marginBottom: 12 }}>
          <div style={{
            fontSize: 11,
            color: '#666',
            marginBottom: 4,
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {category}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {emojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleSelect(emoji)}
                style={{
                  width: 32,
                  height: 32,
                  border: value === emoji ? '2px solid #1890ff' : '1px solid #e8e8e8',
                  borderRadius: 6,
                  background: value === emoji ? '#e6f7ff' : '#fff',
                  cursor: 'pointer',
                  fontSize: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (value !== emoji) {
                    e.currentTarget.style.background = '#f5f5f5';
                    e.currentTarget.style.borderColor = '#d9d9d9';
                  }
                }}
                onMouseLeave={(e) => {
                  if (value !== emoji) {
                    e.currentTarget.style.background = '#fff';
                    e.currentTarget.style.borderColor = '#e8e8e8';
                  }
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Custom emoji input */}
      <div style={{
        marginTop: 12,
        paddingTop: 12,
        borderTop: '1px solid #f0f0f0',
        display: 'flex',
        gap: 8
      }}>
        <Input
          placeholder="Custom emoji..."
          value={customEmoji}
          onChange={(e) => setCustomEmoji(e.target.value)}
          onPressEnter={handleCustomSubmit}
          style={{ flex: 1 }}
          maxLength={2}
        />
        <Button type="primary" size="small" onClick={handleCustomSubmit}>
          Use
        </Button>
      </div>
    </div>
  );

  return (
    <Popover
      content={content}
      title="Select Icon"
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomLeft"
    >
      <Button
        style={{
          width: 48,
          height: 48,
          fontSize: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
        }}
      >
        {value}
      </Button>
    </Popover>
  );
};

export default EmojiPicker;
