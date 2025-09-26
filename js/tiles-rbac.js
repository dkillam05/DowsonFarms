// /js/tiles-rbac.js  (ES module, robust URL-based filter)
// Purpose: Hide Home tiles the signed-in user cannot VIEW using URL→perm mapping.
// Precedence: user.permissions > role.permissions
// Works with your repo structure (no label guessing).

import { doc, getDoc, getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const sleep = (ms)=> new Promise(r=>setTimeout(r,ms));

/* ---------------- CSS gate: no flash ---------------- */
(function installGateCSS(){
  if (document.getElementById('rbac-tiles-style')) return;
  const s = document.createElement('style');
  s.id = 'rbac-tiles-style';
  s.textContent = `
    .df-tiles.rbac-pending [data-section]{ display:none !important; }
  `;
  document.head.appendChild(s);
})();
function markPending(on){
  const host = document.querySelector('.df-tiles[data-source]');
  if (!host) return;
  if (on) host.classList.add('rbac-pending');
  else    host.classList.remove('rbac-pending');
}

/* ---------------- Helpers: env + DOM ---------------- */
function repoRoot(){
  // Use <base href="/DowsonFarms/"> if present
  const baseEl = document.querySelector('base');
  if (baseEl && baseEl.href) {
    try { return new URL(baseEl.href).pathname.replace(/\/+$/,'') + '/'; } catch(_){}
  }
  // Fallback: first path segment as repo folder
  const seg = (location.pathname||'/').split('/').filter(Boolean);
  return seg.length ? `/${seg[0]}/` : '/';
}
function toRepoRelative(href){
  // Normalize to path like "crop-production/crop-planting.html"
  const abs = new URL(href, location.origin + repoRoot());
  const path = abs.pathname;
  const root = repoRoot();
  return path.startsWith(root) ? path.slice(root.length) : path.replace(/^\/+/, '');
}
function sections(){ return Array.from(document.querySelectorAll('.df-tiles[data-source] [data-section]')); }
function tilesInSection(sec){
  // All anchor tiles inside a section
  return Array.from(sec.querySelectorAll('a[href]'));
}

/* ---------------- URL → (menu, submenu) mapping ----------------
   Based on your repo structure you pasted. Extend here if you add pages.
------------------------------------------------------------------ */
const MAP = [
  // Crop Production
  { rx: /^crop-production\/crop-planting\.html$/i,   menu: 'Crop Production', submenu: 'Planting' },
  { rx: /^crop-production\/crop-spraying\.html$/i,   menu: 'Crop Production', submenu: 'Spraying' },
  { rx: /^crop-production\/crop-fertilizer\.html$/i, menu: 'Crop Production', submenu: 'Fertilizer' },
  { rx: /^crop-production\/crop-scouting\.html$/i,   menu: 'Crop Production', submenu: 'Scouting' },
  { rx: /^crop-production\/crop-harvest\.html$/i,    menu: 'Crop Production', submenu: 'Harvest' },
  { rx: /^crop-production\/crop-trials\.html$/i,     menu: 'Crop Production', submenu: 'Trials' },
  { rx: /^crop-production\/crop-aerial\.html$/i,     menu: 'Crop Production', submenu: 'Aerial' },
  { rx: /^crop-production\/crop-maintenance\.html$/i,menu: 'Crop Production', submenu: 'Maintenance' },

  // Equipment
  { rx: /^equipment\/index\.html$/i,                 menu: 'Equipment', submenu: '*' },
  { rx: /^equipment\/equipment-tractors\.html$/i,    menu: 'Equipment', submenu: 'Tractors' },
  { rx: /^equipment\/equipment-sprayers\.html$/i,    menu: 'Equipment', submenu: 'Sprayers' },
  { rx: /^equipment\/equipment-combines\.html$/i,    menu: 'Equipment', submenu: 'Combines' },
  { rx: /^equipment\/equipment-construction\.html$/i,menu: 'Equipment', submenu: 'Construction' },
  { rx: /^equipment\/equipment-implements\.html$/i,  menu: 'Equipment', submenu: 'Implements' },
  { rx: /^equipment\/equipment-trailers\.html$/i,    menu: 'Equipment', submenu: 'Trailers' },
  { rx: /^equipment\/equipment-trucks\.html$/i,      menu: 'Equipment', submenu: 'Trucks' },
  { rx: /^equipment\/equipment-starfire\.html$/i,    menu: 'Equipment', submenu: 'Starfire' },

  // Grain Tracking
  { rx: /^grain-tracking\/index\.html$/i,            menu: 'Grain Tracking', submenu: '*' },
  { rx: /^grain-tracking\/grain-bins\.html$/i,       menu: 'Grain Tracking', submenu: 'Bins' },
  { rx: /^grain-tracking\/grain-bags\.html$/i,       menu: 'Grain Tracking', submenu: 'Bags' },
  { rx: /^grain-tracking\/grain-contracts\.html$/i,  menu: 'Grain Tracking', submenu: 'Contracts' },
  { rx: /^grain-tracking\/grain-ticket-ocr\.html$/i, menu: 'Grain Tracking', submenu: 'Ticket OCR' },

  // Teams & Partners
  { rx: /^teams-partners\/index\.html$/i,            menu: 'Teams & Partners', submenu: '*' },
  { rx: /^teams-partners\/teams-employees\.html$/i,  menu: 'Teams & Partners', submenu: 'Employees' },
  { rx: /^teams-partners\/teams-vendors\.html$/i,    menu: 'Teams & Partners', submenu: 'Vendors' },
  { rx: /^teams-partners\/teams-sub-contractors\.html$/i, menu: 'Teams & Partners', submenu: 'Sub-Contractors' },
  { rx: /^teams-partners\/teams-dictionary\.html$/i, menu: 'Teams & Partners', submenu: 'Dictionary' },

  // Settings & Setup
  { rx: /^settings-setup\/index\.html$/i,            menu: 'Settings & Setup', submenu: '*' },
  { rx: /^settings-setup\/ss-roles\.html$/i,         menu: 'Settings & Setup', submenu: 'Account Roles' },
  { rx: /^settings-setup\/ss-crop-types\.html$/i,    menu: 'Settings & Setup', submenu: 'Crop Types' },
  { rx: /^settings-setup\/ss-farms\.html$/i,         menu: 'Settings & Setup', submenu: 'Farms' },
  { rx: /^settings-setup\/ss-fields\.html$/i,        menu: 'Settings & Setup', submenu: 'Fields' },
  { rx: /^settings-setup\/ss-theme\.html$/i,         menu: 'Settings & Setup', submenu: 'Theme' },
  { rx: /^settings-setup\/products\/index\.html$/i,  menu: 'Settings & Setup', submenu: 'Products' },
  { rx: /^settings-setup\/products\/products-seed\.html$/i,         menu: 'Settings & Setup', submenu: 'Products - Seed' },
  { rx: /^settings-setup\/products\/products-fertilizer\.html$/i,   menu: 'Settings & Setup', submenu: 'Products - Fertilizer' },
  { rx: /^settings-setup\/products\/products-chemical\.html$/i,     menu: 'Settings & Setup', submenu: 'Products - Chemical' },
  { rx: /^settings-setup\/products\/products-grain-bags\.html$/i,   menu: 'Settings & Setup', submenu: 'Products - Grain Bags' },

  // Calculators
  { rx: /^calculators\/index\.html$/i,               menu: 'Calculators', submenu: '*' },
  { rx: /^calculators\/calc-area\.html$/i,           menu: 'Calculators', submenu: 'Field Area' },
  { rx: /^calculators\/calc-chemical-mix\.html$/i,   menu: 'Calculators', submenu: 'Chemical Mix' },
  { rx: /^calculators\/calc-combine-yield\.html$/i,  menu: 'Calculators', submenu: 'Combine Yield' },
  { rx: /^calculators\/calc-grain-bin\.html$/i,      menu: 'Calculators', submenu: 'Grain Bin' },
  { rx: /^calculators\/calc-grain-shrink\.html$/i,   menu: 'Calculators', submenu: 'Grain Shrink' },
  { rx: /^calculators\/calc-trial-yields\.html$/i,   menu: 'Calculators', submenu: 'Trial Yields' },

  // Reports
  { rx: /^reports\/index\.html$/i,                   menu: 'Reports', submenu: '*' },
  { rx: /^reports\/reports-ai\.html$/i,              menu: 'Reports', submenu: 'AI' },
  { rx: /^reports\/reports-ai-history\.html$/i,      menu: 'Reports', submenu: 'AI History' },
  { rx: /^reports\/reports-predefined\.html$/i,      menu: 'Reports', submenu: 'Predefined' },

  // Feedback
  { rx: /^feedback\/index\.html$/i,                  menu: 'Feedback', submenu: '*' },
  { rx: /^feedback\/fb-bugs\.html$/i,                menu: 'Feedback', submenu: 'Bugs' },
  { rx: /^feedback\/fb-ideas\.html$/i,               menu: 'Feedback', submenu: 'Ideas' },

  // Field Maintenance (standalone section)
  { rx: /^field-maintenance\/field-maintenance\.html$/i, menu: 'Field Maintenance', submenu: 'Field Maintenance' },
];

function menuSubForPath(relPath){
  for (const m of MAP){
    if (m.rx.test(relPath)) return { menu: m.menu, sub: m.submenu };
  }
  return null; // unknown → leave tile visible (fail-safe)
}

/* ---------------- Firestore: load user+role ---------------- */
async function waitForFirebase(maxMs=15000){
  const t0 = Date.now();
  while ((!window.DF_FB || !window.DF_FB.db || !window.DF_FB.auth) && (Date.now()-t0) < maxMs){
    await sleep(60);
  }
  if (!window.DF_FB || !window.DF_FB.db) throw new Error('Firebase not ready');
  return window.DF_FB;
}

async function loadPerms(db, user){
  if (!user) return { userPerms:null, rolePerms:null };
  const emailLower = (user.email||'').toLowerCase();
  const userSnap = emailLower ? await getDoc(doc(db,'users', emailLower)) : null;
  const userDoc  = (userSnap && userSnap.exists()) ? userSnap.data() : null;

  let roleDoc = null;
  const roleId = userDoc && userDoc.roleId;
  if (roleId) {
    const r = await getDoc(doc(db,'roles', String(roleId)));
    roleDoc = (r && r.exists()) ? r.data() : null;
  }
  return {
    userPerms: (userDoc && userDoc.permissions) || null,
    rolePerms: (roleDoc && roleDoc.permissions) || null
  };
}

function permAllows(permMap, menu, sub){
  if (!permMap) return false;
  // exact submenu, wildcard submenu, wildcard menu/sub
  return !!(
    (permMap[menu] && permMap[menu][sub] && permMap[menu][sub].view === true) ||
    (permMap[menu] && permMap[menu]['*'] && permMap[menu]['*'].view === true) ||
    (permMap['*']   && permMap['*'][sub] && permMap['*'][sub].view === true) ||
    (permMap['*']   && permMap['*']['*'] && permMap['*']['*'].view === true)
  );
}
function canView(perms, menu, sub){
  return permAllows(perms.userPerms, menu, sub) || permAllows(perms.rolePerms, menu, sub);
}

/* ---------------- Main filter ---------------- */
async function applyRBAC(){
  try{
    markPending(true);

    const { db, auth } = await waitForFirebase();
    // Wait for tiles to be drawn (ui-nav)
    const t0 = Date.now();
    while (!document.querySelector('.df-tiles[data-source] [data-section]') && (Date.now()-t0) < 8000){
      await sleep(60);
    }

    const user = auth.currentUser;
    if (!user) { markPending(false); return; }

    const perms = await loadPerms(db, user);

    let totalKept = 0;
    for (const sec of sections()){
      let keptHere = 0;
      for (const a of tilesInSection(sec)){
        const rel = toRepoRelative(a.getAttribute('href'));
        const ms  = menuSubForPath(rel);
        if (!ms) { keptHere++; continue; } // unknown path → leave visible
        if (!canView(perms, ms.menu, ms.sub)) {
          a.style.display = 'none';
        } else {
          keptHere++;
          totalKept++;
        }
      }
      if (!keptHere) sec.style.display = 'none';
    }

    // Optionally show a friendly note if totalKept===0
  } catch (e) {
    console.warn('[tiles-rbac] skipped:', e?.message || e);
  } finally {
    markPending(false);
  }
}

/* ---------------- Triggers ---------------- */
function installTriggers(){
  // re-run when auth state restores
  try { window.DF_FB_API?.onAuth?.(()=> applyRBAC()); } catch(_){}

  // re-run if ui-nav mutates tiles later
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