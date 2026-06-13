// src/js/GitHubAnalyticsDashboard.js

const GitHubAnalyticsDashboard = (function() {
  const cache = new Map();
  let rateLimitExceeded = false;
  
  async function fetchRepoData(repoName) {
    if (rateLimitExceeded) return null;
    if (cache.has(repoName)) return cache.get(repoName);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`https://api.github.com/repos/${repoName}`, {
        headers: { 'Accept': 'application/vnd.github.v3+json' },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.status === 403 || response.status === 429) {
        const remaining = response.headers.get('x-ratelimit-remaining');
        if (remaining === '0') {
          rateLimitExceeded = true;
          console.warn('GitHub API rate limit exceeded.');
          return null;
        }
      }
      
      if (!response.ok) throw new Error(`GitHub API Error: ${response.status}`);
      
      const data = await response.json();
      cache.set(repoName, data);
      return data;
    } catch (err) {
      console.error('Failed to fetch GitHub repo data', err);
      return null;
    }
  }

  function initDashboard(containerId, repoName) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '<div class="text-zinc-500 text-sm italic animate-pulse">Loading GitHub Intelligence...</div>';
    
    fetchRepoData(repoName).then(data => {
      container.innerHTML = '';
      if (!data) {
        container.innerHTML = '<div class="text-red-500 text-sm">Failed to load live metrics or rate limited.</div>';
        return;
      }
      
      const grid = document.createElement('div');
      grid.className = 'grid grid-cols-1 md:grid-cols-2 gap-4';
      
      // We will render velocity chart, maintainer card, and health graph
      const velocityContainer = document.createElement('div');
      velocityContainer.id = `velocity-${repoName.replace('/', '-')}`;
      grid.appendChild(velocityContainer);
      
      const maintainerContainer = document.createElement('div');
      maintainerContainer.id = `maintainer-${repoName.replace('/', '-')}`;
      grid.appendChild(maintainerContainer);
      
      const healthContainer = document.createElement('div');
      healthContainer.id = `health-${repoName.replace('/', '-')}`;
      healthContainer.className = 'md:col-span-2';
      grid.appendChild(healthContainer);
      
      container.appendChild(grid);
      
      // Initialize sub-components
      if (globalThis.ContributionVelocityChart) {
        globalThis.ContributionVelocityChart.render(velocityContainer.id, data);
      }
      if (globalThis.MaintainerActivityCard) {
        globalThis.MaintainerActivityCard.render(maintainerContainer.id, data);
      }
      if (globalThis.RepositoryHealthGraph) {
        globalThis.RepositoryHealthGraph.render(healthContainer.id, data);
      }
    });
  }

  return {
    initDashboard,
    fetchRepoData
  };
})();

globalThis.GitHubAnalyticsDashboard = GitHubAnalyticsDashboard;
