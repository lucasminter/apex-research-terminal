let allArticles = [];
let allCommentary = null;
let activeFilter = 'all';

async function loadNews() {
  try {
    const res = await fetch('/research/data/news.json');
    if (!res.ok) throw new Error('Failed to load news');
    const data = await res.json();
    allArticles = data.articles;
    allCommentary = data.commentary;
    renderAll();
    wireFilters();
  } catch (err) {
    document.getElementById('newsList').innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <div class="empty-state-title">Failed to Load News</div>
        <div class="empty-state-text">${err.message}</div>
      </div>`;
  }
}

function wireFilters() {
  document.querySelectorAll('.filter-tab').forEach(function (btn) {
    btn.addEventListener('click', function () {
      activeFilter = this.dataset.filter;
      document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      renderAll();
    });
  });
}

function renderAll() {
  const filtered = activeFilter === 'all'
    ? allArticles
    : allArticles.filter(a => a.tags.some(t => t.toLowerCase() === activeFilter.toLowerCase()));

  renderArticles(filtered);
  if (allCommentary) renderCommentary(allCommentary);
}

function renderArticles(articles) {
  if (!articles.length) {
    document.getElementById('newsList').innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <div class="empty-state-title">No articles in this category</div>
        <div class="empty-state-text">Try a different filter</div>
      </div>`;
    return;
  }
  document.getElementById('newsList').innerHTML = articles.map(a => {
    const breakingBadge = a.timeColor === 'red'
      ? '<span class="badge-breaking">Breaking</span>' : '';
    return `
      <div class="card" style="display:flex;gap:16px;">
        <div style="flex-shrink:0;width:120px;height:80px;background:${a.iconBg};border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:24px;">${a.icon}</div>
        <div style="flex:1;">
          <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px;">
            <h3 style="margin:0;font-size:15px;line-height:1.4;">${a.title}${breakingBadge}</h3>
            <span style="color:var(--${a.timeColor});font-size:11px;white-space:nowrap;margin-left:12px;">${a.time}</span>
          </div>
          <p style="color:var(--muted);font-size:13px;margin:0 0 12px;line-height:1.5;">${a.body}</p>
          <div style="display:flex;gap:8px;">
            ${a.tags.map(t => `<span class="tag" style="font-size:11px;">${t}</span>`).join('')}
          </div>
        </div>
      </div>`;
  }).join('');
}

function renderCommentary(c) {
  document.getElementById('newsCommentary').innerHTML = `
    <div class="card">
      <h4 style="color:var(--accent);margin-bottom:12px;">📈 Market Outlook</h4>
      <p style="font-size:13px;color:var(--muted);line-height:1.6;">${c.outlook}</p>
    </div>
    <div class="card">
      <h4 style="color:var(--green);margin-bottom:12px;">✅ Key Positives</h4>
      <ol style="font-size:13px;color:var(--muted);line-height:1.6;margin:0;padding-left:20px;">
        ${c.positives.map(p => `<li>${p}</li>`).join('')}
      </ol>
    </div>
    <div class="card">
      <h4 style="color:var(--red);margin-bottom:12px;">⚠️ Key Risks</h4>
      <ol style="font-size:13px;color:var(--muted);line-height:1.6;margin:0;padding-left:20px;">
        ${c.risks.map(r => `<li>${r}</li>`).join('')}
      </ol>
    </div>`;
}

document.addEventListener('DOMContentLoaded', loadNews);
