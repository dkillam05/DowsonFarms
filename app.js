// ===== App constants =====
const APP_VERSION = 'v5.4';  // displayed as vMAJOR.MINOR in footer

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
  '#/crop': 'Crop Production',
  '#/calculator': 'Calculator',
  '#/field': 'Field Maintenance',
  '#/equipment': 'Equipment',
  '#/grain': 'Grain Tracking',
  '#/employees': 'Employees',
  '#/ai': 'AI Reports',
  '#/settings': 'Settings',
  '#/settings/crops': 'Settings',   // Settings tab: Crop Type
  '#/feedback': 'Feedback',
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

// ===== Rendering: Dashboard =====
function renderBreadcrumb(name){
  const hash = location.hash || '#/home';

  // Nested crumbs for settings tabs
  if (hash.startsWith('#/settings/crops')) {
    crumbs.innerHTML = `<a href="#/home">Home</a> &nbsp;&gt;&nbsp; <a href="#/settings/crops">Settings</a> &nbsp;&gt;&nbsp; <span>Crop Type</span>`;
    return;
  }

  if(name==='home'){ crumbs.innerHTML = `<span>Home</span>`; return; }
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
      ${tile('⚙️','Settings','#/settings/crops')}
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

function viewSection(title){
  app.innerHTML = `
    <section class="section">
      <h1>${title}</h1>
      <p>Coming soon.</p>
      <a class="btn" href="#/settings/crops">Back to Settings</a>
    </section>
  `;
}

// ===== Settings: tabs + Crop Type manager (Archive-aware) =====
function currentSettingsTab(){
  const hash = location.hash || '#/settings/crops';
  if (hash.startsWith('#/settings/crops')) return 'crops';
  return 'crops'; // default to crops
}

function viewSettings(){
  const tab = currentSettingsTab(); // always 'crops' for now

  // tabs (same tile look as main menu)
  const tabsGrid = `
    <div class="grid settings-tabs" role="tablist" aria-label="Settings tabs">
      <a class="tile ${tab==='crops'?'tab-active':''}" role="tab" aria-selected="${tab==='crops'}" href="#/settings/crops">
        <span class="emoji">🌱</span>
        <span class="label">Crop Type</span>
      </a>
      <!-- Add more settings tabs later -->
    </div>
  `;

  // pane (crop manager)
  const pane = settingsPaneCrops();

  app.innerHTML = `
    ${tabsGrid}
    ${pane}
  `;

  wireCropsHandlers();
}

// Storage shape: [{ name: 'Corn', archived: false }, ...]
const CROPS_KEY = 'df_crops';
function migrateCropsShape(arr){
  // Backward compat if old storage was array of strings
  if (!Array.isArray(arr)) return [];
  if (arr.length && typeof arr[0] === 'string'){
    return arr.map(n => ({ name: n, archived:false }));
  }
  // ensure fields present
  return arr.map(o => ({ name: String(o.name || '').trim(), archived: !!o.archived }));
}
function loadCrops(){
  try {
    const raw = localStorage.getItem(CROPS_KEY);
    if (!raw) return [{name:'Corn', archived:false}, {name:'Soybeans', archived:false}];
    const arr = JSON.parse(raw);
    const norm = migrateCropsShape(arr);
    // guard defaults if empty after migration
    return norm.length ? norm : [{name:'Corn', archived:false}, {name:'Soybeans', archived:false}];
  } catch {
    return [{name:'Corn', archived:false}, {name:'Soybeans', archived:false}];
  }
}
function saveCrops(list){
  try { localStorage.setItem(CROPS_KEY, JSON.stringify(list)); } catch {}
}

// Hook: tell if a crop is used anywhere in your data.
// For now this is a placeholder. When you add real datasets (fields, yields, etc.)
// update this to check references before allowing delete.
function isCropInUse(cropName){
  // Example checks (uncomment/replace when you have data persisted):
  // const fields = JSON.parse(localStorage.getItem('df_fields')||'[]');
  // if (fields.some(f => (f.crop||'').toLowerCase() === cropName.toLowerCase())) return true;
  // const lots = JSON.parse(localStorage.getItem('df_grain')||'[]');
  // if (lots.some(l => (l.crop||'').toLowerCase() === cropName.toLowerCase())) return true;
  // Add other datasets here…
  return false; // <-- currently nothing references crops
}

function settingsPaneCrops(){
  const crops = loadCrops();
  const items = crops.map((o,i)=> {
    const archived = o.archived;
    const status = archived ? `<span class="chip chip-archived" title="Archived">Archived</span>` : '';
    const actionBtns = archived
      ? `<button class="sm" data-unarchive="${i}" aria-label="Unarchive ${o.name}">Unarchive</button>
         <button class="danger sm" data-delete="${i}" aria-label="Delete ${o.name}">Delete</button>`
      : `<button class="warn sm" data-archive="${i}" aria-label="Archive ${o.name}">Archive</button>
         <button class="danger sm" data-delete="${i}" aria-label="Delete ${o.name}">Delete</button>`;

    return `
      <li class="crop-row ${archived?'is-archived':''}">
        <div class="crop-info">
          <span class="chip">${o.name}</span>
          ${status}
        </div>
        <div class="crop-actions">
          ${actionBtns}
        </div>
      </li>
    `;
  }).join('');

  return `
    <section class="section">
      <h1>Crop Type</h1>
      <p class="muted">Archive crops that are in use to preserve history. Delete only if unused.</p>

      <ul class="crop-list">${items || '<li class="muted">No crops yet.</li>'}</ul>

      <div class="add-row">
        <input id="new-crop" type="text" placeholder="e.g., Wheat" />
        <button id="add-crop" class="btn-add">Add</button>
      </div>

      <a class="btn" href="#/settings/crops">Back to Settings</a>
    </section>
  `;
}

function wireCropsHandlers(){
  const addBtn = document.getElementById('add-crop');
  const input  = document.getElementById('new-crop');
  const listEl = app.querySelector('.crop-list');

  // add
  addBtn?.addEventListener('click', () => {
    const name = (input.value || '').trim();
    if (!name) return;
    const crops = loadCrops();
    // avoid duplicates (case-insensitive)
    if (crops.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      input.value = ''; return;
    }
    crops.push({ name, archived:false });
    saveCrops(crops);
    viewSettings(); // re-render
  });

  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addBtn?.click(); }
  });

  // list actions (archive/unarchive/delete)
  listEl?.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const crops = loadCrops();

    // Archive
    if (btn.hasAttribute('data-archive')) {
      const idx = Number(btn.getAttribute('data-archive'));
      if (!Number.isFinite(idx) || !crops[idx]) return;
      crops[idx].archived = true;
      saveCrops(crops);
      viewSettings();
      return;
    }

    // Unarchive
    if (btn.hasAttribute('data-unarchive')) {
      const idx = Number(btn.getAttribute('data-unarchive'));
      if (!Number.isFinite(idx) || !crops[idx]) return;
      crops[idx].archived = false;
      saveCrops(crops);
      viewSettings();
      return;
    }

    // Delete (only if not in use)
    if (btn.hasAttribute('data-delete')) {
      const idx = Number(btn.getAttribute('data-delete'));
      if (!Number.isFinite(idx) || !crops[idx]) return;
      const name = crops[idx].name;
      if (isCropInUse(name)) {
        alert(`“${name}” is used in your data. Archive it instead to keep history.`);
        return;
      }
      const ok = confirm(`Delete “${name}”? This cannot be undone.`);
      if (!ok) return;
      crops.splice(idx,1);
      saveCrops(crops);
      viewSettings();
      return;
    }
  });
}

// ===== Router =====
function route(){
  const hash = location.hash || '#/home';
  const name = ROUTES[hash] || (hash.startsWith('#/settings') ? 'Settings' : 'Not Found');

  renderBreadcrumb(name==='home' ? 'home' : name);

  if (hash.startsWith('#/settings')) {
    viewSettings();           // shows Crop Type manager
  } else if(name==='home') {
    viewHome();
  } else if(name==='Not Found') {
    viewSection('Not Found');
  } else {
    viewSection(name);
  }

  app?.focus();
  applyHeaderHeightVar();
  applyFooterHeightVar();
}
window.addEventListener('hashchange', route);
window.addEventListener('load', route);

// ===== Header / Footer =====
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

// ===== Dynamic header/footer height -> CSS vars =====
function applyHeaderHeightVar() {
  const header = document.querySelector('.app-header');
  if (!header) return;
  document.documentElement.style.setProperty('--header-h', header.offsetHeight + 'px');
}
function applyFooterHeightVar() {
  const footer = document.querySelector('.app-footer');
  if (!footer) return;
  document.documentElement.style.setProperty('--footer-h', footer.offsetHeight + 'px');
}
['load','resize','orientationchange'].forEach(evt => {
  window.addEventListener(evt, applyHeaderHeightVar);
  window.addEventListener(evt, applyFooterHeightVar);
});
window.addEventListener('hashchange', applyHeaderHeightVar);

// ===== Update banner (reliable flow) =====
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

// Banner button (optimistic hide + safety recheck)
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

// Run once on load
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
        setTimeout(() => location.reload(), 400);
      });

    } catch (e) {
      console.error('SW registration failed', e);
    }
  });
}