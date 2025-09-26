// /js/tiles-rbac.js  (ES module, drop-in, last script on Home)
// Purpose: Hide Home tiles the signed-in user cannot VIEW.
// Precedence: employee.permissions > user.permissions > role.permissions

import {
  getFirestore, doc, getDoc
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const sleep = (ms)=> new Promise(r=>setTimeout(r,ms));
const norm  = (s)=> String(s||'').trim().replace(/\s+/g,' ');

// ---- 1) Install a tiny CSS gate so tiles are hidden until we finish
(function installGateCSS(){
  if (document.getElementById('rbac-tiles-style')) return;
  const s = document.createElement('style');
  s.id = 'rbac-tiles-style';
  s.textContent = `
    .df-tiles.rbac-pending [data-section] { display:none !important; }
  `;
  document.head.appendChild(s);
})();

function markPending(on){
  const host = document.querySelector('.df-tiles[data-source]');
  if (!host) return;
  if (on) host.classList.add('rbac-pending');
  else    host.classList.remove('rbac-pending');
}

// ---- 2) Wait for Firebase + auth + tiles to exist
async function waitForFirebase(maxMs=15000){
  const t0 = Date.now();
  while ((!window.DF_FB || !window.DF_FB.db || !window.DF_FB.auth) && (Date.now()-t0)<maxMs){
    await sleep(60);
  }
  if (!window.DF_FB || !window.DF_FB.db) throw new Error('Firebase not ready');
  return window.DF_FB;
}

async function waitForTiles(maxMs=8000){
  const t0 = Date.now();
  while (!document.querySelector('.df-tiles[data-source] [data-section]') && (Date.now()-t0)<maxMs){
    await sleep(60);
  }
}

// ---- 3) Load docs similar to Firestore rules resolution
async function readDocs(db, user){
  const emailLower = (user?.email||'').toLowerCase();
  const uid        = user?.uid || '';

  const userSnap = emailLower ? await getDoc(doc(db,'users', emailLower)) : null;
  const userDoc  = (userSnap && userSnap.exists()) ? userSnap.data() : null;

  const empSnap  = uid ? await getDoc(doc(db,'employees', uid)) : null;
  const empDoc   = (empSnap && empSnap.exists()) ? empSnap.data() : null;

  const roleId = (empDoc && empDoc.roleId) || (userDoc && userDoc.roleId) || null;
  const roleSnap = roleId ? await getDoc(doc(db,'roles', roleId)) : null;
  const roleDoc  = (roleSnap && roleSnap.exists()) ? roleSnap.data() : null;

  return { empDoc, userDoc, roleDoc };
}

// ---- 4) Permission helpers (view only)
function hasView(perms, menuLabel, subLabel){
  if (!perms) return false;
  const mm = perms[menuLabel]; if (!mm) return false;
  const sub = mm[subLabel] || mm['*'];
  return !!(sub && sub.view === true);
}
function canView(all, menuLabel, subLabel){
  return (
    hasView(all.empDoc?.permissions,  menuLabel, subLabel) ||
    hasView(all.userDoc?.permissions, menuLabel, subLabel) ||
    hasView(all.roleDoc?.permissions, menuLabel, subLabel)
  );
}

// ---- 5) DOM helpers (generic to your ui-nav markup)
function sections(){ return Array.from(document.querySelectorAll('.df-tiles[data-source] [data-section]')); }
function sectionLabel(sec){
  return sec.getAttribute('data-section') || sec.querySelector('h2,h3,strong')?.textContent || '';
}
function tilesOf(sec){
  // Prefer explicit attribute if present; else fall back to common card/link nodes
  const explicit = Array.from(sec.querySelectorAll('[data-submenu]'));
  if (explicit.length) return explicit;
  const guess = Array.from(sec.querySelectorAll('a, .tile, button'));
  return guess.filter(el => {
    const tag = el.tagName.toLowerCase();
    if (tag==='h2'||tag==='h3'||el.closest('nav')) return false;
    const txt = el.textContent?.trim();
    return !!txt;
  });
}
function tileLabel(tile){
  return tile.getAttribute('data-submenu')
      || tile.querySelector('strong,span,div')?.textContent
      || tile.textContent
      || '';
}

// ---- 6) Main filter
async function applyRBAC(){
  try{
    markPending(true);

    const { db, auth } = await waitForFirebase();
    // wait until ui-nav created the grid (or time out)
    await waitForTiles();

    const user = auth.currentUser;
    if (!user) { markPending(false); return; } // stay visible for unauth (home splash)

    const docs = await readDocs(db, user);

    let totalKept = 0;
    sections().forEach(sec=>{
      const menu = sectionLabel(sec);
      let keptHere = 0;
      tilesOf(sec).forEach(tile=>{
        const sub  = tileLabel(tile);
        const ok   = canView(docs, menu, sub);
        if (!ok) {
          tile.style.display = 'none';
        } else {
          keptHere++;
          totalKept++;
        }
      });
      if (!keptHere) sec.style.display = 'none';
    });

    // If nothing left, optionally show a friendly note (no-op by default)
    if (totalKept === 0) {
      // You could inject a message here if you want.
    }
  } catch (e) {
    console.warn('[tiles-rbac] skipped:', e?.message || e);
  } finally {
    markPending(false); // always reveal whatever remains
  }
}

// ---- 7) Triggers: run now, when auth restores, and when tiles mutate
function installTriggers(){
  // re-run on auth restoration
  try { window.DF_FB_API?.onAuth?.(()=> applyRBAC()); } catch(_){}

  // re-run if ui-nav updates the DOM later
  const host = document.querySelector('.df-tiles[data-source]');
  if (host && 'MutationObserver' in window){
    const mo = new MutationObserver(muts=>{
      if (muts.some(m=>m.type==='childList')) applyRBAC();
    });
    mo.observe(host, { childList:true, subtree:true });
  }
}

document.addEventListener('DOMContentLoaded', ()=>{
  installTriggers();
  applyRBAC(); // initial
});