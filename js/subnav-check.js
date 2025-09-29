// /js/diag-subnav-check.js
(function () {
  'use strict';

  // --- helpers --------------------------------------------------------------
  const baseEl = document.querySelector('base');
  const BASE = (() => {
    if (!baseEl || !baseEl.href) return '/DowsonFarms/';
    try { const u = new URL(baseEl.href); return u.pathname.endsWith('/') ? u.pathname : (u.pathname + '/'); }
    catch { return '/DowsonFarms/'; }
  })();

  const stripIndex = (p) => String(p || '').replace(/index\.html$/i, '');
  const canon = (p) => {
    const s = stripIndex(p);
    if (s === '/' || s === '') return '/';
    return s.endsWith('/') ? s.slice(0, -1) : s;
  };
  const abs = (href) => {
    if (!href) return '';
    if (/^https?:/i.test(href) || href.startsWith('/')) return href;
    return BASE + href; // resolve relative to <base>
  };
  const pagePath = canon(location.pathname);

  const el = (t, a = {}, html = '') => {
    const e = document.createElement(t);
    Object.entries(a).forEach(([k, v]) => { if (v != null) e.setAttribute(k, v); });
    if (html) e.innerHTML = html;
    return e;
  };

  function renderTiles(container, items) {
    if (!items || !items.length) {
      container.innerHTML = `<div style="color:#a00">No items to render.</div>`;
      return;
    }
    const styleId = 'df-tiles-style-diag';
    if (!document.getElementById(styleId)) {
      const s = document.createElement('style');
      s.id = styleId;
      s.textContent = `
        .df-tiles{display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(200px,1fr))}
        .df-tile{display:flex;flex-direction:column;align-items:center;justify-content:center;background:#fff;
          border:1px solid rgba(0,0,0,.12);border-radius:12px;box-shadow:0 6px 18px rgba(0,0,0,.06);
          text-decoration:none;color:#333;padding:18px 14px}
        .df-tile:hover{transform:translateY(-2px)}
        .df-tile span{margin-top:6px;font-weight:600}
      `;
      document.head.appendChild(s);
    }
    const grid = el('div', { class: 'df-tiles' });
    items.forEach(it => {
      const a = el('a', { class: 'df-tile', href: it.href, title: it.label });
      a.innerHTML = `${it.iconEmoji || '•'} <span>${it.label}</span>`;
      grid.appendChild(a);
    });
    container.innerHTML = '';
    container.appendChild(grid);
  }

  function findSectionByHref(allTiles, sectionHref) {
    const want = canon(abs(sectionHref || ''));
    // 1) exact canonical match
    for (const t of allTiles) if (canon(abs(t.href)) === want) return t;
    // 2) current location parent fallback
    for (const t of allTiles) if (pagePath.startsWith(canon(abs(t.href)))) return t;
    return null;
  }

  function run() {
    // Create diagnostics panel
    const host = document.querySelector('main') || document.body;
    const panel = el('section', { id: 'df-diag', style: `
      border:1px solid rgba(0,0,0,.15);border-radius:12px;background:#fff;
      padding:12px;margin:12px 0;box-shadow:0 6px 18px rgba(0,0,0,.06)` 
    });
    const title = `<div style="font-weight:700;color:#1B5E20;margin-bottom:8px">Settings SubNav Diagnostics</div>`;
    const info  = el('div', { id: 'df-diag-info', style:'font-size:13px;line-height:1.4;color:#333' });
    const btns  = el('div', { style:'margin-top:8px;display:flex;gap:8px;flex-wrap:wrap' });
    const out1  = el('div', { id: 'df-diag-out1', style:'margin-top:10px' });
    const out2  = el('div', { id: 'df-diag-out2', style:'margin-top:10px' });
    panel.innerHTML = title;
    panel.appendChild(info);
    panel.appendChild(btns);
    panel.appendChild(out1);
    panel.appendChild(out2);
    host.prepend(panel);

    // Gather facts
    const subnavEl = document.querySelector('[data-df-subnav]');
    const sectionAttr = subnavEl?.getAttribute('data-section') || '(none)';
    const menusLoaded = !!(window.DF_MENUS && Array.isArray(window.DF_MENUS.tiles));
    const tilesCount  = menusLoaded ? window.DF_MENUS.tiles.length : 0;
    const settingsNode = menusLoaded ? findSectionByHref(window.DF_MENUS.tiles, sectionAttr) : null;
    const children = settingsNode?.children || [];

    // Show facts
    info.innerHTML = `
      <div><b>Base</b>: ${BASE}</div>
      <div><b>Page path</b>: ${pagePath}</div>
      <div><b>data-section</b>: ${sectionAttr}</div>
      <div><b>menus.js loaded</b>: ${menusLoaded} (tiles: ${tilesCount})</div>
      <div><b>Settings node found</b>: ${!!settingsNode}</div>
      <div><b>Children count</b>: ${children.length}</div>
      <div><b>Subnav container has content</b>: ${!!subnavEl && subnavEl.children.length > 0}</div>
    `;

    // Buttons
    const btn1 = el('button', { type:'button', style:'padding:6px 10px;border-radius:8px;border:1px solid rgba(0,0,0,.2);background:#fff;cursor:pointer' }, 'Render RAW children (no roles)');
    const btn2 = el('button', { type:'button', style:'padding:6px 10px;border-radius:8px;border:1px solid rgba(0,0,0,.2);background:#fff;cursor:pointer' }, 'Render ROLE-FILTERED children');
    const btn3 = el('button', { type:'button', style:'padding:6px 10px;border-radius:8px;border:1px solid rgba(0,0,0,.2);background:#fff;cursor:pointer' }, 'List children hrefs');

    btns.appendChild(btn1);
    btns.appendChild(btn2);
    btns.appendChild(btn3);

    // Actions
    btn1.onclick = () => {
      if (!children.length) { out1.innerHTML = `<div style="color:#a00">No children in DF_MENUS for this section.</div>`; return; }
      renderTiles(out1, children);
    };

    btn2.onclick = async () => {
      try {
        const { loadAccess } = await import(`./access.js?v=${Date.now()}`);
        const acc = await loadAccess();
        const filtered = typeof acc.filterChildren === 'function' ? acc.filterChildren(children) : children;
        if (!filtered.length) {
          out2.innerHTML = `<div style="color:#a00">Role filtering removed all children (or no permission to view).</div>`;
        } else {
          renderTiles(out2, filtered);
        }
      } catch (e) {
        out2.innerHTML = `<div style="color:#a00">Could not load access.js: ${e?.message || e}</div>`;
      }
    };

    btn3.onclick = () => {
      if (!children.length) { out2.innerHTML = `<div style="color:#a00">No children to list.</div>`; return; }
      const ul = el('ul', { style:'margin:6px 0 0 16px' });
      children.forEach(c => ul.appendChild(el('li', {}, `${c.label} — ${c.href}`)));
      out2.innerHTML = '';
      out2.appendChild(ul);
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
