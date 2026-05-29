// src/js/MaintainerActivityCard.js

const MaintainerActivityCard = (function() {
  function render(containerId, repoData) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const isArchived = repoData.archived;
    const lastUpdate = new Date(repoData.updated_at);
    const daysSinceUpdate = Math.floor((new Date() - lastUpdate) / (1000 * 60 * 60 * 24));
    
    let statusText = 'Highly Active';
    let statusColor = 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
    let icon = 'bolt';
    
    if (isArchived) {
      statusText = 'Archived';
      statusColor = 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
      icon = 'archive';
    } else if (daysSinceUpdate > 90) {
      statusText = 'Low Activity';
      statusColor = 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
      icon = 'hourglass_empty';
    }
    
    container.innerHTML = `
      <div class="p-4 bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-700 h-full">
        <h4 class="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">Maintainer Status</h4>
        
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center">
            <img src="${repoData.owner.avatar_url}" alt="Owner" class="w-10 h-10 rounded-full">
          </div>
          <div>
            <div class="text-sm font-bold text-zinc-900 dark:text-zinc-100">${repoData.owner.login}</div>
            <div class="text-xs text-zinc-500 dark:text-zinc-400">Last update: ${daysSinceUpdate} days ago</div>
          </div>
        </div>
        
        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${statusColor}">
          <span class="material-symbols-outlined text-[14px]">${icon}</span>
          ${statusText}
        </div>
      </div>
    `;
  }

  return { render };
})();

globalThis.MaintainerActivityCard = MaintainerActivityCard;
