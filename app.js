<script>
// =====================================================
// Dowson Farms — App.js (Part 1 of N) — v11.0.0
// Contents:
//  - Version constant
//  - Theme init (auto/light/dark)
//  - Auth guard (invite-only placeholder)
//  - Core utilities
//  - DOM refs
//  - ensureHomeHash()
//  - Phone input live formatter
//  - inviteMailtoHref()
//  - Layout measurements (CSS vars)
//  - tile() helper
//  - LABELS (for breadcrumbs)
//  - renderBreadcrumb()
//  - viewHome()
// =====================================================

// ===== Version (footer shows vMAJOR.MINOR) =====
const APP_VERSION = 'v11.0.0';

// ===== Init theme asap (auto/light/dark) =====
(function applySavedTheme() {
  try {
    const t = localStorage.getItem('df_theme') || 'auto';
    document.documentElement.setAttribute('data-theme', t);
  } catch {}
})();

// ===== Auth (invite-only placeholder) =====
function isAuthed(){ try { return localStorage.getItem('df_auth') === '1'; } catch { return false; } }
(function enforceAuth(){
  const here = (location.pathname.split('/').pop() || '').toLowerCase();
  if (!isAuthed() && here !== 'login.html') window.location.replace('login.html');
})();

// ===== Utilities =====
function pad2(n){ return n<10?'0'+n:''+n; }
function formatClock12(d){ let h=d.getHours(), m=d.getMinutes(), ap=h>=12?'PM':'AM'; h=h%12||12; return `${h}:${pad2(m)} ${ap}`; }
function ordinal(n){ const s=['th','st','nd','rd'], v=n%100; return n+(s[(v-20)%10]||s[v]||s[0]); }
function prettyDate(d){ const dow=d.toLocaleString(undefined,{weekday:'long'}); const mo=d.toLocaleString(undefined,{month:'long'}); return `${dow} ${mo} ${ordinal(d.getDate())} ${d.getFullYear()}`; }
function normalizeVersion(v){ const m=String(v||'').trim().replace(/^v/i,''); const p=m.split('.'); return (p[0]||'0')+'.'+(p[1]||'0'); }
function displayVersion(v){ return 'v'+normalizeVersion(v); }
function scrollTopAll(){ try{ if (app?.scrollTo) app.scrollTo({top:0,left:0,behavior:'auto'}); window.scrollTo(0,0);}catch{} }
function fmtCommas(n){ try{ return Number(n).toLocaleString(); }catch{ return String(n); } }
function uuid(){ return Math.random().toString(36).slice(2) + Date.now().toString(36); }
function onlyDigits(s){ return String(s||'').replace(/\D+/g,''); }
function todayStr(){ return new Date().toISOString().slice(0,10); }
function capWord(s){ s=String(s||'').trim(); return s ? s[0].toUpperCase()+s.slice(1).toLowerCase() : ''; }
function capName(s){ return String(s||'').trim().split(/\s+/).map(capWord).join(' '); }
function capTitle(s){ return String(s||'').trim().split(/\s+/).map(capWord).join(' '); }
function userEmail(){ try { return localStorage.getItem('df_user') || ''; } catch { return ''; } }
function looksLikeEmail(e){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e||'').trim()); }

// ===== DOM refs =====
const app = document.getElementById('app');
const crumbs = document.getElementById('breadcrumbs');
const versionEl = document.getElementById('version');
const todayEl = document.getElementById('today');
const clockEl = document.getElementById('clock');
const bannerEl = document.getElementById('update-banner');
const bannerBtn = document.getElementById('update-refresh');

// ===== Ensure we always have a hash (prevents blank page if none) =====
function ensureHomeHash() {
  if (!location.hash || location.hash === '#') {
    location.replace('#/home');
  }
}

/* =========================================
   PHONE INPUT — improved live formatting
   ========================================= */
function phoneDigitsOnly(val){ return String(val||'').replace(/\D/g,'').slice(0,10); }
function formatPhoneUS(val){
  const d = phoneDigitsOnly(val);
  if (!d) return '';
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0,3)}) ${d.slice(3)}`;
  return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;
}
function bindPhoneAutoFormat(root=document){
  root.querySelectorAll('input[type="tel"]').forEach(inp=>{
    if (inp.dataset._phoneBound === '1') return;
    inp.dataset._phoneBound = '1';

    // initialize display
    inp.value = formatPhoneUS(phoneDigitsOnly(inp.value || ''));

    inp.addEventListener('input', ()=>{
      const digits = phoneDigitsOnly(inp.value);
      inp.value = formatPhoneUS(digits);
      try { inp.setSelectionRange(inp.value.length, inp.value.length); } catch {}
      inp.dataset.cleanPhone = digits;
    });
    inp.addEventListener('blur', ()=>{
      const digits = phoneDigitsOnly(inp.value);
      inp.value = formatPhoneUS(digits);
      inp.dataset.cleanPhone = digits;
    });
  });
}

/* =========================================
   INVITE — opens mail draft with login link
   ========================================= */
function inviteMailtoHref(email, name){
  const who = name ? name : 'there';
  const base = location.origin + location.pathname.replace(/index\.html?$/,'');
  const loginUrl = base + 'login.html';
  const subject = encodeURIComponent('Your Dowson Farms account invite');
  const body = encodeURIComponent(
`Hi ${who},

You've been invited to join the Dowson Farms app.

1) Open the login page: ${loginUrl}
2) Sign in with your email (${email})
3) If you haven't set a password yet, choose "Forgot / Set Password" (coming soon) or contact the admin.

— Dowson Farms`
  );
  return `mailto:${encodeURIComponent(email)}?subject=${subject}&body=${body}`;
}

// ===== Layout measures → CSS vars =====
function setCSSVar(name, px){ document.documentElement.style.setProperty(name, `${px}px`); }
function measureBars(){
  const h = document.querySelector('.app-header');
  const c = document.querySelector('.breadcrumbs');
  const f = document.querySelector('.app-footer');
  setCSSVar('--header-h', h ? h.offsetHeight : 52);
  setCSSVar('--crumbs-h', c ? c.offsetHeight : 36);
  setCSSVar('--footer-h', f ? f.offsetHeight : 44);
  const b = document.getElementById('update-banner');
  setCSSVar('--banner-h', (b && !b.hidden) ? b.offsetHeight : 0);
}
function refreshLayout(){ measureBars(); requestAnimationFrame(measureBars); }
['load','resize','orientationchange'].forEach(evt=>window.addEventListener(evt, refreshLayout));

// ===== Tiles =====
function tile(emoji,label,href){
  return `<a class="tile" href="${href}" aria-label="${label}">
    <span class="emoji">${emoji}</span>
    <span class="label">${label}</span>
  </a>`;
}

// ===== Labels for breadcrumbs =====
const LABELS = {
  '#/home':'Home',
  // Crop Production
  '#/crop':'Crop Production',
  '#/crop/planting':'Planting',
  '#/crop/spraying':'Spraying',
  '#/crop/aerial':'Aerial Spray',
  '#/crop/harvest':'Harvest',
  '#/crop/maintenance':'Field Maintenance',
  '#/crop/scouting':'Scouting',
  '#/crop/trials':'Trials',

  // Calculators
  '#/calc':'Calculator',
  '#/calc/fertilizer':'Fertilizer Calculator',
  '#/calc/bin':'Bin Volume Calculator',
  '#/calc/area':'Area Calculator',
  '#/calc/combine':'Combine Yield Calculator',
  '#/calc/chem':'Chemical Mix Sheet',

  // Equipment
  '#/equipment':'Equipment',
  '#/equipment/receivers':'StarFire / Technology',
  '#/equipment/tractors':'Tractors',
  '#/equipment/combines':'Combines',
  '#/equipment/sprayer':'Sprayer / Fertilizer Spreader',
  '#/equipment/construction':'Construction Equipment',
  '#/equipment/trucks':'Trucks',
  '#/equipment/trailers':'Trailers',
  '#/equipment/implements':'Farm Implements',

  // Grain Tracking
  '#/grain':'Grain Tracking',
  '#/grain/bag':'Grain Bag',
  '#/grain/bins':'Grain Bins',
  '#/grain/contracts':'Grain Contracts',
  '#/grain/tickets':'Grain Ticket OCR',

  // Team & Partners
  '#/team':'Team & Partners',
  '#/team/employees':'Employees',
  '#/team/subcontractors':'Subcontractors',
  '#/team/vendors':'Vendors',
  '#/team/dir':'Directory',

  // Reports
  '#/ai':'Reports',
  '#/ai/premade':'Pre-made Reports',
  '#/ai/premade/feedback':'Feedback Summary',
  '#/ai/premade/grain-bags':'Grain Bag Report',
  '#/ai/ai':'AI Reports',
  '#/ai/yield':'Yield Report',

  // Settings
  '#/settings':'Settings',
  '#/settings/crops':'Crop Type',
  '#/settings/theme':'Theme',

  // Feedback
  '#/feedback':'Feedback',
  '#/feedback/errors':'Report Errors',
  '#/feedback/feature':'New Feature Request',
};

// ===== Breadcrumbs =====
function renderBreadcrumb(){
  const hash = location.hash || '#/home';
  if (hash === '#/home' || hash === '') {
    crumbs.innerHTML = `<span aria-current="page">Home</span>`;
    return;
  }
  const parts = hash.split('/').filter(Boolean);
  let trail = [`<a href="#/home">Home</a>`];
  let cur = '#';
  for (let i=1;i<parts.length;i++){
    cur += '/' + parts[i];
    const label = LABELS[cur] || parts[i].replace(/-/g,' ').replace(/\b\w/g, s=>s.toUpperCase());
    if (i < parts.length-1) trail.push(`<a href="${cur}">${label}</a>`);
    else trail.push(`<span aria-current="page">${label}</span>`);
  }
  crumbs.innerHTML = trail.join(' &nbsp;&gt;&nbsp; ');
}

// ===== HOME =====
function viewHome(){
  app.innerHTML = `
    <div class="grid">
      ${tile('🌽','Crop Production','#/crop')}
      ${tile('🔢','Calculator','#/calc')}
      ${tile('🛠️','Field Maintenance','#/crop/maintenance')}
      ${tile('🚜','Equipment','#/equipment')}
      ${tile('📦','Grain Tracking','#/grain')}
      ${tile('🤝','Team & Partners','#/team')}
      ${tile('📊','Reports','#/ai')}
      ${tile('⚙️','Settings','#/settings')}
      ${tile('💬','Feedback','#/feedback')}
    </div>
  `;
}
</script>
<!-- app.js v11.0.0 — PART 2/10 (Router + Home view + footer version + logout wire) -->
<script>
(function APP_V1100_P2(){
  'use strict';

  // ====== 1) Small helpers (shared) ======
  const $  = (sel, root=document)=>root.querySelector(sel);
  const $$ = (sel, root=document)=>Array.from(root.querySelectorAll(sel));
  const noop = ()=>{};

  // Expose a single global for later parts
  window.DF = window.DF || {};
  const NS = window.DF;

  // Keep version together (shows in footer below)
  NS.VERSION = 'v11.0.0';

  // ====== 2) DOM anchors we created in Part 1 ======
  const appEl     = document.getElementById('app')     || document.body;
  const headerEl  = document.getElementById('header')  || document.body;
  const footerEl  = document.getElementById('footer')  || document.body;

  // ====== 3) Header behavior: wire Logout button (to login.html) ======
  function wireHeader(){
    const btn = headerEl.querySelector('#logout-btn');
    if (!btn) return;
    // Idempotent: clear any previous listeners by cloning
    const clone = btn.cloneNode(true);
    btn.replaceWith(clone);
    clone.addEventListener('click', (e)=>{
      e.preventDefault();
      try {
        // Clear any light auth we may add later
        localStorage.removeItem('df_user');
        // Navigate to the static login page (works on GitHub Pages)
        location.href = 'login.html';
      } catch {
        location.href = 'login.html';
      }
    });
  }

  // ====== 4) Footer version label ======
  function paintFooterVersion(){
    const v = footerEl.querySelector('#version');
    if (v) v.textContent = NS.VERSION;
  }

  // ====== 5) Minimal client-side router ======
  const routes = {};
  function addRoute(hash, viewFn){ routes[hash] = viewFn; }

  function ensureHash(){
    if (!location.hash || location.hash === '#/' || location.hash === '#') {
      // default landing
      location.replace('#/home');
    }
  }

  function route(){
    ensureHash();
    const key = location.hash.replace(/^\#/, '');
    const fn  = routes[key] || routes['#/home'] || noop;
    // clear and render
    appEl.innerHTML = '';
    fn(appEl);
    // update header/footer each navigation
    wireHeader();
    paintFooterVersion();
  }

  // ====== 6) Home view (simple placeholder, looks like your current header/footer) ======
  function viewHome(root){
    root.innerHTML = `
      <section class="section">
        <h1>Home</h1>
        <p class="muted">Welcome to Dowson Farms.</p>
      </section>
    `;
  }
  addRoute('#/home', viewHome);

  // ====== 7) Kick on load + SPA navigations ======
  function kick(){
    route();
  }
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', kick, {once:true});
  } else {
    kick();
  }
  window.addEventListener('hashchange', route);

  // Also repaint footer/version if anything forces a full redraw
  document.addEventListener('visibilitychange', ()=>{ if (!document.hidden) paintFooterVersion(); });

})();
</script>