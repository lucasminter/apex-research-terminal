const PORT_KEY = 'apex-portfolio';
let stocksLookup = {}; // ticker -> stock object from stocks.json

// ── Persistence ────────────────────────────────────────────────────────────

function getHoldings() {
  try { const s = localStorage.getItem(PORT_KEY); return s ? JSON.parse(s) : []; }
  catch (e) { return []; }
}

function saveHoldings(h) {
  localStorage.setItem(PORT_KEY, JSON.stringify(h));
}

// ── Formatting ──────────────────────────────────────────────────────────────

function fmtDollar(n) {
  if (Math.abs(n) >= 1000000) return '$' + (n / 1000000).toFixed(2) + 'M';
  return (n < 0 ? '-$' : '$') + Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPct(n) {
  return (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
}

// ── Data loading ────────────────────────────────────────────────────────────

async function loadPortfolio() {
  try {
    const res = await fetch('/research/data/stocks.json');
    if (!res.ok) throw new Error('Failed to load stock data');
    const arr = await res.json();
    arr.forEach(s => { stocksLookup[s.ticker] = s; });
  } catch (e) {
    console.warn('Could not load stocks.json:', e.message);
  }
  render();
}

// ── Compute ─────────────────────────────────────────────────────────────────

function computeHoldings(holdings) {
  return holdings.map(h => {
    const stock = stocksLookup[h.ticker];
    const currentPrice = stock ? stock.price : null;
    const currentValue = currentPrice != null ? currentPrice * h.shares : null;
    const costBasis = h.buyPrice * h.shares;
    const gainLoss = currentValue != null ? currentValue - costBasis : null;
    const gainLossPct = costBasis > 0 && gainLoss != null ? (gainLoss / costBasis) * 100 : null;
    const dayChange = stock ? (stock.change || 0) : 0;
    const dayChangeDollar = currentValue != null ? currentValue * (dayChange / 100) : null;
    return {
      ...h,
      name: stock ? stock.name : h.ticker,
      sector: stock ? stock.sector : '—',
      currentPrice,
      currentValue,
      costBasis,
      gainLoss,
      gainLossPct,
      dayChange,
      dayChangeDollar,
    };
  });
}

function computeSummary(computed) {
  const totalValue    = computed.reduce((s, h) => s + (h.currentValue || h.costBasis), 0);
  const totalCost     = computed.reduce((s, h) => s + h.costBasis, 0);
  const totalGainLoss = totalValue - totalCost;
  const totalGainPct  = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;
  const dayChange     = computed.reduce((s, h) => s + (h.dayChangeDollar || 0), 0);
  const dayChangePct  = totalValue > 0 ? (dayChange / totalValue) * 100 : 0;

  const sectorMap = {};
  computed.forEach(h => {
    const v = h.currentValue || h.costBasis;
    sectorMap[h.sector] = (sectorMap[h.sector] || 0) + v;
  });
  const sectors = Object.entries(sectorMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value, pct: totalValue > 0 ? (value / totalValue) * 100 : 0 }));

  return { totalValue, totalCost, totalGainLoss, totalGainPct, dayChange, dayChangePct, sectors };
}

// ── Render ───────────────────────────────────────────────────────────────────

function render() {
  const raw = getHoldings();
  const computed = computeHoldings(raw);
  const summary = computeSummary(computed);
  renderSummary(summary);
  renderAllocation(summary.sectors, summary.totalValue);
  renderHoldings(computed, summary.totalValue);
}

function renderSummary(s) {
  const glColor = s.totalGainLoss >= 0 ? 'var(--green)' : 'var(--red)';
  const dcColor = s.dayChange >= 0 ? 'var(--green)' : 'var(--red)';
  document.getElementById('portSummary').innerHTML =
    `<div class="portfolio-stat ${s.totalGainLoss >= 0 ? 'stat-green' : 'stat-red'}">
      <div class="portfolio-stat-label">Total Value</div>
      <div class="portfolio-stat-value" style="color:var(--text);">${fmtDollar(s.totalValue)}</div>
      <div class="portfolio-stat-sub" style="color:var(--muted);">Cost basis: ${fmtDollar(s.totalCost)}</div>
    </div>` +
    `<div class="portfolio-stat ${s.totalGainLoss >= 0 ? 'stat-green' : 'stat-red'}">
      <div class="portfolio-stat-label">Total Gain / Loss</div>
      <div class="portfolio-stat-value" style="color:${glColor};">${fmtDollar(s.totalGainLoss)}</div>
      <div class="portfolio-stat-sub" style="color:${glColor};">${fmtPct(s.totalGainPct)}</div>
    </div>` +
    `<div class="portfolio-stat ${s.dayChange >= 0 ? 'stat-green' : 'stat-red'}">
      <div class="portfolio-stat-label">Today's Change</div>
      <div class="portfolio-stat-value" style="color:${dcColor};">${fmtDollar(s.dayChange)}</div>
      <div class="portfolio-stat-sub" style="color:${dcColor};">${fmtPct(s.dayChangePct)}</div>
    </div>` +
    `<div class="portfolio-stat stat-blue">
      <div class="portfolio-stat-label">Positions</div>
      <div class="portfolio-stat-value" style="color:var(--text);">${getHoldings().length}</div>
      <div class="portfolio-stat-sub" style="color:var(--muted);">holdings</div>
    </div>`;
}

const SECTOR_COLORS = ['accent','green','yellow','orange','red','muted'];

function renderAllocation(sectors, totalValue) {
  const el = document.getElementById('portAllocation');
  if (!sectors.length) { el.innerHTML = '<p style="color:var(--muted);font-size:13px;">Add holdings to see allocation.</p>'; return; }
  el.innerHTML = sectors.map((sec, i) => {
    const color = `var(--${SECTOR_COLORS[i % SECTOR_COLORS.length]})`;
    return `
      <div style="margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
          <span style="font-size:12px;color:var(--muted);">${sec.name}</span>
          <span style="font-size:12px;font-weight:700;color:${color};">${sec.pct.toFixed(1)}% <span style="color:var(--muted);font-weight:400;">${fmtDollar(sec.value)}</span></span>
        </div>
        <div class="score-bar"><div class="score-bar-fill" style="width:${sec.pct}%;background:${color};height:6px;"></div></div>
      </div>`;
  }).join('');
}

function renderHoldings(computed, totalValue) {
  const tbody = document.getElementById('portTable');
  if (!computed.length) {
    tbody.innerHTML = '<tr><td colspan="9" style="padding:40px;text-align:center;color:var(--muted);">No holdings yet. Add your first position above.</td></tr>';
    return;
  }
  tbody.innerHTML = computed.map((h, idx) => {
    const glColor = (h.gainLoss || 0) >= 0 ? 'var(--green)' : 'var(--red)';
    const dcColor = h.dayChange >= 0 ? 'var(--green)' : 'var(--red)';
    const weight = totalValue > 0 && h.currentValue ? ((h.currentValue / totalValue) * 100).toFixed(1) + '%' : '—';
    const price = h.currentPrice != null ? '$' + h.currentPrice.toFixed(2) : '—';
    const value = h.currentValue != null ? fmtDollar(h.currentValue) : '—';
    const gl = h.gainLoss != null ? fmtDollar(h.gainLoss) : '—';
    const glPct = h.gainLossPct != null ? fmtPct(h.gainLossPct) : '—';
    const dc = h.dayChange !== 0 ? fmtPct(h.dayChange) : '—';

    return `<tr style="cursor:pointer;" onclick="window.location='/research/asset.html?ticker=${h.ticker}'">
      <td><span class="ticker" style="font-size:13px;">${h.ticker}</span><br><span style="font-size:11px;color:var(--muted);">${h.name}</span></td>
      <td style="text-align:right;">${h.shares}</td>
      <td style="text-align:right;font-family:'IBM Plex Mono',monospace;">$${h.buyPrice.toFixed(2)}</td>
      <td style="text-align:right;font-family:'IBM Plex Mono',monospace;">${price}</td>
      <td style="text-align:right;font-family:'IBM Plex Mono',monospace;">${value}</td>
      <td style="text-align:right;font-family:'IBM Plex Mono',monospace;color:${glColor};">${gl}<br><span style="font-size:11px;">${glPct}</span></td>
      <td style="text-align:right;color:${dcColor};">${dc}</td>
      <td style="text-align:right;color:var(--muted);font-size:12px;">${weight}</td>
      <td style="text-align:right;">
        <button onclick="event.stopPropagation();editHolding(${idx})" style="background:transparent;border:1px solid var(--border);border-radius:4px;padding:3px 7px;cursor:pointer;color:var(--muted);font-size:11px;margin-right:4px;">✏️</button>
        <button onclick="event.stopPropagation();removeHolding(${idx})" style="background:transparent;border:1px solid var(--border);border-radius:4px;padding:3px 7px;cursor:pointer;color:var(--red);font-size:11px;">×</button>
      </td>
    </tr>`;
  }).join('');
}

// ── Add / Edit / Remove ─────────────────────────────────────────────────────

function openAddForm() {
  document.getElementById('portFormTitle').textContent = 'Add Position';
  document.getElementById('portEditIdx').value = '';
  document.getElementById('portTicker').value = '';
  document.getElementById('portShares').value = '';
  document.getElementById('portBuyPrice').value = '';
  document.getElementById('portModal').style.display = 'flex';
  document.getElementById('portTicker').focus();
}

function editHolding(idx) {
  const h = getHoldings()[idx];
  document.getElementById('portFormTitle').textContent = 'Edit Position';
  document.getElementById('portEditIdx').value = idx;
  document.getElementById('portTicker').value = h.ticker;
  document.getElementById('portShares').value = h.shares;
  document.getElementById('portBuyPrice').value = h.buyPrice;
  document.getElementById('portModal').style.display = 'flex';
}

function saveHolding() {
  const ticker   = document.getElementById('portTicker').value.trim().toUpperCase();
  const shares   = parseFloat(document.getElementById('portShares').value);
  const buyPrice = parseFloat(document.getElementById('portBuyPrice').value);
  const errEl    = document.getElementById('portFormError');

  if (!ticker) { errEl.textContent = 'Ticker is required.'; return; }
  if (!shares || shares <= 0) { errEl.textContent = 'Enter a valid number of shares.'; return; }
  if (!buyPrice || buyPrice <= 0) { errEl.textContent = 'Enter a valid buy price.'; return; }
  errEl.textContent = '';

  const holdings = getHoldings();
  const idxRaw = document.getElementById('portEditIdx').value;
  if (idxRaw !== '') {
    holdings[parseInt(idxRaw)] = { ticker, shares, buyPrice };
  } else {
    holdings.push({ ticker, shares, buyPrice });
  }
  saveHoldings(holdings);
  closeModal();
  render();
}

function removeHolding(idx) {
  if (!confirm('Remove this position?')) return;
  const holdings = getHoldings();
  holdings.splice(idx, 1);
  saveHoldings(holdings);
  render();
}

function closeModal() {
  document.getElementById('portModal').style.display = 'none';
}

function clearAll() {
  if (!confirm('Clear all holdings? This cannot be undone.')) return;
  localStorage.removeItem(PORT_KEY);
  render();
}

document.addEventListener('DOMContentLoaded', () => {
  loadPortfolio();
  document.getElementById('portModal').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
  });
  document.getElementById('portBuyPrice').addEventListener('keydown', e => {
    if (e.key === 'Enter') saveHolding();
  });
});
