/**
 * Skeleton Loader Component
 * Fixes Issue #151 - Weak Loading State
 * Displays loading placeholders with shimmer animation
 */

class SkeletonLoader {
  /**
   * Create a single skeleton card HTML structure
   */
  static createSkeletonCard() {
    return `
      <div class="skeleton-card group relative rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 transition-all duration-300 hover:shadow-lg overflow-hidden">
        <!-- Shimmer overlay -->
        <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer pointer-events-none"></div>
        
        <!-- Header skeleton -->
        <div class="flex items-start justify-between mb-4">
          <div class="space-y-2 flex-1">
            <div class="h-6 bg-zinc-200 rounded w-3/4 skeleton-line"></div>
            <div class="h-4 bg-zinc-100 rounded w-1/2 skeleton-line"></div>
          </div>
          <div class="w-10 h-10 bg-zinc-200 rounded-lg skeleton-line"></div>
        </div>
        
        <!-- Tags skeleton -->
        <div class="flex flex-wrap gap-2 mb-4">
          <div class="h-5 bg-zinc-100 rounded-full w-20 skeleton-line"></div>
          <div class="h-5 bg-zinc-100 rounded-full w-24 skeleton-line"></div>
          <div class="h-5 bg-zinc-100 rounded-full w-16 skeleton-line"></div>
        </div>
        
        <!-- Description skeleton -->
        <div class="space-y-2 mb-4">
          <div class="h-3 bg-zinc-100 rounded w-full skeleton-line"></div>
          <div class="h-3 bg-zinc-100 rounded w-5/6 skeleton-line"></div>
        </div>
        
        <!-- Footer skeleton -->
        <div class="flex justify-between items-center pt-3 border-t border-zinc-100">
          <div class="h-4 bg-zinc-100 rounded w-1/4 skeleton-line"></div>
          <div class="h-8 bg-zinc-100 rounded w-20 skeleton-line"></div>
        </div>
      </div>
    `;
  }

  /**
   * Render multiple skeleton cards in a grid
   * @param {HTMLElement} container - Target container element
   * @param {number} count - Number of skeleton cards to render (default: 12)
   */
  static renderSkeletons(container, count = 12) {
    if (!container) return;
    
    container.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';
    
    for (let i = 0; i < count; i++) {
      const cardDiv = document.createElement('div');
      cardDiv.innerHTML = this.createSkeletonCard();
      grid.appendChild(cardDiv.firstElementChild);
    }
    
    container.appendChild(grid);
  }

  /**
   * Clear all skeleton loaders from container
   * @param {HTMLElement} container - Target container element
   */
  static clear(container) {
    if (container) {
      container.innerHTML = '';
    }
  }
}
