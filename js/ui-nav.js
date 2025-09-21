<!-- FILE: js/ui-nav.js -->
// Renders the Home page tiles from window.DF_MENUS.tiles
(function () {
  const TIMEOUT_MS = 3000;   // how long to wait for menus before fallback
  const HOST_SEL   = '.df-tiles[data-source="global"]';

  function ready(fn){
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  function esc(s){ return String(s||'').replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

  function showError(host, msg){
    if (!host) return;
    host.innerHTML = `
      <div class="card" style="min-height:140px;display:flex;align-items:center;justify-content:center;border:2px solid #2e7d32;border-radius:16px">
        <div style="color:#eee;opacity:.9;font-size:1.05rem">
          <span style="margin-right:.5rem">⚠️</span>${esc(msg)}
        </div>
      </div>`;
  }

  // Try to get DF_MENUS from window or DF.ready registry
  async function getMenus() {
    if (window.DF_MENUS && window.DF_MENUS.tiles) return window.DF_MENUS;

    // try registry if available
    try {
      if (window.DF?.ready?.then) {
        const reg = await window.DF.ready;
        const maybe = reg.get?.('menus');
        if (maybe?.tiles) return maybe;
      }
    } catch {}

    return null;
  }

  // One-shot cache-busted reload of menus.js (in case SW cached an old copy)
  function reloadMenusScriptOnce(){
    if (window.__menusReloaded) return Promise.resolve(false);
    window.__menusReloaded = true;

    return new Promise(resolve=>{
      const s = document.createElement('script');
      // path is ROOT → assets/data/menus.js
      s.src = `assets/data/menus.js?v=${Date.now()}`;
      s.onload = ()=> resolve(true);
      s.onerror = ()=> resolve(false);
      document.head.appendChild(s);
    });
  }

  function renderTiles(host, tiles){
    host.innerHTML = tiles.map(t => {
      const emoji = esc(t.iconEmoji || '');
      const label = esc(t.label || '');
      const href  = esc(t.href  || '#');
      return `<a href="${href}" class="df-tile">${emoji} <span>${label}</span></a>`;
    }).join('');
  }

  ready(async function () {
    const host = document.querySelector(HOST_SEL);
    if (!host) return;

    // Wait a bit for menus to appear (menus.js loads with defer)
    let menus = await Promise.race([
      (async ()=>{ for(let i=0;i<30;i++){ const m = await getMenus(); if (m) return m; await new Promise(r=>setTimeout(r,50)); } return null; })(),
      new Promise(r=>setTimeout(()=>r(null), TIMEOUT_MS))
    ]);

    // If missing, try cache-busted reload once
    if (!menus) {
      const reloaded = await reloadMenusScriptOnce();
      if (reloaded) menus = await getMenus();
    }

    if (!menus || !Array.isArray(menus.tiles) || menus.tiles.length===0) {
      // Diagnose common causes for you in the UI
      const pathHint = 'Expected at: assets/data/menus.js';
      const why = (!menus) ? `Menu not loaded. ${pathHint}` :
                  (!menus.tiles) ? 'DF_MENUS.tiles missing.' :
                  'DF_MENUS.tiles is empty.';
      showError(host, why);
      console.warn('ui-nav: DF_MENUS not available.', {menus});
      return;
    }

    renderTiles(host, menus.tiles);
  });
})();