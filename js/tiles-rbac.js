// /js/tiles-rbac.js  (FULL REPLACEMENT)
// Purpose: On the Home screen, hide top-level tiles the signed-in user
// does NOT have "view" permission for. Precedence:
// employee.permissions > user.permissions > role.permissions

import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const sleep = (ms)=>new Promise(r=>setTimeout(r,ms));
const norm  = (s)=>String(s||"").replace(/\s+/g," ").trim();

/* ---------------- Gate CSS (prevents initial flash) ---------------- */
(function installGateCSS(){
  if (document.getElementById("df-rbac-gate")) return;
  const css = document.createElement("style");
  css.id = "df-rbac-gate";
  css.textContent = `
    /* Hide the Home tiles until RBAC finishes */
    .df-tiles[data-source].rbac-hide { visibility: hidden !important; }
    .df-tiles[data-source].rbac-show { visibility: visible !important; }
  `;
  document.head.appendChild(css);

  // Apply the gate ASAP
  const host = document.querySelector(".df-tiles[data-source]");
  if (host) host.classList.add("rbac-hide");
})();

/* ---------------- Small wait helpers ---------------- */
async function waitForFirebase(maxMs=18000){
  const t0 = Date.now();
  while((!window.DF_FB || !window.DF_FB.db || !window.DF_FB.auth) && (Date.now()-t0)<maxMs){
    await sleep(50);
  }
  if (!window.DF_FB || !window.DF_FB.db) throw new Error("Firebase not ready");
  return window.DF_FB;
}
async function waitForTiles(maxMs=12000){
  const t0 = Date.now();
  while ((Date.now()-t0) < maxMs) {
    const host = document.querySelector(".df-tiles[data-source]");
    if (host && host.querySelector("*")) return;
    await sleep(50);
  }
}

/* ---------------- Load employee/user/role docs ---------------- */
async function loadAuthDocs(db, user){
  const email = (user?.email || "").toLowerCase();
  const uid   = user?.uid || "";

  const userSnap = email ? await getDoc(doc(db, "users", email)) : null;
  const userDoc  = userSnap?.exists() ? userSnap.data() : null;

  const empSnap  = uid ? await getDoc(doc(db, "employees", uid)) : null;
  const empDoc   = empSnap?.exists() ? empSnap.data() : null;

  const roleId   = (empDoc?.roleId) || (userDoc?.roleId) || null;
  const roleSnap = roleId ? await getDoc(doc(db, "roles", roleId)) : null;
  const roleDoc  = roleSnap?.exists() ? roleSnap.data() : null;

  return { empDoc, userDoc, roleDoc };
}

/* ---------------- Permission helpers (view only) ---------------- */
const hasView = (perms, menu) => {
  if (!perms) return false;
  const entry = perms[menu] || perms["*"];
  if (!entry) return false;
  if (entry["*"] && entry["*"].view === true) return true; // wildcard sub
  // Any submenu with view:true counts for showing the menu tile
  return Object.values(entry).some(v => v && v.view === true);
};
const canViewMenu = (docs, menu) =>
  hasView(docs.empDoc?.permissions,  menu) ||
  hasView(docs.userDoc?.permissions, menu) ||
  hasView(docs.roleDoc?.permissions, menu);

/* ---------------- DOM helpers (Home tiles only) ---------------- */
// A "tile" is the clickable card for a top-level menu.
function homeTiles(){
  const host = document.querySelector(".df-tiles[data-source]");
  if (!host) return [];
  // Grab obvious tappable cards
  const candidates = Array.from(host.querySelectorAll("[data-menu], a, .tile, .card, button"));
  // Filter out headers and empty nodes
  return candidates.filter(el=>{
    const t = el.tagName.toLowerCase();
    if (t === "h1" || t === "h2" || t === "h3" || el.closest("nav")) return false;
    return norm(el.textContent).length > 0;
  });
}
function tileMenuLabel(tile){
  // Prefer explicit attributes if you add them later
  const fromAttr = tile.getAttribute?.("data-menu") || tile.getAttribute?.("data-section");
  if (fromAttr) return norm(fromAttr);
  // Then try common elements
  const strong = tile.querySelector("strong"); if (strong) return norm(strong.textContent||"");
  const span   = tile.querySelector("span");   if (span)   return norm(span.textContent||"");
  const div    = tile.querySelector("div");    if (div)    return norm(div.textContent||"");
  return norm(tile.textContent || "");
}

/* ---------------- Main: filter the Home grid ---------------- */
async function applyRBAC(){
  const host = document.querySelector(".df-tiles[data-source]");
  if (!host) return; // not on Home

  try{
    const { db, auth } = await waitForFirebase();
    await waitForTiles();

    const user = auth.currentUser;
    // If not signed in, just show what the page has (no filtering)
    if (!user) { host.classList.remove("rbac-hide"); host.classList.add("rbac-show"); return; }

    const docs = await loadAuthDocs(db, user);

    // Hide tiles whose MENU doesn't have any view:true perms
    let kept = 0;
    homeTiles().forEach(tile=>{
      const label = tileMenuLabel(tile);
      // Normalize known menu labels to match your roles keys exactly
      const menu = label
        .replace(/&/g, "&")            // keep ampersand
        .replace(/\s+/g, " ")
        .trim();
      const ok = canViewMenu(docs, menu);
      if (!ok) {
        tile.style.display = "none";
      } else {
        kept++;
      }
    });

    // If nothing left, you could inject a friendly message here.
  } catch (e) {
    console.warn("[tiles-rbac] skipped:", e?.message || e);
  } finally {
    const host2 = document.querySelector(".df-tiles[data-source]");
    if (host2) { host2.classList.remove("rbac-hide"); host2.classList.add("rbac-show"); }
  }
}

/* ---------------- Triggers ---------------- */
function install(){
  // Re-run when auth restores after page load
  try { window.DF_FB_API?.onAuth?.(()=> applyRBAC()); } catch(_){}
  // Re-run if the tiles are re-rendered
  const host = document.querySelector(".df-tiles[data-source]");
  if (host && "MutationObserver" in window) {
    const mo = new MutationObserver(m=>{
      if (m.some(x=>x.type==="childList")) applyRBAC();
    });
    mo.observe(host, { childList:true, subtree:true });
  }
  applyRBAC();
}

document.addEventListener("DOMContentLoaded", install);