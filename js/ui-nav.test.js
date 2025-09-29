// ui-nav.test.js — minimal, no roles, no auth, no fallback
(function () {
  'use strict';

  // --- helpers
  const baseHref = (document.querySelector('base')?.href || '/DowsonFarms/');
  const BASE = (() => {
    try { const u = new URL(baseHref); return u.pathname.endsWith('/') ? u.pathname : (u.pathname + '/'); }
    catch { return '/DowsonFarms/'; }
  })();
  const stripIndex = (p) => String(p || '').replace(/index\.html$/i, '');
  const canon = (p) => {
    const s = stripIndex(p);
    if (!s || s === '/') return '/';
    return s.endsWith('/') ? s.slice(0, -1) : s;
  };
  const abs = (href) => {
    if (!href) return '';
    if (/^https?:/i.test(href) || href.startsWith('/')) return href;
    return BASE + href;
  };

  function el(tag, attrs = {}, html = '') {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) if (v != null) e.setAttribute(k, v);
    if (html) e.innerHTML = html;
    return e;
  }

  function renderTiles(container, items) {
    container.innerHTML = '';
    const styleId = 'df-tiles-style-test';
    if (!document.getElementById(styleId)) {
      const s = document.createElement('style');
      s.id = styleId;
      s.textContent = `
        .df-tiles{display:grid;gap:18px;grid-template-columns:repeat(auto-fit,minmax(220px,1fr))}
        .df-tile{display:flex;flex-direction:column;align-items:center;justify-content:center;background:#fff;
          border:1px solid rgba(0,0,0,.1);border-radius:16px;box-shadow:0 6px 18px rgba(0,0,0,.06);
          text-decoration:none;color:#333;padding:24px 18px;transition:transform .15s}
        .df-tile:hover{transform:translateY(-3px)}
        .df-tile span{margin-top:8px;font-weight:600}
        #uiNavStatus{margin:10px 0;padding:10px;border-radius:8px;background:#e7f7e7;border:1px solid #bfe6bf;color:#114411;font:600 14px/1.3 system-ui,Segoe UI,Roboto,Arial}
      `;
      document.head.appendChild(s);
    }
    const grid = el('div', { class: 'df-tiles' });
    (items || []).forEach(it => {
      const a = el('a', { class: 'df-tile', href: it.href, title: it.label });
      a.innerHTML = `${it.iconEmoji || '•'} <span>${it.label}</span>`;
      grid.appendChild(a);
    });
    container.appendChild(grid);
  }

  function findSectionByHref(allTiles, sectionHref) {
    const want = canon(abs(sectionHref || ''));
    for (const t of allTiles) if (canon(abs(t.href)) === want) return t;
    // fallback: match by prefix of current path
    const path = canon(location.pathname);
    for (const t of allTiles) if (path.startsWith(canon(abs(t.href)))) return t;
    return null;
  }

  function status(msg) {
    let box = document.getElementById('uiNavStatus');
    if (!box) { box = el('div', { id: 'uiNavStatus' }); (document.querySelector('main')||document.body).prepend(box); }
    box.textContent = msg;
  }

  function boot() {
    const MENUS = window.DF_MENUS;
    const sub = document.querySelector('[data-df-subnav]');
    const sec = sub?.getAttribute('data-section') || '';

    if (!MENUS || !Array.isArray(MENUS.tiles)) { status('ui-nav.test.js ran → DF_MENUS NOT LOADED'); return; }

    // Render HOME tiles if present
    document.querySelectorAll('[data-df-tiles]').forEach(c => renderTiles(c, MENUS.tiles));

    // Render SUBNAV tiles for the requested section
    if (sub) {
      const node = findSectionByHref(MENUS.tiles, sec);
      const kids = node?.children || [];
      if (kids.length) {
        renderTiles(sub, kids);
        status(`ui-nav.test.js ran → OK (tiles: ${kids.length})`);
      } else {
        status('ui-nav.test.js ran → Section found but has 0 children (or not found)');
      }
    } else {
      status('ui-nav.test.js ran → No [data-df-subnav] found on page');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
