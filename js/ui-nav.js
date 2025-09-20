/* Dowson Farms — ui-nav.js
   - Renders .df-tiles[data-source="global"] on Home
   - Renders .df-tiles[data-section] on hub pages
   - Auto-corrects hrefs so links work from any folder depth
*/

(function () {
  function ready(fn){ 
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  function getMenus(){
    const M = window.DF_MENUS && Array.isArray(window.DF_MENUS.tiles) ? window.DF_MENUS : { tiles: [] };
    return M;
  }

  // Compute how many "../" we need to reach repo root, then prepend to a root-relative href like "equipment/index.html"
  function prefixToRoot(href){
    // ignore external/absolute/relative-with-../ already
    if (/^(https?:)?\/\//i.test(href) || href.startsWith('./') || href.startsWith('../')) return href;

    // depth = number of path segments after repo root; robust for GitHub Pages or plain hosting
    const path = location.pathname.replace(/\/+$/, ''); // no trailing slash
    const segs = path.split('/').filter(Boolean);       // e.g. ["repo","equipment","index.html"]
    // heuristic: last seg is a file (contains ".") — current dir depth = segs.length - 1
    const depth = Math.max(0, segs.length - 1);
    const up = depth > 0 ? '../'.repeat(depth) : '';
    return up + href;
  }

  function esc(s){ return String(s||'').replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]); }

  function renderHome(){
    const host = document.querySelector('.df-tiles[data-source="global"]');
    if (!host) return;
    const { tiles } = getMenus();
    if (!tiles.length) return;

    host.innerHTML = tiles.map(t => {
      const emoji = t.iconEmoji || '';
      const label = t.label || '';
      const href  = prefixToRoot(t.href || '#');
      return `<a href="${href}" class="df-tile">${esc(emoji)} <span>${esc(label)}</span></a>`;
    }).join('');
  }

  function findSection(tiles, name){
    return tiles.find(t => (t.label||'').toLowerCase() === (name||'').toLowerCase()) || null;
  }

  function renderSection(){
    const host = document.querySelector('.df-tiles[data-section]');
    if (!host) return;

    const { tiles } = getMenus();
    const explicit = host.getAttribute('data-section');

    let section = null;
    if (explicit && explicit.trim()) {
      section = findSection(tiles, explicit.trim());
    } else {
      // infer from <title> (strip the "— Dowson Farms" tail)
      const name = (document.title || '').replace(/\s*—.*$/,'').trim();
      section = findSection(tiles, name);
    }

    if (!section || !Array.isArray(section.children)) return;

    host.innerHTML = section.children.map(c => {
      const ico = c.iconEmoji ? (esc(c.iconEmoji) + ' ') : '';
      const href = prefixToRoot(c.href || '#');
      return `<a href="${href}" class="df-tile">${ico}<span>${esc(c.label || '')}</span></a>`;
    }).join('');
  }

  ready(function () {
    renderHome();
    renderSection();
  });
})();