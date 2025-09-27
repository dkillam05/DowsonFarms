<script>
// Renders the Home page tiles from window.DF_MENUS.tiles
// RBAC: only render tiles the signed-in user can VIEW (view/edit/add/archive/delete)
// Data sources: roles/{roleId}.permissions + users/{email}.exceptions.{enabled,grants}

(function () {
  /* --------------- small utils --------------- */
  const $ = (s)=>document.querySelector(s);
  const sleep = (ms)=>new Promise(r=>setTimeout(r,ms));
  const esc = (s)=>String(s||'').replace(/[&<>"]/g,c=>({ '&':'&amp;','<':'&lt;','>':'&gt;' }[c]||c));
  function ready(fn){ (document.readyState!=='loading') ? fn() : document.addEventListener('DOMContentLoaded', fn); }

  async function waitForFirebase(maxMs=12000){
    const t0 = performance.now();
    while (performance.now()-t0 < maxMs){
      if (window.DF_FB && window.DF_FB.db && window.DF_FB.auth) return window.DF_FB;
      await sleep(60);
    }
    throw new Error('firebase not ready');
  }

  function buildMenusMap(){
    const DF = window.DF_MENUS;
    const map = {};
    if (!DF || !Array.isArray(DF.tiles)) return map;
    DF.tiles.forEach(t=>{
      const top = String(t.label||'').trim(); if (!top) return;
      map[top] = (Array.isArray(t.children) ? t.children : []).map(c=>String(c.label||'').trim()).filter(Boolean);
    });
    return map;
  }

  // Merge role permissions + user overrides into "effective"
  function mergePerms(menusMap, rolePerms, overrides){
    const ACTIONS = ['view','edit','add','archive','delete'];
    const eff = {};
    Object.keys(menusMap).forEach(menu=>{
      eff[menu] = {};
      (menusMap[menu]||[]).forEach(sub=>{
        const b = (rolePerms?.[menu]?.[sub]) || {};
        const o = (overrides?.[menu]?.[sub]) || {};
        const p = {};
        ACTIONS.forEach(k => p[k] = (k in o) ? !!o[k] : !!b[k]);
        eff[menu][sub] = p;
      });
    });
    return eff;
  }
  function canView(effective, menu, sub){
    const p = (effective?.[menu]?.[sub]) || {};
    return !!(p.view || p.edit || p.add || p.archive || p.delete);
  }

  /* --------------- core --------------- */
  ready(async function () {
    const host = $('.df-tiles[data-source="global"]');
    if (!host) return;

    // Hide host until we finish (no flash)
    host.style.visibility = 'hidden';

    // Basic menu data required to know labels
    const tiles = (window.DF_MENUS && Array.isArray(window.DF_MENUS.tiles)) ? window.DF_MENUS.tiles : [];
    if (!tiles.length) {
      host.innerHTML =
        '<div class="card" style="border:2px solid #2e7d32;border-radius:14px;padding:24px;display:flex;align-items:center;justify-content:center;min-height:160px;"><div style="color:#999;">Menu not loaded (assets/data/menus.js)</div></div>';
      host.style.visibility = '';
      return;
    }

    // Compute RBAC
    let eff = null;
    try {
      const { db, auth } = await waitForFirebase();
      const user = auth.currentUser;
      if (user) {
        const email = (user.email||'').toLowerCase();

        // dynamic import so file stays plain <script> (no type=module change)
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');

        // users/{email}
        let roleId = null, overrides = {};
        try {
          const uSnap = await getDoc(doc(db,'users', email));
          if (uSnap.exists()) {
            const u = uSnap.data()||{};
            roleId = u.roleId || u.role || null;
            overrides = (u.exceptions && u.exceptions.enabled) ? (u.exceptions.grants||{}) : {};
          }
        } catch(_) {}

        // roles/{roleId}
        let rolePerms = {};
        if (roleId) {
          try {
            const rSnap = await getDoc(doc(db,'roles', String(roleId)));
            if (rSnap.exists()) {
              const r = rSnap.data()||{};
              rolePerms = (r.permissions && typeof r.permissions==='object') ? r.permissions : {};
            }
          } catch(_) {}
        }

        const MENUS_MAP = buildMenusMap();
        eff = mergePerms(MENUS_MAP, rolePerms, overrides);
      }
    } catch(_) {
      // if Firebase isn’t ready, eff stays null and we’ll render nothing (safer-by-default)
    }

    // Render only tiles the user can view; if no user/effective perms, render nothing
    const html = tiles.map(t=>{
      const label = String(t.label||'').trim();
      const href  = String(t.href||'#');
      const emoji = t.iconEmoji ? (esc(t.iconEmoji)+' ') : '';
      // Check if any child is viewable; Home tiles represent top-level sections
      const children = Array.isArray(t.children) ? t.children : [];
      const anyChildOK = !eff ? false : children.some(c => canView(eff, label, String(c.label||'').trim()));
      if (!anyChildOK) return ''; // hide this tile entirely
      return `<a href="${esc(href)}" class="df-tile" data-menu="${esc(label)}">${emoji}<span>${esc(label)}</span></a>`;
    }).filter(Boolean).join('');

    host.innerHTML = html || '<div class="muted" style="padding:14px;">No sections available for your account.</div>';
    host.style.visibility = '';
  });
})();
</script>