/* ===========================
   /js/core.js  (FULL REPLACEMENT)
   - Logout (no Firebase; preserves df_theme; unregisters SW; redirects)
   - Clock (America/Chicago)
   - Version/Build Date injection
   - Back button (in-flow above footer) — HIDDEN on home and on /auth/*
   - Logout button in Breadcrumb bar (right-aligned, consistent everywhere)
   - Honors <base href="/DowsonFarms/">

   ADDITIONS:
   - Auth guard for all non-auth pages (waits for Firebase, redirects to /auth/index.html)
   - Fix resolveAuthURL() to always build from repo root (prevents 404 in nested pages)
   - Best-effort persistence = LOCAL (stay signed in across app restarts)
   - Monthly forced logout (configurable)
   - Bounce to login immediately if auth state becomes null
   =========================== */

(function () {
  'use strict';

  /* ---------- URL helpers ---------- */
  function resolveAuthURL() {
    // Always compute from repo root so nested pages never point to "folder/auth/index.html"
    return getRepoRootPath() + 'auth/index.html';
  }
  function getRepoRootPath() {
    var baseEl = document.querySelector('base');
    if (baseEl && baseEl.href) {
      try {
        var u = new URL(baseEl.href);
        return u.pathname.endsWith('/') ? u.pathname : (u.pathname + '/');
      } catch (_) {}
    }
    var seg = (window.location.pathname || '/').split('/').filter(Boolean);
    if (seg.length > 0) return '/' + seg[0] + '/';
    return '/';
  }
  function getHomeURL() { return getRepoRootPath() + 'index.html'; }

  function isHome() {
    var p = window.location.pathname.replace(/\/+$/, '');
    var seg = p.split('/').filter(Boolean);
    if (seg.length === 0) return true;                         // "/"
    if (seg.length === 1 && seg[0] === 'index.html') return true;
    if (seg.length === 1) return true;                         // "/<repo>"
    if (seg.length === 2 && seg[1] === 'index.html') return true; // "/<repo>/index.html"
    return false;
  }
  function isAuthPage() {
    var p = window.location.pathname.toLowerCase();
    return /\/auth(\/|$)/.test(p);
  }

  /* ---------- LOGOUT ---------- */
  function handleLogout(ev) {
    if (ev && ev.preventDefault) ev.preventDefault();

    var authURL = resolveAuthURL();
    var keepTheme = null;
    try { keepTheme = localStorage.getItem('df_theme'); } catch (_) {}

    // Try to sign out of Firebase too (best-effort, no dependency)
    try { if (window.DF_FB_API && typeof window.DF_FB_API.signOut === 'function') { window.DF_FB_API.signOut().catch(function(){}); } } catch (_) {}

    try { localStorage.clear(); } catch (_) {}
    try { sessionStorage.clear(); } catch (_) {}
    try { if (keepTheme !== null) localStorage.setItem('df_theme', keepTheme); } catch (_) {}

    function go() {
      try { window.location.replace(authURL); }
      catch (_) { window.location.href = authURL; }
    }

    try {
      if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) {
        navigator.serviceWorker.getRegistrations()
          .then(function (regs) {
            var ops = [];
            for (var i = 0; i < regs.length; i++) ops.push(regs[i].unregister());
            return Promise.allSettled(ops);
          })
          .then(go)
          .catch(go);
      } else {
        go();
      }
    } catch (_) { go(); }
  }

  /* ---------- Breadcrumb Logout (consistent, small) ---------- */
  function injectBreadcrumbLogout() {
    var bc = document.querySelector('nav.breadcrumbs, .breadcrumbs');
    if (!bc) return;

    // Remove any link-style logout in the breadcrumbs
    var old = bc.querySelectorAll('#logout-btn, [data-action="logout"], .logout, a[href*="logout"]');
    for (var i = 0; i < old.length; i++) if (bc.contains(old[i])) old[i].remove();

    // Position host
    var cs = getComputedStyle(bc);
    if (cs.position === 'static') bc.style.position = 'relative';
    var pr = parseInt(cs.paddingRight || '0', 10);
    var needed = 100;
    if (pr < needed) bc.style.paddingRight = needed + 'px';
    if (bc.querySelector('#df-logout-host')) return;

    var host = document.createElement('div');
    host.id = 'df-logout-host';
    host.setAttribute('style', [
      'position:absolute','right:12px','top:50%','transform:translateY(-50%)',
      'display:flex','align-items:center','z-index:2'
    ].join(';'));

    var brand = getComputedStyle(document.documentElement).getPropertyValue('--brand-green').trim() || '#1B5E20';

    var btn = document.createElement('button');
    btn.id = 'logout-btn';
    btn.type = 'button';
    btn.textContent = 'Logout';
    btn.setAttribute('aria-label', 'Log out');
    btn.setAttribute('style', [
      'padding:5px 10px',
      'font-size:12px',
      'font-weight:700',
      'line-height:1',
      'border-radius:8px',
      'border:2px solid ' + brand,
      'background:#fff',
      'color:' + brand,
      'cursor:pointer',
      'box-shadow:0 1px 4px rgba(0,0,0,.08)',
      'touch-action:manipulation',
      '-webkit-tap-highlight-color:transparent'
    ].join(';'));

    if ((document.documentElement.getAttribute('data-theme') || '').toLowerCase() === 'dark') {
      btn.style.background = '#15181b';
      btn.style.color = '#dff1e1';
      btn.style.borderColor = '#2d7b35';
    }

    btn.addEventListener('click', handleLogout, { passive: false });
    host.appendChild(btn);
    bc.appendChild(host);
  }

  /* ---------- Clock ---------- */
  function installClock() {
    var clockEl = document.getElementById('clock') || document.getElementById('df-clock');
    var dateEl  = document.getElementById('report-date') || document.getElementById('df-date');
    if (!clockEl && !dateEl) return;

    var tz = 'America/Chicago';
    function render() {
      var now = new Date();
      if (clockEl) clockEl.textContent = now.toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit', hour12: true, timeZone: tz
      });
      if (dateEl) dateEl.textContent = now.toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: '2-digit', year: 'numeric', timeZone: tz
      });
    }
    render();
    var now = new Date();
    var msToNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    setTimeout(function () { render(); setInterval(render, 60000); }, Math.max(0, msToNextMinute));
  }

  /* ---------- Version + Build Date ---------- */
  function injectVersionAndBuildDate() {
    var verEl = document.getElementById('version') || document.getElementById('df-version');
    var buildDateEl = document.getElementById('df-build-date') || null;
    var version = (typeof window !== 'undefined' && window.DF_VERSION) ? String(window.DF_VERSION) : 'v0.0.0';
    if (verEl) { try { verEl.textContent = version; } catch (_) {} }
    if (buildDateEl) {
      try {
        buildDateEl.textContent = new Date().toLocaleDateString('en-US', {
          year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'America/Chicago'
        });
      } catch (_) {}
    }
  }

  /* ---------- Back Button (skip home + login) ---------- */
  function installBackButtonFlow() {
    if (document.getElementById('df-back-flow')) return;
    if (isHome() || isAuthPage()) return; // ← hide on login/auth pages and true home

    var content = document.querySelector('.content') || document.body;

    var host = document.createElement('div');
    host.id = 'df-back-flow';
    host.setAttribute('style','margin:12px 16px; text-align:left;');

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = '← Back';
    btn.setAttribute('style', [
      'font: inherit','font-weight:600','padding:8px 14px',
      'border-radius:10px','border:2px solid var(--brand-green, #1B5E20)',
      'background:#fff','color:#222','box-shadow:0 2px 6px rgba(0,0,0,.08)','cursor:pointer'
    ].join(';'));
    if ((document.documentElement.getAttribute('data-theme') || '').toLowerCase() === 'dark') {
      btn.style.background = '#15181b'; btn.style.color = '#eaeaea'; btn.style.borderColor = '#2d7b35';
    }

    var isMenuGrid = !!document.querySelector('.df-tiles[data-section]');
    btn.addEventListener('click', function () {
      if (isMenuGrid) {
        var home = getHomeURL();
        var homePath = new URL(home, window.location.href).pathname;
        var herePath = window.location.pathname;
        if (homePath === herePath) {
          var buster = (home.indexOf('?') > -1 ? '&' : '?') + 'r=' + Date.now();
          window.location.replace(home + buster);
        } else {
          window.location.assign(home);
        }
      } else if (document.referrer && window.history.length > 1) {
        window.history.back();
      } else {
        window.location.assign(getHomeURL());
      }
    });

    host.appendChild(btn);
    content.appendChild(host);

    function pushAboveFooter() {
      try {
        var footer = document.querySelector('footer, .app-footer');
        var h = footer ? Math.ceil(footer.getBoundingClientRect().height) : 0;
        host.style.marginBottom = (h ? (h + 12) : 12) + 'px';
      } catch (_) { host.style.marginBottom = '12px'; }
    }
    pushAboveFooter();
    window.addEventListener('resize', pushAboveFooter);
    window.addEventListener('orientationchange', pushAboveFooter);
  }

   /* ---------- Auth Guard (fixed) ---------- */
  function installAuthGuard() {
    // Skip guard on auth pages and true home screen
    if (isAuthPage() || isHome()) return;

    var MAX_TRIES = 150; // wait up to ~12s (mobile-friendly)
    var tries = 0;

    function bounceToLogin() {
      var url = resolveAuthURL();
      try { window.location.replace(url); } catch (_) { window.location.href = url; }
    }

    function recordHeartbeat() {
      try { localStorage.setItem('df_last_auth_ok', String(Date.now())); } catch (_) {}
    }

    // Force sign-out once every N days — ONLY if we’ve ever recorded a heartbeat
    var FORCE_LOGOUT_DAYS = 30;
    try {
      var raw = localStorage.getItem('df_last_auth_ok');
      if (raw) { // <-- only enforce if key exists
        var last = parseInt(raw, 10);
        if (!isNaN(last)) {
          var ms = Date.now() - last;
          if (ms > FORCE_LOGOUT_DAYS * 24 * 60 * 60 * 1000) {
            handleLogout(); // will redirect to /auth
            return;
          }
        }
      }
    } catch (_) {}

    function subscribeAuth() {
      if (!window.DF_FB_API || typeof window.DF_FB_API.onAuth !== 'function') return false;

      // Best-effort: set LOCAL persistence so sessions stick on phones
      try {
        if (typeof window.DF_FB_API.setPersistence === 'function') {
          window.DF_FB_API.setPersistence(true).catch(function(){});
        }
      } catch (_) {}

      // Only redirect AFTER we actually hear from Firebase once
      var gotFirstAuthCallback = false;

      window.DF_FB_API.onAuth(function (user) {
        gotFirstAuthCallback = true;
        if (user) {
          recordHeartbeat();
        } else {
          bounceToLogin();
        }
      });

      // Safety: if we never get a callback (SDK didn’t init), fall back later
      setTimeout(function(){
        if (!gotFirstAuthCallback) bounceToLogin();
      }, 12000); // matches MAX_TRIES

      return true;
    }

    (function waitForFirebase() {
      tries++;
      // Need both handles (firebase-init.js must have run)
      if (!window.DF_FB || !window.DF_FB_API || !window.DF_FB.auth) {
        if (tries < MAX_TRIES) return setTimeout(waitForFirebase, 80);
        // Firebase never showed up → go to login
        return bounceToLogin();
      }

      // Firebase is present → subscribe (don’t redirect yet; wait for onAuth)
      if (!subscribeAuth()) {
        if (tries < MAX_TRIES) return setTimeout(waitForFirebase, 80);
        return bounceToLogin();
      }

      // If already logged in right now, stamp heartbeat immediately
      try { if (window.DF_FB.auth.currentUser) recordHeartbeat(); } catch (_) {}
    })();
  }

  /* ---------- DOM Ready ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    injectBreadcrumbLogout();
    installClock();
    injectVersionAndBuildDate();
    installBackButtonFlow();
    installAuthGuard(); // ← added
  });

  /* Keep legacy logout triggers working anywhere */
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t) return;
    if (t.matches('[data-action="logout"], .logout')) { e.preventDefault(); handleLogout(e); }
  }, { passive: false });

})();