let allStocks = [];
let currentStock = null;

async function loadAsset() {
  const params = new URLSearchParams(window.location.search);
  const ticker = params.get("ticker");
  const detail = document.getElementById("assetDetail");

  if (!ticker) {
    detail.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">❌</div>
        <div class="empty-state-title">No Ticker Specified</div>
        <div class="empty-state-text"><a href="screener.html">Return to screener</a></div>
      </div>
    `;
    return;
  }

  try {
    const response = await fetch("./data/stocks.json");
    if (!response.ok) throw new Error("Failed to load stocks");
    allStocks = await response.json();

    currentStock = allStocks.find(item => item.ticker === ticker);

    if (!currentStock) {
      detail.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <div class="empty-state-title">Ticker Not Found</div>
          <div class="empty-state-text">${ticker} is not in our database. <a href="screener.html">View all stocks</a></div>
        </div>
      `;
      return;
    }

    renderAsset();
  } catch (error) {
    console.error("Error loading asset:", error);
    detail.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <div class="empty-state-title">Error Loading Data</div>
        <div class="empty-state-text">${error.message}</div>
      </div>
    `;
  }
}

function renderAsset() {
  const s = currentStock;
  const detail = document.getElementById("assetDetail");

  const healthColor = s.health >= 85 ? "var(--green)" : s.health >= 75 ? "var(--accent)" : "var(--yellow)";
  const upsideColor = s.upside >= 80 ? "var(--green)" : s.upside >= 70 ? "var(--accent)" : "var(--yellow)";
  const presenceColor = s.presence >= 85 ? "var(--green)" : s.presence >= 70 ? "var(--accent)" : "var(--yellow)";

  detail.innerHTML = `
    <div class="detail-header">
      <div class="detail-ticker">${s.ticker}</div>
      <div>
        <div class="detail-name">${s.name}</div>
        <div class="detail-sector">${s.sector}</div>
      </div>
    </div>

    <div class="metrics-grid">
      <div class="metric-card" style="border-left-color: var(--accent);">
        <div class="metric-label">Market Cap</div>
        <div class="metric-value">$${s.cap}B</div>
      </div>
      <div class="metric-card" style="border-left-color: ${healthColor};">
        <div class="metric-label">Health Score</div>
        <div class="metric-value" style="color: ${healthColor};">${s.health}%</div>
      </div>
      <div class="metric-card" style="border-left-color: ${upsideColor};">
        <div class="metric-label">Upside Score</div>
        <div class="metric-value" style="color: ${upsideColor};">${s.upside}%</div>
      </div>
      <div class="metric-card" style="border-left-color: ${presenceColor};">
        <div class="metric-label">Presence Score</div>
        <div class="metric-value" style="color: ${presenceColor};">${s.presence}%</div>
      </div>
    </div>

    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">Forward P/E</div>
        <div class="metric-value">${s.fwdPE}x</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Rev Growth</div>
        <div class="metric-value" style="color: ${s.revGrowth > 15 ? "var(--green)" : "var(--accent)"};">${s.revGrowth}%</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">EPS Growth</div>
        <div class="metric-value" style="color: ${s.epsGrowth > 20 ? "var(--green)" : "var(--accent)"};">${s.epsGrowth}%</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">FCF Margin</div>
        <div class="metric-value" style="color: ${s.fcfMargin > 25 ? "var(--green)" : "var(--accent)"};">${s.fcfMargin}%</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Dividend Yield</div>
        <div class="metric-value" style="color: ${s.dividend > 2 ? "var(--green)" : "var(--accent)"};">${s.dividend}%</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Moat</div>
        <div class="metric-value">${s.moat || "—"}</div>
      </div>
    </div>

    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">ROE</div>
        <div class="metric-value">${s.roe}%</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">ROIC</div>
        <div class="metric-value">${s.roic}%</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Debt/Equity</div>
        <div class="metric-value">${s.debt_equity}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">PEG Ratio</div>
        <div class="metric-value">${s.peg}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Price/Book</div>
        <div class="metric-value">${s.price_book}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Interest Coverage</div>
        <div class="metric-value">${s.int_coverage}x</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Investment Thesis</div>
      <p style="font-size: 13px; line-height: 1.6; color: var(--text);">${s.desc}</p>
    </div>

    <div class="section">
      <div class="section-title">Key Catalysts</div>
      <div class="list">
        ${s.catalysts.map(c => `<div class="list-item">• ${c}</div>`).join("")}
      </div>
    </div>

    <div class="section">
      <div class="section-title">Key Risks</div>
      <div class="list">
        ${s.risks.map(r => `<div class="list-item" style="border-left-color: var(--red);">⚠️ ${r}</div>`).join("")}
      </div>
    </div>

    <div class="section">
      <div class="section-title">Sentiment Analysis</div>
      <div class="metrics-grid" style="margin-top: 12px;">
        <div class="metric-card">
          <div class="metric-label">News Sentiment</div>
          <div class="metric-value" style="color: ${s.news_sentiment > 70 ? "var(--green)" : "var(--accent)"};">${s.news_sentiment}%</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Social Sentiment</div>
          <div class="metric-value" style="color: ${s.social_sentiment > 70 ? "var(--green)" : "var(--accent)"};">${s.social_sentiment}%</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Analyst Sentiment</div>
          <div class="metric-value" style="color: ${s.analyst_sentiment > 75 ? "var(--green)" : "var(--accent)"};">${s.analyst_sentiment}%</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Retail Sentiment</div>
          <div class="metric-value" style="color: ${s.retail_sentiment > 70 ? "var(--green)" : "var(--accent)"};">${s.retail_sentiment}%</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Tags</div>
      <div class="tags">
        ${s.tags.map(tag => `<span class="tag">${tag}</span>`).join("")}
      </div>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", loadAsset);
