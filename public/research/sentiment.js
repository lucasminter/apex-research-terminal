async function loadSentiment() {
  try {
    const res = await fetch('/research/data/sentiment.json');
    if (!res.ok) throw new Error('Failed to load sentiment data');
    const data = await res.json();
    renderSectors(data.sectors);
    renderStocks(data.stocks);
  } catch (err) {
    document.getElementById('sectorSentiment').innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <div class="empty-state-title">Failed to Load Sentiment Data</div>
        <div class="empty-state-text">${err.message}</div>
      </div>`;
  }
}

function renderSectors(sectors) {
  document.getElementById('sectorSentiment').innerHTML = sectors.map(s => {
    const pct = Math.abs(s.score);
    const sign = s.score >= 0 ? '+' : '-';
    return `
      <div class="card">
        <h4>${s.name}</h4>
        <div style="display:flex;gap:8px;margin-bottom:12px;">
          <span style="color:var(--${s.color});font-weight:600;">${sign}${pct}%</span>
          <span style="color:var(--muted);">${s.label}</span>
        </div>
        <div style="background:var(--surface);height:8px;border-radius:4px;overflow:hidden;">
          <div style="background:var(--${s.color});height:100%;width:${pct}%;"></div>
        </div>
      </div>
    `;
  }).join('');
}

function renderStocks(stocks) {
  document.getElementById('stockSentiment').innerHTML = stocks.map(s => {
    const sign = s.score >= 0 ? '+' : '';
    const bk = s.breakdown;
    return `
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <span style="color:var(--accent);font-weight:600;font-size:16px;">${s.ticker}</span>
          <span style="color:var(--${s.score_color});font-weight:600;">${sign}${s.score}</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:12px;margin-bottom:12px;">
          <div><span style="color:var(--muted);">News</span><div style="color:var(--${bk.news.color});font-weight:600;">${bk.news.value}</div></div>
          <div><span style="color:var(--muted);">Social</span><div style="color:var(--${bk.social.color});font-weight:600;">${bk.social.value}</div></div>
          <div><span style="color:var(--muted);">Analyst</span><div style="color:var(--${bk.analyst.color});font-weight:600;">${bk.analyst.value}</div></div>
          <div><span style="color:var(--muted);">Retail</span><div style="color:var(--${bk.retail.color});font-weight:600;">${bk.retail.value}</div></div>
        </div>
        <p style="font-size:11px;color:var(--muted);">${s.note}</p>
      </div>
    `;
  }).join('');
}

document.addEventListener('DOMContentLoaded', loadSentiment);
