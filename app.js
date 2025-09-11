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
  const VERSION = 'v12.0.1';
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