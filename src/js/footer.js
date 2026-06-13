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

function initFooter() {
  const backToTopBtn = document.getElementById('back-to-top-btn');
  if (backToTopBtn) {
    const updateBackToTopVisibility = () => {
      const scrollTop = window.scrollY || window.pageYOffset || 0;
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
      const documentHeight = document.documentElement.scrollHeight || 0;
      const distanceFromBottom = documentHeight - (scrollTop + viewportHeight);
      const revealThreshold = Math.max(500, Math.round(viewportHeight * 0.75));

      if (distanceFromBottom <= revealThreshold) {
        backToTopBtn.classList.add('show');
      } else {
        backToTopBtn.classList.remove('show');
      }
    };

    window.addEventListener('scroll', updateBackToTopVisibility, { passive: true });
    window.addEventListener('resize', updateBackToTopVisibility);
    updateBackToTopVisibility();

    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
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
