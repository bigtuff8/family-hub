/**
 * PinPad Component
 * Touch-friendly 4-digit PIN entry for kiosk login
 */

import React, { useState, useCallback } from 'react';
import { DeleteOutlined, CloseCircleOutlined } from '@ant-design/icons';
import './PinPad.css';

interface PinPadProps {
  onComplete: (pin: string) => void;
  onCancel?: () => void;
  error?: string;
  title?: string;
  subtitle?: string;
  maxLength?: number;
}

const PinPad: React.FC<PinPadProps> = ({
  onComplete,
  onCancel,
  error,
  title = 'Enter PIN',
  subtitle,
  maxLength = 4,
}) => {
  const [pin, setPin] = useState<string>('');
  const [shake, setShake] = useState(false);

  const handleDigit = useCallback((digit: string) => {
    if (pin.length < maxLength) {
      const newPin = pin + digit;
      setPin(newPin);

      // Auto-submit when complete
      if (newPin.length === maxLength) {
        onComplete(newPin);
      }
    }
  }, [pin, maxLength, onComplete]);

  const handleBackspace = useCallback(() => {
    setPin(prev => prev.slice(0, -1));
  }, []);

  const handleClear = useCallback(() => {
    setPin('');
  }, []);

  // Trigger shake animation on error
  React.useEffect(() => {
    if (error) {
      setShake(true);
      setPin('');
      const timer = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div className="pin-pad-container">
      {title && <h2 className="pin-pad-title">{title}</h2>}
      {subtitle && <p className="pin-pad-subtitle">{subtitle}</p>}

      {/* PIN Dots Display */}
      <div className={`pin-dots ${shake ? 'shake' : ''}`}>
        {Array.from({ length: maxLength }).map((_, i) => (
          <div
            key={i}
            className={`pin-dot ${i < pin.length ? 'filled' : ''}`}
          />
        ))}
      </div>

      {/* Error Message */}
      {error && <div className="pin-error">{error}</div>}

      {/* Number Pad */}
      <div className="pin-keypad">
        {digits.map(digit => (
          <button
            key={digit}
            className="pin-key"
            onClick={() => handleDigit(digit)}
            type="button"
          >
            {digit}
          </button>
        ))}

        {/* Bottom row: Clear, 0, Backspace */}
        <button
          className="pin-key pin-key-action"
          onClick={handleClear}
          type="button"
          title="Clear"
        >
          <CloseCircleOutlined />
        </button>

        <button
          className="pin-key"
          onClick={() => handleDigit('0')}
          type="button"
        >
          0
        </button>

        <button
          className="pin-key pin-key-action"
          onClick={handleBackspace}
          type="button"
          title="Backspace"
        >
          <DeleteOutlined />
        </button>
      </div>

      {/* Cancel Button */}
      {onCancel && (
        <button className="pin-cancel" onClick={onCancel} type="button">
          Cancel
        </button>
      )}
    </div>
  );
};

export default PinPad;
