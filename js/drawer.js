// js/drawer.js — Dowson Farms Global Drawer
// Robust open/close, bottom brand + logout, version integration.

import { auth } from "./firebase-init.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

/* ---------- Ensure shell exists ---------- */
function ensureShell() {
  let drawer = document.getElementById("drawer");
  let backdrop = document.getElementById("drawerBackdrop");

  if (!drawer) {
    drawer = document.createElement("div");
    drawer.id = "drawer";
    drawer.className = "drawer";
    drawer.setAttribute("aria-label", "Side menu");
    drawer.innerHTML = `<nav aria-label="Primary"></nav>`;
    document.body.appendChild(drawer);
  } else if (!drawer.querySelector("nav")) {
    const nav = document.createElement("nav");
    nav.setAttribute("aria-label", "Primary");
    drawer.appendChild(nav);
  }

  if (!backdrop) {
    backdrop = document.createElement("div");
    backdrop.id = "drawerBackdrop";
    backdrop.className = "drawerBackdrop";
    document.body.appendChild(backdrop);
  }

  return { drawer, backdrop, nav: drawer.querySelector("nav") };
}
const { drawer, backdrop, nav } = ensureShell();

/* ---------- Open/Close ---------- */
function openDrawer() { document.body.classList.add("drawer-open"); }
function closeDrawer() { document.body.classList.remove("drawer-open"); }

if (backdrop) backdrop.addEventListener("click", e => {
  if (e.target === backdrop) closeDrawer();
});
window.addEventListener("keydown", e => { if (e.key === "Escape") closeDrawer(); });

// Event delegation so it always works
document.addEventListener("click", e => {
  const btn = e.target.closest("#drawerToggle");
  if (btn) { e.preventDefault(); openDrawer(); }
});

window.DF_DRAWER = { open: openDrawer, close: closeDrawer };

/* ---------- Permission Helper ---------- */
const canView = href => {
  if (!window.DF_ACCESS || typeof window.DF_ACCESS.canView !== "function") return true;
  return window.DF_ACCESS.canView(href || "");
};

/* ---------- Build accordion nav ---------- */
function buildAccordion() {
  if (!nav) return;
  const data = Array.isArray(window.DF_DRAWER_MENUS) ? window.DF_DRAWER_MENUS : [];
  nav.innerHTML = "";

  data.forEach(group => {
    const g = document.createElement("div");
    g.className = "group";
    g.setAttribute("aria-expanded", "false");

    const btn = document.createElement("button");
    btn.type = "button";
    btn.innerHTML = `<span class="icon">${group.icon || ""}</span>${group.label}<span class="chev">›</span>`;
    btn.addEventListener("click", () => {
      const exp = g.getAttribute("aria-expanded") === "true";
      nav.querySelectorAll('.group[aria-expanded="true"]').forEach(x => {
        if (x !== g) x.setAttribute("aria-expanded", "false");
      });
      g.setAttribute("aria-expanded", exp ? "false" : "true");
    });
    g.appendChild(btn);

    const panel = document.createElement("div");
    panel.className = "panel";

    (group.children || []).forEach(item => {
      if (Array.isArray(item.children) && item.children.length) {
        const sg = document.createElement("div");
        sg.className = "subgroup";
        sg.setAttribute("aria-expanded", "false");

        const sbtn = document.createElement("button");
        sbtn.type = "button";
        sbtn.innerHTML = `<span class="icon">${item.icon || ""}</span>${item.label}<span class="chev">›</span>`;
        sbtn.addEventListener("click", () => {
          const exp = sg.getAttribute("aria-expanded") === "true";
          panel.querySelectorAll('.subgroup[aria-expanded="true"]').forEach(x => {
            if (x !== sg) x.setAttribute("aria-expanded", "false");
          });
          sg.setAttribute("aria-expanded", exp ? "false" : "true");
        });
        sg.appendChild(sbtn);

        const subpanel = document.createElement("div");
        subpanel.className = "subpanel";
        item.children.forEach(link => {
          if (!canView(link.href)) return;
          const a = document.createElement("a");
          a.className = "item";
          a.href = link.href || "#";
          a.innerHTML = `<span class="icon">${link.icon || ""}</span>${link.label}`;
          a.addEventListener("click", closeDrawer);
          subpanel.appendChild(a);
        });

        if (subpanel.children.length) {
          sg.appendChild(subpanel);
          panel.appendChild(sg);
        }
      } else {
        if (!canView(item.href)) return;
        const a = document.createElement("a");
        a.className = "item";
        a.href = item.href || "#";
        a.innerHTML = `<span class="icon">${item.icon || ""}</span>${item.label}`;
        a.addEventListener("click", closeDrawer);
        panel.appendChild(a);
      }
    });

    if (panel.children.length) {
      g.appendChild(panel);
      nav.appendChild(g);
    }
  });
}

/* ---------- Bottom brand + logout ---------- */
function currentVersion() {
  const v = (window.DF_VERSION && (window.DF_VERSION.version || window.DF_VERSION.appVersion)) || "v0.0.0";
  return String(v).startsWith("v") ? v : `v${v}`;
}

function buildBottom() {
  const old = drawer.querySelector(".df-drawer-bottom");
  if (old) old.remove();

  const bottom = document.createElement("div");
  bottom.className = "df-drawer-bottom";
  bottom.innerHTML = `
    <div class="sep"></div>
    <a href="#" class="item df-logout"><span class="icon">↪️</span>Logout</a>
    <div class="df-brandline">
      <img src="assets/icons/icon-192.png" alt="">
      <div class="txt">
        <div class="name">Dowson Farms · Divernon, Illinois</div>
        <div class="sub">App ${currentVersion()}</div>
      </div>
    </div>
  `;
  drawer.appendChild(bottom);

  bottom.querySelector(".df-logout").addEventListener("click", async e => {
    e.preventDefault();
    try { await signOut(auth); } catch (err) { console.warn("signOut error", err); }
    closeDrawer();
    location.replace("auth/"); // go to login
  });

  const css = `
    .df-drawer-bottom{ padding:10px 6px 12px; }
    .df-drawer-bottom .sep{ height:1px; background:#0001; margin:6px 6px 10px; }
    .df-drawer-bottom .item{ display:flex; align-items:center; gap:12px; padding:12px 16px;
      text-decoration:none; color:#223; border:1px solid #00000016; border-radius:12px; background:#fff; }
    .df-drawer-bottom .item:hover{ background:#f7f7f4; }
    .df-drawer-bottom .item .icon{ width:20px }
    .df-brandline{ display:flex; align-items:center; gap:10px; padding:12px 8px 2px }
    .df-brandline img{ width:32px; height:32px; border-radius:8px }
    .df-brandline .name{ font-weight:700 }
    .df-brandline .sub{ font:12px/1.35 ui-monospace,SFMono-Regular,Consolas,monospace; color:#445 }
  `;
  let style = document.getElementById("dfDrawerShim");
  if (!style) {
    style = document.createElement("style");
    style.id = "dfDrawerShim";
    document.head.appendChild(style);
  }
  style.textContent = css;
}

// Watch for version.js updating DF_VERSION
(function watchVersion() {
  const iv = setInterval(() => {
    const verEl = drawer.querySelector(".df-brandline .sub");
    if (verEl && window.DF_VERSION) {
      verEl.textContent = `App ${currentVersion()}`;
      clearInterval(iv);
    }
  }, 300);
  setTimeout(() => clearInterval(iv), 8000);
})();

/* ---------- Initial build ---------- */
buildAccordion();
buildBottom();