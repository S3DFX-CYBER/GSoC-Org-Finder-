// src/js/MatchScoreCard.js

const MatchScoreCard = (function() {
  function render(matchData) {
    const { org, score, matchedSkills, reasons } = matchData;
    
    const card = document.createElement('div');
    card.className = 'match-score-card bg-white dark:bg-zinc-800 rounded-xl p-4 shadow-sm border border-zinc-100 dark:border-zinc-700 hover:shadow-md transition-shadow';
    
    const header = document.createElement('div');
    header.className = 'flex justify-between items-center mb-3';
    
    const title = document.createElement('h3');
    title.className = 'text-lg font-bold text-zinc-900 dark:text-zinc-100 truncate';
    title.textContent = org.name;
    
    const scoreBadge = document.createElement('div');
    scoreBadge.className = `px-2 py-1 rounded-full text-xs font-bold ${getScoreColor(score)}`;
    scoreBadge.textContent = `${score}% Match`;
    
    header.appendChild(title);
    header.appendChild(scoreBadge);
    
    const reasonsList = document.createElement('ul');
    reasonsList.className = 'text-sm text-zinc-600 dark:text-zinc-400 mb-3 space-y-1';
    reasons.forEach(reason => {
      const li = document.createElement('li');
      li.className = 'flex items-start gap-2';
      li.innerHTML = `<span class="material-symbols-outlined text-[16px] text-primary mt-0.5">check_circle</span> <span>${reason}</span>`;
      reasonsList.appendChild(li);
    });
    
    const skillsContainer = document.createElement('div');
    skillsContainer.className = 'flex flex-wrap gap-1 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-700';
    matchedSkills.forEach(skill => {
      const tag = document.createElement('span');
      tag.className = 'px-2 py-0.5 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded-full text-[10px] font-bold uppercase tracking-wider';
      tag.textContent = skill;
      skillsContainer.appendChild(tag);
    });
    
    card.appendChild(header);
    card.appendChild(reasonsList);
    card.appendChild(skillsContainer);
    
    return card;
  }
  
  function getScoreColor(score) {
    if (score >= 80) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    if (score >= 50) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300';
  }

  return {
    render
  };
})();

globalThis.MatchScoreCard = MatchScoreCard;
