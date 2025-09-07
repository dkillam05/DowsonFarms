// ===== App constants =====
const APP_VERSION = 'v4.1';  // bump this each release (e.g. 'v3.9' or 'v3.9.0')

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

/* Normalize versions to MAJOR.MINOR for compare & display */
function normalizeVersion(v){
  const m = String(v || '').trim().replace(/^v/i,'');
  const [maj='0', min='0'] = m.split('.');
  return `${maj}.${min}`;
}
/* Footer shows only MAJOR.MINOR, prefixed with v */
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
function renderBreadcrumb(routeName){
  if(routeName==='home'){ crumbs.innerHTML = `<span>Home</span>`; return; }
  crumbs.innerHTML = `<a href="#/home">Home</a> &nbsp;&gt;&nbsp; <span>${routeName}</span>`;
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
  renderBreadcrumb(name==='home' ? 'home' : name);
  if(name==='home') viewHome(); else if(name==='Not Found') viewSection('Not Found'); else viewSection(name);
  app.focus();
  applyHeaderHeightVar();
  applyFooterHeightVar();
}
window.addEventListener('hashchange', route);
window.addEventListener('load', route);

// ===== Header / Footer =====
if (versionEl) versionEl.textContent = displayVersion(APP_VERSION);
if (todayEl) todayEl.textContent = prettyDate();
function tick(){ if (clockEl) clockEl.textContent = formatClock12(new Date()); }
tick(); setInterval(tick, 1000 * 15);
if (logoutBtn) logoutBtn.addEventListener('click', () => alert('Logged out (placeholder).'));

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

// ===== Update banner: helpers =====
function showUpdateBanner(){ if (bannerEl) bannerEl.hidden = false; }
function hideUpdateBanner(){ if (bannerEl) bannerEl.hidden = true; }

function markVersionAsCurrent(){
  try { localStorage.setItem('df_app_version', normalizeVersion(APP_VERSION)); } catch {}
}
function storedVersion(){
  try { return localStorage.getItem('df_app_version') || ''; } catch { return ''; }
}
/* Only show when stored version differs from current (normalized) */
function needsUpdate(){
  const saved = storedVersion();
  const current = normalizeVersion(APP_VERSION);
  return saved && saved !== current;
}
function syncBannerWithVersion(){
  if (needsUpdate()) showUpdateBanner();
  else { hideUpdateBanner(); markVersionAsCurrent(); }
}

// ===== Banner button (optimistic hide for speed) =====
let _recheckTimer = null;
if (bannerBtn){
  bannerBtn.addEventListener('click', () => {
    bannerBtn.disabled = true;
    bannerBtn.textContent = 'Updating…';

    // Hide immediately for snappier feel
    hideUpdateBanner();

    // Safety: if SW doesn't take over, re-check & re-show after 3s
    clearTimeout(_recheckTimer);
    _recheckTimer = setTimeout(() => {
      if (needsUpdate()) {
        showUpdateBanner();
        bannerBtn.disabled = false;
        bannerBtn.textContent = 'Refresh';
      }
    }, 3000);

    if (window.__waitingSW) {
      window.__waitingSW.postMessage({ type: 'SKIP_WAITING' });
    } else {
      location.reload();
    }
  });
}

// Run once on load
syncBannerWithVersion();

// ===== Service Worker registration + update flow =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('service-worker.js');

      // Proactively check for updates (helps iOS/Chrome iOS)
      reg.update();
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') reg.update();
      });

      // Only show banner if truly out of date
      if (reg.waiting) {
        window.__waitingSW = reg.waiting;
        if (needsUpdate()) showUpdateBanner();
        else hideUpdateBanner();
      }

      reg.addEventListener('updatefound', () => {
        const sw = reg.installing; if (!sw) return;
        sw.addEventListener('statechange', () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) {
            window.__waitingSW = reg.waiting || sw;
            if (needsUpdate()) showUpdateBanner();
            else hideUpdateBanner();
          }
        });
      });

      // When the new worker takes control, finalize + reload
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        clearTimeout(_recheckTimer);
        window.__waitingSW = null;
        hideUpdateBanner();
        markVersionAsCurrent();
        setTimeout(() => location.reload(), 400); // a touch longer for iOS reliability
      });

    } catch (e) {
      console.error('SW registration failed', e);
    }
  });
}