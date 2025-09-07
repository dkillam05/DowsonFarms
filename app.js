// ===== App constants =====
const APP_VERSION = 'v6.2';  // displayed as vMAJOR.MINOR in footer

// ===== Auth guard (client-side demo) =====
function isAuthed(){ try { return localStorage.getItem('df_auth') === '1'; } catch { return false; } }
(function enforceAuth(){
  const here = location.pathname.split('/').pop().toLowerCase();
  if (!isAuthed() && here !== 'login.html') {
    window.location.replace('login.html');
  }
})();

// ===== Routes =====
const ROUTES = {
  '': 'home',
  '#/home': 'home',

  // Crop production hub + subroutes
  '#/crop': 'Crop Production',
  '#/crop/planting': 'Planting',
  '#/crop/spraying': 'Spraying',
  '#/crop/aerial': 'Aerial',
  '#/crop/harvest': 'Harvest',
  '#/crop/maintenance': 'Maintenance',
  '#/crop/scouting': 'Scouting',
  '#/crop/trials': 'Trials',

  '#/calculator': 'Calculator',
  '#/field': 'Field Maintenance',

  // Equipment hub + subroutes (NEW)
  '#/equipment': 'Equipment',
  '#/equipment/receivers': 'Receivers & Tech',
  '#/equipment/tractors': 'Tractors',
  '#/equipment/combines': 'Combines',
  '#/equipment/sprayer': 'Sprayer / Fertilizer Spreader',
  '#/equipment/construction': 'Construction Equipment',
  '#/equipment/trucks-trailers': 'Trucks & Trailers',
  '#/equipment/implements': 'Implements',
  '#/equipment/shop': 'Shop',
  '#/equipment/barcodes': 'Barcode / QR Codes',

  '#/grain': 'Grain Tracking',
  '#/employees': 'Employees',
  '#/ai': 'AI Reports',

  // Settings
  '#/settings': 'Settings',
  '#/settings/crops': 'Settings',

  // Feedback hub + subroutes
  '#/feedback': 'Feedback',
  '#/feedback/errors': 'Report Errors',
  '#/feedback/feature': 'Feature Request',
};

// ===== Utilities =====
function pad2(n){ return n<10 ? '0'+n : ''+n; }
function formatClock12(d=new Date()){
  let h = d.getHours(); const m = d.getMinutes(); const ampm = h>=12 ? 'PM':'AM';
  h = h%12 || 12; return `${h}:${pad2(m)} ${ampm}`;
}
function ordinal(n){ const s=["th","st","nd","rd"], v=n%100; return n + (s[(v-20)%10] || s[v] || s[0]); }
function prettyDate(d=new Date()){
  const dow = d.toLocaleString(undefined,{ weekday:'long' });
  const month = d.toLocaleString(undefined,{ month:'long' });
  return `${dow} ${month} ${ordinal(d.getDate())} ${d.getFullYear()}`;
}
function normalizeVersion(v){
  const m = String(v || '').trim().replace(/^v/i,'');
  const [maj='0', min='0'] = m.split('.');
  return `${maj}.${min}`;
}
function displayVersion(v){ return 'v' + normalizeVersion(v); }

// ===== DOM refs =====
const app = document.getElementById('app');
const crumbs = document.getElementById('breadcrumbs');
const versionEl = document.getElementById('version');
const todayEl = document.getElementById('today');
const clockEl = document.getElementById('clock');
const logoutBtn = document.getElementById('logout');
const bannerEl = document.getElementById('update-banner');
const bannerBtn = document.getElementById('update-refresh');

// ===== Rendering =====
function renderBreadcrumb(){
  const hash = location.hash || '#/home';

  // Settings crumbs
  if (hash === '#/settings') {
    crumbs.innerHTML = `<a href="#/home">Home</a> &nbsp;&gt;&nbsp; <span>Settings</span>`;
    return;
  }
  if (hash.startsWith('#/settings/crops')) {
    crumbs.innerHTML = `<a href="#/home">Home</a> &nbsp;&gt;&nbsp; <a href="#/settings">Settings</a> &nbsp;&gt;&nbsp; <span>Crop Type</span>`;
    return;
  }

  // Crop Production crumbs
  const cropKids = [
    '#/crop/planting','#/crop/spraying','#/crop/aerial',
    '#/crop/harvest','#/crop/maintenance','#/crop/scouting','#/crop/trials'
  ];
  if (hash === '#/crop') {
    crumbs.innerHTML = `<a href="#/home">Home</a> &nbsp;&gt;&nbsp; <span>Crop Production</span>`;
    return;
  }
  if (cropKids.includes(hash)) {
    const label = ROUTES[hash] || 'Section';
    crumbs.innerHTML = `<a href="#/home">Home</a> &nbsp;&gt;&nbsp; <a href="#/crop">Crop Production</a> &nbsp;&gt;&nbsp; <span>${label}</span>`;
    return;
  }

  // Equipment crumbs (NEW)
  const eqKids = [
    '#/equipment/receivers','#/equipment/tractors','#/equipment/combines',
    '#/equipment/sprayer','#/equipment/construction','#/equipment/trucks-trailers',
    '#/equipment/implements','#/equipment/shop','#/equipment/barcodes'
  ];
  if (hash === '#/equipment') {
    crumbs.innerHTML = `<a href="#/home">Home</a> &nbsp;&gt;&nbsp; <span>Equipment</span>`;
    return;
  }
  if (eqKids.includes(hash)) {
    const label = ROUTES[hash] || 'Section';
    crumbs.innerHTML = `<a href="#/home">Home</a> &nbsp;&gt;&nbsp; <a href="#/equipment">Equipment</a> &nbsp;&gt;&nbsp; <span>${label}</span>`;
    return;
  }

  // Feedback crumbs
  const fbKids = ['#/feedback/errors', '#/feedback/feature'];
  if (hash === '#/feedback') {
    crumbs.innerHTML = `<a href="#/home">Home</a> &nbsp;&gt;&nbsp; <span>Feedback</span>`;
    return;
  }
  if (fbKids.includes(hash)) {
    const label = ROUTES[hash];
    crumbs.innerHTML = `<a href="#/home">Home</a> &nbsp;&gt;&nbsp; <a href="#/feedback">Feedback</a> &nbsp;&gt;&nbsp; <span>${label}</span>`;
    return;
  }

  // Home or generic
  if (hash === '#/home' || hash === '') {
    crumbs.innerHTML = `<span>Home</span>`;
    return;
  }
  const name = ROUTES[hash] || 'Section';
  crumbs.innerHTML = `<a href="#/home">Home</a> &nbsp;&gt;&nbsp; <span>${name}</span>`;
}

function viewHome(){
  app.innerHTML = `
    <div class="grid" role="list">
      ${tile('🌽','Crop Production','#/crop')}
      ${tile('🔢','Calculator','#/calculator')}
      ${tile('🛠️','Field Maintenance','#/field')}
      ${tile('🚜','Equipment','#/equipment')}
      ${tile('📦','Grain Tracking','#/grain')}
      ${tile('👥','Employees','#/employees')}
      ${tile('🤖','AI Reports','#/ai')}
      ${tile('⚙️','Settings','#/settings')}
      ${tile('💬','Feedback','#/feedback')}
    </div>
  `;
}

function tile(emoji,label,href){
  return `
    <a class="tile" role="listitem" href="${href}" aria-label="${label}">
      <span class="emoji">${emoji}</span>
      <span class="label">${label}</span>
    </a>
  `;
}

function viewSection(title, backHref = '#/home', backLabel = 'Back to Dashboard'){
  app.innerHTML = `
    <section class="section">
      <h1>${title}</h1>
      <p>Coming soon.</p>
      <a class="btn" href="${backHref}">${backLabel}</a>
    </section>
  `;
}

/* ---------------- Crop Production ---------------- */
function viewCropHub(){
  app.innerHTML = `
    <div class="grid" role="list">
      ${tile('🌱','Planting','#/crop/planting')}
      ${tile('🧪','Spraying','#/crop/spraying')}
      ${tile('🚁','Aerial','#/crop/aerial')}
      ${tile('🌾','Harvest','#/crop/harvest')}
      ${tile('🧰','Maintenance','#/crop/maintenance')}
      ${tile('🔎','Scouting','#/crop/scouting')}
      ${tile('🧬','Trials','#/crop/trials')}
    </div>

    <div class="settings-actions">
      <a class="btn" href="#/home">Back to Dashboard</a>
    </div>
  `;
}

/* ---------------- Equipment (NEW) ---------------- */
// Equipment hub grid with emojis & your order (Receivers first)
function viewEquipmentHub(){
  app.innerHTML = `
    <div class="grid" role="list">
      ${tile('📡','Receivers & Tech','#/equipment/receivers')}
      ${tile('🚜','Tractors','#/equipment/tractors')}
      ${tile('🌾','Combines','#/equipment/combines')}
      ${tile('💦','Sprayer / Fertilizer Spreader','#/equipment/sprayer')}
      ${tile('🏗️','Construction Equipment','#/equipment/construction')}
      ${tile('🚚','Trucks & Trailers','#/equipment/trucks-trailers')}
      ${tile('⚙️','Implements','#/equipment/implements')}
      ${tile('🛠️','Shop','#/equipment/shop')}
      ${tile('🔖','Barcode / QR Codes','#/equipment/barcodes')}
    </div>

    <div class="settings-actions">
      <a class="btn" href="#/home">Back to Dashboard</a>
    </div>
  `;
}

/* ---------------- Feedback ---------------- */
function viewFeedbackHub(){
  app.innerHTML = `
    <div class="grid" role="list">
      ${tile('🛠️','Report Errors','#/feedback/errors')}
      ${tile('💡','New Feature Request','#/feedback/feature')}
    </div>

    <div class="settings-actions">
      <a class="btn" href="#/home">Back to Dashboard</a>
    </div>
  `;
}
function saveFeedback(entry){
  try {
    const key = 'df_feedback';
    const list = JSON.parse(localStorage.getItem(key) || '[]');
    list.push({ ...entry, ts: Date.now() });
    localStorage.setItem(key, JSON.stringify(list));
  } catch {}
}
function viewFeedbackErrors(){
  app.innerHTML = `
    <section class="section">
      <h1>🛠️ Report Errors</h1>
      <p class="muted small">Tell us what went wrong. Details help us fix it fast.</p>

      <div class="field">
        <label for="err-subj">Subject</label>
        <input id="err-subj" type="text" placeholder="e.g., Crash when opening Equipment" />
      </div>

      <div class="field">
        <label for="err-desc">What happened?</label>
        <textarea id="err-desc" rows="5" placeholder="Steps to reproduce, what you expected, screenshots (if any)…"></textarea>
      </div>

      <div class="field">
        <label for="err-contact">Contact (optional)</label>
        <input id="err-contact" type="text" placeholder="Phone or email" />
      </div>

      <button id="err-submit" class="btn-primary">Submit</button>
      <a class="btn" href="#/feedback">Back to Feedback</a>
    </section>
  `;
  document.getElementById('err-submit')?.addEventListener('click', () => {
    const subject = (document.getElementById('err-subj').value || '').trim();
    const details = (document.getElementById('err-desc').value || '').trim();
    const contact = (document.getElementById('err-contact').value || '').trim();
    if (!subject || !details) { alert('Please provide a subject and details.'); return; }
    saveFeedback({ type:'error', subject, details, contact });
    alert('Thanks! Your error report was saved.');
    location.hash = '#/feedback';
  });
}
function viewFeedbackFeature(){
  app.innerHTML = `
    <section class="section">
      <h1>💡 New Feature Request</h1>
      <p class="muted small">What would make your day easier?</p>

      <div class="field">
        <label for="feat-subj">Feature title</label>
        <input id="feat-subj" type="text" placeholder="e.g., Barcode printing from Equipment" />
      </div>

      <div class="field">
        <label for="feat-desc">Describe the idea</label>
        <textarea id="feat-desc" rows="5" placeholder="What it should do, where it would live, any examples…"></textarea>
      </div>

      <div class="field">
        <label for="feat-contact">Contact (optional)</label>
        <input id="feat-contact" type="text" placeholder="Phone or email" />
      </div>

      <button id="feat-submit" class="btn-primary">Submit</button>
      <a class="btn" href="#/feedback">Back to Feedback</a>
    </section>
  `;
  document.getElementById('feat-submit')?.addEventListener('click', () => {
    const subject = (document.getElementById('feat-subj').value || '').trim();
    const details = (document.getElementById('feat-desc').value || '').trim();
    const contact = (document.getElementById('feat-contact').value || '').trim();
    if (!subject || !details) { alert('Please provide a title and description.'); return; }
    saveFeedback({ type:'feature', subject, details, contact });
    alert('Thanks! Your feature request was saved.');
    location.hash = '#/feedback';
  });
}

/* ---------------- Settings ---------------- */
// Settings HOME: show tabs (tiles) + back to dashboard
function viewSettingsHome(){
  app.innerHTML = `
    <div class="grid settings-tabs" role="tablist" aria-label="Settings tabs">
      <a class="tile" role="tab" aria-selected="false" href="#/settings/crops">
        <span class="emoji">🌱</span>
        <span class="label">Crop Type</span>
      </a>
      <!-- Add more settings tiles later -->
    </div>

    <div class="settings-actions">
      <a class="btn" href="#/home">Back to Dashboard</a>
    </div>
  `;
}

// Crop Types storage
const CROPS_KEY = 'df_crops';
function migrateCropsShape(arr){
  if (!Array.isArray(arr)) return [];
  if (arr.length && typeof arr[0] === 'string') {
    return arr.map(n => ({ name:n, archived:false }));
  }
  return arr.map(o => ({ name:String(o.name||'').trim(), archived:!!o.archived }));
}
function loadCrops(){
  try {
    const raw = localStorage.getItem(CROPS_KEY);
    if (!raw) return [{name:'Corn', archived:false},{name:'Soybeans', archived:false}];
    const arr = JSON.parse(raw);
    const norm = migrateCropsShape(arr);
    return norm.length ? norm : [{name:'Corn', archived:false},{name:'Soybeans', archived:false}];
  } catch {
    return [{name:'Corn', archived:false},{name:'Soybeans', archived:false}];
  }
}
function saveCrops(list){ try { localStorage.setItem(CROPS_KEY, JSON.stringify(list)); } catch {} }

// TODO: wire to real datasets later
function isCropInUse(name){ return false; }

// Settings > Crop Type detail
function viewSettingsCrops(){
  const crops = loadCrops();
  const items = crops.map((o,i)=> {
    const status = o.archived ? `<span class="chip chip-archived" title="Archived">Archived</span>` : '';
    const actions = o.archived
      ? `<button class="sm" data-unarchive="${i}">Unarchive</button>
         <button class="danger sm" data-delete="${i}">Delete</button>`
      : `<button class="warn sm" data-archive="${i}">Archive</button>
         <button class="danger sm" data-delete="${i}">Delete</button>`;
    return `
      <li class="crop-row ${o.archived?'is-archived':''}">
        <div class="crop-info">
          <span class="chip">${o.name}</span>
          ${status}
        </div>
        <div class="crop-actions">${actions}</div>
      </li>
    `;
  }).join('');

  app.innerHTML = `
    <div class="grid settings-tabs" role="tablist" aria-label="Settings tabs">
      <a class="tile tab-active" role="tab" aria-selected="true" href="#/settings/crops">
        <span class="emoji">🌱</span>
        <span class="label">Crop Type</span>
      </a>
    </div>

    <section class="section">
      <h1>Crop Type</h1>
      <p class="muted">Archive crops that are in use to preserve history. Delete only if unused.</p>

      <ul class="crop-list">${items || '<li class="muted">No crops yet.</li>'}</ul>

      <div class="add-row">
        <input id="new-crop" type="text" placeholder="e.g., Wheat" />
        <button id="add-crop" class="btn-add">Add</button>
      </div>

      <a class="btn" href="#/settings">Back to Settings</a>
    </section>
  `;

  wireCropsHandlers();
}

function wireCropsHandlers(){
  const addBtn = document.getElementById('add-crop');
  const input  = document.getElementById('new-crop');
  const listEl = app.querySelector('.crop-list');

  addBtn?.addEventListener('click', () => {
    const name = (input.value || '').trim();
    if (!name) return;
    const crops = loadCrops();
    if (crops.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      input.value = ''; return;
    }
    crops.push({ name, archived:false });
    saveCrops(crops);
    viewSettingsCrops();
  });

  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addBtn?.click(); }
  });

  listEl?.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const crops = loadCrops();

    if (btn.hasAttribute('data-archive')) {
      const i = +btn.getAttribute('data-archive'); if (!crops[i]) return;
      crops[i].archived = true; saveCrops(crops); viewSettingsCrops(); return;
    }
    if (btn.hasAttribute('data-unarchive')) {
      const i = +btn.getAttribute('data-unarchive'); if (!crops[i]) return;
      crops[i].archived = false; saveCrops(crops); viewSettingsCrops(); return;
    }
    if (btn.hasAttribute('data-delete')) {
      const i = +btn.getAttribute('data-delete'); if (!crops[i]) return;
      const name = crops[i].name;
      if (isCropInUse(name)) { alert(`“${name}” is used in your data. Archive instead.`); return; }
      if (!confirm(`Delete “${name}”? This cannot be undone.`)) return;
      crops.splice(i,1); saveCrops(crops); viewSettingsCrops(); return;
    }
  });
}

/* ---------------- Router ---------------- */
function route(){
  const hash = location.hash || '#/home';

  renderBreadcrumb();

  // Crop hub & children
  if (hash === '#/crop') {
    viewCropHub();
  } else if (hash.startsWith('#/crop/')) {
    const label = ROUTES[hash] || 'Section';
    viewSection(label, '#/crop', 'Back to Crop Production');
  }
  // Equipment hub & children (NEW)
  else if (hash === '#/equipment') {
    viewEquipmentHub();
  } else if (hash.startsWith('#/equipment/')) {
    const label = ROUTES[hash] || 'Section';
    viewSection(label, '#/equipment', 'Back to Equipment');
  }
  // Feedback hub & children
  else if (hash === '#/feedback') {
    viewFeedbackHub();
  } else if (hash === '#/feedback/errors') {
    viewFeedbackErrors();
  } else if (hash === '#/feedback/feature') {
    viewFeedbackFeature();
  }
  // Settings
  else if (hash === '#/settings') {
    viewSettingsHome();
  } else if (hash.startsWith('#/settings/crops')) {
    viewSettingsCrops();
  }
  // Home / generic
  else if (hash === '#/home' || hash === '') {
    viewHome();
  } else if (ROUTES[hash]) {
    viewSection(ROUTES[hash]);
  } else {
    viewSection('Not Found');
  }

  app?.focus();

  // Recompute layout variables (header, breadcrumbs, footer)
  applyHeaderHeightVar();
  applyCrumbsHeightVar();
  applyFooterHeightVar();
}
window.addEventListener('hashchange', route);
window.addEventListener('load', route);

// ===== Header / Footer text =====
if (versionEl) versionEl.textContent = displayVersion(APP_VERSION);
if (todayEl) todayEl.textContent = prettyDate();
function tick(){ if (clockEl) clockEl.textContent = formatClock12(new Date()); }
tick(); setInterval(tick, 15000);

// Logout -> clear auth and go to login
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    try { localStorage.removeItem('df_auth'); localStorage.removeItem('df_user'); } catch {}
    window.location.replace('login.html');
  });
}

// ===== Dynamic layout vars =====
function applyHeaderHeightVar() {
  const header = document.querySelector('.app-header');
  const h = header ? header.offsetHeight : 0;
  document.documentElement.style.setProperty('--header-h', h + 'px');
}
function applyCrumbsHeightVar() {
  const bc = document.querySelector('.breadcrumbs');
  const h = bc ? bc.offsetHeight : 0;
  document.documentElement.style.setProperty('--crumbs-h', h + 'px');
}
function applyFooterHeightVar() {
  const footer = document.querySelector('.app-footer');
  const h = footer ? footer.offsetHeight : 0;
  document.documentElement.style.setProperty('--footer-h', h + 'px');
}
['load','resize','orientationchange'].forEach(evt => {
  window.addEventListener(evt, applyHeaderHeightVar);
  window.addEventListener(evt, applyCrumbsHeightVar);
  window.addEventListener(evt, applyFooterHeightVar);
});

// ===== Update banner =====
function showUpdateBanner(){ if (bannerEl) bannerEl.hidden = false; }
function hideUpdateBanner(){ if (bannerEl) bannerEl.hidden = true; }
function markVersionAsCurrent(){ try { localStorage.setItem('df_app_version', normalizeVersion(APP_VERSION)); } catch {} }
function storedVersion(){ try { return localStorage.getItem('df_app_version') || ''; } catch { return ''; } }
function needsUpdate(){
  const saved = storedVersion();
  const current = normalizeVersion(APP_VERSION);
  return saved && saved !== current;
}
function syncBannerWithVersion(){
  if (needsUpdate()) showUpdateBanner();
  else { hideUpdateBanner(); markVersionAsCurrent(); }
}
let _recheckTimer = null;
if (bannerBtn){
  bannerBtn.addEventListener('click', () => {
    bannerBtn.disabled = true;
    bannerBtn.textContent = 'Updating…';
    hideUpdateBanner();
    clearTimeout(_recheckTimer);
    _recheckTimer = setTimeout(() => {
      if (needsUpdate()) {
        showUpdateBanner();
        bannerBtn.disabled = false;
        bannerBtn.textContent = 'Refresh';
      }
    }, 3000);

    if (window.__waitingSW) window.__waitingSW.postMessage({ type: 'SKIP_WAITING' });
    else location.reload();
  });
}
syncBannerWithVersion();

// ===== Service Worker registration + update flow =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('service-worker.js');

      reg.update();
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') reg.update();
      });

      if (reg.waiting) {
        window.__waitingSW = reg.waiting;
        if (needsUpdate()) showUpdateBanner(); else hideUpdateBanner();
      }

      reg.addEventListener('updatefound', () => {
        const sw = reg.installing; if (!sw) return;
        sw.addEventListener('statechange', () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) {
            window.__waitingSW = reg.waiting || sw;
            if (needsUpdate()) showUpdateBanner(); else hideUpdateBanner();
          }
        });
      });

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        clearTimeout(_recheckTimer);
        window.__waitingSW = null;
        hideUpdateBanner();
        markVersionAsCurrent();
        setTimeout(() => {
          location.reload();
          setTimeout(syncBannerWithVersion, 800);
        }, 300);
      });

    } catch (e) {
      console.error('SW registration failed', e);
    }
  });
}