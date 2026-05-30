// src/js/RepositoryHealthGraph.js

const RepositoryHealthGraph = (function() {
  function render(containerId, repoData) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const subscribers = repoData.subscribers_count || 0;
    const forks = repoData.forks_count || 0;
    const stars = repoData.stargazers_count || 0;
    const issues = repoData.open_issues_count || 0;
    
    // Normalize values to create a "health" score out of 100
    const healthScore = Math.min(100, Math.round(((stars / 100) + (forks / 50) + (subscribers / 20)) / 3 * 100));
    
    container.innerHTML = `
      <div class="p-4 bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-800 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-700 flex items-center gap-6">
        <div class="relative w-24 h-24 shrink-0 flex items-center justify-center">
          <svg viewBox="0 0 36 36" class="w-24 h-24 transform -rotate-90">
            <path class="text-zinc-200 dark:text-zinc-700" stroke-width="3" stroke="currentColor" fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <path class="text-primary" stroke-dasharray="${healthScore}, 100" stroke-width="3" stroke-linecap="round" stroke="currentColor" fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <span class="text-xl font-extrabold text-zinc-900 dark:text-white">${healthScore}</span>
            <span class="text-[9px] font-bold text-zinc-500 uppercase" title="Heuristic proxy based on stars, forks and subscribers">Heuristic Health</span>
          </div>
        </div>
        
        <div class="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="flex flex-col">
            <span class="text-xl font-bold text-zinc-800 dark:text-zinc-200">${stars.toLocaleString()}</span>
            <span class="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Stars</span>
          </div>
          <div class="flex flex-col">
            <span class="text-xl font-bold text-zinc-800 dark:text-zinc-200">${forks.toLocaleString()}</span>
            <span class="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Forks</span>
          </div>
          <div class="flex flex-col">
            <span class="text-xl font-bold text-zinc-800 dark:text-zinc-200">${issues.toLocaleString()}</span>
            <span class="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Issues</span>
          </div>
          <div class="flex flex-col">
            <span class="text-xl font-bold text-zinc-800 dark:text-zinc-200">${subscribers.toLocaleString()}</span>
            <span class="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Subscribers</span>
          </div>
        </div>
      </div>
    `;
  }

  return { render };
})();

globalThis.RepositoryHealthGraph = RepositoryHealthGraph;
