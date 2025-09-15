/* ===========================
   Dowson Farms — core.js
   - Global HH:MM clock (Central Time)
   - Footer version injection
   - Breadcrumbs helper
   - Logout button injection + handler
   =========================== */

// ---- CONFIG: where to send users after logout ----
const LOGIN_URL = "login.html";      // <--- change to "index.html?login=1" if that's your flow
const USE_LOCATION_REPLACE = true;   // prevent back button returning to authed page

// ---- Footer version (reads APP_VERSION from version.js) ----
(function setFooterVersion() {
  try {
    const el = document.getElementById('version');
    if (!el) return;
    const v = (typeof APP_VERSION !== 'undefined') ? APP_VERSION : 'v0.0.0';
    el.textContent = v;
  } catch (_) {}
})();

// ---- Global clock (HH:MM only, synced to minute boundary) ----
(function initClock() {
  if (window.__DF_CLOCK_INTERVAL) { clearInterval(window.__DF_CLOCK_INTERVAL); window.__DF_CLOCK_INTERVAL = null; }
  if (window.__DF_CLOCK_TIMEOUT)  { clearTimeout(window.__DF_CLOCK_TIMEOUT);   window.__DF_CLOCK_TIMEOUT = null; }

  const el = document.getElementById('clock');
  if (!el) return;

  function renderClock() {
    el.textContent = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Chicago'
    });
  }

  function scheduleMinuteTick() {
    const now = new Date();
    const untilNextMinute = 60000 - (now.getSeconds() * 1000 + now.getMilliseconds());
    window.__DF_CLOCK_TIMEOUT = setTimeout(() => {
      renderClock();
      window.__DF_CLOCK_INTERVAL = setInterval(renderClock, 60000);
    }, untilNextMinute);
  }

  renderClock();
  scheduleMinuteTick();

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      renderClock();
      if (window.__DF_CLOCK_INTERVAL) clearInterval(window.__DF_CLOCK_INTERVAL);
      if (window.__DF_CLOCK_TIMEOUT)  clearTimeout(window.__DF_CLOCK_TIMEOUT);
      scheduleMinuteTick();
    }
  });
})();

// ---- Breadcrumbs helper (optional) ----
// Usage: setBreadcrumbs(["Home","Reports","Soybeans"]);
window.setBreadcrumbs = function setBreadcrumbs(parts) {
  try {
    const ol = document.querySelector('.breadcrumbs ol');
    if (!ol || !Array.isArray(parts)) return;
    ol.innerHTML = '';
    parts.forEach((p, i) => {
      const li = document.createElement('li');
      if (i < parts.length - 1) {
        const a = document.createElement('a');
        a.textContent = p; a.href = '#';
        li.appendChild(a);
      } else {
        const span = document.createElement('span');
        span.textContent = p;
        li.appendChild(span);
      }
      ol.appendChild(li);
      if (i < parts.length - 1) {
        const sep = document.createElement('li');
        sep.className = 'sep';
        sep.textContent = '›';
        ol.appendChild(sep);
      }
    });
  } catch (_) {}
};

// ---- Inject Logout button into breadcrumb bar globally ----
(function addLogoutToBreadcrumbs() {
  document.addEventListener("DOMContentLoaded", () => {
    const nav = document.querySelector(".breadcrumbs");
    if (!nav) return;

    // Only add once
    if (!nav.querySelector(".logout-btn")) {
      const btn = document.createElement("button");
      btn.className = "logout-btn";
      btn.type = "button";
      btn.textContent = "Logout";
      btn.addEventListener("click", handleLogout);
      nav.appendChild(btn);
    }
  });
})();

// ---- Global Logout handler ----
window.handleLogout = async function handleLogout() {
  try {
    // Clear any locally stored session artifacts
    localStorage.clear();
    sessionStorage.clear();
  } catch (_) {}

  // Optional: also clear service worker caches (safe no-op if none)
  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
  } catch (_) {}

  // Navigate to login page (cache-bust query helps avoid stale HTML)
  const target = LOGIN_URL + (LOGIN_URL.includes('?') ? '&' : '?') + '_ts=' + Date.now();
  if (USE_LOCATION_REPLACE) {
    window.location.replace(target); // no back to protected page
  } else {
    window.location.href = target;
  }
};