/**
 * OnScreenKeyboard Component
 * Floating QWERTY keyboard for touchscreen text input
 */

import React, { useState, useCallback } from 'react';
import { CloseOutlined, EnterOutlined } from '@ant-design/icons';
import './OnScreenKeyboard.css';

interface OnScreenKeyboardProps {
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
  onEnter?: () => void;
  onClose: () => void;
  visible: boolean;
}

const OnScreenKeyboard: React.FC<OnScreenKeyboardProps> = ({
  onKeyPress,
  onBackspace,
  onEnter,
  onClose,
  visible,
}) => {
  const [shift, setShift] = useState(false);

  // Key layouts
  const numberRow = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
  const numberRowShift = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')'];

  const topRow = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'];
  const middleRow = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'];
  const bottomRow = ['z', 'x', 'c', 'v', 'b', 'n', 'm'];

  const handleKey = useCallback((key: string) => {
    const output = shift ? key.toUpperCase() : key;
    onKeyPress(output);
    // Reset shift after keypress (like mobile keyboards)
    if (shift) setShift(false);
  }, [shift, onKeyPress]);

  const handleShift = useCallback(() => {
    setShift(prev => !prev);
  }, []);

  const handleSpace = useCallback(() => {
    onKeyPress(' ');
  }, [onKeyPress]);

  if (!visible) return null;

  return (
    <div className="osk-container">
      {/* Close button */}
      <button className="osk-close" onClick={onClose} type="button">
        <CloseOutlined />
      </button>

      {/* Number Row */}
      <div className="osk-row">
        {(shift ? numberRowShift : numberRow).map((key, i) => (
          <button
            key={i}
            className="osk-key"
            onClick={() => onKeyPress(key)}
            type="button"
          >
            {key}
          </button>
        ))}
      </div>

      {/* QWERTY Row */}
      <div className="osk-row">
        {topRow.map(key => (
          <button
            key={key}
            className="osk-key"
            onClick={() => handleKey(key)}
            type="button"
          >
            {shift ? key.toUpperCase() : key}
          </button>
        ))}
      </div>

      {/* ASDF Row */}
      <div className="osk-row">
        {middleRow.map(key => (
          <button
            key={key}
            className="osk-key"
            onClick={() => handleKey(key)}
            type="button"
          >
            {shift ? key.toUpperCase() : key}
          </button>
        ))}
      </div>

      {/* ZXCV Row with Shift and Backspace */}
      <div className="osk-row">
        <button
          className={`osk-key osk-key-wide ${shift ? 'osk-key-active' : ''}`}
          onClick={handleShift}
          type="button"
        >
          Shift
        </button>
        {bottomRow.map(key => (
          <button
            key={key}
            className="osk-key"
            onClick={() => handleKey(key)}
            type="button"
          >
            {shift ? key.toUpperCase() : key}
          </button>
        ))}
        <button
          className="osk-key osk-key-wide"
          onClick={onBackspace}
          type="button"
        >
          Del
        </button>
      </div>

      {/* Bottom Row: Symbols, Space, Enter */}
      <div className="osk-row">
        <button
          className="osk-key"
          onClick={() => onKeyPress(shift ? '_' : '-')}
          type="button"
        >
          {shift ? '_' : '-'}
        </button>
        <button
          className="osk-key"
          onClick={() => onKeyPress(shift ? '+' : '=')}
          type="button"
        >
          {shift ? '+' : '='}
        </button>
        <button
          className="osk-key osk-key-space"
          onClick={handleSpace}
          type="button"
        >
          space
        </button>
        <button
          className="osk-key"
          onClick={() => onKeyPress(shift ? ':' : ';')}
          type="button"
        >
          {shift ? ':' : ';'}
        </button>
        <button
          className="osk-key"
          onClick={() => onKeyPress(shift ? '"' : "'")}
          type="button"
        >
          {shift ? '"' : "'"}
        </button>
        {onEnter && (
          <button
            className="osk-key osk-key-enter"
            onClick={onEnter}
            type="button"
          >
            <EnterOutlined />
          </button>
        )}
      </div>
    </div>
  );
};

export default OnScreenKeyboard;
