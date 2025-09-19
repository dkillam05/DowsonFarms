// reads MENUS from assets/data/menus.js and renders tiles / subnav if targets exist
(function () {
  const MENUS = (window.DF?.registry?.get?.("menus")) || window.DF_MENUS;
  if (!MENUS || !MENUS.tiles) return; // nothing to do

  function htmlesc(s){ return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

  // 1) Home page tiles (if there is .df-tiles[data-source="global"])
  const homeTiles = document.querySelector('.df-tiles[data-source="global"]');
  if (homeTiles) {
    homeTiles.innerHTML = MENUS.tiles.map(t => {
      const ico = t.iconEmoji ? (htmlesc(t.iconEmoji) + ' ') : '';
      return `<a href="${htmlesc(t.href)}" class="df-tile">${ico}<span>${htmlesc(t.label)}</span></a>`;
    }).join('');
  }

  // 2) Section page tiles (if there is .df-tiles[data-section])
  const sectionTiles = document.querySelector('.df-tiles[data-section]');
  if (sectionTiles) {
    const href = (document.querySelector('nav.breadcrumbs a:last-of-type + .sep') ? '' : '') || '';
    // pick the section based on current page link in MENUS
    const here = location.pathname.split('/').pop();
    const section =
      MENUS.tiles.find(t => t.href === here) ||
      MENUS.tiles.find(t => here && t.href.endsWith(here));
    if (section && Array.isArray(section.children)) {
      sectionTiles.innerHTML = section.children.map(c => {
        const ico = c.iconEmoji ? (htmlesc(c.iconEmoji) + ' ') : '';
        return `<a href="${htmlesc(c.href)}" class="df-tile">${ico}<span>${htmlesc(c.label)}</span></a>`;
      }).join('');
    }
  }

  // 3) Optional inline subnav (if <ul data-menu="children"> exists)
  const subnav = document.querySelector('ul[data-menu="children"]');
  if (subnav) {
    const here = location.pathname.split('/').pop();
    const section =
      MENUS.tiles.find(t => t.href === here) ||
      MENUS.tiles.find(t => here && t.href.endsWith(here));
    const children = section?.children || [];
    subnav.innerHTML = children.map(c => {
      const isHere = c.href.endsWith(here);
      const ico = c.iconEmoji ? (htmlesc(c.iconEmoji) + ' ') : '';
      return `<li><a href="${htmlesc(c.href)}" ${isHere?'aria-current="page"':''}>${ico}${htmlesc(c.label)}</a></li>`;
    }).join('');
  }
})();
