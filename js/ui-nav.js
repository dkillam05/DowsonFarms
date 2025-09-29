/* Role-aware navigation renderer
   Inputs:
     - window.DF_MENUS (from assets/data/menus.js)
     - loadAccess() from ./access.js  (provides canView + filtered menus)
*/
(function () {
  'use strict';

  // --- URL helpers (base-aware, canonical) -----------------------------------
  const BASE = (() => {
    const baseEl = document.querySelector('base');
    if (!baseEl || !baseEl.href) return '/DowsonFarms/';
    try { const u = new URL(baseEl.href); return u.pathname.endsWith('/') ? u.pathname : (u.pathname + '/'); }
    catch { return '/DowsonFarms/'; }
  })();

  const stripIndex = (p) => String(p || '').replace(/index\.html$/i, '');
  const abs = (href) => {
    if (!href) return '';
    if (/^https?:/i.test(href) || href.startsWith('/')) return href;
    // resolve relative to <base>
    return BASE + href;
  };
  const canonicalPath = () => stripIndex(location.pathname);

  // --- tiny DOM helpers ------------------------------------------------------
  const el = (tag, attrs = {}, html = '') => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null) continue;
      if (k === 'class') e.className = v;
      else if (k.startsWith('data-')) e.setAttribute(k, v);
      else e[k] = v;
    }
    if (html) e.innerHTML = html;
    return e;
  };

  const styleOnce = (id, css) => {
    if (document.getElementById(id)) return;
    const s = document.createElement('style'); s.id = id; s.textContent = css; document.head.appendChild(s);
  };

  // --- UI pieces -------------------------------------------------------------
  function renderTiles(container, items) {
    container.innerHTML = '';
    styleOnce('df-tiles-style', `
      .df-tiles { display:grid; gap:18px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
      .df-tile  { display:flex; flex-direction:column; align-items:center; justify-content:center;
                  background:#fff; border:1px solid rgba(0,0,0,.1); border-radius:16px;
                  box-shadow:0 6px 18px rgba(0,0,0,.06); text-decoration:none; color:#333;
                  padding:24px 18px; transition:transform .15s; }
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

  function renderBreadcrumbs(container, tiles, canView) {
    container.innerHTML = '';
    styleOnce('df-bc-style', `
      .df-bc { display:flex; flex-wrap:wrap; align-items:center; gap:6px; font-size:13px; color:#444; }
      .df-bc a { color:#1B5E20; text-decoration:none; font-weight:600; }
      .df-bc .sep { opacity:.5; }
    `);
    const nav = el('div', { class: 'df-bc' });

    const path = canonicalPath();
    const items = [{ label: 'Home', href: 'index.html' }];

    // find exact chain for breadcrumbs
    const matchAbs = (href) => stripIndex(abs(href)) === path;
    let gp, p, n;
    const tilesAbs = tiles.map(t => ({ ...t, _abs: stripIndex(abs(t.href)) }));
    for (const T of tilesAbs) {
      if (matchAbs(T.href)) { n = T; break; }
      if (Array.isArray(T.children)) {
        for (const C of T.children) {
          const Ca = stripIndex(abs(C.href));
          if (Ca === path) { gp = T; n = C; break; }
          if (Array.isArray(C.children)) {
            for (const G of C.children) {
              const Ga = stripIndex(abs(G.href));
              if (Ga === path) { gp = T; p = C; n = G; break; }
            }
          }
        }
      }
      if (n) break;
    }
    const pushIf = (node) => { if (node && (!canView || canView(node.href))) items.push({ label: node.label, href: node.href }); };
    pushIf(gp); pushIf(p); pushIf(n);

    items.forEach((it, i) => {
      if (i) nav.appendChild(el('span', { class: 'sep' }, '›'));
      if (i < items.length - 1) nav.appendChild(el('a', { href: it.href }, it.label));
      else nav.appendChild(el('span', {}, it.label));
    });

    container.appendChild(nav);
  }

  // --- section matching (deterministic) -------------------------------------
  function findSectionNode(tiles, sectionHref) {
    const want = stripIndex(abs(sectionHref || ''));
    // 1) exact absolute match (canonical)
    for (const t of tiles) if (stripIndex(abs(t.href)) === want) return t;
    // 2) fallback for trailing-slash/base quirks: endsWith
    for (const t of tiles) if (want && stripIndex(abs(t.href)).endsWith(want)) return t;
    // 3) last resort: current location’s parent (supports deep pages)
    const path = canonicalPath();
    for (const t of tiles) if (path.startsWith(stripIndex(abs(t.href)))) return t;
    return null;
  }

  // --- boot ------------------------------------------------------------------
  async function boot() {
    const MENUS = window.DF_MENUS || { tiles: [] };
    if (!MENUS.tiles || !MENUS.tiles.length) return;

    // Role access (cache-busted import prevents stale module errors)
    const { loadAccess } = await import(`./access.js?v=${Date.now()}`);
    const ACC = await loadAccess();

    // HOME tiles (role-filtered)
    document.querySelectorAll('[data-df-tiles]').forEach(c => {
      renderTiles(c, ACC.filterMenusForHome(MENUS.tiles));
    });

    // Breadcrumbs
    document.querySelectorAll('[data-df-breadcrumbs]').forEach(c => {
      renderBreadcrumbs(c, ACC.filterMenusForHome(MENUS.tiles), ACC.canView);
    });

    // Section subnav (e.g., Settings)
    document.querySelectorAll('[data-df-subnav]').forEach(c => {
      const sectionHref = c.getAttribute('data-section') || '';
      const topFiltered = ACC.filterMenusForHome(MENUS.tiles);
      const sectionNode = findSectionNode(topFiltered, sectionHref);
      const children = Array.isArray(sectionNode?.children) ? sectionNode.children : [];
      renderTiles(c, children);
    });
  }

  document.addEventListener('DOMContentLoaded', boot);
})();