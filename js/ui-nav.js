// Renders the Home page tiles from window.DF_MENUS.tiles
(function () {
  function ready(fn){
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  function haveMenus(){
    return (window.DF_MENUS && Array.isArray(window.DF_MENUS.tiles));
  }

  // Small retry loop to avoid race if menus.js loads slowly
  function waitForMenus(max = 20){
    return new Promise(resolve=>{
      let tries = 0;
      (function tick(){
        if (haveMenus()) return resolve(true);
        if (tries++ >= max) return resolve(false);
        setTimeout(tick, 75);
      })();
    });
  }

  ready(async function () {
    const host = document.querySelector('.df-tiles[data-source="global"]');
    if (!host) return;

    const ok = await waitForMenus();
    if (!ok) {
      console.warn('ui-nav: DF_MENUS not available; nothing to render.');
      return;
    }

    const tiles = window.DF_MENUS.tiles || [];
    if (!tiles.length) {
      console.warn('ui-nav: DF_MENUS.tiles empty.');
      return;
    }

    function esc(s){ return String(s||'').replace(/[&<>"]/g, c=>({'&':'&','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

    host.innerHTML = tiles.map(t => {
      const emoji = t.iconEmoji ? esc(t.iconEmoji) + ' ' : '';
      const label = esc(t.label || '');
      const href  = esc(t.href  || '#');
      return `<a href="${href}" class="df-tile">${emoji}<span>${label}</span></a>`;
    }).join('');
  });
})();