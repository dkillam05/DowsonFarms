// Dowson Farms — Drawer (robust hamburger wiring + hero + sticky footer)

(function () {
  const drawer   = document.getElementById('drawer');
  const backdrop = document.getElementById('drawerBackdrop');
  if (!drawer) return;

  // ---------- open / close
  const openDrawer  = () => document.body.classList.add('drawer-open');
  const closeDrawer = () => document.body.classList.remove('drawer-open');
  window.DF_OPEN_DRAWER = openDrawer;

  backdrop && backdrop.addEventListener('click', (e)=>{ if (e.target === backdrop) closeDrawer(); });
  window.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') closeDrawer(); });

  // ---------- HAMBURGER: bind now, keep retrying, plus delegation
  function findToggle() {
    return (
      document.getElementById('drawerToggle') ||
      document.querySelector('.app-header .burger') ||
      document.querySelector('[aria-label="Open menu"]')
    );
  }
  function bindToggle(btn) {
    if (!btn || btn.dataset.dfBound === '1') return;
    const onTap = (ev) => { ev.preventDefault(); openDrawer(); };
    btn.addEventListener('click', onTap, { passive: false });
    btn.addEventListener('touchstart', onTap, { passive: false });
    btn.dataset.dfBound = '1';
  }

  // Try immediately
  bindToggle(findToggle());
  // Retry until it appears (header injected later)
  let tries = 0, maxTries = 60; // ~6s total
  const iv = setInterval(() => {
    const btn = findToggle();
    if (btn && btn.dataset.dfBound === '1') { clearInterval(iv); return; }
    if (btn) bindToggle(btn);
    if (++tries >= maxTries) clearInterval(iv);
  }, 100);

  // Delegation safety-net (covers any future re-render)
  document.addEventListener('click', (e)=>{
    const hit = e.target.closest && (
      e.target.closest('#drawerToggle') ||
      e.target.closest('.app-header .burger') ||
      e.target.closest('[aria-label="Open menu"]')
    );
    if (hit) { e.preventDefault(); openDrawer(); }
  }, true);

  // ---------- permission helper
  const canView = (href) => {
    if (!window.DF_ACCESS || typeof window.DF_ACCESS.canView !== 'function') return true;
    return window.DF_ACCESS.canView(href);
  };

  // ---------- build hero (top area)
  function buildHero(){
    const hero = document.createElement('div');
    hero.className = 'brand';
    hero.innerHTML = `
      <img src="assets/icons/icon-192.png" alt="">
      <div>
        <div style="font-weight:700">Dowson Farms</div>
        <div class="mono">Divernon, Illinois</div>
      </div>
    `;
    return hero;
  }

  // ---------- link row / subgroup / group
  const makeLink = (href, label, icon) => {
    const a = document.createElement('a');
    a.className = 'item';
    a.href = href || '#';
    a.innerHTML = `<span class="icon">${icon || ''}</span>${label}`;
    a.addEventListener('click', closeDrawer);
    return a;
  };

  function makeSubgroup(node){
    const kids = (node.children || []).filter(ch => canView(ch.href));
    if (!kids.length) return null;

    const sg = document.createElement('div');
    sg.className = 'subgroup';
    sg.setAttribute('aria-expanded','false');

    const btn = document.createElement('button');
    btn.innerHTML = `<span class="icon">${node.icon || ''}</span>${node.label}<span class="chev">›</span>`;
    btn.addEventListener('click', ()=>{
      const exp = sg.getAttribute('aria-expanded') === 'true';
      sg.parentElement.querySelectorAll('.subgroup[aria-expanded="true"]').forEach(x=> x.setAttribute('aria-expanded','false'));
      sg.setAttribute('aria-expanded', exp ? 'false' : 'true');
    });
    sg.appendChild(btn);

    const pane = document.createElement('div');
    pane.className = 'subpanel';
    kids.forEach(ch => pane.appendChild(makeLink(ch.href, ch.label, ch.icon)));
    sg.appendChild(pane);
    return sg;
  }

  function makeGroup(group){
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

    const pane = document.createElement('div');
    pane.className = 'panel';

    (group.children || []).forEach(it=>{
      if (Array.isArray(it.children) && it.children.length) {
        const sg = makeSubgroup(it);
        if (sg) pane.appendChild(sg);
      } else if (canView(it.href)) {
        pane.appendChild(makeLink(it.href, it.label, it.icon));
      }
    });

    g.appendChild(pane);
    return g;
  }

  // ---------- footer (logout + brand/version)
  function buildFooter(){
    const foot = document.createElement('div');
    foot.className = 'drawerFooter';

    const logout = document.createElement('a');
    logout.className = 'item logout';
    logout.href = '#';
    logout.innerHTML = `<span class="icon">↩️</span>Logout`;
    logout.addEventListener('click', async (e)=>{
      e.preventDefault();
      try{
        const { auth } = await import('./firebase-init.js');
        const { signOut } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js');
        await signOut(auth);
        closeDrawer();
        location.href = 'auth/';
      }catch(err){ console.warn('Logout failed:', err); }
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

  // ---------- write structure
  const navShell = drawer.querySelector('nav') || document.createElement('nav');
  drawer.innerHTML = '';
  drawer.appendChild(buildHero());
  drawer.appendChild(navShell);
  drawer.appendChild(buildFooter());

  const nav = navShell;
  nav.innerHTML = '';
  (window.DF_DRAWER_MENUS || []).forEach(group => nav.appendChild(makeGroup(group)));

  // ---------- width autosize (clamped)
  try{
    const measurer = document.createElement('div');
    measurer.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;font:16px system-ui,-apple-system,Segoe UI,Roboto,Arial';
    document.body.appendChild(measurer);
    let longest = 240;
    drawer.querySelectorAll('.group > button, a.item, .subgroup > button').forEach(el=>{
      measurer.textContent = (el.innerText || el.textContent || '').trim();
      longest = Math.max(longest, measurer.offsetWidth + 80);
    });
    document.body.removeChild(measurer);
    const clamped = Math.max(260, Math.min(420, longest));
    drawer.style.width = clamped + 'px';
  }catch{}
})();