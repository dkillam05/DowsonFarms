/* Role-aware Nav renderer (tiles, breadcrumbs, subnav)
   Depends on:
     - assets/data/menus.js  (window.DF_MENUS)
     - js/access.js          (loadAccess -> DF_ACCESS)
*/

(function () {
  'use strict';

  const BASE = (function getBase() {
    const baseEl = document.querySelector('base');
    if (!baseEl || !baseEl.href) return '/DowsonFarms/';
    try { const u = new URL(baseEl.href); return u.pathname.endsWith('/') ? u.pathname : (u.pathname + '/'); }
    catch { return '/DowsonFarms/'; }
  })();

  function norm(href) {
    if (!href) return '';
    if (/^https?:/i.test(href) || href.startsWith('/')) return href;
    return BASE + href;
  }

  function currentPath() { return location.pathname; }

  function el(tag, attrs = {}, html = '') {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null) continue;
      if (k === 'class') e.className = v;
      else if (k.startsWith('data-')) e.setAttribute(k, v);
      else e[k] = v;
    }
    if (html) e.innerHTML = html;
    return e;
  }

  function styleOnce(id, css) {
    if (document.getElementById(id)) return;
    const s = document.createElement('style'); s.id = id; s.textContent = css; document.head.appendChild(s);
  }

  function renderTiles(container, items) {
    container.innerHTML = '';
    styleOnce('df-tiles-style', `
      .df-tiles { display:grid; gap:18px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
      .df-tile { display:flex; flex-direction:column; align-items:center; justify-content:center;
        background:#fff; border:1px solid rgba(0,0,0,.1); border-radius:16px; box-shadow:0 6px 18px rgba(0,0,0,.06);
        text-decoration:none; color:#333; padding:24px 18px; transition:transform .15s; }
      .df-tile:hover { transform: translateY(-3px); }
      .df-tile span { margin-top:8px; font-weight:600; }
    `);
    const grid = el('div', { class: 'df-tiles' });
    items.forEach(it => {
      const a = el('a', { href: it.href, class: 'df-tile', title: it.label });
      a.innerHTML = `${it.iconEmoji || '•'} <span>${it.label}</span>`;
      grid.appendChild(a);
    });
    container.appendChild(grid);
  }

  function renderBreadcrumbs(container, menus, dfAccess) {
    container.innerHTML = '';
    styleOnce('df-bc-style', `
      .df-bc { display:flex; flex-wrap:wrap; align-items:center; gap:6px; font-size:13px; color:#444; }
      .df-bc a { color:#1B5E20; text-decoration:none; font-weight:600; }
      .df-bc .sep { opacity:.5; }
    `);
    const nav = el('div', { class: 'df-bc' });

    // Build a small map for quick lookup by href
    function findNodeByHref(href) {
      const abs = norm(href);
      for (const top of menus.tiles) {
        const topAbs = norm(top.href);
        if (abs === topAbs) return { parent: null, node: top };
        if (Array.isArray(top.children)) {
          for (const child of top.children) {
            const childAbs = norm(child.href);
            if (abs === childAbs) return { parent: top, node: child };
            if (Array.isArray(child.children)) {
              for (const g of child.children) {
                if (abs === norm(g.href)) return { parent: child, grandparent: top, node: g };
              }
            }
          }
        }
      }
      return null;
    }

    function inferNodeFromLocation() {
      const path = currentPath();
      for (const top of menus.tiles) {
        if (norm(top.href) === path) return { parent: null, node: top };
        if (Array.isArray(top.children)) {
          for (const child of top.children) {
            if (norm(child.href) === path) return { parent: top, node: child };
            if (Array.isArray(child.children)) {
              for (const g of child.children) {
                if (norm(g.href) === path) return { parent: child, grandparent: top, node: g };
              }
            }
          }
        }
      }
      for (const top of menus.tiles) {
        if (path.startsWith(norm(top.href).replace(/index\.html$/, ''))) {
          return { parent: null, node: top };
        }
      }
      return null;
    }

    const info = inferNodeFromLocation();
    const items = [{ label: 'Home', href: 'index.html' }];
    if (info?.grandparent && dfAccess.canView(info.grandparent.href))
      items.push({ label: info.grandparent.label, href: info.grandparent.href });
    if (info?.parent && dfAccess.canView(info.parent.href))
      items.push({ label: info.parent.label, href: info.parent.href });
    if (info?.node && dfAccess.canView(info.node.href))
      items.push({ label: info.node.label, href: info.node.href });

    items.forEach((it, i) => {
      if (i) nav.appendChild(el('span', { class: 'sep' }, '›'));
      if (i < items.length - 1) nav.appendChild(el('a', { href: it.href }, it.label));
      else nav.appendChild(el('span', {}, it.label));
    });

    container.appendChild(nav);
  }

  async function boot() {
    const MENUS = window.DF_MENUS || { tiles: [] };
    // wait for role-based access
    const { loadAccess } = await import('./access.js');
    const DF_ACCESS = await loadAccess();

    // HOME tiles: show section if it or any descendant is viewable
    document.querySelectorAll('[data-df-tiles]').forEach(c => {
      const filtered = DF_ACCESS.filterMenusForHome(MENUS.tiles);
      renderTiles(c, filtered);
    });

    // Breadcrumbs (hide crumbs you can't view)
    document.querySelectorAll('[data-df-breadcrumbs]').forEach(c => {
      const filteredForHome = DF_ACCESS.filterMenusForHome(MENUS.tiles);
      renderBreadcrumbs(c, { tiles: filteredForHome }, DF_ACCESS);
    });

    // SUBNAV: only items with view=true (children/grandchildren)
    document.querySelectorAll('[data-df-subnav]').forEach(c => {
      const sectionHref = c.getAttribute('data-section') || '';
      const filteredHome = DF_ACCESS.filterMenusForHome(MENUS.tiles);

      // Find that section in the filtered tree
      function findInFiltered(href) {
        const abs = href ? norm(href) : null;
        for (const top of filteredHome) {
          const topAbs = norm(top.href);
          if (!href || abs === topAbs) return { node: top };
          if (Array.isArray(top.children)) {
            for (const ch of top.children) {
              const chAbs = norm(ch.href);
              if (abs === chAbs) return { node: ch };
            }
          }
        }
        return null;
      }

      const section = sectionHref ? findInFiltered(sectionHref)?.node : null;
      // If no explicit section, infer from URL by picking the top whose path matches
      const fallback = filteredHome.find(t => currentPath().startsWith(norm(t.href).replace(/index\.html$/, '')));
      const node = section || fallback;
      if (!node) { c.innerHTML = ''; return; }

      // Choose children to render (only those viewable survive in filtered tree)
      const children = Array.isArray(node.children) ? node.children : [];
      renderTiles(c, children);
    });
  }

  document.addEventListener('DOMContentLoaded', boot);
})();