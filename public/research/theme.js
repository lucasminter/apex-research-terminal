(function () {
  var STORAGE_KEY = 'apex-theme';

  function getTheme() {
    return localStorage.getItem(STORAGE_KEY) || 'dark';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    var btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  function toggleTheme() {
    var next = getTheme() === 'dark' ? 'light' : 'dark';
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  }

  // Apply saved theme immediately (before paint)
  applyTheme(getTheme());

  document.addEventListener('DOMContentLoaded', function () {
    applyTheme(getTheme());
    var btn = document.getElementById('theme-toggle');
    if (btn) btn.addEventListener('click', toggleTheme);
  });
})();
