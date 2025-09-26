// /js/tiles-rbac.js  (FULL REPLACEMENT)
// Hides Home tiles the signed-in user cannot VIEW.
// Precedence: employee.permissions > user.permissions > role.permissions

import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const sleep = (ms)=>new Promise(r=>setTimeout(r,ms));
const norm  = (s)=>String(s||'').replace(/\s+/g,' ').trim();

// --- gate CSS so nothing flashes before we filter
(function gateCSS(){
  if (document.getElementById('rbac-tiles-style')) return;
  const s=document.createElement('style'); s.id='rbac-tiles-style';
  s.textContent = `.df-tiles[data-source].rbac-pending *{visibility:hidden}
                   .df-tiles[data-source].rbac-done *{visibility:visible}`;
  document.head.appendChild(s);
})();
function setPending(on){
  const host=document.querySelector('.df-tiles[data-source]');
  if(!host) return;
  host.classList.toggle('rbac-pending', !!on);
  host.classList.toggle('rbac-done', !on);
}

// --- wait helpers
async function waitForFirebase(maxMs=18000){
  const t0=Date.now();
  while((!window.DF_FB || !window.DF_FB.db || !window.DF_FB.auth) && (Date.now()-t0)<maxMs){
    await sleep(60);
  }
  if(!window.DF_FB || !window.DF_FB.db) throw new Error('Firebase not ready');
  return window.DF_FB;
}
async function waitForTiles(maxMs=12000){
  const t0=Date.now();
  const hostSel='.df-tiles[data-source]';
  while((Date.now()-t0)<maxMs){
    const host=document.querySelector(hostSel);
    if(host && host.querySelector('*')) return;
    await sleep(60);
  }
}

// --- Firestore reads (match rules resolution)
async function loadAuthDocs(db, user){
  const email=(user?.email||'').toLowerCase();
  const uid   = user?.uid || '';

  const userSnap = email ? await getDoc(doc(db,'users',email)) : null;
  const userDoc  = userSnap?.exists() ? userSnap.data() : null;

  const empSnap  = uid ? await getDoc(doc(db,'employees',uid)) : null;
  const empDoc   = empSnap?.exists() ? empSnap.data() : null;

  const roleId   = (empDoc?.roleId) || (userDoc?.roleId) || null;
  const roleSnap = roleId ? await getDoc(doc(db,'roles',roleId)) : null;
  const roleDoc  = roleSnap?.exists() ? roleSnap.data() : null;

  return { empDoc, userDoc, roleDoc };
}

// --- permission checks
const hasView = (perms, menu, sub) => {
  if(!perms) return false;
  const pMenu = perms[menu]; if(!pMenu) return false;
  const pSub  = pMenu[sub] || pMenu['*'];
  return !!(pSub && pSub.view===true);
};
const canView = (docs, menu, sub) =>
  hasView(docs.empDoc?.permissions, menu, sub) ||
  hasView(docs.userDoc?.permissions, menu, sub) ||
  hasView(docs.roleDoc?.permissions, menu, sub);

// --- DOM helpers (robust to different markups)
const hostEl = () => document.querySelector('.df-tiles[data-source]');
function allSections(){
  const host = hostEl(); if(!host) return [];
  // Prefer explicit data-section; otherwise, treat each direct child as a section
  const withAttr = Array.from(host.querySelectorAll('[data-section]'));
  if(withAttr.length) return withAttr;
  return Array.from(host.children).filter(n => n.querySelector('h2,h3,strong,span'));
}
function sectionName(sec){
  const ds = sec.getAttribute?.('data-section');
  if(ds) return norm(ds);
  const h = sec.querySelector('h2,h3,strong'); if(h) return norm(h.textContent||'');
  // fallback: first non-empty text
  return norm(sec.textContent||'');
}
function tilesIn(sec){
  // explicit
  const explicit = Array.from(sec.querySelectorAll('[data-submenu]'));
  if(explicit.length) return explicit;
  // common patterns
  const cards = Array.from(sec.querySelectorAll('a,button,.tile,.card')).filter(el=>{
    const t = el.tagName.toLowerCase();
    if(t==='h2'||t==='h3'||el.closest('nav')) return false;
    return norm(el.textContent).length>0;
  });
  return cards;
}
function tileName(tile){
  const ds = tile.getAttribute?.('data-submenu');
  if(ds) return norm(ds);
  const strong = tile.querySelector('strong'); if(strong) return norm(strong.textContent||'');
  const span   = tile.querySelector('span,div'); if(span) return norm(span.textContent||'');
  return norm(tile.textContent||'');
}

// --- main filter
async function run(){
  try{
    setPending(true);
    const { db, auth } = await waitForFirebase();
    await waitForTiles();

    const user = auth.currentUser;
    if(!user){ setPending(false); return; }

    const docs = await loadAuthDocs(db, user);

    // Build quick lookup of menus with any visible sub
    const allowedMenus = new Set();
    const permsList = [docs.empDoc?.permissions, docs.userDoc?.permissions, docs.roleDoc?.permissions].filter(Boolean);
    permsList.forEach(perms=>{
      Object.keys(perms||{}).forEach(menu=>{
        const subs = perms[menu]||{};
        const anyView = Object.keys(subs).some(s => subs[s]?.view===true);
        if(anyView) allowedMenus.add(norm(menu));
      });
    });

    let keptTotal = 0;
    allSections().forEach(sec=>{
      const menu = sectionName(sec);
      let keptHere = 0;

      // If menu itself has no view anywhere, hide whole section quickly.
      if(!allowedMenus.has(menu)){
        sec.style.display='none';
        return;
      }

      tilesIn(sec).forEach(tile=>{
        const sub = tileName(tile);
        const ok  = canView(docs, menu, sub);
        if(ok){ keptHere++; keptTotal++; }
        else { tile.style.display='none'; }
      });

      if(!keptHere) sec.style.display='none';
    });

    // Optionally, if nothing remains, you could show a message here.
  } finally {
    setPending(false);
  }
}

// --- triggers
function install(){
  try{ window.DF_FB_API?.onAuth?.(()=>run()); }catch(_){}
  const host = hostEl();
  if(host && 'MutationObserver' in window){
    const mo = new MutationObserver(m=>{ if(m.some(x=>x.type==='childList')) run(); });
    mo.observe(host, { childList:true, subtree:true });
  }
  run();
}

document.addEventListener('DOMContentLoaded', install);