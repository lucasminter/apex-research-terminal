const STORAGE_KEY = 'apex-goals';
let goalsData = null; // { goals: [...] }

function fmt(n) {
  return n >= 1000000
    ? '$' + (n / 1000000).toFixed(2) + 'M'
    : '$' + n.toLocaleString();
}

function pct(current, target) {
  return Math.min(100, Math.round((current / target) * 100));
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(goalsData));
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

async function loadGoals() {
  const stored = loadFromStorage();
  if (stored) {
    goalsData = stored;
    render();
    return;
  }
  try {
    const res = await fetch('/research/data/goals.json');
    if (!res.ok) throw new Error('Failed to load goals');
    goalsData = await res.json();
    render();
  } catch (err) {
    document.getElementById('goalsGrid').innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="empty-state-icon">⚠️</div>
        <div class="empty-state-title">Failed to Load</div>
        <div class="empty-state-text">${err.message}</div>
      </div>`;
  }
}

function computeSummary(goals) {
  const totalSaved = goals.reduce((s, g) => s + g.current, 0);
  const totalTarget = goals.reduce((s, g) => s + g.target, 0);
  const monthlyContributions = goals.reduce((s, g) => s + g.monthly, 0);
  const onTrackCount = goals.filter(g => g.status === 'on-track' || g.status === 'ahead').length;
  return { totalSaved, totalTarget, monthlyContributions, onTrackCount, totalGoals: goals.length };
}

function render() {
  renderSummary(computeSummary(goalsData.goals));
  renderGoals(goalsData.goals);
}

function renderSummary(s) {
  const overallPct = pct(s.totalSaved, s.totalTarget);
  document.getElementById('goalsSummary').innerHTML =
    `<div class="stats-item">Total Saved <strong style="color:var(--accent);">${fmt(s.totalSaved)}</strong></div>` +
    `<div class="stats-item">Total Target <strong>${fmt(s.totalTarget)}</strong></div>` +
    `<div class="stats-item">Overall Progress <strong style="color:var(--green);">${overallPct}%</strong></div>` +
    `<div class="stats-item">Monthly Contributions <strong style="color:var(--accent);">${fmt(s.monthlyContributions)}</strong></div>` +
    `<div class="stats-item">Goals On Track <strong style="color:var(--green);">${s.onTrackCount} / ${s.totalGoals}</strong></div>`;
}

function renderGoals(goals) {
  document.getElementById('goalsGrid').innerHTML = goals.map((g, idx) => {
    const progress = pct(g.current, g.target);
    const color = `var(--${g.color})`;
    const remaining = Math.max(0, g.target - g.current);
    const monthsLeft = g.monthly > 0 && remaining > 0 ? Math.ceil(remaining / g.monthly) : 0;
    const projectedYear = new Date().getFullYear() + Math.ceil(monthsLeft / 12);
    const projDiff = projectedYear - g.targetYear;
    const projLabel = projDiff <= 0 ? 'On time' : `${projDiff}yr behind`;
    const projColor = projDiff <= 0 ? 'var(--green)' : 'var(--red)';
    const status = progress >= 100 ? 'Complete' : projDiff <= 0 ? 'On Track' : 'Behind';
    const statusColor = progress >= 100 ? 'var(--accent)' : projDiff <= 0 ? 'var(--green)' : 'var(--red)';

    // Recompute milestones based on current progress
    const milestones = g.milestones.map(m => {
      const reached = progress >= m.pct;
      return `
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="font-size:14px;">${reached ? '✅' : '⬜'}</span>
          <span style="font-size:11px;color:${reached ? 'var(--text)' : 'var(--muted)'};">${m.label}</span>
        </div>`;
    }).join('');

    return `
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:28px;">${g.icon}</span>
            <div>
              <div class="card-title" style="font-size:15px;">${g.name}</div>
              <div style="font-size:11px;color:${statusColor};font-weight:700;">${status}</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="text-align:right;">
              <div style="font-size:22px;font-weight:800;color:${color};font-family:'IBM Plex Mono',monospace;">${progress}%</div>
              <div style="font-size:10px;color:var(--muted);">complete</div>
            </div>
            <button onclick="openEdit(${idx})" style="background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:4px 8px;cursor:pointer;color:var(--muted);font-size:12px;" title="Edit goal">✏️</button>
          </div>
        </div>

        <div style="margin-bottom:6px;">
          <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted);margin-bottom:4px;">
            <span>${fmt(g.current)} saved</span>
            <span>${fmt(g.target)} target</span>
          </div>
          <div style="height:8px;background:var(--border);border-radius:4px;overflow:hidden;">
            <div style="height:100%;width:${progress}%;background:${color};border-radius:4px;transition:width 0.4s;"></div>
          </div>
        </div>

        <div class="card-meta" style="margin:16px 0;">
          <div class="card-meta-item">
            <div class="card-meta-label">Remaining</div>
            <div class="card-meta-value">${fmt(remaining)}</div>
          </div>
          <div class="card-meta-item">
            <div class="card-meta-label">Monthly</div>
            <div class="card-meta-value" style="color:var(--accent);">${fmt(g.monthly)}</div>
          </div>
          <div class="card-meta-item">
            <div class="card-meta-label">~Months Left</div>
            <div class="card-meta-value">${monthsLeft || '—'}</div>
          </div>
          <div class="card-meta-item">
            <div class="card-meta-label">Projected</div>
            <div class="card-meta-value" style="color:${projColor};">${projLabel}</div>
          </div>
        </div>

        <p style="font-size:12px;color:var(--muted);line-height:1.5;margin-bottom:14px;">${g.notes}</p>

        <div style="border-top:1px solid var(--border);padding-top:12px;">
          <div class="card-meta-label" style="margin-bottom:8px;">Milestones</div>
          <div style="display:flex;flex-wrap:wrap;gap:10px 18px;">${milestones}</div>
        </div>
      </div>`;
  }).join('');
}

// ── Edit modal ──────────────────────────────────────────────────────────────

function openEdit(idx) {
  const g = goalsData.goals[idx];
  document.getElementById('editIdx').value = idx;
  document.getElementById('editName').value = g.name;
  document.getElementById('editTarget').value = g.target;
  document.getElementById('editCurrent').value = g.current;
  document.getElementById('editMonthly').value = g.monthly;
  document.getElementById('editTargetYear').value = g.targetYear;
  document.getElementById('editNotes').value = g.notes;
  document.getElementById('goalModal').style.display = 'flex';
}

function closeEdit() {
  document.getElementById('goalModal').style.display = 'none';
}

function saveEdit() {
  const idx = parseInt(document.getElementById('editIdx').value);
  const g = goalsData.goals[idx];
  g.name       = document.getElementById('editName').value.trim() || g.name;
  g.target     = parseFloat(document.getElementById('editTarget').value) || g.target;
  g.current    = parseFloat(document.getElementById('editCurrent').value) || 0;
  g.monthly    = parseFloat(document.getElementById('editMonthly').value) || g.monthly;
  g.targetYear = parseInt(document.getElementById('editTargetYear').value) || g.targetYear;
  g.notes      = document.getElementById('editNotes').value.trim();
  saveToStorage();
  closeEdit();
  render();
}

function resetAllGoals() {
  if (!confirm('Reset all goals to defaults? Your edits will be lost.')) return;
  localStorage.removeItem(STORAGE_KEY);
  loadGoals();
}

document.addEventListener('DOMContentLoaded', () => {
  loadGoals();
  document.getElementById('goalModal').addEventListener('click', function(e) {
    if (e.target === this) closeEdit();
  });
});
