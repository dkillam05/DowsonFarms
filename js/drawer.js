// Dowson Farms — Drawer Renderer
import { loadAccess } from "./access.js";

(function(){
  const drawer   = document.getElementById('drawer');
  const backdrop = document.getElementById('drawerBackdrop');
  const toggle   = document.getElementById('drawerToggle');
  const nav      = drawer.querySelector('nav');

  function openDrawer(){ document.body.classList.add('drawer-open'); }
  function closeDrawer(){ document.body.classList.remove('drawer-open'); }
  function clickOutside(e){ if(e.target === backdrop) closeDrawer(); }

  toggle && toggle.addEventListener('click', openDrawer);
  backdrop && backdrop.addEventListener('click', clickOutside);
  window.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeDrawer(); });

  async function buildDrawer(){
    const access = await loadAccess();
    const data = (window.DF_DRAWER_MENUS || []);
    nav.innerHTML = '';

    data.forEach(group => {
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
            if(!access.canView || access.canView(link.href)){
              const a = document.createElement('a');
              a.className = 'item';
              a.href = link.href || '#';
              a.innerHTML = `<span class="icon">${link.icon||''}</span>${link.label}`;
              a.addEventListener('click', closeDrawer);
              subpanel.appendChild(a);
            }
          });
          sg.appendChild(subpanel);
          panel.appendChild(sg);
        } else {
          if(!access.canView || access.canView(item.href)){
            const a = document.createElement('a');
            a.className = 'item';
            a.href = item.href || '#';
            a.innerHTML = `<span class="icon">${item.icon||''}</span>${item.label}`;
            a.addEventListener('click', closeDrawer);
            panel.appendChild(a);
          }
        }
      });

      g.appendChild(panel);
      nav.appendChild(g);
    });
  }

  document.addEventListener("DOMContentLoaded", buildDrawer);
})();