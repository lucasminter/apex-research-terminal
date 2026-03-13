let activeStrategy = null;

async function loadStrategy() {
  try {
    const res = await fetch('/research/data/strategy.json');
    if (!res.ok) throw new Error('Failed to load strategy data');
    const data = await res.json();
    renderStrategies(data.strategies);
    renderRules(data.rules);
  } catch (err) {
    document.getElementById('strategyGrid').innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="empty-state-icon">⚠️</div>
        <div class="empty-state-title">Failed to Load</div>
        <div class="empty-state-text">${err.message}</div>
      </div>`;
  }
}

function renderStrategies(strategies) {
  const grid = document.getElementById('strategyGrid');
  grid.innerHTML = strategies.map(s => {
    const riskColor = `var(--${s.riskColor})`;
    const allocationBars = s.allocation.map(a => `
      <div style="margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
          <span style="font-size:11px;color:var(--muted);">${a.label}</span>
          <span style="font-size:11px;font-weight:700;color:var(--${a.color});">${a.pct}%</span>
        </div>
        <div class="score-bar">
          <div class="score-bar-fill" style="width:${a.pct}%;background:var(--${a.color});"></div>
        </div>
      </div>`).join('');

    const holdings = s.topHoldings.map(t =>
      `<span class="tag" style="font-size:11px;font-family:'IBM Plex Mono',monospace;">${t}</span>`
    ).join('');

    const tags = s.tags.map(t => `<span class="tag">${t}</span>`).join('');

    return `
      <div class="card strategy-card" data-id="${s.id}" onclick="selectStrategy('${s.id}', this)">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
          <span style="font-size:28px;">${s.icon}</span>
          <div>
            <div class="card-title" style="font-size:16px;">${s.name}</div>
            <div class="card-subtitle">${s.tagline}</div>
          </div>
        </div>

        <div class="card-meta" style="margin-bottom:16px;">
          <div class="card-meta-item">
            <div class="card-meta-label">Risk</div>
            <div class="card-meta-value" style="color:${riskColor};">${s.risk}</div>
          </div>
          <div class="card-meta-item">
            <div class="card-meta-label">Horizon</div>
            <div class="card-meta-value">${s.horizon}</div>
          </div>
          <div class="card-meta-item">
            <div class="card-meta-label">Expected Return</div>
            <div class="card-meta-value" style="color:var(--green);">${s.returnRange}</div>
          </div>
          <div class="card-meta-item">
            <div class="card-meta-label">Health Score</div>
            <div class="card-meta-value" style="color:var(--accent);">${s.health}%</div>
          </div>
        </div>

        <p style="font-size:12px;color:var(--muted);line-height:1.6;margin-bottom:16px;">${s.description}</p>

        <div style="margin-bottom:16px;">${allocationBars}</div>

        <div style="margin-bottom:12px;">
          <div class="card-meta-label" style="margin-bottom:6px;">Top Holdings</div>
          <div class="tags">${holdings}</div>
        </div>

        <div class="tags">${tags}</div>
      </div>`;
  }).join('');
}

function selectStrategy(id, el) {
  document.querySelectorAll('.strategy-card').forEach(c => c.classList.remove('active'));
  if (activeStrategy === id) {
    activeStrategy = null;
  } else {
    activeStrategy = id;
    el.classList.add('active');
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function renderRules(rules) {
  document.getElementById('strategyRules').innerHTML = rules.map(r => `
    <div class="card" style="display:flex;gap:14px;align-items:flex-start;">
      <span style="font-size:22px;flex-shrink:0;">${r.icon}</span>
      <div>
        <div style="font-weight:700;margin-bottom:4px;">${r.title}</div>
        <p style="font-size:13px;color:var(--muted);line-height:1.6;">${r.body}</p>
      </div>
    </div>`).join('');
}

document.addEventListener('DOMContentLoaded', loadStrategy);
