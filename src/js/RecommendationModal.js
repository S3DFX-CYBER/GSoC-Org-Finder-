// src/js/RecommendationModal.js

const RecommendationModal = (function() {
  let modalInstance = null;
  
  function init() {
    if (modalInstance) return;
    
    const modalHTML = `
      <div id="ai-rec-modal-bg" class="modal-bg">
        <div class="modal">
          <button id="ai-rec-close-btn" class="close-btn" aria-label="Close AI Recommendations">
            <span class="material-symbols-outlined">close</span>
          </button>
          <div class="modal-header">
            <span class="category-tag">AI INTELLIGENCE</span>
            <h2>Your Best Matches</h2>
            <p>We've analyzed your profile and found the most optimal organizations for you to target.</p>
          </div>
          <div class="modal-body" id="ai-rec-modal-body">
            <!-- Content injected here -->
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    const bg = document.getElementById('ai-rec-modal-bg');
    const closeBtn = document.getElementById('ai-rec-close-btn');
    
    closeBtn.addEventListener('click', close);
    bg.addEventListener('click', (e) => {
      if (e.target === bg) close();
    });
    
    modalInstance = bg;
  }
  
  function open(recommendations) {
    if (!modalInstance) init();
    
    const body = document.getElementById('ai-rec-modal-body');
    body.innerHTML = '';
    
    if (!recommendations || recommendations.length === 0) {
      body.innerHTML = '<p class="text-zinc-500">No strong matches found. Try adding more skills to your profile.</p>';
    } else {
      const grid = document.createElement('div');
      grid.className = 'grid grid-cols-1 md:grid-cols-2 gap-4';
      
      recommendations.forEach(rec => {
        const card = globalThis.MatchScoreCard.render(rec);
        grid.appendChild(card);
      });
      
      body.appendChild(grid);
    }
    
    modalInstance.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  
  function close() {
    if (modalInstance) {
      modalInstance.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  return {
    init,
    open,
    close
  };
})();

globalThis.RecommendationModal = RecommendationModal;
