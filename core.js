/* ===========================
   Dowson Farms — core.js
   - Global HH:MM clock (Central Time, minute-synced)
   - Footer version + date injection
   - Breadcrumbs helper
   - Logout button injection + handler
   - Password visibility toggle (SVG eye)
   - Back button (default on all non-Home, non-Auth pages)
   - Global capitalization (inputs on blur)
   - Safe CRUD helpers (localStorage) + delete-vs-archive policy
   =========================== */

"use strict";

// ---- CONFIG ----
const LOGIN_URL = "login.html";
const USE_LOCATION_REPLACE = true;   // prevent back button returning to authed page

// ============================
// Utilities
// ============================

// Utility: Central Time date formatter (Month day, Year)
function formatCTDate(d = new Date()) {
  return d.toLocaleDateString("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

// Capitalization helpers (global)
window.capitalizeFirst = function (str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};
window.capitalizeWords = function (str) {
  if (!str) return "";
  return str
    .trim()
    .split(/\s+/)
    .map(w => w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : "")
    .join(" ");
};

// Auto-enforce capitalization on blur (emails stay lowercase)
(function enforceCapitalization() {
  document.addEventListener("blur", (e) => {
    const el = e.target;
    if (!el || !(el.matches("input[type=text], input[type=search], input[type=password], input:not([type]), textarea, input[type=email]"))) return;

    let v = (el.value || "").trim();
    if (!v) return;

    if (el.type === "email") {
      el.value = v.toLowerCase();
      return;
    }

    // Default = Capitalize Each Word (covers first/last names, towns, crops, etc.)
    el.value = window.capitalizeWords(v);
  }, true);
})();

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

/* ---------- Breadcrumbs helper ---------- */
// setBreadcrumbs(["Home","Reports","Soybeans"])
// setBreadcrumbs([{label:"Home",href:"index.html"},{label:"Reports",href:"reports.html"},{label:"Soybeans"}])
window.setBreadcrumbs = function setBreadcrumbs(parts) {
  try {
    const ol = document.querySelector(".breadcrumbs ol");
    if (!ol || !Array.isArray(parts)) return;
    ol.innerHTML = "";

    const norm = parts.map(p => (typeof p === "string" ? { label: p } : p));

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
// Appears on every page except: auth/login and the main Home page.
// Overrides:
//   - add class="no-back" on <body> to hide on a specific page
//   - add class="force-back" on <body> to show even on Home
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

/* ============================
   Data Store + Safe CRUD helpers (localStorage-backed)
   ============================

Structure:
  df_data = {
    crops:  [{id, name, archived: false, createdAt, updatedAt}],
    farms:  [...],
    fields: [...],
    roles:  [...]
  }

Use from pages:
  const items = DFStore.getAll("crops");
  DFStore.upsert("crops", { id?, name, archived:false });
  DFStore.archive("crops", id, true/false);
  DFStore.delete("crops", id);

Guard actions with:
  const {canEdit, canDelete, canArchive} = CRUDPolicy.decideActions("crops", id, resolveUsageCount);
*/
const STORE_KEY = "df_data";

function loadStore() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch { return {}; }
}
function saveStore(data) { localStorage.setItem(STORE_KEY, JSON.stringify(data)); }
function ensureCollection(data, key) { if (!Array.isArray(data[key])) data[key] = []; }
function uid() { return Math.random().toString(36).slice(2, 9); }

window.DFStore = {
  getAll(entity) {
    const data = loadStore(); ensureCollection(data, entity);
    return data[entity];
  },
  upsert(entity, record) {
    const data = loadStore(); ensureCollection(data, entity);
    const now = Date.now();
    if (!record.id) {
      record.id = uid();
      record.createdAt = now;
      record.updatedAt = now;
      if (typeof record.archived !== "boolean") record.archived = false;
      data[entity].push(record);
    } else {
      const i = data[entity].findIndex(r => r.id === record.id);
      if (i >= 0) { data[entity][i] = { ...data[entity][i], ...record, updatedAt: now }; }
      else { data[entity].push({ ...record, createdAt: now, updatedAt: now }); }
    }
    saveStore(data);
    return record;
  },
  archive(entity, id, archived = true) {
    const data = loadStore(); ensureCollection(data, entity);
    const rec = data[entity].find(r => r.id === id);
    if (rec) { rec.archived = archived; rec.updatedAt = Date.now(); saveStore(data); }
    return !!rec;
  },
  delete(entity, id) {
    const data = loadStore(); ensureCollection(data, entity);
    const before = data[entity].length;
    data[entity] = data[entity].filter(r => r.id !== id);
    saveStore(data);
    return data[entity].length < before;
  }
};

// Policy wrapper with usage checks (page provides a resolver(entity, id) -> count)
window.CRUDPolicy = {
  canDelete(entity, id, resolver) {
    const count = typeof resolver === "function" ? (resolver(entity, id) || 0) : 0;
    return count === 0;
  },
  decideActions(entity, id, resolver) {
    const canDel = this.canDelete(entity, id, resolver);
    return {
      canEdit: true,
      canDelete: canDel,
      canArchive: !canDel
    };
  }
};