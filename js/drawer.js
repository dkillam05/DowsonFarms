// js/drawer.js — Drawer builder (accordion) + bottom section
// Renders: accordion nav from window.DF_DRAWER_MENUS, then a bottom block
// with “↪️ Logout” (same look as menu items) and “Dowson Farms · Divernon, Illinois”
// and “App v…“ from window.DF_VERSION.version.

import { auth } from "./firebase-init.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

// -------- helpers
const $id = (s) => document.getElementById(s);
const hasAccess = (href) =>
  !window.DF_ACCESS || !window.DF_ACCESS.canView
    ? true
    : window.DF_ACCESS.canView(href || "");

// -------- wire open/close
const drawer   = $id("drawer");
const backdrop = $id("drawerBackdrop");
const toggle   = $id("drawerToggle");

// Bail if shell is missing
if (!drawer) {
  console.warn("[drawer] #drawer not found");
} else {
  // Replace any prefilled content; we always rebuild fresh.
  drawer.innerHTML = `<nav aria-label="Primary"></nav>`;
}

const nav = drawer ? drawer.querySelector("nav") : null;

function openDrawer(){ document.body.classList.add("drawer-open"); }
function closeDrawer(){ document.body.classList.remove("drawer-open"); }
function clickBackdrop(e){ if (e.target === backdrop) closeDrawer(); }

toggle   && toggle.addEventListener("click", openDrawer);
backdrop && backdrop.addEventListener("click", clickBackdrop);
window.addEventListener("keydown", (e)=>{ if (e.key === "Escape") closeDrawer(); });

// Prevent background scroll while open (iOS friendly)
const origOverflow = document.documentElement.style.overflow || "";
const bodyOrigTouch = document.body.style.touchAction || "";
const observer = new MutationObserver(() => {
  const open = document.body.classList.contains("drawer-open");
  document.documentElement.style.overflow = open ? "hidden" : origOverflow;
  document.body.style.touchAction = open ? "none" : bodyOrigTouch;
});
observer.observe(document.body, { attributes:true, attributeFilter:["class"] });

// Ensure drawer content never hides under the global footer
if (drawer) drawer.style.paddingBottom = "72px";

// -------- build accordion from DF_DRAWER_MENUS
(function buildAccordion(){
  if (!nav) return;

  const data = Array.isArray(window.DF_DRAWER_MENUS)
    ? window.DF_DRAWER_MENUS
    : [];

  nav.innerHTML = "";

  data.forEach(group => {
    // Top group container
    const g = document.createElement("div");
    g.className = "group";
    g.setAttribute("aria-expanded","false");

    // Top group button
    const btn = document.createElement("button");
    btn.type = "button";
    btn.innerHTML =
      `<span class="icon">${group.icon || ""}</span>${group.label}<span class="chev">›</span>`;
    btn.addEventListener("click", () => {
      const expanded = g.getAttribute("aria-expanded") === "true";
      // Collapse others (accordion behavior)
      nav.querySelectorAll('.group[aria-expanded="true"]').forEach(x => {
        if (x !== g) x.setAttribute("aria-expanded","false");
      });
      g.setAttribute("aria-expanded", expanded ? "false" : "true");
    });
    g.appendChild(btn);

    // First-level panel
    const panel = document.createElement("div");
    panel.className = "panel";

    (group.children || []).forEach(item => {
      if (Array.isArray(item.children) && item.children.length) {
        // Subgroup with its own accordion
        const sg = document.createElement("div");
        sg.className = "subgroup";
        sg.setAttribute("aria-expanded","false");

        const sbtn = document.createElement("button");
        sbtn.type = "button";
        sbtn.innerHTML =
          `<span class="icon">${item.icon || ""}</span>${item.label}<span class="chev">›</span>`;
        sbtn.addEventListener("click", () => {
          const exp = sg.getAttribute("aria-expanded") === "true";
          // Collapse sibling subgroups
          panel.querySelectorAll('.subgroup[aria-expanded="true"]').forEach(x => {
            if (x !== sg) x.setAttribute("aria-expanded","false");
          });
          sg.setAttribute("aria-expanded", exp ? "false" : "true");
        });
        sg.appendChild(sbtn);

        const subpanel = document.createElement("div");
        subpanel.className = "subpanel";
        item.children.forEach(link => {
          if (!hasAccess(link.href)) return; // permission gate
          const a = document.createElement("a");
          a.className = "item";
          a.href = link.href || "#";
          a.innerHTML = `<span class="icon">${link.icon || ""}</span>${link.label}`;
          a.addEventListener("click", closeDrawer);
          subpanel.appendChild(a);
        });

        // Only show subgroup if at least one child is visible
        if (subpanel.children.length) {
          sg.appendChild(subpanel);
          panel.appendChild(sg);
        }
      } else {
        if (!hasAccess(item.href)) return; // permission gate
        const a = document.createElement("a");
        a.className = "item";
        a.href = item.href || "#";
        a.innerHTML = `<span class="icon">${item.icon || ""}</span>${item.label}`;
        a.addEventListener("click", closeDrawer);
        panel.appendChild(a);
      }
    });

    // Only append groups that have visible children
    if (panel.children.length) {
      g.appendChild(panel);
      nav.appendChild(g);
    }
  });
})();

// -------- bottom: logout + brand/location/version
(function buildBottom(){
  if (!drawer) return;

  // Create container that sits after <nav>. No fixed positioning; it stays inside the drawer.
  const bottom = document.createElement("div");
  bottom.className = "df-drawer-bottom";
  bottom.innerHTML = `
    <div class="sep"></div>
    <a href="#" class="item df-logout">
      <span class="icon">↪️</span>Logout
    </a>
    <div class="df-brandline">
      <img src="assets/icons/icon-192.png" alt="">
      <div class="txt">
        <div class="name">Dowson Farms</div>
        <div class="sub">Divernon, Illinois · <span class="ver">App ${(
          (window.DF_VERSION && (window.DF_VERSION.version || window.DF_VERSION.appVersion)) ||
          "v0.0.0"
        )}</span></div>
      </div>
    </div>
  `;
  drawer.appendChild(bottom);

  // Hook up logout
  const logout = bottom.querySelector(".df-logout");
  if (logout) {
    logout.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        await signOut(auth);
      } catch (err) {
        console.warn("signOut error", err);
      } finally {
        closeDrawer();
        location.replace("auth/"); // go to login
      }
    });
  }

  // Inject tiny style shim to make bottom elements match your menu look and sit at the bottom
  const css = `
    .df-drawer-bottom{ padding:10px 6px 12px; }
    .df-drawer-bottom .sep{ height:1px; background:#0001; margin:4px 6px 10px; }
    .df-drawer-bottom .item{ display:flex; align-items:center; gap:12px; padding:12px 16px;
      text-decoration:none; color:#223; border:1px solid #00000016; border-radius:12px; background:#fff; }
    .df-drawer-bottom .item:hover{ background:#f7f7f4; }
    .df-drawer-bottom .item .icon{ width:20px }
    .df-brandline{ display:flex; align-items:center; gap:10px; padding:12px 8px 2px }
    .df-brandline img{ width:32px; height:32px; border-radius:8px }
    .df-brandline .name{ font-weight:700 }
    .df-brandline .sub{ font:12px/1.35 ui-monospace,SFMono-Regular,Consolas,monospace; color:#445 }
  `;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);
})();