// /js/tiles-rbac.js  (FULL REPLACEMENT)
// Hides Home tiles the signed-in user cannot VIEW.
// Precedence: employee.permissions > user.permissions > role.permissions

import { getFirestore, doc, getDoc }
  from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

/* ---------------- tiny utils ---------------- */
const sleep = (ms)=> new Promise(r=>setTimeout(r,ms));

/** collapse whitespace/newlines, normalize " / " spacing, trim */
function tidy(s){
  s = String(s || '');
  // strip leading emoji/symbols commonly used in tile headers
  s = s.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\s]+/gu, '');
  s = s.replace(/\s+/g, ' ').trim();
  // normalize slash spacing to: space-slash-space
  s = s.replace(/\s*\/\s*/g, ' / ');
  return s;
}
function lc(s){ return tidy(s).toLowerCase(); }

/* ---------------- CSS gate (no flash) ---------------- */
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
  host.classList.toggle('rbac-pending', !!on);
}

/* ---------------- waiters ---------------- */
async function waitForFirebase(maxMs=15000){
  const t0 = Date.now();
  while ((!window.DF_FB || !window.DF_FB.db || !window.DF_FB.auth) && (Date.now()-t0)<maxMs){
    await sleep(60);
  }
  if (!window.DF_FB || !window.DF_FB.db) throw new Error('Firebase not ready');
  return window.DF_FB;
}
async function waitForTiles(maxMs=12000){
  const t0 = Date.now();
  while (!document.querySelector('.df-tiles[data-source] [data-section]') && (Date.now()-t0)<maxMs){
    await sleep(60);
  }
}

/* ---------------- load profile docs (mirrors rules precedence) ---------------- */
async function readDocs(db, user){
  const emailLower = (user?.email||'').toLowerCase();
  const uid        = user?.uid || '';

  const userSnap = emailLower ? await getDoc(doc(db,'users', emailLower)) : null;
  const userDoc  = (userSnap && userSnap.exists()) ? userSnap.data() : null;

  const empSnap  = uid ? await getDoc(doc(db,'employees', uid)) : null;
  const empDoc   = (empSnap && empSnap.exists()) ? empSnap.data() : null;

  const roleId   = (empDoc && empDoc.roleId) || (userDoc && userDoc.roleId) || null;
  const roleSnap = roleId ? await getDoc(doc(db,'roles', roleId)) : null;
  const roleDoc  = (roleSnap && roleSnap.exists()) ? roleSnap.data() : null;

  return { empDoc, userDoc, roleDoc };
}

/* ---------------- permission lookups (VIEW only) ---------------- */
function hasViewRaw(perms, menu, sub){
  if (!perms) return false;
  const mm = perms[menu]; if (!mm) return false;
  const subMap = mm[sub] || mm['*'];
  return !!(subMap && subMap.view === true);
}
function hasViewLoose(perms, menuLabel, subLabel){
  if (!perms) return false;

  // try exact tidy
  const M  = tidy(menuLabel);
  const S  = tidy(subLabel);
  if (hasViewRaw(perms, M, S)) return true;

  // try normalized slash spacing (already done by tidy) — but attempt lowercase keys
  const mlc = lc(M), slc = lc(S);

  // Build a lowercase mirror of perms on first use (cache on object)
  if (!perms.__lc__) {
    const m2 = {};
    Object.keys(perms || {}).forEach(m=>{
      const mKey = lc(m);
      const subObj = perms[m] || {};
      const s2 = {};
      Object.keys(subObj).forEach(s=>{
        const sKey = lc(s);
        if (sKey === '__lc__') return;
        s2[sKey] = subObj[s];
      });
      m2[mKey] = s2;
    });
    Object.defineProperty(perms, '__lc__', { value:m2, enumerable:false });
  }
  const mm = perms.__lc__[mlc];
  if (!mm) return false;
  const sub = mm[slc] || mm['*'];
  return !!(sub && sub.view === true);
}

function canView(all, menuLabel, subLabel){
  return (
    hasViewLoose(all.empDoc?.permissions,  menuLabel, subLabel) ||
    hasViewLoose(all.userDoc?.permissions, menuLabel, subLabel) ||
    hasViewLoose(all.roleDoc?.permissions, menuLabel, subLabel)
  );
}

/* ---------------- DOM helpers ---------------- */
function sections(){ return Array.from(document.querySelectorAll('.df-tiles[data-source] [data-section]')); }
function sectionLabel(sec){
  // prefer explicit data-section, else visible heading text
  return tidy(sec.getAttribute('data-section') || sec.querySelector('h2,h3,strong')?.textContent || '');
}
function tilesOf(sec){
  // Prefer explicit attribute if present (some renderers add data-submenu)
  const explicit = Array.from(sec.querySelectorAll('[data-submenu]'));
  if (explicit.length) return explicit;

  // Fallback to common card/link nodes that contain user-facing titles
  const guess = Array.from(sec.querySelectorAll('a.tile, a, .tile, button'));
  return guess.filter(el => {
    const tag = el.tagName.toLowerCase();
    if (tag==='h2'||tag==='h3'||el.closest('nav')) return false;
    const txt = tidy(el.querySelector('.tile__title, strong, span, div')?.textContent || el.textContent);
    return !!txt;
  });
}
function tileLabel(tile){
  const s = tile.getAttribute('data-submenu')
        || tile.querySelector('.tile__title, strong, span, div')?.textContent
        || tile.textContent
        || '';
  return tidy(s);
}

/* ---------------- main filter ---------------- */
async function applyRBAC(){
  try{
    markPending(true);

    const { db, auth } = await waitForFirebase();
    await waitForTiles();

    const user = auth.currentUser;
    if (!user) { markPending(false); return; } // not signed in: leave tiles alone

    const docs = await readDocs(db, user);

    let totalKept = 0;
    sections().forEach(sec=>{
      const menu = sectionLabel(sec);
      let keptHere = 0;

      tilesOf(sec).forEach(tile=>{
        const sub = tileLabel(tile);
        const ok  = canView(docs, menu, sub);
        if (!ok) {
          tile.style.display = 'none';
        } else {
          keptHere++; totalKept++;
        }
      });

      if (!keptHere) sec.style.display = 'none';
    });

    // If nothing kept, you could inject a friendly message here.
    if (totalKept === 0) {
      // no-op
    }
  } catch (e) {
    console.warn('[tiles-rbac] skipped:', e?.message || e);
  } finally {
    markPending(false);
  }
}

/* ---------------- triggers ---------------- */
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
  applyRBAC();
});