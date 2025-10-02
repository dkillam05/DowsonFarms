// Dowson Farms — Drawer renderer (accordion + bottom branding + logout)
// Reads window.DF_DRAWER_MENUS (assets/data/drawer-menus.js)
// Respects DF_ACCESS.canView when available.
// Shows version from window.DF_VERSION (js/version.js)

import { auth } from "./firebase-init.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

(function initDrawer(){
  const drawer   = document.getElementById('drawer');
  const backdrop = document.getElementById('drawerBackdrop');
  const toggle   = document.getElementById('drawerToggle');
  if (!drawer || !backdrop) return;

  const openDrawer  = () => document.body.classList.add('drawer-open');
  const closeDrawer = () => document.body.classList.remove('drawer-open');

  toggle && toggle.addEventListener('click', openDrawer);
  backdrop && backdrop.addEventListener('click', (e)=>{ if(e.target===backdrop) closeDrawer(); });
  window.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeDrawer(); });

  const nav = drawer.querySelector('nav');
  if (!nav) return;

  // Access helper (optional)
  const canView = (href) => {
    const acc = window.DF_ACCESS;
    if (!acc || !acc.canView) return true;
    return acc.canView(href);
  };

  // Build accordion UI from data
  const groups = (window.DF_DRAWER_MENUS || []);
  nav.innerHTML = '';
  groups.forEach(group => {
    const g = document.createElement('div');
    g.className = 'group';
    g.setAttribute('aria-expanded','false');

    const btn = document.createElement('button');
    btn.innerHTML = `<span class="icon">${group.icon||''}</span>${group.label}<span class="chev">›</span>`;
    btn.addEventListener('click', ()=> {
      const expanded = g.getAttribute('aria-expanded') === 'true';
      nav.querySelectorAll('.group[aria-expanded="true"]').forEach(x=> x.setAttribute('aria-expanded','false'));
      g.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    });
    g.appendChild(btn);

    const panel = document.createElement('div');
    panel.className = 'panel';

    (group.children||[]).forEach(item=>{
      if(Array.isArray(item.children) && item.children.length){
        const kids = item.children.filter(link => canView(link.href));
        if (!kids.length) return;

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
        kids.forEach(link=>{
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

  // ─── Drawer bottom: Logout + brand + version ───
  const foot = document.createElement('div');
  foot.className = 'drawerFooter';
  const appVersion = (window.DF_VERSION || '0.0.0');

  foot.innerHTML = `
    <a href="#" class="item logout" id="drawerLogout">
      <span class="icon">↩️</span> Logout
    </a>

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
  btnLogout?.addEventListener('click', async (e) => {
    e.preventDefault();
    try{
      await signOut(auth);
    }finally{
      location.href = "auth/";
    }
  });
})();