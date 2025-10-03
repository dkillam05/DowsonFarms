// Dowson Farms — Drawer builder (accordion + hero + sticky footer)
// Safe hamburger wiring even if header injects after this script.
// Uses: window.DF_DRAWER_MENUS, window.DF_ACCESS, window.DF_VERSION.

(function () {
  const drawer   = document.getElementById('drawer');
  const backdrop = document.getElementById('drawerBackdrop');
  if (!drawer) return;

  // ——— open/close helpers
  const openDrawer  = () => document.body.classList.add('drawer-open');
  const closeDrawer = () => document.body.classList.remove('drawer-open');
  const onKey = (e) => { if (e.key === 'Escape') closeDrawer(); };

  // Expose a public opener in case you want to call it from anywhere
  window.DF_OPEN_DRAWER = openDrawer;

  // Bind backdrop + esc
  backdrop && backdrop.addEventListener('click', (e)=>{ if(e.target===backdrop) closeDrawer(); });
  window.addEventListener('keydown', onKey);

  // ——— Robustly bind the hamburger (works even if header loads later)
  function bindHamburger() {
    const btn = document.getElementById('drawerToggle');
    if (!btn || btn.dataset.dfBound === '1') return !!btn;
    btn.addEventListener('click', openDrawer);
    btn.dataset.dfBound = '1';
    return true;
  }

  // Try now, then retry a few times, plus add delegated safety net
  let tries = 0, maxTries = 40; // ~4s total with 100ms interval
  if (!bindHamburger()) {
    const iv = setInterval(() => {
      if (bindHamburger() || ++tries >= maxTries) clearInterval(iv);
    }, 100);
  }
  // Delegated backup: ANY click on an element that matches #drawerToggle
  document.addEventListener('click', (e) => {
    const hit = e.target.closest && e.target.closest('#drawerToggle');
    if (hit) openDrawer();
  });

  // ——— Build hero (top logo/title/loc)
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

  // ——— permission helper
  const canView = (href) => {
    if (!window.DF_ACCESS || typeof window.DF_ACCESS.canView !== 'function') return true;
    return window.DF_ACCESS.canView(href);
  };

  // ——— link row
  const makeLink = (href, label, icon) => {
    const a = document.createElement('a');
    a.className = 'item';
    a.href = href || '#';
    a.innerHTML = `<span class="icon">${icon || ''}</span>${label}`;
    a.addEventListener('click', closeDrawer);
    return a;
  };

  // ——— subgroup (nested)
  function makeSubgroup(node) {
    const sg   = document.createElement('div');
    const btn  = document.createElement('button');
    const pane = document.createElement('div');
    sg.className = 'subgroup';
    btn.innerHTML = `<span class="icon">${node.icon || ''}</span>${node.label}<span class="chev">›</span>`;
    pane.className = 'subpanel';
    btn.addEventListener('click', ()=>{
      const exp = sg.getAttribute('aria-expanded') === 'true';
      sg.parentElement.querySelectorAll('.subgroup[aria-expanded="true"]').forEach(x=> x.setAttribute('aria-expanded','false'));
      sg.setAttribute('aria-expanded', exp ? 'false' : 'true');
    });
    sg.appendChild(btn);

    (node.children || []).forEach(ch => {
      if (canView(ch.href)) pane.appendChild(makeLink(ch.href, ch.label, ch.icon));
    });
    if (!pane.children.length) return null; // hide empty subgroup
    sg.appendChild(pane);
    return sg;
  }

  // ——— group (top level)
  function makeGroup(group) {
    const g = document.createElement('div');
    g.className = 'group';
    g.setAttribute('aria-expanded','false');

    const btn = document.createElement('button');
    btn.innerHTML = `<span class="icon">${group.icon || ''}</span>${group.label}<span class="chev">›</span>`;
    btn.addEventListener('click', ()=>{
      const expanded = g.getAttribute('aria-expanded') === 'true';
      nav.querySelectorAll('.group[aria-expanded="true"]').forEach(x=> x.setAttribute('aria-expanded','false'));
      g.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    });
    g.appendChild(btn);

    const panel = document.createElement('div');
    panel.className = 'panel';

    (group.children || []).forEach(item => {
      if (Array.isArray(item.children) && item.children.length) {
        const sg = makeSubgroup(item);
        if (sg) panel.appendChild(sg);
      } else if (canView(item.href)) {
        panel.appendChild(makeLink(item.href, item.label, item.icon));
      }
    });

    g.appendChild(panel);
    return g;
  }

  // ——— footer (logout + brand/version)
  function buildFooter() {
    const foot = document.createElement('div');
    foot.className = 'drawerFooter';

    const logout = document.createElement('a');
    logout.className = 'item logout';
    logout.href = '#';
    logout.innerHTML = `<span class="icon">↩️</span>Logout`;
    logout.addEventListener('click', async (e)=>{
      e.preventDefault();
      try {
        const { auth } = await import('./firebase-init.js');
        const { signOut } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js');
        await signOut(auth);
        closeDrawer();
        location.href = 'auth/';
      } catch (err) {
        console.warn('Logout failed:', err);
      }
    });

    const hr = document.createElement('div');
    Object.assign(hr.style, { height:'1px', background:'#0001', margin:'8px 0' });

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

  // ——— write structure
  const originalNav = drawer.querySelector('nav');
  const nav = originalNav || document.createElement('nav');

  drawer.innerHTML = '';               // rebuild clean
  drawer.appendChild(buildHero());     // top hero
  drawer.appendChild(nav);             // list region
  drawer.appendChild(buildFooter());   // sticky footer

  // Build groups from data
  nav.innerHTML = '';
  const data = (window.DF_DRAWER_MENUS || []);
  data.forEach(group => nav.appendChild(makeGroup(group)));

  // ——— autosize width to longest label (clamped)
  try {
    const measurer = document.createElement('div');
    measurer.style.position = 'absolute';
    measurer.style.visibility = 'hidden';
    measurer.style.whiteSpace = 'nowrap';
    measurer.style.font = '16px system-ui, -apple-system, Segoe UI, Roboto, Arial';
    document.body.appendChild(measurer);

    let longest = 240;
    drawer.querySelectorAll('.group > button, a.item, .subgroup > button').forEach(el => {
      const text = (el.innerText || el.textContent || '').trim();
      measurer.textContent = text;
      longest = Math.max(longest, measurer.offsetWidth + 80);
    });
    document.body.removeChild(measurer);

    const clamped = Math.max(260, Math.min(420, longest));
    drawer.style.setProperty('--drawer-w', clamped + 'px');
  } catch {}
})();