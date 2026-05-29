// src/js/RoadmapSuggestions.js

const RoadmapSuggestions = (function() {
  function render(containerId, readinessData) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30';
    
    const title = document.createElement('h4');
    title.className = 'text-sm font-bold text-blue-900 dark:text-blue-400 mb-3 uppercase tracking-wider flex items-center gap-2';
    title.innerHTML = '<span class="material-symbols-outlined text-[18px]">route</span> Next Steps Roadmap';
    wrapper.appendChild(title);
    
    const list = document.createElement('ol');
    list.className = 'space-y-3 relative border-l-2 border-blue-200 dark:border-blue-800 ml-3 pl-4';
    
    const suggestions = generateSuggestions(readinessData);
    
    suggestions.forEach((step, index) => {
      const li = document.createElement('li');
      li.className = 'text-sm text-blue-900 dark:text-blue-200 relative';
      
      const dot = document.createElement('div');
      dot.className = 'absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-white dark:border-zinc-900';
      
      const stepTitle = document.createElement('div');
      stepTitle.className = 'font-bold';
      stepTitle.textContent = `Step ${index + 1}: ${step.title}`;
      
      const stepDesc = document.createElement('div');
      stepDesc.className = 'text-xs text-blue-700 dark:text-blue-300 mt-1';
      stepDesc.textContent = step.desc;
      
      li.appendChild(dot);
      li.appendChild(stepTitle);
      li.appendChild(stepDesc);
      list.appendChild(li);
    });
    
    wrapper.appendChild(list);
    container.appendChild(wrapper);
  }
  
  function generateSuggestions(data) {
    const steps = [];
    
    if (data.metrics.skills < 30) {
      steps.push({
        title: 'Bridge Skill Gaps',
        desc: 'Focus on building small projects using the missing technologies identified in your focus areas.'
      });
    }
    
    if (data.metrics.experience < 20 || data.metrics.activity < 20) {
      steps.push({
        title: 'Start with Good First Issues',
        desc: 'Find 2-3 beginner-friendly issues in the organization to understand their workflow and codebase.'
      });
    } else {
      steps.push({
        title: 'Tackle Complex Issues',
        desc: 'You have good experience. Try taking on a more advanced issue to prove your capabilities.'
      });
    }
    
    steps.push({
      title: 'Draft Project Proposal',
      desc: 'Engage with maintainers early and start outlining your GSoC proposal draft based on their ideas list.'
    });
    
    return steps;
  }

  return {
    render
  };
})();

globalThis.RoadmapSuggestions = RoadmapSuggestions;
