// /js/ui-subnav.js  — render section sub-tiles from DF_MENUS with optional RBAC
(function () {
  const $ = s => document.querySelector(s);
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  function esc(s) {
    return String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] || c));
  }
  function ready(fn) {
    (document.readyState !== 'loading') ? fn() : document.addEventListener('DOMContentLoaded', fn);
  }

  async function waitForMenus(maxMs = 6000) {
    const t0 = performance.now();
    while (performance.now() - t0 < maxMs) {
      if (window.DF_MENUS && Array.isArray(window.DF_MENUS.tiles) && window.DF_MENUS.tiles.length) {
        return window.DF_MENUS.tiles;
      }
      await sleep(60);
    }
    throw new Error('DF_MENUS.tiles not available');
  }

  async function waitForFirebase(maxMs = 12000) {
    const t0 = performance.now();
    while (performance.now() - t0 < maxMs) {
      if (window.DF_FB && window.DF_FB.db && window.DF_FB.auth) return window.DF_FB;
      await sleep(60);
    }
    throw new Error('Firebase not ready');
  }

  function lastSegment(path) {
    const trimmed = path.replace(/\/+$/, '');
    const segs = trimmed.split('/');
    return segs[segs.length - 1] || '';
  }
  function currentFolder() {
    const folder = lastSegment(location.pathname.replace(/\/index\.html?$/i, '').replace(/\/+$/, ''));
    return folder || '';
  }
  function normalizeHref(href, curFolder) {
    const h = String(href || '');
    if (!h) return '#';
    if (h.startsWith('#')) return h;
    if (/^[a-z]+:\/\//i.test(h)) return h;
    if (h.startsWith('/')) return h;
    const prefix = curFolder ? (curFolder + '/') : '';
    if (prefix && h.toLowerCase().startsWith(prefix.toLowerCase())) return h.slice(prefix.length);
    return h;
  }

  function buildMenusMap(tiles) {
    const map = {};
    tiles.forEach(t => {
      const top = String(t.label || '').trim();
      if (!top) return;
      map[top] = (Array.isArray(t.children) ? t.children : [])
        .map(c => String(c.label || '').trim())
        .filter(Boolean);
    });
    return map;
  }

  function findSectionByNameOrHref(tiles, nameGuess) {
    const g = (nameGuess || '').toLowerCase();
    for (const t of tiles) {
      const label = (t.label || '').toLowerCase();
      const href = (t.href || '').toLowerCase();
      const labelMatch = label === g;
      const hrefMatch = href.includes(g.replace(/\s+/g, '-'));
      if (labelMatch || hrefMatch) return t;
    }
    return null;
  }

  function mergePerms(menusMap, rolePerms, overrides) {
    const ACTIONS = ['view', 'edit', 'add', 'archive', 'delete'];
    const eff = {};
    Object.keys(menusMap).forEach(menu => {
      eff[menu] = {};
      (menusMap[menu] || []).forEach(sub => {
        const b = (rolePerms?.[menu]?.[sub]) || {};
        const o = (overrides?.[menu]?.[sub]) || {};
        const p = {};
        ACTIONS.forEach(k => p[k] = (k in o) ? !!o[k] : !!b[k]);
        eff[menu][sub] = p;
      });
    });
    return eff;
  }

  function canView(eff, menu, sub) {
    const p = (eff?.[menu]?.[sub]) || {};
    return !!(p.view || p.edit || p.add || p.archive || p.delete);
  }

  ready(async function () {
    const host = document.querySelector('.df-tiles[data-section]');
    if (!host) {
      console.debug('[ui-subnav] No .df-tiles[data-section] on this page.');
      return;
    }

    // figure out section name
    let sectionName = host.getAttribute('data-section') || '';
    if (!sectionName) {
      const h1 = document.querySelector('.content h1')?.textContent || '';
      sectionName = h1.replace(/^[^\w]+/, '').trim();
    }
    if (!sectionName) {
      const folder = lastSegment(location.pathname.replace(/\/index\.html?$/i, ''));
      sectionName = (folder || '').replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }

    // wait for DF_MENUS
    let tiles;
    try {
      tiles = await waitForMenus();
    } catch (e) {
      host.innerHTML = `<div class="card" style="padding:14px;">⚠️ Menus not loaded. Ensure <code>assets/data/menus.js</code> is included before <code>ui-subnav.js</code>.</div>`;
      console.warn('[ui-subnav] DF_MENUS missing:', e?.message || e);
      return;
    }

    const section = findSectionByNameOrHref(tiles, sectionName);
    if (!section || !Array.isArray(section.children) || !section.children.length) {
      host.innerHTML = `<div class="card" style="padding:14px;">No subpages defined for <strong>${esc(sectionName)}</strong>.</div>`;
      console.debug('[ui-subnav] Section not found or no children:', sectionName);
      return;
    }

    // Hide host while we decide (no flash)
    host.style.visibility = 'hidden';

    // RBAC compute (fail-open if anything is off)
    const bypass = !!window.DF_DISABLE_SUBNAV_GUARD;
    let eff = null;
    let effMenuName = String(section.label || '').trim();
    let usedRBAC = false;

    if (!bypass) {
      try {
        const { db, auth } = await waitForFirebase();
        const user = auth.currentUser;

        if (user) {
          const email = (user.email || '').toLowerCase();
          const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');

          let roleId = null, overrides = {};
          try {
            const uSnap = await getDoc(doc(db, 'users', email));
            if (uSnap.exists()) {
              const u = uSnap.data() || {};
              roleId = u.roleId || u.role || null;
              overrides = (u.exceptions && u.exceptions.enabled) ? (u.exceptions.grants || {}) : {};
            }
          } catch (e) {
            console.debug('[ui-subnav] user doc read failed; failing open', e?.message || e);
          }

          let rolePerms = {};
          if (roleId) {
            try {
              const rSnap = await getDoc(doc(db, 'roles', String(roleId)));
              if (rSnap.exists()) {
                const r = rSnap.data() || {};
                rolePerms = (r.permissions && typeof r.permissions === 'object') ? r.permissions : {};
              }
            } catch (e) {
              console.debug('[ui-subnav] role doc read failed; failing open', e?.message || e);
            }
          }

          const MENUS_MAP = buildMenusMap(tiles);
          eff = mergePerms(MENUS_MAP, rolePerms, overrides);
          usedRBAC = true;
          console.debug('[ui-subnav] RBAC effective for section:', effMenuName, eff?.[effMenuName]);
        }
      } catch (e) {
        console.debug('[ui-subnav] RBAC compute skipped (failing open):', e?.message || e);
      }
    } else {
      console.debug('[ui-subnav] RBAC guard bypassed by DF_DISABLE_SUBNAV_GUARD');
    }

    // Render
    const curFolder = currentFolder();
    const subs = section.children || [];
    let kept = 0;

    const html = subs.map(c => {
      const subLabel = String(c.label || '').trim();
      const href = normalizeHref(String(c.href || '#'), curFolder);
      const ico = c.iconEmoji ? (esc(c.iconEmoji) + ' ') : '';

      // If RBAC computed, apply; otherwise fail-open
      const show = eff && usedRBAC ? canView(eff, effMenuName, subLabel) : true;
      if (!show) return '';
      kept++;
      return `<a href="${esc(href)}" class="df-tile" data-menu="${esc(section.label || '')}" data-submenu="${esc(subLabel)}">${ico}<span>${esc(subLabel)}</span></a>`;
    }).filter(Boolean).join('');

    host.innerHTML = html || `<div class="muted" style="padding:14px;">No pages in this section for your account.</div>`;
    host.style.visibility = '';

    console.debug('[ui-subnav] section:', sectionName, 'rendered tiles:', kept, 'usedRBAC:', usedRBAC, 'bypass:', bypass);
  });
})();