/* Dowson Farms — v11.1.1 (stable baseline + home tiles)
   - Ensures header/app/footer exist
   - Paints version in footer
   - Hash router (default #/home)
   - Logout → login.html if present, else inline login
   - NEW: Simple Home dashboard (Settings, Feedback) to prove routing
*/
(function DF_MAIN(){
  'use strict';
  if (window.__DF_MAIN_1111__) return;
  window.__DF_MAIN_1111__ = true;

  // ---------- Config ----------
  const VERSION = 'v11.1.1';
  const APP_NAME = 'Dowson Farms';
  const PATHS = { logo: 'icons/logo.png', loginPage: 'login.html' };

  // ---------- Helpers ----------
  const $  = (s, r=document)=>r.querySelector(s);
  const esc = s => String(s??'').replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#39;' }[m]));
  const joinBase = p => (window.__dfJoinBase ? window.__dfJoinBase(p) : p.replace(/^\//,''));
  function el(tag, attrs={}, html=''){
    const x = document.createElement(tag);
    Object.entries(attrs).forEach(([k,v])=>{
      if (v==null) return;
      if (k==='class') x.className = v;
      else if (k==='text') x.textContent = v;
      else x.setAttribute(k, v);
    });
    if (html) x.innerHTML = html;
    return x;
  }

  // ---------- Scaffolding (header/app/footer) ----------
  function ensureShell(){
    let head = $('#header');
    if (!head){
      head = el('header', {id:'header', class:'site-head'});
      head.innerHTML = `
        <div class="container bar">
          <a class="logo" href="#/home" aria-label="${esc(APP_NAME)}">
            <img src="${esc(PATHS.logo)}" alt="" width="40" height="40" loading="lazy">
          </a>
          <div class="brand">
            <h1>${esc(APP_NAME)}</h1>
            <span class="dot" aria-hidden="true">•</span>
          </div>
          <div class="logout">
            <button id="btnLogout" class="btn">Logout</button>
          </div>
        </div>`;
      document.body.prepend(head);
    }
    if (!$('#app')){
      const main = el('main', {id:'app', class:'container', role:'main'});
      document.body.insertBefore(main, $('#footer')||null);
    }
    if (!$('#footer')){
      const foot = el('footer', {id:'footer', class:'site-foot'});
      foot.innerHTML = `
        <div class="container foot-inner">
          <span>© Dowson Farms</span>
          <span aria-hidden="true">•</span>
          <span id="version">v0.0.0</span>
        </div>`;
      document.body.appendChild(foot);
    }
  }

  // ---------- Version paint ----------
  function paintVersion(){ const v = $('#version'); if (v) v.textContent = VERSION; }

  // ---------- Logout wiring ----------
  function wireLogout(){
    const btn = $('#btnLogout'); if (!btn) return;
    if (btn.dataset.wired) return;
    btn.dataset.wired = '1';
    btn.addEventListener('click', async ()=>{
      try { localStorage.removeItem('df_user'); } catch {}
      // Prefer hosted login.html under current sub-path
      const href = joinBase(PATHS.loginPage);
      // Cheap check: try HEAD request if fetch is available; otherwise just navigate
      try {
        if (window.fetch){
          const r = await fetch(href, { method:'HEAD', cache:'no-store' });
          if (r.ok) { location.href = href; return; }
        }
      } catch {}
      // Fallback: inline login screen
      location.hash = '#/login';
    });
  }

  // ---------- Views ----------
  function viewHome(){
    const app = $('#app'); if (!app) return;
    app.innerHTML = `
      <section class="section">
        <h2>Welcome to Dowson Farms</h2>
        <p>Version: ${esc(VERSION)}</p>

        <div class="tile-grid">
          <a class="tile" href="#/settings">
            <div class="t-title">Settings</div>
            <div class="t-sub">Farms & Fields (coming back step-by-step)</div>
          </a>
          <a class="tile" href="#/feedback">
            <div class="t-title">Feedback</div>
            <div class="t-sub">Report an issue or suggest a feature</div>
          </a>
        </div>
      </section>`;
  }

  function viewLoginInline(){
    const app = $('#app'); if (!app) return;
    app.innerHTML = `
      <section class="section">
        <h2>Login</h2>
        <form id="loginForm" class="stack" style="max-width:520px;">
          <input type="email" placeholder="Email" required>
          <div style="display:flex; gap:8px; align-items:center;">
            <input type="password" placeholder="Password" required style="flex:1;">
            <button class="btn-primary" type="submit">Log In</button>
          </div>
        </form>
      </section>`;
    $('#loginForm')?.addEventListener('submit', (e)=>{
      e.preventDefault();
      try { localStorage.setItem('df_user', 'demo@user'); } catch {}
      location.hash = '#/home';
    });
  }

  function viewSettingsStub(){
    const app = $('#app'); if (!app) return;
    app.innerHTML = `
      <section class="section">
        <h2>Settings</h2>
        <p class="muted">This is a placeholder. Next steps will restore Farms and Fields here.</p>
        <p><a class="btn" href="#/home">Back to Home</a></p>
      </section>`;
  }

  function viewFeedbackStub(){
    const app = $('#app'); if (!app) return;
    app.innerHTML = `
      <section class="section">
        <h2>Feedback</h2>
        <p class="muted">This is a placeholder. We’ll bring back Main/Sub/Category next.</p>
        <p><a class="btn" href="#/home">Back to Home</a></p>
      </section>`;
  }

  // ---------- Router ----------
  function route(){
    const h = (location.hash||'').replace(/^#/, '');
    if (!h || h==='/') { location.replace('#/home'); return; }
    const path = h.split('?')[0];

    switch (path) {
      case '/home':     viewHome(); break;
      case '/login':    viewLoginInline(); break;
      case '/settings': viewSettingsStub(); break;
      case '/feedback': viewFeedbackStub(); break;
      default:          viewHome(); break;
    }
    wireLogout();
    paintVersion();
    window.scrollTo(0,0);
  }

  // ---------- Boot ----------
  function boot(){
    ensureShell();
    paintVersion();
    route();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once:true });
  } else {
    boot();
  }
  window.addEventListener('hashchange', route);
})();
</script>