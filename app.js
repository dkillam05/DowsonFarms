// ===== App constants =====
const APP_VERSION = 'v6.8';  // bump on each release

const ROUTES = {
  '': 'home',
  '#/home': 'home',

  // Crop Production
  '#/crop': 'Crop Production',
  '#/crop/planting': 'Planting',
  '#/crop/spraying': 'Spraying',
  '#/crop/aerial': 'Aerial',
  '#/crop/harvest': 'Harvest',
  '#/crop/maintenance': 'Maintenance',
  '#/crop/scouting': 'Scouting',
  '#/crop/trials': 'Trials',

  // Equipment
  '#/equipment': 'Equipment',
  '#/equipment/receivers': 'Receivers & Tech',
  '#/equipment/tractors': 'Tractors',
  '#/equipment/combines': 'Combines',
  '#/equipment/sprayers': 'Sprayer / Fertilizer Spreader',
  '#/equipment/construction': 'Construction Equipment',
  '#/equipment/trucks': 'Trucks & Trailers',
  '#/equipment/implements': 'Implements',
  '#/equipment/shop': 'Shop',
  '#/equipment/barcodes': 'Barcode / QR Codes',

  // Feedback
  '#/feedback': 'Feedback',
  '#/feedback/errors': 'Report Errors',
  '#/feedback/features': 'Feature Request',

  // Team & Partners
  '#/team': 'Team & Partners',
  '#/team/employees': 'Employees',
  '#/team/subcontractors': 'Subcontractors',
  '#/team/vendors': 'Vendors',
  '#/team/dir': 'Directory',

  // Settings
  '#/settings': 'Settings',
  '#/settings/crops': 'Crop Type',
  '#/settings/theme': 'Theme'
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
function capFirst(str){ return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase(); }
function displayVersion(v){ const parts = (v||'').replace(/^v/i,'').split('.'); return `v${parts[0]||0}.${parts[1]||0}`; }

// ===== DOM refs =====
const app = document.getElementById('app');
const crumbs = document.getElementById('breadcrumbs');
const versionEl = document.getElementById('version');
const todayEl = document.getElementById('today');
const clockEl = document.getElementById('clock');
const logoutBtn = document.getElementById('logout');
const bannerEl = document.getElementById('update-banner');
const bannerBtn = document.getElementById('update-refresh');

// ===== Rendering helpers =====
function tile(emoji,label,href){
  return `
    <a class="tile" role="listitem" href="${href}" aria-label="${label}">
      <span class="emoji">${emoji}</span>
      <span class="label">${label}</span>
    </a>
  `;
}
function renderBreadcrumb(routeName){
  if(routeName==='home'){ crumbs.innerHTML = `<span>Home</span>`; return; }
  const path = location.hash.split('/');
  let trail = `<a href="#/home">Home</a>`;
  if(path[1]==='settings'){ trail += ` &gt; <a href="#/settings">Settings</a>`; }
  else if(path[1]==='crop'){ trail += ` &gt; <a href="#/crop">Crop Production</a>`; }
  else if(path[1]==='equipment'){ trail += ` &gt; <a href="#/equipment">Equipment</a>`; }
  else if(path[1]==='feedback'){ trail += ` &gt; <a href="#/feedback">Feedback</a>`; }
  else if(path[1]==='team'){ trail += ` &gt; <a href="#/team">Team & Partners</a>`; }
  trail += ` &gt; <span>${routeName}</span>`;
  crumbs.innerHTML = trail;
}

// ===== Views =====
function viewHome(){
  app.innerHTML = `
    <div class="grid" role="list">
      ${tile('🌽','Crop Production','#/crop')}
      ${tile('🔢','Calculator','#/calculator')}
      ${tile('🛠️','Field Maintenance','#/field')}
      ${tile('🚜','Equipment','#/equipment')}
      ${tile('📦','Grain Tracking','#/grain')}
      ${tile('🤝','Team & Partners','#/team')}
      ${tile('🤖','AI Reports','#/ai')}
      ${tile('⚙️','Settings','#/settings')}
      ${tile('💬','Feedback','#/feedback')}
    </div>
  `;
}

// Crop Production hub
function viewCropHub(){
  app.innerHTML = `
    <div class="grid">
      ${tile('🌱','Planting','#/crop/planting')}
      ${tile('🧪','Spraying','#/crop/spraying')}
      ${tile('🚁','Aerial','#/crop/aerial')}
      ${tile('🌾','Harvest','#/crop/harvest')}
      ${tile('🧰','Maintenance','#/crop/maintenance')}
      ${tile('🔎','Scouting','#/crop/scouting')}
      ${tile('🧬','Trials','#/crop/trials')}
    </div>
    <a class="btn" href="#/home">Back to Dashboard</a>
  `;
}

// Equipment hub
function viewEquipmentHub(){
  app.innerHTML = `
    <div class="grid">
      ${tile('📡','Receivers & Tech','#/equipment/receivers')}
      ${tile('🚜','Tractors','#/equipment/tractors')}
      ${tile('🌾','Combines','#/equipment/combines')}
      ${tile('💦','Sprayer / Fertilizer Spreader','#/equipment/sprayers')}
      ${tile('🏗️','Construction Equipment','#/equipment/construction')}
      ${tile('🚚','Trucks & Trailers','#/equipment/trucks')}
      ${tile('⚙️','Implements','#/equipment/implements')}
      ${tile('🛠️','Shop','#/equipment/shop')}
      ${tile('🔖','Barcode / QR Codes','#/equipment/barcodes')}
    </div>
    <a class="btn" href="#/home">Back to Dashboard</a>
  `;
}

// Feedback hub
function viewFeedbackHub(){
  app.innerHTML = `
    <div class="grid">
      ${tile('🐞','Report Errors','#/feedback/errors')}
      ${tile('✨','Feature Request','#/feedback/features')}
    </div>
    <a class="btn" href="#/home">Back to Dashboard</a>
  `;
}

// Team & Partners hub
function viewTeamHub(){
  app.innerHTML = `
    <div class="grid">
      ${tile('👷','Employees','#/team/employees')}
      ${tile('🛠️','Subcontractors','#/team/subcontractors')}
      ${tile('🏪','Vendors','#/team/vendors')}
      ${tile('📇','Directory','#/team/dir')}
    </div>
    <a class="btn" href="#/home">Back to Dashboard</a>
  `;
}

// Generic section placeholder
function viewSection(title){
  app.innerHTML = `
    <section class="section">
      <h1>${title}</h1>
      <p>Coming soon.</p>
      <a class="btn" href="#/home">Back to Dashboard</a>
    </section>
  `;
}

// ===== Router =====
function route(){
  const hash = location.hash || '#/home';
  const name = ROUTES[hash] || 'Not Found';
  if(name==='home'){ renderBreadcrumb('home'); viewHome(); }
  else if(hash.startsWith('#/crop')){ renderBreadcrumb(name); if(hash==='#/crop') viewCropHub(); else viewSection(name); }
  else if(hash.startsWith('#/equipment')){ renderBreadcrumb(name); if(hash==='#/equipment') viewEquipmentHub(); else viewSection(name); }
  else if(hash.startsWith('#/feedback')){ renderBreadcrumb(name); if(hash==='#/feedback') viewFeedbackHub(); else viewSection(name); }
  else if(hash.startsWith('#/team')){ renderBreadcrumb(name); if(hash==='#/team') viewTeamHub(); else viewSection(name); }
  else if(hash.startsWith('#/settings')){ renderBreadcrumb(name); viewSection(name); }
  else { renderBreadcrumb(name); viewSection(name); }
  app.focus();
  applyHeaderHeightVar(); applyFooterHeightVar(); applyCrumbsHeightVar();
}
window.addEventListener('hashchange', route);
window.addEventListener('load', route);

// ===== Header/Footer info =====
if (versionEl) versionEl.textContent = displayVersion(APP_VERSION);
if (todayEl) todayEl.textContent = prettyDate();
function tick(){ if (clockEl) clockEl.textContent = formatClock12(new Date()); }
tick(); setInterval(tick, 1000 * 15);
if (logoutBtn) logoutBtn.addEventListener('click', () => alert('Logged out (placeholder).'));

// ===== Dynamic vars =====
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
function applyCrumbsHeightVar() {
  const bc = document.querySelector('.breadcrumbs');
  const h = bc ? bc.offsetHeight : 0;
  document.documentElement.style.setProperty('--crumbs-h', h + 'px');
}
['load','resize','orientationchange','hashchange'].forEach(evt=>{
  window.addEventListener(evt, applyHeaderHeightVar);
  window.addEventListener(evt, applyFooterHeightVar);
  window.addEventListener(evt, applyCrumbsHeightVar);
});

// ===== Update banner =====
function showUpdateBanner(){ if (bannerEl) bannerEl.hidden = false; }
function hideUpdateBanner(){ if (bannerEl) bannerEl.hidden = true; }
function markVersionAsCurrent(){ try{ localStorage.setItem('df_app_version', APP_VERSION);}catch{} }
function storedVersion(){ try{ return localStorage.getItem('df_app_version')||'';}catch{ return ''; } }
function syncBannerWithVersion(){
  const stored = storedVersion();
  if (stored && stored !== APP_VERSION) showUpdateBanner();
  else { hideUpdateBanner(); markVersionAsCurrent(); }
}
if (bannerBtn){
  bannerBtn.addEventListener('click', function(){
    bannerBtn.disabled = true;
    bannerBtn.textContent = 'Updating…';
    if (window.__waitingSW) window.__waitingSW.postMessage({ type:'SKIP_WAITING' });
    else location.reload();
  });
}
syncBannerWithVersion();

// ===== SW registration =====
if ('serviceWorker' in navigator){
  window.addEventListener('load', async ()=>{
    try {
      const reg = await navigator.serviceWorker.register('service-worker.js');
      reg.update();
      document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='visible') reg.update(); });
      if (reg.waiting){ window.__waitingSW = reg.waiting; showUpdateBanner(); }
      reg.addEventListener('updatefound', ()=>{
        const sw = reg.installing; if(!sw) return;
        sw.addEventListener('statechange', ()=>{
          if (sw.state==='installed' && navigator.serviceWorker.controller){
            window.__waitingSW = reg.waiting||sw;
            showUpdateBanner();
          }
        });
      });
      navigator.serviceWorker.addEventListener('controllerchange', ()=>{
        window.__waitingSW = null; hideUpdateBanner(); markVersionAsCurrent();
        setTimeout(()=>location.reload(),200);
      });
    } catch(e){ console.error('SW registration failed', e); }
  });
}