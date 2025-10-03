// Dowson Farms — Drawer (accordion + bottom brand, version, logout)
// Restores: no top brand, list begins below header, bottom logo + location + version,
// small logout row that matches other items, and robust ☰ binding.

(function () {
  // ----- ensure shell/backdrop exist -----
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

  // Keep the drawer above the global footer
  drawer.style.zIndex = '1000';
  backdrop.style.zIndex = '999';

  // Find/create nav container
  const nav = drawer.querySelector('nav') || drawer.appendChild(document.createElement('nav'));

  // ----- open/close helpers -----
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

  // backdrop click + ESC
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeDrawer(); });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });

  // Robust hamburger binding (works even if header is injected later)
  document.addEventListener('click', (e) => {
    const btn = e.target.closest && e.target.closest('#drawerToggle');
    if (btn) { e.preventDefault(); toggleDrawer(); }
  });
  const syncAria = () => {
    const btn = document.getElementById('drawerToggle');
    if (btn) btn.setAttribute('aria-expanded', document.body.classList.contains('drawer-open') ? 'true' : 'false');
  };
  new MutationObserver(syncAria).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  syncAria();

  // ----- permissions helper -----
  function canView(href) {
    try {
      if (!href) return true;
      if (window.DF_ACCESS && typeof window.DF_ACCESS.canView === 'function') return !!window.DF_ACCESS.canView(href);
      return true;
    } catch { return true; }
  }

  // Spacer so the drawer content starts *below* the fixed header
  function headerHeight() {
    const hdr = document.querySelector('.app-header');
    return hdr ? Math.max(56, hdr.offsetHeight) : 56;
  }

  // Build accordion groups
  function buildGroups(container) {
    const data = Array.isArray(window.DF_DRAWER_MENUS) ? window.DF_DRAWER_MENUS : [];
    data.forEach(group => {
      const kids = group.children || [];
      const visibleKids = kids.filter(item => {
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
        const open = g.getAttribute('aria-expanded') === 'true';
        container.querySelectorAll('.group[aria-expanded="true"]').forEach(x => x.setAttribute('aria-expanded', 'false'));
        g.setAttribute('aria-expanded', open ? 'false' : 'true');
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
      container.appendChild(g);
    });
  }

  // Bottom brand + version + small logout
  function buildBottom(container) {
    // divider
    const hr = document.createElement('div');
    hr.style.borderTop = '1px solid rgba(0,0,0,.08)';
    hr.style.margin = '8px 0 0';
    container.appendChild(hr);

    // logout row (same look/height as menu rows)
    const logout = document.createElement('a');
    logout.href = '#';
    logout.className = 'item';                 // reuse same row styling
    logout.style.margin = '10px 8px 6px';      // breathe a bit
    logout.style.border = '1px solid rgba(0,0,0,.06)';
    logout.style.borderRadius = '10px';
    logout.style.background = '#fff';
    logout.innerHTML = `<span class="icon">↩️</span>Logout`;
    logout.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        // lazy import auth only if needed
        const { auth } = await import('./firebase-init.js');
        const { signOut } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js');
        await signOut(auth);
      } catch {}
      location.replace('auth/');
    });
    container.appendChild(logout);

    // brand block at the very bottom
    const brand = document.createElement('div');
    brand.style.display = 'grid';
    brand.style.gridTemplateColumns = '36px 1fr';
    brand.style.gap = '10px';
    brand.style.alignItems = 'center';
    brand.style.padding = '10px 12px 16px';

    const img = document.createElement('img');
    img.src = 'assets/icons/icon-192.png';
    img.alt = '';
    img.style.width = '36px';
    img.style.height = '36px';
    img.style.borderRadius = '8px';
    brand.appendChild(img);

    const text = document.createElement('div');
    const title = document.createElement('div');
    title.textContent = 'Dowson Farms · Divernon, Illinois';
    title.style.fontWeight = '700';

    const ver = document.createElement('div');
    const v = (window.DF_VERSION && (window.DF_VERSION.version || window.DF_VERSION.appVersion)) || '0.0.0';
    ver.textContent = 'App v' + v;
    ver.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
    ver.style.fontSize = '12px';
    ver.style.color = '#456';

    text.appendChild(title);
    text.appendChild(ver);
    brand.appendChild(text);

    container.appendChild(brand);
  }

  // Build everything
  function build() {
    nav.innerHTML = '';

    // top spacer so content starts under the green header
    const spacer = document.createElement('div');
    spacer.style.height = headerHeight() + 'px';
    nav.appendChild(spacer);

    // accordion groups
    buildGroups(nav);

    // bottom brand / version / logout
    buildBottom(nav);
  }

  build();

  // Rebuild once DF_ACCESS is ready (permissions)
  if (!window.DF_ACCESS) {
    let tries = 0;
    const t = setInterval(() => {
      tries++;
      if (window.DF_ACCESS || tries > 40) {
        clearInterval(t);
        build();
      }
    }, 300);
  }

  // Also rebuild if header height changes later (rare)
  setTimeout(() => { build(); }, 1000);

  // expose manual rebuild for quick checks
  window.DF_DRAWER_REBUILD = build;
})();