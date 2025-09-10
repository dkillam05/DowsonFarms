/* Dowson Farms — v11.1.2 (SPA baseline)
   - Ensures basic layout exists
   - Fills footer version
   - Simple hash router (#/home, #/login)
   - Logout uses hash route (no network 404s)
   - Normalizes any legacy links to login.html -> #/login
*/
(function DF_APP() {
  'use strict';
  if (window.__DF_APP_1112__) return; // idempotent guard
  window.__DF_APP_1112__ = true;

  // ---------- Config ----------
  const VERSION = 'v11.1.2';
  const APP_NAME = 'Dowson Farms';

  // ---------- Mini helpers ----------
  const $  = (s, r=document) => r.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[m]));

  function setVersion() {
    const vEl = $('#version');
    if (vEl) vEl.textContent = VERSION;
  }

  // ---------- Views ----------
  function viewHome() {
    $('#app').innerHTML = `
      <section class="section">
        <h1>Welcome to ${esc(APP_NAME)}</h1>
        <p class="muted">Version: ${esc(VERSION)}</p>

        <div class="grid" style="margin-top:16px;">
          <a class="tile" href="#/settings">
            <div class="tile-title">Settings</div>
            <div class="tile-desc">Farms &amp; Fields (coming back step-by-step)</div>
          </a>

          <a class="tile" href="#/feedback">
            <div class="tile-title">Feedback</div>
            <div class="tile-desc">Report an issue or suggest a feature</div>
          </a>
        </div>
      </section>
    `;
  }

  function viewLogin() {
    $('#app').innerHTML = `
      <section class="section">
        <h1>Login</h1>
        <form id="loginForm" class="form-row">
          <input id="loginEmail" type="email" placeholder="Email" autocomplete="email" />
          <input id="loginPass" type="password" placeholder="Password" autocomplete="current-password" />
          <button class="btn-primary" type="submit">Log In</button>
        </form>
      </section>
    `;

    $('#loginForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      // fake “login”
      try { localStorage.setItem('df_user', ($('#loginEmail').value || '').trim()); } catch {}
      location.hash = '#/home';
    });
  }

  // ---------- Router ----------
  const ROUTES = {
    '#/home':   viewHome,
    '#/login':  viewLogin,
  };

  function route() {
    const h = location.hash || '#/home';
    (ROUTES[h] || ROUTES['#/home'])();
  }

  // ---------- Header wiring ----------
  function wireHeader() {
    const btn = $('#logoutBtn');
    if (btn) {
      btn.setAttribute('href', '#/login');
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        try { localStorage.removeItem('df_user'); } catch {}
        location.hash = '#/login';
      });
    }
  }

  // ---------- Legacy link normalizer ----------
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href$="login.html"]');
    if (!a) return;
    e.preventDefault();
    location.hash = '#/login';
  }, true);

  // ---------- Boot ----------
  function start() {
    setVersion();
    wireHeader();
    route();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }

  window.addEventListener('hashchange', route);

})();