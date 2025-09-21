/* ===========================
   Dowson Farms — core.js  (FULL REPLACEMENT)
   Purpose (safe, minimal, non-destructive):
   1) Logout button works from any page (no Firebase required)
      - Clears storage but preserves df_theme
      - Unregisters service workers
      - Redirects to auth/index.html using a robust path resolver
   2) Optional live clock (HH:MM AM/PM, America/Chicago)
      - Renders only if #df-clock (and/or #df-date) exists
      - Minute-synced
   3) Optional footer version + date
      - Reads window.DF_VERSION (from js/version.js) if present
      - Renders only if #df-version / #df-build-date exist

   This file avoids changing any other UI/logic.
   Keep <script defer src="js/version.js"></script> before this file if you want version to show.
   =========================== */

(function () {
  'use strict';

  /* ---------------------------------------
     Resolve absolute URL to /auth/index.html
     Works no matter which folder current page is in.
     We compute based on where THIS file (js/core.js) lives.
  ----------------------------------------*/
  function resolveAuthURL() {
    try {
      // Find the <script src=".../js/core.js">
      var scripts = document.getElementsByTagName('script');
      var src = null;
      for (var i = 0; i < scripts.length; i++) {
        var s = scripts[i].getAttribute('src') || '';
        if (/(^|\/)js\/core\.js(\?|#|$)/.test(s)) { src = s; break; }
      }
      // Fallback: if not found, assume relative "js/core.js"
      if (!src) src = 'js/core.js';

      // Build absolute URL for core.js, then hop to ../auth/index.html
      var coreAbs = new URL(src, window.location.href);
      var authAbs = new URL('../auth/index.html', coreAbs.href);
      return authAbs.href;
    } catch (e) {
      // Ultimate fallback
      return 'auth/index.html';
    }
  }

  /* ---------------------------------------
     LOGOUT (no Firebase)
     - Binds to #logout-btn and [data-action="logout"]
     - Clears storages (preserving df_theme), unregisters SW, redirects.
  ----------------------------------------*/
  function installLogout() {
    var targets = [];
    var byId = document.getElementById('logout-btn');
    if (byId) targets.push(byId);
    var byAttr = document.querySelectorAll('[data-action="logout"]');
    for (var i = 0; i < byAttr.length; i++) targets.push(byAttr[i]);
    if (!targets.length) return;

    var authURL = resolveAuthURL();

    function handleLogout(ev) {
      if (ev && ev.preventDefault) ev.preventDefault();

      // Preserve theme preference
      var keepTheme = null;
      try { keepTheme = localStorage.getItem('df_theme'); } catch (_) {}

      // Clear storage
      try { localStorage.clear(); } catch (_) {}
      try { sessionStorage.clear(); } catch (_) {}

      // Restore preserved preference
      try { if (keepTheme !== null) localStorage.setItem('df_theme', keepTheme); } catch (_) {}

      // Unregister any service workers, then redirect
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

    for (var j = 0; j < targets.length; j++) {
      targets[j].addEventListener('click', handleLogout, { passive: false });
    }
  }

  /* ---------------------------------------
     CLOCK (optional)
     - HH:MM AM/PM in America/Chicago
     - Renders if #df-clock exists
     - Friendly date if #df-date exists
  ----------------------------------------*/
  function installClock() {
    var clockEl = document.getElementById('df-clock');
    var dateEl  = document.getElementById('df-date');
    if (!clockEl && !dateEl) return; // no-op if not present

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

    // Minute-synced updates
    render();
    var now = new Date();
    var msToNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    setTimeout(function () {
      render();
      setInterval(render, 60 * 1000);
    }, Math.max(0, msToNextMinute));
  }

  /* ---------------------------------------
     VERSION + DATE (optional)
     - Renders if #df-version / #df-build-date exist
     - Uses window.DF_VERSION if defined (from js/version.js)
  ----------------------------------------*/
  function injectVersionAndBuildDate() {
    var verEl  = document.getElementById('df-version');
    var bdtEl  = document.getElementById('df-build-date');
    if (!verEl && !bdtEl) return;

    var version = (typeof window !== 'undefined' && window.DF_VERSION)
      ? String(window.DF_VERSION)
      : 'v0.0.0';

    if (verEl) {
      try { verEl.textContent = version; } catch (_) {}
    }
    if (bdtEl) {
      try {
        bdtEl.textContent = new Date().toLocaleDateString('en-US', {
          year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'America/Chicago'
        });
      } catch (_) {}
    }
  }

  /* ---------------------------------------
     DOM Ready
  ----------------------------------------*/
  document.addEventListener('DOMContentLoaded', function () {
    installLogout();
    installClock();
    injectVersionAndBuildDate();
  });
})();
