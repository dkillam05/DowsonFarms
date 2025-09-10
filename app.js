<script>
/* Dowson Farms — v11.1.0 (clean baseline)
   - Idempotent: safe to include once; protects against double init
   - Ensures #header, #app, #footer exist
   - Paints version in footer
   - Simple hash router (default -> #/home)
   - Logout goes to login.html if it exists, else shows a built-in login screen
*/
(function DF_MAIN(){
  'use strict';
  if (window.__DF_MAIN_1110__) return;
  window.__DF_MAIN_1110__ = true;

  // ---------- Config ----------
  const VERSION = 'v11.1.0';
  const APP_NAME = 'Dowson Farms';
  const PATHS = {
    logo: 'icons/logo.png',
    loginPage: 'login.html'
  };

  // ---------- Tiny helpers ----------
  const $  = (s, r=document)=>r.querySelector(s);
  const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));
  const esc = s => String(s??'').replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#39;' }[m]));

  // Detect if a URL likely exists (best effort, no network): we’ll just see if an <a> can be resolved
  function urlLikelyExists(path){
    try{
      const a = document.createElement('a'); a.href = path;
      // if it resolves to same origin path, assume ok for our static site
      return a.href.includes(location.origin);
    }catch{ return false; }
  }

  // ---------- DOM: ensure shells ----------
  function ensureHeader(){
    let h = $('#header');
    if (!h){
      h = document.createElement('header');
      h.id = 'header';
      h.className = 'site-head';
      h.innerHTML = `
        <div class="container" style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:#1c6628;color:#fff;">
          <img src="${esc(PATHS.logo)}" alt="Logo" width="44" height="44" style="border-radius:50%;object-fit:cover;box-shadow:0 0 0 2px rgba(0,0,0,.2)">
          <h1 id="df-title" style="font:600 22px/1.2 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;margin:0;flex:1 1 auto;">${esc(APP_NAME)}</h1>
          <button id="df-logout" class="btn" style="background:#fff;color:#111;border:0;border-radius:10px;padding:10px 16px;font-weight:600;">Logout</button>
        </div>`;
      document.body.insertBefore(h, document.body.firstChild);
    } else {
      // keep title & button wired even if header pre-exists
      if (!$('#df-title', h)) {
        const title = document.createElement('h1');
        title.id = 'df-title'; title.textContent = APP_NAME;
        h.appendChild(title);
      }
      if (!$('#df-logout', h)) {
        const btn = document.createElement('button');
        btn.id = 'df-logout'; btn.textContent = 'Logout';
        btn.className = 'btn';
        btn.style.cssText = "background:#fff;color:#111;border:0;border-radius:10px;padding:10px 16px;font-weight:600;";
        h.appendChild(btn);
      }
    }
  }

  function ensureApp(){
    let app = $('#app');
    if (!app){
      app = document.createElement('main');
      app.id = 'app';
      document.body.appendChild(app);
    }
  }

  function ensureFooter(){
    let f = $('#footer');
    if (!f){
      f = document.createElement('footer');
      f.id = 'footer';
      f.className = 'site-foot';
      f.innerHTML = `
        <div class="container" style="padding:18px 12px;text-align:center;color:#666;font:500 14px system-ui,-apple-system,Segoe UI,Roboto,sans-serif;">
          © Dowson Farms <span id="version" style="margin-left:.35rem;opacity:.9"></span>
        </div>`;
      document.body.appendChild(f);
    }
    const v = $('#version', f);
    if (v) v.textContent = VERSION;
  }

  // ---------- Views ----------
  function viewHome(){
    const app = $('#app');
    app.innerHTML = `
      <section class="section" style="padding:18px 14px;">
        <p style="margin:0;color:#334;opacity:.9">Welcome to ${esc(APP_NAME)}.</p>
      </section>`;
  }

  function viewLoginBuiltIn(){
    const app = $('#app');
    app.innerHTML = `
      <section class="section" style="padding:18px 14px;">
        <h2 style="margin:0 0 12px 0;">Sign in</h2>
        <p class="muted" style="margin:0 0 10px 0;color:#555">This is a minimal in-app login screen (used when <code>login.html</code> is not present).</p>
        <div style="display:grid;gap:8px;max-width:360px;">
          <input id="li-email" type="email" placeholder="Email" style="padding:10px;border:1px solid #ccc;border-radius:8px;">
          <input id="li-pass" type="password" placeholder="Password" style="padding:10px;border:1px solid #ccc;border-radius:8px;">
          <button id="li-go" class="btn-primary" style="padding:10px 14px;border:0;border-radius:10px;background:#1c6628;color:#fff;font-weight:600;">Continue</button>
        </div>
      </section>`;
    $('#li-go')?.addEventListener('click', ()=>{
      try{ localStorage.setItem('df_logged_in','1'); }catch{}
      location.hash = '#/home';
    });
  }

  // ---------- Router ----------
  function route(){
    const h = (location.hash||'').replace(/^#!/,'#');
    if (!h || h === '#' || h === '#/' || h === '#/home'){
      viewHome();
    } else if (h === '#/login'){
      // Prefer external login.html if it’s there, otherwise fallback view
      if (urlLikelyExists(PATHS.loginPage)){
        // do a hard navigation so the static login page can load
        location.href = PATHS.loginPage;
        return;
      }
      viewLoginBuiltIn();
    } else {
      // unknown -> home
      location.replace('#/home');
    }
  }

  function ensureHash(){
    if (!location.hash){
      location.replace('#/home');
      return true;
    }
    return false;
  }

  // ---------- Logout wiring ----------
  function wireLogout(){
    $('#df-logout')?.addEventListener('click', ()=>{
      try{
        localStorage.removeItem('df_logged_in');
      }catch{}
      // Prefer external login.html when available
      if (urlLikelyExists(PATHS.loginPage)){
        location.href = PATHS.loginPage;
      } else {
        location.hash = '#/login';
      }
    }, { once: true });
  }

  // ---------- Boot ----------
  function boot(){
    ensureHeader();
    ensureApp();
    ensureFooter();
    // First route
    if (!ensureHash()) route();

    // Events
    window.addEventListener('hashchange', route);
    document.addEventListener('click', (e)=>{
      // Re-wire logout if header re-rendered by other code
      if (!$('#df-logout') || !$('#df-logout').__wired){
        const btn = $('#df-logout');
        if (btn && !btn.__wired){ wireLogout(); btn.__wired = true; }
      }
    });
    // Initial logout wire
    const btn = $('#df-logout');
    if (btn && !btn.__wired){ wireLogout(); btn.__wired = true; }

    // Expose minimal API (optional)
    window.DF = Object.assign(window.DF||{}, {
      VERSION,
      route,
      navigate: (hash)=>{ location.hash = hash; },
    });
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot, { once:true });
  } else {
    boot();
  }
})();
</script>