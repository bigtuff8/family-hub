/**
 * useKeyboardInput Hook
 * Connects input elements to the on-screen keyboard
 */

import { useCallback, useRef } from 'react';
import { useKeyboard } from './KeyboardContext';

/**
 * Hook that returns props for connecting an input to the on-screen keyboard.
 * Spread the returned props onto your <input> or <textarea> element.
 *
 * @example
 * const inputProps = useKeyboardInput();
 * <input {...inputProps} type="text" />
 */
export const useKeyboardInput = () => {
  const { setActiveInput, showKeyboard } = useKeyboard();
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    inputRef.current = target;
    setActiveInput(target);
    showKeyboard();
  }, [setActiveInput, showKeyboard]);

  const handleBlur = useCallback(() => {
    // Don't immediately clear - the keyboard needs the reference
    // The keyboard will handle clearing when appropriate
  }, []);

  const ref = useCallback((el: HTMLInputElement | HTMLTextAreaElement | null) => {
    inputRef.current = el;
  }, []);

  return {
    ref,
    onFocus: handleFocus,
    onBlur: handleBlur,
  };
};

export default useKeyboardInput;
