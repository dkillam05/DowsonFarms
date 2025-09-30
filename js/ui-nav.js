/* ===========================
   Dowson Farms — ui-nav.js
   Zero-fallback renderer for window.DF_MENUS
   - Listens to:
       • df:view-change (detail.view: 'tiles'|'list')
       • df:search (detail.q: string)
   - Renders ONLY items defined in window.DF_MENUS
   =========================== */

(function () {
  'use strict';

  // ---------- DOM hooks ----------
  var container = document.getElementById('app-sections');
  if (!container) {
    // No container; abort silently (no fallback).
    console.warn('[ui-nav] #app-sections not found; nothing rendered.');
    return;
  }

  // ---------- Data source ----------
  var MENUS = (window && window.DF_MENUS) ? window.DF_MENUS : null;
  if (!MENUS || !Array.isArray(MENUS.tiles)) {
    // No menus present; do not render anything.
    console.warn('[ui-nav] window.DF_MENUS.tiles missing; nothing rendered.');
    return;
  }

  // ---------- State ----------
  var state = {
    view: (container.getAttribute('data-view') === 'list') ? 'list' : 'tiles',
    q: ''  // search query
  };

  // ---------- Utilities ----------
  function normText(s) {
    return (s || '').toString().normalize('NFKD').toLowerCase();
  }
  function matchesQuery(label, q) {
    if (!q) return true;
    return normText(label).indexOf(normText(q)) !== -1;
  }

  // Collect flat list of items for list view (both parents and children)
  function flattenItems() {
    var items = [];
    MENUS.tiles.forEach(function (section) {
      // parent item (section itself)
      if (section && section.label && section.href) {
        items.push({
          type: 'parent',
          label: section.label,
          href: section.href,
          iconEmoji: section.iconEmoji || '',
          parent: section.label
        });
      }
      // children items
      if (section && Array.isArray(section.children)) {
        section.children.forEach(function (child) {
          if (child && child.label && child.href) {
            items.push({
              type: 'child',
              label: child.label,
              href: child.href,
              iconEmoji: child.iconEmoji || '',
              parent: section.label
            });
          }
        });
      }
    });
    return items;
  }

  // ---------- Renderers ----------
  function renderTiles(q) {
    // Show only top-level tiles that match the query (by section label).
    var tiles = MENUS.tiles.filter(function (sec) {
      return sec && sec.label && sec.href && matchesQuery(sec.label, q);
    });

    // Clear container and build grid
    container.innerHTML = '';
    var grid = document.createElement('div');
    grid.className = 'grid';
    container.appendChild(grid);

    tiles.forEach(function (sec) {
      var a = document.createElement('a');
      a.className = 'item';
      a.href = sec.href;

      var card = document.createElement('article');
      card.className = 'tile';

      var emoji = document.createElement('div');
      emoji.setAttribute('aria-hidden', 'true');
      emoji.textContent = sec.iconEmoji || '📁';
      emoji.style.fontSize = '22px';

      var label = document.createElement('span');
      label.className = 'label';
      label.textContent = sec.label;

      var hint = document.createElement('span');
      hint.className = 'hint';
      var count = Array.isArray(sec.children) ? sec.children.length : 0;
      hint.textContent = count > 0 ? (count + ' items') : '—';

      card.appendChild(emoji);
      card.appendChild(label);
      card.appendChild(hint);
      a.appendChild(card);
      grid.appendChild(a);
    });
  }

  function renderList(q) {
    // Flatten parents + children, filter by query on the item label.
    var all = flattenItems().filter(function (it) {
      return matchesQuery(it.label, q);
    });

    container.innerHTML = '';
    var list = document.createElement('div');
    list.className = 'list';
    container.appendChild(list);

    all.forEach(function (it) {
      var a = document.createElement('a');
      a.className = 'item';
      a.href = it.href;

      var row = document.createElement('article');
      row.className = 'row';

      var meta = document.createElement('div');
      meta.className = 'meta';

      var title = document.createElement('div');
      title.style.display = 'flex';
      title.style.alignItems = 'center';
      title.style.gap = '8px';

      var emoji = document.createElement('div');
      emoji.setAttribute('aria-hidden', 'true');
      emoji.textContent = it.iconEmoji || '•';
      // keep font size modest in list view
      emoji.style.fontSize = '18px';

      var label = document.createElement('strong');
      label.textContent = it.label;

      title.appendChild(emoji);
      title.appendChild(label);

      var sub = document.createElement('div');
      sub.className = 'muted';
      sub.textContent = (it.type === 'child')
        ? ('From: ' + it.parent)
        : 'Section';

      meta.appendChild(title);
      meta.appendChild(sub);

      // arrow
      var chev = document.createElement('div');
      chev.textContent = '›';
      chev.setAttribute('aria-hidden', 'true');
      chev.style.fontWeight = '700';

      row.appendChild(meta);
      row.appendChild(chev);
      a.appendChild(row);
      list.appendChild(a);
    });
  }

  function render() {
    if (state.view === 'list') {
      renderList(state.q);
    } else {
      renderTiles(state.q);
    }
  }

  // ---------- Event wiring ----------
  // Initial render
  render();

  // View change from index.html
  window.addEventListener('df:view-change', function (e) {
    var v = e && e.detail && e.detail.view;
    if (v === 'tiles' || v === 'list') {
      state.view = v;
      render();
    }
  });

  // Search input from index.html
  window.addEventListener('df:search', function (e) {
    var q = (e && e.detail && typeof e.detail.q === 'string') ? e.detail.q : '';
    state.q = q;
    render();
  });

})();