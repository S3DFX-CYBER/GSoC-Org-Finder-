/**
 * Dynamic Organization Counter
 * Fixes Issue #151 - Static Organization Count (Misleading UX)
 * Updates org count based on active filters and search
 */

class OrgCounter {
  constructor(countElementId = 'orgCount') {
    this.countElement = document.getElementById(countElementId);
    this.filteredCount = 0;
    this.totalCount = 0;
  }

  /**
   * Update the organization count display based on filtered results
   * @param {Array} filteredOrgs - Array of filtered organizations
   * @param {Array} totalOrgs - Array of all organizations
   */
  updateCount(filteredOrgs, totalOrgs) {
    this.filteredCount = filteredOrgs.length;
    this.totalCount = totalOrgs.length;
    
    if (this.countElement) {
      if (filterState.hasActiveFilters()) {
        // Show filtered count when filters are active
        this.countElement.textContent = this.filteredCount;
        this.countElement.title = `${this.filteredCount} of ${this.totalCount} organizations match your filters`;
        this.countElement.classList.add('text-primary', 'font-bold');
      } else {
        // Show total count when no filters
        this.countElement.textContent = this.totalCount;
        this.countElement.title = `Total organizations`;
        this.countElement.classList.remove('text-primary', 'font-bold');
      }
    }
  }

  /**
   * Get current filtered count
   */
  getFilteredCount() {
    return this.filteredCount;
  }

  /**
   * Get total count
   */
  getTotalCount() {
    return this.totalCount;
  }

  /**
   * Get display text
   */
  getDisplayText() {
    if (filterState.hasActiveFilters()) {
      return `${this.filteredCount} / ${this.totalCount}`;
    }
    return `${this.totalCount}`;
  }
}

// Create singleton instance
const orgCounter = new OrgCounter();
