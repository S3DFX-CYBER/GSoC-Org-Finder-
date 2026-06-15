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
  const footerElement = document.querySelector('.premium-footer');

  if (backToTopBtn) {
    let ticking = false; // Variable to track the requestAnimationFrame state

    window.addEventListener('scroll', () => {
      // Issue 1 Fix: Throttle the scroll event using requestAnimationFrame
      if (!ticking) {
        window.requestAnimationFrame(() => {
          let shouldShow = false;

          if (footerElement) {
            // Get the distance from the top of the viewport to the top of the footer
            const footerTop = footerElement.getBoundingClientRect().top;
            shouldShow = footerTop <= window.innerHeight + 50; 
          } else {
            // Issue 2 Fix: Apply bot's exact suggestion for the fallback
            shouldShow = window.scrollY > 300;
          }

          if (shouldShow) {
            backToTopBtn.classList.add('show');
          } else {
            backToTopBtn.classList.remove('show');
          }

          ticking = false; // Reset the tick so the next frame can fire
        });
        ticking = true;
      }
    }, { passive: true });

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
