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
  const VERSION = 'v12.2.5';

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


/* ============================================
   Part 4 — Auth (Logout/Login + Chrome toggle)
   ============================================ */
(function DF_V12_P4_AUTH(){
  'use strict';
  if (window.__DF_V12_P4__) return; window.__DF_V12_P4__ = true;
  const { APP, $, appRoot } = window.DF;

  function renderLoginInline(){
    location.hash = '#/login';
    const root = appRoot(); if (!root) return;
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
      try{
        const email = String($('#li-email')?.value||'').trim();
        if (email) localStorage.setItem('df_user', email);
      }catch{}
      window.DF.routeGo('#/home');
    });
  }

  function doLogout(){
    try{ localStorage.removeItem('df_user'); sessionStorage.clear(); }catch{}
    fetch(APP.loginPage, {method:'HEAD'})
      .then(r => { if (r.ok) location.href = APP.loginPage; else renderLoginInline(); })
      .catch(()=> renderLoginInline());
  }

  function wireLogout(){
    const btn = $('#logoutBtn') || Array.from(document.querySelectorAll('button,a')).find(b=>(b.textContent||'').trim().toLowerCase()==='logout');
    if (!btn || btn.dataset.dfWired==='1') return;
    btn.dataset.dfWired='1';
    btn.addEventListener('click', (e)=>{ e.preventDefault(); doLogout(); });
  }

  // Hide header/footer on login route
  function toggleChrome(){
    const isLogin = (location.hash||'').replace(/\/+$/,'') === '#/login';
    const head = $('#header'); const foot = $('#footer');
    if (head) head.style.display = isLogin ? 'none' : '';
    if (foot) foot.style.display = isLogin ? 'none' : '';
  }

  window.addEventListener('hashchange', ()=>{ wireLogout(); toggleChrome(); }, {passive:true});
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', ()=>{ wireLogout(); toggleChrome(); }, {once:true});
  } else { wireLogout(); toggleChrome(); }

  // Expose just in case other parts need it
  window.DF.renderLoginInline = renderLoginInline;
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


/* =======================
   Part 8 — Boot sequence
   ======================= */
(function DF_V12_P8_BOOT(){
  'use strict';
  if (window.__DF_V12_P8__) return; window.__DF_V12_P8__ = true;

  // First paint (router core listens and will render the route)
  if (!location.hash) location.hash = '#/home';
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