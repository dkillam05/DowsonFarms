// Dowson Farms — Drawer builder (accordion)
// - Builds from window.DF_DRAWER_MENUS
// - Applies DF_ACCESS.canView (if present)
// - Adds a compact footer pinned to the very bottom (Logout + brand + version)

(function(){
  const drawer   = document.getElementById('drawer');
  const backdrop = document.getElementById('drawerBackdrop');
  const toggle   = document.getElementById('drawerToggle');
  if(!drawer) return;

  const nav = drawer.querySelector('nav');

  const openDrawer  = () => document.body.classList.add('drawer-open');
  const closeDrawer = () => document.body.classList.remove('drawer-open');

  toggle   && toggle.addEventListener('click', openDrawer);
  backdrop && backdrop.addEventListener('click', (e)=>{ if(e.target===backdrop) closeDrawer(); });
  window.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeDrawer(); });

  // Optional permission filter
  const canView = (href) => {
    try { return (window.DF_ACCESS && typeof window.DF_ACCESS.canView === 'function')
      ? window.DF_ACCESS.canView(href) : true; }
    catch { return true; }
  };

  function build(){
    const data = (window.DF_DRAWER_MENUS || []);
    nav.innerHTML = '';

    data.forEach(group => {
      // Skip group if nothing inside is visible
      const hasVisible = (group.children||[]).some(ch => {
        if (Array.isArray(ch.children)) return ch.children.some(g => canView(g.href||''));
        return canView(ch.href||'');
      });
      if (!hasVisible) return;

      const g = document.createElement('div');
      g.className = 'group';
      g.setAttribute('aria-expanded','false');

      const btn = document.createElement('button');
      btn.innerHTML = `<span class="icon">${group.icon||''}</span>${group.label}<span class="chev">›</span>`;
      btn.addEventListener('click', ()=>{
        const expanded = g.getAttribute('aria-expanded') === 'true';
        nav.querySelectorAll('.group[aria-expanded="true"]').forEach(x=> x.setAttribute('aria-expanded','false'));
        g.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      });
      g.appendChild(btn);

      const panel = document.createElement('div');
      panel.className = 'panel';

      (group.children||[]).forEach(item=>{
        if (Array.isArray(item.children) && item.children.length){
          const anyVisible = item.children.some(link => canView(link.href||''));
          if (!anyVisible) return;

          const sg = document.createElement('div');
          sg.className = 'subgroup';
          sg.setAttribute('aria-expanded','false');

          const sbtn = document.createElement('button');
          sbtn.innerHTML = `<span class="icon">${item.icon||''}</span>${item.label}<span class="chev">›</span>`;
          sbtn.addEventListener('click', ()=>{
            const exp = sg.getAttribute('aria-expanded')==='true';
            panel.querySelectorAll('.subgroup[aria-expanded="true"]').forEach(x=> x.setAttribute('aria-expanded','false'));
            sg.setAttribute('aria-expanded', exp ? 'false' : 'true');
          });
          sg.appendChild(sbtn);

          const subpanel = document.createElement('div');
          subpanel.className = 'subpanel';

          item.children.forEach(link=>{
            if (!canView(link.href||'')) return;
            const a = document.createElement('a');
            a.className = 'item';
            a.href = link.href || '#';
            a.innerHTML = `<span class="icon">${link.icon||''}</span>${link.label}`;
            a.addEventListener('click', closeDrawer);
            subpanel.appendChild(a);
          });

          sg.appendChild(subpanel);
          panel.appendChild(sg);
        } else {
          if (!canView(item.href||'')) return;
          const a = document.createElement('a');
          a.className = 'item';
          a.href = item.href || '#';
          a.innerHTML = `<span class="icon">${item.icon||''}</span>${item.label}`;
          a.addEventListener('click', closeDrawer);
          panel.appendChild(a);
        }
      });

      g.appendChild(panel);
      nav.appendChild(g);
    });

    // Build compact footer and append it as a sibling of <nav> so it
    // sits at the bottom of the flex column (no separate “banner” area).
    let foot = drawer.querySelector('.drawerFooter');
    if (foot) foot.remove();

    foot = document.createElement('div');
    foot.className = 'drawerFooter';

    // Logout
    const logout = document.createElement('a');
    logout.href = '#';
    logout.className = 'item logout';
    logout.innerHTML = `<span class="icon">↩️</span> Logout`;
    logout.addEventListener('click', async (e)=>{
      e.preventDefault();
      try{
        if (window.firebaseAuth) {
          const { signOut } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js');
          await signOut(window.firebaseAuth);
        }
      } finally {
        location.href = 'auth/';
      }
    });
    foot.appendChild(logout);

    // Brand + version
    const brand = document.createElement('div');
    brand.className = 'footBrand';
    brand.innerHTML = `
      <img src="assets/icons/icon-192.png" alt="">
      <div>
        <div class="title">Dowson Farms</div>
        <div class="mono">All systems operational</div>
      </div>
    `;
    foot.appendChild(brand);

    const ver = document.createElement('div');
    ver.className = 'ver';
    const v = (window.DF_VERSION && String(window.DF_VERSION)) || 'v0.0.0';
    ver.textContent = `App ${v}`;
    foot.appendChild(ver);

    // Append AFTER <nav> so it’s the last child of .drawer
    drawer.appendChild(foot);
  }

  // Expose a hook to rebuild (e.g., after roles load)
  window.DF_REBUILD_DRAWER = build;

  // Initial build
  build();

  // Rebuild once when DF_ACCESS appears
  if (!window.DF_ACCESS) {
    const t = setInterval(()=>{
      if (window.DF_ACCESS) { clearInterval(t); build(); }
    }, 200);
    setTimeout(()=>clearInterval(t), 6000);
  }
})();