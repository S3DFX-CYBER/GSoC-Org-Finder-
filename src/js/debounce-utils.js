/**
 * Debounce Utility for Search Input Optimization
 * Fixes Issue #151 - No Search Input Debouncing
 * Prevents excessive function calls during rapid events (e.g., typing)
 */

function useDebounce(callback, delay = 300) {
  let timeoutId = null;

  const debounced = (...args) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      callback(...args);
      timeoutId = null;
    }, delay);
  };

  /**
   * Cancel pending debounced call
   */
  debounced.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  /**
   * Immediately execute pending call if any
   */
  debounced.flush = (...args) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    callback(...args);
  };

  return debounced;
}
