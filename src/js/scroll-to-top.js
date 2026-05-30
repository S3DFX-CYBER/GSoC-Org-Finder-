/**
 * Scroll to Top Component
 * Creates a beautiful, accessible, and performant floating button
 * that allows users to smoothly scroll back to the top of the page.
 */
document.addEventListener('DOMContentLoaded', () => {
  // Create button element
  const button = document.createElement('button');
  button.id = 'scrollToTopBtn';
  button.setAttribute('aria-label', 'Scroll to top');
  button.setAttribute('title', 'Scroll to top');
  
  // Style using project's Tailwind config tokens
  // - Fixed position at bottom-right (bottom-6 right-6, md:bottom-8 md:right-8)
  // - Circular, elevated appearance with shadow
  // - Hover scaling (scale-110, hover:shadow-xl) and active tap animation (active:scale-95)
  // - Seamless CSS transitions for translation and opacity
  // - Focus visibility rings matching both light & dark modes
  button.className = 'fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50 flex items-center justify-center w-12 h-12 rounded-full bg-primary text-white shadow-lg hover:shadow-xl hover:bg-primary-container hover:scale-110 active:scale-95 transition-all duration-300 transform translate-y-4 opacity-0 pointer-events-none focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-zinc-950';

  // Use the existing Material Symbols Outlined font
  button.innerHTML = '<span class="material-symbols-outlined font-extrabold text-2xl">arrow_upward</span>';

  // Append to document body
  document.body.appendChild(button);

  // Performance-optimized scroll listener using requestAnimationFrame
  let isScrolling = false;
  const handleScroll = () => {
    if (!isScrolling) {
      globalThis.requestAnimationFrame(() => {
        if (globalThis.scrollY > 300) {
          button.classList.remove('translate-y-4', 'opacity-0', 'pointer-events-none');
          button.classList.add('translate-y-0', 'opacity-100', 'pointer-events-auto');
        } else {
          button.classList.remove('translate-y-0', 'opacity-100', 'pointer-events-auto');
          button.classList.add('translate-y-4', 'opacity-0', 'pointer-events-none');
        }
        isScrolling = false;
      });
      isScrolling = true;
    }
  };

  // Smooth scroll back to top
  button.addEventListener('click', () => {
    globalThis.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

  // Attach globalThis scroll listener
  globalThis.addEventListener('scroll', handleScroll);
});
