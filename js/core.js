/* ===========================
   Dowson Farms — core.js
   - Logout (no Firebase; safe local/session cleanup)
   - Global HH:MM AM/PM clock (Central Time, minute-synced)
   - Footer version + date injection (reads window.DF_VERSION from js/version.js if present)
   =========================== */

(function () {
  'use strict';

  /* ---------------------------
     Project Root Resolver
     - Works from any subfolder (calculators, reports, etc.)
     - Returns "/<repo>/" + "" when on GitHub Pages or just "/" locally
  ----------------------------*/
  function getProjectRoot() {
    // Normalize trailing slash
    let path = location.pathname;
    // If we are at the repo root file (index.html in root), root is the folder containing it.
    // Otherwise strip known top-level directories to find the root.
    const topFolders = [
      'auth','assets','calculators','crop-production','equipment','feedback',
      'field-maintenance','.github','grain-tracking','js','reports','settings-setup','teams-partners'
    ];

    // If path already ends with '/', it's probably a directory listing or index.
    // We want the root that contains those top-level dirs.
    // Try to detect the earliest occurrence of any known top-level folder and cut there.
    const parts = path.split('/').filter(Boolean); // removes empty pieces
    if (parts.length === 0) return '/';

    // On GitHub Pages it’s typically /<user>/<repo>/...
    // We’ll build a root by walking until (but not including) a known top-level dir.
    let cutIndex = parts.length; // default: no cut
    for (let i = 0; i < parts.length; i++) {
      if (topFolders.includes(parts[i])) {
        cutIndex = i; break;
      }
    }

    // If the current file is in root (e.g., /<repo>/index.html), we still want "/<repo>/".
    // So we keep up to cutIndex (or all parts if no known folder present), then join with trailing slash.
    const rootParts = parts.slice(0, cutIndex);
    const root = '/' + rootParts.join('/') + (rootParts.length ? '/' : '/');
    return root;
  }

  /* ---------------------------
     Logout (no Firebase)
     - Clears storage (preserves theme choice)
     - Unregisters service workers
     - Redirects to auth/index.html at project root
  ----------------------------*/
  function installLogoutHandler() {
    const root = getProjectRoot();
    const logoutTargets = [
      document.querySelector('#logout-btn'),
      ...document.querySelectorAll('[data-action="logout"]')
    ].filter(Boolean);

    if (logoutTargets.length === 0) return;

    const handler = function (ev) {
      ev.preventDefault();

      // Preserve theme preference if present
      const preserve = {};
      try {
        const keysToKeep = ['df_theme'];
        keysToKeep.forEach(k => {
          if (localStorage.getItem(k) !== null) preserve[k] = localStorage.getItem(k);
        });
      } catch (_) {}

      // Clear storages
      try { localStorage.clear(); } catch (_) {}
      try { sessionStorage.clear(); } catch (_) {}

      // Restore preserved keys
      try {
        Object.keys(preserve).forEach(k => localStorage.setItem(k, preserve[k]));
      } catch (_) {}

      // Unregister service workers, then redirect
      const redirectToAuth = () => {
        const dest = root + 'auth/index.html';
        window.location.replace(dest);
      };

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations()
          .then(regs => Promise.allSettled(regs.map(r => r.unregister())))
          .finally(redirectToAuth)
          .catch(redirectToAuth);
      } else {
        redirectToAuth();
      }
    };

    logoutTargets.forEach(el => {
      el.addEventListener('click', handler, { passive: false });
    });
  }

  /* ---------------------------
     Clock (HH:MM AM/PM) — Central Time
     - Put <span id="df-clock"></span> somewhere in your header if you want it visible.
     - Also supports <span id="df-date"></span> for a friendly date.
  ----------------------------*/
  function installClock() {
    const clockEl = document.getElementById('df-clock');
    const dateEl  = document.getElementById('df-date');
    if (!clockEl && !dateEl) return; // nothing to render

    const tz = 'America/Chicago';

    function render() {
      const now = new Date();
      // Format time as HH:MM AM/PM
      const time = now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: tz
      });
      // Friendly date like "Sun, Sep 21, 2025"
      const date = now.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        timeZone: tz
      });
      if (clockEl) clockEl.textContent = time;
      if (dateEl)  dateEl.textContent  = date;
    }

    function startMinuteSyncedTick() {
      render();
      const now = new Date();
      const msToNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
      setTimeout(() => {
        render();
        setInterval(render, 60 * 1000);
      }, Math.max(0, msToNextMinute));
    }

    startMinuteSyncedTick();
  }

  /* ---------------------------
     Footer Version + Date
     - Expects window.DF_VERSION (set in js/version.js), else falls back to "v0.0.0"
     - Put <span id="df-version"></span> and/or <span id="df-build-date"></span> in your footer.
  ----------------------------*/
  function injectVersionAndDate() {
    const verEl = document.getElementById('df-version');
    const dateEl = document.getElementById('df-build-date');

    const version = (typeof window !== 'undefined' && window.DF_VERSION) ? String(window.DF_VERSION) : 'v0.0.0';

    const tz = 'America/Chicago';
    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: '2-digit', day: '2-digit', timeZone: tz
    });

    if (verEl) verEl.textContent = version;
    if (dateEl) dateEl.textContent = today;
  }

  /* ---------------------------
     DOM Ready
  ----------------------------*/
  document.addEventListener('DOMContentLoaded', function () {
    installLogoutHandler();
    installClock();
    injectVersionAndDate();
  });

})();
