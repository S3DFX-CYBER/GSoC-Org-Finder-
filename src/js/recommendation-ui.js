// src/js/recommendation-ui.js

/* global analyzeGitHubUser, extractSkills, getRecommendations, escapeHtml, openModal, toggleCompare, toggleBookmark */

/**
 * Encapsulates the heavy analytical logic into a single async pipe.
 * Moved to outer scope to maximize reuse and minimize closure memory footprint.
 */
async function analyzeProfile(username, resume) {
  let githubProfile = null;
  let skills = [];

  if (username) {
    try {
      githubProfile = await analyzeGitHubUser(username);
    } catch (err) {
      console.warn("GitHub Analysis Failed:", err);
      if (!resume) throw err; // Only bubble up error if we possess no alternate datasource
    }
  }

  if (resume) {
    skills = extractSkills(resume);
  }

  return getRecommendations(skills, githubProfile);
}

/**
 * Global image error handler for recommendation cards.
 * Replaces broken images with a styled initial-based placeholder.
 */
globalThis.handleRecImgError = function(img, name) {
  img.style.display = 'none';
  const container = img.parentElement;
  if (container) {
    const placeholder = container.querySelector('.logo-placeholder');
    if (placeholder) {
      placeholder.classList.remove('hidden');
      placeholder.classList.add('flex');
      placeholder.textContent = (name || '?')[0].toUpperCase();
    }
  }
};

// Internal safety helper in case globalThis.escapeHtml is not yet initialized
const safeEscapeHtml = (str) => {
  if (typeof escapeHtml === 'function') return escapeHtml(str);
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
};


function handleBookmarkAction(e, btn) {
  e.stopPropagation();
  const name = btn.dataset.bookmarkOrg;
  if (typeof toggleBookmark === 'function') {
    toggleBookmark(e, name);
    // Dynamically verify authoritative memory to correctly manage layout class topology
    const isNowBookmarked = (globalThis.bookmarkedSet || new Set()).has(name);
    btn.classList.toggle('active', isNowBookmarked);
    btn.classList.toggle('text-orange-500', isNowBookmarked);
    btn.classList.toggle('text-zinc-300', !isNowBookmarked);
    
    const icon = btn.querySelector('.material-symbols-outlined');
    if (icon) icon.classList.toggle('icon-fill', isNowBookmarked);
  }
}

function handleCompareAction(e, btn, card) {
  e.stopPropagation();
  const name = btn.dataset.compareOrg;
  if (typeof toggleCompare !== 'function') return;

  // Core engine handles constraints and updates globalThis.compareList synchronously
  toggleCompare(e, name);
  
  // Read the authoritative application state to govern local visual treatment
  const currentCompareList = globalThis.compareList || [];
  const isNowComparing = currentCompareList.includes(name);

  if (isNowComparing) {
     btn.classList.add('text-primary');
     btn.classList.remove('text-zinc-400');
     btn.innerHTML = '<span class="material-symbols-outlined text-sm">check_circle</span> Comparing';
     card.classList.add('ring-2', 'ring-primary/30');
  } else {
     btn.classList.remove('text-primary');
     btn.classList.add('text-zinc-400');
     btn.innerHTML = '<span class="material-symbols-outlined text-sm">compare_arrows</span> Compare';
     card.classList.remove('ring-2', 'ring-primary/30');
  }
}

function handleCardActivation(card) {
  const name = card.dataset.orgName;
  if (typeof openModal === 'function' && name) {
    openModal(name);
  }
}


document.addEventListener('DOMContentLoaded', () => {
  const getRecsBtn = document.getElementById('btnGetRecommendations');
  if (!getRecsBtn) return; // Ensure the element exists

  const ghInput = document.getElementById('aiGhUsername');
  const resumeText = document.getElementById('aiResumeText');
  const fileUpload = document.getElementById('aiResumeFile');
  
  const loadingState = document.getElementById('aiLoadingState');
  const errorState = document.getElementById('aiErrorState');
  const resultsContainer = document.getElementById('aiResultsContainer');
  const errorMsg = document.getElementById('aiErrorMsg');

  // Handle file upload
  if (fileUpload) {
    fileUpload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      file.text().then(text => {
        resumeText.value = text;
      }).catch(err => {
        console.error("File Read Error:", err);
        showError("Failed to read file. Please make sure it's a valid text format.");
      });
    });
  }



  function setAnalysisStateUI(isActive) {
    if (isActive) {
      errorState.classList.add('hidden');
      resultsContainer.innerHTML = '';
      loadingState.classList.remove('hidden');
      getRecsBtn.disabled = true;
      getRecsBtn.innerHTML = '<span class="material-symbols-outlined pulse-dot">hourglass_empty</span> Analyzing...';
    } else {
      loadingState.classList.add('hidden');
      getRecsBtn.disabled = false;
      getRecsBtn.innerHTML = '<span class="material-symbols-outlined text-sm">auto_awesome</span> Get Recommendations';
    }
  }

  getRecsBtn.addEventListener('click', async () => {
    const username = ghInput.value.trim();
    const resume = resumeText.value.trim();

    if (!username && !resume) {
      showError("Please provide either a GitHub username or resume text to get recommendations.");
      return;
    }

    setAnalysisStateUI(true);
    try {
      const recommendations = await analyzeProfile(username, resume);
      renderRecommendations(recommendations);
    } catch (err) {
      showError(err.message || "An unexpected error occurred during analysis.");
    } finally {
      setAnalysisStateUI(false);
    }
  });

  function showError(msg) {
    errorMsg.textContent = msg;
    errorState.classList.remove('hidden');
    resultsContainer.innerHTML = '';
  }





  // Register one central delegate for all user actions triggered inside recommendation container
  if (resultsContainer) {
    resultsContainer.addEventListener('click', (e) => {
      const target = e.target;
      
      const bookmarkBtn = target.closest('[data-bookmark-org]');
      if (bookmarkBtn) {
        return handleBookmarkAction(e, bookmarkBtn);
      }

      const compareBtn = target.closest('[data-compare-org]');
      const card = target.closest('[data-org-name]');
      if (compareBtn && card) {
        return handleCompareAction(e, compareBtn, card);
      }
      
      if (card) {
        return handleCardActivation(card);
      }
    });
  }

  function renderRecommendations(recs) {
    if (!recs || recs.length === 0) {
      showError("Could not find any matching organizations based on your profile.");
      return;
    }

    const currentCompareList = globalThis.compareList || [];
    const currentBookmarkedSet = globalThis.bookmarkedSet || new Set();

    const html = recs.map(rec => {
      const o = rec.org;
      const githubOwner = o.github ? o.github.split('/')[0] : '';
      const logoUrl = githubOwner ? `https://github.com/${githubOwner}.png?size=80` : '';
      
      const inCompare = currentCompareList.includes(o.name);
      const isBookmarked = typeof currentBookmarkedSet.has === 'function' 
        ? currentBookmarkedSet.has(o.name) 
        : false;
      
      const reasonsHtml = rec.reasons.map(r => `<li class="text-[11px] text-zinc-600 dark:text-zinc-400 flex items-start gap-2"><span class="material-symbols-outlined text-xs text-emerald-500 mt-0.5">check_circle</span> <span class="leading-tight">${safeEscapeHtml(r)}</span></li>`).join('');
      
      let matchedSkillsHtml = '';
      if (rec.matchedSkills.length > 0) {
         const skillsList = rec.matchedSkills.slice(0, 4).map(s => `<span class="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded text-[9px] font-bold uppercase tracking-wider">${safeEscapeHtml(s)}</span>`).join('');
         matchedSkillsHtml = `<div class="mt-2 flex flex-wrap gap-1">${skillsList}</div>`;
      }

      const yearsLabel = o.years >= 8 ? 'Veteran' : o.years >= 4 ? 'Experienced' : 'Newcomer';
      const diffScoreObj = typeof getDifficultyScore === 'function' ? getDifficultyScore(o) : { total: 5 };
      const diffLabelObj = typeof getDifficultyLabel === 'function' ? getDifficultyLabel(diffScoreObj.total) : { label: 'Medium', cls: 'difficulty-medium' };


      // Defined explicitly outside string to eliminate linting issues with nested template literals
      const logoHtml = logoUrl 
        ? `<img src="${safeEscapeHtml(logoUrl)}" data-org-name="${safeEscapeHtml(o.name)}" alt="${safeEscapeHtml(o.name)} logo" class="w-full h-full object-contain rounded-lg" onerror="handleRecImgError(this, this.dataset.orgName)">
           <div class="logo-placeholder hidden w-full h-full items-center justify-center text-primary font-bold text-xl font-headline bg-primary/5"></div>`
        : `<div class="text-primary font-bold text-xl font-headline">${safeEscapeHtml(o.name[0] || '?')}</div>`;


      return `
      <article class="group relative bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-100 dark:border-zinc-800/80 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 hover:border-orange-500/30 dark:hover:border-orange-500/30 flex flex-col justify-between overflow-hidden cursor-pointer ${inCompare ? 'ring-2 ring-primary/30' : ''}" 
               data-org-name="${safeEscapeHtml(o.name)}">
        
        <!-- Match Score Badge -->
        <div class="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

        <!-- Match Score Badge -->
        <div class="absolute top-0 right-0 bg-gradient-to-bl from-green-500 to-emerald-600 dark:from-emerald-600 dark:to-teal-600 text-white px-3.5 py-1.5 rounded-bl-2xl rounded-tr-2xl font-headline font-bold text-[10px] uppercase tracking-wider shadow-sm flex items-center gap-1.5 z-10 transition-transform duration-200 group-hover:scale-102">
          <span class="material-symbols-outlined text-[13px]">target</span> ${rec.score}% Match
        </div>

        <!-- Header: Logo & Bookmarking -->
        <div class="flex justify-between items-start mb-4 pt-2 relative z-10">
          <div class="w-14 h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100/80 dark:border-zinc-700/50 flex items-center justify-center p-2.5 overflow-hidden shadow-inner transition-transform duration-300 group-hover:scale-105">
            ${logoHtml}
          </div>
          <button class="bookmark-btn w-9 h-9 rounded-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-150/60 dark:border-zinc-700/50 flex items-center justify-center text-zinc-300 dark:text-zinc-650 hover:text-orange-500 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 hover:border-orange-200/50 dark:hover:border-orange-900/30 transition-all duration-200 ${isBookmarked ? 'active text-orange-500' : ''}" 
                  data-bookmark-org="${safeEscapeHtml(o.name)}" 
                  title="${isBookmarked ? 'Remove bookmark' : 'Add bookmark'}">
             <span class="material-symbols-outlined text-lg ${isBookmarked ? 'icon-fill' : ''}">star</span>
          </button>
        </div>

        <!-- Body Text & Category -->
        <div class="flex-1 relative z-10 flex flex-col">
          <h3 class="font-headline text-lg font-extrabold text-zinc-900 dark:text-zinc-50 mb-1.5 group-hover:text-primary dark:group-hover:text-orange-400 transition-colors duration-250 leading-snug line-clamp-1" title="${safeEscapeHtml(o.name)}">${safeEscapeHtml(o.name)}</h3>
          
          <div class="mb-3">
            <span class="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-label font-bold uppercase tracking-wider bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border border-orange-100 dark:border-orange-900/30">${safeEscapeHtml((o.cat || 'Other').toUpperCase())}</span>
          </div>
          
          <p class="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-3 line-clamp-2">${safeEscapeHtml(o.desc || '')}</p>

          ${typeof getOrgMetricsDashboardHTML === 'function' ? getOrgMetricsDashboardHTML(o.years, o.codebase, diffScoreObj.total, diffLabelObj.cls, true) : ''}

          <!-- Insights Box -->
          <div class="mt-auto pt-3 border-t border-zinc-100 dark:border-zinc-800/60">
            <ul class="space-y-1.5 mb-3">
              ${reasonsHtml}
            </ul>
            ${matchedSkillsHtml}
          </div>
        </div>

        <!-- Bottom: Action Bar -->
        <div class="flex items-center justify-between pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800/60 relative z-10">
          <button data-compare-org="${safeEscapeHtml(o.name)}" class="text-[10px] font-headline font-extrabold uppercase tracking-widest ${inCompare ? 'text-primary' : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300'} flex items-center gap-1.5 transition-colors duration-200">
            <span class="material-symbols-outlined text-sm transition-transform duration-200 group-hover:rotate-12">${inCompare ? 'check_circle' : 'compare_arrows'}</span> 
            ${inCompare ? 'Comparing' : 'Compare'}
          </button>
          
          <button class="text-primary hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-headline font-extrabold text-xs uppercase tracking-widest flex items-center gap-1 transition-all duration-200 group-hover:gap-2">
            View <span class="material-symbols-outlined text-sm transition-transform duration-200 group-hover:translate-x-0.5">arrow_forward</span>
          </button>
        </div>
      </article>
      `;
    }).join('');

    resultsContainer.innerHTML = `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">${html}</div>`;
  }
});
