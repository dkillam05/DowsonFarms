// Dowson Farms — Drawer (menus only, robust hamburger binding)
//
// This file:
// • Builds the accordion from window.DF_DRAWER_MENUS
// • Respects DF_ACCESS.canView if present
// • Binds the ☰ button even if the header is injected after this runs
// • Keeps drawer above the global footer

(function () {
  const drawer   = document.getElementById('drawer');
  const backdrop = document.getElementById('drawerBackdrop');
  if (!drawer || !backdrop) return;

  const nav = drawer.querySelector('nav') || drawer.appendChild(document.createElement('nav'));

  // ---------- open/close ----------
  function openDrawer() {
    document.body.classList.add('drawer-open');
    drawer.setAttribute('aria-hidden', 'false');
  }
  function closeDrawer() {
    document.body.classList.remove('drawer-open');
    drawer.setAttribute('aria-hidden', 'true');
  }
  function toggleDrawer() {
    const open = document.body.classList.contains('drawer-open');
    open ? closeDrawer() : openDrawer();
  }

  // Backdrop + Esc to close
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeDrawer(); });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });

  // Ensure drawer is above global footer
  drawer.style.zIndex = '1000';
  backdrop.style.zIndex = '999';

  // ---------- robust hamburger binding ----------
  function bindHamburgerIfPresent(root = document) {
    const btn = root.querySelector('#drawerToggle');
    if (btn && !btn.dataset.dfDrawerBound) {
      btn.addEventListener('click', toggleDrawer);
      btn.setAttribute('aria-controls', 'drawer');
      btn.setAttribute('aria-expanded', 'false');
      // reflect state for a11y
      const observer = new MutationObserver(() => {
        const expanded = document.body.classList.contains('drawer-open');
        btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      });
      observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
      btn.dataset.dfDrawerBound = '1';
    }
  }

  // Try now, then on DOM ready, and watch for header injection
  bindHamburgerIfPresent();
  document.addEventListener('DOMContentLoaded', () => bindHamburgerIfPresent());
  const mo = new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === 'childList' && (m.addedNodes?.length || m.removedNodes?.length)) {
        bindHamburgerIfPresent();
      }
    }
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });

  // ---------- permissions helper ----------
  function canView(href) {
    try {
      if (!href) return true;
      if (window.DF_ACCESS && typeof window.DF_ACCESS.canView === 'function') {
        return !!window.DF_ACCESS.canView(href);
      }
      return true;
    } catch { return true; }
  }

  // ---------- build accordion ----------
  function build() {
    const data = Array.isArray(window.DF_DRAWER_MENUS) ? window.DF_DRAWER_MENUS : [];
    nav.innerHTML = '';

    data.forEach(group => {
      const kids = (group.children || []);
      const visibleKids = kids.filter(ch => {
        if (Array.isArray(ch.children) && ch.children.length) {
          return ch.children.some(link => canView(link.href));
        }
        return canView(ch.href);
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
        nav.querySelectorAll('.group[aria-expanded="true"]').forEach(x => x.setAttribute('aria-expanded', 'false'));
        g.setAttribute('aria-expanded', open ? 'false' : 'true');
      });
      g.appendChild(btn);

      const panel = document.createElement('div');
      panel.className = 'panel';

      visibleKids.forEach(item => {
        if (Array.isArray(item.children) && item.children.length) {
          const grand = item.children.filter(link => canView(link.href));
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

  build();
})();