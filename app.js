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
  const VERSION = 'v12.2.2';

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