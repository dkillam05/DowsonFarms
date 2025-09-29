/* Dowson Farms — Nav helpers that render from window.DF_MENUS
   Usage patterns:
   - <div data-df-tiles></div>                           // renders top-level tiles on Home
   - <nav data-df-breadcrumbs></nav>                     // renders breadcrumbs for current page
   - <div data-df-subnav data-section="equipment/"></div>// renders sub-tiles for a section
   Make sure you include assets/data/menus.js BEFORE this file.
*/

(function () {
  'use strict';

  const BASE = (function getBase() {
    const baseEl = document.querySelector('base');
    if (!baseEl || !baseEl.href) return '/DowsonFarms/';
    try {
      const u = new URL(baseEl.href);
      return u.pathname.endsWith('/') ? u.pathname : (u.pathname + '/');
    } catch {
      return '/DowsonFarms/';
    }
  })();

  const MENUS = window.DF_MENUS && Array.isArray(window.DF_MENUS.tiles) ? window.DF_MENUS : { tiles: [] };

  function norm(href) {
    if (!href) return '';
    // make absolute relative to base for matching
    if (/^https?:/i.test(href) || href.startsWith('/')) return href;
    return BASE + href;
  }

  function currentPath() {
    // current absolute path for matching against hrefs
    return location.pathname;
  }

  function findNodeByHref(href) {
    const abs = norm(href);
    for (const top of MENUS.tiles) {
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
    // Try exact match first
    for (const top of MENUS.tiles) {
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
    // Fallback: startsWith match
    for (const top of MENUS.tiles) {
      if (path.startsWith(norm(top.href).replace(/index\.html$/, ''))) {
        return { parent: null, node: top };
      }
    }
    return null;
  }

  /* ---------- render helpers ---------- */

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

  function renderTiles(container, items) {
    container.innerHTML = '';
    const grid = el('div', { class: 'df-tiles' });
    const style = document.createElement('style');
    style.textContent = `
      .df-tiles { display:grid; gap:18px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
      .df-tile { display:flex; flex-direction:column; align-items:center; justify-content:center;
        background:#fff; border:1px solid rgba(0,0,0,.1); border-radius:16px; box-shadow:0 6px 18px rgba(0,0,0,.06);
        text-decoration:none; color:#333; padding:24px 18px; transition:transform .15s; }
      .df-tile:hover { transform: translateY(-3px); }
      .df-tile span { margin-top:8px; font-weight:600; }
    `;
    document.head.appendChild(style);

    items.forEach(it => {
      const a = el('a', { href: it.href, class: 'df-tile', title: it.label });
      a.innerHTML = `${it.iconEmoji || '•'} <span>${it.label}</span>`;
      grid.appendChild(a);
    });
    container.appendChild(grid);
  }

  function renderBreadcrumbs(container, nodeInfo) {
    container.innerHTML = '';
    const nav = el('div', { class: 'df-bc' });
    const style = document.createElement('style');
    style.textContent = `
      .df-bc { display:flex; flex-wrap:wrap; align-items:center; gap:6px; font-size:13px; color:#444; }
      .df-bc a { color:#1B5E20; text-decoration:none; font-weight:600; }
      .df-bc .sep { opacity:.5; }
    `;
    document.head.appendChild(style);

    const items = [{ label: 'Home', href: 'index.html' }];
    if (nodeInfo?.grandparent) items.push({ label: nodeInfo.grandparent.label, href: nodeInfo.grandparent.href });
    if (nodeInfo?.parent)      items.push({ label: nodeInfo.parent.label,      href: nodeInfo.parent.href });
    if (nodeInfo?.node)        items.push({ label: nodeInfo.node.label,        href: nodeInfo.node.href });

    items.forEach((it, i) => {
      if (i) nav.appendChild(el('span', { class: 'sep' }, '›'));
      if (i < items.length - 1) nav.appendChild(el('a', { href: it.href }, it.label));
      else nav.appendChild(el('span', {}, it.label));
    });

    container.appendChild(nav);
  }

  function renderSubnav(container, sectionHref) {
    // sectionHref can be like "equipment/" or "equipment/index.html"
    let section = sectionHref || '';
    if (!section) {
      const node = inferNodeFromLocation();
      section = node?.parent ? node.parent.href : node?.node?.href || '';
    }
    // find the section node
    const info = findNodeByHref(section) || inferNodeFromLocation();
    const node = info?.node && info?.node.children ? info.node
               : info?.parent && info.parent.children ? info.parent
               : null;
    if (!node || !Array.isArray(node.children)) {
      container.innerHTML = '';
      return;
    }
    renderTiles(container, node.children);
  }

  /* ---------- auto-bind on page ---------- */

  window.DF_NAV = {
    renderTiles,
    renderBreadcrumbs,
    renderSubnav,
    findNodeByHref,
    inferNodeFromLocation
  };

  document.addEventListener('DOMContentLoaded', () => {
    // Top-level tiles on Home
    document.querySelectorAll('[data-df-tiles]').forEach(c => renderTiles(c, MENUS.tiles));

    // Breadcrumbs for current page
    document.querySelectorAll('[data-df-breadcrumbs]').forEach(c => {
      renderBreadcrumbs(c, inferNodeFromLocation());
    });

    // Subnav for a section
    document.querySelectorAll('[data-df-subnav]').forEach(c => {
      const section = c.getAttribute('data-section') || '';
      renderSubnav(c, section);
    });
  });
})();