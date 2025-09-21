/* ===========================
   Dowson Farms — core.js  (FULL REPLACEMENT)
   - Logout (no Firebase; clears storage but preserves df_theme; unregisters SW; redirects)
   - Clock (HH:MM AM/PM, America/Chicago)
   - Version/Build Date injection
   - Global Logout button injected on all pages (top-right header)
   =========================== */

(function () {
  'use strict';

  /* ---------------------------------------
     Resolve /auth/index.html respecting <base>
  ----------------------------------------*/
  function resolveAuthURL() {
    try {
      return new URL('auth/index.html', document.baseURI).href;
    } catch (e) {
      return 'auth/index.html';
    }
  }

  function resolveURL(rel) {
    try { return new URL(rel, document.baseURI).href; }
    catch (_) { return rel; }
  }

  /* ---------------------------------------
     LOGOUT HANDLER
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
     INJECT LOGOUT BUTTON (always visible)
  ----------------------------------------*/
  function injectLogoutButton() {
    var header = document.querySelector('.app-header');
    if (!header || document.getElementById('logout-btn')) return;

    var btn = document.createElement('button');
    btn.id = 'logout-btn';
    btn.textContent = 'Logout';

    btn.setAttribute('style', [
      'margin-left:12px',
      'padding:6px 14px',
      'font-size:15px',
      'font-weight:600',
      'border-radius:8px',
      'border:2px solid var(--brand-green)',
      'background:#fff',
      'color:var(--brand-green)',
      'cursor:pointer',
      'box-shadow:0 2px 4px rgba(0,0,0,.08)'
    ].join(';'));

    btn.addEventListener('click', handleLogout, { passive: false });

    // Insert on right side of header
    var right = header.querySelector('.app-header__right');
    if (right) {
      right.appendChild(btn);
    } else {
      header.appendChild(btn);
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
     DOM Ready
  ----------------------------------------*/
  document.addEventListener('DOMContentLoaded', function () {
    injectLogoutButton();
    installClock();
    injectVersionAndBuildDate();
  });
})();