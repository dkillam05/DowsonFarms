/* ===========================
   Dowson Farms — core.js  (FULL REPLACEMENT)
   - Logout (no Firebase; clears storage but preserves df_theme; unregisters SW; redirects)
   - Clock (HH:MM AM/PM, America/Chicago) → supports #clock and #df-clock
   - Version/Build Date → supports #version/#df-version and #report-date/#df-build-date
   - Back button (in-flow inside .content, above footer; hidden on true home)
   - NEW: Logout button injected into the Breadcrumb bar (right-aligned) on EVERY page
          (larger size, app-green color; does not crowd the header)
   - Honors <base href="/DowsonFarms/">
   =========================== */

(function () {
  'use strict';

  /* ---------------------------------------
     URL helpers
  ----------------------------------------*/
  function resolveAuthURL() {
    try {
      return new URL('auth/index.html', document.baseURI).href;
    } catch (_) {
      return 'auth/index.html';
    }
  }
  function resolveURL(rel) {
    try { return new URL(rel, document.baseURI).href; }
    catch (_) { return rel; }
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
  function getHomeURL() {
    return getRepoRootPath() + 'index.html';
  }
  function isHome() {
    var p = window.location.pathname.replace(/\/+$/, '');
    var seg = p.split('/').filter(Boolean);
    if (seg.length === 0) return true;                         // "/"
    if (seg.length === 1 && seg[0] === 'index.html') return true;
    if (seg.length === 1) return true;                         // "/<repo>"
    if (seg.length === 2 && seg[1] === 'index.html') return true; // "/<repo>/index.html"
    return false;
  }

  /* ---------------------------------------
     LOGOUT (no Firebase)
  ----------------------------------------*/
  function handleLogout(ev) {
    if (ev && ev.preventDefault) ev.preventDefault();

    var authURL = resolveAuthURL();
    var keepTheme = null;
    try { keepTheme = localStorage.getItem('df_theme'); } catch (_) {}

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
    } catch (_) {
      go();
    }
  }

  /* ---------------------------------------
     Inject Logout BUTTON into Breadcrumb bar
     - Right-aligned, slightly larger, app-green color
     - Appears on ALL pages that have .breadcrumbs
     - Adds right padding to bar so it never overlaps text
  ----------------------------------------*/
  function injectBreadcrumbLogout() {
    var bc = document.querySelector('nav.breadcrumbs');
    if (!bc) return;
    if (bc.querySelector('#logout-btn')) return;

    // Ensure the bar can anchor an absolutely-positioned child
    var prevPos = (bc.style && bc.style.position) || '';
    if (getComputedStyle(bc).position === 'static') {
      bc.style.position = 'relative';
    }

    // Reserve space on the right so breadcrumb text doesn't run under the button
    var pr = parseInt(getComputedStyle(bc).paddingRight || '0', 10);
    var needed = 110; // width allowance for the button
    if (pr < needed) bc.style.paddingRight = needed + 'px';

    // Container (absolute right, vertically centered)
    var host = document.createElement('div');
    host.id = 'df-logout-host';
    host.setAttribute('style', [
      'position:absolute',
      'right:12px',
      'top:50%',
      'transform:translateY(-50%)',
      'display:flex',
      'align-items:center',
      'gap:8px',
      'z-index:2'
    ].join(';'));

    // Button
    var btn = document.createElement('button');
    btn.id = 'logout-btn';
    btn.type = 'button';
    btn.textContent = 'Logout';
    btn.setAttribute('aria-label', 'Log out');

    var brand = 'var(--brand-green, #1B5E20)';
    btn.setAttribute('style', [
      'padding:8px 16px',
      'font-size:15px',
      'font-weight:700',
      'line-height:1',
      'border-radius:10px',
      'border:2px solid ' + brand,
      'background:#fff',
      'color:' + brand,
      'cursor:pointer',
      'box-shadow:0 2px 6px rgba(0,0,0,.08)',
      'touch-action:manipulation',
      '-webkit-tap-highlight-color:transparent'
    ].join(';'));

    // Dark mode tweak
    if (document.documentElement.getAttribute('data-theme') === 'dark') {
      btn.style.background = '#15181b';
      btn.style.color = '#dff1e1';
      btn.style.borderColor = '#2d7b35';
    }

    btn.addEventListener('click', handleLogout, { passive: false });

    host.appendChild(btn);
    bc.appendChild(host);

    // If we modified inline position, restore it on unload (safety)
    if (!prevPos) {
      window.addEventListener('unload', function(){ try { bc.style.position = ''; } catch(_){}; });
    }
  }

  /* ---------------------------------------
     CLOCK
  ----------------------------------------*/
  function installClock() {
    var clockEl = document.getElementById('clock') || document.getElementById('df-clock');
    var dateEl  = document.getElementById('report-date') || document.getElementById('df-date');
    if (!clockEl && !dateEl) return;

    var tz = 'America/Chicago';

    function render() {
      var now = new Date();
      if (clockEl) {
        clockEl.textContent = now.toLocaleTimeString('en-US', {
          hour: 'numeric', minute: '2-digit', hour12: true, timeZone: tz
        });
      }
      if (dateEl) {
        dateEl.textContent = now.toLocaleDateString('en-US', {
          weekday: 'short', month: 'short', day: '2-digit', year: 'numeric', timeZone: tz
        });
      }
    }

    render();
    var now = new Date();
    var msToNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    setTimeout(function () {
      render();
      setInterval(render, 60000);
    }, Math.max(0, msToNextMinute));
  }

  /* ---------------------------------------
     VERSION + BUILD DATE
  ----------------------------------------*/
  function injectVersionAndBuildDate() {
    var verEl = document.getElementById('version') || document.getElementById('df-version');
    var buildDateEl = document.getElementById('df-build-date') || null;

    var version = (typeof window !== 'undefined' && window.DF_VERSION)
      ? String(window.DF_VERSION)
      : 'v0.0.0';

    if (verEl) {
      try { verEl.textContent = version; } catch (_) {}
    }

    if (buildDateEl) {
      try {
        buildDateEl.textContent = new Date().toLocaleDateString('en-US', {
          year: 'numeric', month: '2-digit', day: '2-digit',
          timeZone: 'America/Chicago'
        });
      } catch (_) {}
    }
  }

  /* ---------------------------------------
     Back Button (in-flow inside .content)
     - Always sits ABOVE the footer (accounts for footer height)
     - Hidden on true home page
     - On menu/grid pages (.df-tiles[data-section]) → go to repo-root Home
       Else → history.back() or Home fallback
  ----------------------------------------*/
  function installBackButtonFlow() {
    if (document.getElementById('df-back-flow')) return;
    if (isHome()) return;

    var content = document.querySelector('.content') || document.body;

    var host = document.createElement('div');
    host.id = 'df-back-flow';
    host.setAttribute('style','margin:12px 16px; text-align:left;');

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = '← Back';
    btn.setAttribute('style', [
      'font: inherit',
      'font-weight:600',
      'padding:8px 14px',
      'border-radius:10px',
      'border:2px solid var(--brand-green, #1B5E20)',
      'background:#fff',
      'color:#222',
      'box-shadow:0 2px 6px rgba(0,0,0,.08)',
      'cursor:pointer'
    ].join(';'));

    if (document.documentElement.getAttribute('data-theme') === 'dark') {
      btn.style.background = '#15181b';
      btn.style.color = '#eaeaea';
      btn.style.borderColor = '#2d7b35';
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
      } catch (_) {
        host.style.marginBottom = '12px';
      }
    }
    pushAboveFooter();
    window.addEventListener('resize', pushAboveFooter);
    window.addEventListener('orientationchange', pushAboveFooter);
  }

  /* ---------------------------------------
     DOM Ready
  ----------------------------------------*/
  document.addEventListener('DOMContentLoaded', function () {
    injectBreadcrumbLogout();   // new location for Logout
    installClock();
    injectVersionAndBuildDate();
    installBackButtonFlow();
  });

  /* ---------------------------------------
     Also bind any existing logout triggers declared in HTML
     (kept for backward compatibility)
  ----------------------------------------*/
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t) return;
    if (t.id === 'logout-btn' || t.matches('[data-action="logout"], .logout')) {
      // Our injected #logout-btn already has a handler, but this keeps legacy anchors working.
      if (!t.__dfLogoutBound) {
        t.__dfLogoutBound = true;
        handleLogout(e);
      }
    }
  }, { passive: false });

})();