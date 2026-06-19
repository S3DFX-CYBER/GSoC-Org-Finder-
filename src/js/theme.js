// Theme initialization, toggling, and cross-tab synchronization logic

(function(){
  // Globally expose theme toggle function
  window.toggleTheme = function(){
    const isDark = document.documentElement.classList.toggle('dark');
    try {
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    } catch(e) {
      console.warn('LocalStorage write blocked/failed:', e);
    }
    updateThemeIcon();
  };

  // Helper to update the UI theme toggle button state and icon
  function updateThemeIcon(){
    const btn = document.getElementById('themeToggleBtn');
    const icon = btn ? btn.querySelector('.material-symbols-outlined') : null;
    if(icon){
      const isDark = document.documentElement.classList.contains('dark');
      icon.textContent = isDark ? 'light_mode' : 'dark_mode';
      btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
      btn.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
      btn.setAttribute('title', isDark ? 'Switch to light theme' : 'Switch to dark theme');
    }
  }

  // Synchronize theme changes across open tabs/windows
  window.addEventListener('storage', (e) => {
    if (e.key === 'theme') {
      const isDark = e.newValue === 'dark';
      document.documentElement.classList.toggle('dark', isDark);
      updateThemeIcon();
    }
  });

  // Function to initialize theme state on load
  function initTheme(){
    let saved = 'light';
    try {
      saved = localStorage.getItem('theme') || 'light';
    } catch(e) {
      console.warn('LocalStorage read blocked/failed:', e);
    }
    document.documentElement.classList.toggle('dark', saved === 'dark');
    updateThemeIcon();
  }

  // Run initial theme check and icon update once the DOM is ready (or immediately if already parsed)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
  } else {
    initTheme();
  }
})();
