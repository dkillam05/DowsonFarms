/* ===========================
   Dowson Farms — core.js  (FULL REPLACEMENT)
   - Logout (no Firebase; clears storage but preserves df_theme; unregisters SW; redirects)
   - Clock (HH:MM AM/PM, America/Chicago) → supports #clock and #df-clock
   - Footer version/date injection → supports #version/#df-version and #report-date/#df-build-date
   - Honors <base href="/DowsonFarms/"> so relative redirects work anywhere
   =========================== */

(function () {
  'use strict';

  /* ---------------------------------------
     Resolve /auth/index.html respecting <base>
  ----------------------------------------*/
  function resolveAuthURL() {
    try {
      // If a <base> is present, document.baseURI points at it; this keeps paths correct on GitHub Pages.
      return new URL('auth/index.html', document.baseURI).href;
    } catch (e) {
      // Fallbacks if baseURI is unavailable for any reason
      try {
        // Compute relative to where core.js lives
        var scripts = document.getElementsByTagName('script');
        var src = null;
        for (var i = 0; i < scripts.length; i++) {
          var s = scripts[i].getAttribute('src') || '';
          if (/(^|\/)js\/core\.js(\?|#|$)/.test(s)) { src = s; break; }
        }
        if (!src) src = 'js/core.js';
        var coreAbs = new URL(src, window.location.href);
        return new URL('../auth/index.html', coreAbs.href).href;
      } catch (_) {
        return 'auth/index.html';
      }
    }
  }

  /* ---------------------------------------
     LOGOUT (no Firebase)
     Binds to: #logout-btn, [data-action="logout"], .logout
  ----------------------------------------*/
  function installLogout() {
    var candidates = [];
    var byId = document.getElementById('logout-btn');
    if (byId) candidates.push(byId);
    var byAttr = document.querySelectorAll('[data-action="logout"], .logout');
    for (var i = 0; i < byAttr.length; i++) candidates.push(byAttr[i]);
    if (!candidates.length) return;

    var authURL = resolveAuthURL();

    function handleLogout(ev) {
      if (ev && ev.preventDefault) ev.preventDefault();

      // Preserve theme preference
      var keepTheme = null;
      try { keepTheme = localStorage.getItem('df_theme'); } catch (_) {}

      // Clear storages
      try { localStorage.clear(); } catch (_) {}
      try { sessionStorage.clear(); } catch (_) {}

      // Restore preserved preference
      try { if (keepTheme !== null) localStorage.setItem('df_theme', keepTheme); } catch (_) {}

      // Unregister SW then redirect
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

    for (var j = 0; j < candidates.length; j++) {
      candidates[j].addEventListener('click', handleLogout, { passive: false });
    }
  }

  /* ---------------------------------------
     CLOCK (HH:MM AM/PM, America/Chicago)
     Supports #clock and #df-clock; optional #report-date/#df-date
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

    // Minute-synced
    render();
    var now = new Date();
    var msToNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    setTimeout(function () {
      render();
      setInterval(render, 60 * 1000);
    }, Math.max(0, msToNextMinute));
  }

  /* ---------------------------------------
     VERSION + BUILD DATE
     Supports #version/#df-version and #report-date/#df-build-date
     (We only write date if element exists and wasn't already filled by clock)
  ----------------------------------------*/
  function injectVersionAndBuildDate() {
    var verEl = document.getElementById('version') || document.getElementById('df-version');
    var buildDateEl = document.getElementById('df-build-date') || null; // avoid double-writing #report-date (clock owns it)

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
    installLogout();
    installClock();
    injectVersionAndBuildDate();
  });
})();