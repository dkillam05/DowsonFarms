// Render sub-tiles for a section (e.g., Equipment, Reports) from DF_MENUS
(function () {
  function ready(fn){
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  function esc(s){
    const map = {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'};
    return String(s || '').replace(/[&<>"]/g, c => map[c]);
  }

  function lastSegment(path){
    const trimmed = path.replace(/\/+$/,'');
    const segs = trimmed.split('/');
    return segs[segs.length - 1] || '';
  }

  ready(function () {
    const host = document.querySelector('.df-tiles[data-section]');
    if (!host) return;

    // Resolve the section:
    // 1) explicit data-section="Equipment"
    // 2) from <h1> text (strip emoji)
    // 3) from URL folder name (equipment/, reports/, etc.)
    let sectionName = host.getAttribute('data-section') || '';
    if (!sectionName) {
      const h1 = document.querySelector('.content h1')?.textContent || '';
      sectionName = h1.replace(/^[^\w]+/,'').trim(); // remove leading emoji/symbols
    }
    if (!sectionName) {
      // e.g., /equipment/index.html -> "equipment"
      const folder = lastSegment(location.pathname.replace(/\/index\.html?$/i, ''));
      sectionName = (folder || '').replace(/[-_]+/g, ' ').replace(/\b\w/g, c=>c.toUpperCase());
    }

    const MENUS = (window.DF_MENUS && Array.isArray(window.DF_MENUS.tiles)) ? window.DF_MENUS.tiles : [];
    if (!MENUS.length) {
      console.warn('ui-subnav: DF_MENUS missing.');
      return;
    }

    function findSectionByNameOrHref(tiles, nameGuess){
      const guessLower = (nameGuess || '').toLowerCase();
      for (const t of tiles) {
        const labelMatch = (t.label || '').toLowerCase() === guessLower;
        const hrefMatch  = (t.href || '').toLowerCase().includes(guessLower.replace(/\s+/g,'-'));
        if (labelMatch || hrefMatch) return t;
      }
      return null;
    }

    const section = findSectionByNameOrHref(MENUS, sectionName);
    if (!section || !Array.isArray(section.children) || !section.children.length) {
      console.warn('ui-subnav: section not found or no children for', sectionName);
      return;
    }

    host.innerHTML = section.children.map(c => {
      const ico = c.iconEmoji ? (esc(c.iconEmoji) + ' ') : '';
      return `<a href="${esc(c.href)}" class="df-tile">${ico}<span>${esc(c.label)}</span></a>`;
    }).join('');
  });
})();