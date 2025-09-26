// /js/tiles-rbac.js  (FULL REPLACEMENT; must be the LAST script on Home)
// Purpose: Hide Home tiles the signed-in user can't see.
// Logic: employee.permissions > user.permissions > role.permissions
// Works with your DF_MENUS (assets/data/menus.js) and your firebase-init globals.

import {
  getFirestore, doc, getDoc
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const sleep = (ms)=>new Promise(r=>setTimeout(r,ms));
const clean = (s)=>String(s||'')
  .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')   // strip emoji
  .replace(/[^A-Za-z0-9&/+\- ]+/g, ' ')     // keep readable chars
  .replace(/\s+/g,' ')
  .trim();

function host(){ return document.querySelector('.df-tiles[data-source]') || null; }
function allTiles(){
  const h = host(); if (!h) return [];
  // Try explicit hooks if present
  let tiles = Array.from(h.querySelectorAll('[data-menu], .tile, a'));
  if (!tiles.length) tiles = Array.from(h.querySelectorAll('*')).filter(n=>{
    // heuristic: looks like a tile/card with text and clickable (your Home tiles fit this)
    const tag = n.tagName.toLowerCase();
    if (tag==='h1'||tag==='h2'||tag==='h3'||tag==='nav'||tag==='ol'||tag==='li'||tag==='footer') return false;
    if (!n.getBoundingClientRect) return false;
    const r = n.getBoundingClientRect(); if (r.width<120 || r.height<60) return false;
    const txt = clean(n.textContent); return !!txt && /[A-Za-z]/.test(txt);
  });
  // keep only first-level cards (avoid nested children in the same tile)
  return tiles.filter(t=>!t.closest('nav') && !t.querySelector('a,button,.tile'));
}

/* ---------- Gate CSS (prevent flash) ---------- */
(function gate(){
  if (document.getElementById('rbac-tiles-gate')) return;
  const s = document.createElement('style');
  s.id = 'rbac-tiles-gate';
  s.textContent = `
    .df-tiles[data-source].rbac-hide { visibility:hidden; }
  `;
  document.head.appendChild(s);
  const h = host(); if (h) h.classList.add('rbac-hide');
})();

/* ---------- Waiters ---------- */
async function waitForFirebase(maxMs=15000){
  const t0=Date.now();
  while((!window.DF_FB || !window.DF_FB.db || !window.DF_FB.auth) && Date.now()-t0<maxMs){
    await sleep(60);
  }
  if (!window.DF_FB || !window.DF_FB.db) throw new Error('Firebase not ready');
  return window.DF_FB;
}
async function waitForMenus(maxMs=8000){
  const t0=Date.now();
  while((!window.DF_MENUS || !Array.isArray(window.DF_MENUS.tiles)) && Date.now()-t0<maxMs){
    await sleep(60);
  }
  if (!window.DF_MENUS || !Array.isArray(window.DF_MENUS.tiles)) throw new Error('DF_MENUS missing');
}
async function waitForTiles(maxMs=8000){
  const t0=Date.now();
  while(!host() || allTiles().length===0){
    if (Date.now()-t0>maxMs) break;
    await sleep(60);
  }
}

/* ---------- Load docs (same precedence as rules) ---------- */
async function readDocs(db, user){
  const email = (user?.email||'').toLowerCase();
  const uid   = user?.uid || '';

  const uSnap = email ? await getDoc(doc(db,'users', email)) : null;
  const userDoc = (uSnap && uSnap.exists()) ? uSnap.data() : null;

  const eSnap = uid ? await getDoc(doc(db,'employees', uid)) : null;
  const empDoc = (eSnap && eSnap.exists()) ? eSnap.data() : null;

  const roleId = (empDoc && empDoc.roleId) || (userDoc && userDoc.roleId) || null;
  const rSnap = roleId ? await getDoc(doc(db,'roles', roleId)) : null;
  const roleDoc = (rSnap && rSnap.exists()) ? rSnap.data() : null;

  return { empDoc, userDoc, roleDoc };
}

/* ---------- Perm helpers ---------- */
function hasView(perms, menu, sub){
  if (!perms) return false;
  const mm = perms[menu]; if (!mm) return false;
  const p  = mm[sub] || mm['*'];
  return !!(p && p.view===true);
}
function canViewSubmenu(all, menu, sub){
  return hasView(all.empDoc?.permissions, menu, sub)
      || hasView(all.userDoc?.permissions, menu, sub)
      || hasView(all.roleDoc?.permissions, menu, sub);
}
function canViewMenu(all, menu){
  // A menu is viewable if ANY of its submenus is viewable
  const df = window.DF_MENUS || { tiles:[] };
  const tile = (df.tiles||[]).find(t => clean(t.label) === clean(menu));
  const subs = Array.isArray(tile?.children) ? tile.children : [];
  if (!subs.length) return false;
  for (const s of subs){
    const sub = clean(s.label);
    if (canViewSubmenu(all, menu, sub)) return true;
  }
  return false;
}

/* ---------- Main ---------- */
async function run(){
  try{
    await waitForMenus();
    await waitForTiles();
    const { db, auth } = await waitForFirebase();
    const h = host();
    if (!h){ document.getElementById('rbac-tiles-gate')?.remove(); return; }

    // if not logged in, just reveal tiles (home splash)
    const user = auth.currentUser;
    if (!user){ h.classList.remove('rbac-hide'); return; }

    const docs = await readDocs(db, user);

    // Build fast lookup for menu labels
    const menuLabels = (window.DF_MENUS.tiles||[]).map(t=>clean(t.label));

    // Hide each top-level menu tile if the user cannot view ANY submenu under it
    allTiles().forEach(tile=>{
      const text = clean(tile.getAttribute('data-menu') || tile.textContent || '');
      // find the closest DF_MENUS label by strict or contains match
      let menu = menuLabels.find(m => m === text)
              || menuLabels.find(m => text.includes(m))
              || menuLabels.find(m => m.includes(text))
              || null;
      if (!menu) return; // unknown tile - leave it alone
      const ok = canViewMenu(docs, menu);
      if (!ok) {
        tile.style.display='none';
      }
    });
  } catch(err){
    console.warn('[tiles-rbac] skipped:', err?.message||err);
  } finally {
    // reveal whatever remains (no flash of “everything”)
    const h = host(); if (h) h.classList.remove('rbac-hide');
  }
}

/* ---------- Triggers ---------- */
document.addEventListener('DOMContentLoaded', run);
// Re-run when auth restores
try { window.DF_FB_API?.onAuth?.(()=> run()); } catch(_){}
// Re-run if ui-nav mutates the tiles later
(function watch(){
  const h = host(); if (!h || !('MutationObserver' in window)) return;
  const mo = new MutationObserver(m=>{ if (m.some(x=>x.type==='childList')) run(); });
  mo.observe(h, { childList:true, subtree:true });
})();