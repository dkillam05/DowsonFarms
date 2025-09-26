// /js/tiles-rbac.js  (ES module)
// Hides Home tiles the signed-in user cannot VIEW.
// Precedence: employee.permissions > user.permissions > role.permissions

import {
  getFirestore, doc, getDoc
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const sleep = (ms)=> new Promise(r=>setTimeout(r,ms));
const norm  = (s)=> String(s||'').trim().replace(/\s+/g,' ').toLowerCase();

// ---------- wait for DF_FB + auth restoration ----------
async function waitForFirebase(maxMs=12000){
  const t0 = Date.now();
  while ((!window.DF_FB || !window.DF_FB.db || !window.DF_FB.auth) && (Date.now()-t0)<maxMs){
    await sleep(80);
  }
  if (!window.DF_FB || !window.DF_FB.db) throw new Error('firebase not ready');
  return window.DF_FB;
}

// ---------- pull docs similar to rules ----------
async function readDocs(db, user){
  const emailLower = (user?.email||'').toLowerCase();
  const uid        = user?.uid || '';

  const userSnap = emailLower ? await getDoc(doc(db,'users', emailLower)) : null;
  const userDoc  = (userSnap && userSnap.exists()) ? userSnap.data() : null;

  const empSnap  = uid ? await getDoc(doc(db,'employees', uid)) : null;
  const empDoc   = (empSnap && empSnap.exists()) ? empSnap.data() : null;

  // prefer employee.roleId, then user.roleId
  const roleId = (empDoc && empDoc.roleId) || (userDoc && userDoc.roleId) || null;
  const roleSnap = roleId ? await getDoc(doc(db,'roles', roleId)) : null;
  const roleDoc  = (roleSnap && roleSnap.exists()) ? roleSnap.data() : null;

  return { empDoc, userDoc, roleDoc };
}

// ---------- permission lookup (view only) ----------
function hasView(perms, menuLabel, subLabel){
  if (!perms) return false;
  const m = perms[menuLabel]; if (!m) return false;
  const s = m[subLabel] || m['*'];
  return !!(s && s.view === true);
}

function canView({empDoc,userDoc,roleDoc}, menuLabel, subLabel){
  return (
    hasView(empDoc?.permissions, menuLabel, subLabel) ||
    hasView(userDoc?.permissions, menuLabel, subLabel) ||
    hasView(roleDoc?.permissions, menuLabel, subLabel)
  );
}

// ---------- tile filtering ----------
function getRenderedSections(){
  // ui-nav renders sections like: .df-tiles [data-section="<Menu Label>"]
  const host = document.querySelector('.df-tiles[data-source]');
  if (!host) return [];
  return Array.from(host.querySelectorAll('[data-section]'));
}

// robust helpers to read labels off DOM even if attributes change
function readMenuLabel(sectionEl){
  return sectionEl.getAttribute('data-section') || sectionEl.querySelector('h2,h3,strong')?.textContent || '';
}
function findTiles(sectionEl){
  // typical cards: .tile or a elements within the section
  const explicit = sectionEl.querySelectorAll('[data-submenu]');
  if (explicit.length) return Array.from(explicit);
  const guessed  = sectionEl.querySelectorAll('.tile, a, button');
  return Array.from(guessed).filter(el=>{
    // skip headers and separators
    const tag = el.tagName.toLowerCase();
    if (tag==='h2'||tag==='h3'||el.closest('nav')) return false;
    // has some clickable content
    const txt = el.textContent?.trim();
    return !!txt;
  });
}
function readSubmenuLabel(tileEl){
  return tileEl.getAttribute('data-submenu')
      || tileEl.querySelector('strong,span,div')?.textContent
      || tileEl.textContent
      || '';
}

function hideEmpty(sectionEl){
  const visible = sectionEl.querySelectorAll(':scope *').length &&
                  sectionEl.querySelectorAll(':scope *').length > 0 &&
                  Array.from(findTiles(sectionEl)).some(el => el.style.display !== 'none');
  if (!visible) {
    sectionEl.style.display = 'none';
  }
}

// ---------- main filter routine ----------
async function filterTilesForUser(){
  try{
    // Wait for auth + tiles to exist
    const { db, auth } = await waitForFirebase();
    // wait until ui-nav finished rendering (sections exist)
    let tries = 0;
    while (getRenderedSections().length === 0 && tries++ < 100){ await sleep(60); }

    const user = auth.currentUser;
    if (!user) return; // no user -> don't change UI (passive)

    const docs = await readDocs(db, user);

    const sections = getRenderedSections();
    sections.forEach(section=>{
      const menuLabel  = readMenuLabel(section);
      const menuN      = norm(menuLabel);
      const tiles      = findTiles(section);

      let anyVisible = false;

      tiles.forEach(tile=>{
        const subLabel = readSubmenuLabel(tile);
        const ok = canView(docs, menuLabel, subLabel);
        if (!ok) {
          tile.style.display = 'none';
        } else {
          anyVisible = true;
        }
      });

      if (!anyVisible) {
        section.style.display = 'none';
      }
    });
  }catch(e){
    // fail quietly (never block UI)
    console.warn('[tiles-rbac] filter skipped:', e?.message || e);
  }
}

// ---------- re-run when auth restores OR menu data swaps ----------
function installTriggers(){
  try{
    // when auth changes
    window.DF_FB_API?.onAuth?.(()=> filterTilesForUser());
  }catch(_){}
  // when menus render late
  const host = document.querySelector('.df-tiles[data-source]');
  if (host && 'MutationObserver' in window){
    const mo = new MutationObserver((muts)=>{
      // if child list changed, attempt filter again
      if (muts.some(m=>m.type==='childList')) filterTilesForUser();
    });
    mo.observe(host, { childList:true, subtree:true });
  }
}

document.addEventListener('DOMContentLoaded', ()=>{
  installTriggers();
  filterTilesForUser(); // initial attempt
});