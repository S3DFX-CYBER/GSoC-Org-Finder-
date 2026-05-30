/* exported useDebounce, debounce */

/**
 * Simple debounce utility function
 * Delays function execution until after the specified timeout has elapsed
 * @param {Function} func - The function to debounce
 * @param {number} wait - Time in milliseconds to wait before executing
 * @returns {Function} - Debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Creates a debounced search handler for input fields
 * Useful for preventing excessive re-renders on every keystroke
 * @param {number} delay - Debounce delay in milliseconds (default: 300ms)
 * @returns {Function} - Debounced event handler
 */
function useDebounce(delay = 300) {
  return debounce((value) => {
    document.dispatchEvent(new CustomEvent('debouncedSearch', { detail: { query: value } }));
  }, delay);
}

/**
 * Initialize global filter state in localStorage
 * Creates default state if it doesn't exist
 */
function initializeFilterState() {
  const defaultState = {
    search: '',
    type: [],
    language: [],
    category: 'all',
    complexity: 'all',
    sort: 'alpha'
  };

  const stored = localStorage.getItem('gaf_filters');
  if (!stored) {
    localStorage.setItem('gaf_filters', JSON.stringify(defaultState));
    return defaultState;
  }

  try {
    return JSON.parse(stored);
  } catch (e) {
    console.warn('Failed to parse filter state:', e);
    localStorage.setItem('gaf_filters', JSON.stringify(defaultState));
    return defaultState;
  }
}

/**
 * Update filter state in localStorage
 * @param {Object} newState - Partial state to merge
 */
function updateFilterState(newState) {
  try {
    const current = JSON.parse(localStorage.getItem('gaf_filters') || '{}');
    const updated = { ...current, ...newState };
    localStorage.setItem('gaf_filters', JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.warn('Failed to update filter state:', e);
    return null;
  }
}

/**
 * Get current filter state from localStorage
 * @returns {Object} - Current filter state
 */
function getFilterState() {
  try {
    return JSON.parse(localStorage.getItem('gaf_filters') || '{}');
  } catch (e) {
    console.warn('Failed to get filter state:', e);
    return {};
  }
}

/**
 * Sync filter state to URL parameters
 * @param {Object} filterState - The filter state object
 */
function syncFiltersToUrl(filterState) {
  const params = new URLSearchParams();
  
  if (filterState.search) params.set('q', filterState.search);
  if (filterState.category && filterState.category !== 'all') params.set('cat', filterState.category);
  if (filterState.language && filterState.language.length) params.set('lang', filterState.language.join(','));
  if (filterState.sort && filterState.sort !== 'alpha') params.set('sort', filterState.sort);
  if (filterState.complexity && filterState.complexity !== 'all') params.set('complexity', filterState.complexity);
  
  const queryString = params.toString();
  history.replaceState(null, '', queryString ? '?' + queryString : location.pathname);
}

/**
 * Load filter state from URL parameters
 * @returns {Object} - Filter state extracted from URL
 */
function loadFiltersFromUrl() {
  const params = new URLSearchParams(location.search);
  return {
    search: params.get('q') || '',
    category: params.get('cat') || 'all',
    language: params.getAll('lang').length ? params.get('lang').split(',') : [],
    complexity: params.get('complexity') || 'all',
    sort: params.get('sort') || 'alpha'
  };
}
