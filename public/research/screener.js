let allStocks = [];
let filteredStocks = [];

// Load stocks from JSON
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
      </div>
    `;
  }
}

// Apply all filters
function applyFilters() {
  const searchValue = document.getElementById("searchInput").value.toLowerCase();
  const sectorValue = document.getElementById("sectorFilter").value;
  const moatValue = document.getElementById("moatFilter").value;

  filteredStocks = allStocks.filter(stock => {
    const matchesSearch =
      stock.ticker.toLowerCase().includes(searchValue) ||
      stock.name.toLowerCase().includes(searchValue) ||
      (stock.desc && stock.desc.toLowerCase().includes(searchValue));

    const matchesSector = !sectorValue || stock.sector === sectorValue;
    const matchesMoat = !moatValue || stock.moat === moatValue;

    return matchesSearch && matchesSector && matchesMoat;
  });

  // Sort by health/upside score (descending)
  filteredStocks.sort((a, b) => {
    const scoreA = (a.health || 0) + (a.upside || 0);
    const scoreB = (b.health || 0) + (b.upside || 0);
    return scoreB - scoreA;
  });

  renderStocks();
  updateResultCount();
}

// Render stock cards
function renderStocks() {
  const grid = document.getElementById("stockGrid");

  if (!filteredStocks || filteredStocks.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <div class="empty-state-icon">🔍</div>
        <div class="empty-state-title">No Stocks Found</div>
        <div class="empty-state-text">Try adjusting your filters or search query</div>
      </div>
    `;
    return;
  }

  grid.innerHTML = filteredStocks
    .map(stock => {
      const healthColor = stock.health >= 85 ? "var(--green)" : stock.health >= 75 ? "var(--accent)" : "var(--yellow)";
      const upsideColor = stock.upside >= 80 ? "var(--green)" : stock.upside >= 70 ? "var(--accent)" : "var(--yellow)";

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

          <div class="card-meta" style="margin-top: 12px;">
            <div class="card-meta-item">
              <div class="card-meta-label">Health</div>
              <div class="card-meta-value" style="color: ${healthColor}; font-size: 14px;">${stock.health}%</div>
            </div>
            <div class="card-meta-item">
              <div class="card-meta-label">Upside</div>
              <div class="card-meta-value" style="color: ${upsideColor}; font-size: 14px;">${stock.upside}%</div>
            </div>
            <div class="card-meta-item">
              <div class="card-meta-label">Moat</div>
              <div class="card-meta-value">${stock.moat || "—"}</div>
            </div>
          </div>

          <div class="tags">
            ${stock.tags.slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join("")}
          </div>
        </a>
      `;
    })
    .join("");
}

// Update result count
function updateResultCount() {
  const count = document.getElementById("resultCount");
  count.textContent = `${filteredStocks.length} result${filteredStocks.length !== 1 ? "s" : ""} found`;
}

// Reset all filters
function resetFilters() {
  document.getElementById("searchInput").value = "";
  document.getElementById("sectorFilter").value = "";
  document.getElementById("moatFilter").value = "";
  applyFilters();
}

// Event listeners
document.addEventListener("DOMContentLoaded", () => {
  loadStocks();

  document.getElementById("searchInput").addEventListener("input", applyFilters);
  document.getElementById("sectorFilter").addEventListener("change", applyFilters);
  document.getElementById("moatFilter").addEventListener("change", applyFilters);
});
