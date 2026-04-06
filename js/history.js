/* ============================================
   HISTORY MANAGER
   ============================================ */
const HISTORY_KEY = 'yt-seo-history';
const MAX_HISTORY = 200;

function getHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); }
    catch { return []; }
}

function saveHistoryItem(item) {
    const h = getHistory();
    h.unshift({
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        type: item.type || 'general',
        title: item.title || 'Untitled',
        content: item.content || '',
        input: item.input || '',
        ts: Date.now()
    });
    if (h.length > MAX_HISTORY) h.length = MAX_HISTORY;
    localStorage.setItem(HISTORY_KEY, JSON.stringify(h));
    updateStatCount();
}

function clearHistory() {
    if (!confirm('সব History মুছে ফেলবেন?')) return;
    localStorage.setItem(HISTORY_KEY, '[]');
    renderHistory();
    updateStatCount();
    showToast('History cleared', 's');
}

function renderHistory(filter = '') {
    const el = document.getElementById('historyItems');
    if (!el) return;
    let items = getHistory();
    if (filter) {
        const q = filter.toLowerCase();
        items = items.filter(i => i.title.toLowerCase().includes(q) || i.type.toLowerCase().includes(q));
    }
    if (!items.length) {
        el.innerHTML = '<div class="empty-msg" style="min-height:120px"><i class="fas fa-inbox"></i><p>No history</p></div>';
        return;
    }
    const icons = { script: 'fa-scroll', idea: 'fa-lightbulb', image: 'fa-image', voice: 'fa-microphone-alt', video: 'fa-film', quick: 'fa-bolt' };
    el.innerHTML = items.map(i => {
        const icon = icons[i.type] || 'fa-file';
        const d = new Date(i.ts);
        const dateStr = d.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
        return `<div class="h-item" onclick="loadHistoryItem('${i.id}')">
            <div class="h-item-type"><i class="fas ${icon}"></i> ${i.type}</div>
            <div class="h-item-title">${escHTML(i.title)}</div>
            <div class="h-item-date">${dateStr}</div>
        </div>`;
    }).join('');
}

function searchHistory() {
    const q = document.getElementById('historySearchInput')?.value || '';
    renderHistory(q);
}

function loadHistoryItem(id) {
    const item = getHistory().find(i => i.id === id);
    if (!item) return;
    const outputs = ['scriptOutput', 'ideaOutput', 'imgOutput', 'voOutput', 'vidOutput', 'quickContent'];
    for (const oid of outputs) {
        const el = document.getElementById(oid);
        if (el) { el.innerHTML = `<div class="generated-text">${escHTML(item.content)}</div>`; break; }
    }
    toggleHistory();
    showToast('History loaded', 'i');
}

function toggleHistory() {
    const p = document.getElementById('historyPanel');
    const o = document.getElementById('historyOverlay');
    p?.classList.toggle('open');
    o?.classList.toggle('open');
    if (p?.classList.contains('open')) renderHistory();
}

function updateStatCount() {
    const el = document.getElementById('statGenerated');
    if (el) el.textContent = getHistory().length;
}

function escHTML(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
}