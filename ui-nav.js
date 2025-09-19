/* ui-nav.js — renders Home tiles from centralized menu data */

(function () {
  function onReady(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  onReady(function () {
    const host = document.querySelector('.df-tiles[data-source="global"]');
    if (!host) return;

    // Expecting assets/data/menus.js to define:
    //   window.NAV_MENUS: { [key]: { id, label, emoji, href } }
    //   window.NAV_HOME:  string[] of keys in display order
    const MENUS = (window.NAV_MENUS && typeof window.NAV_MENUS === 'object') ? window.NAV_MENUS : null;
    const ORDER = Array.isArray(window.NAV_HOME) ? window.NAV_HOME : null;

    if (!MENUS || !ORDER || !ORDER.length) {
      console.warn('ui-nav: NAV_MENUS or NAV_HOME missing/empty; nothing to render.');
      return;
    }

    // Build the tiles in the specified order
    const tilesHtml = ORDER
      .map(key => MENUS[key])
      .filter(Boolean)
      .map(item => {
        const emoji = item.emoji || '';
        const label = item.label || '';
        const href  = item.href  || '#';
        return `<a href="${href}" class="df-tile">${emoji} <span>${label}</span></a>`;
      })
      .join('');

    host.innerHTML = tilesHtml;
  });
})();