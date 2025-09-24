/* ===========================
   Dowson Farms — core.js
   Global utilities shared across all pages
   - Auth + Firestore health guard (load-or-logout)
   - Logout helper + routing to /auth
   - Quick View hooks (global)
   - Clock (Central Time) + footer version/date
   - Breadcrumb helpers
   =========================== */

(function () {
  // Namespace
  window.DF = window.DF || {};

  // ---------- Configurable paths ----------
  // Pages may override this before core.js runs:
  //   window.DF_AUTH_URL = '../auth/index.html'
  const AUTH_URL_FALLBACK = 'auth/index.html';

  function getAuthUrl() {
    // Use page-provided override if present.
    if (typeof window.DF_AUTH_URL === 'string' && window.DF_AUTH_URL.length) {
      return window.DF_AUTH_URL;
    }
    // Heuristic: most subpages are nested one level (e.g., settings-setup/*)
    // Try ../auth first; if URL already contains /auth, just use it.
    try {
      const here = window.location.pathname;
      if (!/\/auth(\/|$)/.test(here)) return '../auth/index.html';
    } catch (_) {}
    return AUTH_URL_FALLBACK;
  }

  // ---------- Firebase handles (compat or modular) ----------
  function getFirebase() { return window.firebase || null; }

  function getAuthCompat() {
    try { return getFirebase()?.auth?.() || null; } catch (_) { return null; }
  }

  function getFirestoreCompat() {
    try { return getFirebase()?.firestore?.() || null; } catch (_) { return null; }
  }

  // ---------- Logout + routing ----------
  DF.routeToAuth = function routeToAuth() {
    window.location.replace(getAuthUrl());
  };

  DF.logout = async function logout() {
    try {
      const auth = getAuthCompat();
      if (auth) { await auth.signOut(); }
    } catch (_) { /* swallow */ }
  };

  // Hard logout + redirect (used by guard)
  DF.hardLogoutAndRedirect = async function hardLogoutAndRedirect() {
    try { await DF.logout(); } catch (_) {}
    DF.routeToAuth();
  };

  // ---------- Global guard: ensure auth + firestore are alive ----------
  // Call this at the top of any protected page.
  DF.ensureOnlineAuthOrLogout = async function ensureOnlineAuthOrLogout() {
    // 1) Firebase presence
    const fb = getFirebase();
    if (!fb) return DF.hardLogoutAndRedirect();

    // 2) Firestore presence
    const db = getFirestoreCompat();
    if (!db) return DF.hardLogoutAndRedirect();

    // 3) Auth presence + user check (with a short one-shot listener)
    const auth = getAuthCompat();
    if (!auth) return DF.hardLogoutAndRedirect();

    // Explicit long-lived session if not already set (safe if called repeatedly)
    try {
      if (fb.auth && fb.auth.Auth.Persistence) {
        await auth.setPersistence(fb.auth.Auth.Persistence.LOCAL);
      }
    } catch (_) {}

    // Wait for auth state (resolve quickly if already cached)
    const user = auth.currentUser;
    if (user) return; // good

    // Subscribe once; time out after 1500ms if no user (treat as not signed in)
    await new Promise((resolve) => {
      let settled = false;
      const to = setTimeout(() => {
        if (!settled) {
          settled = true;
          resolve(false);
        }
      }, 1500);
      auth.onAuthStateChanged(u => {
        if (!settled) {
          settled = true;
          clearTimeout(to);
          if (!u) {
            DF.hardLogoutAndRedirect();
          } else {
            resolve(true);
          }
        }
      });
    });
  };

  // ---------- Quick View (global shell; page can bind buttons) ----------
  DF.QuickView = DF.QuickView || {
    open(selector) {
      const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
      if (el) el.classList.add('is-open');
    },
    close(selector) {
      const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
      if (el) el.classList.remove('is-open');
    }
  };

  // ---------- Clock (Central) + footer version/date ----------
  function formatTime(date) {
    // 12-hour, HH:MM AM/PM
    let h = date.getHours();
    const m = date.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12; if (h === 0) h = 12;
    const mm = m < 10 ? '0' + m : String(m);
    return `${h}:${mm} ${ampm}`;
  }

  function tickClock() {
    const now = new Date();
    const headerClock = document.querySelector('[data-df-clock]');
    if (headerClock) headerClock.textContent = formatTime(now);

    const footer = document.querySelector('[data-df-footer]');
    if (footer) {
      const version = window.DF_VERSION || (window.DF && DF.VERSION) || '';
      const dateStr = now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      footer.textContent = `Dowson Farms • ${dateStr} • ${version}`;
    }
  }

  // Align to the minute
  function startClock() {
    tickClock();
    const now = new Date();
    const msToNextMin = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    setTimeout(() => {
      tickClock();
      setInterval(tickClock, 60 * 1000);
    }, Math.max(0, msToNextMin));
  }

  // ---------- Breadcrumb helper (safe) ----------
  function initBreadcrumbs() {
    const crumbs = document.querySelector('.breadcrumbs');
    if (!crumbs) return;
    // If overflowing, add a class so CSS can handle truncation
    requestAnimationFrame(() => {
      if (crumbs.scrollWidth > crumbs.clientWidth) {
        crumbs.classList.add('is-overflowing');
      }
    });
  }

  // ---------- Logout button wiring ----------
  function wireLogoutButtons() {
    document.addEventListener('click', (e) => {
      const t = e.target.closest('[data-action="logout"], #logoutBtn');
      if (!t) return;
      e.preventDefault();
      DF.hardLogoutAndRedirect();
    });
  }

  // ---------- Boot ----------
  document.addEventListener('DOMContentLoaded', () => {
    try { startClock(); } catch (_) {}
    try { initBreadcrumbs(); } catch (_) {}
    try { wireLogoutButtons(); } catch (_) {}
  });
})();