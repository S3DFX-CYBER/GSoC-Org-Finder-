/* global ORGS */
/* exported updateFooterStats */

document.addEventListener('DOMContentLoaded', () => {
  const placeholder = document.getElementById('footer-placeholder');
  if (placeholder) {
    fetch('src/components/footer.html')
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load footer: ${response.status} ${response.statusText}`);
        }
        return response.text();
      })
      .then(html => {
        placeholder.outerHTML = html;
        initFooter();
      })
      .catch(err => {
        console.error('Error loading footer:', err);
      });
  } else {
    initFooter();
  }
});

// Store the listener outside the function so it can be cleaned up
let footerScrollHandler = null;

function initFooter() {
  const backToTopBtn = document.getElementById('back-to-top-btn');
  const footerElement = document.querySelector('.premium-footer');

  if (backToTopBtn) {
    // FIX: Remove existing listener if initFooter is called multiple times
    if (footerScrollHandler) {
      globalThis.removeEventListener('scroll', footerScrollHandler);
    }

    let ticking = false;
    
    // Assign the logic to our tracked variable
    footerScrollHandler = () => {
      if (!ticking) {
        globalThis.requestAnimationFrame(() => {
          let shouldShow = false;

          if (footerElement) {
            const footerTop = footerElement.getBoundingClientRect().top;
            shouldShow = footerTop <= globalThis.innerHeight + 50; 
          } else {
            shouldShow = globalThis.scrollY > 300;
          }

          if (shouldShow) {
            backToTopBtn.classList.add('show');
          } else {
            backToTopBtn.classList.remove('show');
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    // Attach the tracked listener
    globalThis.addEventListener('scroll', footerScrollHandler, { passive: true });

    // FIX: Ensure click listener is only attached once
    if (!backToTopBtn.dataset.clickBound) {
      backToTopBtn.addEventListener('click', () => {
        globalThis.scrollTo({ top: 0, behavior: 'smooth' });
      });
      backToTopBtn.dataset.clickBound = 'true';
    }
  }
  
  updateFooterStats();
}

function updateFooterStats() {
  if (typeof ORGS !== 'undefined' && Array.isArray(ORGS)) {
    const orgCount = ORGS.length;
    const vetCount = ORGS.filter(o => o.years >= 10).length;
    const newCount = ORGS.filter(o => o.years <= 3).length;

    const fOrgEl = document.getElementById('footerOrgCount');
    const fVetEl = document.getElementById('footerVeteranOrgCount');
    const fNewEl = document.getElementById('footerNewcomerOrgCount');

    if (fOrgEl) fOrgEl.textContent = String(orgCount);
    if (fVetEl) fVetEl.textContent = String(vetCount);
    if (fNewEl) fNewEl.textContent = String(newCount);
  }
}
