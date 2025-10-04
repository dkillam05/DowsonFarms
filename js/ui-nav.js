// js/ui-nav.js — renders home tiles & subnav using DF_MENUS + DF_ACCESS (auth-safe)

import { auth } from "./firebase-init.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { loadAccess } from "./access.js";

const $ = (s) => document.querySelector(s);

const UPDATE_CHECK_HREF = "settings/index.html#check-updates";

function bindAutoUpdateFlag(anchor) {
  if (!anchor) return;
  const href = anchor.getAttribute("href") || "";
  if (!href.includes(UPDATE_CHECK_HREF)) return;
  anchor.addEventListener("click", () => {
    try {
      sessionStorage.setItem("fvAutoUpdateCheck", "1");
    } catch (_) {}
  });
}

function renderHome(tiles){
  const container = document.querySelector("[data-df-tiles]");
  if(!container) return;
  container.innerHTML = "";

  const grid = document.createElement("div");
  grid.style.display="grid";
  grid.style.gap="18px";
  grid.style.gridTemplateColumns="repeat(auto-fit, minmax(220px,1fr))";

  tiles.forEach(t=>{
    const a = document.createElement("a");
    a.href = t.href;
    a.className = "df-tile";
    a.style.display="flex";
    a.style.flexDirection="column";
    a.style.alignItems="center";
    a.style.justifyContent="center";
    a.style.background="#fff";
    a.style.border="1px solid rgba(54,94,90,0.18)";
    a.style.borderRadius="16px";
    a.style.boxShadow="0 6px 18px rgba(23,52,49,0.12)";
    a.style.padding="24px 18px";
    a.style.textDecoration="none";
    a.style.color="#143231";
    a.innerHTML = `${t.iconEmoji || "•"} <span style="margin-top:8px;font-weight:600">${t.label}</span>`;
    bindAutoUpdateFlag(a);
    grid.appendChild(a);
  });

  container.appendChild(grid);
}

function renderSubnav(sectionHref, topTile, children){
  const hook = document.querySelector("[data-df-subnav]");
  if(!hook) return;
  hook.innerHTML = "";

  const list = document.createElement("div");
  list.style.display="grid";
  list.style.gap="12px";

  (children || []).forEach(ch=>{
    const a = document.createElement("a");
    a.href = ch.href;
    a.className="df-tile";
    a.style.display="block";
    a.style.background="#fff";
    a.style.border="1px solid rgba(54,94,90,0.18)";
    a.style.borderRadius="12px";
    a.style.padding="14px 16px";
    a.style.textDecoration="none";
    a.style.color="#143231";
    a.textContent = ch.label;
    bindAutoUpdateFlag(a);
    list.appendChild(a);
  });

  if(!children || !children.length){
    const warn = document.createElement("div");
    warn.style.background="#ffe9e9";
    warn.style.border="1px solid #f3b9b9";
    warn.style.color="#a00";
    warn.style.padding="10px 12px";
    warn.style.borderRadius="10px";
    warn.textContent = `No visible sub-menus for ${sectionHref}.`;
    hook.appendChild(warn);
  } else {
    hook.appendChild(list);
  }
}

function normPath(s){
  if(!s) return "";
  return s.replace(/index\.html$/,"").replace(/\/+$/,"/"); // ensure trailing slash if folder
}

async function doRender(){
  // Menus loaded?
  const MENUS = (window.DF_MENUS && Array.isArray(window.DF_MENUS.tiles)) ? window.DF_MENUS.tiles : [];
  if(!MENUS.length) return; // nothing to render

  // Access (after auth is ready)
  const access = await loadAccess();
  const isBuilder = access.roleKeys && access.roleKeys.includes("__builder__");

  // HOME
  const tilesHook = document.querySelector("[data-df-tiles]");
  if(tilesHook){
    const tiles = isBuilder ? MENUS.slice() : access.filterMenusForHome(MENUS);
    renderHome(tiles);
  }

  // SUBNAV
  const subnavHook = document.querySelector("[data-df-subnav]");
  if(subnavHook){
    const sectionAttr = subnavHook.getAttribute("data-section") || "";
    const target = normPath(sectionAttr || "");
    // find by normalized href (so "teams-partners/" matches)
    const top = MENUS.find(t => normPath(t.href) === target);
    let kids = [];
    if(top){
      kids = isBuilder ? (top.children || []).slice()
                       : (access.filterChildren ? access.filterChildren(top.children || []) : (top.children || []));
    }
    renderSubnav(target, top, kids);
  }
}

// ✅ Wait for Firebase auth to settle before rendering (prevents race)
document.addEventListener("DOMContentLoaded", () => {
  onAuthStateChanged(auth, () => {
    doRender();
  });
});