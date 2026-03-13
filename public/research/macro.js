async function loadMacro() {
  try {
    const res = await fetch('/research/data/macro.json');
    if (!res.ok) throw new Error('Failed to load macro data');
    const data = await res.json();
    renderIndicators(data.indicators);
    renderRotation(data.rotation_signals);
  } catch (err) {
    document.getElementById('macroGrid').innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <div class="empty-state-title">Failed to Load Macro Data</div>
        <div class="empty-state-text">${err.message}</div>
      </div>`;
  }
}

function trendArrow(color) {
  if (color === 'green')  return '<span style="color:var(--green);"> ↑</span>';
  if (color === 'red')    return '<span style="color:var(--red);"> ↓</span>';
  if (color === 'yellow' || color === 'orange') return '<span style="color:var(--yellow);"> →</span>';
  return '';
}

function cardBorderColor(items) {
  const greens = items.filter(i => i.color === 'green').length;
  const reds   = items.filter(i => i.color === 'red').length;
  if (reds > 0 && reds >= greens)  return 'var(--red)';
  if (greens >= items.length / 2)  return 'var(--green)';
  return 'var(--yellow)';
}

function indicatorRows(items) {
  return items.map(i => `
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <span style="color:var(--muted);font-size:12px;">${i.label}</span>
      <span style="color:var(--${i.color});font-weight:600;">${i.value}${trendArrow(i.color)}</span>
    </div>`).join('');
}

function macroCard(title, items) {
  const border = cardBorderColor(items);
  return `
    <div class="card" style="border-left:3px solid ${border};">
      <h3 style="margin-bottom:16px;">${title}</h3>
      <div style="display:flex;flex-direction:column;gap:12px;">${indicatorRows(items)}</div>
    </div>`;
}

function renderIndicators(ind) {
  document.getElementById('macroGrid').innerHTML =
    macroCard('📈 Economic Indicators', ind.economic) +
    macroCard('📊 Yield Curve',         ind.yield_curve) +
    macroCard('📈 Market Breadth',      ind.breadth) +
    macroCard('🔄 Sector Performance',  ind.sectors) +
    macroCard('🛢️ Commodity Prices',   ind.commodities) +
    macroCard('💳 Credit Spreads',      ind.credit);
}

function renderRotation(signals) {
  document.getElementById('macroRotation').innerHTML = signals.map(s => `
    <div class="card">
      <h4 style="color:var(--${s.color});margin-bottom:8px;">${s.title}</h4>
      <p style="font-size:13px;color:var(--muted);">${s.body}</p>
    </div>`).join('');
}

// ─── MACRO REGIME DETECTION ───────────────────────────────────────────────────
const REGIME_LABELS = {
  1: { name: 'Stagflation',       arrow: '↓ Growth · ↑ Inflation', color: 'red',    picks: 'Commodities · Energy · Gold' },
  2: { name: 'Inflation Bust',    arrow: '↓ Growth · ↓ Inflation', color: 'yellow', picks: 'TIPS · Energy · Short Duration' },
  3: { name: 'Goldilocks',        arrow: '↑ Growth · ↓ Inflation', color: 'green',  picks: 'Equities · Credit · Real Estate' },
  4: { name: 'Deflationary Bust', arrow: '↓ Growth · ↓ Inflation', color: 'muted',  picks: 'Long Bonds · Cash · Gold' },
};

async function loadMacroRegime() {
  const el = document.getElementById('regimeCard');
  if (!el) return;
  try {
    const d = await fetch('/api/macro-regime').then(r => r.json());
    const r = REGIME_LABELS[d.regime] || REGIME_LABELS[3];
    const cpi = d.indicators.cpiYoY != null ? `<span>CPI YoY: <strong>${d.indicators.cpiYoY.toFixed(1)}%</strong></span>` : '';
    const gdp = d.indicators.gdpGrowth != null ? `<span>GDP QoQ: <strong>${d.indicators.gdpGrowth.toFixed(1)}%</strong></span>` : '';
    const headlines = d.indicators.topHeadlines.length
      ? `<div style="margin-top:12px;border-top:1px solid var(--border);padding-top:10px;">
           <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin-bottom:6px;">Relevant Headlines</div>
           ${d.indicators.topHeadlines.map(h => `<div style="font-size:11px;color:var(--muted);margin-bottom:4px;line-height:1.5">• ${h}</div>`).join('')}
         </div>` : '';
    el.innerHTML = `
      <div style="border-left:3px solid var(--${r.color});padding-left:12px;margin-bottom:14px;">
        <div style="font-size:18px;font-weight:700;color:var(--${r.color});margin-bottom:2px;">Q${d.regime} — ${r.name}</div>
        <div style="font-size:12px;color:var(--muted);margin-bottom:6px;">${r.arrow}</div>
        <div style="font-size:11px;font-weight:600;color:var(--text);">Favoured: <span style="color:var(--accent)">${r.picks}</span></div>
      </div>
      <div style="display:flex;gap:16px;font-size:11px;color:var(--muted);flex-wrap:wrap;margin-bottom:8px;">
        ${cpi}${gdp}
        <span>Confidence: <strong style="color:var(--${r.color})">${d.confidence}%</strong></span>
        <span>Growth: <strong>${d.growthScore >= 0 ? '+' : ''}${d.growthScore.toFixed(2)}</strong></span>
        <span>Inflation: <strong>${d.inflationScore >= 0 ? '+' : ''}${d.inflationScore.toFixed(2)}</strong></span>
      </div>
      <div style="font-size:10px;color:var(--muted);font-style:italic;">
        Updated ${new Date(d.updatedAt).toLocaleString()} · Cached 1hr · FRED + RSS
      </div>
      ${headlines}`;
  } catch {
    el.innerHTML = '<div style="color:var(--muted);font-size:12px;">⚠ Regime detection offline</div>';
  }
}

document.addEventListener('DOMContentLoaded', () => { loadMacro(); loadMacroRegime(); });
