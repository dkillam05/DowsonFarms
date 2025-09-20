/* ===========================
   Dowson Farms — core.js
   - Global HH:MM clock (Central Time, minute-synced)
   - Footer version + date injection
   - Breadcrumbs helper (smart truncation, collision-safe)
   - Logout button injection + handler
   - Password visibility toggle (SVG eye)
   - Back button (default on all non-Home, non-Auth pages)
   - GLOBAL THEME (light/dark/auto) apply + listeners  ✅ upgraded & safe
   - USER MANAGER (long-term): set/get/clear current user
   - REQUIRED ASTERISK helper (auto-adds * to labels)
   =========================== */

"use strict";

// ---- CONFIG ----
const LOGIN_URL = "login.html";
const USE_LOCATION_REPLACE = true;   // prevent back button returning to authed page

/* ---------- THEME ENGINE (instant + synced across pages) ---------- */
(function bootThemeEngine() {
  try {
    var root = document.documentElement;

    function resolve(mode) {
      if (mode === "auto") {
        try {
          return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        } catch(_) {
          return "light"; // safe fallback
        }
      }
      return mode === "dark" ? "dark" : "light";
    }

    function applyTheme(mode) {
      var resolved = resolve(mode);
      // ★ CHANGED: Keep the *selected* mode on the attribute (so CSS can key off [data-theme="auto"])
      //            but still drive color-scheme with the resolved value for correct native control theming.
      root.setAttribute("data-theme", mode);                        // was: resolved
      root.style.colorScheme = (resolved === "dark") ? "dark" : "light";

      try {
        var ev = new CustomEvent("df:themechange", { detail: { mode: mode, resolved: resolved } });
        window.dispatchEvent(ev);
      } catch (_) {}
    }

    // Public API (kept + back-compat)
    window.setDFTheme = function (mode /* 'light'|'dark'|'auto' */) {
      try { localStorage.setItem("df_theme", mode); } catch (_) {}
      applyTheme(mode);
      try { localStorage.setItem("__df_theme_ping", String(Date.now())); } catch (_) {}
    };
    window.getDFTheme = function () {
      return localStorage.getItem("df_theme") || "auto";
    };
    window.onDFThemeChange = function (cb) {
      if (typeof cb === "function") window.addEventListener("df:themechange", cb);
    };
    window.setTheme = window.setDFTheme; // alias for older calls

    // React to OS theme changes while in 'auto'
    try {
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
        if ((localStorage.getItem("df_theme") || "auto") === "auto") {
          applyTheme("auto");
        }
      });
    } catch(_) {}

    // Keep multiple pages in sync
    window.addEventListener("storage", function (e) {
      if (e.key === "df_theme" || e.key === "__df_theme_ping") {
        applyTheme(localStorage.getItem("df_theme") || "auto");
      }
    });

    // Initial apply (pre-paint snippet sets it before CSS; we emit events here)
    applyTheme(localStorage.getItem("df_theme") || "auto");
  } catch (_) {}
})();

/* ---------- USER MANAGER (long-term) ---------- */
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

/* -------------------------------------------------
   Breadcrumb fitting (precise, no phantom gaps)
   ------------------------------------------------- */

/** Shrink crumbs by exactly the overflow needed, in this order:
 *  1) middle crumbs (share the shrink)
 *  2) first and last (only if still overflowing)
 *  This keeps a tidy margin before Logout and avoids blank space.
 */
function fitBreadcrumbs(nav) {
  try {
    const ol = nav?.querySelector("ol");
    if (!ol) return;

    // Make sure the list can shrink
    ol.style.flex = "1 1 auto";
    ol.style.minWidth = "0";
    ol.style.whiteSpace = "nowrap";
    ol.style.overflow = "hidden";

    const logoutBtn = nav.querySelector(".logout-btn");
    const SAFE_GAP = 12; // cushion between last crumb and Logout
    const logoutSpace = logoutBtn ? (logoutBtn.offsetWidth + SAFE_GAP) : 0;

    // Available width inside the nav (minus padding and Logout)
    const ns = getComputedStyle(nav);
    const padL = parseFloat(ns.paddingLeft) || 0;
    const padR = parseFloat(ns.paddingRight) || 0;
    const available = nav.clientWidth - padL - padR - logoutSpace;
    if (available <= 0) return;

    // Grab just the crumb elements (anchors/spans), skip separators
    const crumbEls = Array.from(ol.querySelectorAll("a, span"));

    // Reset to natural before measuring
    crumbEls.forEach(el => {
      el.style.maxWidth = "none";
      el.style.overflow = "visible";
      el.style.textOverflow = "clip";
      el.style.whiteSpace = "nowrap";
    });

    // If everything fits naturally, we’re done.
    if (ol.scrollWidth <= available) return;

    const first = crumbEls[0];
    const last  = crumbEls[crumbEls.length - 1];
    const middle = crumbEls.slice(1, -1);

    // Minimum readable widths (px)
    const MIN_MID  = 72;
    const MIN_EDGE = 96;

    const box = el => Math.ceil(el.getBoundingClientRect().width);

    // Current overflow we must eliminate
    let overflow = Math.ceil(ol.scrollWidth - available);

    // Helper to shrink an element by N pixels with ellipsis
    function shrinkBy(el, px, floor) {
      const w = box(el);
      const target = Math.max(floor, w - px);
      if (target < w) {
        el.style.maxWidth = target + "px";
        el.style.overflow = "hidden";
        el.style.textOverflow = "ellipsis";
      }
    }

    // 1) Shrink middle crumbs first (share the pain)
    let guard = 0;
    while (overflow > 0 && guard++ < 8) {
      const flexibles = middle.filter(el => box(el) > MIN_MID);
      if (!flexibles.length) break;

      const each = Math.max(1, Math.ceil(overflow / flexibles.length));
      flexibles.forEach(el => shrinkBy(el, each, MIN_MID));
      overflow = Math.ceil(ol.scrollWidth - available);
    }

    // 2) If still overflowing, allow edges to help
    guard = 0;
    while (overflow > 0 && guard++ < 4) {
      const edges = [first, last].filter(Boolean).filter(el => box(el) > MIN_EDGE);
      if (!edges.length) break;

      const each = Math.max(1, Math.ceil(overflow / edges.length));
      edges.forEach(el => shrinkBy(el, each, MIN_EDGE));
      overflow = Math.ceil(ol.scrollWidth - available);
    }
  } catch (_) {}
}

/* ---------- Render breadcrumbs from parts, then fit ---------- */
window.setBreadcrumbs = function setBreadcrumbs(parts) {
  try {
    const nav = document.querySelector(".breadcrumbs");
    const ol  = nav?.querySelector("ol");
    if (!nav || !ol || !Array.isArray(parts)) return;

    // Normalize input
    let norm = parts.map(p => (typeof p === "string" ? { label: p } : p));

    // Home-page scrub
    if (document.body.classList.contains("home-page")) {
      norm = [{ label: "Home", href: "index.html" }];
    } else {
      // Drop any accidental "Dashboard"
      norm = norm.filter(p => String(p.label).trim().toLowerCase() !== "dashboard");
    }

    // Render fresh
    ol.innerHTML = "";
    norm.forEach((p, i) => {
      const li = document.createElement("li");
      const isLast = i === norm.length - 1;

      const el = document.createElement(isLast ? "span" : "a");
      el.textContent = p.label;
      el.title = p.label;
      if (!isLast) el.href = p.href || "#";
      el.style.whiteSpace = "nowrap";
      li.appendChild(el);
      ol.appendChild(li);

      if (!isLast) {
        const sep = document.createElement("li");
        sep.className = "sep";
        sep.textContent = "›";
        ol.appendChild(sep);
      }
    });

    // Fit now and whenever size changes
    const raf = () => requestAnimationFrame(() => fitBreadcrumbs(nav));
    raf();

    if (window.ResizeObserver) {
      const ro = new ResizeObserver(raf);
      ro.observe(nav); ro.observe(ol);
    } else {
      window.addEventListener("resize", raf);
      window.addEventListener("orientationchange", raf);
    }

    // If children change (e.g., Logout injected), refit
    new MutationObserver(raf).observe(nav, { childList: true, subtree: true });
  } catch (_) {}
};

/* ---------- Home-page breadcrumb scrub (defensive) ---------- */
(function scrubHomeBreadcrumb() {
  function apply() {
    if (!document.body.classList.contains("home-page")) return;
    const ol = document.querySelector(".breadcrumbs ol");
    if (!ol) return;
    const text = (ol.textContent || "").toLowerCase();
    const looksWrong = text.includes("dashboard") || text.includes("›") || ol.children.length !== 1;
    if (looksWrong) {
      ol.innerHTML = "";
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = "index.html";
      a.textContent = "Home";
      a.title = "Home";
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
      btn.style.marginLeft = "10px"; // guaranteed gap from last crumb
      btn.addEventListener("click", handleLogout);
      nav.appendChild(btn);
    }

    // Also fit static breadcrumbs that weren’t rendered via setBreadcrumbs()
    fitBreadcrumbs(nav);
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
  if (!document.getElementById("df-required-style")) {
    const st = document.createElement("style");
    st.id = "df-required-style";
    st.textContent = `.req-star{color:#b00020;margin-left:4px;font-weight:700}`;
    document.head.appendChild(st);
  }

  function findLabel(ctrl){
    if (ctrl.id) {
      try {
        const esc = (window.CSS && CSS.escape) ? CSS.escape(ctrl.id) : ctrl.id;
        const byFor = document.querySelector(`label[for="${esc}"]`);
        if (byFor) return byFor;
      } catch(_) {}
    }
    const wrap = ctrl.closest(".field");
    if (wrap) {
      const inWrap = wrap.querySelector("label");
      if (inWrap) return inWrap;
    }
    let n = ctrl.previousElementSibling;
    if (n?.tagName?.toLowerCase() === "label") return n;
    return null;
  }

  function process(root = document){
    const controls = root.querySelectorAll('input[required], select[required], textarea[required], [aria-required="true"]');
    controls.forEach(ctrl => {
      const label = findLabel(ctrl);
      if (!label) return;
      if (label.querySelector(".req-star")) return;
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
