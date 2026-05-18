(function initRecentlyViewedModule() {
  const deps = globalThis.recentlyViewedDeps;
  if (!deps) return;

  const {
    escapeHtml,
    openModal,
    toggleBookmark,
    getBookmarkedSet,
    getOrgs
  } = deps;

  const RV = {
    maxItems: 10,
    storageKey: 'gsoc_recently_viewed',

    get() {
      try {
        return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
      } catch {
        return [];
      }
    },

    set(list) {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(list));
      } catch (err) {
        console.warn('Recently viewed storage write failed:', err);
      }
    },

    add(orgName) {
      const list = this.get();
      const filtered = list.filter((item) => item.name !== orgName);
      filtered.unshift({
        name: orgName,
        timestamp: Date.now()
      });
      this.set(filtered.slice(0, this.maxItems));
      this.render();
    },

    clear() {
      this.set([]);
      this.render();
    },

    render() {
      const container = document.getElementById('recentlyViewedScroll');
      const clearBtn = document.getElementById('clearRecentlyViewedBtn');
      const list = this.get();

      if (!container || !clearBtn) return;

      clearBtn.style.display = list.length > 0 ? 'block' : 'none';

      if (list.length === 0) {
        container.innerHTML = `
          <div class="w-full bg-white rounded-2xl p-5 border border-dashed border-zinc-200 flex items-center justify-center text-center md:w-80 md:flex-shrink-0">
            <div>
              <span class="material-symbols-outlined text-4xl text-zinc-300 mb-2 inline-block">bookmark_border</span>
              <p class="text-sm font-medium text-zinc-500">Start exploring organizations to see them here</p>
              <p class="text-xs text-zinc-400 mt-1">They'll appear in chronological order of your views</p>
            </div>
          </div>
        `;
        return;
      }

      const orgs = getOrgs();
      const bookmarkedSet = getBookmarkedSet();

      container.innerHTML = list.map((item) => {
        const org = orgs.find((entry) => entry.name === item.name);
        if (!org) return '';

        const githubOwner = org.github ? org.github.split('/')[0] : 'unknown';
        const logoUrl = `https://github.com/${githubOwner}.png?size=64`;
        const descSafe = String(org.desc || '');
        const tagsSafe = Array.isArray(org.tags) ? org.tags : [];
        const timeAgo = this.getTimeAgo(item.timestamp);
        const isBookmarked = bookmarkedSet.has(org.name);

        return `
          <article class="recently-viewed-card group bg-white animate-fade-up" data-org="${escapeHtml(org.name)}">
            <div class="recently-viewed-time">${escapeHtml(timeAgo)}</div>
            <div class="recently-viewed-card-header">
              <div class="recently-viewed-logo" data-logo-name="${escapeHtml(org.name)}">
                <img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(org.name)}" data-logo-name="${escapeHtml(org.name)}" />
              </div>
              <div class="recently-viewed-badges">
                <span class="category-tag">${escapeHtml(org.cat)}</span>
                <span class="recently-viewed-badge">${escapeHtml(String(org.years))}y</span>
              </div>
            </div>
            <div>
              <h4 class="font-headline text-lg font-bold text-on-surface mb-1 group-hover:text-primary transition-colors">${escapeHtml(org.name)}</h4>
              <p class="text-on-surface-variant text-sm leading-relaxed mb-4 line-clamp-2">${escapeHtml(descSafe.substring(0, 50))}${descSafe.length > 50 ? '...' : ''}</p>
            </div>
            <div class="flex flex-wrap gap-1.5 mb-4">
              ${tagsSafe.map((tag) => `<span class="px-2 py-0.5 bg-surface-container-low text-[10px] font-mono rounded">${escapeHtml(tag)}</span>`).join('')}
            </div>
            <div class="recently-viewed-actions">
              <button class="recently-viewed-btn" type="button" data-rv-action="open" title="View details">
                <span class="material-symbols-outlined" style="font-size:12px;">open_in_full</span> View
              </button>
              <button class="recently-viewed-btn favorite-toggle ${isBookmarked ? 'active' : ''}" type="button" data-rv-action="favorite" title="${isBookmarked ? 'Remove bookmark' : 'Add bookmark'}" aria-pressed="${isBookmarked ? 'true' : 'false'}">
                <span class="material-symbols-outlined ${isBookmarked ? 'icon-fill' : ''}" style="font-size:12px;">star</span>
              </button>
            </div>
          </article>
        `;
      }).join('');

      this.attachListeners(container);
    },

    attachListeners(container) {
      if (!container) return;

      if (!container.__rvClickListenerAttached) {
        container.addEventListener('click', (event) => {
          const favoriteBtn = event.target.closest('.recently-viewed-btn.favorite-toggle');
          if (favoriteBtn) {
            const card = favoriteBtn.closest('.recently-viewed-card');
            const orgName = card?.dataset.org;
            if (!orgName) return;
            toggleBookmark(event, orgName);
            return;
          }

          const openBtn = event.target.closest('.recently-viewed-btn');
          if (openBtn) {
            const card = openBtn.closest('.recently-viewed-card');
            const orgName = card?.dataset.org;
            if (!orgName) return;
            event.stopPropagation();
            openModal(orgName);
            return;
          }

          const card = event.target.closest('.recently-viewed-card');
          const orgName = card?.dataset.org;
          if (orgName) openModal(orgName);
        });
        container.__rvClickListenerAttached = true;
      }

      container.querySelectorAll('.recently-viewed-logo img[data-logo-name]').forEach((img) => {
        if (img.__rvErrorAttached) return;
        img.addEventListener('error', () => {
          const orgName = img.dataset.logoName || img.closest('.recently-viewed-logo')?.dataset.logoName || '';
          const initials = orgName
            .split(/\s+/)
            .filter(Boolean)
            .map((part) => part[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();
          const logo = img.closest('.recently-viewed-logo');
          if (!logo) return;
          img.remove();
          const fallback = document.createElement('span');
          fallback.textContent = initials;
          logo.textContent = '';
          logo.appendChild(fallback);
        });
        img.__rvErrorAttached = true;
      });
    },

    getTimeAgo(timestamp) {
      const now = Date.now();
      const diff = now - timestamp;
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return 'just now';
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days === 1) return 'yesterday';
      return `${days}d ago`;
    }
  };

  globalThis.RV = RV;

  document.getElementById('clearRecentlyViewedBtn')?.addEventListener('click', () => {
    if (confirm('Clear all recently viewed organizations?')) {
      RV.clear();
    }
  });

  RV.render();
})();
