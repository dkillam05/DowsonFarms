// Renders the Home page tiles from window.DF_MENUS.tiles
(function () {
  function ready(fn){
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    const host = document.querySelector('.df-tiles[data-source="global"]');
    if (!host) return;

    // Expect DF_MENUS set by assets/data/menus.js
    const MENUS = (typeof window !== 'undefined') ? window.DF_MENUS : null;
    const tiles = MENUS && Array.isArray(MENUS.tiles) ? MENUS.tiles : [];

    if (!tiles.length) {
      host.innerHTML = `
        <div class="card" style="border:2px solid #2e7d32;border-radius:14px;padding:24px;display:flex;align-items:center;justify-content:center;min-height:160px;">
          <div style="color:#ddd;font-size:1.1rem;">
            ⚠️ Menu not loaded. Expected at:<br><code>assets/data/menus.js</code>
          </div>
        </div>`;
      console.warn('ui-nav: DF_MENUS.tiles missing/empty; nothing to render.');
      return;
    }

    function esc(s){ return String(s||'').replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

    host.innerHTML = tiles.map(t => {
      const emoji = t.iconEmoji ? esc(t.iconEmoji) + ' ' : '';
      const label = esc(t.label || '');
      const href  = esc(t.href || '#');
      return `<a href="${href}" class="df-tile">${emoji}<span>${label}</span></a>`;
    }).join('');
  });
})();