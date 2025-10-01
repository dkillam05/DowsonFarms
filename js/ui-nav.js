// ui-nav.js — renders home tiles & subnav using DF_MENUS and DF_ACCESS
// Includes a SECONDARY inline Builder bypass so nav never hides for Builder.

import { loadAccess } from "./access.js";
const $ = s => document.querySelector(s);

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
    a.style.border="1px solid rgba(0,0,0,.1)";
    a.style.borderRadius="16px";
    a.style.boxShadow="0 6px 18px rgba(0,0,0,.06)";
    a.style.padding="24px 18px";
    a.style.textDecoration="none";
    a.style.color="#333";
    a.innerHTML = `${t.iconEmoji || "•"} <span style="margin-top:8px;font-weight:600">${t.label}</span>`;
    grid.appendChild(a);
  });

  container.appendChild(grid);
}

function renderSubnav(sectionHref, topTile, children){
  const hook = document.querySelector("[data-df-subnav]");
  if(!hook) return;
  hook.innerHTML = "";

  const list = document.createElement("div");
  list.style.display="grid"; list.style.gap="12px";

  (children || []).forEach(ch=>{
    const a = document.createElement("a");
    a.href = ch.href;
    a.className="df-tile";
    a.style.display="block";
    a.style.background="#fff";
    a.style.border="1px solid rgba(0,0,0,.1)";
    a.style.borderRadius="12px";
    a.style.padding="14px 16px";
    a.style.textDecoration="none"; a.style.color="#333";
    a.textContent = ch.label;
    list.appendChild(a);
  });

  if(!children || !children.length){
    const warn = document.createElement("div");
    warn.style.background="#ffe9e9"; warn.style.border="1px solid #f3b9b9";
    warn.style.color="#a00"; warn.style.padding="10px 12px"; warn.style.borderRadius="10px";
    warn.textContent = `No visible sub-menus for ${sectionHref}.`;
    hook.appendChild(warn);
  } else {
    hook.appendChild(list);
  }
}

async function main(){
  // Load access first
  const access = await loadAccess();

  // ===== Builder secondary bypass (defensive; no seeding) =====
  const isBuilder = access.roleKeys && access.roleKeys.includes("__builder__");

  // Menus
  const MENUS = window.DF_MENUS && Array.isArray(window.DF_MENUS.tiles) ? window.DF_MENUS.tiles : [];

  // HOME
  const tilesHook = document.querySelector("[data-df-tiles]");
  if(tilesHook){
    const tiles = isBuilder ? MENUS.slice() : access.filterMenusForHome(MENUS);
    renderHome(tiles);
  }

  // SUBNAV
  const subnavHook = document.querySelector("[data-df-subnav]");
  if(subnavHook){
    const section = subnavHook.getAttribute("data-section"); // e.g. "teams-partners/index.html"
    const top = MENUS.find(t => t.href === section);
    let kids = [];
    if(top){
      kids = isBuilder
        ? (top.children || []).slice()
        : access.filterChildren(top.children || []);
    }
    renderSubnav(section, top, kids);
  }
}

document.addEventListener("DOMContentLoaded", main);