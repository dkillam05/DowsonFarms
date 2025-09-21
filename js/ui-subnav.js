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

  // Compute the current folder name, e.g.
  // /settings-setup/index.html  -> "settings-setup"
  // /teams-partners/anything    -> "teams-partners"
  function currentFolder(){
    const folder = lastSegment(location.pathname.replace(/\/index\.html?$/i, '').replace(/\/+$/,''));
    return folder || '';
  }

  // Normalize a menu href so it works from inside a section page.
  // Rules:
  // - keep external URLs and hashes unchanged
  // - if href starts with the current folder + '/', strip that prefix to avoid doubling
  //   e.g. we're in settings-setup/, and href is "settings-setup/ss-farms.html" => "ss-farms.html"
  // - otherwise return as-is (relative/absolute will work with your existing pages/base)
  function normalizeHref(href, curFolder){
    const h = String(href || '');
    if (!h) return '#';
    if (h.startsWith('#')) return h;                       // in-page action/anchor
    if (/^[a-z]+:\/\//i.test(h)) return h;                 // http(s)://
    if (h.startsWith('/')) return h;                       // site-absolute (works if you use <base>)

    const prefix = curFolder ? (curFolder + '/') : '';
    if (prefix && h.toLowerCase().startsWith(prefix.toLowerCase())) {
      return h.slice(prefix.length);                       // strip redundant folder
    }
    return h;                                              // leave as-is
  }

  ready(function () {
    const host = document.querySelector('.df-tiles[data-section]');
    if (!host) return;

    // Resolve section name:
    // 1) explicit data-section
    // 2) <h1> text (strip leading emoji/symbol)
    // 3) folder name from URL (equipment/, reports/, etc.)
    let sectionName = host.getAttribute('data-section') || '';
    if (!sectionName) {
      const h1 = document.querySelector('.content h1')?.textContent || '';
      sectionName = h1.replace(/^[^\w]+/,'').trim();
    }
    if (!sectionName) {
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

    const curFolder = currentFolder();

    host.innerHTML = section.children.map(c => {
      const ico = c.iconEmoji ? (esc(c.iconEmoji) + ' ') : '';
      const href = normalizeHref(c.href, curFolder);
      return `<a href="${esc(href)}" class="df-tile">${ico}<span>${esc(c.label)}</span></a>`;
    }).join('');
  });
})();
