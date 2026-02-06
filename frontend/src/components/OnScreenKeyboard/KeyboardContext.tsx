/**
 * KeyboardContext
 * Global state management for on-screen keyboard visibility
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { EditOutlined } from '@ant-design/icons';
import OnScreenKeyboard from './OnScreenKeyboard';
import './KeyboardContext.css';

interface KeyboardContextType {
  showKeyboard: () => void;
  hideKeyboard: () => void;
  toggleKeyboard: () => void;
  isVisible: boolean;
  setActiveInput: (input: HTMLInputElement | HTMLTextAreaElement | null) => void;
}

const KeyboardContext = createContext<KeyboardContextType | null>(null);

export const useKeyboard = () => {
  const context = useContext(KeyboardContext);
  if (!context) {
    throw new Error('useKeyboard must be used within a KeyboardProvider');
  }
  return context;
};

interface KeyboardProviderProps {
  children: React.ReactNode;
}

export const KeyboardProvider: React.FC<KeyboardProviderProps> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const activeInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const showKeyboard = useCallback(() => setIsVisible(true), []);
  const hideKeyboard = useCallback(() => setIsVisible(false), []);
  const toggleKeyboard = useCallback(() => setIsVisible(prev => !prev), []);

  const setActiveInput = useCallback((input: HTMLInputElement | HTMLTextAreaElement | null) => {
    activeInputRef.current = input;
  }, []);

  // Auto-detect focus on any input/textarea within the provider
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
        // Don't auto-show for password fields by default (security)
        // but still register the input so keyboard works when FAB is tapped
        activeInputRef.current = target;
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      // Check if focus moved to another input or to the keyboard
      const relatedTarget = e.relatedTarget as HTMLElement | null;
      if (relatedTarget) {
        // If clicking keyboard buttons, don't clear the active input
        if (relatedTarget.closest('.on-screen-keyboard') ||
            relatedTarget.closest('.keyboard-toggle-fab')) {
          return;
        }
      }
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  const handleKeyPress = useCallback((key: string) => {
    const input = activeInputRef.current;
    if (!input) return;

    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;

    // Insert character at cursor position
    const newValue = input.value.slice(0, start) + key + input.value.slice(end);

    // Create and dispatch input event for React controlled inputs
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    )?.set || Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      'value'
    )?.set;

    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(input, newValue);
    }

    const event = new Event('input', { bubbles: true });
    input.dispatchEvent(event);

    // Move cursor
    requestAnimationFrame(() => {
      input.setSelectionRange(start + 1, start + 1);
      input.focus();
    });
  }, []);

  const handleBackspace = useCallback(() => {
    const input = activeInputRef.current;
    if (!input) return;

    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;

    let newValue: string;
    let newCursorPos: number;

    if (start !== end) {
      // Delete selection
      newValue = input.value.slice(0, start) + input.value.slice(end);
      newCursorPos = start;
    } else if (start > 0) {
      // Delete character before cursor
      newValue = input.value.slice(0, start - 1) + input.value.slice(start);
      newCursorPos = start - 1;
    } else {
      return;
    }

    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    )?.set || Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      'value'
    )?.set;

    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(input, newValue);
    }

    const event = new Event('input', { bubbles: true });
    input.dispatchEvent(event);

    requestAnimationFrame(() => {
      input.setSelectionRange(newCursorPos, newCursorPos);
      input.focus();
    });
  }, []);

  const handleEnter = useCallback(() => {
    const input = activeInputRef.current;
    if (!input) return;

    // For textareas, insert newline
    if (input instanceof HTMLTextAreaElement) {
      handleKeyPress('\n');
    } else {
      // For inputs, blur to trigger form submission
      input.blur();
      hideKeyboard();
    }
  }, [handleKeyPress, hideKeyboard]);

  return (
    <KeyboardContext.Provider
      value={{
        showKeyboard,
        hideKeyboard,
        toggleKeyboard,
        isVisible,
        setActiveInput,
      }}
    >
      {children}

      {/* Floating Toggle Button */}
      <button
        className={`keyboard-toggle-fab ${isVisible ? 'active' : ''}`}
        onClick={toggleKeyboard}
        type="button"
        title="Toggle Keyboard"
      >
        <EditOutlined />
      </button>

      {/* On-Screen Keyboard */}
      <OnScreenKeyboard
        visible={isVisible}
        onKeyPress={handleKeyPress}
        onBackspace={handleBackspace}
        onEnter={handleEnter}
        onClose={hideKeyboard}
      />
    </KeyboardContext.Provider>
  );
};

export default KeyboardContext;
