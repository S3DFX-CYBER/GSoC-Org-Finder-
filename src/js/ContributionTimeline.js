// src/js/ContributionTimeline.js

const ContributionTimeline = (function() {
  function render(containerId, roadmapData) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'p-6 bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-700';
    
    const header = document.createElement('div');
    header.className = 'mb-6';
    header.innerHTML = `
      <h3 class="text-lg font-bold text-zinc-900 dark:text-zinc-100">Contribution Roadmap for ${roadmapData.orgName}</h3>
      <p class="text-sm text-zinc-500 dark:text-zinc-400 mt-1">An AI-generated optimal path to becoming a core contributor.</p>
    `;
    wrapper.appendChild(header);
    
    const timelineContainer = document.createElement('div');
    timelineContainer.className = 'relative border-l-2 border-orange-200 dark:border-orange-800 ml-3 md:ml-6 space-y-8';
    
    roadmapData.milestones.forEach((milestone) => {
      
      const item = document.createElement('div');
      item.className = 'relative pl-6 md:pl-8';
      
      let badgeColor = 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300';
      if (milestone.difficulty === 'Beginner') badgeColor = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      if (milestone.difficulty === 'Intermediate') badgeColor = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      if (milestone.difficulty === 'Advanced') badgeColor = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      if (milestone.type === 'proposal') badgeColor = 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      
      item.innerHTML = `
        <div class="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 border-white dark:border-zinc-900 bg-orange-500 shadow-sm z-10"></div>
        <div class="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2">
          <span class="text-sm font-bold text-orange-600 dark:text-orange-400">${milestone.timeframe}</span>
          <h4 class="text-base font-bold text-zinc-900 dark:text-zinc-100">${milestone.label}</h4>
          <span class="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full w-max ${badgeColor}">${milestone.difficulty}</span>
        </div>
        <p class="text-sm text-zinc-600 dark:text-zinc-400">
          ${getMilestoneDescription(milestone.type, roadmapData.orgName)}
        </p>
      `;
      timelineContainer.appendChild(item);
    });
    
    wrapper.appendChild(timelineContainer);
    container.appendChild(wrapper);
  }
  
  function getMilestoneDescription(type, orgName) {
    switch (type) {
      case 'documentation': return `Start by reading ${orgName}'s documentation. Fix typos or clarify instructions to get familiar with their PR process.`;
      case 'good_first_issue': return `Search for issues labeled "good first issue" or "beginner". These are scoped specifically for newcomers to learn the codebase.`;
      case 'bug_fix': return `Find an active bug report. Reproduce the issue, write a test if possible, and submit a patch. Engage with code reviewers to improve your code.`;
      case 'feature': return `Identify a small missing feature or enhancement. Discuss your implementation plan in an issue before writing code to ensure alignment with maintainers.`;
      case 'proposal': return `Draft your GSoC proposal based on their ideas list. Share an early draft with the community for feedback and iterate based on maintainer suggestions.`;
      default: return 'Continue contributing and engaging with the community.';
    }
  }

  return { render };
})();

globalThis.ContributionTimeline = ContributionTimeline;
