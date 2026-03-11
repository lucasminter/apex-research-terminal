let allStocks = [];
let filteredStocks = [];
let sortBy = 'combined';

async function loadStocks() {
  try {
    const response = await fetch("/research/data/stocks.json");
    if (!response.ok) throw new Error("Failed to load stocks");
    allStocks = await response.json();
    applyFilters();
  } catch (error) {
    console.error("Error loading stocks:", error);
    document.getElementById("stockGrid").innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <div class="empty-state-title">Failed to Load Data</div>
        <div class="empty-state-text">${error.message}</div>
      </div>`;
  }
}

function scoreColor(val, good, ok) {
  return val >= good ? 'var(--green)' : val >= ok ? 'var(--accent)' : 'var(--yellow)';
}

function applyFilters() {
  const search = document.getElementById("searchInput").value.toLowerCase();
  const sector = document.getElementById("sectorFilter").value;
  const moat   = document.getElementById("moatFilter").value;

  filteredStocks = allStocks.filter(stock => {
    const matchSearch =
      stock.ticker.toLowerCase().includes(search) ||
      stock.name.toLowerCase().includes(search) ||
      (stock.desc && stock.desc.toLowerCase().includes(search));
    return matchSearch &&
      (!sector || stock.sector === sector) &&
      (!moat   || stock.moat   === moat);
  });

  applySortAndRender();
}

function applySortAndRender() {
  filteredStocks.sort((a, b) => {
    if (sortBy === 'health')  return (b.health  || 0) - (a.health  || 0);
    if (sortBy === 'upside')  return (b.upside  || 0) - (a.upside  || 0);
    if (sortBy === 'cap')     return (b.cap     || 0) - (a.cap     || 0);
    if (sortBy === 'pe')      return (a.fwdPE   || 999) - (b.fwdPE || 999);
    return ((b.health || 0) + (b.upside || 0)) - ((a.health || 0) + (a.upside || 0));
  });
  renderStocks();
  renderStats();
  updateResultCount();
}

function renderStats() {
  const strip = document.getElementById("statsStrip");
  if (!strip) return;
  if (!filteredStocks.length) { strip.style.display = 'none'; return; }

  const avgHealth = Math.round(filteredStocks.reduce((s, x) => s + (x.health || 0), 0) / filteredStocks.length);
  const avgUpside = Math.round(filteredStocks.reduce((s, x) => s + (x.upside || 0), 0) / filteredStocks.length);

  const sectorCounts = {};
  filteredStocks.forEach(s => { sectorCounts[s.sector] = (sectorCounts[s.sector] || 0) + 1; });
  const topSector = Object.entries(sectorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

  strip.style.display = 'flex';
  strip.innerHTML =
    `<div class="stats-item"><strong>${filteredStocks.length}</strong> stocks</div>` +
    `<div class="stats-item">Avg Health <strong style="color:${scoreColor(avgHealth,85,75)}">${avgHealth}%</strong></div>` +
    `<div class="stats-item">Avg Upside <strong style="color:${scoreColor(avgUpside,80,70)}">${avgUpside}%</strong></div>` +
    `<div class="stats-item">Top Sector <strong>${topSector}</strong></div>`;
}

function renderStocks() {
  const grid = document.getElementById("stockGrid");

  if (!filteredStocks.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="empty-state-icon">🔍</div>
        <div class="empty-state-title">No Stocks Found</div>
        <div class="empty-state-text">Try adjusting your filters or search query</div>
      </div>`;
    return;
  }

  grid.innerHTML = filteredStocks.map(stock => {
    const hc = scoreColor(stock.health, 85, 75);
    const uc = scoreColor(stock.upside, 80, 70);
    return `
      <a href="/research/asset.html?ticker=${encodeURIComponent(stock.ticker)}" class="card">
        <div class="card-title">${stock.ticker}</div>
        <div class="card-subtitle">${stock.name}</div>
        <div class="card-desc">${stock.desc.substring(0, 100)}...</div>

        <div class="card-meta">
          <div class="card-meta-item">
            <div class="card-meta-label">Sector</div>
            <div class="card-meta-value">${stock.sector || "—"}</div>
          </div>
          <div class="card-meta-item">
            <div class="card-meta-label">Cap</div>
            <div class="card-meta-value">$${stock.cap}B</div>
          </div>
          <div class="card-meta-item">
            <div class="card-meta-label">P/E</div>
            <div class="card-meta-value">${stock.fwdPE}x</div>
          </div>
        </div>

        <div style="display:flex;gap:12px;margin-top:12px;">
          <div style="flex:1;">
            <div class="card-meta-label">Health <span style="color:${hc};font-weight:700;">${stock.health}%</span></div>
            <div class="score-bar"><div class="score-bar-fill" style="width:${stock.health}%;background:${hc};"></div></div>
          </div>
          <div style="flex:1;">
            <div class="card-meta-label">Upside <span style="color:${uc};font-weight:700;">${stock.upside}%</span></div>
            <div class="score-bar"><div class="score-bar-fill" style="width:${stock.upside}%;background:${uc};"></div></div>
          </div>
          <div>
            <div class="card-meta-label">Moat</div>
            <div class="card-meta-value" style="font-size:12px;">${stock.moat || "—"}</div>
          </div>
        </div>

        <div class="tags">
          ${stock.tags.slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join("")}
        </div>
      </a>`;
  }).join("");
}

function updateResultCount() {
  const el = document.getElementById("resultCount");
  el.textContent = `${filteredStocks.length} result${filteredStocks.length !== 1 ? "s" : ""} found`;
}

function resetFilters() {
  document.getElementById("searchInput").value = "";
  document.getElementById("sectorFilter").value = "";
  document.getElementById("moatFilter").value = "";
  document.getElementById("sortSelect").value = "combined";
  sortBy = "combined";
  applyFilters();
}

document.addEventListener("DOMContentLoaded", () => {
  loadStocks();
  document.getElementById("searchInput").addEventListener("input", applyFilters);
  document.getElementById("sectorFilter").addEventListener("change", applyFilters);
  document.getElementById("moatFilter").addEventListener("change", applyFilters);
  document.getElementById("sortSelect").addEventListener("change", function () {
    sortBy = this.value;
    applySortAndRender();
  });
});
