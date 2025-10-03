// Dowson Farms — Drawer (menus only)  ✅ robust hamburger binding
// - Works even if the header (and #drawerToggle) is injected later
// - Builds from window.DF_DRAWER_MENUS
// - Respects DF_ACCESS.canView when available
// - Does NOT inject any footer/branding; only the accordion in <nav>

(function () {
  // ----- ensure shell exists (safe on all pages) -----
  let drawer = document.getElementById('drawer');
  if (!drawer) {
    drawer = document.createElement('div');
    drawer.id = 'drawer';
    drawer.className = 'drawer';
    drawer.innerHTML = '<nav></nav>';
    document.body.appendChild(drawer);
  }
  let backdrop = document.getElementById('drawerBackdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.id = 'drawerBackdrop';
    backdrop.className = 'drawerBackdrop';
    document.body.appendChild(backdrop);
  }
  const nav = drawer.querySelector('nav') || drawer.appendChild(document.createElement('nav'));

  // Keep above global footer
  drawer.style.zIndex = '1000';
  backdrop.style.zIndex = '999';

  // ----- open/close / a11y -----
  function openDrawer() {
    if (!document.body.classList.contains('drawer-open')) {
      document.body.classList.add('drawer-open');
      drawer.setAttribute('aria-hidden', 'false');
    }
  }
  function closeDrawer() {
    if (document.body.classList.contains('drawer-open')) {
      document.body.classList.remove('drawer-open');
      drawer.setAttribute('aria-hidden', 'true');
    }
  }
  function toggleDrawer() {
    document.body.classList.contains('drawer-open') ? closeDrawer() : openDrawer();
  }

  // Backdrop click + ESC to close
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeDrawer(); });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });

  // ----- hamburger binding that never misses -----
  // 1) Event delegation: any click on an element (or ancestor) with #drawerToggle toggles
  document.addEventListener('click', (e) => {
    const btn = e.target.closest && e.target.closest('#drawerToggle');
    if (btn) {
      e.preventDefault();
      toggleDrawer();
    }
  });

  // 2) Keep aria-expanded on the button in sync (if present)
  const ariaSync = () => {
    const btn = document.getElementById('drawerToggle');
    if (btn) btn.setAttribute('aria-expanded', document.body.classList.contains('drawer-open') ? 'true' : 'false');
  };
  const bodyObs = new MutationObserver(ariaSync);
  bodyObs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  ariaSync();

  // ----- permissions helper -----
  function canView(href) {
    try {
      if (!href) return true;
      if (window.DF_ACCESS && typeof window.DF_ACCESS.canView === 'function') {
        return !!window.DF_ACCESS.canView(href);
      }
      return true;
    } catch { return true; }
  }

  // ----- build accordion from DF_DRAWER_MENUS -----
  function build() {
    const data = Array.isArray(window.DF_DRAWER_MENUS) ? window.DF_DRAWER_MENUS : [];
    nav.innerHTML = '';

    data.forEach(group => {
      const children = group.children || [];
      // Filter out groups without any visible items (respect perms if available)
      const visibleKids = children.filter(item => {
        if (Array.isArray(item.children) && item.children.length) {
          return item.children.some(l => canView(l.href));
        }
        return canView(item.href);
      });
      if (!visibleKids.length) return;

      const g = document.createElement('div');
      g.className = 'group';
      g.setAttribute('aria-expanded', 'false');

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.innerHTML = `<span class="icon">${group.icon || ''}</span>${group.label}<span class="chev">›</span>`;
      btn.addEventListener('click', () => {
        const isOpen = g.getAttribute('aria-expanded') === 'true';
        nav.querySelectorAll('.group[aria-expanded="true"]').forEach(x => x.setAttribute('aria-expanded', 'false'));
        g.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
      });
      g.appendChild(btn);

      const panel = document.createElement('div');
      panel.className = 'panel';

      visibleKids.forEach(item => {
        if (Array.isArray(item.children) && item.children.length) {
          const grand = item.children.filter(l => canView(l.href));
          if (!grand.length) return;

          const sg = document.createElement('div');
          sg.className = 'subgroup';
          sg.setAttribute('aria-expanded', 'false');

          const sbtn = document.createElement('button');
          sbtn.type = 'button';
          sbtn.innerHTML = `<span class="icon">${item.icon || ''}</span>${item.label}<span class="chev">›</span>`;
          sbtn.addEventListener('click', () => {
            const open = sg.getAttribute('aria-expanded') === 'true';
            panel.querySelectorAll('.subgroup[aria-expanded="true"]').forEach(x => x.setAttribute('aria-expanded', 'false'));
            sg.setAttribute('aria-expanded', open ? 'false' : 'true');
          });
          sg.appendChild(sbtn);

          const subpanel = document.createElement('div');
          subpanel.className = 'subpanel';
          grand.forEach(link => {
            const a = document.createElement('a');
            a.className = 'item';
            a.href = link.href || '#';
            a.innerHTML = `<span class="icon">${link.icon || ''}</span>${link.label}`;
            a.addEventListener('click', closeDrawer);
            subpanel.appendChild(a);
          });

          sg.appendChild(subpanel);
          panel.appendChild(sg);
        } else {
          if (!canView(item.href)) return;
          const a = document.createElement('a');
          a.className = 'item';
          a.href = item.href || '#';
          a.innerHTML = `<span class="icon">${item.icon || ''}</span>${item.label}`;
          a.addEventListener('click', closeDrawer);
          panel.appendChild(a);
        }
      });

      g.appendChild(panel);
      nav.appendChild(g);
    });
  }

  // Build now
  build();

  // Rebuild once DF_ACCESS appears (permissions ready)
  if (!window.DF_ACCESS) {
    let tries = 0;
    const t = setInterval(() => {
      tries++;
      if (window.DF_ACCESS || tries > 40) { // ~12s max
        clearInterval(t);
        build();
      }
    }, 300);
  }

  // Expose manual rebuild if you ever need it from console
  window.DF_DRAWER_REBUILD = build;
})();