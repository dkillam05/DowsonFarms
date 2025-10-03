// Dowson Farms — Drawer builder (accordion + hero + sticky footer)
// Uses: window.DF_DRAWER_MENUS (data), window.DF_ACCESS (optional permission filtering),
//       window.DF_VERSION (from js/version.js), and the #drawerToggle button in your header.

(function () {
  const drawer   = document.getElementById('drawer');
  const backdrop = document.getElementById('drawerBackdrop');
  const toggle   = document.getElementById('drawerToggle');
  if (!drawer) return;

  // ——— open/close helpers
  const openDrawer  = () => document.body.classList.add('drawer-open');
  const closeDrawer = () => document.body.classList.remove('drawer-open');
  const onKey = (e) => { if (e.key === 'Escape') closeDrawer(); };

  toggle && toggle.addEventListener('click', openDrawer);
  backdrop && backdrop.addEventListener('click', (e)=>{ if(e.target===backdrop) closeDrawer(); });
  window.addEventListener('keydown', onKey);

  // ——— build hero (top logo/title/loc)
  function buildHero() {
    const hero = document.createElement('div');
    hero.className = 'hero';
    hero.innerHTML = `
      <div class="row">
        <img src="assets/icons/icon-192.png" alt="">
        <div>
          <div class="title">Dowson Farms</div>
          <div class="sub">Divernon, Illinois</div>
        </div>
      </div>
    `;
    return hero;
  }

  // ——— permission helper (if DF_ACCESS present)
  const canView = (href) => {
    if (!window.DF_ACCESS || typeof window.DF_ACCESS.canView !== 'function') return true;
    return window.DF_ACCESS.canView(href);
  };

  // ——— build a simple link row
  const makeLink = (href, label, icon) => {
    const a = document.createElement('a');
    a.className = 'item';
    a.href = href || '#';
    a.innerHTML = `<span class="icon">${icon || ''}</span>${label}`;
    a.addEventListener('click', closeDrawer);
    return a;
  };

  // ——— build nested subgroup (for Add Records, Products, etc.)
  function makeSubgroup(node) {
    const sg   = document.createElement('div');
    const btn  = document.createElement('button');
    const pane = document.createElement('div');
    sg.className = 'subgroup';
    btn.innerHTML = `<span class="icon">${node.icon || ''}</span>${node.label}<span class="chev">›</span>`;
    pane.className = 'subpanel';
    btn.addEventListener('click', ()=>{
      const exp = sg.getAttribute('aria-expanded') === 'true';
      // collapse siblings
      sg.parentElement.querySelectorAll('.subgroup[aria-expanded="true"]').forEach(x=> x.setAttribute('aria-expanded','false'));
      sg.setAttribute('aria-expanded', exp ? 'false' : 'true');
    });
    sg.appendChild(btn);

    (node.children || []).forEach(ch => {
      if (canView(ch.href)) pane.appendChild(makeLink(ch.href, ch.label, ch.icon));
    });
    sg.appendChild(pane);
    return sg;
  }

  // ——— build top-level group
  function makeGroup(group) {
    const g = document.createElement('div');
    g.className = 'group';
    g.setAttribute('aria-expanded','false');

    const btn = document.createElement('button');
    btn.innerHTML = `<span class="icon">${group.icon || ''}</span>${group.label}<span class="chev">›</span>`;
    btn.addEventListener('click', ()=>{
      const expanded = g.getAttribute('aria-expanded') === 'true';
      // collapse others for cleanliness
      nav.querySelectorAll('.group[aria-expanded="true"]').forEach(x=> x.setAttribute('aria-expanded','false'));
      g.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    });
    g.appendChild(btn);

    const panel = document.createElement('div');
    panel.className = 'panel';

    (group.children || []).forEach(item => {
      if (Array.isArray(item.children) && item.children.length) {
        // nested subgroup
        const sg = makeSubgroup(item);
        // hide empty subgroup (no permitted links)
        if (sg.querySelector('.subpanel').children.length) panel.appendChild(sg);
      } else if (canView(item.href)) {
        panel.appendChild(makeLink(item.href, item.label, item.icon));
      }
    });

    g.appendChild(panel);
    return g;
  }

  // ——— sticky footer (logout + brand/version)
  function buildFooter() {
    const foot = document.createElement('div');
    foot.className = 'drawerFooter';

    // logout (same size as normal item)
    const logout = document.createElement('a');
    logout.className = 'item logout';
    logout.href = '#';
    logout.innerHTML = `<span class="icon">↩️</span>Logout`;
    logout.addEventListener('click', async (e)=>{
      e.preventDefault();
      try {
        // defer import to avoid pulling firebase in non-auth pages here
        const { auth } = await import('./firebase-init.js');
        const { signOut } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js');
        await signOut(auth);
        closeDrawer();
        location.href = 'auth/'; // land on your auth page
      } catch (err) {
        console.warn('Logout failed:', err);
      }
    });

    const hr = document.createElement('div');
    hr.style.height = '1px';
    hr.style.background = '#0001';
    hr.style.margin = '8px 0';

    const brand = document.createElement('div');
    brand.className = 'footBrand';
    brand.innerHTML = `
      <img src="assets/icons/icon-192.png" alt="">
      <div>
        <div class="title">Dowson Farms · Divernon, Illinois</div>
      </div>
    `;

    const ver = document.createElement('div');
    ver.className = 'ver';
    const v = (window.DF_VERSION && window.DF_VERSION.app) ? window.DF_VERSION.app : '0.0.0';
    ver.textContent = `App v${v}`;

    foot.appendChild(logout);
    foot.appendChild(hr);
    foot.appendChild(brand);
    foot.appendChild(ver);
    return foot;
  }

  // ——— write the drawer
  const nav = drawer.querySelector('nav');
  nav.innerHTML = '';
  drawer.innerHTML = '';               // rebuild clean
  drawer.appendChild(buildHero());     // top hero
  drawer.appendChild(nav);             // list region
  drawer.appendChild(buildFooter());   // sticky footer

  // Build groups from data
  const data = (window.DF_DRAWER_MENUS || []);
  data.forEach(group => nav.appendChild(makeGroup(group)));

  // ——— autosize drawer width: “just a bit wider than the longest line”
  try {
    const measurer = document.createElement('div');
    measurer.style.position = 'absolute';
    measurer.style.visibility = 'hidden';
    measurer.style.whiteSpace = 'nowrap';
    measurer.style.font = '16px system-ui, -apple-system, Segoe UI, Roboto, Arial';
    document.body.appendChild(measurer);

    let longest = 240; // baseline
    // look at visible buttons/links text
    drawer.querySelectorAll('.group > button, a.item, .subgroup > button').forEach(el => {
      const text = el.innerText || el.textContent || '';
      measurer.textContent = text.trim();
      longest = Math.max(longest, measurer.offsetWidth + 80); // a little padding
    });
    document.body.removeChild(measurer);

    const clamped = Math.max(260, Math.min(420, longest)); // keep sane bounds
    drawer.style.setProperty('--drawer-w', clamped + 'px');
  } catch {}

})();