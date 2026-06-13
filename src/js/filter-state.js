/**
 * Centralized Filter State Management
 * Handles filter state, URL synchronization, and persistence
 * Fixes Issue #151 - Missing Centralized Filter State
 */

class FilterState {
  constructor() {
    this.state = {
      search: '',
      category: 'all',
      complexity: 'all',
      languages: new Set(),
      chips: new Set(),
      sort: 'alpha'
    };
    
    this.listeners = [];
    this.debounceTimer = null;
    this.debounceDelay = 300;
    
    // Load initial state from URL
    this.loadFromURL();
  }

  /**
   * Subscribe to state changes
   */
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * Notify all listeners of state change
   */
  notifyListeners() {
    this.listeners.forEach(callback => callback(this.getState()));
  }

  /**
   * Get current state (immutable copy)
   */
  getState() {
    return {
      ...this.state,
      languages: new Set(this.state.languages),
      chips: new Set(this.state.chips)
    };
  }

  /**
   * Update search with debouncing
   */
  setSearch(value) {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.state.search = value.trim().toLowerCase();

    this.debounceTimer = setTimeout(() => {
      this.syncToURL();
      this.notifyListeners();
    }, this.debounceDelay);
  }

  /**
   * Update category filter (immediate)
   */
  setCategory(value) {
    this.state.category = value;
    this.syncToURL();
    this.notifyListeners();
  }

  /**
   * Update complexity filter (immediate)
   */
  setComplexity(value) {
    this.state.complexity = value;
    this.syncToURL();
    this.notifyListeners();
  }

  /**
   * Update sort option (immediate)
   */
  setSort(value) {
    this.state.sort = value;
    this.syncToURL();
    this.notifyListeners();
  }

  /**
   * Toggle language pill (immediate)
   */
  toggleLanguage(lang) {
    if (this.state.languages.has(lang)) {
      this.state.languages.delete(lang);
    } else {
      this.state.languages.add(lang);
    }
    this.syncToURL();
    this.notifyListeners();
  }

  /**
   * Clear all languages (immediate)
   */
  clearLanguages() {
    this.state.languages.clear();
    this.syncToURL();
    this.notifyListeners();
  }

  /**
   * Toggle filter chip (immediate)
   */
  toggleChip(chip) {
    if (this.state.chips.has(chip)) {
      this.state.chips.delete(chip);
    } else {
      this.state.chips.clear();
      this.state.chips.add(chip);
    }
    this.syncToURL();
    this.notifyListeners();
  }

  /**
   * Clear all chips (immediate)
   */
  clearChips() {
    this.state.chips.clear();
    this.syncToURL();
    this.notifyListeners();
  }

  /**
   * Reset all filters
   */
  reset() {
    this.state = {
      search: '',
      category: 'all',
      complexity: 'all',
      languages: new Set(),
      chips: new Set(),
      sort: 'alpha'
    };
    this.syncToURL();
    this.notifyListeners();
  }

  /**
   * Sync state to URL parameters
   */
  syncToURL() {
    const params = new URLSearchParams();
    
    if (this.state.search) params.set('q', this.state.search);
    if (this.state.category !== 'all') params.set('cat', this.state.category);
    if (this.state.complexity !== 'all') params.set('comp', this.state.complexity);
    if (this.state.sort !== 'alpha') params.set('sort', this.state.sort);
    
    if (this.state.languages.size > 0) {
      params.set('langs', Array.from(this.state.languages).join(','));
    }
    
    if (this.state.chips.size > 0) {
      params.set('chips', Array.from(this.state.chips).join(','));
    }

    const newURL = params.toString() 
      ? `${window.location.pathname}?${params.toString()}` 
      : window.location.pathname;
    
    window.history.replaceState({ path: newURL }, '', newURL);
  }

  /**
   * Load state from URL parameters
   */
  loadFromURL() {
    const params = new URLSearchParams(window.location.search);
    
    if (params.has('q')) {
      this.state.search = params.get('q');
    }
    
    if (params.has('cat')) {
      this.state.category = params.get('cat');
    }
    
    if (params.has('comp')) {
      this.state.complexity = params.get('comp');
    }
    
    if (params.has('sort')) {
      this.state.sort = params.get('sort');
    }
    
    if (params.has('langs')) {
      const langs = params.get('langs').split(',');
      this.state.languages = new Set(langs);
    }
    
    if (params.has('chips')) {
      const chips = params.get('chips').split(',');
      this.state.chips = new Set(chips);
    }
  }

  /**
   * Get readable count of active filters
   */
  getActiveFilterCount() {
    let count = 0;
    if (this.state.search) count++;
    if (this.state.category !== 'all') count++;
    if (this.state.complexity !== 'all') count++;
    if (this.state.languages.size > 0) count++;
    if (this.state.chips.size > 0) count++;
    return count;
  }

  /**
   * Check if any filters are active
   */
  hasActiveFilters() {
    return this.getActiveFilterCount() > 0;
  }
}

// Create singleton instance
const filterState = new FilterState();
