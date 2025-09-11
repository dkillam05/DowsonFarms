/* Dowson Farms — v12.0.1 (clean baseline, single file)
   - Header/Footer paint
   - Footer shows version
   - Logout → login.html (if present) else inline login
   - Home dashboard tiles (your order + emojis)
   - Lightweight router (#/home default)
*/
(function DF_v1201(){
  'use strict';
  if (window.__DF_v1201__) return; window.__DF_v1201__ = true;

  // ---------- Config ----------
  const VERSION = 'v12.0.2';
  const APPNAME = 'Dowson Farms';
  const PATH = { logo: 'icons/logo.png', login: 'login.html' };

  // ---------- Helpers ----------
  const $  = (s, r=document)=>r.querySelector(s);
  const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));
  const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const app = ()=> $('#app');

  // ---------- Ensure base DOM (header/app/footer) ----------
  (function ensureDOM(){
    if (!$('#header')) {
      const h = document.createElement('header');
      h.id = 'header';
      h.className = 'site-head';
      h.innerHTML = `
        <div class="container head-inner">
          <div class="brand">
            <img src="${PATH.logo}" alt="Logo" class="brand-logo" width="40" height="40">
            <span class="brand-title">${esc(APPNAME)}</span>
          </div>
          <nav class="head-actions">
            <span class="dot" aria-hidden="true">•</span>
            <button id="logoutBtn" class="btn">Logout</button>
          </nav>
        </div>
      `;
      document.body.prepend(h);
    }
    if (!$('#app')) {
      const main = document.createElement('main');
      main.id = 'app';
      main.className = 'app';
      document.body.insertBefore(main, $('#footer') || null);
    }
    if (!$('#footer')) {
      const f = document.createElement('footer');
      f.id = 'footer';
      f.className = 'site-foot';
      f.innerHTML = `
        <div class="container foot-inner">
          <span>© Dowson Farms</span>
          <span aria-hidden="true">•</span>
          <span id="version">v0.0.0</span>
        </div>
      `;
      document.body.appendChild(f);
    }
  })();

  // ---------- Minimal styles (safe) ----------
  (function injectCSS(){
    if ($('#df-v1201-css')) return;
    const css = document.createElement('style');
    css.id = 'df-v1201-css';
    css.textContent = `
      :root{ --bg:#f6f3e4; --fg:#1a1a1a; --muted:#6e6e6e; --tile:#fff; --bd:rgba(0,0,0,.08); --brand:#0f4d1d; }
      html,body{height:100%}
      body{margin:0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background:var(--bg); color:var(--fg);}
      .container{max-width:980px; margin:0 auto; padding:12px;}
      .site-head{position:sticky; top:0; background:#efe9d0; border-bottom:1px solid var(--bd); z-index:10;}
      .head-inner{display:flex; align-items:center; justify-content:space-between;}
      .brand{display:flex; align-items:center; gap:10px;}
      .brand-logo{border-radius:50%}
      .brand-title{font-weight:700; font-size:22px}
      .head-actions .btn{background:#fff; border:1px solid var(--bd); border-radius:10px; padding:6px 12px;}
      .head-actions .dot{color:var(--muted)}
      .app{min-height:calc(100vh - 140px);}
      .site-foot{border-top:1px solid var(--bd); background:#efe9d0;}
      .foot-inner{display:flex; align-items:center; justify-content:center; gap:10px; color:var(--muted); font-weight:600;}
      .section{padding:18px 12px;}
      h1{margin:0 0 10px; font-size:28px}
      .muted{color:var(--muted)}
      /* Tiles */
      .df-tiles{ display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
      @media (min-width:760px){ .df-tiles{ grid-template-columns:repeat(4,minmax(0,1fr)); } }
      .df-tile{ display:flex; flex-direction:column; align-items:center; justify-content:center; text-decoration:none; border:1px solid var(--bd); border-radius:12px; padding:16px 10px; background:var(--tile); color:inherit; box-shadow:0 1px 0 rgba(0,0,0,.04); }
      .df-tile:active{ transform:scale(.985); }
      .df-emoji{ font-size:28px; line-height:1; margin-bottom:6px; }
      .df-label{ font-weight:700; text-align:center; }
      .btn-primary{ background:var(--brand); color:#fff; border:0; border-radius:10px; padding:8px 12px; }
      input{ width:100%; padding:10px 12px; border-radius:10px; border:1px solid var(--bd); background:#fff; }
      .field{ margin:8px 0; }
    `;
    document.head.appendChild(css);
  })();

  // ---------- Footer version ----------
  (function paintVersion(){
    const v = $('#version'); if (v) v.textContent = VERSION;
  })();

  // ---------- Logout handling ----------
  function doLogout(){
    try{ localStorage.removeItem('df_user'); sessionStorage.clear(); }catch{}
    fetch(PATH.login, { method:'HEAD' })
      .then(r => { if (r.ok) location.href = PATH.login; else renderLoginInline(); })
      .catch(()=> renderLoginInline());
  }
  function wireLogout(){
    const btn = $('#logoutBtn') || $$('button,a').find(b => (b.textContent||'').trim().toLowerCase()==='logout');
    if (!btn || btn.dataset.wired==='1') return;
    btn.dataset.wired = '1';
    btn.addEventListener('click', (e)=>{ e.preventDefault(); doLogout(); });
  }
  function renderLoginInline(){
    location.hash = '#/login';
    const root = app(); if (!root) return;
    root.innerHTML = `
      <section class="section">
        <h1>Login</h1>
        <div class="field"><input id="li-email" type="email" placeholder="Email"></div>
        <div class="field" style="display:flex;gap:8px;">
          <input id="li-pass" type="password" placeholder="Password" style="flex:1;">
          <button class="btn-primary" id="li-go">Log In</button>
        </div>
      </section>`;
    $('#li-go')?.addEventListener('click', ()=>{
      const email = String($('#li-email')?.value||'').trim();
      try{ if (email) localStorage.setItem('df_user', email); }catch{}
      location.hash = '#/home';
      renderHome();
    });
    wireLogout();
  }

  // ---------- Home tiles (YOUR emojis/order) ----------
  const TILES = [
    { href:'#/crop',     icon:'🌽', label:'Crop Production' },
    { href:'#/grain',    icon:'🌾', label:'Grain Tracking' },
    { href:'#/equip',    icon:'🚜', label:'Equipment' },
    { href:'#/calc',     icon:'🧮', label:'Calculators' },
    { href:'#/reports',  icon:'📊', label:'Reports' },
    { href:'#/team',     icon:'🤝', label:'Team / Partners' },
    { href:'#/feedback', icon:'📝', label:'Feedback' },
    { href:'#/settings', icon:'⚙️', label:'Setups / Settings' },
  ];
  function tilesHTML(){
    return `
      <section class="section">
        <h1>Home</h1>
        <div class="df-tiles">
          ${TILES.map(t=>`
            <a class="df-tile" href="${t.href}" aria-label="${esc(t.label)}">
              <div class="df-emoji">${t.icon}</div>
              <div class="df-label">${esc(t.label)}</div>
            </a>`).join('')}
        </div>
      </section>`;
  }
  function renderHome(){
    const root = app(); if (!root) return;
    root.innerHTML = tilesHTML();
    wireLogout();
  }

  // ---------- Router (simple) ----------
  function route(){
    const h = location.hash || '#/home';
    if (h === '#/' || h === '#' || h === '#/home'){ renderHome(); return; }
    if (h === '#/login'){ renderLoginInline(); return; }
    // placeholder pages for now
    const routes = ['#/crop','#/grain','#/equip','#/calc','#/reports','#/team','#/feedback','#/settings'];
    if (routes.includes(h)){
      app().innerHTML = `<section class="section"><h1>${esc(h.slice(2))}</h1><p class="muted">Screen scaffold loaded. We’ll wire content next.</p></section>`;
      wireLogout(); return;
    }
    // fallback
    location.hash = '#/home';
  }

  // ---------- Boot ----------
  function init(){
    wireLogout();
    route();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once:true });
  } else { init(); }
  window.addEventListener('hashchange', route, { passive:true });

  // expose a couple of helpers (optional)
  window.DF = window.DF || {};
  window.DF.VERSION = VERSION;
  window.DF.renderHome = renderHome;
})();

/* =========================================================
   APP v12 — Navigation Menus + Tile Polish + Login view
   Requires: your current v12 baseline already loaded
   Append this block to the END of app.js
   ========================================================= */
(function DF_v12_Menus(){
  'use strict';
  if (window.__DF_V12_MENUS__) return;
  window.__DF_V12_MENUS__ = true;

  // ---------- tiny helpers (same shapes as your baseline) ----------
  const $  = (s, r=document)=>r.querySelector(s);
  const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));
  const app = ()=> $('#app');

  // Header/Footer hide/show for login screen
  function applyLoginChrome(){
    const isLogin = (location.hash||'').replace(/\/+$/,'') === '#/login';
    const head = $('#header');
    const foot = $('#footer');
    if (head) head.style.display = isLogin ? 'none' : '';
    if (foot) foot.style.display = isLogin ? 'none' : '';
  }
  window.addEventListener('hashchange', applyLoginChrome);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyLoginChrome, {once:true});
  } else {
    applyLoginChrome();
  }

  // ---------- Tile polish (slightly nicer than the raw baseline) ----------
  function ensureTileStyles(){
    if ($('#df-tiles-polish')) return;
    const css = document.createElement('style');
    css.id = 'df-tiles-polish';
    css.textContent = `
      .df-tiles{ display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; margin-top:8px; }
      @media (min-width:760px){ .df-tiles{ grid-template-columns:repeat(4,minmax(0,1fr)); } }
      .df-tile{
        display:flex; flex-direction:column; align-items:center; justify-content:center;
        text-decoration:none; border:1px solid rgba(0,0,0,.08); border-radius:14px;
        padding:16px 12px; background:#fff; color:inherit;
        box-shadow:0 1px 0 rgba(0,0,0,.04), 0 6px 14px rgba(0,0,0,.05);
        transition:transform .06s ease, box-shadow .12s ease;
      }
      .df-tile:active{ transform:scale(.98); box-shadow:0 1px 0 rgba(0,0,0,.04), 0 3px 8px rgba(0,0,0,.04); }
      .df-emoji{ font-size:28px; line-height:1; margin-bottom:6px; }
      .df-label{ font-weight:700; text-align:center; letter-spacing:.2px; }
      /* submenu grid */
      .df-subtiles{ display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; margin-top:10px; }
      @media (min-width:760px){ .df-subtiles{ grid-template-columns:repeat(3,minmax(0,1fr)); } }
      .df-subtile{ display:flex; align-items:center; gap:10px; padding:12px; background:#fff; border:1px solid rgba(0,0,0,.08); border-radius:10px; text-decoration:none; color:inherit; }
      .df-subtile .em{ font-size:20px; }
      .muted{ color:#666; }
    `;
    document.head.appendChild(css);
  }

  // ---------- Top-level tiles (order & emojis EXACTLY as requested) ----------
  const HOME_TILES = [
    { href:'#/crop',     icon:'🌽', label:'Crop Production' },
    { href:'#/grain',    icon:'🌾', label:'Grain Tracking' },
    { href:'#/equip',    icon:'🛠️', label:'Equipment' },
    { href:'#/calc',     icon:'➗', label:'Calculators' },
    { href:'#/reports',  icon:'📊', label:'Reports' },
    { href:'#/team',     icon:'👥', label:'Team / Partners' },
    { href:'#/feedback', icon:'💬', label:'Feedback' },
    { href:'#/settings', icon:'⚙️', label:'Setups / Settings' },
  ];

  // ---------- Submenus (clean, similar to your 10.15.1 layout) ----------
  const SUBMENUS = {
    '#/crop': [
      { href:'#/crop/planting',  icon:'🌱', label:'Planting' },
      { href:'#/crop/spraying',  icon:'🧪', label:'Spraying' },
      { href:'#/crop/aerial',    icon:'✈️', label:'Aerial Spray' },
      { href:'#/crop/harvest',   icon:'🚜', label:'Harvest' },
      { href:'#/crop/maint',     icon:'🧰', label:'Field Maintenance' },
      { href:'#/crop/scouting',  icon:'🔍', label:'Scouting' },
      { href:'#/crop/trials',    icon:'🧫', label:'Trials' },
    ],
    '#/grain': [
      { href:'#/grain/bag',   icon:'🛍️', label:'Grain Bag' },
      { href:'#/grain/bins',  icon:'🏚️', label:'Grain Bins' },
      { href:'#/grain/cont',  icon:'📄', label:'Grain Contracts' },
      { href:'#/grain/ocr',   icon:'🧾', label:'Grain Ticket OCR' },
    ],
    '#/equip': [
      { href:'#/equip/tech',      icon:'🛰️', label:'StarFire / Technology' },
      { href:'#/equip/tractors',  icon:'🚜', label:'Tractors' },
      { href:'#/equip/combines',  icon:'🚜', label:'Combines' },
      { href:'#/equip/sprayers',  icon:'💦', label:'Sprayer / Fertilizer' },
      { href:'#/equip/const',     icon:'🏗️', label:'Construction Equipment' },
      { href:'#/equip/trucks',    icon:'🚚', label:'Trucks' },
      { href:'#/equip/trailers',  icon:'🚛', label:'Trailers' },
      { href:'#/equip/impl',      icon:'⚙️', label:'Farm Implements' },
    ],
    '#/calc': [
      { href:'#/calc/fertilizer', icon:'🧮', label:'Fertilizer' },
      { href:'#/calc/bin',        icon:'📦', label:'Bin Volume' },
      { href:'#/calc/area',       icon:'📐', label:'Area' },
      { href:'#/calc/yield',      icon:'🌾', label:'Combine Yield' },
      { href:'#/calc/chem',       icon:'🧪', label:'Chemical Mix' },
    ],
    '#/reports': [
      { href:'#/reports/premade', icon:'📑', label:'Pre-made Reports' },
      { href:'#/reports/feedback',icon:'🧾', label:'Feedback Summary' },
      { href:'#/reports/bag',     icon:'🛍️', label:'Grain Bag Report' },
      { href:'#/reports/ai',      icon:'🤖', label:'AI Reports' },
      { href:'#/reports/yield',   icon:'📈', label:'Yield Report' },
    ],
    '#/team': [
      { href:'#/team/employees',  icon:'👷', label:'Employees' },
      { href:'#/team/subs',       icon:'🧑‍🔧', label:'Subcontractors' },
      { href:'#/team/vendors',    icon:'🏪', label:'Vendors' },
      { href:'#/team/dir',        icon:'📇', label:'Directory' },
    ],
    '#/feedback': [
      { href:'#/feedback/error',   icon:'🐞', label:'Report Errors' },
      { href:'#/feedback/feature', icon:'💡', label:'New Feature Request' },
    ],
    '#/settings': [
      { href:'#/settings/farms',   icon:'🏠', label:'Farms' },
      { href:'#/settings/fields',  icon:'🗺️', label:'Fields' },
      { href:'#/settings/crop',    icon:'🌿', label:'Crop Type' },
      { href:'#/settings/theme',   icon:'🎨', label:'Theme' },
      { href:'#/settings/users',   icon:'👤', label:'Users' },
    ],
  };

  // ---------- renderers ----------
  function renderHome(){
    ensureTileStyles();
    const root = app(); if (!root) return;
    root.innerHTML = `
      <section class="section">
        <h1>Home</h1>
        <div class="df-tiles">
          ${HOME_TILES.map(t=>`
            <a class="df-tile" href="${t.href}" aria-label="${t.label}">
              <div class="df-emoji">${t.icon}</div>
              <div class="df-label">${t.label}</div>
            </a>
          `).join('')}
        </div>
      </section>
    `;
  }

  function renderSubmenu(baseHash, title, emoji){
    ensureTileStyles();
    const items = SUBMENUS[baseHash] || [];
    const root = app(); if (!root) return;
    root.innerHTML = `
      <section class="section">
        <h1>${emoji} ${title}</h1>
        <div class="df-subtiles">
          ${items.map(it=>`
            <a class="df-subtile" href="${it.href}">
              <span class="em">${it.icon}</span>
              <span>${it.label}</span>
            </a>
          `).join('')}
        </div>
        <p class="muted" style="margin-top:12px;"><a href="#/home">← Back to Home</a></p>
      </section>
    `;
  }

  // simple placeholders for leaf routes (we’ll replace later with real screens)
  function renderLeaf(title, emoji){
    const root = app(); if (!root) return;
    root.innerHTML = `
      <section class="section">
        <h1>${emoji} ${title}</h1>
        <p class="muted">Screen scaffold — coming back step-by-step.</p>
        <p class="muted"><a href="javascript:history.back()">← Back</a></p>
      </section>
    `;
  }

  // ---------- router hook ----------
  function routeMenus(){
    const h = (location.hash||'').replace(/\/+$/,'') || '#/home';

    // home
    if (h === '#/home' || h === '#/' || h === '#') { renderHome(); return true; }

    // top-level submenus
    const top = ['#/crop','#/grain','#/equip','#/calc','#/reports','#/team','#/feedback','#/settings'];
    for (const b of top){
      if (h === b){ // exact match → show submenu grid
        const tile = HOME_TILES.find(t=>t.href===b) || {label:'',icon:''};
        renderSubmenu(b, tile.label, tile.icon);
        return true;
      }
    }

    // leaf routes (anything deeper than a top base)
    const hit = top.find(b=>h.startsWith(b+'/'));
    if (hit){
      // title from submenu map
      const sub = (SUBMENUS[hit]||[]).find(x=>x.href===h);
      if (sub){ renderLeaf(sub.label, sub.icon); return true; }
      renderLeaf(h.replace(/^#\//,''), '📄'); // fallback
      return true;
    }

    // login chrome toggle
    applyLoginChrome();
    return false; // let other parts (future) handle
  }

  // wire into your existing router loop (baseline already listens to hashchange)
  window.addEventListener('hashchange', routeMenus, {passive:true});
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', routeMenus, {once:true});
  } else {
    routeMenus();
  }

  // Expose for future parts if needed
  window.DF = window.DF || {};
  window.DF.renderHome = renderHome;
})();
