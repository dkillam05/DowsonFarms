// js/ui-subnav.js
(function(){
  const $ = s=>document.querySelector(s);
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
  function lastSegment(path){ const trimmed = path.replace(/\/+$/,''); const segs = trimmed.split('/'); return segs[segs.length-1] || ''; }
  function currentFolder(){ const folder = lastSegment(location.pathname.replace(/\/index\.html?$/i,'').replace(/\/+$/,'')); return folder || ''; }
  function normalizeHref(href, curFolder){
    const h = String(href||''); if (!h) return '#';
    if (h.startsWith('#')) return h; if (/^[a-z]+:\/\//i.test(h)) return h; if (h.startsWith('/')) return h;
    const prefix = curFolder ? (curFolder + '/') : '';
    if (prefix && h.toLowerCase().startsWith(prefix.toLowerCase())) return h.slice(prefix.length);
    return h;
  }
  function buildMenusArray(){ return (window.DF_MENUS && Array.isArray(window.DF_MENUS.tiles)) ? window.DF_MENUS.tiles : []; }
  function findSectionByNameOrHref(tiles, nameGuess){
    const g = (nameGuess||'').toLowerCase();
    for (const t of tiles){
      const labelMatch = (t.label||'').toLowerCase() === g;
      const hrefMatch  = (t.href||'').toLowerCase().includes(g.replace(/\s+/g,'-'));
      if (labelMatch || hrefMatch) return t;
    }
    return null;
  }
  function buildMenusMap(){
    const tiles = buildMenusArray(); const map = {};
    tiles.forEach(t=>{
      const top = String(t.label||'').trim(); if (!top) return;
      map[top] = (Array.isArray(t.children)?t.children:[]).map(c=>String(c.label||'').trim()).filter(Boolean);
    });
    return map;
  }
  function mergePerms(menusMap, rolePerms, overrides){
    const ACTIONS = ['view','edit','add','archive','delete'];
    const eff = {};
    Object.keys(menusMap).forEach(menu=>{
      eff[menu] = {};
      (menusMap[menu]||[]).forEach(sub=>{
        const b = (rolePerms?.[menu]?.[sub]) || {};
        const o = (overrides?.[menu]?.[sub]) || {};
        const p = {}; ACTIONS.forEach(k => p[k] = (k in o) ? !!o[k] : !!b[k]);
        eff[menu][sub] = p;
      });
    });
    return eff;
  }
  function canView(eff, menu, sub){ const p = (eff?.[menu]?.[sub]) || {}; return !!(p.view||p.edit||p.add||p.archive||p.delete); }

  ready(async function(){
    const host = $('.df-tiles[data-section]'); if (!host) return;

    let sectionName = host.getAttribute('data-section') || '';
    if (!sectionName){
      const h1 = $('.content h1')?.textContent || '';
      sectionName = h1.replace(/^[^\w]+/,'').trim();
    }
    if (!sectionName){
      const folder = lastSegment(location.pathname.replace(/\/index\.html?$/i,''));
      sectionName = (folder||'').replace(/[-_]+/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
    }

    const TILES = buildMenusArray();
    if (!TILES.length){ console.warn('ui-subnav: DF_MENUS missing'); return; }
    const section = findSectionByNameOrHref(TILES, sectionName);
    if (!section || !Array.isArray(section.children) || !section.children.length){ console.warn('ui-subnav: section not found/no children', sectionName); return; }

    // Hide host until RBAC computed
    host.style.visibility = 'hidden';

    // RBAC load
    let eff = null;
    try{
      const { db, auth } = await waitForFirebase();
      const user = auth.currentUser;
      if (user) {
        const email = (user.email||'').toLowerCase();
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
        let roleId = null, overrides = {};
        try { const uSnap = await getDoc(doc(db,'users', email)); if (uSnap.exists()){ const u = uSnap.data()||{}; roleId = u.roleId || u.role || null; overrides = (u.exceptions && u.exceptions.enabled) ? (u.exceptions.grants||{}) : {}; } } catch(_){}
        let rolePerms = {};
        if (roleId){ try{ const rSnap = await getDoc(doc(db,'roles', String(roleId))); if (rSnap.exists()){ const r = rSnap.data()||{}; rolePerms = (r.permissions && typeof r.permissions==='object') ? r.permissions : {}; } } catch(_){ } }
        const MENUS_MAP = buildMenusMap(); eff = mergePerms(MENUS_MAP, rolePerms, overrides);
      }
    } catch(_){}

    const curFolder = currentFolder();
    const subs = section.children || [];
    const html = subs.map(c=>{
      const subLabel = String(c.label||'').trim();
      if (eff && !canView(eff, String(section.label||'').trim(), subLabel)) return '';
      const href = normalizeHref(String(c.href||'#'), curFolder);
      const ico  = c.iconEmoji ? (esc(c.iconEmoji)+' ') : '';
      return `<a href="${esc(href)}" class="df-tile" data-menu="${esc(section.label||'')}" data-submenu="${esc(subLabel)}">${ico}<span>${esc(subLabel)}</span></a>`;
    }).filter(Boolean).join('');

    host.innerHTML = html || '<div class="muted" style="padding:14px;">No pages in this section for your account.</div>';
    host.style.visibility = '';
  });
})();