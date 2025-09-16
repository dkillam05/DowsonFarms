/* ===========================
   Dowson Farms — core.js
   - Global HH:MM clock (Central Time, minute-synced)
   - Footer version + date injection
   - Breadcrumbs helper (+ home-page scrub)
   - Logout button injection + handler
   - Password visibility toggle (SVG eye)
   - Back button (default on all non-Home, non-Auth pages)
   - GLOBAL THEME (light/dark/auto) apply + listeners
   - USER MANAGER (long-term): set/get/clear current user
   - REQUIRED ASTERISK helper (auto-adds * to labels)
   =========================== */

"use strict";

// ---- CONFIG ----
const LOGIN_URL = "login.html";
const USE_LOCATION_REPLACE = true;   // prevent back button returning to authed page

/* ---------- THEME: apply saved + react to changes globally ---------- */
(function bootThemeGlobal() {
  try {
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    function apply(mode) {
      const m = (mode === "light" || mode === "dark" || mode === "auto") ? mode : "auto";
      root.setAttribute("data-theme", m);
    }

    // Public setter (Theme screen uses this)
    window.setTheme = function setTheme(mode) {
      try { localStorage.setItem("df_theme", mode); } catch (_) {}
      apply(mode);
    };

    // Initial apply
    const saved = localStorage.getItem("df_theme") || "auto";
    apply(saved);

    // If system theme flips and we’re in Auto, re-apply to keep in sync
    media.addEventListener?.("change", () => {
      const current = localStorage.getItem("df_theme") || "auto";
      if (current === "auto") apply("auto");
    });

    // If another tab changes the theme, sync this tab
    window.addEventListener("storage", (e) => {
      if (e.key === "df_theme") apply(e.newValue || "auto");
    });
  } catch (_) {}
})();

/* ---------- USER MANAGER (long-term) ---------- */
/*
  Keys:
    - df_current_user: plain string (e.g., "Jane Doe")
    - df_profile: JSON string (optional) with { firstName, lastName, displayName }
  Public API:
    - window.setCurrentUser(nameOrObj)
    - window.getCurrentUser()
    - window.clearCurrentUser()
*/
(function bootUserManager(){
  const USER_KEY = "df_current_user";
  const PROFILE_KEY = "df_profile";

  function capFirst(s){
    if (!s || typeof s !== "string") return "";
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function makeDisplayName(input){
    try {
      if (!input) return "";
      if (typeof input === "string") {
        return input.split(/\s+/).filter(Boolean).map(capFirst).join(" ").trim();
      }
      if (typeof input === "object") {
        const dn = input.displayName && String(input.displayName).trim();
        if (dn) return dn.split(/\s+/).map(capFirst).join(" ");
        const fn = input.firstName ? capFirst(String(input.firstName).trim()) : "";
        const ln = input.lastName  ? capFirst(String(input.lastName).trim())  : "";
        return [fn, ln].filter(Boolean).join(" ").trim();
      }
      return "";
    } catch(_) { return ""; }
  }

  function setCurrentUser(nameOrObj){
    try {
      const display = makeDisplayName(nameOrObj) || "Admin";
      localStorage.setItem(USER_KEY, display);
      if (nameOrObj && typeof nameOrObj === "object") {
        const profile = {
          firstName: nameOrObj.firstName ? capFirst(String(nameOrObj.firstName)) : undefined,
          lastName:  nameOrObj.lastName  ? capFirst(String(nameOrObj.lastName))  : undefined,
          displayName: display
        };
        localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      }
    } catch(_) {}
    return getCurrentUser();
  }

  function getCurrentUser(){
    try {
      const s = localStorage.getItem(USER_KEY);
      if (s && s.trim()) return s;
    } catch(_) {}
    return "Admin";
  }

  function clearCurrentUser(){
    try {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(PROFILE_KEY);
    } catch(_) {}
  }

  (function seedIfMissing(){
    try {
      const existing = localStorage.getItem(USER_KEY);
      if (existing && existing.trim()) return;

      const raw = localStorage.getItem(PROFILE_KEY);
      if (raw) {
        try {
          const obj = JSON.parse(raw);
          const display = makeDisplayName(obj) || "Admin";
          localStorage.setItem(USER_KEY, display);
          return;
        } catch(_) {}
      }
      localStorage.setItem(USER_KEY, "Admin");
    } catch(_) {}
  })();

  window.setCurrentUser = setCurrentUser;
  window.getCurrentUser = getCurrentUser;
  window.clearCurrentUser = clearCurrentUser;

  window.addEventListener("storage", (e) => {
    if (e.key === USER_KEY || e.key === PROFILE_KEY) {
      // no-op; consumers read as needed
    }
  });
})();

/* ---------- Utility: Central Time date ---------- */
function formatCTDate(d = new Date()) {
  return d.toLocaleDateString("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

/* ---------- Footer version + date ---------- */
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
    if (dateEl) dateEl.textContent = formatCTDate();
  } catch (_) {}
})();

/* ---------- Global clock (HH:MM, minute-synced, Central) ---------- */
(function initClock() {
  if (window.__DF_CLOCK_INTERVAL) { clearInterval(window.__DF_CLOCK_INTERVAL); window.__DF_CLOCK_INTERVAL = null; }
  if (window.__DF_CLOCK_TIMEOUT)  { clearTimeout(window.__DF_CLOCK_TIMEOUT);   window.__DF_CLOCK_TIMEOUT  = null; }

  const el = document.getElementById("clock");
  if (!el) return;

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

/* ---------- Breadcrumbs helper (with home-page scrub) ---------- */
window.setBreadcrumbs = function setBreadcrumbs(parts) {
  try {
    const ol = document.querySelector(".breadcrumbs ol");
    if (!ol || !Array.isArray(parts)) return;

    // Normalize input
    let norm = parts.map(p => (typeof p === "string" ? { label: p } : p));

    // If we're on the main home page, force crumbs to just "Home"
    if (document.body.classList.contains("home-page")) {
      norm = [{ label: "Home", href: "index.html" }];
    } else {
      // On other pages, drop any accidental "Dashboard" entries
      norm = norm.filter(p => String(p.label).trim().toLowerCase() !== "dashboard");
    }

    // Render
    ol.innerHTML = "";
    norm.forEach((p, i) => {
      const li = document.createElement("li");
      const isLast = i === norm.length - 1;

      if (!isLast) {
        const a = document.createElement("a");
        a.textContent = p.label;
        a.href = p.href || "#";
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

/* ---------- Home-page breadcrumb scrub (defensive) ---------- */
/* If the page is marked as the home page, rewrite the breadcrumb
   to only "Home" even if the HTML was hard-coded or someone called
   setBreadcrumbs with extra parts like "Dashboard". */
(function scrubHomeBreadcrumb() {
  function apply() {
    if (!document.body.classList.contains("home-page")) return;
    const ol = document.querySelector(".breadcrumbs ol");
    if (!ol) return;
    // If anything other than a single "Home" is present, fix it
    const text = (ol.textContent || "").toLowerCase();
    const looksWrong = text.includes("dashboard") || text.includes("›") || ol.children.length !== 1;
    if (looksWrong) {
      ol.innerHTML = "";
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = "index.html";
      a.textContent = "Home";
      li.appendChild(a);
      ol.appendChild(li);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", apply);
  } else {
    apply();
  }
})();

/* ---------- Inject Logout into breadcrumbs (everywhere except auth) ---------- */
(function addLogoutToBreadcrumbs() {
  document.addEventListener("DOMContentLoaded", () => {
    if (document.body.classList.contains("auth-page")) return; // never on login

    const nav = document.querySelector(".breadcrumbs");
    if (!nav) return;

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

/* ---------- Global Logout handler ---------- */
window.handleLogout = async function handleLogout() {
  try { localStorage.clear(); sessionStorage.clear(); } catch (_) {}

  // Also clear current user and profile (explicit)
  try {
    localStorage.removeItem("df_current_user");
    localStorage.removeItem("df_profile");
  } catch(_) {}

  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
  } catch (_) {}

  const target = LOGIN_URL + (LOGIN_URL.includes("?") ? "&" : "?") + "_ts=" + Date.now();
  if (USE_LOCATION_REPLACE) window.location.replace(target);
  else window.location.href = target;
};

/* ---------- Password visibility toggles ---------- */
(function initPasswordEyes() {
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

  function scan() { document.querySelectorAll(".password-wrap").forEach(wire); }
  (document.readyState === "loading") ? document.addEventListener("DOMContentLoaded", scan) : scan();

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

/* ---------- Back button (bottom-left) — default for all sub-pages ---------- */
(function addBackButton() {
  function shouldShow() {
    const b = document.body;
    if (b.classList.contains("auth-page")) return false;       // never on login
    if (b.classList.contains("no-back")) return false;         // explicit off
    if (b.classList.contains("force-back")) return true;       // explicit on
    if (b.classList.contains("home-page")) return false;       // hide on main home
    return true;                                               // show on all others
  }

  function ensure() {
    if (!shouldShow()) return;
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

  (document.readyState === "loading")
    ? document.addEventListener("DOMContentLoaded", ensure)
    : ensure();
})();

/* ---------- REQUIRED ASTERISK helper (auto-add * to required field labels) ---------- */
(function markRequiredAsterisks(){
  // Inject a tiny style once (keeps theme.css clean if you prefer)
  if (!document.getElementById("df-required-style")) {
    const st = document.createElement("style");
    st.id = "df-required-style";
    st.textContent = `.req-star{color:#b00020;margin-left:4px;font-weight:700}`;
    document.head.appendChild(st);
  }

  function findLabel(ctrl){
    // 1) <label for="id">
    if (ctrl.id) {
      try {
        const esc = (window.CSS && CSS.escape) ? CSS.escape(ctrl.id) : ctrl.id;
        const byFor = document.querySelector(`label[for="${esc}"]`);
        if (byFor) return byFor;
      } catch(_) {}
    }
    // 2) Within a .field wrapper
    const wrap = ctrl.closest(".field");
    if (wrap) {
      const inWrap = wrap.querySelector("label");
      if (inWrap) return inWrap;
    }
    // 3) Immediate previous sibling label (fallback)
    let n = ctrl.previousElementSibling;
    if (n?.tagName?.toLowerCase() === "label") return n;
    return null;
  }

  function process(root = document){
    const controls = root.querySelectorAll('input[required], select[required], textarea[required], [aria-required="true"]');
    controls.forEach(ctrl => {
      const label = findLabel(ctrl);
      if (!label) return;
      if (label.querySelector(".req-star")) return; // already marked
      const star = document.createElement("span");
      star.className = "req-star";
      star.textContent = "*";
      label.appendChild(star);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => process());
  } else {
    process();
  }

  // Watch for forms/fields added later (Ideas/Bugs etc.)
  const mo = new MutationObserver((muts) => {
    muts.forEach(m => {
      m.addedNodes?.forEach(node => {
        if (!(node instanceof HTMLElement)) return;
        process(node);
      });
    });
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });
})();