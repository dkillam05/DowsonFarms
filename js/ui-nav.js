// js/ui-nav.js
(function () {
  function ready(fn){ if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
  ready(function () {
    const host = document.querySelector('.df-tiles[data-source="global"]');
    if (!host) return;
    const MENUS = window.DF_MENUS, tiles = MENUS && Array.isArray(MENUS.tiles) ? MENUS.tiles : [];
    if (!tiles.length) {
      host.innerHTML = `<div class="card" style="border:2px solid #2e7d32;border-radius:14px;padding:24px;display:flex;align-items:center;justify-content:center;min-height:160px;"><div style="color:#ddd;font-size:1.1rem;">⚠️ Menu not loaded (<code>assets/data/menus.js</code>)</div></div>`;
      return;
    }
    const esc = s=>String(s||'').replace(/[&<>"]/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
    host.innerHTML = tiles.map(t => {
      const emoji = t.iconEmoji ? esc(t.iconEmoji)+' ' : '';
      const label = esc(t.label || '');
      const href  = esc(t.href || '#');
      return `<section class="card" style="margin:12px 0;"><h2 style="margin:0 0 8px;">${emoji}${label}</h2><div class="df-tiles" data-section="${label}"></div></section>`;
    }).join('');
  });
})();