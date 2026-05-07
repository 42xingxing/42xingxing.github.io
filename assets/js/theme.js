/* ─── Theme toggle ─── */
/* 3-state cycle: system → dark → light → system. Mirrors al-folio. */

(function () {
  const STORAGE_KEY = 'theme';
  const STATES = ['system', 'dark', 'light'];
  const mql = window.matchMedia('(prefers-color-scheme: dark)');

  function readSetting() {
    const v = localStorage.getItem(STORAGE_KEY);
    return STATES.includes(v) ? v : 'system';
  }

  function resolved(setting) {
    if (setting === 'system') return mql.matches ? 'dark' : 'light';
    return setting;
  }

  function apply(setting) {
    const mode = resolved(setting);
    document.documentElement.setAttribute('data-theme', mode);
    document.documentElement.setAttribute('data-theme-setting', setting);
  }

  // Initial application (also called inline in <head> to avoid flash;
  // safe to run twice).
  apply(readSetting());

  // React to system preference changes when the user is on "system".
  mql.addEventListener('change', () => {
    if (readSetting() === 'system') apply('system');
  });

  // Wire the toggle button on DOM ready.
  function init() {
    const btn = document.getElementById('light-toggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const current = readSetting();
      const next = STATES[(STATES.indexOf(current) + 1) % STATES.length];
      localStorage.setItem(STORAGE_KEY, next);
      apply(next);
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
