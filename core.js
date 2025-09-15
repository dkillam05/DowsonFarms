/* ===========================
   Dowson Farms — core.js
   - Global HH:MM clock (Central Time, minute-synced)
   - Footer version + date injection
   - Breadcrumbs helper
   - Logout button injection + handler
   - Password visibility toggle (SVG eye)
   - Back button for form pages
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

// ---- Inject Logout button into breadcrumb bar (skip ONLY login/auth) ----
(function addLogoutToBreadcrumbs() {
  document.addEventListener("DOMContentLoaded", () => {
    // Show logout on ALL pages except auth/login
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

// ---- Password visibility toggle (SVG eye) — global wiring ----
(function initPasswordEyes() {
  // SVG icons (outline)
  const ICON_EYE = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z"/>
      <circle cx="12" cy="12" r="3.5"/>
    </svg>`;
  const ICON_EYE_OFF = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M3 3l18 18M10.6 10.6A3.5 3.5 0 0115 12m6-0c0 0-4 7-11 7-2.1 0-3.9-.6-5.4-1.5M4.3 7.7C6.2 6 8.8 5 12 5c7 0 11 7 11 7"/>
    </svg>`;

  function wire(wrapper) {
    if (!wrapper || wrapper.dataset.eyeInit === "1") return;

    const input = wrapper.querySelector('input[type="password"], input[type="text"]#password, input[name="password"]');
    const btn = wrapper.querySelector(".eye");
    if (!input || !btn) return;

    // Initial render
    const showing = input.type === "text";
    btn.innerHTML = showing ? ICON_EYE_OFF : ICON_EYE;
    btn.setAttribute("aria-label", showing ? "Hide password" : "Show password");
    btn.setAttribute("aria-pressed", String(showing));

    btn.addEventListener("click", () => {
      const nowShow = input.type !== "text";
      input.type = nowShow ? "text" : "password";
      btn.innerHTML = nowShow ? ICON_EYE_OFF : ICON_EYE;
      btn.setAttribute("aria-label", nowShow ? "Hide password" : "Show password");
      btn.setAttribute("aria-pressed", String(nowShow));
    });

    wrapper.dataset.eyeInit = "1";
  }

  function scan() {
    document.querySelectorAll(".password-wrap").forEach(wire);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scan);
  } else {
    scan();
  }

  // Optional: watch for dynamically added forms (lightweight)
  const mo = new MutationObserver((muts) => {
    for (const m of muts) {
      m.addedNodes?.forEach(node => {
        if (!(node instanceof HTMLElement)) return;
        if (node.matches?.(".password-wrap")) wire(node);
        node.querySelectorAll?.(".password-wrap").forEach(wire);
      });
    }
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });
})();

// ---- Back button (bottom-left) for form pages ----
// Shows when <body> has .form-page OR when we detect a major <form>
(function addFormBackButton() {
  function needsBack() {
    const b = document.body;
    if (b.classList.contains("auth-page")) return false; // never on login
    if (b.classList.contains("home-page")) return false; // not on main home
    if (b.classList.contains("form-page")) return true;  // explicit opt-in
    // auto-detect: big forms or a marker element
    const firstForm = document.querySelector("form");
    const bigForm = firstForm && firstForm.offsetHeight > 200;
    const marker  = document.querySelector("[data-has-form]");
    return !!(bigForm || marker);
  }

  function ensureBackBtn() {
    if (!needsBack()) return;
    if (document.querySelector(".back-fab")) return;

    const btn = document.createElement("button");
    btn.className = "back-fab";
    btn.type = "button";
    btn.setAttribute("aria-label", "Go back");
    btn.innerHTML = '<span class="chev" aria-hidden="true">‹</span><span>Back</span>';

    btn.addEventListener("click", () => {
      if (history.length > 1) history.back();
      else window.location.href = "index.html";
    });

    document.body.appendChild(btn);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ensureBackBtn);
  } else {
    ensureBackBtn();
  }
})();