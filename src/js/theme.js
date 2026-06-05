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
// DYNAMIC TIMELINE & COUNTDOWN
// ══════════════════════════════════════════════
const GSOC_SELECTION_DATE = new Date('2026-05-08T18:00:00Z');
const MILESTONES = [
  { date: new Date('2026-02-19T00:00:00Z'), label: 'Accepted Orgs Announced', note: null },
  { date: new Date('2026-03-16T00:00:00Z'), label: 'Contributor Proposals Open', note: null },
  { date: new Date('2026-03-31T23:30:00+05:30'), label: 'Proposal Submission Deadline', note: 'Submit your project proposals by 11:30 PM!' },
  { date: GSOC_SELECTION_DATE, label: 'Accepted Projects Announced', note: null },
  { date: new Date('2026-05-25T00:00:00Z'), label: 'Coding Officially Begins', note: 'Start working on your GSoC project!' },
  { date: new Date('2026-07-06T18:00:00Z'), label: 'Midterm Evaluations Begin', note: 'Mentors and contributors submit midterm evaluations.' },
  { date: new Date('2026-07-10T18:00:00Z'), label: 'Midterm Evaluation Deadline', note: null },
  { date: new Date('2026-08-17T00:00:00Z'), label: 'Final Submissions Begin', note: 'Submit your final work product and evaluation.' },
  { date: new Date('2026-08-24T18:00:00Z'), label: 'Final Submission Deadline (Standard)', note: 'Standard 12-week projects: submit final work product and evaluation.' },
  { date: new Date('2026-08-31T18:00:00Z'), label: 'Mentor Final Evaluations Due (Standard)', note: null },
  { date: new Date('2026-11-02T18:00:00Z'), label: 'Extended Timeline Final Deadline', note: 'Last date for all contributors on extended timelines to submit final work.' },
  { date: new Date('2026-11-09T18:00:00Z'), label: 'Extended Mentor Evaluations Due', note: 'Final date for mentors to submit evaluations for extended projects.' },
].filter(m => !isNaN(m.date.getTime()));

function renderTimeline() {
  const container = document.getElementById('timeline-milestones');
  if (!container || MILESTONES.length === 0) return;

  try {
    const now = new Date();
    if (isNaN(now.getTime())) return;

    let activeIdx = MILESTONES.findIndex(m => m.date > now);
    if (activeIdx === -1) activeIdx = MILESTONES.length - 1;

    const allPast = MILESTONES[MILESTONES.length - 1].date <= now;

    container.innerHTML = MILESTONES.map((m, i) => {
      const isActive = i === activeIdx;
      const isLast = i === MILESTONES.length - 1;
      const connector = !isLast ? `<div class="w-0.5 h-10 bg-zinc-200 dark:bg-zinc-700"></div>` : '';
      let dateStr;
      try {
        dateStr = m.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
      } catch (err) {
        console.warn('[Timeline] Date formatting failed for:', m.date, err);
        dateStr = m.date.toISOString().slice(0, 10);
      }

      if (isActive && !allPast) {
        return `<div class="flex gap-3 sm:gap-4">
          <div class="flex flex-col items-center"><div class="w-3 h-3 rounded-full bg-primary ring-4 ring-orange-100 dark:ring-orange-950/40 pulse-dot"></div>${connector}</div>
          <div><p class="text-[10px] font-bold text-primary">${escapeHtml(dateStr)}</p>
          <p class="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-zinc-100 leading-tight">${escapeHtml(m.label)}</p>
          ${m.note ? `<p class="text-xs text-zinc-500 dark:text-zinc-400 mt-1">${escapeHtml(m.note)}</p>` : ''}</div>
        </div>`;
      } else if (isActive && allPast) {
        return `<div class="flex gap-3 sm:gap-4">
          <div class="flex flex-col items-center"><div class="w-3 h-3 rounded-full bg-green-500 ring-4 ring-green-100 dark:ring-green-950/40"></div>${connector}</div>
          <div><p class="text-[10px] font-bold text-green-600">${escapeHtml(dateStr)}</p>
          <p class="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-zinc-100 leading-tight">${escapeHtml(m.label)}</p>
          <p class="text-xs text-green-600 dark:text-green-400 mt-1">✓ Completed</p></div>
        </div>`;
      } else {
        return `<div class="flex gap-3 sm:gap-4 opacity-40">
          <div class="flex flex-col items-center"><div class="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-600"></div>${connector}</div>
          <div><p class="text-[10px] font-bold text-zinc-400">${escapeHtml(dateStr)}</p>
          <p class="text-sm font-bold text-zinc-500 dark:text-zinc-400">${escapeHtml(m.label)}</p></div>
        </div>`;
      }
    }).join('');
  } catch (err) {
    console.warn('[Timeline] renderTimeline failed:', err);
  }
}

function updateCountdown() {
  const countdownEl = document.getElementById('countdown');
  const labelEl = document.getElementById('countdown-label');
  if (!countdownEl || !labelEl || MILESTONES.length === 0) return;

  try {
    const now = new Date();
    if (isNaN(now.getTime())) return;

    const next = MILESTONES.find(m => m.date > now);

    if (!next) {
      labelEl.textContent = 'GSoC 2026 selection complete';
      countdownEl.textContent = '🎉 All done!';
      countdownEl.classList.remove('text-primary');
      countdownEl.classList.add('text-green-600');
      return;
    }

    labelEl.textContent = `Until: ${next.label}`;
    countdownEl.classList.remove('text-green-600');
    countdownEl.classList.add('text-primary');
    const diff = next.date - now;
    if (diff <= 0) { renderTimeline(); updateCountdown(); return; }
    const d = Math.floor(diff / 864e5), h = Math.floor((diff % 864e5) / 36e5), m = Math.floor((diff % 36e5) / 6e4);
    countdownEl.textContent = `${d}d ${h}h ${m}m`;
  } catch (err) {
    console.warn('[Timeline] updateCountdown failed:', err);
  }
}

// ══════════════════════════════════════════════
// ANALYTICS ENGINE
// ══════════════════════════════════════════════