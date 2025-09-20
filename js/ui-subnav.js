// /js/ui-subnav.js
// Renders submenu tiles for a section hub (like crop/index.html).
// Looks for <div class="df-tiles" data-section="Crop Production"></div>
// If data-section is omitted, will try to infer from <h1> text.

(function () {
  function ready(fn){
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    const host = document.querySelector('.df-tiles[data-section]');
    if (!host) return;

    // Which section?
    let sectionName = host.getAttribute('data-section');
    if (!sectionName) {
      const h1 = document.querySelector('main h1');
      sectionName = h1 ? h1.textContent.replace(/^.*?(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)\s*/u, '').trim() : '';
    }
    if (!sectionName) {
      console.warn("ui-subnav: no section name found.");
      return;
    }

    const menus = (window.DF_MENUS && Array.isArray(window.DF_MENUS.tiles))
      ? window.DF_MENUS.tiles
      : [];

    const parent = menus.find(m => m.label === sectionName);
    if (!parent || !Array.isArray(parent.children)) {
      console.warn("ui-subnav: section not found in DF_MENUS:", sectionName);
      return;
    }

    host.innerHTML = parent.children.map(c => {
      const emoji = c.iconEmoji || '';
      const label = c.label || '';
      const href  = c.href  || '#';
      return `<a href="${href}" class="df-tile">${emoji} <span>${label}</span></a>`;
    }).join('');
  });
})();