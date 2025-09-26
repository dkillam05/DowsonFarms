<script type="module">
// Dowson Farms — Home tiles RBAC (FULL FILE)
// Hides any .df-tiles[data-section] tile when the user lacks View on *all*
// of its child submenus. Works with your Employee→User→Role precedence.

import {
  doc, getDoc
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// ---- Tiny helpers
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
const sleep = (ms)=>new Promise(r=>setTimeout(r,ms));

// Match the exact menu labels you use in DF_MENUS and on Home tiles
function getAllMenusFromDF() {
  const df = window.DF_MENUS || {};
  const out = {};
  (df.tiles||[]).forEach(t=>{
    const top = String(t.label||'').trim();
    if (!top) return;
    out[top] = (t.children||[]).map(c => String(c.label||'').trim()).filter(Boolean);
  });
  return out;
}

// Safe read for Employee→User→Role precedence
async function readAuthContext() {
  // wait for firebase-init
  let tries = 0;
  while ((!window.DF_FB || !DF_FB.db || !DF_FB.auth) && tries < 250) {
    await sleep(60); tries++;
  }
  if (!window.DF_FB || !DF_FB.db) return null;

  const { db, auth } = DF_FB;
  const user = auth.currentUser || null;
  if (!user) return { db, user:null, emailLower:null, employee:null, userDoc:null, roleDoc:null };

  const emailLower = (user.email||'').toLowerCase();

  const empSnap  = await getDoc(doc(db, 'employees', user.uid)).catch(()=>null);
  const usrSnap  = await getDoc(doc(db, 'users', emailLower)).catch(()=>null);

  // prefer employee.roleId, then user.roleId
  let roleId = empSnap?.exists() && empSnap.data().roleId
             ? empSnap.data().roleId
             : (usrSnap?.exists() && usrSnap.data().roleId ? usrSnap.data().roleId : null);
  const roleSnap = roleId ? await getDoc(doc(db,'roles', roleId)).catch(()=>null) : null;

  return {
    db,
    user,
    emailLower,
    employee: empSnap?.exists() ? empSnap.data() : null,
    userDoc: usrSnap?.exists() ? usrSnap.data() : null,
    roleDoc: roleSnap?.exists() ? roleSnap.data() : null
  };
}

// Pull merged permission map (Employee overrides > User overrides > Role defaults)
function mergedPerms(ctx){
  const pEmp  = ctx.employee?.permissions || null;
  const pUser = ctx.userDoc?.permissions || null;
  const pRole = ctx.roleDoc?.permissions || null;
  // We only need boolean presence; precedence means: if any layer says true, keep true.
  function merge(a,b){
    if (!a) return b||{};
    if (!b) return a||{};
    const out = {};
    const menus = new Set([...Object.keys(a||{}), ...Object.keys(b||{})]);
    menus.forEach(menu=>{
      out[menu] = out[menu] || {};
      const subs = new Set([
        ...Object.keys(a[menu]||{}),
        ...Object.keys(b[menu]||{})
      ]);
      subs.forEach(sub=>{
        out[menu][sub] = out[menu][sub] || {};
        const acts = new Set([
          ...Object.keys(a[menu]?.[sub]||{}),
          ...Object.keys(b[menu]?.[sub]||{})
        ]);
        acts.forEach(act=>{
          out[menu][sub][act] =
            !!(a[menu]?.[sub]?.[act] || b[menu]?.[sub]?.[act]);
        });
      });
    });
    return out;
  }
  return merge(merge(pRole, pUser), pEmp);
}

// Check View permission for a specific (menu, submenu)
function canView(perms, menu, submenu){
  const p = perms?.[menu]?.[submenu];
  return !!(p && p.view === true);
}

// Hide tiles that have no visible submenus
function applyToTiles(perms){
  const MENUS = getAllMenusFromDF();

  // A tile group on Home looks like: <section class="df-tiles" data-section="Calculators">…</section>
  // Inside, each link/button should have data-submenu="Area" etc. If it doesn’t,
  // we’ll fall back to its textContent.
  const sections = $$('.df-tiles[data-section]');
  sections.forEach(sec=>{
    const menu = String(sec.getAttribute('data-section')||'').trim();
    if (!menu) return;

    const links = $$('a,[data-submenu],button[data-submenu]', sec);
    // If the markup doesn’t have data-submenu on items, try to build list from DF_MENUS
    let pairs = links.map(el=>{
      const sub = (el.getAttribute('data-submenu') || el.textContent || '').trim();
      return { el, submenu: sub };
    }).filter(x=>x.submenu);

    if (!pairs.length) {
      // fallback to DF_MENUS definition
      const subs = MENUS[menu] || [];
      pairs = subs.map(s => ({ el:null, submenu:s }));
    }

    // If *any* child submenu has View, keep the tile; else hide it.
    const anyVisible = pairs.some(p => canView(perms, menu, p.submenu));
    if (!anyVisible) {
      sec.style.display = 'none';
      return;
    }

    // Optional: also hide individual child links the user can’t view
    pairs.forEach(p=>{
      if (!p.el) return;
      if (!canView(perms, menu, p.submenu)) {
        p.el.style.display = 'none';
      }
    });
  });

  // If a row becomes empty, collapse its gap (nice polish)
  const rows = $$('.tiles-row');
  rows.forEach(r=>{
    const any = !!r.querySelector('.df-tiles[data-section]:not([style*="display: none"])');
    if (!any) r.style.display = 'none';
  });
}

(async function boot(){
  try{
    const ctx = await readAuthContext();
    if (!ctx || !ctx.user) return;                 // not signed in: leave tiles as-is
    // If this user’s role label is Administrator, show everything (fast-path)
    const roleName = (ctx.roleDoc?.label || ctx.roleDoc?.id || '').toString();
    if ((roleName || '').toLowerCase() === 'administrator') return;

    const perms = mergedPerms(ctx);
    applyToTiles(perms);
  }catch(e){
    console.warn('[tiles-rbac] skipped:', e?.message||e);
  }
})();
</script>
