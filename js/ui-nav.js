// Renders the Home page tiles from window.DF_MENUS.tiles
(function () {
  function ready(fn){
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    const host = document.querySelector('.df-tiles[data-source="global"]');
    if (!host) {
      console.log('[ui-nav] no host .df-tiles[data-source="global"] on this page');
      return;
    }

    const tiles = (window.DF_MENUS && Array.isArray(window.DF_MENUS.tiles))
      ? window.DF_MENUS.tiles
      : [];

    if (!tiles.length) {
      console.error('[ui-nav] DF_MENUS.tiles missing or empty; nothing to render');
      host.innerHTML = '<div class="df-tile"><span>⚠️ Menu not loaded</span></div>';
      return;
    }

    function esc(s){ return String(s||'').replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

    host.innerHTML = tiles.map(t => {
      const emoji = esc(t.iconEmoji || '');
      const label = esc(t.label || '');
      const href  = esc(t.href  || '#');
      return `<a href="${href}" class="df-tile">${emoji} <span>${label}</span></a>`;
    }).join('');

    console.log('[ui-nav] rendered', tiles.length, 'tiles');
  });
})();