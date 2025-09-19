// Renders the Home page tiles from window.DF_MENUS.tiles
(function () {
  function ready(fn){ 
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    const host = document.querySelector('.df-tiles[data-source="global"]');
    if (!host) return;

    const tiles = (window.DF_MENUS && Array.isArray(window.DF_MENUS.tiles))
      ? window.DF_MENUS.tiles
      : [];

    if (!tiles.length) {
      console.warn('ui-nav: DF_MENUS.tiles missing/empty; nothing to render.');
      return;
    }

    host.innerHTML = tiles.map(t => {
      const emoji = t.iconEmoji || '';
      const label = t.label || '';
      const href  = t.href  || '#';
      return `<a href="${href}" class="df-tile">${emoji} <span>${label}</span></a>`;
    }).join('');
  });
})();