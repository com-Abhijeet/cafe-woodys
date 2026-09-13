// Cafe Woody's — Native Back Stack Gesture Handler
import { useEffect } from 'react';

const backHandlers = [];

/**
 * Register a back button handler callback (LIFO).
 * When Android hardware back or swipe gesture occurs, the most recently registered handler executes first.
 */
export function pushBackHandler(handler) {
  if (typeof handler === 'function') {
    backHandlers.push(handler);
  }
  return () => {
    const idx = backHandlers.lastIndexOf(handler);
    if (idx !== -1) {
      backHandlers.splice(idx, 1);
    }
  };
}

/**
 * Process back gesture. Returns true if a registered handler handled the action, false otherwise.
 */
export function processBackAction() {
  if (backHandlers.length > 0) {
    const topHandler = backHandlers.pop();
    try {
      topHandler();
      return true;
    } catch (err) {
      console.warn('Error in back handler execution:', err);
      return true;
    }
  }
  return false;
}

/**
 * React hook to register a back action for a component/modal while mounted.
 */
export function useBackHandler(handler, active = true) {
  useEffect(() => {
    if (!active || typeof handler !== 'function') return;
    const unregister = pushBackHandler(handler);
    return () => unregister();
  }, [handler, active]);
}
