// Dowson Farms — Drawer (NO internal footer/brand/version; menus only)
// Builds the accordion from window.DF_DRAWER_MENUS and respects DF_ACCESS.canView.
// Works with the fixed header + global footer you already have.

(function () {
  const drawer   = document.getElementById('drawer');
  const backdrop = document.getElementById('drawerBackdrop');
  const toggle   = document.getElementById('drawerToggle');

  if (!drawer) return;

  const nav = drawer.querySelector('nav') || drawer.appendChild(document.createElement('nav'));

  // ---- open/close ----
  function openDrawer(){ document.body.classList.add('drawer-open'); }
  function closeDrawer(){ document.body.classList.remove('drawer-open'); }
  function clickBackdrop(e){ if (e.target === backdrop) closeDrawer(); }

  toggle   && toggle.addEventListener('click', openDrawer);
  backdrop && backdrop.addEventListener('click', clickBackdrop);
  window.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') closeDrawer(); });

  // Ensure drawer sits above global footer
  drawer.style.zIndex = '1000';
  backdrop.style.zIndex = '999';

  // ---- permission helper ----
  function canView(href){
    try {
      if (!href) return true;
      if (window.DF_ACCESS && typeof window.DF_ACCESS.canView === 'function'){
        return !!window.DF_ACCESS.canView(href);
      }
      return true; // if access system not ready, don't hide
    } catch { return true; }
  }

  // ---- build accordion (two levels max: group -> subgroup -> links) ----
  function build(){
    const data = Array.isArray(window.DF_DRAWER_MENUS) ? window.DF_DRAWER_MENUS : [];
    nav.innerHTML = '';

    data.forEach(group => {
      // Filter out groups with zero visible items (when permissions apply)
      const visibleChildren = (group.children || []).filter(ch => {
        if (Array.isArray(ch.children) && ch.children.length){
          return ch.children.some(link => canView(link.href));
        }
        return canView(ch.href);
      });
      if (!visibleChildren.length) return;

      const g = document.createElement('div');
      g.className = 'group';
      g.setAttribute('aria-expanded', 'false');

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.innerHTML = `<span class="icon">${group.icon || ''}</span>${group.label}<span class="chev">›</span>`;
      btn.addEventListener('click', ()=>{
        const isOpen = g.getAttribute('aria-expanded') === 'true';
        // collapse others
        nav.querySelectorAll('.group[aria-expanded="true"]').forEach(x=> x.setAttribute('aria-expanded','false'));
        g.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
      });
      g.appendChild(btn);

      const panel = document.createElement('div');
      panel.className = 'panel';

      visibleChildren.forEach(item => {
        if (Array.isArray(item.children) && item.children.length){
          // second-level accordion
          const grand = item.children.filter(link => canView(link.href));
          if (!grand.length) return;

          const sg = document.createElement('div');
          sg.className = 'subgroup';
          sg.setAttribute('aria-expanded','false');

          const sbtn = document.createElement('button');
          sbtn.type = 'button';
          sbtn.innerHTML = `<span class="icon">${item.icon || ''}</span>${item.label}<span class="chev">›</span>`;
          sbtn.addEventListener('click', ()=>{
            const open = sg.getAttribute('aria-expanded') === 'true';
            panel.querySelectorAll('.subgroup[aria-expanded="true"]').forEach(x=> x.setAttribute('aria-expanded','false'));
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
          // leaf link
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