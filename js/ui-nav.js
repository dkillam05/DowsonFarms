// js/ui-nav.js
// Role-aware rendering for home tiles, breadcrumbs, and subnav
import { loadAccess } from "./access.js";

const qs  = (s, r=document) => r.querySelector(s);
const qsa = (s, r=document) => Array.from(r.querySelectorAll(s));

function el(tag, attrs={}, children=[]) {
  const n = document.createElement(tag);
  for (const [k,v] of Object.entries(attrs)) {
    if (k === "class") n.className = v;
    else if (k === "html") n.innerHTML = v;
    else n.setAttribute(k, v);
  }
  (Array.isArray(children)?children:[children]).forEach(c=>{
    if(c==null) return;
    if (typeof c === "string") n.appendChild(document.createTextNode(c));
    else n.appendChild(c);
  });
  return n;
}

function renderHomeTiles(DF_ACCESS){
  const host = qs("[data-df-tiles]");
  if (!host || !window.DF_MENUS || !Array.isArray(window.DF_MENUS.tiles)) return;

  const tiles = DF_ACCESS.filterMenusForHome(window.DF_MENUS.tiles);
  const grid = el("div", { class: "df-tiles" });

  tiles.forEach(t => {
    const a = el("a", { class:"df-tile", href: t.href, title: t.label });
    a.appendChild(document.createTextNode(t.iconEmoji || "•"));
    a.appendChild(el("span", {}, t.label));
    grid.appendChild(a);
  });

  host.innerHTML = "";
  host.appendChild(grid);
}

function currentPath() {
  // resolve path relative to <base href="/DowsonFarms/">
  const url = new URL(location.href);
  let p = url.pathname;
  // strip the repo base if present
  if (p.startsWith("/DowsonFarms/")) p = p.slice("/DowsonFarms/".length);
  return p || "index.html";
}

function findMenuByHref(href) {
  const all = window.DF_MENUS?.tiles || [];
  for (const top of all) {
    if (top.href === href) return { parent:null, item:top };
    if (Array.isArray(top.children)) {
      for (const ch of top.children) {
        if (ch.href === href) return { parent:top, item:ch };
        if (Array.isArray(ch.children)) {
          for (const g of ch.children) {
            if (g.href === href) return { parent:ch, item:g, grandparent:top };
          }
        }
      }
    }
  }
  return null;
}

function renderBreadcrumbs(node) {
  const nav = qs("[data-df-breadcrumbs]");
  if (!nav || !node) return;
  const trail = [];

  if (node.grandparent) trail.push(node.grandparent);
  if (node.parent) trail.push(node.parent);
  trail.push(node.item);

  const wrap = el("div", { class:"df-breadcrumbs" });
  trail.forEach((m, i) => {
    const a = el("a", { href: m.href }, m.label);
    wrap.appendChild(a);
    if (i < trail.length - 1) wrap.appendChild(el("span", { class:"sep" }, " / "));
  });

  nav.innerHTML = "";
  nav.appendChild(wrap);
}

function renderSubnav(DF_ACCESS){
  const host = qsa("[data-df-subnav]");
  if (!host.length) return;

  const path = host[0].getAttribute("data-section") || currentPath();
  const node = findMenuByHref(path);
  if (!node) return;

  // Determine which children to show
  let children = [];
  if (node.item && Array.isArray(node.item.children)) {
    children = node.item.children;
  } else if (node.parent && Array.isArray(node.parent.children)) {
    // when pointed at a child, show siblings
    children = node.parent.children;
  }

  const vis = DF_ACCESS.filterChildren(children);

  const bar = el("div", { class:"df-subnav" });
  vis.forEach(ch => {
    bar.appendChild(el("a", { href: ch.href, class:"pill" }, `${ch.iconEmoji || "•"} ${ch.label}`));
  });

  host.forEach(h => { h.innerHTML = ""; h.appendChild(bar.cloneNode(true)); });

  // Optional breadcrumbs
  renderBreadcrumbs(node);
}

(async function boot(){
  try {
    if (!window.DF_MENUS) {
      console.warn("[ui-nav] DF_MENUS missing. Ensure assets/data/menus.js is included before ui-nav.js");
      return;
    }
    const DF_ACCESS = await loadAccess();

    renderHomeTiles(DF_ACCESS);
    renderSubnav(DF_ACCESS);
  } catch (e) {
    console.error("[ui-nav] failed", e);
  }
})();