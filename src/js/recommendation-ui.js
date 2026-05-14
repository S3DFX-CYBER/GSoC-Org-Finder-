// src/js/recommendation-ui.js

/* global analyzeGitHubUser, extractSkills, getRecommendations, ORGS, escapeHtml, openModal, toggleCompare, toggleBookmark, compareList, bookmarkedSet */

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
      
      const reasonsHtml = rec.reasons.map(r => `<li class="text-[11px] text-zinc-600 dark:text-zinc-400 flex items-start gap-2"><span class="material-symbols-outlined text-xs text-emerald-500 mt-0.5">check_circle</span> <span class="leading-tight">${escapeHtml(r)}</span></li>`).join('');
      
      let matchedSkillsHtml = '';
      if (rec.matchedSkills.length > 0) {
         const skillsList = rec.matchedSkills.slice(0, 4).map(s => `<span class="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded text-[9px] font-bold uppercase tracking-wider">${escapeHtml(s)}</span>`).join('');
         matchedSkillsHtml = `<div class="mt-2 flex flex-wrap gap-1">${skillsList}</div>`;
      }

      // Defined explicitly outside string to eliminate linting issues with nested template literals
      const logoHtml = logoUrl 
        ? `<img src="${escapeHtml(logoUrl)}" data-org-name="${escapeHtml(o.name)}" alt="${escapeHtml(o.name)} logo" class="w-full h-full object-contain rounded-lg" onerror="typeof handleImgError === 'function' ? handleImgError(this, this.dataset.orgName) : (this.style.display='none')">
           <div class="logo-placeholder hidden w-full h-full items-center justify-center text-primary font-bold text-xl font-headline bg-primary/5"></div>`
        : `<div class="text-primary font-bold text-xl font-headline">${escapeHtml(o.name[0] || '?')}</div>`;

      return `
      <article class="group relative bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800 transition-all hover:shadow-xl hover:border-primary/20 animate-fade-up cursor-pointer flex flex-col ${inCompare ? 'ring-2 ring-primary/30' : ''}" 
               data-org-name="${escapeHtml(o.name)}">
        
        <!-- Match Score Badge -->
        <div class="absolute top-0 right-0 bg-gradient-to-bl from-green-500 to-emerald-600 text-white px-3 py-1.5 rounded-bl-2xl rounded-tr-2xl font-bold text-xs shadow-sm flex items-center gap-1 z-10">
          <span class="material-symbols-outlined text-sm">target</span> ${rec.score}% Match
        </div>

        <!-- Header: Logo & Bookmarking -->
        <div class="flex justify-between items-start mb-4 pt-2">
          <div class="w-14 h-14 rounded-xl bg-surface-container-low dark:bg-zinc-800 flex items-center justify-center p-2 overflow-hidden">
            ${logoHtml}
          </div>
          
          <div class="flex items-center gap-2 mt-2">
             <button class="bookmark-btn ${isBookmarked ? 'active text-orange-500' : 'text-zinc-300'}" 
                     data-bookmark-org="${escapeHtml(o.name)}" 
                     title="${isBookmarked ? 'Remove bookmark' : 'Add bookmark'}">
                <span class="material-symbols-outlined text-xl ${isBookmarked ? 'icon-fill' : ''}">star</span>
             </button>
          </div>
        </div>

        <!-- Body Text & Category -->
        <div class="flex-1">
          <h3 class="font-headline text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1 group-hover:text-primary transition-colors">${escapeHtml(o.name)}</h3>
          <span class="category-tag inline-block mb-3">${escapeHtml((o.cat || 'Other').toUpperCase())}</span>
          
          <p class="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-3 line-clamp-2">${escapeHtml(o.desc || '')}</p>

          <!-- Insights Box -->
          <div class="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <ul class="space-y-1.5 mb-3">
              ${reasonsHtml}
            </ul>
            ${matchedSkillsHtml}
          </div>
        </div>

        <!-- Bottom: Action Bar -->
        <div class="flex items-center justify-between pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800">
          <button data-compare-org="${escapeHtml(o.name)}" class="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest ${inCompare ? 'text-primary' : 'text-zinc-400'} hover:text-primary transition-colors">
            <span class="material-symbols-outlined text-sm">${inCompare ? 'check_circle' : 'compare_arrows'}</span> ${inCompare ? 'Comparing' : 'Compare'}
          </button>
          
          <button class="flex items-center gap-1 text-primary font-bold text-xs uppercase tracking-widest group-hover:gap-2 transition-all">
            View <span class="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      </article>
      `;
    }).join('');

    resultsContainer.innerHTML = `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">${html}</div>`;
  }
});
