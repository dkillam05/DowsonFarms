// /js/tiles-rbac.js
// Strict RBAC for Home tiles: hide ALL tiles by default, then show only
// those with explicit view:true in Firestore permissions.
// Precedence: employee.permissions > user.permissions > role.permissions

import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const sleep = (ms)=>new Promise(r=>setTimeout(r,ms));
const norm  = (s)=>String(s||'').replace(/\s+/g,' ').trim();

// --- Gate CSS: keep tiles invisible until we decide what to show
(function installGateCSS(){
  if (document.getElementById('rbac-tiles-style')) return;
  const s = document.createElement('style');
  s.id = 'rbac-tiles-style';
  s.textContent = `
    .df-tiles[data-source].rbac-pending [data-section] { display:none !important; }
  `;
  document.head.appendChild(s);
})();

function host(){ return document.querySelector('.df-tiles[data-source]'); }
function markPending(on){ const h=host(); if (!h) return; h.classList.toggle('rbac-pending', !!on); }

// --- Wait for Firebase + auth + tiles
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

// --- Pull effective permissions like the rules do
async function readDocs(db, user){
  const emailLower = (user?.email||'').toLowerCase();
  const uid        = user?.uid || '';

  const get = (p)=>getDoc(doc(db, ...p.split('/'))).then(s=>s.exists()?s.data():null);

  const userDoc = emailLower ? await get(`users/${emailLower}`) : null;
  const empDoc  = uid ? await get(`employees/${uid}`) : null;

  const roleId  = (empDoc?.roleId) || (userDoc?.roleId) || null;
  const roleDoc = roleId ? await get(`roles/${roleId}`) : null;

  return { emp: empDoc, usr: userDoc, role: roleDoc };
}

// --- Read-only checks
function hasView(perms, menu, sub){
  if (!perms) return false;
  const M = perms[menu];
  if (!M) return false;
  const exact = M[sub];
  const starSub = M['*'];
  return !!((exact && exact.view===true) || (starSub && starSub.view===true));
}
function canView(all, menu, sub){
  return (
    hasView(all.emp?.permissions,  menu, sub) ||
    hasView(all.usr?.permissions,  menu, sub) ||
    hasView(all.role?.permissions, menu, sub)
  );
}

// --- DOM helpers (work with current ui-nav)
function sections(){ return Array.from(document.querySelectorAll('.df-tiles[data-source] [data-section]')); }
function sectionLabel(sec){ return norm(sec.getAttribute('data-section') || sec.querySelector('h2,h3,strong')?.textContent || ''); }
function tilesOf(sec){
  const exp = Array.from(sec.querySelectorAll('[data-submenu]'));
  if (exp.length) return exp;
  // graceful fallback: clickable cards/links with text
  return Array.from(sec.querySelectorAll('a,button,.tile')).filter(el=>{
    const tag = el.tagName.toLowerCase();
    if (tag==='h2'||tag==='h3'||el.closest('nav')) return false;
    return norm(el.textContent).length>0;
  });
}
function tileLabel(tile){
  return norm(tile.getAttribute('data-submenu') || tile.querySelector('strong,span,div')?.textContent || tile.textContent || '');
}

// --- Main filter (STRICT)
async function applyRBAC(){
  try{
    markPending(true);

    const { db, auth } = await waitForFirebase();
    await waitForTiles();

    const user = auth.currentUser;
    if (!user){ markPending(false); return; } // no user: show nothing special

    const docs = await readDocs(db, user);

    let totalShown = 0;
    sections().forEach(sec=>{
      const menu = sectionLabel(sec);
      let shownHere = 0;

      tilesOf(sec).forEach(tile=>{
        const sub = tileLabel(tile);
        const allow = canView(docs, menu, sub);
        // STRICT: default is hidden unless allow === true
        tile.style.display = allow ? '' : 'none';
        if (allow) shownHere++;
      });

      // hide entire section if nothing remains
      sec.style.display = shownHere ? '' : 'none';
      totalShown += shownHere;
    });

    // Optional: if nothing at all is visible, you could inject a friendly message here.
  } catch (e) {
    console.warn('[tiles-rbac] skipped:', e?.message || e);
  } finally {
    markPending(false);
  }
}

// --- Triggers
function installTriggers(){
  try { window.DF_FB_API?.onAuth?.(()=>applyRBAC()); } catch(_){}
  const h = host();
  if (h && 'MutationObserver' in window){
    const mo = new MutationObserver(m => { if (m.some(x=>x.type==='childList')) applyRBAC(); });
    mo.observe(h, { childList:true, subtree:true });
  }
}

document.addEventListener('DOMContentLoaded', () => { installTriggers(); applyRBAC(); });