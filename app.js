/* ============================================================
   Dowson Farms — APP v12.2.0 (Clean Baseline, Structured Parts)
   Contents:
     Part 1 — Globals & Config
     Part 2 — Base DOM (Header/App/Footer) + Base Styles + Version
     Part 3 — Router Core & Registry
     Part 4 — Auth (Logout/Login + Hide Chrome on login)
     Part 5 — Home Dashboard (tiles, order, emojis)
     Part 6 — Menus & Submenus (placeholders)
     Part 7 — Not Found (friendly fallback)
     Part 8 — Boot (single init & route pass)
   Notes:
     • Idempotent guards for each part (safe to append once)
     • Uses location.hash routing; default #/home
     • Logout goes to login.html if present; else inline login
     • Header/Footer hidden on #/login
   ============================================================ */


/* =========================
   Part 1 — Globals & Config
   ========================= */
(function DF_V12_P1_GLOBALS(){
  'use strict';
  if (window.__DF_V12_P1__) return; window.__DF_V12_P1__ = true;

  // Version surfaces in footer
  const VERSION = 'v12.2.16';

  // App constants
  const APP = {
    name: 'Dowson Farms',
    logo: 'icons/logo.png',
    loginPage: 'login.html'
  };

  // Tiny helpers used across parts
  const $  = (s, r=document)=>r.querySelector(s);
  const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));
  const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const appRoot = ()=> $('#app');

  // Expose a single namespace
  window.DF = window.DF || {};
  Object.assign(window.DF, { VERSION, APP, $, $$, esc, appRoot });
})();


/* ======================================================
   Part 2 — Base DOM + Base Styles + Footer Version Paint
   ====================================================== */
(function DF_V12_P2_SHELL(){
  'use strict';
  if (window.__DF_V12_P2__) return; window.__DF_V12_P2__ = true;
  const { APP, $, esc } = window.DF;

  // Ensure header/app/footer exist (don’t duplicate if present)
  (function ensureDOM(){
    if (!$('#header')){
      const h = document.createElement('header');
      h.id = 'header';
      h.className = 'site-head';
      h.innerHTML = `
        <div class="container head-inner">
          <div class="brand">
            <img src="${esc(APP.logo)}" alt="Logo" class="brand-logo" width="40" height="40">
            <span class="brand-title">${esc(APP.name)}</span>
          </div>
          <nav class="head-actions">
            <span class="dot" aria-hidden="true">•</span>
            <button id="logoutBtn" class="btn">Logout</button>
          </nav>
        </div>
      `;
      document.body.prepend(h);
    }
    if (!$('#app')){
      const m = document.createElement('main');
      m.id = 'app';
      m.className = 'app';
      document.body.insertBefore(m, $('#footer') || null);
    }
    if (!$('#footer')){
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

  // Minimal, safe base CSS (scoped to app look/feel)
  (function injectBaseCSS(){
    if ($('#df-v12-base-css')) return;
    const css = document.createElement('style');
    css.id = 'df-v12-base-css';
    css.textContent = `
      :root{
        --bg:#f6f3e4; --fg:#1a1a1a; --muted:#6e6e6e;
        --tile:#fff; --bd:rgba(0,0,0,.08); --brand:#0f4d1d;
      }
      html,body{height:100%}
      body{margin:0; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; background:var(--bg); color:var(--fg);}
      .container{max-width:980px; margin:0 auto; padding:12px;}
      .site-head{position:sticky; top:0; background:#efe9d0; border-bottom:1px solid var(--bd); z-index:10;}
      .head-inner{display:flex; align-items:center; justify-content:space-between;}
      .brand{display:flex; align-items:center; gap:10px;}
      .brand-logo{border-radius:50%}
      .brand-title{font-weight:700; font-size:22px}
      .head-actions .btn{background:#fff; border:1px solid var(--bd); border-radius:10px; padding:6px 12px; cursor:pointer;}
      .head-actions .dot{color:var(--muted)}
      .app{min-height:calc(100vh - 140px);}
      .site-foot{border-top:1px solid var(--bd); background:#efe9d0;}
      .foot-inner{display:flex; align-items:center; justify-content:center; gap:10px; color:var(--muted); font-weight:600;}
      .section{padding:18px 12px;}
      h1{margin:0 0 10px; font-size:28px}
      .muted{color:var(--muted)}
      .btn-primary{ background:var(--brand); color:#fff; border:0; border-radius:10px; padding:8px 12px; cursor:pointer; }
      input{ width:100%; padding:10px 12px; border-radius:10px; border:1px solid var(--bd); background:#fff; }
      .field{ margin:8px 0; }
      a{ color:inherit; }
      /* Tiles */
      .df-tiles{ display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
      @media (min-width:760px){ .df-tiles{ grid-template-columns:repeat(4,minmax(0,1fr)); } }
      .df-tile{ display:flex; flex-direction:column; align-items:center; justify-content:center; text-decoration:none; border:1px solid var(--bd); border-radius:12px; padding:16px 10px; background:var(--tile); color:inherit; box-shadow:0 1px 0 rgba(0,0,0,.04); }
      .df-tile:active{ transform:scale(.985); }
      .df-emoji{ font-size:28px; line-height:1; margin-bottom:6px; }
      .df-label{ font-weight:700; text-align:center; }
      /* Sub-tiles */
      .df-subtiles{ display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; margin-top:10px; }
      @media (min-width:760px){ .df-subtiles{ grid-template-columns:repeat(3,minmax(0,1fr)); } }
      .df-subtile{ display:flex; align-items:center; gap:10px; padding:12px; background:#fff; border:1px solid var(--bd); border-radius:10px; text-decoration:none; color:inherit; }
      .df-subtile .em{ font-size:20px; }
    `;
    document.head.appendChild(css);
  })();

  // Paint version in footer
  (function paintVersion(){
    const v = document.getElementById('version');
    if (v) v.textContent = window.DF.VERSION;
  })();
})();


/* ===========================================
   Part 3 — Router Core & Central Registry
   =========================================== */
(function DF_V12_P3_ROUTER(){
  'use strict';
  if (window.__DF_V12_P3__) return; window.__DF_V12_P3__ = true;
  const { appRoot } = window.DF;

  const routes = new Map();

  window.DF.routeRegister = function(path, handler){
    if (!path || typeof handler!=='function') return;
    routes.set(path, handler);
  };

  window.DF.routeGo = function(path){
    if (!path) return;
    if (location.hash !== path) location.hash = path;
    else tick();
  };

  function normalize(h){
    if (!h || h === '#') return '#/home';
    return h.replace(/\/+$/,'') || '#/home';
  }

  function notFound(h){
    const { esc } = window.DF;
    const root = appRoot(); if (!root) return;
    root.innerHTML = `
      <section class="section">
        <h1>Not Found</h1>
        <p class="muted">The screen <code>${esc(h)}</code> is not wired yet.</p>
        <div class="section"><a class="btn" href="#/home">Back to Home</a></div>
      </section>
    `;
  }

  function tick(){
    const h = normalize(location.hash);
    if (routes.has(h)){ routes.get(h)(); return; }
    // Give other parts (menus) a chance to handle deeper routes
    requestAnimationFrame(()=>{
      const root = appRoot(); if (!root) return;
      // If nothing rendered, show Not Found
      if (!root.innerHTML || !root.innerHTML.trim()){
        notFound(h);
      }
    });
  }

  window.addEventListener('hashchange', tick, {passive:true});
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', tick, {once:true});
  } else { tick(); }
})();


/* ======================================================
   Part 4 — Auth (Logout/Login + Hide Chrome on login)
   ====================================================== */
(function DF_V12_P4_AUTH(){
  'use strict';
  if (window.__DF_V12_P4__) return; window.__DF_V12_P4__ = true;

  // pull helpers & config from Part 1
  const { APP, $, $$, esc } = window.DF || {};
  if (!APP || !$) { console.error('DF Part 4: missing Part 1 helpers/config'); return; }

  // ------------------------------
  // 1) Hide chrome on #/login
  // ------------------------------
  function applyLoginChrome(){
    const isLogin = ((location.hash||'').replace(/\/+$/,'') === '#/login');
    const head = $('#header'); const foot = $('#footer');
    if (head) head.style.display = isLogin ? 'none' : '';
    if (foot) foot.style.display = isLogin ? 'none' : '';
  }
  window.addEventListener('hashchange', applyLoginChrome, {passive:true});
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyLoginChrome, {once:true});
  } else {
    applyLoginChrome();
  }

  // ------------------------------
  // 2) Inline Login (fallback UI)
  // ------------------------------
  function renderLoginInline(){
    location.hash = '#/login';
    const root = $('#app'); if (!root) return;

    // simple local styles (scoped id to avoid clashes)
    if (!$('#df-login-css')) {
      const css = document.createElement('style');
      css.id = 'df-login-css';
      css.textContent = `
        #df-login{ min-height: 100vh; display:grid; place-items:center; padding:24px; background:var(--bg,#f6f3e4); }
        #df-login .card{ width:min(520px, 92vw); background:#fff; border:1px solid rgba(0,0,0,.08); border-radius:14px; box-shadow:0 8px 26px rgba(0,0,0,.06); padding:22px 18px; }
        #df-login .brand{ display:flex; flex-direction:column; align-items:center; gap:10px; margin-bottom:8px; }
        #df-login .brand img{ width:64px; height:64px; border-radius:12px; }
        #df-login .brand .title{ font-weight:800; letter-spacing:.2px; }
        #df-login .field{ margin:10px 0; }
        #df-login input{ width:100%; padding:12px 12px; border-radius:10px; border:1px solid rgba(0,0,0,.12); font-size:16px; }
        #df-login .row{ display:flex; gap:8px; align-items:center; }
        #df-login .btn-primary{ background:var(--brand,#0f4d1d); color:#fff; border:0; border-radius:10px; padding:10px 12px; cursor:pointer; white-space:nowrap; }
        #df-login .muted{ color:#6e6e6e; font-size:.92rem; }
        #df-login .util{ display:flex; justify-content:space-between; align-items:center; margin-top:8px; }
        #df-login .pw-wrap{ position:relative; }
        #df-login .pw-toggle{ position:absolute; right:10px; top:50%; transform:translateY(-50%); cursor:pointer; opacity:.7; }
        #df-login .footline{ margin-top:10px; display:flex; justify-content:center; gap:8px; color:#6e6e6e; }
      `;
      document.head.appendChild(css);
    }

    // time/date for footer stripe
    const now = new Date();
    const dateNice = now.toLocaleDateString(undefined, { year:'numeric', month:'long', day:'numeric' });
    const timeNice = now.toLocaleTimeString(undefined, { hour:'numeric', minute:'2-digit' });

    root.innerHTML = `
      <section id="df-login">
        <div class="card" role="dialog" aria-label="Login">
          <div class="brand">
            <img src="${esc(APP.logo)}" alt="Dowson Farms">
            <div class="title">${esc(APP.name)}</div>
          </div>

          <div class="field">
            <input id="li-email" type="email" inputmode="email" autocomplete="username" placeholder="Email">
          </div>

          <div class="field pw-wrap">
            <input id="li-pass" type="password" autocomplete="current-password" placeholder="Password (8+ chars, 1 capital, 1 number)">
            <span id="pw-toggle" class="pw-toggle" title="Show/Hide">👁️</span>
          </div>

          <div class="util">
            <button class="btn-primary" id="li-go">Log In</button>
            <a id="li-forgot" href="#" class="muted">Forgot password?</a>
          </div>

          <div class="footline">
            <span>${dateNice}</span><span>•</span><span>${timeNice}</span><span>•</span><span id="login-version">${esc(APP.version)}</span>
          </div>
        </div>
      </section>
    `;

    // show/hide password
    $('#pw-toggle')?.addEventListener('click', ()=>{
      const p = $('#li-pass'); if (!p) return;
      p.type = p.type === 'password' ? 'text' : 'password';
    });

    // login click
    $('#li-go')?.addEventListener('click', ()=>{
      const email = String($('#li-email')?.value||'').trim();
      const pass  = String($('#li-pass')?.value||'');
      // basic policy: 8+ chars, one capital, one number
      const ok = pass.length>=8 && /[A-Z]/.test(pass) && /\d/.test(pass);
      if (!email || !ok){
        alert('Enter a valid email and a password with 8+ chars, 1 capital, and 1 number.');
        return;
      }
      try { localStorage.setItem('df_user', email); } catch {}
      location.hash = '#/home';
    });

    // forgot password (demo stub — real wiring would hit your backend)
    $('#li-forgot')?.addEventListener('click',(e)=>{
      e.preventDefault();
      const email = String($('#li-email')?.value||'').trim();
      if (!email){ alert('Enter your email first.'); return; }
      // demo: pretend only demo@dowsonfarms.com exists
      const known = /^demo@dowsonfarms\.com$/i.test(email);
      alert( known
        ? 'Password reset link sent. Check your inbox.'
        : 'No account found for that email.' );
    });
  }

  // ------------------------------
  // 3) Logout (version-aware)
  // ------------------------------
  function doLogout(){
    try {
      localStorage.removeItem('df_user');
      sessionStorage.clear();
    } catch {}

    // Always try to navigate to login.html with version cache-bust
    const ver = encodeURIComponent(APP.version||'');
    const ts  = Date.now();
    const url = `login.html?v=${ver}&ts=${ts}`;

    // First check if login.html exists, otherwise show inline
    fetch('login.html', { method:'HEAD' })
      .then(r => { if (r.ok) location.href = url; else renderLoginInline(); })
      .catch(() => renderLoginInline());
  }

  // ------------------------------
  // 4) Wire any "Logout" button
  // ------------------------------
  function wireLogout(){
    const btn = $('#logoutBtn') || $$('button,a').find(b => (b.textContent||'').trim().toLowerCase()==='logout');
    if (!btn || btn.dataset.dfWired==='1') return;
    btn.dataset.dfWired='1';
    btn.addEventListener('click', (e)=>{ e.preventDefault(); doLogout(); });
  }
  window.addEventListener('hashchange', ()=> setTimeout(wireLogout,0), {passive:true});
  document.addEventListener('click', ()=> setTimeout(wireLogout,0), true);
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', wireLogout, {once:true});
  } else {
    wireLogout();
  }

  // expose a tiny surface under DF.auth for later parts/tests
  window.DF = window.DF || {};
  window.DF.auth = { doLogout, renderLoginInline, applyLoginChrome, wireLogout };

})();


/* ===============================================
   Part 5 — Home Dashboard (order + emojis EXACT)
   =============================================== */
(function DF_V12_P5_HOME(){
  'use strict';
  if (window.__DF_V12_P5__) return; window.__DF_V12_P5__ = true;
  const { appRoot } = window.DF;

  // EXACT order + emojis you requested
  const HOME_TILES = [
    { href:'#/crop',     icon:'🌽', label:'Crop Production' },
    { href:'#/grain',    icon:'🌾', label:'Grain Tracking' },
    { href:'#/equip',    icon:'🚜', label:'Equipment' },
    { href:'#/calc',     icon:'🧮', label:'Calculators' },
    { href:'#/reports',  icon:'📊', label:'Reports' },
    { href:'#/team',     icon:'🤝', label:'Team / Partners' },
    { href:'#/feedback', icon:'💬', label:'Feedback' },
    { href:'#/settings', icon:'⚙️', label:'Setups / Settings' }
  ];

  function tilesHTML(){
    return `
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

  function renderHome(){
    const root = appRoot(); if (!root) return;
    root.innerHTML = tilesHTML();
  }

  // Register route for #/home
  window.DF.routeRegister('#/home', renderHome);
  // Expose for later parts if needed
  window.DF.renderHome = renderHome;
})();


/* ==========================================
   Part 6 — Menus & Submenus (placeholders)
   ========================================== */
(function DF_V12_P6_MENUS(){
  'use strict';
  if (window.__DF_V12_P6__) return; window.__DF_V12_P6__ = true;
  const { appRoot } = window.DF;

  // Submenus (aligned to your 10.15.1 layout; can tweak icons later)
  const SUBMENUS = {
    '#/crop': [
      { href:'#/crop/planting',  icon:'🌱', label:'Planting' },
      { href:'#/crop/spraying',  icon:'🧪', label:'Spraying' },
      { href:'#/crop/aerial',    icon:'🚁', label:'Aerial Spray' },
      { href:'#/crop/harvest',   icon:'🌾', label:'Harvest' },
      { href:'#/crop/maintenance',icon:'🧰', label:'Field Maintenance' },
      { href:'#/crop/scouting',  icon:'🔎', label:'Scouting' },
      { href:'#/crop/trials',    icon:'🧬', label:'Trials' },
    ],
    '#/grain': [
      { href:'#/grain/bag',   icon:'🛍️', label:'Grain Bag' },
      { href:'#/grain/bins',  icon:'🛢️', label:'Grain Bins' },
      { href:'#/grain/cont',  icon:'📜', label:'Grain Contracts' },
      { href:'#/grain/ocr',   icon:'🧾', label:'Grain Ticket OCR' },
    ],
    '#/equip': [
      { href:'#/equip/tech',      icon:'🛰️', label:'StarFire / Technology' },
      { href:'#/equip/tractors',  icon:'🚜', label:'Tractors' },
      { href:'#/equip/combines',  icon:'🧺', label:'Combines' },  /* we can adjust */
      { href:'#/equip/sprayers',  icon:'💦', label:'Sprayer / Fertilizer Spreader' },
      { href:'#/equip/const',     icon:'🏗️', label:'Construction Equipment' },
      { href:'#/equip/trucks',    icon:'🚚', label:'Trucks' },
      { href:'#/equip/trailers',  icon:'🚛', label:'Trailers' },
      { href:'#/equip/impl',      icon:'⚙️', label:'Farm Implements' },
    ],
    '#/calc': [
      { href:'#/calc/fertilizer', icon:'🧪', label:'Fertilizer' },
      { href:'#/calc/bin',        icon:'🛢️', label:'Bin Volume' },
      { href:'#/calc/area',       icon:'📐', label:'Area' },
      { href:'#/calc/yield',      icon:'🌽', label:'Combine Yield' },
      { href:'#/calc/chem',       icon:'🧴', label:'Chemical Mix' },
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

  function renderSubmenu(baseHash, title, emoji){
    const root = appRoot(); if (!root) return;
    const items = SUBMENUS[baseHash] || [];
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

  // Wire top-level menu routes to render their submenu grids
  const TOP = [
    { base:'#/crop',     label:'Crop Production', icon:'🌽' },
    { base:'#/grain',    label:'Grain Tracking',  icon:'🌾' },
    { base:'#/equip',    label:'Equipment',       icon:'🚜' },
    { base:'#/calc',     label:'Calculators',     icon:'🧮' },
    { base:'#/reports',  label:'Reports',         icon:'📊' },
    { base:'#/team',     label:'Team / Partners', icon:'🤝' },
    { base:'#/feedback', label:'Feedback',        icon:'💬' },
    { base:'#/settings', label:'Setups / Settings', icon:'⚙️' },
  ];

  TOP.forEach(t=>{
    window.DF.routeRegister(t.base, ()=> renderSubmenu(t.base, t.label, t.icon));
  });

  // Leaf routes (placeholders) — anything deeper than top base
  function renderLeaf(title, emoji){
    const root = appRoot(); if (!root) return;
    root.innerHTML = `
      <section class="section">
        <h1>${emoji} ${title}</h1>
        <p class="muted">Screen scaffold — we’ll wire functionality step-by-step.</p>
        <p class="muted"><a href="javascript:history.back()">← Back</a></p>
      </section>
    `;
  }

  Object.values(SUBMENUS).flat().forEach(item=>{
    window.DF.routeRegister(item.href, ()=> renderLeaf(item.label, item.icon));
  });
})();


/* =======================================
   Part 7 — Not Found (friendly fallback)
   ======================================= */
(function DF_V12_P7_404(){
  'use strict';
  if (window.__DF_V12_P7__) return; window.__DF_V12_P7__ = true;
  // Already provided in router core; this part left for future expansions if needed.
  // (Kept as a labeled placeholder to keep numbering stable.)
})();


/* =========================================================
   Part 8 — Boot (single init & route pass) — v12.2.x
   - Prevents SPA from rendering on login.html
   - Still exposes DF for version access on login page
   ========================================================= */
(function DF_V12_P8_BOOT(){
  'use strict';
  if (window.__DF_V12_P8__) return; window.__DF_V12_P8__ = true;
  const { $, DF } = window;

  // Helper: are we on the standalone login page?
  function onLoginHTML(){
    try {
      const p = location.pathname || '';
      return /\/login\.html$/i.test(p);
    } catch { return false; }
  }

  // SPA init (only when NOT on login.html)
  function initSPA(){
    try {
      if (typeof window.DF?.wireLogout === 'function') window.DF.wireLogout();
      if (typeof window.DF?.routeAll === 'function')    window.DF.routeAll();
    } catch(e){ console.error('[DF] initSPA', e); }
  }

  // Router trigger (hashchange)
  function onHash(){
    try { if (typeof window.DF?.routeAll === 'function') window.DF.routeAll(); }
    catch(e){ console.error('[DF] route', e); }
  }

  // Boot gate: do nothing on login.html (lets that page control its own UI)
  function boot(){
    if (onLoginHTML()){
      // Hide any app chrome if it exists (defensive; usually not present on login.html)
      const head = $('#header'); if (head) head.style.display = 'none';
      const foot = $('#footer'); if (foot) foot.style.display = 'none';
      return; // IMPORTANT: do not start SPA here
    }

    // Normal SPA
    initSPA();
    window.addEventListener('hashchange', onHash, { passive:true });
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot, { once:true });
  } else {
    boot();
  }
})();


/* =========================================================
   APP v12.2.1 — Part 9: Feedback Forms
   - Report Errors
   - New Feature Request
   - Saves entries to localStorage
   ========================================================= */
(function DF_v1221_Part9(){
  'use strict';
  if (window.__DF_v1221_Part9__) return;
  window.__DF_v1221_Part9__ = true;

  const $ = (s,r=document)=>r.querySelector(s);
  const app = ()=>$('#app');

  function renderFeedbackError(){
    const today = new Date().toISOString().slice(0,10);
    app().innerHTML = `
      <section class="section">
        <h1>🐞 Report Errors</h1>
        <div class="field"><input id="err-subj" type="text" placeholder="Subject *"></div>
        <div class="field"><textarea id="err-desc" rows="5" placeholder="What happened? *"></textarea></div>
        <div class="field"><input id="err-by" type="text" placeholder="Submitted by"></div>
        <div class="field"><input id="err-date" type="date" value="${today}"></div>
        <button class="btn-primary" id="err-submit">Submit</button>
        <p class="muted"><a href="#/feedback">← Back</a></p>
      </section>`;
    $('#err-submit')?.addEventListener('click', ()=>{
      const subj=$('#err-subj').value.trim();
      const desc=$('#err-desc').value.trim();
      if(!subj||!desc){ alert('Please fill required fields.'); return; }
      const entry={type:'error',subj,desc,by:$('#err-by').value, date:$('#err-date').value, ts:Date.now()};
      const key='df_feedback'; const list=JSON.parse(localStorage.getItem(key)||'[]');
      list.push(entry); localStorage.setItem(key,JSON.stringify(list));
      alert('Saved!'); location.hash='#/feedback';
    });
  }

  function renderFeedbackFeature(){
    const today = new Date().toISOString().slice(0,10);
    app().innerHTML = `
      <section class="section">
        <h1>💡 New Feature Request</h1>
        <div class="field"><input id="feat-subj" type="text" placeholder="Feature title *"></div>
        <div class="field"><textarea id="feat-desc" rows="5" placeholder="Describe your idea *"></textarea></div>
        <div class="field"><input id="feat-by" type="text" placeholder="Submitted by"></div>
        <div class="field"><input id="feat-date" type="date" value="${today}"></div>
        <button class="btn-primary" id="feat-submit">Submit</button>
        <p class="muted"><a href="#/feedback">← Back</a></p>
      </section>`;
    $('#feat-submit')?.addEventListener('click', ()=>{
      const subj=$('#feat-subj').value.trim();
      const desc=$('#feat-desc').value.trim();
      if(!subj||!desc){ alert('Please fill required fields.'); return; }
      const entry={type:'feature',subj,desc,by:$('#feat-by').value, date:$('#feat-date').value, ts:Date.now()};
      const key='df_feedback'; const list=JSON.parse(localStorage.getItem(key)||'[]');
      list.push(entry); localStorage.setItem(key,JSON.stringify(list));
      alert('Saved!'); location.hash='#/feedback';
    });
  }

  // router hooks
  window.addEventListener('hashchange', ()=>{
    if (location.hash==='#/feedback/error') renderFeedbackError();
    if (location.hash==='#/feedback/feature') renderFeedbackFeature();
  });
})();

/* =========================================================
   APP v12.2.1 — Part 10: Feedback Summary Report
   - Lists all saved feedback
   - Printable table
   ========================================================= */
(function DF_v1221_Part10(){
  'use strict';
  if (window.__DF_v1221_Part10__) return;
  window.__DF_v1221_Part10__ = true;

  const $ = (s,r=document)=>r.querySelector(s);
  const app = ()=>$('#app');

  function renderFeedbackSummary(){
    const list=JSON.parse(localStorage.getItem('df_feedback')||'[]')
      .sort((a,b)=>(a.ts||0)-(b.ts||0));
    const rows=list.map((f,i)=>`
      <tr>
        <td>${i+1}</td>
        <td>${f.type}</td>
        <td>${f.date||''}</td>
        <td>${f.subj||''}</td>
        <td>${f.desc||''}</td>
        <td>${f.by||''}</td>
      </tr>`).join('');
    app().innerHTML=`
      <section class="section">
        <h1>📝 Feedback Summary</h1>
        ${list.length?`
          <table border="1" cellpadding="6">
            <thead><tr><th>#</th><th>Type</th><th>Date</th><th>Subject</th><th>Details</th><th>By</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <button id="print" class="btn-primary">Print</button>
        `:`<p class="muted">No feedback yet.</p>`}
        <p class="muted"><a href="#/reports">← Back</a></p>
      </section>`;
    $('#print')?.addEventListener('click',()=>window.print());
  }

  window.addEventListener('hashchange', ()=>{
    if (location.hash==='#/reports/feedback') renderFeedbackSummary();
  });
})();

/* =========================================================
   APP v12.2.1 — Part 11: Settings → Farms
   - CRUD for farms
   - Persists to localStorage
   ========================================================= */
(function DF_v1221_Part11(){
  'use strict';
  if (window.__DF_v1221_Part11__) return;
  window.__DF_v1221_Part11__ = true;

  const $ = (s,r=document)=>r.querySelector(s);
  const app = ()=>$('#app');
  const key='df_farms';

  function load(){ return JSON.parse(localStorage.getItem(key)||'[]'); }
  function save(list){ localStorage.setItem(key,JSON.stringify(list)); }

  function renderFarms(){
    const farms=load();
    const rows=farms.map((f,i)=>`
      <li>${f.name}
        <button data-i="${i}" data-act="del">Delete</button>
      </li>`).join('');
    app().innerHTML=`
      <section class="section">
        <h1>🏠 Farms</h1>
        <ul>${rows||'<li class="muted">No farms yet.</li>'}</ul>
        <div class="field"><input id="farmName" placeholder="Farm name"></div>
        <button id="farmAdd" class="btn-primary">Add</button>
        <p class="muted"><a href="#/settings">← Back</a></p>
      </section>`;
    $('#farmAdd')?.addEventListener('click',()=>{
      const v=$('#farmName').value.trim(); if(!v) return;
      const list=load(); list.push({id:Date.now(),name:v}); save(list); renderFarms();
    });
    app().querySelectorAll('button[data-act="del"]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const i=+btn.dataset.i; const list=load(); list.splice(i,1); save(list); renderFarms();
      });
    });
  }

  window.addEventListener('hashchange',()=>{ if(location.hash==='#/settings/farms') renderFarms(); });
})();

/* =========================================================
   APP v12.2.1 — Part 12: Settings → Fields
   - CRUD for fields
   - Persists to localStorage
   ========================================================= */
(function DF_v1221_Part12(){
  'use strict';
  if (window.__DF_v1221_Part12__) return;
  window.__DF_v1221_Part12__ = true;

  const $ = (s,r=document)=>r.querySelector(s);
  const app = ()=>$('#app');
  const key='df_fields';

  function load(){ return JSON.parse(localStorage.getItem(key)||'[]'); }
  function save(list){ localStorage.setItem(key,JSON.stringify(list)); }

  function renderFields(){
    const fields=load();
    const rows=fields.map((f,i)=>`
      <li>${f.name} (${f.acres||'?'} ac)
        <button data-i="${i}" data-act="del">Delete</button>
      </li>`).join('');
    app().innerHTML=`
      <section class="section">
        <h1>🗺️ Fields</h1>
        <ul>${rows||'<li class="muted">No fields yet.</li>'}</ul>
        <div class="field"><input id="fldName" placeholder="Field name"></div>
        <div class="field"><input id="fldAc" type="number" placeholder="Acres"></div>
        <button id="fldAdd" class="btn-primary">Add</button>
        <p class="muted"><a href="#/settings">← Back</a></p>
      </section>`;
    $('#fldAdd')?.addEventListener('click',()=>{
      const n=$('#fldName').value.trim(); if(!n) return;
      const ac=+$('#fldAc').value; const list=load();
      list.push({id:Date.now(),name:n,acres:ac}); save(list); renderFields();
    });
    app().querySelectorAll('button[data-act="del"]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const i=+btn.dataset.i; const list=load(); list.splice(i,1); save(list); renderFields();
      });
    });
  }

  window.addEventListener('hashchange',()=>{ if(location.hash==='#/settings/fields') renderFields(); });
})();

/* =========================================================
   APP v12.2.2 — Part 13: Calculators Hub
   ========================================================= */
(function DF_v1222_P13(){
  'use strict';
  if (window.__DF_V1222_P13__) return; window.__DF_V1222_P13__ = true;

  const $  = (s,r=document)=>r.querySelector(s);
  const app = ()=> $('#app');

  const SUBS = [
    { href:'#/calc/fertilizer', icon:'🧮', label:'Fertilizer' },
    { href:'#/calc/yield',      icon:'🌽', label:'Combine Yield' },
    { href:'#/calc/bin',        icon:'🏚️', label:'Bin Volume' },
    { href:'#/calc/area',       icon:'📐', label:'Area' },
    { href:'#/calc/chem',       icon:'🧪', label:'Chemical Mix' },
  ];

  function renderCalcHub(){
    app().innerHTML = `
      <section class="section">
        <h1>🧮 Calculators</h1>
        <div class="df-subtiles">
          ${SUBS.map(s=>`
            <a class="df-subtile" href="${s.href}">
              <span class="em">${s.icon}</span><span>${s.label}</span>
            </a>`).join('')}
        </div>
        <p class="muted" style="margin-top:12px;"><a href="#/home">← Back to Home</a></p>
      </section>`;
  }

  function route(){
    if (location.hash==='#/calc'){ renderCalcHub(); return true; }
    return false;
  }
  window.addEventListener('hashchange', route,{passive:true});
})();

/* =========================================================
   APP v12.2.2 — Part 14: Combine Yield Calculator
   ========================================================= */
(function DF_v1222_P14(){
  'use strict';
  if (window.__DF_V1222_P14__) return; window.__DF_V1222_P14__ = true;

  const $ = (s,r=document)=>r.querySelector(s);
  const app = ()=> $('#app');

  function renderYieldCalc(){
    app().innerHTML = `
      <section class="section">
        <h1>🌽 Combine Yield Calculator</h1>
        <div class="field"><input id="yc-weight" type="number" placeholder="Weight (lb)"></div>
        <div class="field"><input id="yc-moist" type="number" placeholder="Moisture %"></div>
        <div class="field"><input id="yc-length" type="number" placeholder="Length (ft)"></div>
        <div class="field"><input id="yc-width" type="number" placeholder="Width (ft)"></div>
        <button class="btn-primary" id="yc-go">Calculate</button>
        <div id="yc-out" class="muted" style="margin-top:10px;"></div>
        <p class="muted" style="margin-top:12px;"><a href="#/calc">← Back to Calculators</a></p>
      </section>`;
    $('#yc-go')?.addEventListener('click', ()=>{
      const w=+$('#yc-weight').value,m=+$('#yc-moist').value,l=+$('#yc-length').value,d=+$('#yc-width').value;
      if (!(w&&m&&l&&d)) return;
      const area=(l*d)/43560, bu=w/56, adj=bu*(1-((m-15.5)*0.012));
      $('#yc-out').textContent=`≈ ${ (adj/area).toFixed(1) } bu/ac (adj @15.5%)`;
    });
  }

  function route(){ if(location.hash==='#/calc/yield'){ renderYieldCalc(); return true; } return false; }
  window.addEventListener('hashchange', route,{passive:true});
})();

/* =========================================================
   APP v12.2.2 — Part 15: Bin Volume Calculator
   ========================================================= */
(function DF_v1222_P15(){
  'use strict';
  if (window.__DF_V1222_P15__) return; window.__DF_V1222_P15__ = true;

  const $ = (s,r=document)=>r.querySelector(s);
  const app = ()=> $('#app');

  function renderBinCalc(){
    app().innerHTML = `
      <section class="section">
        <h1>🏚️ Bin Volume</h1>
        <div class="field"><input id="bin-dia" type="number" placeholder="Diameter (ft)"></div>
        <div class="field"><input id="bin-h" type="number" placeholder="Grain Height (ft)"></div>
        <button class="btn-primary" id="bin-go">Calculate</button>
        <div id="bin-out" class="muted" style="margin-top:10px;"></div>
        <p class="muted" style="margin-top:12px;"><a href="#/calc">← Back to Calculators</a></p>
      </section>`;
    $('#bin-go')?.addEventListener('click', ()=>{
      const d=+$('#bin-dia').value,h=+$('#bin-h').value;
      if (!(d&&h)) return;
      const bu=(0.785*d*d*h*0.8)/1.2445; // rough estimate formula
      $('#bin-out').textContent=`≈ ${bu.toLocaleString()} bushels`;
    });
  }

  function route(){ if(location.hash==='#/calc/bin'){ renderBinCalc(); return true; } return false; }
  window.addEventListener('hashchange', route,{passive:true});
})();

/* =========================================================
   APP v12.2.2 — Part 16: Area Calculator
   ========================================================= */
(function DF_v1222_P16(){
  'use strict';
  if (window.__DF_V1222_P16__) return; window.__DF_V1222_P16__ = true;

  const $ = (s,r=document)=>r.querySelector(s);
  const app = ()=> $('#app');

  function renderAreaCalc(){
    app().innerHTML = `
      <section class="section">
        <h1>📐 Area Calculator</h1>
        <div class="field"><input id="ar-l" type="number" placeholder="Length (ft)"></div>
        <div class="field"><input id="ar-w" type="number" placeholder="Width (ft)"></div>
        <button class="btn-primary" id="ar-go">Calculate</button>
        <div id="ar-out" class="muted" style="margin-top:10px;"></div>
        <p class="muted" style="margin-top:12px;"><a href="#/calc">← Back to Calculators</a></p>
      </section>`;
    $('#ar-go')?.addEventListener('click', ()=>{
      const l=+$('#ar-l').value,w=+$('#ar-w').value;
      if (!(l&&w)) return;
      const ac=(l*w)/43560;
      $('#ar-out').textContent=`≈ ${ac.toFixed(2)} acres`;
    });
  }

  function route(){ if(location.hash==='#/calc/area'){ renderAreaCalc(); return true; } return false; }
  window.addEventListener('hashchange', route,{passive:true});
})();

/* =========================================================
   APP v12.2.2 — Part 17: Fertilizer Calculator
   ========================================================= */
(function DF_v1222_P17(){
  'use strict';
  if (window.__DF_V1222_P17__) return; window.__DF_V1222_P17__ = true;

  const $ = (s,r=document)=>r.querySelector(s);
  const app = ()=> $('#app');
  const num = v => { const n = Number(String(v||'').replace(/,/g,'')); return Number.isFinite(n)?n:0; };
  const fmt = v => { try{ return Number(v).toLocaleString(); }catch{ return String(v); } };

  function renderFertilizer(){
    app().innerHTML = `
      <section class="section">
        <h1>🧮 Fertilizer</h1>

        <div class="df-subtiles" style="grid-template-columns:repeat(2,minmax(0,1fr));">
          <div class="df-subtile" style="flex-direction:column;align-items:stretch;">
            <label class="small muted">Nutrient</label>
            <select id="f-nutrient">
              <option value="N">N</option>
              <option value="P2O5">P₂O₅</option>
              <option value="K2O">K₂O</option>
            </select>
          </div>

          <div class="df-subtile" style="flex-direction:column;align-items:stretch;">
            <label class="small muted">Target lb/acre *</label>
            <input id="f-target" type="number" inputmode="decimal" placeholder="e.g., 50">
          </div>

          <div class="df-subtile" style="flex-direction:column;align-items:stretch;">
            <label class="small muted">Product Analysis % *</label>
            <input id="f-analysis" type="number" inputmode="decimal" placeholder="e.g., 32">
          </div>

          <div class="df-subtile" style="flex-direction:column;align-items:stretch;">
            <label class="small muted">Density (lb/gal)</label>
            <select id="f-density">
              <option value="11.06">UAN 32 (11.06)</option>
              <option value="10.67">UAN 28 (10.67)</option>
              <option value="8.34">Water (8.34)</option>
              <option value="custom">Custom…</option>
            </select>
            <input id="f-density-custom" type="number" inputmode="decimal" placeholder="Enter custom" style="margin-top:6px;display:none;">
          </div>

          <div class="df-subtile" style="flex-direction:column;align-items:stretch;">
            <label class="small muted">Acres *</label>
            <input id="f-acres" type="number" inputmode="decimal" placeholder="e.g., 120">
          </div>
        </div>

        <div class="field" style="margin-top:10px;">
          <button class="btn-primary" id="f-go">Calculate</button>
          <a class="btn" href="#/calc" style="margin-left:6px;">Back</a>
        </div>

        <div id="f-out" class="muted" style="margin-top:12px;"></div>
      </section>
    `;

    const densSel = $('#f-density');
    const densCus = $('#f-density-custom');
    densSel.addEventListener('change', ()=>{
      densCus.style.display = densSel.value==='custom' ? '' : 'none';
      if (densSel.value!=='custom') densCus.value='';
    });

    $('#f-go')?.addEventListener('click', ()=>{
      const target   = num($('#f-target').value);
      const analysis = num($('#f-analysis').value);
      const acres    = num($('#f-acres').value);
      const density  = densSel.value==='custom' ? num(densCus.value) : num(densSel.value||'0');

      if (!target || !analysis || !acres || analysis<=0 || analysis>100){
        $('#f-out').textContent = 'Please enter valid Target, Analysis (1–100), and Acres.'; return;
      }
      const dens = density>0 ? density : 11.06; // default reasonable density
      const frac = analysis/100;

      const lbPerAc  = target/frac;          // product pounds per acre
      const galPerAc = lbPerAc/dens;         // product gallons per acre
      const totalLb  = lbPerAc*acres;
      const totalGal = galPerAc*acres;

      $('#f-out').innerHTML = `
        <div><strong>Product lb/acre:</strong> ${fmt(lbPerAc.toFixed(2))}</div>
        <div><strong>Product gal/acre:</strong> ${fmt(galPerAc.toFixed(2))}</div>
        <div><strong>Total lbs:</strong> ${fmt(totalLb.toFixed(0))}</div>
        <div><strong>Total gal:</strong> ${fmt(totalGal.toFixed(1))}</div>
      `;
    });
  }

  function route(){ if (location.hash==='#/calc/fertilizer'){ renderFertilizer(); return true; } return false; }
  window.addEventListener('hashchange', route, {passive:true});
})();

/* =========================================================
   APP v12.2.2 — Part 18: Chemical Mix Calculator
   ========================================================= */
(function DF_v1222_P18(){
  'use strict';
  if (window.__DF_V1222_P18__) return; window.__DF_V1222_P18__ = true;

  const $ = (s,r=document)=>r.querySelector(s);
  const app = ()=> $('#app');
  const num = v => { const n = Number(String(v||'').replace(/,/g,'')); return Number.isFinite(n)?n:0; };
  const fmt = v => { try{ return Number(v).toLocaleString(); }catch{ return String(v); } };

  const UNITS = ['oz','pt','qt','gal'];

  function row(i){
    return `
      <div class="df-subtile" style="flex-direction:column;align-items:stretch;">
        <label class="small muted">Product ${i+1}</label>
        <input id="ch-name-${i}" type="text" placeholder="Name">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:6px;">
          <input id="ch-rate-${i}" type="number" inputmode="decimal" placeholder="Rate / ac">
          <select id="ch-unit-${i}">${UNITS.map(u=>`<option value="${u}">${u}</option>`).join('')}</select>
        </div>
      </div>`;
  }

  function toGal(value, unit){
    const v = num(value);
    if (!v) return 0;
    switch(String(unit)){
      case 'gal': return v;
      case 'qt':  return v/4;
      case 'pt':  return v/8;
      case 'oz':  return v/128;
      default:    return 0;
    }
  }

  function renderChem(){
    app().innerHTML = `
      <section class="section">
        <h1>🧪 Chemical Mix</h1>

        <div class="df-subtiles" style="grid-template-columns:repeat(3,minmax(0,1fr));">
          <div class="df-subtile" style="flex-direction:column;align-items:stretch;">
            <label class="small muted">Tank Size (gal) *</label>
            <input id="ch-tank" type="number" inputmode="decimal" placeholder="e.g., 1000">
          </div>
          <div class="df-subtile" style="flex-direction:column;align-items:stretch;">
            <label class="small muted">Carrier GPA *</label>
            <input id="ch-gpa" type="number" inputmode="decimal" placeholder="e.g., 10">
          </div>
          <div class="df-subtile" style="flex-direction:column;align-items:stretch;">
            <label class="small muted">Job Acres (optional)</label>
            <input id="ch-job" type="number" inputmode="decimal" placeholder="e.g., 240">
          </div>
        </div>

        <h3 class="muted" style="margin:10px 0 6px;">Products (rate per acre)</h3>
        <div class="df-subtiles" style="grid-template-columns:repeat(2,minmax(0,1fr));">
          ${[0,1,2,3,4,5].map(row).join('')}
        </div>

        <div class="field" style="margin-top:10px;">
          <button class="btn-primary" id="ch-go">Calculate</button>
          <a class="btn" href="#/calc" style="margin-left:6px;">Back</a>
        </div>

        <div id="ch-out" class="muted" style="margin-top:12px;"></div>
      </section>
    `;

    $('#ch-go')?.addEventListener('click', ()=>{
      const tank = num($('#ch-tank').value);
      const gpa  = num($('#ch-gpa').value);
      const job  = num($('#ch-job').value);

      if (!tank || !gpa){
        $('#ch-out').textContent = 'Enter Tank Size and GPA.'; return;
      }

      const acresPerTank = tank / gpa;
      let totalProductGal = 0;

      const lines = [];
      for (let i=0;i<6;i++){
        const name = String($('#ch-name-'+i).value||'').trim() || `(Product ${i+1})`;
        const rate = num($('#ch-rate-'+i).value);
        const unit = $('#ch-unit-'+i).value;
        if (!rate) continue;

        const perAcreGal = toGal(rate, unit);
        const perTankGal = perAcreGal * acresPerTank;
        totalProductGal += perTankGal;

        lines.push(`<li>${name}: <strong>${fmt(perTankGal.toFixed(3))}</strong> gal/tank <span class="small muted">(${rate} ${unit}/ac)</span></li>`);
      }

      const tanksNeeded = job ? Math.ceil(job / acresPerTank) : null;

      $('#ch-out').innerHTML = `
        <div><strong>Acres per tank:</strong> ${fmt(acresPerTank.toFixed(2))}</div>
        <div><strong>Carrier per tank:</strong> ${fmt(tank)} gal</div>
        <ul style="margin:8px 0 0 18px;">${lines.join('') || '<li class="muted">No products entered.</li>'}</ul>
        <div style="margin-top:6px;"><strong>Total product in mix:</strong> ${fmt(totalProductGal.toFixed(3))} gal</div>
        ${tanksNeeded ? `<div><strong>Tanks needed for ${fmt(job)} ac:</strong> ${fmt(tanksNeeded)}</div>` : ''}
        <div class="small muted" style="margin-top:6px;">Always confirm label requirements and product compatibility.</div>
      `;
    });
  }

  function route(){ if (location.hash==='#/calc/chem'){ renderChem(); return true; } return false; }
  window.addEventListener('hashchange', route, {passive:true});
})();

/* APP v12 — Part 19: Reports Hub */
(function DF_v12_P19_ReportsHub(){
  'use strict';
  if (window.__DF_V12_P19__) return;
  window.__DF_V12_P19__ = true;

  // tiny helpers
  const $  = (s, r=document)=>r.querySelector(s);
  const app = ()=> $('#app');

  function ensureReportStyles(){
    if ($('#df-reports-styles')) return;
    const css = document.createElement('style');
    css.id = 'df-reports-styles';
    css.textContent = `
      .df-tiles{ display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; margin-top:8px; }
      @media (min-width:760px){ .df-tiles{ grid-template-columns:repeat(3,minmax(0,1fr)); } }
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
      .muted{ color:#666; }
    `;
    document.head.appendChild(css);
  }

  const TILES = [
    { href:'#/reports/premade', icon:'📑', label:'Pre-made Reports' },
    { href:'#/reports/feedback',icon:'🧾', label:'Feedback Summary' },
    { href:'#/reports/bag',     icon:'🛍️', label:'Grain Bag Report' },
    { href:'#/reports/ai',      icon:'🤖', label:'AI Reports' },
    { href:'#/reports/yield',   icon:'📈', label:'Yield Report' },
  ];

  function renderReportsHub(){
    ensureReportStyles();
    const root = app(); if (!root) return;
    root.innerHTML = `
      <section class="section">
        <h1>📊 Reports</h1>
        <div class="df-tiles">
          ${TILES.map(t=>`
            <a class="df-tile" href="${t.href}">
              <div class="df-emoji">${t.icon}</div>
              <div class="df-label">${t.label}</div>
            </a>`).join('')}
        </div>
        <p class="muted" style="margin-top:12px;"><a href="#/home">← Back to Home</a></p>
      </section>
    `;
  }

  function route(){
    const h = (location.hash||'').replace(/\/+$/,'');
    if (h === '#/reports'){ renderReportsHub(); return true; }
    return false;
  }

  window.addEventListener('hashchange', route, {passive:true});
  if (document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', route, {once:true}); }
  else { route(); }

  // expose if needed
  window.DF = window.DF || {};
  window.DF.renderReportsHub = renderReportsHub;
})();

/* APP v12 — Part 20: Reports → Pre-made menu */
(function DF_v12_P20_ReportsPremade(){
  'use strict';
  if (window.__DF_V12_P20__) return;
  window.__DF_V12_P20__ = true;

  const $  = (s, r=document)=>r.querySelector(s);
  const app = ()=> $('#app');

  function renderPremadeMenu(){
    const root = app(); if (!root) return;
    root.innerHTML = `
      <section class="section">
        <h1>📑 Pre-made Reports</h1>
        <div class="df-tiles" style="grid-template-columns:repeat(2,minmax(0,1fr));">
          <a class="df-tile" href="#/reports/feedback">
            <div class="df-emoji">🧾</div><div class="df-label">Feedback Summary</div>
          </a>
          <a class="df-tile" href="#/reports/bag">
            <div class="df-emoji">🛍️</div><div class="df-label">Grain Bag Report</div>
          </a>
          <a class="df-tile" href="#/reports/ai">
            <div class="df-emoji">🤖</div><div class="df-label">AI Reports</div>
          </a>
          <a class="df-tile" href="#/reports/yield">
            <div class="df-emoji">📈</div><div class="df-label">Yield Report</div>
          </a>
        </div>
        <p class="muted" style="margin-top:12px;"><a href="#/reports">← Back to Reports</a></p>
      </section>
    `;
  }

  function route(){
    const h = (location.hash||'').replace(/\/+$/,'');
    if (h === '#/reports/premade'){ renderPremadeMenu(); return true; }
    return false;
  }

  window.addEventListener('hashchange', route, {passive:true});
  if (document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', route, {once:true}); }
  else { route(); }

  window.DF = window.DF || {};
  window.DF.renderReportsPremade = renderPremadeMenu;
})();

/* APP v12 — Part 21: Reports → Feedback Summary */
(function DF_v12_P21_FeedbackSummary(){
  'use strict';
  if (window.__DF_V12_P21__) return;
  window.__DF_V12_P21__ = true;

  const $  = (s, r=document)=>r.querySelector(s);
  const app = ()=> $('#app');

  function ensureFeedbackReportStyles(){
    if ($('#df-feedback-report-css')) return;
    const css = document.createElement('style');
    css.id = 'df-feedback-report-css';
    css.textContent = `
      .report-page{ background:#fff; border:1px solid rgba(0,0,0,.1); border-radius:10px; overflow:hidden; }
      .report-head{ display:flex; align-items:center; justify-content:space-between; padding:14px 16px; border-bottom:1px solid rgba(0,0,0,.08); background:#fafafa; }
      .report-body{ padding:12px; }
      .report-table{ width:100%; border-collapse:collapse; }
      .report-table th, .report-table td{ border:1px solid rgba(0,0,0,.12); padding:8px; text-align:left; vertical-align:top; }
      .report-table th{ background:#f3f3f3; }
      .report-foot{ display:flex; align-items:center; justify-content:space-between; padding:10px 16px; border-top:1px solid rgba(0,0,0,.08); background:#fafafa; }
      .hidden-print{ margin:10px 0; }
      @media print {
        .hidden-print{ display:none !important; }
        body{ background:#fff; }
        .report-page{ border:0; }
      }
    `;
    document.head.appendChild(css);
  }

  function loadItems(){
    try {
      const raw = localStorage.getItem('df_feedback');
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr.slice().sort((a,b)=>(a.ts||0)-(b.ts||0)) : [];
    } catch { return []; }
  }

  function renderFeedbackSummary(){
    ensureFeedbackReportStyles();
    const items = loadItems();
    const today = new Date().toLocaleDateString();

    const rows = items.map((it,i)=>{
      const esc = s=>String(s||'').replace(/</g,'&lt;');
      const when = it.date || (it.ts ? new Date(it.ts).toLocaleString() : '');
      const kind = it.type==='feature' ? 'Feature' : 'Error';
      const details = esc(String(it.details||'')).replace(/\n/g,'<br>');
      return `<tr>
        <td>${i+1}</td>
        <td>${esc(when)}</td>
        <td>${kind}</td>
        <td>${esc(it.main||'')}</td>
        <td>${esc(it.sub||'')}</td>
        <td>${esc(it.category||'')}</td>
        <td>${esc(it.subject||'')}</td>
        <td>${details}</td>
        <td>${esc(it.by||'')}</td>
      </tr>`;
    }).join('');

    const root = app(); if (!root) return;
    root.innerHTML = `
      <section class="section">
        <div class="report-page">
          <header class="report-head">
            <div class="head-left" style="display:flex;align-items:center;gap:10px;">
              <img src="icons/logo.png" alt="Dowson Farms" width="36" height="36" style="border-radius:6px;">
              <div>
                <div style="font-weight:700;">Dowson Farms</div>
                <div class="muted" style="font-size:.9em;">Pre-Made Report</div>
              </div>
            </div>
            <div class="head-right" style="text-align:right;">
              <div style="font-weight:700;">Feedback Summary</div>
              <div class="muted" style="font-size:.9em;">${today}</div>
            </div>
          </header>

          <div class="report-body">
            ${items.length ? `
              <table class="report-table">
                <thead>
                  <tr>
                    <th>#</th><th>When</th><th>Type</th><th>Main</th><th>Sub</th><th>Category</th><th>Subject</th><th>Details</th><th>Submitted By</th>
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>
            ` : `<p class="muted">No feedback saved yet.</p>`}
          </div>

          <footer class="report-foot">
            <div>Reports · Feedback Summary</div>
            <div class="page-num">Page 1</div>
          </footer>
        </div>

        <div class="hidden-print">
          <button class="btn-primary" id="print-report">Print / Save PDF</button>
          <a class="btn" href="#/reports">Back to Reports</a>
        </div>
      </section>
    `;
    document.getElementById('print-report')?.addEventListener('click', ()=> window.print());
  }

  function route(){
    const h = (location.hash||'').replace(/\/+$/,'');
    if (h === '#/reports/feedback'){ renderFeedbackSummary(); return true; }
    return false;
  }

  window.addEventListener('hashchange', route, {passive:true});
  if (document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', route, {once:true}); }
  else { route(); }

  window.DF = window.DF || {};
  window.DF.renderReportsFeedback = renderFeedbackSummary;
})();

/* APP v12 — Part 22: Reports → Grain Bag Report (scaffold) */
(function DF_v12_P22_GrainBagReport(){
  'use strict';
  if (window.__DF_V12_P22__) return;
  window.__DF_V12_P22__ = true;

  const $  = (s, r=document)=>r.querySelector(s);
  const app = ()=> $('#app');

  function renderGrainBagReport(){
    const root = app(); if (!root) return;
    root.innerHTML = `
      <section class="section">
        <h1>🛍️ Grain Bag Report</h1>
        <p class="muted">Scaffold loaded. We’ll wire your real bag roll-ups next (bags, locations, fill %, est. bu & weight, notes, etc.).</p>
        <p class="muted"><a href="#/reports">← Back to Reports</a></p>
      </section>
    `;
  }

  function route(){
    const h = (location.hash||'').replace(/\/+$/,'');
    if (h === '#/reports/bag'){ renderGrainBagReport(); return true; }
    return false;
  }

  window.addEventListener('hashchange', route, {passive:true});
  if (document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', route, {once:true}); }
  else { route(); }

  window.DF = window.DF || {};
  window.DF.renderGrainBagReport = renderGrainBagReport;
})();

/* APP v12 — Part 23: Reports → AI Reports (scaffold) */
(function DF_v12_P23_AIReports(){
  'use strict';
  if (window.__DF_V12_P23__) return;
  window.__DF_V12_P23__ = true;

  const $  = (s, r=document)=>r.querySelector(s);
  const app = ()=> $('#app');

  function renderAIReports(){
    const root = app(); if (!root) return;
    root.innerHTML = `
      <section class="section">
        <h1>🤖 AI Reports</h1>
        <p class="muted">Scaffold loaded. We’ll connect the AI report runners and saved outputs here.</p>
        <p class="muted"><a href="#/reports">← Back to Reports</a></p>
      </section>
    `;
  }

  function route(){
    const h = (location.hash||'').replace(/\/+$/,'');
    if (h === '#/reports/ai'){ renderAIReports(); return true; }
    return false;
  }

  window.addEventListener('hashchange', route, {passive:true});
  if (document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', route, {once:true}); }
  else { route(); }

  window.DF = window.DF || {};
  window.DF.renderAIReports = renderAIReports;
})();

/* APP v12 — Part 24: Reports → Yield Report (scaffold) */
(function DF_v12_P24_YieldReport(){
  'use strict';
  if (window.__DF_V12_P24__) return;
  window.__DF_V12_P24__ = true;

  const $  = (s, r=document)=>r.querySelector(s);
  const app = ()=> $('#app');

  function renderYieldReport(){
    const root = app(); if (!root) return;
    root.innerHTML = `
      <section class="section">
        <h1>📈 Yield Report</h1>
        <p class="muted">Scaffold loaded. We’ll hook in the combine/elevator numbers and field/year filters next.</p>
        <p class="muted"><a href="#/reports">← Back to Reports</a></p>
      </section>
    `;
  }

  function route(){
    const h = (location.hash||'').replace(/\/+$/,'');
    if (h === '#/reports/yield'){ renderYieldReport(); return true; }
    return false;
  }

  window.addEventListener('hashchange', route, {passive:true});
  if (document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', route, {once:true}); }
  else { route(); }

  window.DF = window.DF || {};
  window.DF.renderYieldReport = renderYieldReport;
})();

/* APP v12 — Part 25: Team & Partners Hub */
(function DF_v12_P25_TeamHub(){
  'use strict';
  if (window.__DF_V12_P25__) return;
  window.__DF_V12_P25__ = true;

  // tiny helpers
  const $  = (s, r=document)=>r.querySelector(s);
  const app = ()=> $('#app');

  function ensureTeamTileStyles(){
    if ($('#df-team-tiles-css')) return;
    const css = document.createElement('style');
    css.id = 'df-team-tiles-css';
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
      .muted{ color:#666; }
    `;
    document.head.appendChild(css);
  }

  function renderTeamHub(){
    ensureTeamTileStyles();
    const root = app(); if (!root) return;
    root.innerHTML = `
      <section class="section">
        <h1>👥 Team & Partners</h1>
        <div class="df-tiles">
          <a class="df-tile" href="#/team/employees"><div class="df-emoji">👷</div><div class="df-label">Employees</div></a>
          <a class="df-tile" href="#/team/subcontractors"><div class="df-emoji">🧑‍🔧</div><div class="df-label">Subcontractors</div></a>
          <a class="df-tile" href="#/team/vendors"><div class="df-emoji">🏪</div><div class="df-label">Vendors</div></a>
          <a class="df-tile" href="#/team/dir"><div class="df-emoji">📇</div><div class="df-label">Directory</div></a>
        </div>
        <p class="muted" style="margin-top:12px;"><a href="#/home">← Back to Home</a></p>
      </section>
    `;
  }

  function route(){
    const h = (location.hash||'').replace(/\/+$/,'');
    if (h === '#/team'){ renderTeamHub(); return true; }
    return false;
  }
  window.addEventListener('hashchange', route, {passive:true});
  if (document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', route, {once:true}); }
  else { route(); }

  // expose if needed
  window.DF = window.DF || {};
  window.DF.renderTeamHub = renderTeamHub;
})();

/* APP v12 — Part 26: Team shared helpers + styles */
(function DF_v12_P26_TeamShared(){
  'use strict';
  if (window.__DF_V12_P26__) return;
  window.__DF_V12_P26__ = true;

  // localStorage helpers
  function tLoad(key, fb=[]){ try{ const v=localStorage.getItem(key); return v?JSON.parse(v):fb; }catch{ return fb; } }
  function tSave(key, val){ try{ localStorage.setItem(key, JSON.stringify(val)); }catch{} }
  function tUID(){ try{ return crypto.getRandomValues(new Uint32Array(2))[0].toString(36)+Date.now().toString(36); }catch{ return Math.random().toString(36).slice(2)+Date.now().toString(36); } }
  function onlyDigits(s){ return String(s||'').replace(/\D+/g,''); }
  function fmtPhone(v){
    const d = onlyDigits(v).slice(0,10);
    if (!d) return '';
    if (d.length<=3) return `(${d}`;
    if (d.length<=6) return `(${d.slice(0,3)}) ${d.slice(3)}`;
    return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;
  }
  function emailOk(e){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e||'').trim()); }
  function esc(s){ return String(s??'').replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

  // expose
  window.DF = window.DF || {};
  window.DF.Team = Object.assign(window.DF.Team || {}, {
    tLoad, tSave, tUID, onlyDigits, fmtPhone, emailOk, esc,
    KEYS: {
      EMP: 'df_team_employees',
      SUB: 'df_team_subs',
      VEN: 'df_team_vendors'
    }
  });

  // styles for forms/tables
  if (!document.getElementById('df-team-shared-css')){
    const css = document.createElement('style');
    css.id = 'df-team-shared-css';
    css.textContent = `
      .grid-2{ display:grid; grid-template-columns:1fr 1fr; gap:8px; }
      .grid-3{ display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; }
      @media (max-width:560px){ .grid-2,.grid-3{ grid-template-columns:1fr; } }

      input, textarea, select{ width:100%; padding:10px 12px; border-radius:10px; border:1px solid rgba(0,0,0,.12); background:#fff; }
      .btn{ background:#fff; border:1px solid rgba(0,0,0,.12); border-radius:10px; padding:6px 10px; }
      .btn.small{ padding:4px 8px; font-size:.9em; }
      .btn-primary{ background:#0f4d1d; color:#fff; border:0; border-radius:10px; padding:8px 12px; }

      table.report-table{ width:100%; border-collapse:collapse; margin-top:8px; }
      .report-table th, .report-table td{ border:1px solid rgba(0,0,0,.12); padding:8px; text-align:left; vertical-align:top; }
      .report-table th{ background:#f3f3f3; }
      .muted{ color:#666; }
    `;
    document.head.appendChild(css);
  }
})();

/* APP v12 — Part 27: Team → Employees */
(function DF_v12_P27_TeamEmployees(){
  'use strict';
  if (window.__DF_V12_P27__) return;
  window.__DF_V12_P27__ = true;

  const $  = (s, r=document)=>r.querySelector(s);
  const app = ()=> $('#app');
  const T   = (window.DF && window.DF.Team) || {};

  function renderEmployees(){
    const list = T.tLoad(T.KEYS.EMP, []);
    const rows = list.map(p=>`
      <tr data-id="${p.id}">
        <td>${T.esc(p.name)}</td>
        <td>${T.esc(p.role||'')}</td>
        <td>${T.esc(T.fmtPhone(p.phone||''))}</td>
        <td>${T.esc(p.email||'')}</td>
        <td>${T.esc(p.notes||'')}</td>
        <td><button class="btn small" data-edit>Edit</button> <button class="btn small" data-del>Delete</button></td>
      </tr>
    `).join('');

    const root = app(); if (!root) return;
    root.innerHTML = `
      <section class="section">
        <h1>👷 Employees</h1>

        <div class="grid-2">
          <input id="e-name" type="text" placeholder="Full name *">
          <input id="e-role" type="text" placeholder="Role / Title">
        </div>
        <div class="grid-2">
          <input id="e-phone" type="tel" placeholder="Phone (digits only)">
          <input id="e-email" type="email" placeholder="Email">
        </div>
        <div class="field">
          <textarea id="e-notes" rows="2" placeholder="Notes (optional)"></textarea>
        </div>
        <div class="field">
          <button id="e-save" class="btn-primary">Save</button>
          <button id="e-clear" class="btn">Clear</button>
          <a class="btn" href="#/team">Back to Team & Partners</a>
        </div>

        <h2 style="margin-top:12px;">Team</h2>
        ${rows ? `
          <table class="report-table">
            <thead><tr><th>Name</th><th>Role</th><th>Phone</th><th>Email</th><th>Notes</th><th></th></tr></thead>
            <tbody id="e-tbody">${rows}</tbody>
          </table>
        ` : `<p class="muted">No employees yet.</p>`}
      </section>
    `;

    let editId = null;

    function readForm(){
      const name  = $('#e-name').value.trim();
      const role  = $('#e-role').value.trim();
      const phone = T.onlyDigits($('#e-phone').value);
      const email = $('#e-email').value.trim();
      const notes = $('#e-notes').value.trim();
      if (!name){ alert('Name is required.'); return null; }
      if (email && !T.emailOk(email)){ alert('Email looks invalid.'); return null; }
      return { id: editId || T.tUID(), name, role, phone, email, notes };
    }
    function loadForm(p){
      editId = p?.id || null;
      $('#e-name').value  = p?.name || '';
      $('#e-role').value  = p?.role || '';
      $('#e-phone').value = T.fmtPhone(p?.phone||'');
      $('#e-email').value = p?.email || '';
      $('#e-notes').value = p?.notes || '';
    }
    function clearForm(){ loadForm({}); }

    $('#e-save').addEventListener('click', ()=>{
      const rec = readForm(); if (!rec) return;
      const arr = T.tLoad(T.KEYS.EMP, []);
      const i = arr.findIndex(x=>x.id===rec.id);
      if (i>=0) arr[i]=rec; else arr.unshift(rec);
      T.tSave(T.KEYS.EMP, arr);
      alert('Saved.');
      renderEmployees();
    });
    $('#e-clear').addEventListener('click', clearForm);

    $('#e-tbody')?.addEventListener('click', (e)=>{
      const tr = e.target.closest('tr'); if (!tr) return;
      const id = tr.getAttribute('data-id');
      if (e.target.matches('[data-edit]')){
        const p = T.tLoad(T.KEYS.EMP, []).find(x=>x.id===id);
        if (p) loadForm(p);
      } else if (e.target.matches('[data-del]')){
        if (!confirm('Delete this employee?')) return;
        const arr = T.tLoad(T.KEYS.EMP, []).filter(x=>x.id!==id);
        T.tSave(T.KEYS.EMP, arr);
        renderEmployees();
      }
    });
  }

  function route(){
    const h = (location.hash||'').replace(/\/+$/,'');
    if (h === '#/team/employees'){ renderEmployees(); return true; }
    return false;
  }
  window.addEventListener('hashchange', route, {passive:true});
  if (document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', route, {once:true}); }
  else { route(); }

  window.DF = window.DF || {};
  window.DF.renderTeamEmployees = renderEmployees;
})();

/* APP v12 — Part 28: Team → Subcontractors & Vendors */
(function DF_v12_P28_TeamSubsVendors(){
  'use strict';
  if (window.__DF_V12_P28__) return;
  window.__DF_V12_P28__ = true;

  const $  = (s, r=document)=>r.querySelector(s);
  const app = ()=> $('#app');
  const T   = (window.DF && window.DF.Team) || {};

  // ---------- Subcontractors ----------
  function renderSubs(){
    const list = T.tLoad(T.KEYS.SUB, []);
    const rows = list.map(p=>`
      <tr data-id="${p.id}">
        <td>${T.esc(p.company)}</td>
        <td>${T.esc(p.contact||'')}</td>
        <td>${T.esc(T.fmtPhone(p.phone||''))}</td>
        <td>${T.esc(p.email||'')}</td>
        <td>${T.esc(p.services||'')}</td>
        <td><button class="btn small" data-edit>Edit</button> <button class="btn small" data-del>Delete</button></td>
      </tr>
    `).join('');

    const root = app(); if (!root) return;
    root.innerHTML = `
      <section class="section">
        <h1>🧑‍🔧 Subcontractors</h1>

        <div class="grid-2">
          <input id="s-company" type="text" placeholder="Company *">
          <input id="s-contact" type="text" placeholder="Primary contact">
        </div>
        <div class="grid-2">
          <input id="s-phone" type="tel" placeholder="Phone">
          <input id="s-email" type="email" placeholder="Email">
        </div>
        <div class="field">
          <input id="s-services" type="text" placeholder="Services (e.g., tiling, trucking)">
        </div>
        <div class="field">
          <button id="s-save" class="btn-primary">Save</button>
          <button id="s-clear" class="btn">Clear</button>
          <a class="btn" href="#/team">Back to Team & Partners</a>
        </div>

        <h2 style="margin-top:12px;">List</h2>
        ${rows ? `
          <table class="report-table">
            <thead><tr><th>Company</th><th>Contact</th><th>Phone</th><th>Email</th><th>Services</th><th></th></tr></thead>
            <tbody id="s-tbody">${rows}</tbody>
          </table>
        ` : `<p class="muted">No subcontractors yet.</p>`}
      </section>
    `;

    let editId = null;

    function readForm(){
      const company = $('#s-company').value.trim();
      const contact = $('#s-contact').value.trim();
      const phone   = T.onlyDigits($('#s-phone').value);
      const email   = $('#s-email').value.trim();
      const services= $('#s-services').value.trim();
      if (!company){ alert('Company is required.'); return null; }
      if (email && !T.emailOk(email)){ alert('Email looks invalid.'); return null; }
      return { id: editId || T.tUID(), company, contact, phone, email, services };
    }
    function loadForm(p){
      editId = p?.id || null;
      $('#s-company').value = p?.company||'';
      $('#s-contact').value = p?.contact||'';
      $('#s-phone').value   = T.fmtPhone(p?.phone||'');
      $('#s-email').value   = p?.email||'';
      $('#s-services').value= p?.services||'';
    }
    function clearForm(){ loadForm({}); }

    $('#s-save').addEventListener('click', ()=>{
      const rec = readForm(); if (!rec) return;
      const arr = T.tLoad(T.KEYS.SUB, []);
      const i = arr.findIndex(x=>x.id===rec.id);
      if (i>=0) arr[i]=rec; else arr.unshift(rec);
      T.tSave(T.KEYS.SUB, arr);
      alert('Saved.');
      renderSubs();
    });
    $('#s-clear').addEventListener('click', clearForm);

    $('#s-tbody')?.addEventListener('click', (e)=>{
      const tr = e.target.closest('tr'); if (!tr) return;
      const id = tr.getAttribute('data-id');
      if (e.target.matches('[data-edit]')){
        const p = T.tLoad(T.KEYS.SUB, []).find(x=>x.id===id);
        if (p) loadForm(p);
      } else if (e.target.matches('[data-del]')){
        if (!confirm('Delete this subcontractor?')) return;
        const arr = T.tLoad(T.KEYS.SUB, []).filter(x=>x.id!==id);
        T.tSave(T.KEYS.SUB, arr);
        renderSubs();
      }
    });
  }

  // ---------- Vendors ----------
  function renderVendors(){
    const list = T.tLoad(T.KEYS.VEN, []);
    const rows = list.map(v=>`
      <tr data-id="${v.id}">
        <td>${T.esc(v.company)}</td>
        <td>${T.esc(v.account||'')}</td>
        <td>${T.esc(T.fmtPhone(v.phone||''))}</td>
        <td>${T.esc(v.email||'')}</td>
        <td>${T.esc(v.notes||'')}</td>
        <td><button class="btn small" data-edit>Edit</button> <button class="btn small" data-del>Delete</button></td>
      </tr>
    `).join('');

    const root = app(); if (!root) return;
    root.innerHTML = `
      <section class="section">
        <h1>🏪 Vendors</h1>

        <div class="grid-2">
          <input id="v-company" type="text" placeholder="Company *">
          <input id="v-account" type="text" placeholder="Account #">
        </div>
        <div class="grid-2">
          <input id="v-phone" type="tel" placeholder="Phone">
          <input id="v-email" type="email" placeholder="Email">
        </div>
        <div class="field">
          <textarea id="v-notes" rows="2" placeholder="Notes (optional)"></textarea>
        </div>
        <div class="field">
          <button id="v-save" class="btn-primary">Save</button>
          <button id="v-clear" class="btn">Clear</button>
          <a class="btn" href="#/team">Back to Team & Partners</a>
        </div>

        <h2 style="margin-top:12px;">List</h2>
        ${rows ? `
          <table class="report-table">
            <thead><tr><th>Company</th><th>Account #</th><th>Phone</th><th>Email</th><th>Notes</th><th></th></tr></thead>
            <tbody id="v-tbody">${rows}</tbody>
          </table>
        ` : `<p class="muted">No vendors yet.</p>`}
      </section>
    `;

    let editId = null;

    function readForm(){
      const company = $('#v-company').value.trim();
      const account = $('#v-account').value.trim();
      const phone   = T.onlyDigits($('#v-phone').value);
      const email   = $('#v-email').value.trim();
      const notes   = $('#v-notes').value.trim();
      if (!company){ alert('Company is required.'); return null; }
      if (email && !T.emailOk(email)){ alert('Email looks invalid.'); return null; }
      return { id: editId || T.tUID(), company, account, phone, email, notes };
    }
    function loadForm(p){
      editId = p?.id || null;
      $('#v-company').value = p?.company||'';
      $('#v-account').value = p?.account||'';
      $('#v-phone').value   = T.fmtPhone(p?.phone||'');
      $('#v-email').value   = p?.email||'';
      $('#v-notes').value   = p?.notes||'';
    }
    function clearForm(){ loadForm({}); }

    $('#v-save').addEventListener('click', ()=>{
      const rec = readForm(); if (!rec) return;
      const arr = T.tLoad(T.KEYS.VEN, []);
      const i = arr.findIndex(x=>x.id===rec.id);
      if (i>=0) arr[i]=rec; else arr.unshift(rec);
      T.tSave(T.KEYS.VEN, arr);
      alert('Saved.');
      renderVendors();
    });
    $('#v-clear').addEventListener('click', clearForm);

    $('#v-tbody')?.addEventListener('click', (e)=>{
      const tr = e.target.closest('tr'); if (!tr) return;
      const id = tr.getAttribute('data-id');
      if (e.target.matches('[data-edit]')){
        const v = T.tLoad(T.KEYS.VEN, []).find(x=>x.id===id);
        if (v) loadForm(v);
      } else if (e.target.matches('[data-del]')){
        if (!confirm('Delete this vendor?')) return;
        const arr = T.tLoad(T.KEYS.VEN, []).filter(x=>x.id!==id);
        T.tSave(T.KEYS.VEN, arr);
        renderVendors();
      }
    });
  }

  function route(){
    const h = (location.hash||'').replace(/\/+$/,'');
    if (h === '#/team/subcontractors'){ renderSubs(); return true; }
    if (h === '#/team/vendors'){ renderVendors(); return true; }
    return false;
  }
  window.addEventListener('hashchange', route, {passive:true});
  if (document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', route, {once:true}); }
  else { route(); }

  // expose (optional)
  window.DF = window.DF || {};
  window.DF.renderTeamSubcontractors = renderSubs;
  window.DF.renderTeamVendors = renderVendors;
})();

/* APP v12 — Part 29: Team → Directory (roll-up) */
(function DF_v12_P29_TeamDirectory(){
  'use strict';
  if (window.__DF_V12_P29__) return;
  window.__DF_V12_P29__ = true;

  const $  = (s, r=document)=>r.querySelector(s);
  const app = ()=> $('#app');
  const T   = (window.DF && window.DF.Team) || {};

  function renderDirectory(){
    const emps = T.tLoad(T.KEYS.EMP, []).map(x=>({ type:'Employee', name:x.name, org:x.role||'', phone:x.phone, email:x.email }));
    const subs = T.tLoad(T.KEYS.SUB, []).map(x=>({ type:'Sub',      name:x.company, org:x.contact||'', phone:x.phone, email:x.email }));
    const vens = T.tLoad(T.KEYS.VEN, []).map(x=>({ type:'Vendor',   name:x.company, org:x.account||'', phone:x.phone, email:x.email }));
    const all = [...emps, ...subs, ...vens].sort((a,b)=>String(a.name||'').localeCompare(String(b.name||'')));

    const rows = all.map((r,i)=>`
      <tr>
        <td>${i+1}</td>
        <td>${T.esc(r.type)}</td>
        <td>${T.esc(r.name)}</td>
        <td>${T.esc(r.org||'')}</td>
        <td>${T.esc(T.fmtPhone(r.phone||''))}</td>
        <td>${T.esc(r.email||'')}</td>
      </tr>
    `).join('');

    const root = app(); if (!root) return;
    root.innerHTML = `
      <section class="section">
        <h1>📇 Directory</h1>
        ${all.length ? `
          <table class="report-table">
            <thead><tr><th>#</th><th>Type</th><th>Name</th><th>Role/Acct</th><th>Phone</th><th>Email</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        ` : `<p class="muted">No contacts yet. Add employees, subcontractors, or vendors to populate this directory.</p>`}
        <p class="muted" style="margin-top:12px;"><a href="#/team">← Back to Team & Partners</a></p>
      </section>
    `;
  }

  function route(){
    const h = (location.hash||'').replace(/\/+$/,'');
    if (h === '#/team/dir'){ renderDirectory(); return true; }
    return false;
  }
  window.addEventListener('hashchange', route, {passive:true});
  if (document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', route, {once:true}); }
  else { route(); }

  window.DF = window.DF || {};
  window.DF.renderTeamDirectory = renderDirectory;
})();

/* ======================== App v12 — Part 30: Settings → Farms ======================== */
(function DF_Part30_SettingsFarms(){
  'use strict';
  if (window.__DF_P30__) return; window.__DF_P30__ = true;

  const $ = (s, r=document)=>r.querySelector(s);
  const app = ()=> $('#app');
  const KEY = 'df_farms';

  const load = ()=> { try{ return JSON.parse(localStorage.getItem(KEY)||'[]'); }catch{ return []; } };
  const save = (a)=>{ try{ localStorage.setItem(KEY, JSON.stringify(a)); }catch{} };
  const id   = ()=> (crypto?.getRandomValues ? crypto.getRandomValues(new Uint32Array(2))[0].toString(36) : Math.random().toString(36).slice(2)) + Date.now().toString(36);

  function ensureCSS(){
    if ($('#df-p30-css')) return;
    const css = document.createElement('style');
    css.id = 'df-p30-css';
    css.textContent = `
      .df-list{list-style:none;padding:0;margin:10px 0}
      .df-row{display:flex;justify-content:space-between;align-items:center;border:1px solid rgba(0,0,0,.12);border-radius:10px;background:#fff;padding:10px;margin:8px 0}
      .df-actions .btn{margin-left:6px}
      .chip-arch{background:#eee;border-radius:999px;padding:2px 8px;margin-left:8px}
      .grid2{display:grid;grid-template-columns:1fr auto;gap:8px}
    `;
    document.head.appendChild(css);
  }

  function render(){
    ensureCSS();
    const root = app(); if (!root) return;
    let farms = load().sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),undefined,{sensitivity:'base'}));
    const rows = farms.map((f,i)=>`
      <li class="df-row" data-i="${i}">
        <div><strong>${f.name||'(unnamed farm)'}</strong>${f.archived?` <span class="chip-arch">Archived</span>`:''}</div>
        <div class="df-actions">
          ${f.archived?`
            <button class="btn" data-act="unarchive">Unarchive</button>
            <button class="btn" data-act="delete">Delete</button>
          `:`
            <button class="btn" data-act="rename">Rename</button>
            <button class="btn" data-act="archive">Archive</button>
            <button class="btn" data-act="delete">Delete</button>
          `}
        </div>
      </li>`).join('');

    root.innerHTML = `
      <section class="section">
        <h1>🏠 Farms</h1>
        <p class="muted">Manage farm names. You cannot delete a farm if fields are still assigned.</p>
        <ul class="df-list">${rows || '<li class="muted">No farms yet.</li>'}</ul>
        <div class="grid2">
          <input id="farm-name" type="text" placeholder="New farm name">
          <button id="farm-add" class="btn-primary">➕ Add</button>
        </div>
        <p style="margin-top:10px;"><a class="btn" href="#/settings">Back to Settings</a></p>
      </section>
    `;

    $('#farm-add')?.addEventListener('click', ()=>{
      const name = String($('#farm-name')?.value||'').trim();
      if (!name) return;
      farms = load();
      if (farms.some(f=>String(f.name).toLowerCase()===name.toLowerCase())){ alert('That farm already exists.'); return; }
      farms.push({id:id(), name, archived:false});
      save(farms); render();
    });

    root.querySelector('.df-list')?.addEventListener('click', (e)=>{
      const btn = e.target.closest('button[data-act]'); if (!btn) return;
      const row = btn.closest('[data-i]'); const i = Number(row?.dataset.i);
      farms = load(); const f = farms[i]; if (!f) return;
      const act = btn.dataset.act;

      if (act==='rename'){
        const nn = prompt('Rename farm:', f.name||''); if (!nn) return;
        if (farms.some((x,ix)=>ix!==i && String(x.name).toLowerCase()===nn.toLowerCase())){ alert('Another farm uses that name.'); return; }
        f.name = nn.trim();
      } else if (act==='archive'){ f.archived = true; }
      else if (act==='unarchive'){ f.archived = false; }
      else if (act==='delete'){
        // guard: prevent deletion if fields exist pointing here
        const fields = (function(){ try{return JSON.parse(localStorage.getItem('df_fields2')||'[]');}catch{return[];} })();
        if (fields.some(fl=>fl.farmId===f.id)){ alert('This farm has fields assigned. Archive instead, or move/delete fields first.'); return; }
        if (!confirm(`Delete “${f.name}”? This cannot be undone.`)) return;
        farms.splice(i,1);
      }
      save(farms); render();
    });
  }

  // route hook
  function route(){
    const h = (location.hash||'').replace(/\/+$/,'');
    if (h==='#/settings/farms'){ render(); return true; }
    return false;
  }
  window.addEventListener('hashchange', route, {passive:true});
  if (document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', route, {once:true}); } else { route(); }
})();

/* ======================== App v12 — Part 31: Settings → Fields ======================== */
(function DF_Part31_SettingsFields(){
  'use strict';
  if (window.__DF_P31__) return; window.__DF_P31__ = true;

  const $ = (s,r=document)=>r.querySelector(s);
  const app = ()=> $('#app');
  const FARMS_KEY='df_farms', FIELDS_KEY='df_fields2';
  const load = (k,fb=[])=>{ try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(fb));}catch{return fb;} };
  const save = (k,v)=>{ try{ localStorage.setItem(k, JSON.stringify(v)); }catch{} };
  const id = ()=> (crypto?.getRandomValues ? crypto.getRandomValues(new Uint32Array(2))[0].toString(36) : Math.random().toString(36).slice(2)) + Date.now().toString(36);

  function ensureCSS(){
    if ($('#df-p31-css')) return;
    const css=document.createElement('style');
    css.id='df-p31-css';
    css.textContent=`
      .df-list{list-style:none;padding:0;margin:10px 0}
      .df-row{border:1px solid rgba(0,0,0,.12);border-radius:10px;background:#fff;padding:10px;margin:8px 0}
      .df-row .top{display:flex;justify-content:space-between;align-items:center}
      .df-row .line{margin-top:6px;color:#666}
      .df-actions .btn{margin-left:6px}
      .grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}
      .grid2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
    `;
    document.head.appendChild(css);
  }

  function farmName(id){ const f=load(FARMS_KEY,[]).find(x=>x.id===id); return f?.name || '(Unknown)'; }
  function num(v){ const n=Number(String(v).replace(/,/g,'')); return Number.isFinite(n)?n:0; }

  function render(){
    ensureCSS();
    const root=app(); if (!root) return;
    const farms = load(FARMS_KEY,[]).sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),undefined,{sensitivity:'base'}));
    let fields = load(FIELDS_KEY,[]);
    // sort by farm name then field name
    fields.sort((a,b)=> (farmName(a.farmId)).localeCompare(farmName(b.farmId),undefined,{sensitivity:'base'}) ||
                        String(a.name||'').localeCompare(String(b.name||''),undefined,{sensitivity:'base'}));
    const items = fields.map((fl,i)=>{
      const badges = [];
      if (fl.crp?.yes) badges.push(`CRP ${fl.crp.acres||0} ac`);
      if (fl.hel?.yes) badges.push(`HEL ${fl.hel.acres||0} ac`);
      return `
        <li class="df-row" data-i="${i}">
          <div class="top">
            <div><strong>${fl.name||'(unnamed field)'}</strong> ${fl.archived?'<span class="chip-arch">Archived</span>':''}</div>
            <div class="df-actions">
              ${fl.archived?`
                <button class="btn" data-act="unarchive">Unarchive</button>
                <button class="btn" data-act="delete">Delete</button>
              `:`
                <button class="btn" data-act="rename">Rename</button>
                <button class="btn" data-act="archive">Archive</button>
                <button class="btn" data-act="delete">Delete</button>
              `}
            </div>
          </div>
          <div class="line">${farmName(fl.farmId)} • Tillable: ${fl.tillable||0} ac ${badges.length?'• '+badges.join(' • '):''}</div>
        </li>`;
    }).join('');

    const farmOpts = farms.map(f=>`<option value="${f.id}">${f.name}</option>`).join('');

    root.innerHTML = `
      <section class="section">
        <h1>🗺️ Fields</h1>
        <p class="muted">Each field belongs to a farm. Enter tillable acres, optional CRP and HEL.</p>
        <ul class="df-list">${items || '<li class="muted">No fields yet.</li>'}</ul>

        <h3 style="margin-top:12px;">Add Field</h3>
        <div class="grid2">
          <label><span class="small muted">Farm *</span><select id="fld-farm">${farmOpts}</select></label>
          <label><span class="small muted">Field Name *</span><input id="fld-name" type="text" placeholder="e.g., North 80"></label>
        </div>
        <div class="grid3">
          <label><span class="small muted">Tillable Acres *</span><input id="fld-till" type="number" step="any" min="0.01"></label>
          <label><span class="small muted">CRP?</span><select id="fld-crp-yes"><option value="no" selected>No</option><option value="yes">Yes</option></select></label>
          <label><span class="small muted">CRP Acres</span><input id="fld-crp-ac" type="number" step="any" min="0" disabled></label>
        </div>
        <div class="grid2">
          <label><span class="small muted">HEL?</span><select id="fld-hel-yes"><option value="no" selected>No</option><option value="yes">Yes</option></select></label>
          <label><span class="small muted">HEL Acres</span><input id="fld-hel-ac" type="number" step="any" min="0" disabled></label>
        </div>
        <button id="fld-add" class="btn-primary">➕ Add Field</button>
        <p style="margin-top:10px;"><a class="btn" href="#/settings">Back to Settings</a></p>
      </section>
    `;

    const crpSel=$('#fld-crp-yes'), crpAc=$('#fld-crp-ac');
    const helSel=$('#fld-hel-yes'), helAc=$('#fld-hel-ac');
    crpSel?.addEventListener('change', ()=>{ crpAc.disabled = crpSel.value!=='yes'; if (crpAc.disabled) crpAc.value=''; });
    helSel?.addEventListener('change', ()=>{ helAc.disabled = helSel.value!=='yes'; if (helAc.disabled) helAc.value=''; });

    $('#fld-add')?.addEventListener('click', ()=>{
      const farmId = $('#fld-farm').value;
      const name = String($('#fld-name')?.value||'').trim();
      const till = num($('#fld-till').value);
      const crpYes = $('#fld-crp-yes').value==='yes';
      const crpA = num($('#fld-crp-ac').value);
      const helYes = $('#fld-hel-yes').value==='yes';
      const helA = num($('#fld-hel-ac').value);

      if (!farmId || !name || !(till>0)){ alert('Farm, Field Name, and Tillable Acres are required.'); return; }
      if (crpYes && !(crpA>0)){ alert('Enter CRP acres (or set CRP to No).'); return; }
      if (helYes && !(helA>0)){ alert('Enter HEL acres (or set HEL to No).'); return; }
      if (crpYes && crpA>till){ alert('CRP acres cannot exceed Tillable.'); return; }
      if (helYes && helA>till){ alert('HEL acres cannot exceed Tillable.'); return; }

      fields = load(FIELDS_KEY,[]);
      if (fields.some(f=>f.farmId===farmId && String(f.name).toLowerCase()===name.toLowerCase())){
        alert('A field with that name already exists in this farm.'); return;
      }

      fields.push({
        id:id(), farmId, name, tillable:till,
        crp:{yes:crpYes, acres:crpYes?crpA:0},
        hel:{yes:helYes, acres:helYes?helA:0},
        archived:false
      });
      save(FIELDS_KEY, fields);
      render();
    });

    root.querySelector('.df-list')?.addEventListener('click',(e)=>{
      const btn = e.target.closest('button[data-act]'); if (!btn) return;
      const i = Number(btn.closest('[data-i]')?.dataset.i);
      fields = load(FIELDS_KEY,[]); const fl = fields[i]; if (!fl) return;
      const act = btn.dataset.act;

      if (act==='rename'){
        const nf = prompt('Rename field:', fl.name||''); if (!nf) return;
        if (fields.some((f,ix)=>ix!==i && f.farmId===fl.farmId && String(f.name).toLowerCase()===nf.toLowerCase())){
          alert('Another field in this farm already uses that name.'); return;
        }
        fl.name = nf.trim();
      } else if (act==='archive'){ fl.archived = true; }
      else if (act==='unarchive'){ fl.archived = false; }
      else if (act==='delete'){
        if (!confirm(`Delete “${fl.name}”? This cannot be undone.`)) return;
        fields.splice(i,1);
      }
      save(FIELDS_KEY, fields); render();
    });
  }

  function route(){
    const h=(location.hash||'').replace(/\/+$/,'');
    if (h==='#/settings/fields'){ render(); return true; }
    return false;
  }
  window.addEventListener('hashchange', route, {passive:true});
  if (document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', route, {once:true}); } else { route(); }
})();

/* ======================== App v12 — Part 32: Feedback Forms ======================== */
(function DF_Part32_FeedbackForms(){
  'use strict';
  if (window.__DF_P32__) return; window.__DF_P32__ = true;

  const $ = (s,r=document)=>r.querySelector(s);
  const app = ()=> $('#app');
  const KEY='df_feedback';

  const MAIN_TO_SUB = {
    'Crop Production': ['Planting','Spraying','Aerial Spray','Harvest','Field Maintenance','Scouting','Trials'],
    'Calculators': ['Fertilizer','Bin Volume','Area','Combine Yield','Chemical Mix'],
    'Equipment': ['Technology','Tractors','Combines','Sprayer/Fert','Construction','Trucks','Trailers','Implements'],
    'Grain Tracking': ['Grain Bag','Bins','Contracts','Ticket OCR'],
    'Team & Partners': ['Employees','Subcontractors','Vendors','Directory'],
    'Reports': ['Pre-made','Feedback Summary','Grain Bag','AI Reports','Yield Report'],
    'Settings': ['Crop Type','Theme','Farms','Fields','Users'],
    'Feedback': ['Report Errors','New Feature Request']
  };
  const CATS = ['Bug / Error','New Feature','UI / Design'];

  function fillSelect(sel, arr, ph){
    sel.innerHTML = `<option value="">${ph}</option>` + arr.map(v=>`<option>${v}</option>`).join('');
  }
  function wireCascade(){
    const main = $('#fb-main'), sub = $('#fb-sub');
    if (!main || !sub) return;
    const update = ()=>{
      const list = MAIN_TO_SUB[main.value] || [];
      fillSelect(sub, list, 'Sub…');
    };
    main.addEventListener('change', update); update();
  }

  function saveItem(obj){
    try{ const list = JSON.parse(localStorage.getItem(KEY)||'[]'); list.push(obj); localStorage.setItem(KEY, JSON.stringify(list)); }catch{}
  }

  function renderError(){
    const today = new Date().toISOString().slice(0,10);
    app().innerHTML = `
      <section class="section">
        <h1>🐞 Report Errors</h1>
        <div class="field" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
          <label><span class="small muted">Main *</span><select id="fb-main"></select></label>
          <label><span class="small muted">Sub *</span><select id="fb-sub"></select></label>
          <label><span class="small muted">Category *</span><select id="fb-cat"></select></label>
        </div>
        <div class="field"><input id="err-subj" type="text" placeholder="Subject *"></div>
        <div class="field"><textarea id="err-desc" rows="5" placeholder="What happened? *"></textarea></div>
        <div class="field"><label class="choice"><input id="err-date" type="date" value="${today}"> <span class="small muted">Date</span></label></div>
        <div class="field"><input id="err-by" type="text" placeholder="Submitted by (optional)" value=""></div>
        <button id="err-save" class="btn-primary">Submit</button> <a class="btn" href="#/feedback">Back</a>
      </section>`;
    fillSelect($('#fb-main'), Object.keys(MAIN_TO_SUB), 'Main…');
    fillSelect($('#fb-cat'), CATS, 'Category…');
    wireCascade();
    $('#err-save')?.addEventListener('click', ()=>{
      const main=$('#fb-main').value.trim(), sub=$('#fb-sub').value.trim(), cat=$('#fb-cat').value.trim();
      const subject=$('#err-subj').value.trim(), details=$('#err-desc').value.trim();
      const date=$('#err-date').value.trim(), by=$('#err-by').value.trim();
      if(!main||!sub||!cat||!subject||!details){ alert('Please fill all required fields.'); return; }
      saveItem({type:'error', date, subject, details, by, main, sub, category:cat, ts:Date.now()});
      alert('Thanks! Your error report was saved.');
      location.hash = '#/feedback';
    });
  }

  function renderFeature(){
    const today = new Date().toISOString().slice(0,10);
    app().innerHTML = `
      <section class="section">
        <h1>💡 New Feature Request</h1>
        <div class="field" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
          <label><span class="small muted">Main *</span><select id="fb-main"></select></label>
          <label><span class="small muted">Sub *</span><select id="fb-sub"></select></label>
          <label><span class="small muted">Category *</span><select id="fb-cat"></select></label>
        </div>
        <div class="field"><input id="feat-subj" type="text" placeholder="Feature title *"></div>
        <div class="field"><textarea id="feat-desc" rows="5" placeholder="Describe the idea *"></textarea></div>
        <div class="field"><label class="choice"><input id="feat-date" type="date" value="${today}"> <span class="small muted">Date</span></label></div>
        <div class="field"><input id="feat-by" type="text" placeholder="Submitted by (optional)" value=""></div>
        <button id="feat-save" class="btn-primary">Submit</button> <a class="btn" href="#/feedback">Back</a>
      </section>`;
    fillSelect($('#fb-main'), Object.keys(MAIN_TO_SUB), 'Main…');
    fillSelect($('#fb-cat'), CATS, 'Category…');
    wireCascade();
    $('#feat-save')?.addEventListener('click', ()=>{
      const main=$('#fb-main').value.trim(), sub=$('#fb-sub').value.trim(), cat=$('#fb-cat').value.trim();
      const subject=$('#feat-subj').value.trim(), details=$('#feat-desc').value.trim();
      const date=$('#feat-date').value.trim(), by=$('#feat-by').value.trim();
      if(!main||!sub||!cat||!subject||!details){ alert('Please fill all required fields.'); return; }
      saveItem({type:'feature', date, subject, details, by, main, sub, category:cat, ts:Date.now()});
      alert('Thanks! Your feature request was saved.');
      location.hash = '#/feedback';
    });
  }

  function route(){
    const h=(location.hash||'').replace(/\/+$/,'');
    if (h==='#/feedback/error'){ renderError(); return true; }
    if (h==='#/feedback/feature'){ renderFeature(); return true; }
    return false;
  }
  window.addEventListener('hashchange', route, {passive:true});
  if (document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', route, {once:true}); } else { route(); }
})();

/* ====================== App v12 — Part 33: Reports → Feedback Summary ====================== */
(function DF_Part33_ReportFeedback(){
  'use strict';
  if (window.__DF_P33__) return; window.__DF_P33__ = true;

  const $=(s,r=document)=>r.querySelector(s);
  const app=()=>$('#app');
  const KEY='df_feedback';

  function ensureCSS(){
    if ($('#df-p33-css')) return;
    const css=document.createElement('style');
    css.id='df-p33-css';
    css.textContent=`
      .report-table{width:100%;border-collapse:collapse;background:#fff;border-radius:10px;overflow:hidden}
      .report-table th,.report-table td{border:1px solid rgba(0,0,0,.1);padding:8px;vertical-align:top}
      .report-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
      .report-actions{margin-top:10px}
    `;
    document.head.appendChild(css);
  }

  function render(){
    ensureCSS();
    const list=(function(){ try{return JSON.parse(localStorage.getItem(KEY)||'[]');}catch{return[];} })()
      .sort((a,b)=>(a.ts||0)-(b.ts||0));
    const rows=list.map((it,i)=>{
      const when = it.date || (it.ts ? new Date(it.ts).toLocaleString() : '');
      const kind = it.type==='feature' ? 'Feature' : 'Error';
      const esc=s=>String(s||'').replace(/</g,'&lt;');
      const det=esc((it.details||'').replace(/\n/g,'<br>'));
      return `<tr>
        <td>${i+1}</td><td>${when}</td><td>${kind}</td>
        <td>${esc(it.main||'')}</td><td>${esc(it.sub||'')}</td><td>${esc(it.category||'')}</td>
        <td>${esc(it.subject||'')}</td><td>${det}</td><td>${esc(it.by||'')}</td>
      </tr>`;
    }).join('');

    app().innerHTML = `
      <section class="section">
        <div class="report-head">
          <h1>📑 Feedback Summary</h1>
          <div class="muted">${new Date().toLocaleDateString()}</div>
        </div>
        ${list.length?`
          <table class="report-table">
            <thead><tr>
              <th>#</th><th>When</th><th>Type</th><th>Main</th><th>Sub</th><th>Category</th>
              <th>Subject</th><th>Details</th><th>Submitted By</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
        `:'<p class="muted">No feedback yet.</p>'}
        <div class="report-actions">
          <button id="print-report" class="btn-primary">Print / Save PDF</button>
          <a class="btn" href="#/reports">Back</a>
        </div>
      </section>
    `;
    $('#print-report')?.addEventListener('click', ()=>window.print());
  }

  function route(){
    const h=(location.hash||'').replace(/\/+$/,'');
    if (h==='#/reports/feedback'){ render(); return true; }
    return false;
  }
  window.addEventListener('hashchange', route, {passive:true});
  if (document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', route, {once:true}); } else { route(); }
})();

/* ================= App v12 — Part 34: Calculators Hub + Shell Routes ================= */
(function DF_Part34_CalcsHub(){
  'use strict';
  if (window.__DF_P34__) return; window.__DF_P34__ = true;

  const $=(s,r=document)=>r.querySelector(s);
  const app=()=>$('#app');

  function ensureCSS(){
    if ($('#df-p34-css')) return;
    const css=document.createElement('style');
    css.id='df-p34-css';
    css.textContent=`
      .grid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
      @media (min-width:760px){ .grid2{grid-template-columns:repeat(3,minmax(0,1fr));} }
      .tile{display:flex;align-items:center;gap:10px;padding:12px;background:#fff;border:1px solid rgba(0,0,0,.1);border-radius:10px;text-decoration:none;color:inherit}
      .tile .em{font-size:20px}
      .card{border:1px solid rgba(0,0,0,.12);border-radius:10px;background:#fff;padding:12px;margin-top:10px}
      .calc-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
      @media (max-width:560px){ .calc-grid{grid-template-columns:1fr 1fr;} }
    `;
    document.head.appendChild(css);
  }

  function hub(){
    ensureCSS();
    app().innerHTML = `
      <section class="section">
        <h1>🧮 Calculators</h1>
        <div class="grid2">
          <a class="tile" href="#/calc/fertilizer"><span class="em">🧪</span><span>Fertilizer</span></a>
          <a class="tile" href="#/calc/bin"><span class="em">🛢️</span><span>Bin Volume</span></a>
          <a class="tile" href="#/calc/area"><span class="em">📐</span><span>Area</span></a>
          <a class="tile" href="#/calc/yield"><span class="em">🌽</span><span>Combine Yield</span></a>
          <a class="tile" href="#/calc/chem"><span class="em">🧴</span><span>Chemical Mix</span></a>
        </div>
        <p class="muted" style="margin-top:10px;"><a href="#/home">← Back to Home</a></p>
      </section>
    `;
  }

  function shell(title, em){
    ensureCSS();
    app().innerHTML = `
      <section class="section">
        <h1>${em} ${title}</h1>
        <div class="card"><p class="muted">Calculator shell loaded — logic coming in Parts 35–36.</p></div>
        <p style="margin-top:10px;"><a class="btn" href="#/calc">Back to Calculators</a></p>
      </section>
    `;
  }

  function route(){
    const h=(location.hash||'').replace(/\/+$/,'')||'#/calc';
    if (h==='#/calc'){ hub(); return true; }
    if (h==='#/calc/fertilizer'){ shell('Fertilizer','🧪'); return true; }
    if (h==='#/calc/bin'){ shell('Bin Volume','🛢️'); return true; }
    if (h==='#/calc/area'){ shell('Area','📐'); return true; }
    if (h==='#/calc/yield'){ shell('Combine Yield','🌽'); return true; }
    if (h==='#/calc/chem'){ shell('Chemical Mix','🧴'); return true; }
    return false;
  }
  window.addEventListener('hashchange', route, {passive:true});
  if (document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', route, {once:true}); } else { route(); }
})();

/* ================= App v12 — Part 35: Fertilizer + Bin Volume Calculators ================= */
(function DF_Part35_CalcFert_Bin(){
  'use strict';
  if (window.__DF_P35__) return; window.__DF_P35__ = true;

  const $=(s,r=document)=>r.querySelector(s);
  const app=()=>$('#app');
  const num=v=>{ const n=Number(String(v).replace(/,/g,'')); return Number.isFinite(n)?n:0; };
  const commas=v=>{ try{return Number(v).toLocaleString();}catch{return String(v);} };

  function ensureCSS(){
    if ($('#df-p35-css')) return;
    const css=document.createElement('style');
    css.id='df-p35-css';
    css.textContent=`
      .calc-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
      .card{border:1px solid rgba(0,0,0,.12);border-radius:10px;background:#fff;padding:12px;margin-top:10px}
    `;
    document.head.appendChild(css);
  }

  // -------- Fertilizer --------
  function viewFert(){
    ensureCSS();
    app().innerHTML = `
      <section class="section">
        <h1>🧪 Fertilizer Calculator</h1>
        <div class="calc-grid">
          <label><span class="small muted">Nutrient</span>
            <select id="f-n"><option>N</option><option>P₂O₅</option><option>K₂O</option></select>
          </label>
          <label><span class="small muted">Target lb/ac *</span><input id="f-target" type="number" step="any"></label>
          <label><span class="small muted">Product Analysis % *</span><input id="f-ana" type="number" step="any" placeholder="e.g., 32"></label>
          <label><span class="small muted">Density (lb/gal)</span>
            <select id="f-den">
              <option value="11.06">UAN 32 (11.06)</option>
              <option value="10.67">UAN 28 (10.67)</option>
              <option value="8.34">Water (8.34)</option>
            </select>
          </label>
          <label><span class="small muted">Acres *</span><input id="f-ac" type="number" step="any"></label>
        </div>
        <div style="margin-top:8px;">
          <button id="f-go" class="btn-primary">Calculate</button>
          <a class="btn" href="#/calc">Back</a>
        </div>
        <div id="f-out" class="card" style="display:none;"></div>
      </section>
    `;
    $('#f-go')?.addEventListener('click', ()=>{
      const target=num($('#f-target').value), ana=num($('#f-ana').value), den=num($('#f-den').value||'11.06'), ac=num($('#f-ac').value);
      if (!target || !ana || !ac || ana<=0 || ana>100){ alert('Enter valid target, analysis(1–100) and acres.'); return; }
      const frac=ana/100, lbA=target/frac, galA=lbA/(den||1);
      const out=$('#f-out'); out.style.display='';
      out.innerHTML = `
        <div><strong>Product lb/acre:</strong> ${commas(lbA.toFixed(2))}</div>
        <div><strong>Product gal/acre:</strong> ${commas(galA.toFixed(2))}</div>
        <div><strong>Total lbs:</strong> ${commas((lbA*ac).toFixed(0))}</div>
        <div><strong>Total gal:</strong> ${commas((galA*ac).toFixed(1))}</div>
        <div class="small muted" style="margin-top:6px;">Density affects gal/acre; analysis drives lb/acre.</div>
      `;
    });
  }

  // -------- Bin Volume --------
  function viewBin(){
    ensureCSS();
    app().innerHTML = `
      <section class="section">
        <h1>🛢️ Bin Volume Calculator</h1>
        <div class="calc-grid">
          <label><span class="small muted">Diameter (ft) *</span><input id="b-d" type="number" step="any"></label>
          <label><span class="small muted">Grain Depth (ft) *</span><input id="b-h" type="number" step="any"></label>
          <label><span class="small muted">Roof</span>
            <select id="b-roof"><option value="flat">Flat/Simplified</option><option value="cone">Cone (add rise)</option></select>
          </label>
          <label id="b-rise-wrap" style="display:none;"><span class="small muted">Cone Rise (ft)</span><input id="b-rise" type="number" step="any"></label>
          <label><span class="small muted">Crop</span>
            <select id="b-crop"><option>Corn</option><option>Soybeans</option><option>Custom</option></select>
          </label>
          <label><span class="small muted">lb / bu</span><input id="b-lbbu" type="number" step="any" value="56"></label>
          <label><span class="small muted">ft³ / bu</span><input id="b-buft3" type="number" step="any" value="1.244"></label>
        </div>
        <div style="margin-top:8px;">
          <button id="b-go" class="btn-primary">Calculate</button>
          <a class="btn" href="#/calc">Back</a>
        </div>
        <div id="b-out" class="card" style="display:none;"></div>
      </section>
    `;
    $('#b-roof')?.addEventListener('change', ()=>{ $('#b-rise-wrap').style.display = ($('#b-roof').value==='cone')?'block':'none'; });
    $('#b-crop')?.addEventListener('change', ()=>{
      if ($('#b-crop').value==='Corn') $('#b-lbbu').value='56';
      else if ($('#b-crop').value==='Soybeans') $('#b-lbbu').value='60';
    });
    $('#b-go')?.addEventListener('click', ()=>{
      const d=num($('#b-d').value), h=num($('#b-h').value), roof=$('#b-roof').value, rise=num($('#b-rise')?.value||0);
      const lbbu=num($('#b-lbbu').value||56), buft3=num($('#b-buft3').value||1.244);
      if(!d||!h||!lbbu||!buft3){ alert('Enter diameter, depth, lb/bu, ft³/bu.'); return; }
      const r=d/2, volCyl=Math.PI*r*r*h, volCone = roof==='cone' && rise>0 ? (Math.PI*r*r*rise)/3 : 0;
      const vol = volCyl + volCone, bu=vol/buft3, wt=bu*lbbu;
      const out=$('#b-out'); out.style.display=''; out.innerHTML = `
        <div><strong>Volume (ft³):</strong> ${commas(vol.toFixed(0))}</div>
        <div><strong>Bushels:</strong> ${commas(bu.toFixed(0))}</div>
        <div><strong>Estimated Weight (lb):</strong> ${commas(wt.toFixed(0))}</div>
        <div class="small muted" style="margin-top:6px;">Assumes ideal fill; adjust for void/packing as needed.</div>
      `;
    });
  }

  function route(){
    const h=(location.hash||'').replace(/\/+$/,'');
    if (h==='#/calc/fertilizer'){ viewFert(); return true; }
    if (h==='#/calc/bin'){ viewBin(); return true; }
    return false;
  }
  window.addEventListener('hashchange', route, {passive:true});
  if (document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', route, {once:true}); } else { route(); }
})();

/* ============== App v12 — Part 36: Area + Combine Yield + Chemical Mix ============== */
(function DF_Part36_CalcArea_Yield_Chem(){
  'use strict';
  if (window.__DF_P36__) return; window.__DF_P36__ = true;

  const $=(s,r=document)=>r.querySelector(s);
  const app=()=>$('#app');
  const num=v=>{ const n=Number(String(v).replace(/,/g,'')); return Number.isFinite(n)?n:0; };
  const commas=v=>{ try{return Number(v).toLocaleString();}catch{return String(v);} };

  function ensureCSS(){
    if ($('#df-p36-css')) return;
    const css=document.createElement('style');
    css.id='df-p36-css';
    css.textContent=`
      .calc-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
      @media (max-width:560px){ .calc-grid{grid-template-columns:1fr 1fr;} }
      .card{border:1px solid rgba(0,0,0,.12);border-radius:10px;background:#fff;padding:12px;margin-top:10px}
    `;
    document.head.appendChild(css);
  }

  // -------- Area --------
  function viewArea(){
    ensureCSS();
    app().innerHTML = `
      <section class="section">
        <h1>📐 Area</h1>
        <div class="calc-grid">
          <label><span class="small muted">Shape</span>
            <select id="a-shape"><option>Rectangle</option><option>Circle</option><option>Triangle</option></select>
          </label>
          <label><span class="small muted">Units</span>
            <select id="a-unit"><option value="ft">Feet</option><option value="m">Meters</option></select>
          </label>
        </div>
        <div id="a-rect" class="calc-grid" style="margin-top:8px;">
          <label><span class="small muted">Length *</span><input id="a-len" type="number" step="any"></label>
          <label><span class="small muted">Width *</span><input id="a-wid" type="number" step="any"></label>
        </div>
        <div id="a-circ" class="calc-grid" style="display:none;margin-top:8px;">
          <label><span class="small muted">Diameter *</span><input id="a-dia" type="number" step="any"></label>
          <div></div>
        </div>
        <div id="a-tri" class="calc-grid" style="display:none;margin-top:8px;">
          <label><span class="small muted">Base *</span><input id="a-base" type="number" step="any"></label>
          <label><span class="small muted">Height *</span><input id="a-height" type="number" step="any"></label>
        </div>
        <div style="margin-top:8px;">
          <button id="a-go" class="btn-primary">Calculate</button>
          <a class="btn" href="#/calc">Back</a>
        </div>
        <div id="a-out" class="card" style="display:none;"></div>
      </section>
    `;
    const show=()=>{
      const s=$('#a-shape').value;
      $('#a-rect').style.display = s==='Rectangle'?'grid':'none';
      $('#a-circ').style.display = s==='Circle'?'grid':'none';
      $('#a-tri').style.display  = s==='Triangle'?'grid':'none';
    };
    $('#a-shape').addEventListener('change', show); show();
    $('#a-go').addEventListener('click', ()=>{
      const unit=$('#a-unit').value; let A=0;
      const s=$('#a-shape').value;
      if (s==='Rectangle'){ const L=num($('#a-len').value), W=num($('#a-wid').value); if(!L||!W) return alert('Enter length & width.'); A=L*W; }
      else if (s==='Circle'){ const D=num($('#a-dia').value); if(!D) return alert('Enter diameter.'); const r=D/2; A=Math.PI*r*r; }
      else { const B=num($('#a-base').value), H=num($('#a-height').value); if(!B||!H) return alert('Enter base & height.'); A=0.5*B*H; }
      const acres = unit==='ft' ? (A/43560) : (A/4046.8564224);
      const out=$('#a-out'); out.style.display='';
      out.innerHTML = `<div><strong>Area (${unit==='ft'?'ft²':'m²'}):</strong> ${commas(A.toFixed(2))}</div>
        <div><strong>Area (acres):</strong> ${commas(acres.toFixed(4))}</div>`;
    });
  }

  // -------- Combine Yield (length + header width + true vs elevator shrink) --------
  function viewYield(){
    ensureCSS();
    app().innerHTML = `
      <section class="section">
        <h1>🌽 Combine Yield</h1>
        <div class="calc-grid">
          <label><span class="small muted">Crop</span>
            <select id="cy-crop"><option>Corn</option><option>Soybeans</option></select>
          </label>
          <label><span class="small muted">Wet Weight (lb) *</span><input id="cy-wet" type="number" step="any"></label>
          <label><span class="small muted">Moisture % *</span><input id="cy-moist" type="number" step="any"></label>
          <label><span class="small muted">Length (ft) *</span><input id="cy-length" type="number" step="any"></label>
          <label><span class="small muted">Header Width *</span>
            <select id="cy-width"><option value="30">30’</option><option value="35">35’</option><option value="40" selected>40’</option><option value="45">45’</option></select>
          </label>
          <label><span class="small muted">Dry Basis %</span><input id="cy-base" type="number" step="any" placeholder="auto"></label>
          <label><span class="small muted">lb / bu</span><input id="cy-lbbu" type="number" step="any" placeholder="auto"></label>
        </div>
        <div style="margin-top:8px;">
          <button id="cy-go" class="btn-primary">Calculate</button>
          <a class="btn" href="#/calc">Back</a>
        </div>
        <div id="cy-out" class="card" style="display:none;"></div>
      </section>
    `;

    const PRESETS = { Corn:{ base:15.5, lbbu:56 }, Soybeans:{ base:13.0, lbbu:60 } };
    const fill=()=>{
      const crop=$('#cy-crop').value; const p=PRESETS[crop];
      if (!$('#cy-base').value) $('#cy-base').value=p.base;
      if (!$('#cy-lbbu').value) $('#cy-lbbu').value=p.lbbu;
    };
    $('#cy-crop').addEventListener('change', fill); fill();

    const elevatorShrinkPct=(moist, base)=>{
      if (moist<=base) return 0;
      const maxM=29, maxS=21; if (moist>=maxM) return maxS;
      const slope=maxS/(maxM-base); return slope*(moist-base);
    };

    $('#cy-go').addEventListener('click', ()=>{
      const crop=$('#cy-crop').value, wetLb=num($('#cy-wet').value), moist=num($('#cy-moist').value);
      const lenFt=num($('#cy-length').value), headFt=num($('#cy-width').value);
      const base=num($('#cy-base').value||PRESETS[crop].base), lbbu=num($('#cy-lbbu').value||PRESETS[crop].lbbu);
      if(!wetLb||!moist||!lenFt||!headFt){ alert('Enter Wet Weight, Moisture, Length and Header Width.'); return; }
      const acres=(lenFt*headFt)/43560; if (acres<=0) return alert('Calculated acres <= 0. Check length/header width.');
      const wetBu=wetLb/lbbu;
      const dryFactor=(100-moist)/(100-base); const trueBu=wetBu*dryFactor; const trueYield=trueBu/acres; const trueShrink=(1-dryFactor)*100;
      const elevShrink=elevatorShrinkPct(moist,base); const elevBu=wetBu*(1-(elevShrink/100)); const elevYield=elevBu/acres;
      const out=$('#cy-out'); out.style.display='';
      out.innerHTML = `
        <div style="display:flex;gap:14px;flex-wrap:wrap;">
          <div><strong>Acres (calc):</strong> ${acres.toFixed(3)}</div>
          <div><strong>Wet Bushels:</strong> ${commas(wetBu.toFixed(2))}</div>
          <div><strong>Test Wt:</strong> ${lbbu} lb/bu</div>
          <div><strong>Dry Basis:</strong> ${base}%</div>
        </div>
        <hr style="border:none;border-top:1px solid rgba(0,0,0,.12);margin:8px 0;">
        <div class="calc-grid" style="grid-template-columns:1fr 1fr;">
          <div>
            <h3 style="margin:0 0 6px 0;">True Shrink</h3>
            <div><strong>Adj. Bushels:</strong> ${commas(trueBu.toFixed(2))}</div>
            <div><strong>Yield:</strong> ${commas(trueYield.toFixed(1))} bu/ac</div>
            <div class="small muted">Shrink ≈ ${trueShrink.toFixed(1)}% (to ${base}%).</div>
          </div>
          <div>
            <h3 style="margin:0 0 6px 0;">Elevator Shrink</h3>
            <div><strong>Adj. Bushels:</strong> ${commas(elevBu.toFixed(2))}</div>
            <div><strong>Yield:</strong> ${commas(elevYield.toFixed(1))} bu/ac</div>
            <div class="small muted">Prorated elevator shrink ≈ ${elevShrink.toFixed(1)}%.</div>
          </div>
        </div>
      `;
    });
  }

  // -------- Chemical Mix --------
  function viewChem(){
    ensureCSS();
    app().innerHTML = `
      <section class="section">
        <h1>🧴 Chemical Mix</h1>
        <div class="calc-grid">
          <label><span class="small muted">Tank Size (gal) *</span><input id="ch-tank" type="number" step="any"></label>
          <label><span class="small muted">Carrier GPA *</span><input id="ch-gpa" type="number" step="any"></label>
          <label><span class="small muted">Job Acres (optional)</span><input id="ch-job" type="number" step="any"></label>
        </div>
        <h3 style="margin-top:10px;">Products (rate per acre)</h3>
        <div id="prod-wrap"></div>
        <div style="margin-top:8px;">
          <button id="ch-go" class="btn-primary">Calculate</button>
          <a class="btn" href="#/calc">Back</a>
        </div>
        <div id="ch-out" class="card" style="display:none;"></div>
      </section>
    `;
    const wrap=$('#prod-wrap');
    const rows = Array.from({length:6}).map((_,i)=>`
      <div class="calc-grid" style="margin-top:6px;">
        <label><span class="small muted">Product ${i+1}</span><input id="ch-name-${i}" type="text"></label>
        <label><span class="small muted">Rate / acre</span><input id="ch-rate-${i}" type="number" step="any"></label>
        <label><span class="small muted">Unit</span>
          <select id="ch-unit-${i}"><option value="oz">oz</option><option value="pt">pt</option><option value="qt">qt</option><option value="gal">gal</option></select>
        </label>
      </div>`).join('');
    wrap.innerHTML = rows;

    const toGal=(u,x)=>{ const v=num(x); if(!v) return 0; if(u==='gal')return v; if(u==='qt')return v/4; if(u==='pt')return v/8; if(u==='oz')return v/128; return 0; };

    $('#ch-go').addEventListener('click', ()=>{
      const tank=num($('#ch-tank').value), gpa=num($('#ch-gpa').value), job=num($('#ch-job').value);
      if(!tank||!gpa){ alert('Enter Tank Size and Carrier GPA.'); return; }
      const acPerTank=tank/gpa; let total=0;
      const lines=[];
      for(let i=0;i<6;i++){
        const name=$('#ch-name-'+i).value, rate=$('#ch-rate-'+i).value, unit=$('#ch-unit-'+i).value;
        const perAcreGal=toGal(unit,rate); const perTankGal=perAcreGal*acPerTank;
        if (perTankGal>0){ total+=perTankGal; lines.push(`<li>${name||'(Unnamed)'}: <strong>${commas(perTankGal.toFixed(3))}</strong> gal / tank <span class="small muted">(${rate} ${unit}/ac)</span></li>`); }
      }
      const out=$('#ch-out'); out.style.display='';
      const tanks = job>0 ? `<li><strong>Tanks needed for ${commas(job)} ac:</strong> ${commas(Math.ceil(job/acPerTank))}</li>` : '';
      out.innerHTML = `
        <div><strong>Acres per tank:</strong> ${commas(acPerTank.toFixed(2))}</div>
        <div><strong>Carrier per tank (gal):</strong> ${commas(tank)}</div>
        <ul style="margin:8px 0 0 18px;">${lines.join('') || '<li class="muted">No products entered.</li>'}</ul>
        <div style="margin-top:6px;"><strong>Total product volume in mix (gal):</strong> ${commas(total.toFixed(3))}</div>
        ${tanks}
        <div class="small muted" style="margin-top:6px;">Confirm compatibility and label requirements.</div>
      `;
    });
  }

  function route(){
    const h=(location.hash||'').replace(/\/+$/,'');
    if (h==='#/calc/area'){ viewArea(); return true; }
    if (h==='#/calc/yield'){ viewYield(); return true; }
    if (h==='#/calc/chem'){ viewChem(); return true; }
    return false;
  }
  window.addEventListener('hashchange', route, {passive:true});
  if (document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', route, {once:true}); } else { route(); }
})();

/* ================= App v12 — Part 37: Crop Production Hub + Crop Year ================= */
(function DF_Part37_CropHub(){
  'use strict';
  if (window.__DF_P37__) return; window.__DF_P37__ = true;

  const $  = (s,r=document)=>r.querySelector(s);
  const app=()=>$('#app');

  // ----- storage helpers -----
  const uKey = ()=> {
    let email='';
    try { email = String(localStorage.getItem('df_user')||'').trim(); } catch {}
    return email || 'anon';
  };
  const YEARS_KEY = 'df_crop_years';
  const SEL_KEY   = (user)=> `df_crop_year_selected::${user}`;

  function loadJSON(k, fb){ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):fb; }catch{ return fb; } }
  function saveJSON(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch{} }

  // ----- years list (2024 … current+1) -----
  function allowedYears(){
    const CUR = new Date().getFullYear();
    const MAX = CUR + 1, MIN = 2024;
    const arr = [];
    for (let y=MIN; y<=Math.min(MAX, MAX); y++) arr.push(y);
    return arr;
  }
  function initYearsSeed(){
    let ys = loadJSON(YEARS_KEY, null);
    if (!Array.isArray(ys) || !ys.length){
      ys = allowedYears();
      saveJSON(YEARS_KEY, ys);
    }
    return ys;
  }
  function allYears(){
    const base = initYearsSeed().map(Number);
    return Array.from(new Set(base)).filter(Number.isFinite).sort((a,b)=>b-a);
  }
  function getSelected(){
    const key = SEL_KEY(uKey());
    const raw = localStorage.getItem(key);
    const n   = Number(raw);
    if (Number.isFinite(n) && allYears().includes(n)) return n;
    // default: most recent allowed year
    return allYears()[0] || new Date().getFullYear();
  }
  function setSelected(y){
    const yr = Number(y);
    if (!Number.isFinite(yr) || !allYears().includes(yr)) return;
    localStorage.setItem(SEL_KEY(uKey()), String(yr));
  }
  function addYearFlow(){
    const CUR = new Date().getFullYear();
    const MAX = CUR + 1, MIN = 2024;
    const def = String(Math.min(MAX, getSelected() || CUR));
    const input = prompt(`Add crop year (${MIN}–${MAX}):`, def);
    if (input===null) return;
    const yr = Number(input);
    if (!Number.isFinite(yr) || yr<MIN || yr>MAX){ alert(`Year must be between ${MIN} and ${MAX}.`); return; }
    const ys = allYears();
    if (!ys.includes(yr)){
      ys.push(yr);
      saveJSON(YEARS_KEY, Array.from(new Set(ys)).sort((a,b)=>b-a));
    }
    setSelected(yr);
    renderCropHub(); // refresh UI
  }

  function ensureCSS(){
    if ($('#df-p37-css')) return;
    const css = document.createElement('style');
    css.id = 'df-p37-css';
    css.textContent = `
      .cy-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:6px 0 12px}
      .df-subtiles{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
      @media (min-width:760px){ .df-subtiles{grid-template-columns:repeat(3,minmax(0,1fr));} }
      .df-subtile{display:flex;align-items:center;gap:10px;padding:12px;background:#fff;border:1px solid rgba(0,0,0,.08);border-radius:10px;text-decoration:none;color:inherit}
      .df-subtile .em{font-size:20px}
    `;
    document.head.appendChild(css);
  }

  // Submenu (same families as 10.15.1)
  const SUBS = [
    { href:'#/crop/planting',  icon:'🌱', label:'Planting' },
    { href:'#/crop/spraying',  icon:'🧪', label:'Spraying' },
    { href:'#/crop/aerial',    icon:'✈️', label:'Aerial Spray' },
    { href:'#/crop/harvest',   icon:'🚜', label:'Harvest' },
    { href:'#/crop/maint',     icon:'🧰', label:'Field Maintenance' },
    { href:'#/crop/scouting',  icon:'🔍', label:'Scouting' },
    { href:'#/crop/trials',    icon:'🧫', label:'Trials' },
  ];

  function renderCropHub(){
    ensureCSS();
    const root = app(); if (!root) return;
    const years = allYears(), sel = getSelected();

    root.innerHTML = `
      <section class="section">
        <h1>🌽 Crop Production</h1>
        <div class="cy-row">
          <label style="font-weight:600;">Crop Year:</label>
          <select id="cy-year" style="min-width:140px;">
            ${years.map(y=>`<option value="${y}" ${y===sel?'selected':''}>${y}</option>`).join('')}
          </select>
          <button id="cy-add" class="btn">➕ Add year…</button>
          <span class="muted small">Saved per user.</span>
        </div>
        <div class="df-subtiles">
          ${SUBS.map(s=>`
            <a class="df-subtile" href="${s.href}">
              <span class="em">${s.icon}</span><span>${s.label}</span>
            </a>
          `).join('')}
        </div>
        <p class="muted" style="margin-top:12px;"><a href="#/home">← Back to Home</a></p>
      </section>
    `;

    $('#cy-year')?.addEventListener('change', (e)=> setSelected(e.target.value));
    $('#cy-add') ?.addEventListener('click', addYearFlow);
  }

  // lightweight shells for leaf pages
  function renderLeaf(title, em){
    const root=app(); if (!root) return;
    const yr = getSelected();
    root.innerHTML = `
      <section class="section">
        <h1>${em} ${title}</h1>
        <p class="muted">Active Crop Year: <strong>${yr}</strong></p>
        <p class="muted">Scaffold page — wiring details will come next.</p>
        <p class="muted"><a href="#/crop">← Back to Crop Production</a></p>
      </section>
    `;
  }

  function route(){
    const h=(location.hash||'').replace(/\/+$/,'')||'#/crop';
    if (h==='#/crop'){ renderCropHub(); return true; }
    const map = {
      '#/crop/planting':['Planting','🌱'],
      '#/crop/spraying':['Spraying','🧪'],
      '#/crop/aerial':['Aerial Spray','✈️'],
      '#/crop/harvest':['Harvest','🚜'],
      '#/crop/maint':['Field Maintenance','🧰'],
      '#/crop/scouting':['Scouting','🔍'],
      '#/crop/trials':['Trials','🧫'],
    };
    if (map[h]){ const [t,e]=map[h]; renderLeaf(t,e); return true; }
    return false;
  }
  window.addEventListener('hashchange', route, {passive:true});
  if (document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', route, {once:true}); } else { route(); }

  // expose current crop year getter for other parts
  window.DF = window.DF || {};
  window.DF.getCropYear = getSelected;
})();

/* ================= App v12 — Part 38: Grain Tracking Hub + Stubs ================= */
(function DF_Part38_GrainHub(){
  'use strict';
  if (window.__DF_P38__) return; window.__DF_P38__ = true;

  const $=(s,r=document)=>r.querySelector(s);
  const app=()=>$('#app');

  function ensureCSS(){
    if ($('#df-p38-css')) return;
    const css=document.createElement('style');
    css.id='df-p38-css';
    css.textContent=`
      .df-subtiles{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
      @media (min-width:760px){ .df-subtiles{grid-template-columns:repeat(3,minmax(0,1fr));} }
      .df-subtile{display:flex;align-items:center;gap:10px;padding:12px;background:#fff;border:1px solid rgba(0,0,0,.08);border-radius:10px;text-decoration:none;color:inherit}
      .df-subtile .em{font-size:20px}
    `;
    document.head.appendChild(css);
  }

  const SUBS = [
    { href:'#/grain/bag',   icon:'🛍️', label:'Grain Bag' },
    { href:'#/grain/bins',  icon:'🏚️', label:'Grain Bins' },
    { href:'#/grain/cont',  icon:'📄',  label:'Grain Contracts' },
    { href:'#/grain/ocr',   icon:'🧾',  label:'Grain Ticket OCR' },
  ];

  function hub(){
    ensureCSS();
    app().innerHTML = `
      <section class="section">
        <h1>🌾 Grain Tracking</h1>
        <div class="df-subtiles">
          ${SUBS.map(s=>`
            <a class="df-subtile" href="${s.href}">
              <span class="em">${s.icon}</span><span>${s.label}</span>
            </a>
          `).join('')}
        </div>
        <p class="muted" style="margin-top:12px;"><a href="#/home">← Back to Home</a></p>
      </section>
    `;
  }

  function leaf(title, em){
    app().innerHTML = `
      <section class="section">
        <h1>${em} ${title}</h1>
        <p class="muted">Scaffold view — detailed UI to follow.</p>
        <p class="muted"><a href="#/grain">← Back to Grain Tracking</a></p>
      </section>
    `;
  }

  function route(){
    const h=(location.hash||'').replace(/\/+$/,'')||'#/grain';
    if (h==='#/grain'){ hub(); return true; }
    const map = {
      '#/grain/bag':['Grain Bag','🛍️'],
      '#/grain/bins':['Grain Bins','🏚️'],
      '#/grain/cont':['Grain Contracts','📄'],
      '#/grain/ocr':['Grain Ticket OCR','🧾'],
    };
    if (map[h]){ const [t,e]=map[h]; leaf(t,e); return true; }
    return false;
  }
  window.addEventListener('hashchange', route, {passive:true});
  if (document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', route, {once:true}); } else { route(); }
})();

/* ================= App v12 — Part 39: Equipment Hub + Stubs ================= */
(function DF_Part39_EquipHub(){
  'use strict';
  if (window.__DF_P39__) return; window.__DF_P39__ = true;

  const $=(s,r=document)=>r.querySelector(s);
  const app=()=>$('#app');

  function ensureCSS(){
    if ($('#df-p39-css')) return;
    const css=document.createElement('style');
    css.id='df-p39-css';
    css.textContent=`
      .df-subtiles{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
      @media (min-width:760px){ .df-subtiles{grid-template-columns:repeat(3,minmax(0,1fr));} }
      .df-subtile{display:flex;align-items:center;gap:10px;padding:12px;background:#fff;border:1px solid rgba(0,0,0,.08);border-radius:10px;text-decoration:none;color:inherit}
      .df-subtile .em{font-size:20px}
    `;
    document.head.appendChild(css);
  }

  const SUBS = [
    { href:'#/equip/tech',      icon:'🛰️', label:'StarFire / Technology' },
    { href:'#/equip/tractors',  icon:'🚜', label:'Tractors' },
    { href:'#/equip/combines',  icon:'🚜', label:'Combines' },
    { href:'#/equip/sprayers',  icon:'💦', label:'Sprayer / Fertilizer' },
    { href:'#/equip/const',     icon:'🏗️', label:'Construction Equipment' },
    { href:'#/equip/trucks',    icon:'🚚', label:'Trucks' },
    { href:'#/equip/trailers',  icon:'🚛', label:'Trailers' },
    { href:'#/equip/impl',      icon:'⚙️', label:'Farm Implements' },
  ];

  function hub(){
    ensureCSS();
    app().innerHTML = `
      <section class="section">
        <h1>🛠️ Equipment</h1>
        <div class="df-subtiles">
          ${SUBS.map(s=>`
            <a class="df-subtile" href="${s.href}">
              <span class="em">${s.icon}</span><span>${s.label}</span>
            </a>`).join('')}
        </div>
        <p class="muted" style="margin-top:12px;"><a href="#/home">← Back to Home</a></p>
      </section>
    `;
  }

  function leaf(title, em){
    app().innerHTML = `
      <section class="section">
        <h1>${em} ${title}</h1>
        <p class="muted">Scaffold view — more to wire later.</p>
        <p class="muted"><a href="#/equip">← Back to Equipment</a></p>
      </section>
    `;
  }

  function route(){
    const h=(location.hash||'').replace(/\/+$/,'')||'#/equip';
    if (h==='#/equip'){ hub(); return true; }
    const map={
      '#/equip/tech':['StarFire / Technology','🛰️'],
      '#/equip/tractors':['Tractors','🚜'],
      '#/equip/combines':['Combines','🚜'],
      '#/equip/sprayers':['Sprayer / Fertilizer','💦'],
      '#/equip/const':['Construction Equipment','🏗️'],
      '#/equip/trucks':['Trucks','🚚'],
      '#/equip/trailers':['Trailers','🚛'],
      '#/equip/impl':['Farm Implements','⚙️'],
    };
    if (map[h]){ const [t,e]=map[h]; leaf(t,e); return true; }
    return false;
  }
  window.addEventListener('hashchange', route, {passive:true});
  if (document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', route, {once:true}); } else { route(); }
})();

/* ================= App v12 — Part 40: Global Utilities (fmt, readNumeric, toast) ================= */
(function DF_Part40_Utils(){
  'use strict';
  if (window.__DF_P40__) return; window.__DF_P40__ = true;

  // Number formatting with commas and optional decimals cap
  function fmtCommas(n, opts={}){
    const {decimals=null} = opts;
    const v = Number(n); if (!Number.isFinite(v)) return String(n);
    const d = decimals==null ? (Math.abs(v)%1===0 ? 0 : (Math.abs(v)>=100 ? 1 : 2)) : Math.max(0, Math.min(6, decimals));
    try { return v.toLocaleString(undefined, {minimumFractionDigits:d, maximumFractionDigits:d}); }
    catch { return String(v); }
  }

  // Read numeric from input/element (handles commas)
  function readNumeric(el){
    if (!el) return null;
    const raw = String(el.value||'').replace(/,/g,'').trim();
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  // Safe ls helpers (strings/JSON)
  const store = {
    get(k, fb){ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):fb; }catch{ return fb; } },
    set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch{} },
    del(k){ try{ localStorage.removeItem(k); }catch{} },
  };

  // Tiny toast (non-blocking notice)
  function toast(msg, ms=1800){
    let el = document.getElementById('df-toast');
    if (!el){
      el = document.createElement('div');
      el.id = 'df-toast';
      el.style.cssText = 'position:fixed;left:50%;bottom:18px;transform:translateX(-50%);background:#222;color:#fff;padding:8px 12px;border-radius:10px;font-size:14px;opacity:0;transition:opacity .15s ease;z-index:9999';
      document.body.appendChild(el);
    }
    el.textContent = String(msg||'');
    el.style.opacity = '1';
    setTimeout(()=>{ el.style.opacity='0'; }, ms);
  }

  // expose on DF namespace
  window.DF = window.DF || {};
  window.DF.util = { fmtCommas, readNumeric, store, toast };
})();

/* ================= App v12 — Part 41: Theme System + Settings UI (Auto / Light / Dark) ================= */
(function DF_Part41_Theme(){
  'use strict';
  if (window.__DF_P41_THEME__) return; window.__DF_P41_THEME__ = true;

  const $  = (s,r=document)=>r.querySelector(s);
  const app=()=>$('#app');

  const KEY = 'df_theme'; // 'auto' | 'light' | 'dark'

  // ---------- CSS Variables + iOS overscroll background fix ----------
  (function ensureThemeCSS(){
    if (document.getElementById('df-theme-css')) return;
    const css = document.createElement('style');
    css.id = 'df-theme-css';
    css.textContent = `
      :root{
        /* light defaults */
        --bg:#f6f3e4;
        --fg:#1a1a1a;
        --muted:#6e6e6e;
        --tile:#ffffff;
        --bd:rgba(0,0,0,.08);
        --brand:#0f4d1d;
        --head:#efe9d0;
        --foot:#efe9d0;
        --link:#0b5f2a;
        --seg-active:#0f4d1d;
        --page-bg: var(--bg);
      }
      /* explicit Light */
      [data-theme="light"]{
        --bg:#f6f3e4; --fg:#1a1a1a; --muted:#6e6e6e; --tile:#fff; --bd:rgba(0,0,0,.08);
        --brand:#0f4d1d; --head:#efe9d0; --foot:#efe9d0; --link:#0b5f2a; --seg-active:#0f4d1d;
        --page-bg: var(--bg);
      }
      /* explicit Dark */
      [data-theme="dark"]{
        --bg:#0f0f0f; --fg:#f1f1f1; --muted:#9b9b9b; --tile:#1a1a1a; --bd:rgba(255,255,255,.15);
        --brand:#4caf50; --head:#161616; --foot:#161616; --link:#9ae19a; --seg-active:#2e7d32;
        --page-bg: var(--bg);
      }
      /* AUTO follows system */
      [data-theme="auto"]{ --page-bg: var(--bg); }
      @media (prefers-color-scheme: dark){
        [data-theme="auto"]{
          --bg:#0f0f0f; --fg:#f1f1f1; --muted:#9b9b9b; --tile:#1a1a1a; --bd:rgba(255,255,255,.15);
          --brand:#4caf50; --head:#161616; --foot:#161616; --link:#9ae19a; --seg-active:#2e7d32;
          --page-bg: var(--bg);
        }
      }
      /* paint everything (incl. iOS overscroll) */
      html, body, #app, main { background-color: var(--page-bg) !important; color: var(--fg); }
      .site-head{ background:var(--head); border-bottom:1px solid var(--bd); }
      .site-foot{ background:var(--foot); border-top:1px solid var(--bd); }
      .df-tile, .df-subtile, input, textarea, select, .btn { background: var(--tile); border-color: var(--bd); color: var(--fg); }
      a { color: var(--link); }

      /* segmented control */
      .seg{
        display:inline-flex; border:1px solid var(--bd); border-radius:10px; overflow:hidden;
        background:transparent;
      }
      .seg button{
        appearance:none; border:0; background:transparent; cursor:pointer;
        padding:8px 14px; font-weight:600; color:var(--fg);
      }
      .seg button.active{ background:var(--seg-active); color:#fff; }
    `;
    document.head.appendChild(css);
  })();

  // ---------- Theme API ----------
  function getTheme(){
    try{ return (localStorage.getItem(KEY)||'auto'); }catch{ return 'auto'; }
  }
  function applyTheme(v){
    const val = (v==='light'||v==='dark') ? v : 'auto';
    document.documentElement.setAttribute('data-theme', val);
  }
  function setTheme(v){
    const val = (v==='light'||v==='dark') ? v : 'auto';
    try{ localStorage.setItem(KEY, val); }catch{}
    applyTheme(val);
    if (window.DF?.util?.toast) DF.util.toast(`Theme: ${val.toUpperCase()}`);
  }

  // start with saved (or auto)
  applyTheme(getTheme());

  // ---------- Settings → Theme screen ----------
  function renderSettingsTheme(){
    const cur = getTheme();
    const root = app(); if (!root) return;

    root.innerHTML = `
      <section class="section">
        <h1>🎨 Theme</h1>

        <div class="field">
          <label style="font-weight:700; display:block; margin-bottom:6px;">Appearance</label>
          <div class="seg" id="df-theme-seg">
            <button type="button" data-val="auto"  class="${cur==='auto' ? 'active' : ''}">Auto</button>
            <button type="button" data-val="light" class="${cur==='light'? 'active' : ''}">Light</button>
            <button type="button" data-val="dark"  class="${cur==='dark' ? 'active' : ''}">Dark</button>
          </div>
          <div class="muted" style="margin-top:8px;">“Auto” follows your device’s system setting.</div>
        </div>

        <div class="section">
          <a class="btn" href="#/settings">← Back to Settings</a>
        </div>
      </section>
    `;

    const seg = $('#df-theme-seg');
    seg?.addEventListener('click', (e)=>{
      const btn = e.target.closest('button[data-val]'); if (!btn) return;
      const choice = btn.getAttribute('data-val');
      setTheme(choice);
      seg.querySelectorAll('button').forEach(b=>b.classList.toggle('active', b===btn));
    });
  }

  // ---------- Route hook ----------
  function route(){
    const h=(location.hash||'').replace(/\/+$/,'');
    if (h === '#/settings/theme'){ renderSettingsTheme(); return true; }
    return false;
  }
  window.addEventListener('hashchange', route, {passive:true});
  if (document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', route, {once:true}); } else { route(); }

  // ---------- Export small API ----------
  window.DF = window.DF || {};
  window.DF.theme = { get:getTheme, set:setTheme, apply:applyTheme };
})();

/* ================= App v12 — Part 42: Login Route ================= */
(function DF_Part42_Login(){
  'use strict';
  if (window.__DF_P42_LOGIN__) return; window.__DF_P42_LOGIN__ = true;

  const $  = (s,r=document)=>r.querySelector(s);
  const app=()=>$('#app');

  // --- render inline login form ---
  function renderLogin(){
    const root = app(); if (!root) return;
    root.innerHTML = `
      <section class="section">
        <h1>Login</h1>
        <div class="field"><input id="li-email" type="email" placeholder="Email"></div>
        <div class="field" style="display:flex;gap:8px;">
          <input id="li-pass" type="password" placeholder="Password" style="flex:1;">
          <button class="btn-primary" id="li-go">Log In</button>
        </div>
      </section>
    `;
    $('#li-go')?.addEventListener('click', ()=>{
      const email = String($('#li-email')?.value||'').trim();
      try{ if (email) localStorage.setItem('df_user', email); }catch{}
      location.hash = '#/home';
      if (typeof window.DF?.renderHome === 'function') window.DF.renderHome();
    });
    applyLoginChrome();
  }

  // --- hide header/footer on login page ---
  function applyLoginChrome(){
    const isLogin = (location.hash||'').replace(/\/+$/,'') === '#/login';
    const head = $('#header'); const foot = $('#footer');
    if (head) head.style.display = isLogin ? 'none' : '';
    if (foot) foot.style.display = isLogin ? 'none' : '';
  }
  window.addEventListener('hashchange', applyLoginChrome, {passive:true});

  // --- hook router ---
  function routeLogin(){
    const h = (location.hash||'').replace(/\/+$/,'');
    if (h === '#/login'){ renderLogin(); return true; }
    return false;
  }
  window.addEventListener('hashchange', routeLogin, {passive:true});
  if (document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', ()=>{ routeLogin(); applyLoginChrome(); }, {once:true});
  } else {
    routeLogin(); applyLoginChrome();
  }

  // export
  window.DF = window.DF || {};
  window.DF.renderLogin = renderLogin;
})();

/* ================= App v12 — Part 44: Clean Login View + Hide Chrome ================= */
(function DF_Part44_LoginPolish(){
  'use strict';
  if (window.__DF_P44_LOGIN__) return; window.__DF_P44_LOGIN__ = true;

  const $ = (s,r=document)=>r.querySelector(s);

  // --- minimal CSS just for the login screen ---
  function injectLoginCSS(){
    if ($('#df-login-css')) return;
    const css = document.createElement('style');
    css.id = 'df-login-css';
    css.textContent = `
      /* Fullscreen centered login layout */
      .df-login-wrap{
        min-height:100vh;
        display:grid;
        place-items:center;
        background:var(--bg, #111);
      }
      .df-login-card{
        width:min(520px, 92vw);
        background:#fff;
        color:#111;
        border-radius:14px;
        border:1px solid rgba(0,0,0,.08);
        box-shadow:0 10px 30px rgba(0,0,0,.12);
        padding:22px 18px;
      }
      @media (prefers-color-scheme: dark){
        .df-login-wrap{ background:#0e0e0e; }
        .df-login-card{
          background:#151515; color:#eee;
          border-color:rgba(255,255,255,.08);
        }
        .df-login-card input{ background:#1b1b1b; color:#eee; border-color:rgba(255,255,255,.12); }
      }

      .df-login-brand{
        display:flex; flex-direction:column; align-items:center; gap:8px; margin-bottom:14px;
      }
      .df-login-logo{
        width:84px; height:84px; border-radius:50%; object-fit:cover;
        box-shadow:0 4px 12px rgba(0,0,0,.18);
      }
      .df-login-title{ font-weight:800; font-size:20px; letter-spacing:.2px; }

      .df-login-fields{ display:flex; flex-direction:column; gap:10px; }
      .df-login-fields input{
        width:100%; padding:12px 12px; border-radius:10px; border:1px solid rgba(0,0,0,.12);
        outline:none;
      }
      .df-login-actions{ display:flex; justify-content:flex-end; margin-top:8px; }
      .df-btn-primary{
        background:#0f4d1d; color:#fff; border:0; border-radius:10px; padding:10px 16px; font-weight:700;
      }
    `;
    document.head.appendChild(css);
  }

  // --- render a centered login view with your logo ---
  function renderLoginCentered(){
    injectLoginCSS();
    const root = $('#app'); if (!root) return;
    const logoPath = 'icons/logo.png'; // your existing logo
    const farmName = (window.DF && window.DF.APP_NAME) || 'Dowson Farms';

    root.innerHTML = `
      <div class="df-login-wrap">
        <div class="df-login-card" role="dialog" aria-labelledby="df-login-title">
          <div class="df-login-brand">
            <img src="${logoPath}" alt="Dowson Farms logo" class="df-login-logo">
            <div id="df-login-title" class="df-login-title">${farmName}</div>
          </div>
          <div class="df-login-fields">
            <input id="df-login-email" type="email" placeholder="Email" autocomplete="username" inputmode="email">
            <input id="df-login-pass" type="password" placeholder="Password" autocomplete="current-password">
          </div>
          <div class="df-login-actions">
            <button id="df-login-btn" class="df-btn-primary">Log In</button>
          </div>
        </div>
      </div>
    `;

    const go = ()=>{
      const email = String($('#df-login-email')?.value||'').trim();
      try{ if (email) localStorage.setItem('df_user', email); }catch{}
      location.hash = '#/home';
      // Let whatever renders home do its thing
      if (typeof window.DF?.renderHome === 'function') window.DF.renderHome();
      // show chrome again
      showChrome();
    };

    $('#df-login-btn')?.addEventListener('click', go);
    $('#df-login-pass')?.addEventListener('keydown', (e)=>{ if (e.key==='Enter') go(); });
  }

  // --- hide/show header/footer when on login ---
  function hideChrome(){
    const h = $('#header'); if (h) h.style.display = 'none';
    const f = $('#footer'); if (f) f.style.display = 'none';
  }
  function showChrome(){
    const h = $('#header'); if (h) h.style.display = '';
    const f = $('#footer'); if (f) f.style.display = '';
  }

  function maybeLoginMode(){
    const hash = (location.hash||'').replace(/\/+$/,'');
    if (hash === '#/login'){
      hideChrome();
      renderLoginCentered();
      return true;
    }
    showChrome();
    return false;
  }

  // init + listen for SPA nav
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', maybeLoginMode, {once:true});
  } else {
    maybeLoginMode();
  }
  window.addEventListener('hashchange', maybeLoginMode, {passive:true});
})();

/* ================= App v12 — Part 45: Home Route Restore + Header/Footer polish ================= */
(function DF_Part45_RouterAndChrome(){
  'use strict';
  if (window.__DF_P45__) return; window.__DF_P45__ = true;

  const $  = (s,r=document)=>r.querySelector(s);
  const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
  const app = ()=> $('#app');

  // ---- discover basics ----
  const APP_NAME = (window.DF && (window.DF.APP_NAME||window.DF.APPNAME)) ||
                   $('.brand-title')?.textContent?.trim() || 'Dowson Farms';
  const VERSION_SPAN = $('#version');

  // ---- header/footer CSS (smaller, green header) ----
  (function injectHF(){
    if ($('#df-p45-css')) return;
    const css = document.createElement('style');
    css.id = 'df-p45-css';
    css.textContent = `
      .site-head{ position:sticky; top:0; background:#0f4d1d; color:#fff; border-bottom:0; }
      .site-head .brand-title{ color:#fff; font-size:20px; }
      .site-head .brand-logo{ border:2px solid rgba(255,255,255,.2); }
      .site-head .head-inner{ min-height:54px; }
      .site-head .btn{ background:#fff; color:#0f4d1d; border:0; }
      .site-head .dot{ display:none; }
      .df-clock{ font-variant-numeric:tabular-nums; font-weight:600; opacity:.95; }
      .site-foot{ background:#efe9d0; border-top:1px solid rgba(0,0,0,.08); }
      .site-foot .foot-inner{ gap:12px; }
      @media (prefers-color-scheme: dark){
        .site-head{ background:#0c3c16; }
        .site-foot{ background:#141414; border-top:1px solid rgba(255,255,255,.08); }
      }
    `;
    document.head.appendChild(css);
  })();

  // ---- header clock (top-right) ----
  function ensureClock(){
    const actions = $('.head-actions');
    if (!actions) return;
    if (!$('#df-clock')){
      const s = document.createElement('span');
      s.id = 'df-clock';
      s.className = 'df-clock';
      // put clock before Logout button
      const logout = $('#logoutBtn', actions);
      actions.insertBefore(s, logout || null);
    }
    const el = $('#df-clock');
    const fmt = new Intl.DateTimeFormat(undefined, {hour:'numeric', minute:'2-digit'});
    el.textContent = fmt.format(new Date());
  }
  ensureClock();
  setInterval(ensureClock, 15000);

  // ---- footer date (September 10th 2025) ----
  function ordinal(n){
    const s = ['th','st','nd','rd'], v = n%100;
    return n + (s[(v-20)%10] || s[v] || s[0]);
  }
  function paintFooterDate(){
    const f = $('.site-foot .foot-inner'); if (!f) return;
    if (!$('#df-date')){
      const span = document.createElement('span');
      span.id = 'df-date';
      // insert just before version if present
      const v = $('#version');
      if (v && v.parentNode){ v.parentNode.insertBefore(span, v); 
        // add separator dot if you want spacing
        const dot = document.createElement('span'); dot.textContent = '•'; dot.setAttribute('aria-hidden','true');
        v.parentNode.insertBefore(dot, v);
      } else {
        f.appendChild(span);
      }
    }
    const d = new Date();
    const month = new Intl.DateTimeFormat(undefined, {month:'long'}).format(d);
    $('#df-date').textContent = `${month} ${ordinal(d.getDate())} ${d.getFullYear()}`;
  }
  paintFooterDate();

  // ---- hide/show chrome on login ----
  function setChromeVisible(show){
    const h = $('#header'); if (h) h.style.display = show ? '' : 'none';
    const ft = $('#footer'); if (ft) ft.style.display = show ? '' : 'none';
  }
  function maybeLoginChrome(){
    const h = (location.hash||'').replace(/\/+$/,'');
    if (h === '#/login'){ setChromeVisible(false); }
    else { setChromeVisible(true); }
  }
  window.addEventListener('hashchange', maybeLoginChrome, {passive:true});
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', maybeLoginChrome, {once:true});
  } else { maybeLoginChrome(); }

  // ---- safe Home renderer (only if none exists) ----
  function renderHomeFallback(){
    const root = app(); if (!root) return;
    root.innerHTML = `
      <section class="section">
        <h1>Home</h1>
        <p class="muted">Core ready. Your dashboard tiles will render here as we add them back.</p>
      </section>
    `;
  }
  if (!window.DF) window.DF = {};
  if (typeof window.DF.renderHome !== 'function'){
    window.DF.renderHome = renderHomeFallback;
  }

  // ---- tiny router shim to guarantee #/home works ----
  function routeShim(){
    const h = (location.hash||'').replace(/\/+$/,'') || '#/home';
    if (h === '#/' || h === '#' || h === '#/home'){
      try { window.DF.renderHome(); } catch { renderHomeFallback(); }
      return true;
    }
    return false;
  }
  // run once now; future navigations still handled by your main router
  routeShim();
  window.addEventListener('hashchange', ()=>routeShim(), {passive:true});

  // keep version text if you use it
  if (VERSION_SPAN && window.DF && window.DF.VERSION) VERSION_SPAN.textContent = window.DF.VERSION;
})();