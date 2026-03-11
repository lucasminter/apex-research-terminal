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

document.addEventListener('DOMContentLoaded', loadMacro);
