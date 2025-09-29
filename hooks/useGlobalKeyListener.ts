import { useEffect, useCallback } from 'react';

export const useGlobalKeyListener = (key: string, callback: (event: KeyboardEvent) => void, options: { ctrl?: boolean; meta?: boolean } = {}) => {
  const { ctrl = false, meta = false } = options;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key.toLowerCase() !== key.toLowerCase()) {
      return;
    }
    
    // This check is for combinations like Ctrl+K or Cmd+K
    const modifierMatch = (ctrl && event.ctrlKey) || (meta && event.metaKey);
    const anyOtherModifier = event.altKey || event.shiftKey;

    // If a modifier is required, it must match, and no other modifiers should be pressed.
    // If no modifiers are required, then we check that no modifiers are pressed at all.
    const shouldTrigger = (ctrl || meta) 
      ? modifierMatch && !anyOtherModifier
      : !event.ctrlKey && !event.metaKey && !anyOtherModifier;

    if (shouldTrigger) {
      event.preventDefault();
      callback(event);
    }
  }, [key, callback, ctrl, meta]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};
