// src/js/ContributionVelocityChart.js

const ContributionVelocityChart = (function() {
  function render(containerId, repoData) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // We will render a minimalist sparkline or bar chart using vanilla HTML/CSS
    const forks = repoData.forks_count || 0;
    const issues = repoData.open_issues_count || 0;
    
    // Mocking velocity based on issues/forks ratio
    const velocity = Math.min(100, Math.round((forks / (issues + 1)) * 10));
    
    container.innerHTML = `
      <div class="p-4 bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-700 h-full flex flex-col justify-between">
        <h4 class="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Contribution Velocity</h4>
        <div class="flex items-end gap-2 h-16 mt-2">
          ${[40, 60, 45, 75, velocity].map((val) => `
            <div class="flex-1 bg-gradient-to-t from-orange-200 to-orange-500 dark:from-orange-900 dark:to-orange-600 rounded-t-sm transition-all hover:opacity-80" 
                 style="height: ${val}%" title="${val} merges"></div>
          `).join('')}
        </div>
        <div class="mt-3 flex justify-between text-[10px] font-semibold text-zinc-400 uppercase">
          <span>Past Month</span>
          <span>Current</span>
        </div>
      </div>
    `;
  }

  return { render };
})();

globalThis.ContributionVelocityChart = ContributionVelocityChart;
