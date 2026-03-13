/* ================================================================
   SHARED COMPONENTS — renders header/nav on every page
   Load this script immediately after <header data-page="..."></header>
   ================================================================ */
(function () {
  var NAV = [
    { key: 'index',     label: 'Dashboard', href: '/research/index.html' },
    { key: 'screener',  label: 'Screener',  href: '/research/screener.html' },
    { key: 'macro',     label: 'Macro',     href: '/research/macro.html' },
    { key: 'news',      label: 'News',      href: '/research/news.html' },
    { key: 'backtest',  label: 'Backtest',  href: '/research/backtest.html' },
  ];

  var header = document.querySelector('header');
  if (!header) return;

  var activePage = header.dataset.page || '';

  var navLinks = NAV.map(function (p) {
    var cls = 'nav-link' + (p.key === activePage ? ' active' : '');
    return '<a href="' + p.href + '" class="' + cls + '">' + p.label + '</a>';
  }).join('');

  header.innerHTML =
    '<div class="logo"><div class="logo-icon">📊</div><span>Apex Research Hub</span></div>' +
    '<nav style="display:flex;gap:8px;">' + navLinks + '</nav>' +
    '<button id="theme-toggle" title="Toggle day/night mode">&#127769;</button>';
})();
