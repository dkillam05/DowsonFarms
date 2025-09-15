/* ===========================
   Dowson Farms — core.js
   - Global HH:MM clock (Central Time, minute-synced)
   - Footer version + date injection
   - Breadcrumbs helper
   - Logout button injection + handler
   =========================== */

"use strict";

// ---- CONFIG: where to send users after logout ----
const LOGIN_URL = "login.html";      // change to "index.html?login=1" if that's your flow
const USE_LOCATION_REPLACE = true;   // prevent back button returning to authed page

// Utility: Central Time date formatter (month name)
function formatCTDate(d = new Date()) {
  return d.toLocaleDateString("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

// ---- Footer version + date (reads APP_VERSION from version.js) ----
(function initFooterMeta() {
  try {
    const verEl = document.getElementById("version");
    if (verEl) {
      const v = (typeof APP_VERSION !== "undefined") ? APP_VERSION : "v0.0.0";
      verEl.textContent = v;
    }
  } catch (_) {}

  try {
    const dateEl = document.getElementById("report-date");
    if (dateEl) {
      dateEl.textContent = formatCTDate();
    }
  } catch (_) {}
})();

// ---- Global clock (HH:MM only, synced to minute boundary) ----
(function initClock() {
  // Prevent multiple timers if navigating page-to-page
  if (window.__DF_CLOCK_INTERVAL) { clearInterval(window.__DF_CLOCK_INTERVAL); window.__DF_CLOCK_INTERVAL = null; }
  if (window.__DF_CLOCK_TIMEOUT)  { clearTimeout(window.__DF_CLOCK_TIMEOUT);   window.__DF_CLOCK_TIMEOUT  = null; }

  const el = document.getElementById("clock");
  if (!el) return; // no clock on this page (e.g., login)

  function renderClock() {
    el.textContent = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "America/Chicago"
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

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      renderClock();
      if (window.__DF_CLOCK_INTERVAL) clearInterval(window.__DF_CLOCK_INTERVAL);
      if (window.__DF_CLOCK_TIMEOUT)  clearTimeout(window.__DF_CLOCK_TIMEOUT);
      scheduleMinuteTick();
    }
  });
})();

// ---- Breadcrumbs helper (array of strings OR {label, href}) ----
// Usage:
//   setBreadcrumbs(["Home","Reports","Soybeans"])
//   setBreadcrumbs([{label:"Home", href:"index.html"}, {label:"Reports", href:"reports.html"}, {label:"Soybeans"}])
window.setBreadcrumbs = function setBreadcrumbs(parts) {
  try {
    const ol = document.querySelector(".breadcrumbs ol");
    if (!ol || !Array.isArray(parts)) return;
    ol.innerHTML = "";

    const norm = parts.map(p => (typeof p === "string" ? { label: p } : p));

    norm.forEach((p, i) => {
      const li = document.createElement("li");
      const isLast = i === norm.length - 1;

      if (!isLast && p.href) {
        const a = document.createElement("a");
        a.textContent = p.label;
        a.href = p.href;
        li.appendChild(a);
      } else if (!isLast && !p.href) {
        const a = document.createElement("a");
        a.textContent = p.label;
        a.href = "#";
        li.appendChild(a);
      } else {
        const span = document.createElement("span");
        span.textContent = p.label;
        li.appendChild(span);
      }

      ol.appendChild(li);

      if (!isLast) {
        const sep = document.createElement("li");
        sep.className = "sep";
        sep.textContent = "›";
        ol.appendChild(sep);
      }
    });
  } catch (_) {}
};

// ---- Inject Logout button into breadcrumb bar globally ----
(function addLogoutToBreadcrumbs() {
  document.addEventListener("DOMContentLoaded", () => {
    // Skip on auth/login page
    if (document.body.classList.contains("auth-page")) return;

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
  try { localStorage.clear(); sessionStorage.clear(); } catch (_) {}

  // Optional: clear SW caches to avoid stale authed pages
  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
  } catch (_) {}

  // Navigate to login page (cache-busted)
  const target = LOGIN_URL + (LOGIN_URL.includes("?") ? "&" : "?") + "_ts=" + Date.now();
  if (USE_LOCATION_REPLACE) { window.location.replace(target); }
  else { window.location.href = target; }
};