/**
 * Ready Theme (non-React usage)
 * 
 * For vanilla JS or SSR contexts where React isn't available.
 * Matches the tokens defined in tokens.css
 */

(function() {
  const STORAGE_KEY = 'ready-theme-mode';

  function getPreferredTheme() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'Dark' || stored === 'Light') return stored;
    } catch (e) {}
    
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      return 'Dark';
    }
    return 'Light';
  }

  function applyTheme(mode) {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(mode === 'Dark' ? 'dark' : 'light');
    root.setAttribute('data-theme', mode === 'Dark' ? 'dark' : 'light');
    
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch (e) {}
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'Light' : 'Dark');
  }

  // Initialize on load
  applyTheme(getPreferredTheme());

  // Expose globally
  window.ReadyTheme = {
    getPreferredTheme,
    applyTheme,
    toggleTheme,
  };
})();
