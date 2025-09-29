/* Role-aware Nav renderer (tiles, breadcrumbs, subnav)
   Depends on:
     - assets/data/menus.js  (window.DF_MENUS)
     - js/access.js          (loadAccess -> DF_ACCESS)
*/

(function () {
  'use strict';

  const BASE = (() => {
    const baseEl = document.querySelector('base');
    if (!baseEl || !baseEl.href) return '/DowsonFarms/';
    try { const u = new URL(baseEl.href); return u.pathname.endsWith('/') ? u.pathname : (u.pathname + '/'); }
    catch { return '/DowsonFarms/'; }
  })();

  const stripIndex = (p) => p.replace(/index\.html$/i, '');
  const abs = (href) => {
    if (!href) return '';
    if (/^https?:/i.test(href) || href.startsWith('/')) return href;
    return BASE + href;
  };
  const here = () => location.pathname;

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

  function matchSection(menus, sectionHref) {
    const want = stripIndex(abs(sectionHref || ''));
    const path = stripIndex(here());

    // exact first
    for (const top of menus.tiles) {
      const h = stripIndex(abs(top.href));
      if (want ? h === want : path.startsWith(h)) return top;
    }
    // endsWith as last resort (supports trailing slashes quirks)
    for (const top of menus.tiles) {
      const h = stripIndex(abs(top.href));
      if (path.endsWith(h)) return top;
    }
    return null;
  }

  function findNodeByPath(menus) {
    const path = stripIndex(here());
    for (const top of menus.tiles) {
      const t = stripIndex(abs(top.href));
      if (path === t) return { node: top };
      if (Array.isArray(top.children)) {
        for (const ch of top.children) {
          const c = stripIndex(abs(ch.href));
          if (path === c) return { parent: top, node: ch };
          if (Array.isArray(ch.children)) {
            for (const g of ch.children) {
              const gg = stripIndex(abs(g.href));
              if (path === gg) return { grandparent: top, parent: ch, node: g };
            }
          }
        }
      }
    }
    // fallback: nearest parent by startsWith
    for (const top of menus.tiles) {
      const t = stripIndex(abs(top.href));
      if (path.startsWith(t)) return { node: top };
    }
    return null;
  }

  function renderBreadcrumbs(container, menus, canView) {
    container.innerHTML = '';
    styleOnce('df-bc-style', `
      .df-bc { display:flex; flex-wrap:wrap; align-items:center; gap:6px; font-size:13px; color:#444; }
      .df-bc a { color:#1B5E20; text-decoration:none; font-weight:600; }
      .df-bc .sep { opacity:.5; }
    `);
    const nav = el('div', { class: 'df-bc' });

    const info = findNodeByPath(menus);
    const items = [{ label: 'Home', href: 'index.html' }];
    if (info?.grandparent && canView(info.grandparent.href)) items.push({ label: info.grandparent.label, href: info.grandparent.href });
    if (info?.parent && canView(info.parent.href)) items.push({ label: info.parent.label, href: info.parent.href });
    if (info?.node && canView(info.node.href)) items.push({ label: info.node.label, href: info.node.href });

    items.forEach((it, i) => {
      if (i) nav.appendChild(el('span', { class: 'sep' }, '›'));
      if (i < items.length - 1) nav.appendChild(el('a', { href: it.href }, it.label));
      else nav.appendChild(el('span', {}, it.label));
    });

    container.appendChild(nav);
  }

  async function boot() {
    const MENUS = window.DF_MENUS || { tiles: [] };
    if (!MENUS.tiles || !MENUS.tiles.length) return; // nothing to render

    // role-based access
    const { loadAccess } = await import('./access.js');
    const ACC = await loadAccess();

    // HOME tiles
    document.querySelectorAll('[data-df-tiles]').forEach(c => {
      const filtered = ACC.filterMenusForHome(MENUS.tiles);
      renderTiles(c, filtered);
    });

    // Breadcrumbs
    document.querySelectorAll('[data-df-breadcrumbs]').forEach(c => {
      const filtered = { tiles: ACC.filterMenusForHome(MENUS.tiles) };
      renderBreadcrumbs(c, filtered, ACC.canView);
    });

    // Subnav (section page)
    document.querySelectorAll('[data-df-subnav]').forEach(c => {
      const sectionAttr = c.getAttribute('data-section') || '';
      const filteredHome = ACC.filterMenusForHome(MENUS.tiles);
      const sectionNode = sectionAttr
        ? matchSection({ tiles: filteredHome }, sectionAttr)
        : matchSection({ tiles: filteredHome }, '');

      const list = Array.isArray(sectionNode?.children) ? sectionNode.children : [];
      renderTiles(c, list);
    });
  }

  document.addEventListener('DOMContentLoaded', boot);
})();