/* ============================================
   MAIN APP - YouTube SEO Tools 2.0
   ============================================ */

// ===== DateTime =====
function updateClock() {
    const now = new Date();
    const dEl = document.getElementById('topDate');
    const tEl = document.getElementById('topTime');
    if (dEl) dEl.textContent = now.toLocaleDateString('bn-BD', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    if (tEl) tEl.textContent = now.toLocaleTimeString('bn-BD');
}
setInterval(updateClock, 1000);
updateClock();

// ===== UI Helpers =====
function showLoading(msg) { const l = document.getElementById('loadingScreen'); const t = document.getElementById('loadingText'); if (l) l.classList.add('show'); if (t) t.textContent = msg || 'AI Generating...'; }
function hideLoading() { document.getElementById('loadingScreen')?.classList.remove('show'); }

function showToast(msg, type = 'i', dur = 3000) {
    const c = document.getElementById('toastArea'); if (!c) return;
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    const icons = { s: 'fa-check-circle', e: 'fa-exclamation-circle', i: 'fa-info-circle', w: 'fa-exclamation-triangle' };
    t.innerHTML = `<i class="fas ${icons[type] || icons.i}"></i><span>${msg}</span>`;
    c.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, dur);
}

function toggleMobileMenu() {
    document.getElementById('mobileMenu')?.classList.toggle('open');
    document.getElementById('mobileOverlay')?.classList.toggle('open');
}

function copyToClip(text) {
    if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).then(() => showToast('Copied!', 's'));
    } else {
        const ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); showToast('Copied!', 's'); } catch { showToast('Copy failed', 'e'); }
        ta.remove();
    }
}

function downloadFile(content, name) {
    const b = new Blob([content], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b); a.download = name;
    a.click(); URL.revokeObjectURL(a.href);
    showToast(`Downloaded: ${name}`, 's');
}

function copyOutput(id) {
    const el = document.getElementById(id);
    if (el) copyToClip(el.innerText);
}

function downloadOutput(id) {
    const el = document.getElementById(id);
    if (el) downloadFile(el.innerText, `yt-seo-${id}-${Date.now()}.txt`);
}

function togglePass(id) { const el = document.getElementById(id); if (el) el.type = el.type === 'password' ? 'text' : 'password'; }

// ===== Theme =====
function setTheme(t) { document.documentElement.setAttribute('data-theme', t); localStorage.setItem('app-theme', t); }
(function initTheme() { const t = localStorage.getItem('app-theme') || 'dark'; document.documentElement.setAttribute('data-theme', t); const sel = document.getElementById('appTheme'); if (sel) sel.value = t; })();

// ===== Unique Seed =====
function uid() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 8); }

// ===== Used Prompts Tracker (Anti-Duplicate) =====
const USED_KEY = 'yt-seo-used';
function getUsed() { try { return JSON.parse(localStorage.getItem(USED_KEY) || '[]'); } catch { return []; } }
function markUsed(text) {
    const u = getUsed(); const h = simpleHash(text);
    if (!u.includes(h)) { u.push(h); if (u.length > 500) u.shift(); localStorage.setItem(USED_KEY, JSON.stringify(u)); }
}
function simpleHash(s) { let h = 0; for (let i = 0; i < Math.min(s.length, 200); i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; } return h.toString(); }

// ===== Version Manager =====
const versions = {};
function addVersion(key, content) {
    if (!versions[key]) versions[key] = [];
    versions[key].push(content);
    markUsed(content);
    return versions[key].length - 1;
}
function showVersions(key, barId, btnsId) {
    const bar = document.getElementById(barId);
    const btns = document.getElementById(btnsId);
    if (!bar || !btns || !versions[key]) return;
    bar.style.display = 'flex';
    btns.innerHTML = versions[key].map((_, i) =>
        `<button class="ver-btn ${i === versions[key].length - 1 ? 'active' : ''}" onclick="selectVersion('${key}',${i},'${btnsId}')">${i + 1}</button>`
    ).join('');
}
function selectVersion(key, idx, btnsId) {
    const btns = document.getElementById(btnsId);
    btns?.querySelectorAll('.ver-btn').forEach((b, i) => b.classList.toggle('active', i === idx));
    const outputMap = { script: 'scriptOutput', idea: 'ideaOutput', img: 'imgOutput', vo: 'voOutput', vid: 'vidOutput', quick: 'quickContent' };
    const outEl = document.getElementById(outputMap[key]);
    if (outEl && versions[key]?.[idx]) outEl.innerHTML = `<div class="generated-text">${escHTML(versions[key][idx])}</div>`;
}

// ===== QUICK GENERATE =====
async function quickGenerate() {
    const type = document.getElementById('quickType')?.value || 'video_script';
    const input = document.getElementById('quickInput')?.value?.trim();
    if (!input) return showToast('টপিক লিখুন', 'w');

    showLoading('AI Generating...');
    try {
        const prompt = `[UNIQUE ID: ${uid()}]\nGenerate a unique ${type.replace(/_/g, ' ')} about "${input}".\nBe creative, professional, and detailed.\nLanguage: Respond in Bengali/Bangla.\nDo NOT repeat any previous generation.`;
        const result = await gemini.generate(prompt);
        const idx = addVersion('quick', result);

        document.getElementById('quickResults').style.display = 'block';
        document.getElementById('quickRegenBtn').style.display = 'flex';
        showVersions('quick', 'quickResults', 'quickVersions');
        document.getElementById('quickContent').innerHTML = `<div class="generated-text">${escHTML(result)}</div>`;

        const vBtns = document.getElementById('quickVersions');
        vBtns.innerHTML = versions.quick.map((_, i) =>
            `<button class="ver-btn ${i === idx ? 'active' : ''}" onclick="selectVersion('quick',${i},'quickVersions')">${i + 1}</button>`
        ).join('');

        saveHistoryItem({ type: 'quick', title: `${type}: ${input.substring(0, 40)}`, content: result, input });
        hideLoading();
        showToast('Generated!', 's');
    } catch (e) { hideLoading(); showToast(e.message, 'e'); }
}

function copyQuickResult() {
    const el = document.getElementById('quickContent');
    if (el) copyToClip(el.innerText);
}
function downloadQuickResult() {
    const el = document.getElementById('quickContent');
    if (el) downloadFile(el.innerText, `quick-gen-${Date.now()}.txt`);
}

// ===== SCRIPT GENERATOR =====
async function generateScript() {
    const topic = document.getElementById('scriptTopic')?.value?.trim();
    if (!topic) return showToast('Topic/Keyword লিখুন', 'w');

    const type = document.getElementById('scriptType')?.value || 'youtube_video';
    const lang = document.getElementById('scriptLang')?.value || 'bangla';
    const dur = document.getElementById('scriptDuration')?.value || 'medium';
    const tone = document.getElementById('scriptTone')?.value || 'professional';
    const extra = document.getElementById('scriptExtra')?.value || '';
    const seo = document.getElementById('chkSEO')?.checked;
    const imgP = document.getElementById('chkImgPrompt')?.checked;
    const vidP = document.getElementById('chkVidPrompt')?.checked;
    const voP = document.getElementById('chkVoiceOver')?.checked;

    const langMap = { bangla: 'Bengali/Bangla', english: 'English', hindi: 'Hindi', banglish: 'Mixed Bengali & English' };

    showLoading('Generating Script...');
    try {
        const prompt = `[UNIQUE ID: ${uid()}]
Generate a COMPLETELY UNIQUE ${type.replace(/_/g, ' ')} about "${topic}".

Language: ${langMap[lang] || 'Bengali'}
Duration: ${dur}
Tone: ${tone}
${extra ? `Special Instructions: ${extra}` : ''}

Structure the script with:
📌 HOOK, 📌 INTRO, 📌 MAIN CONTENT (multiple parts), 📌 CONCLUSION, 📌 CTA

${seo ? 'Include: 🔍 SEO Title (3 options), 📝 SEO Description, 🏷️ Tags (20+)' : ''}
${imgP ? 'Include: 🖼️ IMAGE PROMPTS (3 unique Midjourney-style thumbnail prompts)' : ''}
${vidP ? 'Include: 🎬 VIDEO PROMPTS (3 cinematic video generation prompts)' : ''}
${voP ? 'Include: 🎙️ VOICE OVER SCRIPT with [tone directions] and [PAUSE] markers' : ''}

Format with emojis, clear sections, and dividers. NEVER repeat previous content.`;

        const result = await gemini.generate(prompt, { tokens: 4096 });
        const idx = addVersion('script', result);

        document.getElementById('scriptOutput').innerHTML = `<div class="generated-text">${escHTML(result)}</div>`;
        document.getElementById('scriptRegenBtn').style.display = 'flex';
        document.getElementById('scriptTabs').style.display = 'flex';
        showVersions('script', 'scriptVersionBar', 'scriptVersionBtns');

        window._scriptFullText = result;

        saveHistoryItem({ type: 'script', title: `Script: ${topic.substring(0, 40)}`, content: result, input: topic });
        hideLoading();
        showToast('Script generated!', 's');
    } catch (e) { hideLoading(); showToast(e.message, 'e'); }
}

function switchScriptTab(tab, btn) {
    document.querySelectorAll('#scriptTabs .otab').forEach(b => b.classList.remove('active'));
    btn?.classList.add('active');
    const full = window._scriptFullText || '';
    const out = document.getElementById('scriptOutput');
    if (!out) return;

    if (tab === 'full') { out.innerHTML = `<div class="generated-text">${escHTML(full)}</div>`; return; }

    const sections = { seo: /SEO|Title|Description|Tags/i, imgprompt: /IMAGE PROMPT/i, vidprompt: /VIDEO PROMPT/i, voiceover: /VOICE OVER/i };
    const regex = sections[tab];
    if (!regex) return;

    const lines = full.split('\n');
    let capture = false, extracted = [];
    for (const line of lines) {
        if (regex.test(line)) { capture = true; extracted.push(line); continue; }
        if (capture && (line.startsWith('🖼️') || line.startsWith('🎬') || line.startsWith('🎙️') || line.startsWith('🔍') || line.startsWith('📌')) && !regex.test(line)) { capture = false; continue; }
        if (capture) extracted.push(line);
    }
    out.innerHTML = extracted.length ? `<div class="generated-text">${escHTML(extracted.join('\n'))}</div>` : `<div class="empty-msg"><p>This section not found in current generation</p></div>`;
}

// ===== IDEA GENERATOR =====
async function generateIdeas() {
    let niche = document.getElementById('ideaNiche')?.value || 'technology';
    if (niche === 'custom') niche = document.getElementById('customNiche')?.value || 'general';
    const count = document.getElementById('ideaCount')?.value || 10;
    const audience = document.getElementById('ideaAudience')?.value || '';
    const lang = document.getElementById('ideaLang')?.value || 'bangla';

    showLoading('Generating Ideas...');
    try {
        const prompt = `[UNIQUE ID: ${uid()}]
Generate ${count} COMPLETELY UNIQUE YouTube video ideas for "${niche}" niche.
${audience ? `Target Audience: ${audience}` : ''}
Language: ${lang === 'bangla' ? 'Bengali' : 'English'}

Each idea must include:
• 📹 Catchy Video Title
• 📝 Brief Description (2-3 lines)
• 📊 Estimated View Potential
• ⚡ Difficulty Level
• 🕐 Best Upload Time

Make ideas creative, trending, and NEVER repeated.`;

        const result = await gemini.generate(prompt, { tokens: 3000 });
        addVersion('idea', result);

        document.getElementById('ideaOutput').innerHTML = `<div class="generated-text">${escHTML(result)}</div>`;
        document.getElementById('ideaRegenBtn') && (document.getElementById('ideaRegenBtn').style.display = 'flex');
        showVersions('idea', 'ideaVersionBar', 'ideaVersionBtns');

        saveHistoryItem({ type: 'idea', title: `Ideas: ${niche}`, content: result, input: niche });
        hideLoading();
        showToast('Ideas generated!', 's');
    } catch (e) { hideLoading(); showToast(e.message, 'e'); }
}

// ===== IMAGE EXTRACTOR =====
let uploadedBase64 = null;

function handleImageSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return showToast('Valid image select করুন', 'e');
    if (file.size > 10 * 1024 * 1024) return showToast('Max 10MB', 'e');

    const reader = new FileReader();
    reader.onload = function (ev) {
        uploadedBase64 = ev.target.result.split(',')[1];
        document.getElementById('uploadPlaceholder').style.display = 'none';
        const prev = document.getElementById('uploadPreview');
        prev.style.display = 'block';
        document.getElementById('previewImg').src = ev.target.result;
        showToast('Image loaded!', 's');
    };
    reader.readAsDataURL(file);
}

function removeUploadedImage(e) {
    e?.stopPropagation();
    uploadedBase64 = null;
    document.getElementById('uploadPlaceholder').style.display = '';
    document.getElementById('uploadPreview').style.display = 'none';
    const input = document.getElementById('imgFileInput');
    if (input) input.value = '';
}

// Drag & Drop
document.addEventListener('DOMContentLoaded', () => {
    const zone = document.getElementById('uploadZone');
    if (!zone) return;
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop', e => {
        e.preventDefault(); zone.classList.remove('dragover');
        const f = e.dataTransfer.files[0];
        if (f?.type.startsWith('image/')) {
            const dt = new DataTransfer(); dt.items.add(f);
            document.getElementById('imgFileInput').files = dt.files;
            handleImageSelect({ target: { files: [f] } });
        }
    });
});

async function extractFromImage() {
    if (!uploadedBase64) return showToast('ছবি আপলোড করুন', 'w');
    const style = document.getElementById('imgStyle')?.value || 'midjourney';

    showLoading('AI Analyzing Image...');
    try {
        const prompt = `[UNIQUE ID: ${uid()}]
Analyze this image in detail and generate the following SEPARATELY:

🖼️ IMAGE PROMPTS (3 unique ${style} style prompts):
Each prompt should be detailed with subject, composition, lighting, colors, mood, camera angle, quality descriptors.

🎬 VIDEO PROMPTS (3 unique cinematic prompts):
Each with camera movement, transitions, lighting, mood progression, resolution.

📖 STORY PROMPT:
A creative story/narrative prompt inspired by this image.

Format with clear section headers and dividers. Make each prompt UNIQUE.`;

        const result = await gemini.generateWithImage(uploadedBase64, prompt);
        addVersion('img', result);

        document.getElementById('imgOutput').innerHTML = `<div class="generated-text">${escHTML(result)}</div>`;
        document.getElementById('imgRegenBtn') && (document.getElementById('imgRegenBtn').style.display = 'flex');
        document.getElementById('imgTabs') && (document.getElementById('imgTabs').style.display = 'flex');
        showVersions('img', 'imgVersionBar', 'imgVersionBtns');

        window._imgFullText = result;

        saveHistoryItem({ type: 'image', title: `Image Extract: ${style}`, content: result, input: 'Image Upload' });
        hideLoading();
        showToast('Extracted!', 's');
    } catch (e) { hideLoading(); showToast(e.message, 'e'); }
}

function switchImgTab(tab, btn) {
    document.querySelectorAll('#imgTabs .otab').forEach(b => b.classList.remove('active'));
    btn?.classList.add('active');
    const full = window._imgFullText || '';
    const out = document.getElementById('imgOutput');
    if (!out) return;
    if (tab === 'all') { out.innerHTML = `<div class="generated-text">${escHTML(full)}</div>`; return; }

    const map = { image: /IMAGE PROMPT/i, video: /VIDEO PROMPT/i, story: /STORY PROMPT/i };
    const regex = map[tab];
    const lines = full.split('\n');
    let capture = false, ext = [];
    for (const line of lines) {
        if (regex?.test(line)) { capture = true; ext.push(line); continue; }
        if (capture && /^(🖼️|🎬|📖)/.test(line) && !regex?.test(line)) break;
        if (capture) ext.push(line);
    }
    out.innerHTML = ext.length ? `<div class="generated-text">${escHTML(ext.join('\n'))}</div>` : '<div class="empty-msg"><p>Section not found</p></div>';
}

// ===== VOICE OVER =====
async function generateVoiceOver() {
    const topic = document.getElementById('voTopic')?.value?.trim();
    if (!topic) return showToast('Topic লিখুন', 'w');
    const type = document.getElementById('voType')?.value;
    const tone = document.getElementById('voTone')?.value;
    const dur = document.getElementById('voDuration')?.value;
    const lang = document.getElementById('voLang')?.value;

    showLoading('Generating Voice Over...');
    try {
        const prompt = `[UNIQUE ID: ${uid()}]
Generate a UNIQUE ${type} voice over script.
Topic: ${topic}
Tone: ${tone}
Duration: ${dur}
Language: ${lang === 'bangla' ? 'Bengali' : lang === 'hindi' ? 'Hindi' : 'English'}

Include:
- [TONE/EMOTION] directions in brackets
- [PAUSE - X SEC] indicators
- [EMPHASIS] markers
- Natural flow, professional quality

NEVER repeat previous content.`;

        const result = await gemini.generate(prompt, { tokens: 3000 });
        addVersion('vo', result);
        document.getElementById('voOutput').innerHTML = `<div class="generated-text">${escHTML(result)}</div>`;
        document.getElementById('voRegenBtn') && (document.getElementById('voRegenBtn').style.display = 'flex');
        showVersions('vo', 'voVersionBar', 'voVersionBtns');
        saveHistoryItem({ type: 'voice', title: `Voice: ${topic.substring(0, 40)}`, content: result, input: topic });
        hideLoading(); showToast('Generated!', 's');
    } catch (e) { hideLoading(); showToast(e.message, 'e'); }
}

// ===== VIDEO EXTRACTOR =====
async function extractVideo() {
    const desc = document.getElementById('vidDesc')?.value?.trim();
    if (!desc) return showToast('Description লিখুন', 'w');
    const type = document.getElementById('vidExtractType')?.value || 'all';
    const lang = document.getElementById('vidLang')?.value || 'bangla';

    showLoading('Extracting...');
    try {
        const prompt = `[UNIQUE ID: ${uid()}]
Based on this video content: "${desc}"

Generate ${type === 'all' ? 'ALL of the following' : type.replace(/_/g, ' ')}:

🎬 VIDEO PROMPTS (3 cinematic prompts)
🖼️ IMAGE PROMPTS (3 thumbnail/scene prompts)
📝 SCRIPT (recreated outline)
🔍 SEO DATA (title, description, tags)

Language: ${lang === 'bangla' ? 'Bengali' : 'English'}
UNIQUE content only.`;

        const result = await gemini.generate(prompt, { tokens: 3000 });
        addVersion('vid', result);
        document.getElementById('vidOutput').innerHTML = `<div class="generated-text">${escHTML(result)}</div>`;
        document.getElementById('vidRegenBtn') && (document.getElementById('vidRegenBtn').style.display = 'flex');
        showVersions('vid', 'vidVersionBar', 'vidVersionBtns');
        saveHistoryItem({ type: 'video', title: `Extract: ${desc.substring(0, 40)}`, content: result, input: desc });
        hideLoading(); showToast('Extracted!', 's');
    } catch (e) { hideLoading(); showToast(e.message, 'e'); }
}

// ===== DOWNLOAD PAGE =====
function filterDL(type, btn) {
    document.querySelectorAll('.dl-filter').forEach(b => b.classList.remove('active'));
    btn?.classList.add('active');
    const items = type === 'all' ? getHistory() : getHistory().filter(i => i.type === type);
    renderDL(items);
}

function renderDL(items) {
    const el = document.getElementById('dlList');
    if (!el) return;
    if (!items?.length) { el.innerHTML = '<div class="empty-msg"><i class="fas fa-inbox"></i><p>No items</p></div>'; return; }
    const icons = { script: '📝', idea: '💡', image: '🖼️', voice: '🎙️', video: '🎬', quick: '⚡' };
    el.innerHTML = items.map(i => {
        const d = new Date(i.ts).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
        return `<div class="dl-item">
            <div class="dl-info">
                <div class="dl-type">${icons[i.type] || '📄'} ${i.type}</div>
                <div class="dl-title">${escHTML(i.title)}</div>
                <div class="dl-date">${d}</div>
            </div>
            <div class="dl-actions">
                <button onclick="copyToClip(decodeURIComponent('${encodeURIComponent(i.content)}'))" class="icon-btn" title="Copy"><i class="fas fa-copy"></i></button>
                <button onclick="downloadFile(decodeURIComponent('${encodeURIComponent(i.content)}'),'${i.type}-${i.id}.txt')" class="icon-btn" title="Download"><i class="fas fa-download"></i></button>
            </div>
        </div>`;
    }).join('');
}

function downloadAll() {
    const items = getHistory();
    if (!items.length) return showToast('No items', 'w');
    let text = '=== YouTube SEO Tools 2.0 - All Content ===\n\n';
    items.forEach((i, n) => { text += `--- #${n + 1}: ${i.title} (${i.type}) ---\n${i.content}\n\n`; });
    downloadFile(text, `yt-seo-all-${Date.now()}.txt`);
}

// ===== SETTINGS =====
function saveGeminiSettings() {
    const key = document.getElementById('geminiApiKey')?.value?.trim();
    const model = document.getElementById('geminiModel')?.value;
    if (!key) return showToast('API Key দিন', 'w');
    localStorage.setItem('groq-api-key', key);
    localStorage.setItem('groq-model', model);
    gemini.loadConfig();
    showToast('Saved!', 's');
}

async function testGeminiConnection() {
    const key = document.getElementById('geminiApiKey')?.value?.trim();
    if (!key) return showToast('API Key দিন', 'w');
    localStorage.setItem('groq-api-key', key);
    localStorage.setItem('gemini-model', document.getElementById('geminiModel')?.value || 'gemini-2.0-flash');
    gemini.loadConfig();

    showLoading('Testing...');
    const res = await gemini.testConnection();
    hideLoading();

    const el = document.getElementById('connectionResult');
    if (el) {
        el.className = `connection-result ${res.ok ? 'ok' : 'err'}`;
        el.textContent = res.msg;
    }
    showToast(res.ok ? 'Connection OK!' : 'Failed!', res.ok ? 's' : 'e');
}

function saveAppSettings() {
    const theme = document.getElementById('appTheme')?.value;
    const lang = document.getElementById('defaultLang')?.value;
    if (theme) setTheme(theme);
    if (lang) localStorage.setItem('default-lang', lang);
    showToast('Settings saved!', 's');
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    updateStatCount();

    // Load settings into forms
    const keyInput = document.getElementById('geminiApiKey');
    if (keyInput) keyInput.value = localStorage.getItem('groq-api-key') || '';
    const modelSel = document.getElementById('geminiModel');
    if (modelSel) modelSel.value = localStorage.getItem('groq-model') || 'gemini-2.0-flash';

    // Download page auto-load
    if (document.getElementById('dlList')) filterDL('all', document.querySelector('.dl-filter.active'));

    // Register SW
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(() => {});
    }
});