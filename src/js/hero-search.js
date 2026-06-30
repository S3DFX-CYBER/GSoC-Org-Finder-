/* global ORGS, openModal, escapeHtml */
/* exported HeroSearch */

// ══════════════════════════════════════════════
// HERO QUICK-SEARCH (single source of truth)
//
// Loaded as a classic <script> in index.html and required by the Node test
// suite. Reads the page globals ORGS / openModal / escapeHtml (declared by
// orgs.js and the main inline script) exactly as the previous inline copy did,
// so behaviour is unchanged. Self-wires on DOMContentLoaded in the browser;
// in Node the listener is a no-op and only heroSearchMatches is exercised.
// ══════════════════════════════════════════════
(function (root) {
  'use strict';

  function boldMatch(name, query, escapeHtmlFn) {
    const esc = escapeHtmlFn || escapeHtml;
    const q = (query || '').toLowerCase();
    if (!q) return esc(name);
    const idx = name.toLowerCase().indexOf(q);
    if (idx === -1) return esc(name);
    return esc(name.slice(0, idx)) +
      '<strong class="text-primary font-semibold">' +
      esc(name.slice(idx, idx + q.length)) +
      '</strong>' +
      esc(name.slice(idx + q.length));
  }

  function heroSearchMatches(query) {
    const q = (query || '').trim().toLowerCase();
    if (!q) return [];
    const matches = ORGS.filter(o => o.name.toLowerCase().includes(q));
    matches.sort((a, b) => {
      const na = a.name.toLowerCase();
      const nb = b.name.toLowerCase();
      if (na === q && nb !== q) return -1;
      if (nb === q && na !== q) return 1;
      if (na.startsWith(q) && !nb.startsWith(q)) return -1;
      if (nb.startsWith(q) && !na.startsWith(q)) return 1;
      return na.localeCompare(nb);
    });
    return matches.slice(0, 3);
  }

  function buildHeroResultRow(org, i, q, escapeHtmlFn) {
    const esc = escapeHtmlFn || escapeHtml;
    const rawGithub = (org.github || '').replace(/^https?:\/\/github\.com\//, '');
    const owner = rawGithub.split('/')[0] || '';
    const logoUrl = owner ? `https://github.com/${esc(owner)}.png?size=80` : '';
    const tags = org.tags || [];
    const visible = tags.slice(0, 3);
    const overflow = tags.length - visible.length;
    const logoHtml = logoUrl
      ? `<img src="${logoUrl}" alt="" class="w-full h-full object-contain">` +
        `<div class="hero-result-logo-placeholder" style="display:none">${esc(org.name.charAt(0))}</div>`
      : `<div class="hero-result-logo-placeholder">${esc(org.name.charAt(0))}</div>`;
    const tagHtml = visible.map(t => `<span class="hero-result-tag">${esc(t)}</span>`).join('') +
      (overflow > 0 ? `<span class="hero-result-tag-overflow">+${overflow}</span>` : '');
    return `<button role="option" id="hero-result-${i}" class="hero-result-row"
            data-org-name="${esc(org.name)}" aria-selected="false">
            <div class="hero-result-logo">${logoHtml}</div>
            <div class="hero-result-info">
              <div class="hero-result-name">${boldMatch(org.name, q, esc)}</div>
              <div class="hero-result-tags">${tagHtml}</div>
            </div>
          </button>`;
  }

  function attachHeroLogoFallback(row) {
    const logoImg = row.querySelector('.hero-result-logo img');
    if (!logoImg) return;
    logoImg.addEventListener('error', () => {
      logoImg.style.display = 'none';
      const placeholder = logoImg.nextElementSibling;
      if (placeholder) placeholder.style.display = 'flex';
    });
  }

  function initHeroSearch(deps) {
    const openModalImpl = (deps && deps.openModal) || openModal;
    const escapeHtmlImpl = (deps && deps.escapeHtml) || escapeHtml;

    const heroSearch = document.getElementById('hero-search');
    const heroResults = document.getElementById('heroSearchResults');
    if (!heroSearch || !heroResults) return;

    let heroActiveIdx = -1;

    const closeHeroDropdown = () => {
      heroResults.classList.remove('open');
      heroSearch.setAttribute('aria-expanded', 'false');
      heroActiveIdx = -1;
      heroSearch.removeAttribute('aria-activedescendant');
    };

    const openHeroDropdown = () => {
      heroResults.classList.add('open');
      heroSearch.setAttribute('aria-expanded', 'true');
    };

    const updateHeroActive = (rows) => {
      rows.forEach((row, i) => {
        row.classList.toggle('hero-result-active', i === heroActiveIdx);
        row.setAttribute('aria-selected', i === heroActiveIdx ? 'true' : 'false');
        if (i === heroActiveIdx) heroSearch.setAttribute('aria-activedescendant', row.id);
      });
      if (heroActiveIdx < 0) heroSearch.removeAttribute('aria-activedescendant');
    };

    const renderHeroDropdown = (rawQuery) => {
      // Reset active state before replacing the DOM so aria-activedescendant
      // never points at a node that is about to be removed.
      heroActiveIdx = -1;
      heroSearch.removeAttribute('aria-activedescendant');

      const q = rawQuery.trim().toLowerCase();
      if (!q) { closeHeroDropdown(); return; }

      const matches = heroSearchMatches(q);

      if (matches.length === 0) {
        heroResults.innerHTML = '<div class="hero-result-empty">No organizations found</div>';
        openHeroDropdown();
        return;
      }

      heroResults.innerHTML = matches.map((org, i) => buildHeroResultRow(org, i, q, escapeHtmlImpl)).join('');

      openHeroDropdown();

      heroResults.querySelectorAll('.hero-result-row').forEach(row => {
        row.addEventListener('click', () => chooseHeroRow(row));
        attachHeroLogoFallback(row);
      });
    };

    const chooseHeroRow = (row) => {
      openModalImpl(row.dataset.orgName);
      heroSearch.value = '';
      closeHeroDropdown();
    };

    heroSearch.addEventListener('input', (e) => renderHeroDropdown(e.target.value));

    const heroRows = () => [...heroResults.querySelectorAll('.hero-result-row')];

    const reopenHeroDropdown = (key) => {
      renderHeroDropdown(heroSearch.value);
      const rows = heroRows();
      if (!rows.length) return;
      heroActiveIdx = key === 'ArrowDown' ? 0 : rows.length - 1;
      updateHeroActive(rows);
    };

    const moveHeroActive = (delta) => {
      const rows = heroRows();
      const n = rows.length;
      if (n === 0) {
        heroActiveIdx = -1;
      } else if (heroActiveIdx < 0) {
        // From the inactive sentinel, ArrowDown lands on the first row and
        // ArrowUp on the last — modulo on -1 would skip a row otherwise.
        heroActiveIdx = delta > 0 ? 0 : n - 1;
      } else {
        heroActiveIdx = (heroActiveIdx + delta + n) % n;
      }
      updateHeroActive(rows);
    };

    const selectHeroActive = () => {
      const rows = heroRows();
      let target = null;
      if (heroActiveIdx >= 0) {
        target = rows[heroActiveIdx];
      } else if (rows.length === 1) {
        target = rows[0];
      }
      if (target) chooseHeroRow(target);
    };

    heroSearch.addEventListener('keydown', (e) => {
      const isArrow = e.key === 'ArrowDown' || e.key === 'ArrowUp';
      // Re-open a closed dropdown when arrowing with an existing query (no retype needed)
      if (isArrow && !heroResults.classList.contains('open') && heroSearch.value.trim()) {
        e.preventDefault();
        reopenHeroDropdown(e.key);
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        moveHeroActive(1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        moveHeroActive(-1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        selectHeroActive();
      } else if (e.key === 'Escape') {
        closeHeroDropdown();
      }
    });

    document.addEventListener('mousedown', (e) => {
      if (!heroSearch.contains(e.target) && !heroResults.contains(e.target)) closeHeroDropdown();
    });

    // Ctrl/Cmd+K focuses the hero search (single source of truth for this shortcut).
    document.addEventListener('keydown', (e) => {
      if (!((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K'))) return;
      e.preventDefault();
      heroSearch.scrollIntoView({ behavior: 'smooth', block: 'center' });
      heroSearch.focus();
    });
  }

  if (typeof document !== 'undefined' && document.addEventListener) {
    document.addEventListener('DOMContentLoaded', () => initHeroSearch());
  }

  const api = { heroSearchMatches, boldMatch, initHeroSearch };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.HeroSearch = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
