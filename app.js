// ===== App constants =====
const APP_VERSION = 'v6.5'; // footer shows vMAJOR.MINOR

// ===== Theme (light/dark/auto – minimal hook) =====
(function applyInitialTheme(){
  try {
    const t = localStorage.getItem('df_theme') || 'auto';
    document.documentElement.setAttribute('data-theme', t);
  } catch {}
})();

// ===== Auth guard (invite-only placeholder) =====
function isAuthed(){ try { return localStorage.getItem('df_auth') === '1'; } catch { return false; } }
(function enforceAuth(){
  const here = (location.pathname.split('/').pop() || '').toLowerCase();
  if (!isAuthed() && here !== 'login.html') {
    window.location.replace('login.html');
  }
})();

// ===== Utilities =====
function pad2(n){ return n<10?('0'+n):(''+n); }
function formatClock12(d){ let h=d.getHours(), m=d.getMinutes(), ap=h>=12?'PM':'AM'; h=h%12||12; return `${h}:${pad2(m)} ${ap}`; }
function ordinal(n){ const s=['th','st','nd','rd'],v=n%100; return n+(s[(v-20)%10]||s[v]||s[0]); }
function prettyDate(d){ const dow=d.toLocaleString(undefined,{weekday:'long'}); const mo=d.toLocaleString(undefined,{month:'long'}); return `${dow} ${mo} ${ordinal(d.getDate())} ${d.getFullYear()}`; }
function normalizeVersion(v){ const m=String(v||'').trim().replace(/^v/i,''); const p=m.split('.'); return (p[0]||'0')+'.'+(p[1]||'0'); }
function displayVersion(v){ return 'v'+normalizeVersion(v); }

// ===== DOM refs =====
const app = document.getElementById('app');
const crumbs = document.getElementById('breadcrumbs');
const versionEl = document.getElementById('version');
const todayEl = document.getElementById('today');
const clockEl = document.getElementById('clock');
const logoutBtn = document.getElementById('logout');
const bannerEl = document.getElementById('update-banner');
const bannerBtn = document.getElementById('update-refresh');

// ===== Layout helpers =====
function applyHeaderHeightVar(){ const el=document.querySelector('.app-header'); document.documentElement.style.setProperty('--header-h',(el?el.offsetHeight:0)+'px'); }
function applyCrumbsHeightVar(){ const el=document.querySelector('.breadcrumbs'); document.documentElement.style.setProperty('--crumbs-h',(el?el.offsetHeight:0)+'px'); }
function applyFooterHeightVar(){ const el=document.querySelector('.app-footer'); document.documentElement.style.setProperty('--footer-h',(el?el.offsetHeight:0)+'px'); }
function applyBannerHeightVar(){ const el=document.getElementById('update-banner'); const h=(el && !el.hidden)? el.offsetHeight:0; document.documentElement.style.setProperty('--banner-h',h+'px'); }

// ===== Rendering =====
function tile(emoji,label,href){
  return `<a class="tile" href="${href}" aria-label="${label}">
    <span class="emoji">${emoji}</span><span class="label">${label}</span>
  </a>`;
}

function renderBreadcrumb(){ crumbs.innerHTML = '<span>Home</span>'; }

function viewHome(){
  app.innerHTML = `
    <div class="grid" role="list">
      ${tile('🌽','Crop Production','#/crop')}
      ${tile('🔢','Calculator','#/calc')}
      ${tile('🛠️','Field Maintenance','#/crop/maintenance')}
      ${tile('🚜','Equipment','#/equipment')}
      ${tile('📦','Grain Tracking','#/grain')}
      ${tile('🤝','Team & Partners','#/team')}
      ${tile('🤖','AI Reports','#/ai')}
      ${tile('⚙️','Settings','#/settings')}
      ${tile('💬','Feedback','#/feedback')}
    </div>
  `;
}

// ===== Router (v6.5 kept simple – everything else “Coming soon”) =====
function viewSection(title, backHref){
  app.innerHTML = `
    <section class="section">
      <h1>${title}</h1>
      <p>Coming soon.</p>
      <a class="btn" href="${backHref || '#/home'}">Back</a>
    </section>
  `;
}

function route(){
  const hash = location.hash || '#/home';
  renderBreadcrumb();

  if (hash === '#/home' || hash==='') { viewHome(); }
  else if (hash === '#/crop') { viewSection('Crop Production', '#/home'); }
  else if (hash === '#/crop/maintenance') { viewSection('Maintenance (Crop)', '#/home'); }
  else if (hash === '#/calc') { viewSection('Calculator', '#/home'); }
  else if (hash === '#/equipment') { viewSection('Equipment', '#/home'); }
  else if (hash === '#/grain') { viewSection('Grain Tracking', '#/home'); }
  else if (hash === '#/team') { viewSection('Team & Partners', '#/home'); }
  else if (hash === '#/ai') { viewSection('AI Reports', '#/home'); }
  else if (hash === '#/settings') { viewSection('Settings', '#/home'); }
  else if (hash === '#/feedback') { viewSection('Feedback', '#/home'); }
  else { viewSection('Not Found', '#/home'); }

  if (app && app.focus) app.focus();
  applyHeaderHeightVar(); applyCrumbsHeightVar(); applyFooterHeightVar(); applyBannerHeightVar();
}

window.addEventListener('hashchange', route);
window.addEventListener('load', route);
['load','resize','orientationchange'].forEach(evt=>{
  window.addEventListener(evt, applyHeaderHeightVar);
  window.addEventListener(evt, applyCrumbsHeightVar);
  window.addEventListener(evt, applyFooterHeightVar);
  window.addEventListener(evt, applyBannerHeightVar);
});

// ===== Header/Footer text & clock =====
if (versionEl) versionEl.textContent = displayVersion(APP_VERSION);
if (todayEl) todayEl.textContent = prettyDate(new Date());
function tick(){ if (clockEl) clockEl.textContent = formatClock12(new Date()); }
tick(); setInterval(tick, 15000);

// ===== Logout -> clear auth and go to login =====
if (logoutBtn){
  logoutBtn.addEventListener('click', ()=>{
    try { localStorage.removeItem('df_auth'); localStorage.removeItem('df_user'); } catch {}
    window.location.replace('login.html');
  });
}

// ===== Update banner logic (v6.5 stable) =====
function showUpdateBanner(){ if (bannerEl){ bannerEl.hidden=false; applyBannerHeightVar(); } }
function hideUpdateBanner(){ if (bannerEl){ bannerEl.hidden=true; applyBannerHeightVar(); } }
function markVersionAsCurrent(){ try { localStorage.setItem('df_app_version', normalizeVersion(APP_VERSION)); } catch {} }
function storedVersion(){ try { return localStorage.getItem('df_app_version') || ''; } catch { return ''; } }
function needsUpdate(){ const saved=storedVersion(); const cur=normalizeVersion(APP_VERSION); return saved && saved!==cur; }
function syncBannerWithVersion(){ if (needsUpdate()) showUpdateBanner(); else { hideUpdateBanner(); markVersionAsCurrent(); } }

if (bannerBtn){
  bannerBtn.addEventListener('click', ()=>{
    try { sessionStorage.setItem('df_updating', '1'); } catch {}
    bannerBtn.disabled = true;
    bannerBtn.textContent = 'Updating…';
    hideUpdateBanner();
    if (window.__waitingSW) {
      window.__waitingSW.postMessage({ type: 'SKIP_WAITING' });
    } else {
      location.reload();
    }
  });
}

// On load, decide banner state (hide on login page; one-shot suppression)
window.addEventListener('load', ()=>{
  const here = (location.pathname.split('/').pop() || '').toLowerCase();

  // One-shot: if we just pressed Refresh
  try {
    const flag = sessionStorage.getItem('df_updating');
    if (flag === '1'){
      sessionStorage.removeItem('df_updating');
      markVersionAsCurrent();
      hideUpdateBanner();
      return;
    }
  } catch {}

  // Never show on login page
  if (here === 'login.html') { markVersionAsCurrent(); hideUpdateBanner(); return; }

  // If already controlled by a SW on this load, assume current
  if (navigator.serviceWorker && navigator.serviceWorker.controller){
    markVersionAsCurrent();
    hideUpdateBanner();
  } else {
    syncBannerWithVersion();
  }
});

// ===== Service Worker registration + update flow =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async ()=>{
    try {
      const reg = await navigator.serviceWorker.register('service-worker.js');

      // proactive update checks
      reg.update();
      document.addEventListener('visibilitychange', ()=>{ if (document.visibilityState==='visible') reg.update(); });

      // If a new worker is already waiting, show banner (not on login)
      const here = (location.pathname.split('/').pop() || '').toLowerCase();
      if (reg.waiting && here!=='login.html') {
        window.__waitingSW = reg.waiting;
        if (needsUpdate()) showUpdateBanner();
      }

      reg.addEventListener('updatefound', ()=>{
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener('statechange', ()=>{
          if (sw.state==='installed' && navigator.serviceWorker.controller){
            window.__waitingSW = reg.waiting || sw;
            const here2 = (location.pathname.split('/').pop() || '').toLowerCase();
            if (here2!=='login.html' && needsUpdate()) showUpdateBanner();
          }
        });
      });

      navigator.serviceWorker.addEventListener('controllerchange', ()=>{
        window.__waitingSW = null;
        markVersionAsCurrent();
        hideUpdateBanner();
        setTimeout(()=>location.reload(), 200);
      });

    } catch (e){
      console.error('SW registration failed', e);
    }
  });
}