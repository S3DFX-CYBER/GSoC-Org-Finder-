/* global ORGS, openModal, toggleCompare, toggleBookmark, renderOrgs, renderWatchlist, renderSelectedLanguages, renderCompare, renderCompareModal, MENTOR_DATA, CHANNEL_ICONS*//* exported openAnalytics, closeAnEvent, fetchAll, fetchModalGH, toggleCompareFromModal, openCompare, closeCompareEv, imgErr, toggleBookmark, toggleChip, resetFilters, closeModalEv, openIssuesPage, closeIssuesPage, fetchAllIssues, showMoreIssues */

// ══════════════════════════════════════════════
// GLOBAL STATE & COMPATIBILITY LAYER
// ══════════════════════════════════════════════
const bookmarkedSet = new Set(parseStoredBookmarks());
// Expose globals for external components (recommender, recommendation-ui, etc.)
globalThis.bookmarkedSet = bookmarkedSet;

const CATEGORY_META = {
  science: { className: 'bg-blue-100 text-blue-700', label: 'Science' },
  programming: { className: 'bg-violet-100 text-violet-700', label: 'Programming' },
  data: { className: 'bg-cyan-100 text-cyan-700', label: 'Data' },
  web: { className: 'bg-green-100 text-green-700', label: 'Web' },
  os: { className: 'bg-orange-100 text-orange-700', label: 'OS / Systems' },
  security: { className: 'bg-red-100 text-red-700', label: 'Security' },
  media: { className: 'bg-pink-100 text-pink-700', label: 'Media' },
  infra: { className: 'bg-yellow-100 text-yellow-700', label: 'Infrastructure' },
  ai: { className: 'bg-purple-100 text-purple-700', label: 'AI / ML' },
  dev: { className: 'bg-teal-100 text-teal-700', label: 'Dev Tools' },
  other: { className: 'bg-zinc-100 text-zinc-600', label: 'Other' },
};
globalThis.CATEGORY_META = CATEGORY_META;

const LANGUAGE_MAP = {
  'Python': ['python'],
  'JavaScript': ['javascript', 'js'],
  'TypeScript': ['typescript', 'ts'],
  'C/C++': ['c', 'c++'],
  'Java': ['java'],
  'Rust': ['rust'],
  'Go': ['go', 'golang'],
  'Ruby': ['ruby'],
  'Haskell': ['haskell'],
  'Scala': ['scala'],
  'ML/AI': ['machine learning', 'ml', 'ai', 'artificial intelligence'],
  'Robotics': ['robotics', 'robot', 'ros']
};
globalThis.LANGUAGE_MAP = LANGUAGE_MAP;

const UMBRELLA_ORGS = new Set([
  'Apache Software Foundation', 'CNCF', 'Eclipse Foundation', 'FOSSASIA', 'GNOME Foundation',
  'GNU Project', 'Jenkins', 'KDE Community', 'NumFOCUS', 'OpenMRS', 'openSUSE Project',
  'OWASP Foundation', 'The Linux Foundation', 'Wikimedia Foundation', 'AOSSIE', 'CERN-HSF',
  'CCExtractor Development', 'Blender Foundation', 'Open Robotics', 'JBoss Community',
  'The Honeynet Project', 'MetaBrainz Foundation Inc', 'OSGeo (Open Source Geospatial Foundation)',
  'SW360', 'DBpedia', 'LibreOffice', 'Oppia Foundation', 'Sugar Labs', 'Internet Archive',
  'VideoLAN', 'JdeRobot', 'Kubeflow', 'INCF', 'OpenAstronomy', 'Machine Learning for Science (ML4SCI)',
  'SageMath', 'National Resource for Network Biology (NRNB)', 'FOSSology', 'JabRef e.V.',
  'LabLua', 'Liquid Galaxy project', 'Free and Open Source Silicon Foundation',
]);

// ══════════════════════════════════════════════
// THEME & FOUC PROTECTION
// ══════════════════════════════════════════════
(function initTheme() {
  try {
    const saved = localStorage.getItem('theme') || 'light';
    document.documentElement.classList.toggle('dark', saved === 'dark');
    updateThemeIcon();
  } catch (e) {
    console.warn('Theme init failed:', e);
  }
})();

globalThis.toggleTheme = function () {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  updateThemeIcon();
};

function updateThemeIcon() {
  const btn = document.getElementById('themeToggleBtn');
  const icon = btn ? btn.querySelector('.material-symbols-outlined') : null;
  if (icon) {
    const isDark = typeof document.documentElement.classList.contains === 'function'
      ? document.documentElement.classList.contains('dark')
      : false;
    icon.textContent = isDark ? 'light_mode' : 'dark_mode';
    btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    btn.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
    btn.setAttribute('title', isDark ? 'Switch to light theme' : 'Switch to dark theme');
  }
}

// ══════════════════════════════════════════════
//  COUNTDOWN
// ══════════════════════════════════════════════
const OPEN_DATE=new Date('2026-03-16T00:00:00Z');
const CLOSE_DATE=new Date('2026-04-08T18:00:00Z');
// eslint-disable-next-line prefer-const
let cdTimer;
function updateCountdown(){
  const now=Date.now();
  const labelEl=document.getElementById('countdown-label');
  const countdownEl=document.getElementById('countdown');
  if(!labelEl||!countdownEl) return;
  let target=OPEN_DATE.getTime();
  let label='📅 GSoC 2026 Applications Open In';
  if(now>=OPEN_DATE.getTime()&&now<CLOSE_DATE.getTime()){
    target=CLOSE_DATE.getTime();
    label='🚀 Applications Are Open — Closes In';
  } else if(now>=CLOSE_DATE.getTime()){
    label='🎉 GSoC 2026 applications have closed. Stay tuned for accepted orgs!';
    countdownEl.textContent='';
    labelEl.textContent=label;
    if(cdTimer) clearInterval(cdTimer);
    return;
  }
  const diff=Math.max(0,target-now);
  const d=Math.floor(diff/86400000);
  const h=Math.floor((diff%86400000)/3600000);
  const m=Math.floor((diff%3600000)/60000);
  countdownEl.textContent=`${d}d ${h}h ${m}m`;
  labelEl.textContent=label;
}
updateCountdown();
cdTimer=setInterval(updateCountdown,1000);
// ══════════════════════════════════════════════
// ANALYTICS ENGINE
// ══════════════════════════════════════════════
const AN = {
  g(k, d) { try { return JSON.parse(localStorage.getItem('gaf_' + k)) ?? d; } catch { return d; } },
  s(k, v) {
    try {
      localStorage.setItem('gaf_' + k, JSON.stringify(v));
    } catch (err) {
      console.warn('Analytics storage write failed for key:', k, err);
    }
  },
  inc(k) { this.s(k, (this.g(k, 0) + 1)); },
  push(k, v, max = 20) { const a = this.g(k, []); a.unshift(v); this.s(k, a.slice(0, max)); },
  today() { return new Date().toISOString().slice(0, 10); },
  trackVisit() {
    this.inc('total');
    const td = this.today(), daily = this.g('daily', {});
    daily[td] = (daily[td] || 0) + 1; this.s('daily', daily);
    if (!sessionStorage.getItem('gaf_s')) sessionStorage.setItem('gaf_s', Date.now());
  },
  trackSearch(t) { if (t.length > 1) { this.inc('searches'); this.push('sterms', t.toLowerCase().trim()); } },
  trackCat(c) { if (c) { this.inc('filters'); const cf = this.g('cats', {}); cf[c] = (cf[c] || 0) + 1; this.s('cats', cf); } },
  trackOrg(n) { this.inc('views'); const oc = this.g('orgs', {}); oc[n] = (oc[n] || 0) + 1; this.s('orgs', oc); },
  todayVisits() { return this.g('daily', {})[this.today()] || 0; },
  sessionTime() {
    const s = sessionStorage.getItem('gaf_s'); if (!s) return '—';
    const sec = Math.floor((Date.now() - parseInt(s)) / 1000);
    return sec < 60 ? sec + 's' : Math.floor(sec / 60) + 'm' + (sec % 60) + 's';
  },
  topCats() { return Object.entries(this.g('cats', {})).sort((a, b) => b[1] - a[1]).slice(0, 6); },
  topOrgs() { return Object.entries(this.g('orgs', {})).sort((a, b) => b[1] - a[1]).slice(0, 5); },
  topTerms() { const f = {}; this.g('sterms', []).forEach(t => { f[t] = (f[t] || 0) + 1; }); return Object.entries(f).sort((a, b) => b[1] - a[1]).slice(0, 12); }
};
AN.trackVisit();

function renderTrending() {
  const top = AN.topOrgs();
  const sec = document.getElementById('trendingSection');
  const scroll = document.getElementById('trendingScroll');
  if (!top.length || !sec || !scroll) { if (sec) sec.style.display = 'none'; return; }
  sec.style.display = 'block';
  scroll.innerHTML = top.map(([name, views], i) => {
    const o = ORGS.find(x => x.name === name);
    if (!o) return '';
    return safeHTML`<div class="trend-card bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700" data-org-name="${o.name}">
      <div class="trend-rank">${String(i + 1)}</div>
      <div class="trend-info">
        <div class="trend-name">${name}</div>
        <div class="trend-views">${String(views)} view${views !== 1 ? 's' : ''} · ${getCategoryMeta(o.cat).label}</div>
      </div>
    </div>`;
  }).join('');
}

globalThis.openAnalytics = function () {
  const aTot = document.getElementById('aTot');
  if (!aTot) return;
  aTot.textContent = AN.g('total', 0).toLocaleString();
  document.getElementById('aToday').textContent = AN.todayVisits();
  document.getElementById('aSearches').textContent = AN.g('searches', 0);
  document.getElementById('aViews').textContent = AN.g('views', 0);
  document.getElementById('aFilters').textContent = AN.g('filters', 0);
  document.getElementById('aTime').textContent = AN.sessionTime();
  const tc = AN.topCats(), mx = tc[0]?.[1] || 1;
  document.getElementById('catChart').innerHTML = tc.length
    ? tc.map(([c, n]) => `<div class="bar-row"><span class="bar-lbl">${escapeHtml(getCategoryMeta(c).label)}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.round(n / mx * 100)}%"></div></div><span class="bar-val">${escapeHtml(String(n))}</span></div>`).join('')
    : '<span style="color:var(--muted);font-size:12px">Use category filters to track data</span>';
  const to = AN.topOrgs(), mo = to[0]?.[1] || 1;
  document.getElementById('orgChart').innerHTML = to.length
    ? to.map(([o, n]) => `<div class="bar-row"><span class="bar-lbl" style="font-size:10px">${escapeHtml(o.length > 16 ? o.slice(0, 16) + '…' : o)}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.round(n / mo * 100)}%"></div></div><span class="bar-val">${escapeHtml(String(n))}</span></div>`).join('')
    : '<span style="color:var(--muted);font-size:12px">Click org cards to track views</span>';
  const tt = AN.topTerms();
  document.getElementById('srchTerms').innerHTML = tt.length
    ? tt.map(([t, c], i) => `<span class="sch ${i < 3 ? 'hot' : ''}">${escapeHtml(t)} (${escapeHtml(String(c))})</span>`).join('')
    : '<span style="color:var(--muted);font-size:12px">No searches yet</span>';
  openModalElement('anBg');
};
globalThis.closeAnEvent = function (e) { if (e.target === document.getElementById('anBg')) closeModalElement('anBg'); };

// ══════════════════════════════════════════════
// URL VALIDATION & SANITIZATION HELPERS
// ══════════════════════════════════════════════
function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// Centralized DOM-Safe Dynamic Rendering
class SafeHTMLString extends String {
  constructor(value) {
    super(value);
  }
}
SafeHTMLString.prototype.__isSafeHTML = true;
// ══════════════════════════════════════════════
// ANALYTICS ENGINE
// ══════════════════════════════════════════════
function safeHTML(strings, ...values) {
  let result = '';
  for (let i = 0; i < strings.length; i++) {
    result += strings[i];
    if (i < values.length) {
      const val = values[i];
      if (val && val.__isSafeHTML) {
        result += val.toString();
      } else if (Array.isArray(val)) {
        result += val.map(v => (v && v.__isSafeHTML) ? v.toString() : escapeHtml(v)).join('');
      } else {
        result += escapeHtml(val !== undefined && val !== null ? String(val) : '');
      }
    }
  }
  return new SafeHTMLString(result);
}

function rawHTML(value) {
  return new SafeHTMLString(value || '');
}

globalThis.safeHTML = safeHTML;
globalThis.rawHTML = rawHTML;

function sanitizeHrefUrl(url) {
  if (!url || !String(url).trim()) return null;
  try {
    const u = new URL(String(url).trim());
    if (u.protocol === 'http:' || u.protocol === 'https:') return u.toString();
  } catch (err) {
    console.debug('Invalid URL or disallowed protocol in sanitizeHrefUrl:', url, err);
  }
  return null;
}

// ══════════════════════════════════════════════
// URL VALIDATION & SANITIZATION
// ══════════════════════════════════════════════
/**
 * Generic URL validator — ensures only http/https protocols are allowed.
 * Does NOT auto-prepend a protocol. The caller must pass a fully-formed URL.
 *
 * @param {string} url - A fully-formed URL string to validate
 * @returns {string|null} - The trimmed URL if valid, null otherwise
 */
function validateUrl(url) {
  if (!url || !url.trim()) return null;
  try {
    const trimmed = url.trim();
    const urlObj = new URL(trimmed);
    if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
      return trimmed;
    }
    console.warn('Rejected non-HTTP(S) URL:', url);
    return null;
  } catch (e) {
    console.warn('Invalid URL format:', url, e);
    return null;
  }
}

/**
 * Validates and sanitizes project ideas URLs for safe display.
 * Automatically prepends https:// if no protocol is specified.
 * Delegates to validateUrl() for the actual protocol check.
 *
 * @param {string} ideasUrl - The raw URL string from organization data
 * @returns {string|null} - Sanitized URL if valid, null otherwise
 */
function validateIdeasUrl(ideasUrl) {
  if (!ideasUrl || !ideasUrl.trim()) return null;
  let url = ideasUrl.trim();
  if (!url.includes('://')) {
    url = 'https://' + url;
  }
  return validateUrl(url);
}

// ══════════════════════════════════════════════
// TRENDING
// ══════════════════════════════════════════════
function getCategoryMeta(category) {
  return CATEGORY_META[category] || CATEGORY_META.other;
}

// ══════════════════════════════════════════════
// GITHUB API CLIENT
// ══════════════════════════════════════════════
const API = '/api/github';
const ghCache = (() => {
  try {
    return JSON.parse(localStorage.getItem('gaf_ghc') || '{}');
  } catch {
    return {};
  }
})();

function saveCache(key, value) {
  try {
    localStorage.setItem('gaf_ghc', JSON.stringify(ghCache));
  } catch (e) {
    if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
      console.warn('LocalStorage quota exceeded, clearing GitHub cache...');
      for (const k in ghCache) delete ghCache[k];
      if (key && value !== undefined) ghCache[key] = value;
      try {
        localStorage.setItem('gaf_ghc', JSON.stringify(ghCache));
      } catch (err) {
        console.error('Failed to save even after clearing cache', err);
      }
    }
  }
}

function cleanCache() {
  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;
  let changed = false;
  for (const key in ghCache) {
    const entry = ghCache[key];
    if (!entry || typeof entry.ts !== 'number' || Number.isNaN(entry.ts) || now - entry.ts > ONE_DAY) {
      delete ghCache[key];
      changed = true;
    }
  }
  if (changed) saveCache();
}
cleanCache();

const modalIdx=-1;
let lastSearch='';
const pills = globalThis.pills || new Set(AN.g('pills', []));
const chips = globalThis.chips || new Set(AN.g('chips', []));
const matchAllLanguages = globalThis.matchAllLanguages ?? false; // false = OR (any), true = AND (all)
// Expose to global scope for HTML onclick handlers and debugging
globalThis.pills = pills;
globalThis.chips = chips;
globalThis.matchAllLanguages = matchAllLanguages;
let focusedIdx=-1;

function updateAPIBanner(status) {
  const banner = document.getElementById('apiBanner');
  const strongEl = document.getElementById('apiStrong');
  const textEl = document.getElementById('apiText');
  const fetchBtn = document.getElementById('fetchBtn');

  const states = {
    ok: {
      className: 'api-banner api-ok',
      strong: '✓ GitHub API Connected',
      text: 'Live stats (stars, forks, good first issues) available for all visitors.',
      showFetch: true
    },
    warn: {
      className: 'api-banner api-warn',
      strong: '⚠ API Error',
      text: 'Add GITHUB_TOKEN in Vercel dashboard and redeploy.',
      showFetch: false
    },
    local: {
      className: null,
      strong: '○ Running Locally',
      text: 'Deploy to Vercel for live GitHub stats.',
      showFetch: false
    }
  };

  const s = states[status];
  if (banner && s.className) banner.className = s.className;
  if (strongEl) strongEl.textContent = s.strong;
  if (textEl) textEl.textContent = s.text;
  if (fetchBtn && s.showFetch) fetchBtn.style.display = 'flex';
}

async function checkAPI() {
  try {
    const r = await fetch(`${API}?repo=django/django`);
    updateAPIBanner(r.ok ? 'ok' : 'warn');
  } catch {
    updateAPIBanner('local');
  }
}

async function fetchGH(repo) {
  if (!repo) return null;
  if (ghCache[repo] && Date.now() - ghCache[repo].ts < 3600000) return ghCache[repo];
  try {
    const r = await fetch(`${API}?repo=${encodeURIComponent(repo)}`);
    if (!r.ok) return null;
    const d = await r.json();
    if (d.error) return null;
    d.ts = Date.now();
    ghCache[repo] = d;
    saveCache(repo, d);
    return d;
  } catch { return null; }
}

async function fetchGFI(repo) {
  if (!repo) return null;
  const cacheKey = repo + '__gfi';
  const hit = ghCache[cacheKey];
  if (hit && Date.now() - hit.ts < 3600000 && hit.count !== null && hit.count !== undefined) return hit.count;
  try {
    const r = await fetch(`${API}?repo=${encodeURIComponent(repo)}&gfi=1`);
    if (!r.ok) return null;
    const d = await r.json();
    if (d.gfi === null || d.gfi === undefined) return null;
    ghCache[cacheKey] = { count: d.gfi, ts: Date.now() };
    saveCache(cacheKey, ghCache[cacheKey]);
    return d.gfi;
  } catch { return null; }
}

// ══════════════════════════════════════════════
// MODAL & KEYBOARD CONTROLLER (ACCESSIBILITY HARDENED)
// ══════════════════════════════════════════════
let activeTriggerElement = null;

function openModalElement(modalId, triggerElement = null) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  activeTriggerElement = triggerElement || document.activeElement;

  if (modalId === 'mobileMenu') {
    modal.classList.remove('hidden');
    const panel = document.getElementById('menuPanel');
    if (panel) setTimeout(() => { panel.style.transform = 'translateX(0)'; }, 10);
    const menuBtn = document.getElementById('menuBtn');
    if (menuBtn) {
      menuBtn.setAttribute('aria-expanded', 'true');
      menuBtn.setAttribute('aria-label', 'Close menu');
    }
  }
}

async function fetchModalGH(){
  const o=ORGS[modalIdx];if(!o?.github)return;
  document.getElementById('mFetchBtn').textContent='Loading…';
  delete ghCache[o.github];
  delete ghCache[o.github+'__gfi'];
  const d=await fetchGH(o.github);
  if(d){
    o._gh=d;
    document.getElementById('ghStars').textContent=fmt(d.stars);
    document.getElementById('ghForks').textContent=fmt(d.forks);
    document.getElementById('ghIssues').textContent=fmt(d.issues);
    document.getElementById('ghCommit').textContent=d.lastCommit;
    document.getElementById('mFetchBtn').textContent='↻ Refresh';
    document.getElementById('ghGFI').textContent='…';
    const gfi=await fetchGFI(o.github);
    const gfiTxt=gfi!==null?fmt(gfi):'—';
    document.getElementById('ghGFI').textContent=gfiTxt;
    if(gfi!==null){
      o._gh.gfi=gfi;
      const cells=document.getElementById('mMetrics')?.querySelectorAll('.mv');
      if(cells&&cells[3])cells[3].textContent=gfiTxt;
    }
    applyFilters();
  }else document.getElementById('mFetchBtn').textContent='✗ Failed';
}

function fmt(n){
  if (!n && n !== 0) return '—';
  if (n >= 1000) return (n/1000).toFixed(1)+'k';
  return String(n);
}
// ══════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════
function cLbl(c){
  if (c==='hot') return '🔥 High';
  if (c==='moderate') return '🟡 Moderate';
  return '😎 Low';
}
function cBdg(c){
  if (c==='hot') return 'bh';
  if (c==='moderate') return 'bm';
  return 'bc';
}
function aBdg(a){
  if (a==='active') return 'bac';
  if (a==='moderate') return 'bam';
  if (a==='low') return 'bal';
  return 'bna';
}
function catLabel(c){return{science:'Science',programming:'Programming',data:'Data',web:'Web',os:'OS',security:'Security',media:'Media',infra:'Infra',ai:'AI',dev:'Dev Tools',other:'Other'}[c]||c;}
function catBdg(c){return'cb-'+(c||'other');}

// ══════════════════════════════════════════════
// COMPARE
// ══════════════════════════════════════════════
const compareList = globalThis.compareList || [];
globalThis.compareList = compareList;

    
function closeModalElement(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  if (modalId === 'mobileMenu') {
    const panel = document.getElementById('menuPanel');
    if (panel) panel.style.transform = 'translateX(-100%)';
    const menuBtn = document.getElementById('menuBtn');
    if (menuBtn) {
      menuBtn.setAttribute('aria-expanded', 'false');
      menuBtn.setAttribute('aria-label', 'Open menu');
    }
    setTimeout(() => { modal.classList.add('hidden'); }, 300);
  } else {
    modal.classList.remove('open');
  }

  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  document.documentElement.style.overflow = '';

  modal.removeEventListener('keydown', trapFocus);

  if (activeTriggerElement) {
    activeTriggerElement.focus();
    activeTriggerElement = null;
  }
}

function trapFocus(e) {
  if (e.key !== 'Tab') return;
  const modal = e.currentTarget;
  const focusables = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex="0"]');
  if (!focusables.length) return;

  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  if (e.shiftKey && document.activeElement === first) {
    last.focus();
    e.preventDefault();
  } else if (!e.shiftKey && document.activeElement === last) {
    first.focus();
    e.preventDefault();
  }
}

function toggleMenu() {
  const menu = document.getElementById('mobileMenu');
  if (menu) {
    if (menu.classList.contains('hidden')) {
      openModalElement('mobileMenu');
    } else {
      closeModalElement('mobileMenu');
    }
  }
}
globalThis.toggleMenu = toggleMenu;

function setActiveMenu(clickedLink) {
  const allLinks = document.querySelectorAll('.mobile-menu-link');
  allLinks.forEach(link => {
    link.classList.remove('text-orange-600', 'bg-orange-50', 'font-bold');
    link.classList.add('text-zinc-700', 'hover:bg-zinc-100', 'font-medium');
  });

  clickedLink.classList.remove('text-zinc-700', 'hover:bg-zinc-100', 'font-medium');
  clickedLink.classList.add('text-orange-600', 'bg-orange-50', 'font-bold');

  setTimeout(() => {
    closeModalElement('mobileMenu');
  }, 300);
}
globalThis.setActiveMenu = setActiveMenu;

// Keyboard grid card selection navigation
const GRID_COLS = () => {
  const g = document.getElementById('orgGrid');
  if (!g || !g.children.length) return 3;
  const firstRect = g.children[0].getBoundingClientRect();
  let cols = 1;
  for (let i = 1; i < g.children.length; i++) {
    if (Math.abs(g.children[i].getBoundingClientRect().top - firstRect.top) < 5) cols++;
    else break;
  }
  return cols;
};

function scrollToFocused() {
  setTimeout(() => {
    const g = document.getElementById('orgGrid');
    const card = g?.querySelector(`[data-filtered-idx="${focusedIdx}"]`);
    if (card) card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, 30);
}

function updateCardFocus() {
  const cards = document.querySelectorAll('#orgGrid article');
  cards.forEach((card, idx) => {
    const isFocused = idx === focusedIdx;
    card.classList.toggle('ring-2', isFocused);
    card.classList.toggle('ring-primary', isFocused);
  });
}

// Global keydown helper functions to manage Cognitive Complexity
function handleEscapeKey(e) {
  const activeModal = document.querySelector('.modal-bg.open, #mobileMenu:not(.hidden), .modal-bg.compare-bg.open');
  if (activeModal) {
    e.preventDefault();
    closeModalElement(activeModal.id);
    return true;
  }
  return false;
}

function handleNavigationRight(e, n) {
  e.preventDefault();
  focusedIdx = Math.min(focusedIdx + 1, n - 1);
  if (focusedIdx < 0) focusedIdx = 0;
  const vc = globalThis.visibleCount || 12;
  if (focusedIdx >= vc) {
    globalThis.visibleCount = Math.min(vc + 12, n);
    renderOrgs(false);
  }
  scrollToFocused();
  updateCardFocus();
}

function handleNavigationLeft(e) {
  e.preventDefault();
  focusedIdx = Math.max(focusedIdx - 1, 0);
  scrollToFocused();
  updateCardFocus();
}

function handleNavigationDown(e, n) {
  e.preventDefault();
  const cols = GRID_COLS();
  focusedIdx = Math.min(focusedIdx + cols, n - 1);
  if (focusedIdx < 0) focusedIdx = 0;
  const vc = globalThis.visibleCount || 12;
  if (focusedIdx >= vc) {
    globalThis.visibleCount = Math.min(vc + 12, n);
    renderOrgs(false);
  }
  scrollToFocused();
  updateCardFocus();
}

function handleNavigationUp(e) {
  e.preventDefault();
  const cols = GRID_COLS();
  focusedIdx = Math.max(focusedIdx - cols, 0);
  scrollToFocused();
  updateCardFocus();
}

function handleGlobalKeydown(e) {
  if (e.key === 'Escape' && handleEscapeKey(e)) return;
  if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
  const n = (globalThis.filteredOrgs || []).length;
  if (e.key === '?') {
    e.preventDefault();
    openModalElement('helpModal');
    return;
  }
  if (e.key === '/') {
    e.preventDefault();
    document.getElementById('searchInput')?.focus();
    return;
  }
  if (n <= 0) return;
  switch (e.key) {
    case 'ArrowRight': handleNavigationRight(e, n); break;
    case 'ArrowLeft': handleNavigationLeft(e); break;
    case 'ArrowDown': handleNavigationDown(e, n); break;
    case 'ArrowUp': handleNavigationUp(e); break;
    case 'Enter':
      if (focusedIdx >= 0 && focusedIdx < n) {
        e.preventDefault();
        openModal((globalThis.filteredOrgs || [])[focusedIdx]?.name);
      }
      break;
    case 'c':
    case 'C':
      if (focusedIdx >= 0 && focusedIdx < n) {
        e.preventDefault();
        if (typeof toggleCompare === 'function') toggleCompare(null, (globalThis.filteredOrgs || [])[focusedIdx]?.name);
      }
      break;
  }
}

function _renderCompareTable() {
  const wrap = document.getElementById('compareTableWrap');
  if (!wrap) return;
  const arr = (globalThis.compareList || [])
    .map(name => ORGS.find(o => o.name === name))
    .filter(Boolean);
  if (arr.length < 2) {
    wrap.innerHTML = '<div class="compare-hint">Select at least 2 organizations to compare.</div>';
    return;
  }
  const rows = [
    {label:'Category', vals:arr.map(o=>o.cat), type:'text'},
    {label:'GSoC Years', vals:arr.map(o=>o.years), type:'bar', max:11, best:'high'},
    {label:'Since', vals:arr.map(o=>o.firstYear), type:'text'},
    {label:'Competition', vals:arr.map(o=>o.competition), scores:arr.map(o=>({hot:3,moderate:2,chill:1})[o.competition]||0), type:'scored', best:'low'},
    {label:'Languages', vals:arr.map(o=>o.tags.slice(0,3).join(', ')), type:'text'},
  ];
  const thCells = arr.map(o => {
    const name = o.name.length > 22 ? o.name.slice(0, 22) + '…' : o.name;
    return `<th>${escapeHtml(name)}</th>`;
  }).join('');
  const thead = `<tr><th>Metric</th>${thCells}</tr>`;
  let tbody = '';
  for (const row of rows) {
    let cells = '';
    if (row.type === 'bar') {
      const mx = Math.max(...row.vals);
      cells = row.vals.map(v => {
        const pct = mx > 0 ? Math.round(v / mx * 100) : 0;
        return `<td><div class="cmp-bar-wrap"><div class="cmp-bar-track"><div class="cmp-bar-fill" style="width:${pct}%"></div></div><span class="cmp-val">${escapeHtml(String(v))}y</span></div></td>`;
      }).join('');
    } else if (row.type === 'scored' && row.scores && row.scores.some(s => s > 0)) {
      const mx = Math.max(...row.scores);
      const mn = Math.min(...row.scores.filter(s => s > 0));
      cells = row.vals.map((v, i) => {
        const s = row.scores[i];
        let cls = 'cmp-val';
        if (s > 0) {
          if (row.best === 'high') {
            cls = s === mx ? 'cmp-best' : s === mn ? 'cmp-worst' : 'cmp-val';
          } else {
            cls = s === mn ? 'cmp-best' : s === mx ? 'cmp-worst' : 'cmp-val';
          }
        }
        return `<td class="${cls}">${escapeHtml(String(v))}</td>`;
      }).join('');
    } else {
      cells = row.vals.map(v => `<td class="cmp-val">${escapeHtml(String(v))}</td>`).join('');
    }
    tbody += `<tr><td class="row-label">${escapeHtml(row.label)}</td>${cells}</tr>`;
  }
  wrap.innerHTML = `<table class="compare-table"><thead>${thead}</thead><tbody>${tbody}</tbody></table>`;
}

function _showCompareToast(msg){
  let t=document.getElementById('compareToast');
  if(!t){t=document.createElement('div');t.id='compareToast';t.style.cssText='position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--ink);color:var(--bg);padding:10px 18px;border-radius:8px;font-size:12px;font-weight:700;z-index:999;transition:opacity .3s;white-space:nowrap';document.body.appendChild(t);}
  t.textContent=msg;t.style.opacity='1';
  setTimeout(()=>t.style.opacity='0',2200);
}

function _showSkeletons(count = 12) {
  const grid = document.getElementById('orgGrid');
  if (!grid) return;
  grid.innerHTML = Array.from({ length: count }, () => `
    <div class="skeleton-card" aria-hidden="true">
      <div class="skeleton-head">
        <div class="skeleton-logo"></div>
        <div class="skeleton-lines">
          <div class="skeleton-line skeleton-title"></div>
          <div class="skeleton-line skeleton-subtitle"></div>
        </div>
      </div>
      <div class="skeleton-line skeleton-body"></div>
      <div class="skeleton-tags">
        <div class="skeleton-pill"></div>
        <div class="skeleton-pill"></div>
        <div class="skeleton-pill"></div>
      </div>
    </div>
  `).join('');
}

// ══════════════════════════════════════════════
// FILTER & RENDER
// ══════════════════════════════════════════════

function _normalizeTag(value) {
  return value.trim().toLowerCase();
}


function matchesChips(o, chipSet) {
  if (chipSet.has('bookmarked') && !bookmarkedSet.has(o.name)) return false;
  if (chipSet.has('veteran') && o.years < 8) return false;
  if (chipSet.has('newcomer') && o.years > 3) return false;
  if (chipSet.has('hot') && o.competition !== 'hot') return false;
  if (chipSet.has('chill') && o.competition !== 'chill') return false;
  if (chipSet.has('active') && o._gh?.activity !== 'active') return false;
  return true;
}

function matchesFilters(o, search, cat, compF, lang) {
  if (cat && o.cat !== cat) return false;
  if (compF && compF !== 'all' && o.codebase !== compF) return false;
  if (lang) {
    const langLabel = Object.keys(LANGUAGE_MAP).find(label => label.toLowerCase() === lang) || lang;
    if (!orgMatchesLanguages(o, new Set([langLabel]))) return false;
  }
  if (search && !o.name.toLowerCase().includes(search)) return false;
  if (pills.size > 0 && !orgMatchesLanguages(o, pills)) {
    return false;
  }
  const chipSet = globalThis.chips || new Set();
  if (!matchesChips(o, chipSet)) return false;
  return true;
}

function sortOrgsWithRanking(res, search, sort) {
  if (!search) {
    return res.sort((a, b) => applySecondarySort(a, b, sort));
  }

  return res.sort((a, b) => {
    const nameA = a.name.toLowerCase();
    const nameB = b.name.toLowerCase();
    
    if (nameA === search && nameB !== search) return -1;
    if (nameB === search && nameA !== search) return 1;
    
    if (nameA.startsWith(search) && !nameB.startsWith(search)) return -1;
    if (nameB.startsWith(search) && !nameA.startsWith(search)) return 1;
    
    return applySecondarySort(a, b, sort);
  });
}

function syncFiltersToURL(search, cat, compF, lang, sort) {
  const params = new URLSearchParams();
  if (search) params.set('q', search);
  if (cat) params.set('cat', cat);
  if (compF && compF !== 'all') params.set('comp', compF);
  
  const urlChipSet = globalThis.chips || new Set();
  if (urlChipSet.size > 0) params.set('chip', [...urlChipSet][0]);
  
  let selectedLangs;
  if (pills.size) selectedLangs = [...pills];
  else if (lang) selectedLangs = [lang];
  else selectedLangs = [];
  if (selectedLangs.length) params.set('lang', selectedLangs.join(','));
  if (sort && sort !== 'alpha') params.set('sort', sort);
  
  history.replaceState(null, '', params.toString() ? '?' + params.toString() : location.pathname);
}

function applyFilters() {
  if (applyFilters._running) { console.warn('applyFilters called recursively!'); return; }
  applyFilters._running = true;
  try {
    const search = (document.getElementById('searchInput')?.value || '').trim().toLowerCase();
    const categoryValue = document.getElementById('categoryFilter')?.value || '';
    const cat = categoryValue === 'all' ? '' : categoryValue;
    const lang = document.getElementById('langFilter')?.value?.toLowerCase() || '';
    const compF = document.getElementById('complexityFilter')?.value || '';
    const sort = document.getElementById('sortSelect')?.value || 'alpha';

    // Analytics Tracking
    if (search !== lastSearch && search.length > 1) {
      AN.trackSearch(search);
      lastSearch = search;
    }
    if (cat) AN.trackCat(cat);

    // Filter Step
    const res = ORGS.filter(o => matchesFilters(o, search, cat, compF, lang));
    // Sort Step (Now handled cleanly by our helper)
    sortOrgsWithRanking(res, search, sort);

    // State Management & Rendering
    globalThis.filteredOrgs = res;
    focusedIdx = -1;
    if (typeof renderOrgs === 'function') renderOrgs(true);

    // Sync to URL (Now handled cleanly by our helper)
    syncFiltersToURL(search, cat, compF, lang, sort);
  }
  finally {
    applyFilters._running = false;
  }
}

function applySecondarySort(a, b, sortType) {
  if(sortType==='years-desc') return b.years - a.years;
  if(sortType==='years-asc') return a.years - b.years;
  if(sortType==='comp-low') return ['chill','moderate','hot'].indexOf(a.competition) - ['chill','moderate','hot'].indexOf(b.competition);
  if(sortType==='stars') return (b._gh?.stars||0) - (a._gh?.stars||0);
  if(sortType==='gfi') return (b._gh?.gfi||0) - (a._gh?.gfi||0);
  return a.name.localeCompare(b.name);
}

function orgLogoOwner(o){
  return githubOwnerFromValue(o.github);
}
function trimGitHubPathSlashes(path){
  let start=0;
  let end=path.length;
  while(start<end&&path[start]==='/')start+=1;
  while(end>start&&path[end-1]==='/')end-=1;
  return path.slice(start,end);
}
function githubPathFromValue(value){
  const github=String(value||'').trim();
  if(!github)return'';
  try{
    const url=new URL(github);
    const hostname=url.hostname.toLowerCase();
    if(hostname!=='github.com'&&hostname!=='www.github.com')return'';
    return trimGitHubPathSlashes(url.pathname);
  }catch{
    return trimGitHubPathSlashes(github);
  }
}

// Global keydown short-router
document.addEventListener('keydown', handleGlobalKeydown);

// ══════════════════════════════════════════════
// BOOKMARK SYSTEM (WATCHLIST)
// ══════════════════════════════════════════════
function parseStoredBookmarks() {
  try {
    const parsed = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function syncBookmark(name, shouldAdd) {
  if (!name) return;
  if (shouldAdd) bookmarkedSet.add(name);
  else bookmarkedSet.delete(name);
  localStorage.setItem('bookmarks', JSON.stringify([...bookmarkedSet]));

  refreshOrgGridAfterBookmarkChange();
  renderWatchlist();
  updateAIInsights();
}

globalThis.toggleBookmark = function (e, name) {
  if (e) e.stopPropagation();
  if (!name) return;
  syncBookmark(name, !bookmarkedSet.has(name));
};

function refreshOrgGridAfterBookmarkChange() {
  const chipSet = globalThis.chips || new Set();
  if (chipSet.has('bookmarked')) {
    const res = ORGS.filter(o => globalThis.bookmarkedSet.has(o.name));
    globalThis.filteredOrgs = res;
    if (typeof renderOrgs === 'function') renderOrgs(true);
    return;
  }
  if (typeof renderSelectedLanguages === 'function') renderSelectedLanguages();
  applyFilters();
}

function clearAllBookmarks() {
  if (!bookmarkedSet.size) return;
  if (!confirm(`Remove all ${bookmarkedSet.size} bookmarked organization(s)? This cannot be undone.`)) return;
  bookmarkedSet.clear();
  localStorage.setItem('bookmarks', JSON.stringify([]));
  applyFilters();
  renderWatchlist();
  updateAIInsights();
}
document.getElementById('clearAllBookmarksBtn')?.addEventListener('click', clearAllBookmarks);

function _renderGfiBadge(gh){
  if(gh?.gfi===null||gh?.gfi===undefined)return '';
  return `<span class="gh-s">🟢 <b>${escapeHtml(fmt(gh.gfi))} GFI</b></span>`;
}
// ══════════════════════════════════════════════
// PILLS & CHIPS
// ══════════════════════════════════════════════
globalThis.openCompareModal = function () {
  renderCompare();
  renderCompareModal();
  openModalElement('compareModal');
};

function closeCompareModal() {
  closeModalElement('compareModal');
}
globalThis.closeCompareModal = closeCompareModal;

// ══════════════════════════════════════════════
// FILTER & CARD DIRECTORY RENDERING
// ══════════════════════════════════════════════
function orgMatchesLanguages(org, selectedLanguages) {
  if (!selectedLanguages.size) return true;
  const orgTags = new Set((org.tags || []).map(t => t.trim().toLowerCase()));

  if (matchAllLanguages) {
    return [...selectedLanguages].every(label => {
      const aliases = (LANGUAGE_MAP[label] || [label]).map(a => a.trim().toLowerCase());
      return aliases.some(alias => orgTags.has(alias));
    });
  } else {
    return [...selectedLanguages].some(label => {
      const aliases = (LANGUAGE_MAP[label] || [label]).map(a => a.trim().toLowerCase());
      return aliases.some(alias => orgTags.has(alias));
    });
  }
}

const chipCls={veteran:'cv',newcomer:'cn',hot:'ch',chill:'cc',active:'ca', bookmarked:'cb'};
const _CHIP_TOOLTIPS = {
  veteran: 'Organizations that participated in GSoC for many years',
  newcomer: 'Good for first-time contributors and beginners',
  hot: 'Highly competitive organizations with many applicants',
  chill: 'Organizations with relatively fewer applicants',
  active: 'Organizations with recent GitHub activity',
  bookmarked: 'Organizations you saved for later'
};
// ══════════════════════════════════════════════
// MODAL
// ══════════════════════════════════════════════
function handleImgError(img, orgName) {
  if (img.dataset.triedClearbit) {
    img.style.display = 'none';
    const placeholder = img.parentElement.querySelector('.logo-placeholder');
    if (placeholder) {
      placeholder.style.display = 'flex';
      placeholder.textContent = orgName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }
  } else {
    img.dataset.triedClearbit = 'true';
    const domain = orgName.toLowerCase().replace(/[^a-z0-9]/g, '') + '.org';
    img.src = `https://logo.clearbit.com/${domain}`;
  }
}

// Global capturing image error event listener to replace inline onerror attributes
if (typeof document !== 'undefined' && document.addEventListener) {
  document.addEventListener('error', (event) => {
    if (event.target && event.target.tagName === 'IMG') {
      const img = event.target;
      const orgName = img.dataset.orgName;
      if (orgName) {
        const isRec = img.classList.contains('rec-logo') || img.closest('#aiResultsContainer');
        if (isRec && typeof globalThis.handleRecImgError === 'function') {
          globalThis.handleRecImgError(img, orgName);
        } else {
          handleImgError(img, orgName);
        }
      } else if (img.classList.contains('issue-logo')) {
        img.style.display = 'none';
      }
    }
  }, true);
}

globalThis.clearAllFilters = function () {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.value = '';
  const heroSearch = document.getElementById('hero-search');
  if (heroSearch) heroSearch.value = '';

  const categoryFilter = document.getElementById('categoryFilter');
  if (categoryFilter) categoryFilter.value = 'all';
  const complexityFilter = document.getElementById('complexityFilter');
  if (complexityFilter) complexityFilter.value = 'all';
  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) sortSelect.value = 'alpha';

  // Reset chips
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.classList.remove('bg-orange-600', 'text-white');
    chip.classList.add('bg-surface-container-highest');
  });

  if (globalThis.chips) globalThis.chips.clear();
  AN.s('chips', []);
  // Clear persisted filter values so reload doesn't restore them
  AN.s('cat', 'all');
  AN.s('sort', 'alpha');
  AN.s('complexity', 'all');
  AN.s('pills', []);
  if (globalThis.pills) globalThis.pills.clear();
  document.querySelectorAll('.pill.active').forEach(p => {
    p.classList.remove('active');
    p.setAttribute('aria-pressed', 'false');
  });

  if (typeof renderSelectedLanguages === 'function') renderSelectedLanguages();  
  history.replaceState(null, '', location.pathname);
  applyFilters();
};

// ══════════════════════════════════════════════
// LIVE GITHUB STATS - API INTEGRATED FLOW
// ══════════════════════════════════════════════
function _updateModalGHStats(org, d, gfi) {
  org._gh = d;
  const mStars = document.getElementById('mStars');
  const mForks = document.getElementById('mForks');
  const mIssues = document.getElementById('mIssues');
  const mActivity = document.getElementById('mActivity');

  if (mStars) mStars.textContent = fmt(d.stars);
  if (mForks) mForks.textContent = fmt(d.forks);
  if (mIssues) mIssues.textContent = fmt(d.issues);
  if (mActivity) {
    const act = d.activity || 'moderate';
    mActivity.textContent = act.charAt(0).toUpperCase() + act.slice(1);
    mActivity.className = act === 'active' || act === 'high' || act === 'hot' ? 'gh-stat-item text-green-500' : 'gh-stat-item text-blue-400';
  }

  if (gfi !== null) {
    org._gh.gfi = gfi;
    const placeholders = document.querySelectorAll('.metric-card #mGfiPlaceholder');
    placeholders.forEach(p => p.textContent = fmt(gfi));
  }
}

// ══════════════════════════════════════════════
// MODAL DETAILS POPULATOR
// ══════════════════════════════════════════════
globalThis.openModal = function (name, triggerElement = null) {
  const org = ORGS.find(o => o.name === name);
  if (!org) return;

  AN.trackOrg(org.name);

  const mHeader = document.getElementById('mHeader');
  if (mHeader) {
    const category = getCategoryMeta(org.cat);
    mHeader.innerHTML = safeHTML`
      <span class="category-tag text-[10px] font-label font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${category.className}">${category.label}</span>
      <h2 id="orgModalTitle" class="text-2xl font-bold font-headline mt-2">${org.name}</h2>
      <p class="text-zinc-500 text-xs mt-1">GSoC Partner for ${String(org.years)} Years</p>
    `;
  }

  const mDesc = document.getElementById('mDesc');
  if (mDesc) mDesc.textContent = org.desc;

  const cc = { hot: 'var(--red)', moderate: '#92600A', chill: 'var(--green)' };
  const mMetrics = document.getElementById('mMetrics');
  if (mMetrics) {
    const yearsColor = org.years >= 8 ? '#C2410C' : org.years >= 4 ? 'var(--blue)' : 'var(--purple)';
    const competitionColor = cc[org.competition] || '#ccc';
    const competitionIcon = org.competition === 'hot' ? '🔥' : org.competition === 'moderate' ? '🟡' : '😎';
    mMetrics.innerHTML = safeHTML`
      <div class="metric-card"><p class="metric-value" style="color:${yearsColor}">${String(org.years)}</p><p class="metric-label">Years In</p></div>
      <div class="metric-card"><p class="metric-value" style="color:${competitionColor}">${competitionIcon}</p><p class="metric-label">Competition</p></div>
      <div class="metric-card"><p class="metric-value font-mono text-sm" style="color:var(--orange)">${String(org.firstYear)}</p><p class="metric-label">First Year</p></div>
      <div class="metric-card"><p class="metric-value font-mono text-sm" style="color:var(--green)" id="mGfiPlaceholder">—</p><p class="metric-label">Good 1st Issues</p></div>
    `;
  }

  const gh = org._gh;
  const mStars = document.getElementById('mStars');
  const mForks = document.getElementById('mForks');
  const mIssues = document.getElementById('mIssues');
  const mActivity = document.getElementById('mActivity');

  if (mStars) mStars.textContent = gh ? fmt(gh.stars) : '—';
  if (mForks) mForks.textContent = gh ? fmt(gh.forks) : '—';
  if (mIssues) mIssues.textContent = gh ? fmt(gh.issues) : '—';
  if (mActivity) {
    const act = gh ? (gh.activity || 'moderate') : 'moderate';
    mActivity.textContent = act.charAt(0).toUpperCase() + act.slice(1);
    mActivity.className = act === 'active' || act === 'high' || act === 'hot' ? 'gh-stat-item text-green-500' : 'gh-stat-item text-blue-400';
  }

  if (gh && gh.gfi !== undefined) {
    const placeholders = document.querySelectorAll('.metric-card #mGfiPlaceholder');
    placeholders.forEach(p => p.textContent = fmt(gh.gfi));
  }

  const mFetchBtn = document.getElementById('mFetchBtn');
  if (mFetchBtn) mFetchBtn.textContent = gh ? '↻ Refresh' : 'Fetch Live Stats';

  const mTech = document.getElementById('mTech');
  if (mTech) mTech.innerHTML = org.tags.map(t => safeHTML`<span class="tech-tag">${t}</span>`).join('');

  const mFit = document.getElementById('mFit');
  if (mFit) mFit.innerHTML = org.fit.map(f => safeHTML`<span class="fit-tag">${f}</span>`).join('');

  // Timeline list
  let timelineHtml = '';
  for (let y = 2020; y <= 2026; y++) {
    const active = (y >= org.firstYear);
    timelineHtml += `<span class="${y === 2026 ? 'current-year' : ''} ${active ? 'opacity-100' : 'opacity-30'}">${y}</span>`;
  }
  const mTimeline = document.getElementById('mTimeline');
  if (mTimeline) mTimeline.innerHTML = timelineHtml;

  // Sanitize href links
  const ideasUrl = validateIdeasUrl(org.ideas);
  const repoHref = githubUrlFromValue(org.github);

  const ideasBtn = document.getElementById('mIdeasBtn');
  const repoBtn = document.getElementById('mRepoBtn');

  if (ideasBtn) {
    if (ideasUrl) {
      ideasBtn.href = ideasUrl;
      ideasBtn.style.display = 'inline-flex';
    } else {
      ideasBtn.removeAttribute('href');
      ideasBtn.style.display = 'none';
    }
  }

  if (repoBtn) {
    if (repoHref) {
      repoBtn.href = repoHref;
      repoBtn.style.display = 'inline-flex';
    } else {
      repoBtn.removeAttribute('href');
      repoBtn.style.display = 'none';
    }
  }

  // Copy Ideas Button
  const oldCopy = document.getElementById('mIdeasCopyBtn');
  if (oldCopy) oldCopy.remove();
  if (org.ideas && ideasBtn) {
    const copyBtn = document.createElement('button');
    copyBtn.id = 'mIdeasCopyBtn';
    copyBtn.innerHTML = '<span class="material-symbols-outlined text-lg">content_copy</span> Copy Link';
    copyBtn.className = 'modal-cta modal-repo-link flex items-center justify-center gap-2';
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(org.ideas).then(() => {
        copyBtn.innerHTML = '<span class="material-symbols-outlined text-lg">check_circle</span> Copied!';
        copyBtn.style.background = '#dcfce7';
        copyBtn.style.color = '#166534';
        setTimeout(() => {
          copyBtn.innerHTML = '<span class="material-symbols-outlined text-lg">content_copy</span> Copy Link';
          copyBtn.style.background = '';
          copyBtn.style.color = '';
        }, 2000);
      });
    });
    ideasBtn.after(copyBtn);
  }

  renderMentorContactSection(org);
  openModalElement('orgModal', triggerElement);

  // Lazily retrieve GFIs if missing
  if (org.github && (org._gh?.gfi === null || org._gh?.gfi === undefined)) {
    const placeholder = document.getElementById('mGfiPlaceholder');
    if (placeholder) placeholder.textContent = '…';
    fetchGFI(org.github).then(gfi => {
      if (gfi !== null) {
        if (!org._gh) org._gh = {};
        org._gh.gfi = gfi;
        const placeholders = document.querySelectorAll('.metric-card #mGfiPlaceholder');
        placeholders.forEach(p => p.textContent = fmt(gfi));
        renderOrgs(false);
        renderCompareModal();
      } else {
        const placeholders = document.querySelectorAll('.metric-card #mGfiPlaceholder');
        placeholders.forEach(p => p.textContent = '—');
      }
    });
  }
};

function closeModal() {
  closeModalElement('orgModal');
}
globalThis.closeModal = closeModal;

function closeHelpModal() {
  closeModalElement('helpModal');
}
globalThis.closeHelpModal = closeHelpModal;

globalThis.openRandomOrg = function () {
  const orgsToUse = globalThis.filteredOrgs.length > 0 ? globalThis.filteredOrgs : ORGS;
  if (!orgsToUse.length) {
    alert('No organizations match your filters — try clearing some!');
    return;
  }
  const array = new Uint32Array(1);
  globalThis.crypto.getRandomValues(array);
  const randomIdx = array[0] % orgsToUse.length;
  openModal(orgsToUse[randomIdx].name);
};

// ══════════════════════════════════════════════
// DYNAMIC GOOD FIRST ISSUES (INDEX PAGE GRID)
// ══════════════════════════════════════════════
async function renderGoodFirstIssues() {
  try {
    const res = await fetch('/data/issues.json?v=' + Date.now());
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const container = document.querySelector('#issues .grid');
    if (!container) return;
    const issues = Array.isArray(data.issues) ? data.issues : [];
    const lastUpdatedEl = document.getElementById('issuesLastUpdated');
    if (lastUpdatedEl) {
      if (data.updated_at) {
        const mins = Math.max(1, Math.floor((Date.now() - new Date(data.updated_at).getTime()) / 60000));
        const relative = mins < 60 ? `${mins} min ago` : `${Math.floor(mins / 60)} hours ago`;
        lastUpdatedEl.textContent = `Last updated: ${relative}`;
      } else {
        lastUpdatedEl.textContent = 'Last updated: unavailable';
      }
    }

    if (!issues.length) {
      renderFallbackOrgSearchCards(container);
      return;
    }

    container.innerHTML = '';
    issues.slice(0, 6).forEach(issue => {
      const card = document.createElement('div');
      card.className = 'bg-white dark:bg-zinc-900 rounded-xl p-5 border border-zinc-100 dark:border-zinc-800 hover:shadow-lg transition-all group cursor-pointer';

      const safeUrl = sanitizeHrefUrl(issue.url);
      if (safeUrl) card.addEventListener?.('click', () => window.open(safeUrl, '_blank'));

      const labelsHtml = (issue.labels || []).slice(0, 2)
        .map(l => safeHTML`<span class="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded font-bold">${l}</span>`);
      card.innerHTML = safeHTML`
        <div class="flex items-start justify-between mb-3">
          <h4 class="font-bold text-sm group-hover:text-primary transition-colors line-clamp-1 dark:text-zinc-100">${issue.title || ''}</h4>
          <span class="material-symbols-outlined text-zinc-300 group-hover:text-primary text-lg">open_in_new</span>
        </div>
        <p class="text-xs text-zinc-500 mb-3 font-mono">${issue.repo || ''}</p>
        <div class="flex flex-wrap gap-1.5">
          ${labelsHtml}
          <span class="text-[10px] px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded">${String(issue.comments || 0)} comments</span>
        </div>`;
      container.appendChild(card);
    });
  } catch (e) {
    console.error("GFI render failed:", e);
    const container = document.querySelector('#issues .grid');
    if (container) {
      container.innerHTML = `
        <div class="col-span-full bg-white rounded-xl p-8 border border-zinc-100 text-center">
          <p class="text-sm font-bold text-zinc-900 mb-2">Unable to load pre-fetched issues</p>
          <p class="text-sm text-zinc-600 max-w-xl mx-auto">Cached issue data could not be retrieved at this time. Please refresh the page or try again later.</p>
        </div>`;
    }
  }
}

function renderFallbackOrgSearchCards(container) {
  if (typeof document.createElement !== 'function') return;
  const orgsWithGithub = ORGS.filter(o => typeof o.github === 'string' && o.github.trim());
  container.innerHTML = '';

  const notice = document.createElement('p');
  notice.className = 'col-span-full text-sm text-zinc-500';
  notice.textContent = 'Live pre-fetched issues are still syncing. Browse open Good First Issues for all organizations below.';
  container.appendChild(notice);

  orgsWithGithub.forEach(org => {
    const card = document.createElement('a');
    card.href = `https://github.com/issues?q=${encodeURIComponent(`repo:${org.github} is:issue is:open label:"good first issue"`)}`;
    card.target = '_blank';
    card.rel = 'noopener noreferrer';
    card.className = 'bg-white dark:bg-zinc-900 rounded-xl p-5 border border-zinc-100 dark:border-zinc-800 hover:shadow-lg transition-all group cursor-pointer block';
    card.innerHTML = safeHTML`
      <div class="flex items-start justify-between mb-3">
        <h4 class="font-bold text-sm group-hover:text-primary transition-colors line-clamp-1 dark:text-zinc-100">Browse open Good First Issues</h4>
        <span class="material-symbols-outlined text-zinc-300 group-hover:text-primary text-lg">open_in_new</span>
      </div>
      <p class="text-xs text-zinc-500 mb-3 font-mono">${org.github}</p>
      <div class="flex flex-wrap gap-1.5">
        <span class="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded font-bold">${org.name}</span>
        <span class="text-[10px] px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded">Label: good first issue</span>
      </div>`;
    container.appendChild(card);
  });
}

// ══════════════════════════════════════════════
// AI WATCHLIST INSIGHTS GENERATOR
// ══════════════════════════════════════════════
function updateAIInsights() {
  const el = document.getElementById('aiInsightText');
  if (!el) return;

  const bookmarks = [...bookmarkedSet]
    .map(name => ORGS.find(o => o.name === name))
    .filter(Boolean);

  if (bookmarks.length === 0) {
    el.textContent = 'Star organizations to get personalized contribution advice.';
    return;
  }

  // 1. Category frequency
  const catCount = {};
  bookmarks.forEach(o => { catCount[o.cat] = (catCount[o.cat] || 0) + 1; });
  const topCat = Object.entries(catCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'other';

  // 2. Tag frequency (top 3)
  const tagCount = {};
  bookmarks.flatMap(o => o.tags || []).forEach(t => {
    const key = t.toLowerCase().trim();
    tagCount[key] = (tagCount[key] || 0) + 1;
  });
  const topTags = Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([t]) => t);

  // 3. Competition blend
  const compCount = { hot: 0, moderate: 0, chill: 0 };
  bookmarks.forEach(o => { if (compCount[o.competition] !== undefined) compCount[o.competition]++; });
  const highComp = compCount.hot >= bookmarks.length * 0.5;
  const lowComp = compCount.chill >= bookmarks.length * 0.5;

  // Domain-specific tool recommendations
  const DOMAIN_ADVICE = {
    ai: { tools: 'PyTorch, TensorFlow, Hugging Face, or scikit-learn', action: 'contribute to model training pipelines or evaluation utilities' },
    data: { tools: 'Pandas, Apache Spark, DuckDB, or dbt', action: 'look for data pipeline, ETL, or visualisation issues' },
    science: { tools: 'NumPy, SciPy, Astropy, or ROOT', action: 'explore numerical computation or simulation-related tickets' },
    security: { tools: 'Metasploit, Wireshark, OpenSSL, or OWASP tooling', action: 'hunt for documentation or testing improvements in security repos' },
    infra: { tools: 'Kubernetes, Terraform, Prometheus, or Ansible', action: 'target CI/CD configuration, observability, or deployment issues' },
    web: { tools: 'React, Vue, Svelte, or Node.js ecosystem libraries', action: 'focus on accessibility fixes, UI components, or API improvements' },
    programming: { tools: 'LLVM, GCC, rustc, or language toolchain packages', action: 'dive into compiler warnings, test coverage, or RFC implementations' },
    os: { tools: 'Linux kernel toolchain, QEMU, or POSIX libraries', action: 'start with documentation, porting, or driver-level good-first issues' },
    dev: { tools: 'LSP plugins, tree-sitter grammars, or CLI tooling', action: 'pick up linter rules, editor extensions, or test-suite tasks' },
    media: { tools: 'FFmpeg, GStreamer, VLC plugin SDK, or libav', action: 'explore codec, subtitle, or format compatibility tickets' },
    other: { tools: 'the project\'s primary language ecosystem', action: 'read the CONTRIBUTING guide and tackle labelled good-first issues' },
  };
  const advice = DOMAIN_ADVICE[topCat] || DOMAIN_ADVICE.other;

  const strategyMsg = highComp
    ? '⚠️ Your watchlist skews towards <strong>high-competition</strong> orgs — consider adding a few <em>Chill</em> orgs to diversify your odds.'
    : lowComp
      ? '✅ Smart move — your watchlist is weighted towards <strong>lower-competition</strong> orgs, which improves acceptance probability.'
      : '📊 Your watchlist has a <strong>balanced mix</strong> of competition levels — a solid hedging strategy.';

  const stackLine = topTags.length
    ? `Your saved orgs centre on <strong>${topTags.map(t => escapeHtml(t)).join(', ')}</strong>.`
    : 'Your saved orgs span a diverse set of technologies.';

  el.innerHTML = `
    <div class="space-y-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
      <p>
        <span class="font-bold">📌 Stack Focus:</span>
        ${stackLine}
        Highlight experience with <strong>${escapeHtml(advice.tools)}</strong> in your proposals.
      </p>
      <p>
        <span class="font-bold">🎯 Domain Strategy (${escapeHtml(getCategoryMeta(topCat).label)}):</span>
        Before submitting, ${escapeHtml(advice.action)} to demonstrate early commitment to mentors.
      </p>
      <p>${strategyMsg}</p>
      <p class="text-orange-600 dark:text-orange-400 text-[10px] font-label uppercase tracking-widest pt-1 border-t border-zinc-200 dark:border-zinc-800">
        Based on ${bookmarks.length} saved org${bookmarks.length !== 1 ? 's' : ''} · Automated insight
      </p>
    </div>`;
}

// ══════════════════════════════════════════════
// DYNAMIC GOOD FIRST ISSUES PAGE OVERLAY
// ══════════════════════════════════════════════
let allIssues = [];
let filteredIssues = [];
let shownIssues = 0;
const ISSUES_PAGE_SIZE = 40;
let issuesFetching = false;

globalThis.openIssuesPage = function () {
  openModalElement('issuesPage');
  loadCachedIssues();
};

globalThis.closeIssuesPage = function () {
  closeModalElement('issuesPage');
};

globalThis.fetchAllIssues = async function () {
  if (issuesFetching) return;
  issuesFetching = true;
  const btn = document.getElementById('fetchIssuesBtn');
  const spin = document.getElementById('fetchIssuesSpin');
  const txt = document.getElementById('fetchIssuesTxt');
  btn.disabled = true; spin.style.display = 'inline-block';

  allIssues = [];
  const orgsWithGithub = ORGS.filter(o => o.github);
  let done = 0;
  let found = 0;

  document.getElementById('issuesContainer').innerHTML = `
    <div class="fetch-progress">
      <div style="font-size:14px;font-weight:600;color:var(--ink)">Fetching Good First Issues…</div>
      <div style="font-size:12px;color:var(--muted);margin-top:4px" id="fpStatus">Checking 0 / ${orgsWithGithub.length} orgs</div>
      <div class="fp-bar-wrap"><div class="fp-bar" id="fpBar" style="width:0%"></div></div>
      <div style="font-size:11px;color:var(--green);margin-top:8px;font-weight:600" id="fpFound">0 issues found so far</div>
    </div>`;

  const BATCH = 5;
  for (let i = 0; i < orgsWithGithub.length; i += BATCH) {
    const batch = orgsWithGithub.slice(i, i + BATCH);
    await Promise.all(batch.map(async o => {
      try {
        const r = await fetch(`${API}?repo=${encodeURIComponent(o.github)}&gfi=1&issues=1`);
        if (!r.ok) return;
        const data = await r.json();
        if (data.items?.length) {
          const owner = githubOwnerFromValue(o.github);
          const logo = owner ? `https://github.com/${owner}.png?size=64` : '';
          data.items.forEach(issue => {
            const labelNames = (issue.labels || []).map(l => typeof l === 'string' ? l : (l.name || ''));
            allIssues.push({
              title: issue.title,
              url: issue.html_url,
              org: o.name,
              orgCat: o.cat,
              orgTags: o.tags,
              logo,
              repo: o.github,
              created_at: issue.created_at,
              labels: labelNames,
              comments: issue.comments || 0,
            });
          });
          found += data.items.length;
        }
        const gfiCount = data.total ?? data.gfi;
        if (gfiCount !== null && gfiCount !== undefined) {
          if (!o._gh) o._gh = {};
          o._gh.gfi = gfiCount;
        }
      } catch (err) {
        console.warn('Failed fetching GFI issues for org:', o.github, err);
      }
      done++;
    }));

    const pct = Math.round(done / orgsWithGithub.length * 100);
    const fpStatus = document.getElementById('fpStatus');
    const fpBar = document.getElementById('fpBar');
    const fpFound = document.getElementById('fpFound');
    if (fpStatus) fpStatus.textContent = `Checking ${done} / ${orgsWithGithub.length} orgs`;
    if (fpBar) fpBar.style.width = pct + '%';
    if (fpFound) fpFound.textContent = `${found} issues found so far`;
    txt.textContent = `${done}/${orgsWithGithub.length}…`;
    await new Promise(r => setTimeout(r, 60));
  }

  allIssues.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  issuesFetching = false;
  btn.disabled = false; spin.style.display = 'none'; txt.textContent = '↻ Refresh';

  filterIssues();
  if (typeof renderOrgs === 'function') renderOrgs(true);
  if (typeof updateStats === 'function') updateStats();
};

async function loadCachedIssues() {
  if (allIssues.length || issuesFetching) return;
  try {
    const res = await fetch('/data/issues.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.issues)) return;

    const orgByGithub = new Map(ORGS.map(o => [o.github?.toLowerCase(), o]));
    const orgByName = new Map(ORGS.map(o => [o.name?.toLowerCase(), o]));

    allIssues = data.issues.map(issue => {
      const key = issue.github?.toLowerCase() || issue.repo?.toLowerCase() || issue.org?.toLowerCase();
      const orgMeta = orgByGithub.get(key) || orgByName.get(issue.org?.toLowerCase());
      const owner = githubOwnerFromValue(issue.github || issue.repo);
      return {
        title: issue.title || '',
        url: issue.url || '',
        org: issue.org || '',
        orgCat: orgMeta?.cat || '',
        orgTags: orgMeta?.tags || [],
        logo: owner ? `https://github.com/${owner}.png?size=64` : '',
        repo: issue.repo || issue.github || '',
        created_at: issue.created_at || '',
        labels: Array.isArray(issue.labels) ? issue.labels.map(l => typeof l === 'string' ? l : (l.name || '')) : [],
        comments: typeof issue.comments === 'number' ? issue.comments : Number(issue.comments || 0),
      };
    });

    allIssues.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    filterIssues();
  } catch (err) {
    console.warn('Failed to load cached issues:', err);
  }
}

function filterIssues() {
  const search = (document.getElementById('issueSearch')?.value || '').toLowerCase().trim();
  const cat = document.getElementById('issueCatFilter')?.value || '';
  const lang = document.getElementById('issueLangFilter')?.value || '';

  filteredIssues = allIssues.filter(iss => {
    if (cat && iss.orgCat !== cat) return false;
    if (lang && !iss.orgTags.some(t => t.includes(lang))) return false;
    if (search && !iss.title.toLowerCase().includes(search) && !iss.org.toLowerCase().includes(search)) return false;
    return true;
  });

  shownIssues = 0;
  renderIssues();
}

function relativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 864e5);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  if (d < 30) return d + 'd ago';
  if (d < 365) return Math.floor(d / 30) + 'mo ago';
  return Math.floor(d / 365) + 'y ago';
}

function renderIssues() {
  const container = document.getElementById('issuesContainer');
  const statsDiv = document.getElementById('issuesStats');
  const loadMore = document.getElementById('loadMoreWrap');
  if (!container || !statsDiv || !loadMore) return;

  if (!allIssues.length) {
    container.innerHTML = `<div class="issue-empty"><div class="ei">🟢</div><h3>Ready to find your first issue?</h3><p>Click "Load Issues" to fetch Good First Issues from all GSoC orgs.</p></div>`;
    statsDiv.style.display = 'none'; loadMore.style.display = 'none'; return;
  }

  if (!filteredIssues.length) {
    container.innerHTML = `<div class="issue-empty"><div class="ei">🔍</div><h3>No issues match your filters</h3><p>Try adjusting the search or category.</p></div>`;
    statsDiv.style.display = 'flex'; loadMore.style.display = 'none';
  } else {
    shownIssues = Math.min(shownIssues + ISSUES_PAGE_SIZE, filteredIssues.length);
    const visible = filteredIssues.slice(0, shownIssues);
    container.innerHTML = `<div class="issues-grid grid grid-cols-1 md:grid-cols-2 gap-4">${visible.map(renderIssueCard).join('')}</div>`;
    loadMore.style.display = shownIssues < filteredIssues.length ? 'flex' : 'none';
  }

  const orgsWithIssues = new Set(allIssues.map(i => i.org)).size;
  document.getElementById('issTotal').textContent = allIssues.length.toLocaleString();
  document.getElementById('issOrgs').textContent = String(orgsWithIssues);
  document.getElementById('issShown').textContent = String(Math.min(shownIssues, filteredIssues.length));
  statsDiv.style.display = 'flex';
}

function renderIssueCard(iss) {
  const langTags = iss.orgTags.slice(0, 2).map(t => safeHTML`<span class="issue-label lang">${t}</span>`);
  const gfiNames = ['good first issue', 'good-first-issue'];
  const otherLabels = iss.labels.filter(l => !gfiNames.includes(String(l).toLowerCase())).slice(0, 2)
    .map(l => safeHTML`<span class="issue-label" style="background:rgba(107,33,168,.06);color:var(--purple);border:1px solid rgba(107,33,168,.2)">${l}</span>`);

  const safeHref = sanitizeHrefUrl(iss.url);
  const imgSrc = sanitizeHrefUrl(iss.logo);

  const imgHtml = imgSrc
    ? safeHTML`<img class="issue-logo w-10 h-10 object-contain rounded-lg border border-zinc-100" src="${imgSrc}" alt="${iss.org}" loading="lazy">`
    : '';

  const commentsHtml = iss.comments > 0
    ? safeHTML`<span style="font-size:10px;color:var(--muted)">💬 ${String(iss.comments)}</span>`
    : '';

  const timeStr = relativeTime(iss.created_at);

  if (safeHref) {
    return safeHTML`<a class="issue-card bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 flex p-4 gap-4 rounded-xl hover:shadow" href="${safeHref}" target="_blank" rel="noopener noreferrer">
      ${imgHtml}
      <div class="issue-body flex-1 min-w-0">
        <div class="issue-top flex justify-between items-center gap-2 mb-1.5">
          <span class="issue-org font-bold text-xs text-primary truncate">${iss.org}</span>
          <span class="issue-label gfi bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded">✓ Good First Issue</span>
          ${commentsHtml}
        </div>
        <div class="issue-title font-bold text-sm text-zinc-950 dark:text-zinc-100 mb-2 truncate">${iss.title}</div>
        <div class="issue-meta flex flex-wrap items-center gap-1.5">
          ${langTags}
          ${otherLabels}
          <span class="issue-date text-[10px] text-zinc-400 font-label ml-auto">${timeStr}</span>
        </div>
      </div>
    </a>`.toString();
  } else {
    return safeHTML`<div class="issue-card bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 flex p-4 gap-4 rounded-xl">
      ${imgHtml}
      <div class="issue-body flex-1 min-w-0">
        <div class="issue-top flex justify-between items-center gap-2 mb-1.5">
          <span class="issue-org font-bold text-xs text-primary truncate">${iss.org}</span>
          <span class="issue-label gfi bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded">✓ Good First Issue</span>
          ${commentsHtml}
        </div>
        <div class="issue-title font-bold text-sm text-zinc-950 dark:text-zinc-100 mb-2 truncate">${iss.title}</div>
        <div class="issue-meta flex flex-wrap items-center gap-1.5">
          ${langTags}
          ${otherLabels}
          <span class="issue-date text-[10px] text-zinc-400 font-label ml-auto">${timeStr}</span>
        </div>
      </div>
    </div>`.toString();
  }
}

globalThis.showMoreIssues = function () {
  const container = document.getElementById('issuesContainer');
  const next = filteredIssues.slice(shownIssues, shownIssues + ISSUES_PAGE_SIZE);
  shownIssues += next.length;
  container.querySelector('.issues-grid').insertAdjacentHTML('beforeend', next.map(renderIssueCard).join(''));
  document.getElementById('loadMoreWrap').style.display = shownIssues < filteredIssues.length ? 'flex' : 'none';
  document.getElementById('issShown').textContent = String(shownIssues);
};

// ══════════════════════════════════════════════
// STATS COUNTERS
// ══════════════════════════════════════════════
function updateStats() {
  document.getElementById('totalStat').textContent = String(ORGS.length);
  document.getElementById('veteranStat').textContent = String(ORGS.filter(o => o.years >= 8).length);
  document.getElementById('newcomerStat').textContent = String(ORGS.filter(o => o.years <= 3).length);
  document.getElementById('visitorStat').textContent = String(AN.todayVisits());
}

// ══════════════════════════════════════════════
// UTILITIES FOR CARD ATTRIBUTES MAPPING
// ══════════════════════════════════════════════

// Initialize match mode toggle listener
const matchToggle = document.getElementById('matchAllLanguagesToggle');
if (matchToggle) {
  matchToggle.checked = matchAllLanguages;
  matchToggle.addEventListener('change', (e) => {
    globalThis.matchAllLanguages = e.target.checked;
    applyFilters();
  });
}


function restoreDropdownFilter(params, paramName, elementId, storageKey, defaultValue) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const urlParam = params.get(paramName);
  if (urlParam === null) {
    const savedValue = AN.g(storageKey, defaultValue);
    if (savedValue) element.value = savedValue;
  } else {
    element.value = urlParam;
  }
}


function restoreLanguagePills(params) {
  const langParam = params.get('lang');
  if (langParam === null) {
    document.querySelectorAll('.pill').forEach(btn => {
      const active = pills.has(btn.dataset.lang);
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    return;
  }

  const langs = langParam.split(',').map(s => s.trim()).filter(Boolean);
  pills.clear();

  if (langs.length > 1) {
    document.querySelectorAll('.pill').forEach(btn => {
      const active = langs.includes(btn.dataset.lang);
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      if (active) pills.add(btn.dataset.lang);
    });
    const langFilterEl = document.getElementById('langFilter');
    if (langFilterEl) langFilterEl.value = ' ';
  } else if (langs.length === 1) {
    document.querySelectorAll('.pill').forEach(btn => {
      const active = btn.dataset.lang === langs[0];
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      if (active) pills.add(btn.dataset.lang);
    });
    const langFilterEl = document.getElementById('langFilter');
    if (langFilterEl) langFilterEl.value = langs[0];
  } else {
    document.querySelectorAll('.pill.active').forEach(btn => {
      btn.classList.remove('active');
      btn.setAttribute('aria-pressed', 'false');
    });
    const langFilterEl = document.getElementById('langFilter');
    if (langFilterEl) langFilterEl.value = 'all';
  }
}


function restoreFiltersFromUrlOrStorage() {
  const params = new URLSearchParams(location.search);
  const searchInput = document.getElementById('searchInput');

  const queryParam = params.get('q');
  if (queryParam !== null && searchInput) {
    searchInput.value = queryParam;
  }

  restoreDropdownFilter(params, 'cat', 'categoryFilter', 'cat', '');
  restoreDropdownFilter(params, 'comp', 'complexityFilter', 'complexity', 'all');
  restoreDropdownFilter(params, 'sort', 'sortSelect', 'sort', 'alpha');

  restoreLanguagePills(params);
  if (typeof renderSelectedLanguages === 'function') renderSelectedLanguages();
  const chipParam = params.get('chip');
  if (chipParam !== null) {
    chips.clear();
    if (chipParam) chips.add(chipParam);
  }

  Object.keys(chipCls).forEach(k => {
    const el = document.getElementById('chip-' + k);
    if (!el) return;
    const isActive = chips.has(k);
    el.classList.toggle('bg-orange-600', isActive);
    el.classList.toggle('text-white', isActive);
    el.classList.toggle('bg-surface-container-highest', !isActive);
  });

  applyFilters();
}

requestAnimationFrame(() => {
  restoreFiltersFromUrlOrStorage();
  renderTrending();
  loadCachedIssues();
  checkAPI();
});

function githubOwnerFromValue(value) {
  return githubPathFromValue(value).split('/')[0] || '';
}

function githubUrlFromValue(value) {
  const path = githubPathFromValue(value);
  return path ? `https://github.com/${path}` : '';
}

function orgLogo(o) {
  const owner = orgLogoOwner(o);
  if (!owner) return '';
  return `https://github.com/${owner}.png?size=64`;
}

function repoUrl(o) {
  if (!o.github) return '';
  const owner = githubOwnerFromValue(o.github);
  const path = githubPathFromValue(o.github);
  if (UMBRELLA_ORGS.has(o.name) || !path.includes('/')) return owner ? `https://github.com/${owner}` : '';
  return githubUrlFromValue(o.github);
}

function repoLinkLabel(o) {
  if (!o.github) return '';
  const owner = githubOwnerFromValue(o.github);
  const path = githubPathFromValue(o.github);
  if (UMBRELLA_ORGS.has(o.name) || !path.includes('/')) return owner + ' (org)';
  return path;
}

globalThis.orgLogo = orgLogo;
globalThis.repoUrl = repoUrl;
globalThis.repoLinkLabel = repoLinkLabel;

// Event listeners for selects
['categoryFilter', 'complexityFilter', 'sortSelect'].forEach(id => {
  document.getElementById(id)?.addEventListener('change', () =>{
    AN.s('cat', document.getElementById('categoryFilter')?.value || 'all');
    AN.s('sort', document.getElementById('sortSelect')?.value || 'alpha');
    AN.s('complexity', document.getElementById('complexityFilter')?.value || 'all');
    applyFilters();
  });
});

globalThis.appJsApplyFilters = applyFilters;
globalThis.applyFilters = applyFilters;
globalThis.toggleBookmark = toggleBookmark;
globalThis.openModal = openModal;
globalThis.bookmarkedSet = bookmarkedSet;
globalThis.compareList = compareList;
globalThis.sanitizeHrefUrl = sanitizeHrefUrl;
globalThis.cLbl = cLbl;
globalThis.cBdg = cBdg;
globalThis.aBdg = aBdg;
globalThis.catLabel = catLabel;
globalThis.catBdg = catBdg;

function renderMentorContactSection(org) {
  const container = document.getElementById('mMentorsSection');
  if (!container) return;

  container.innerHTML = '';
  const mentors = MENTOR_DATA[org.name];

  if (!mentors || !mentors.length) {
    container.innerHTML = safeHTML`
      <div class="mentor-empty border border-zinc-100 dark:border-zinc-800 rounded-xl p-6 text-center bg-zinc-50 dark:bg-zinc-900/40">
        <p class="text-xs text-zinc-500">Contact details unavailable for ${org.name}. Browse their GSoC Ideas Page for mentor details.</p>
      </div>`;
    return;
  }

  mentors.forEach(m => {
    const card = document.createElement('div');
    card.className = 'mentor-card p-4 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800 rounded-xl mb-3 last:mb-0';

    const channelsHtml = (m.channels || []).map(c => {
      const icon = CHANNEL_ICONS[c.type] || '💬';
      const isUrl = sanitizeHrefUrl(c.value);
      if (isUrl) {
        return safeHTML`<a href="${isUrl}" target="_blank" rel="noopener noreferrer" class="mentor-link-chip hover:shadow-sm">
          ${icon} ${c.type}: Connect
        </a>`;
      } else {
        return safeHTML`<span class="mentor-handle-chip">
          ${icon} ${c.type}: ${c.value}
        </span>`;
      }
    });

    card.innerHTML = safeHTML`
      <div class="flex items-center justify-between mb-2">
        <h5 class="font-bold text-xs text-zinc-900 dark:text-zinc-100">${m.name}</h5>
        <span class="text-[9px] font-bold text-zinc-500 uppercase">${m.role || 'Mentor'}</span>
      </div>
      <div class="flex flex-wrap gap-1.5 mt-2.5">
        ${channelsHtml}
      </div>`;
    container.appendChild(card);
  });
}

// ══════════════════════════════════════════════
// INITIALIZATION
// ══════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  ORGS.forEach(o => {
    if (o.github && ghCache[o.github]) o._gh = ghCache[o.github];
  });
  updateCountdown();
  setInterval(updateCountdown, 60000);  checkAPI();
  document.getElementById('mFetchBtn')?.addEventListener('click', fetchModalGH);
});

// ══════════════════════════════════════════════
// EXPORT FOR NODE ENVIRONMENT TESTING COMPATIBILITY
// ══════════════════════════════════════════════
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    escapeHtml,
    sanitizeHrefUrl,
    validateIdeasUrl,
    githubPathFromValue,
    githubOwnerFromValue,
    githubUrlFromValue,
    orgMatchesLanguages,
    applySecondarySort,
    openModal,
    closeModal,
    safeHTML,
    rawHTML,
    renderGoodFirstIssues
  };
}