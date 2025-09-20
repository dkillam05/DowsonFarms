<script>
// Renders submenu tiles from window.DF_MENUS based on a label or href
(function () {
  function ready(fn){ document.readyState !== 'loading' ? fn() : document.addEventListener('DOMContentLoaded', fn); }

  function byBase(href){ try{ return href.split('/').pop().toLowerCase(); }catch(_){ return href||''; } }

  // depth-first search by label or href
  function findNode({label, href}, nodes){
    for (const n of nodes){
      if ((label && n.label === label) || (href && byBase(n.href) === byBase(href))) return n;
      if (Array.isArray(n.children) && n.children.length){
        const hit = findNode({label, href}, n.children);
        if (hit) return hit;
      }
    }
    return null;
  }

  function renderTiles(host, items){
    host.innerHTML = items.map(t => {
      const emoji = t.iconEmoji || '';
      const text  = t.label || '';
      const url   = t.href  || '#';
      return `<a href="${url}" class="df-tile">${emoji} <span>${text}</span></a>`;
    }).join('');
  }

  ready(function () {
    if (!window.DF_MENUS || !Array.isArray(window.DF_MENUS.tiles)) return;

    // 1) Explicit target: <div class="df-tiles" data-menu="Setup / Settings">
    document.querySelectorAll('.df-tiles[data-menu]').forEach(host => {
      const label = host.getAttribute('data-menu');
      const node  = findNode({label}, window.DF_MENUS.tiles) || {};
      if (Array.isArray(node.children) && node.children.length) renderTiles(host, node.children);
    });

    // 2) Auto target (optional): <div class="df-tiles" data-auto-submenu>
    document.querySelectorAll('.df-tiles[data-auto-submenu]').forEach(host => {
      // Try breadcrumb last item → fallback to H1 → fallback to document.title prefix
      const crumbLast = document.querySelector('.breadcrumbs ol li:last-child')?.textContent?.trim();
      const h1        = document.querySelector('main h1')?.textContent?.trim();
      const tPrefix   = (document.title || '').split('—')[0].trim();
      const guess     = crumbLast || h1 || tPrefix;

      // Also try matching by current file name
      const hrefNode  = findNode({href: location.pathname}, window.DF_MENUS.tiles);
      const labelNode = guess ? findNode({label: guess}, window.DF_MENUS.tiles) : null;
      const node = labelNode || hrefNode || null;

      if (node && Array.isArray(node.children) && node.children.length) renderTiles(host, node.children);
    });
  });
})();
</script>
