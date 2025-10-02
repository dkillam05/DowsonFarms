// Dowson Farms — Drawer renderer (accordion + bottom branding + logout)
// Reads data from window.DF_DRAWER_MENUS (assets/data/drawer-menus.js)
// Respects DF_ACCESS.canView when available. No HTML changes required.

import { auth } from "./firebase-init.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

(function initDrawer(){
  const drawer   = document.getElementById('drawer');
  const backdrop = document.getElementById('drawerBackdrop');
  const toggle   = document.getElementById('drawerToggle');
  if (!drawer || !backdrop) return;

  function openDrawer(){ document.body.classList.add('drawer-open'); }
  function closeDrawer(){ document.body.classList.remove('drawer-open'); }
  function clickOutside(e){ if(e.target === backdrop) closeDrawer(); }

  toggle && toggle.addEventListener('click', openDrawer);
  backdrop && backdrop.addEventListener('click', clickOutside);
  window.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeDrawer(); });

  const nav = drawer.querySelector('nav');
  if (!nav) return;

  // Resolve access helpers if present
  const canView = (href) => {
    const acc = window.DF_ACCESS;
    if (!acc || !acc.canView) return true;           // before auth loads: show everything
    // Always show groups even if none of the children visible → but we'll filter children
    return acc.canView(href);
  };

  // read drawer data
  const groups = (window.DF_DRAWER_MENUS || []);

  // build accordion
  nav.innerHTML = '';
  groups.forEach(group => {
    const g = document.createElement('div');
    g.className = 'group';
    g.setAttribute('aria-expanded','false');

    const btn = document.createElement('button');
    btn.innerHTML = `<span class="icon">${group.icon||''}</span>${group.label}<span class="chev">›</span>`;
    btn.addEventListener('click', ()=> {
      const expanded = g.getAttribute('aria-expanded') === 'true';
      // collapse others
      nav.querySelectorAll('.group[aria-expanded="true"]').forEach(x=> x.setAttribute('aria-expanded','false'));
      g.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    });
    g.appendChild(btn);

    const panel = document.createElement('div');
    panel.className = 'panel';

    const children = Array.isArray(group.children) ? group.children : [];
    // Filter first level by canView (for links). Subgroups are kept, but their items are filtered too.
    children.forEach(item=>{
      // Nested subgroup
      if(Array.isArray(item.children) && item.children.length){
        const visibleKids = item.children.filter(link => canView(link.href));
        if (!visibleKids.length) return; // hide subgroup if empty

        const sg = document.createElement('div');
        sg.className = 'subgroup';
        sg.setAttribute('aria-expanded','false');

        const sbtn = document.createElement('button');
        sbtn.innerHTML = `<span class="icon">${item.icon||''}</span>${item.label}<span class="chev">›</span>`;
        sbtn.addEventListener('click', ()=>{
          const exp = sg.getAttribute('aria-expanded')==='true';
          // collapse sibling subgroups
          panel.querySelectorAll('.subgroup[aria-expanded="true"]').forEach(x=> x.setAttribute('aria-expanded','false'));
          sg.setAttribute('aria-expanded', exp ? 'false' : 'true');
        });
        sg.appendChild(sbtn);

        const subpanel = document.createElement('div');
        subpanel.className = 'subpanel';
        visibleKids.forEach(link=>{
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
        // Single link
        if (!item.href || !canView(item.href)) return;
        const a = document.createElement('a');
        a.className = 'item';
        a.href = item.href;
        a.innerHTML = `<span class="icon">${item.icon||''}</span>${item.label}`;
        a.addEventListener('click', closeDrawer);
        panel.appendChild(a);
      }
    });

    g.appendChild(panel);
    nav.appendChild(g);
  });

  // ─── Drawer bottom: logout + logo + version ───
  const foot = document.createElement('div');
  foot.className = 'drawerFooter';
  const appVersion = (window.DF_VERSION || '0.0.0');

  foot.innerHTML = `
    <button class="logoutBtn" id="drawerLogout">
      <span class="icon">⎋</span> Logout
    </button>

    <div class="brandBottom">
      <img src="assets/icons/icon-192.png" alt="">
      <div>
        <div style="font-weight:700">Dowson Farms</div>
        <div class="sub" id="drawerOps">All systems operational</div>
      </div>
    </div>

    <div class="appVersion">App v<span id="drawerVersion">${appVersion}</span></div>
  `;
  drawer.appendChild(foot);

  // Logout handler
  const btnLogout = foot.querySelector('#drawerLogout');
  btnLogout?.addEventListener('click', async () => {
    try{
      await signOut(auth);
    }finally{
      location.href = "auth/";
    }
  });
})();