// Render Home tiles from window.DF_MENUS.tiles
(function () {
  function onReady(fn){
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  function esc(s){ return String(s||'').replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

  onReady(function () {
    const host = document.querySelector('.df-tiles[data-source="global"]');
    if (!host) return;

    const menus = (typeof window.DF_MENUS === 'object') ? window.DF_MENUS : null;
    const tiles = menus && Array.isArray(menus.tiles) ? menus.tiles : [];

    if (!tiles.length) {
      // visible error so we can spot path/global problems
      host.innerHTML = `
        <div class="card" style="min-height:160px;display:flex;align-items:center;justify-content:center;border:2px solid #2e7d32;border-radius:14px">
          <div style="opacity:.9"><span style="margin-right:.4em">⚠️</span> Menu not loaded</div>
        </div>`;
      console.warn('ui-nav: DF_MENUS.tiles missing/empty; check assets/data/menus.js and that it sets window.DF_MENUS');
      return;
    }

    host.innerHTML = tiles.map(t => {
      const emoji = t.iconEmoji ? esc(t.iconEmoji) + ' ' : '';
      const label = esc(t.label);
      const href  = esc(t.href || '#');
      return `<a href="${href}" class="df-tile">${emoji}<span>${label}</span></a>`;
    }).join('');
  });
})();