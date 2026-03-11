async function loadEarnings() {
  try {
    const res = await fetch('/research/data/earnings.json');
    if (!res.ok) throw new Error('Failed to load earnings data');
    const data = await res.json();
    renderCalendar(data.calendar);
    renderSurprises(data.surprises);
  } catch (err) {
    document.getElementById('earningsTable').innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <div class="empty-state-title">Failed to Load Earnings Data</div>
        <div class="empty-state-text">${err.message}</div>
      </div>`;
  }
}

function renderCalendar(calendar) {
  document.getElementById('earningsTable').innerHTML = calendar.map(e => `
    <tr style="border-bottom:1px solid var(--surface);">
      <td style="padding:12px;">${e.date}</td>
      <td style="padding:12px;color:var(--accent);font-weight:600;">${e.ticker}</td>
      <td style="padding:12px;">${e.company}</td>
      <td style="padding:12px;"><span class="tag">${e.sector}</span></td>
      <td style="padding:12px;text-align:center;">${e.eps_est}</td>
      <td style="padding:12px;text-align:center;">${e.rev_est}</td>
      <td style="padding:12px;text-align:center;color:var(--${e.beat_color});font-weight:600;">${e.beat_rate}%</td>
    </tr>
  `).join('');
}

function renderSurprises(surprises) {
  document.getElementById('earningsSurprises').innerHTML = surprises.map(s => `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <span style="color:var(--accent);font-weight:600;">${s.ticker}</span>
        <span style="color:var(--${s.color});font-weight:600;">${s.change}</span>
      </div>
      <p style="font-size:12px;color:var(--muted);">${s.note}</p>
    </div>
  `).join('');
}

document.addEventListener('DOMContentLoaded', loadEarnings);
