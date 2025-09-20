// Render the Home page tiles from window.DF_MENUS.tiles
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

    function esc(s){
      const map = {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'};
      return String(s || '').replace(/[&<>"]/g, c => map[c]);
    }

    host.innerHTML = tiles.map(t => {
      const emoji = t.iconEmoji ? esc(t.iconEmoji) + ' ' : '';
      const label = esc(t.label || '');
      const href  = esc(t.href  || '#');
      return `<a href="${href}" class="df-tile">${emoji}<span>${label}</span></a>`;
    }).join('');
  });
})();