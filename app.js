/* Dowson Farms — v11.1.0 (clean baseline)
   - Ensures #header, #app, #footer exist
   - Paints version in footer (#version)
   - Simple hash router (default -> #/home)
   - Logout goes to login.html if it exists, else shows a fallback login screen
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
  const esc = s => String(s??'').replace(/[&<>"']/g, m=>({ 
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#39;'
  }[m]));

  // ---------- Bootstrapping ----------
  function ensureShell(){
    // Header
    let header = $('#header');
    if (!header){
      header = document.createElement('header');
      header.id = 'header';
      header.className = 'app-header';
      header.innerHTML = `
        <div class="logo">
          <img src="${PATHS.logo}" alt="Logo">
          <span class="logo-text">${APP_NAME}</span>
        </div>
        <button id="logout" class="logout">Logout</button>
      `;
      document.body.prepend(header);
    }

    // Main app container
    let app = $('#app');
    if (!app){
      app = document.createElement('main');
      app.id = 'app';
      document.body.append(app);
    }

    // Footer
    let footer = $('#footer');
    if (!footer){
      footer = document.createElement('footer');
      footer.id = 'footer';
      footer.className = 'site-foot';
      footer.innerHTML = `
        <div class="container foot-inner">
          <span>© ${APP_NAME}</span>
          <span aria-hidden="true">•</span>
          <span id="version">${VERSION}</span>
        </div>
      `;
      document.body.append(footer);
    }
  }

  // ---------- Router ----------
  function route(){
    const hash = location.hash || '#/home';
    const app = $('#app');
    if (!app) return;

    if (hash === '#/home'){
      app.innerHTML = `
        <section class="section">
          <h1>Welcome to ${APP_NAME}</h1>
          <p>Version: ${VERSION}</p>
        </section>
      `;
    }
    else if (hash.startsWith('#/login')){
      renderLogin();
    }
    else {
      app.innerHTML = `<p>Page not found: ${esc(hash)}</p>`;
    }
  }

  // ---------- Login ----------
  function renderLogin(){
    const app = $('#app');
    if (!app) return;
    app.innerHTML = `
      <section class="section">
        <h1>Login</h1>
        <form id="login-form">
          <input type="email" placeholder="Email" required>
          <input type="password" placeholder="Password" required>
          <button type="submit" class="btn-primary">Log In</button>
        </form>
      </section>
    `;
    $('#login-form').addEventListener('submit', e=>{
      e.preventDefault();
      location.hash = '#/home';
    });
  }

  // ---------- Logout ----------
  function wireLogout(){
    const btn = $('#logout');
    if (!btn) return;
    btn.onclick = ()=>{
      // Prefer external login.html if it exists
      fetch(PATHS.loginPage, {method:'HEAD'}).then(r=>{
        if (r.ok) location.href = PATHS.loginPage;
        else location.hash = '#/login';
      }).catch(()=>{
        location.hash = '#/login';
      });
    };
  }

  // ---------- Kick ----------
  function kick(){
    ensureShell();
    $('#version').textContent = VERSION;
    wireLogout();
    route();
  }

  // Run immediately + on hashchange
  window.addEventListener('hashchange', route);
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', kick);
  } else {
    kick();
  }

})();