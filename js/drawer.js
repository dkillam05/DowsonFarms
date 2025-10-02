/*
  Drawer renderer (accordion) that:
  - Builds nested groups & subgroups from window.DF_DRAWER_MENUS
  - Respects Firestore role permissions via loadAccess().canView()
  - Always shows everything for Builder (UID bypass lives in access.js)
*/

import { auth } from "./firebase-init.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { loadAccess } from "./access.js";

// Elements
const drawer    = document.getElementById('drawer');
const backdrop  = document.getElementById('drawerBackdrop');
const toggleBtn = document.getElementById('drawerToggle');
const nav       = drawer ? drawer.querySelector('nav') : null;

function openDrawer(){ document.body.classList.add('drawer-open'); }
function closeDrawer(){ document.body.classList.remove('drawer-open'); }
function clickOutside(e){ if(e.target === backdrop) closeDrawer(); }

toggleBtn && toggleBtn.addEventListener('click', openDrawer);
backdrop  && backdrop.addEventListener('click', clickOutside);
window.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') closeDrawer(); });

// Helpers
const hasChildren = (n) => Array.isArray(n?.children) && n.children.length > 0;

// Filter leaf links by access.canView (Builder sees all)
function filterTree(nodes, access, isBuilder){
  const out = [];
  for(const n of (nodes||[])){
    if(hasChildren(n)){
      const kids = filterTree(n.children, access, isBuilder);
      if(kids.length) out.push({ ...n, children: kids });
    }else{
      if(isBuilder) { out.push(n); continue; }
      const href = n.href || "";
      const ok = href ? (access.canView ? access.canView(href) : true) : false;
      if(ok) out.push(n);
    }
  }
  return out;
}

// Build DOM
function buildAccordion(data){
  if(!nav) return;
  nav.innerHTML = "";

  data.forEach(group=>{
    const g = document.createElement('div');
    g.className = 'group';
    g.setAttribute('aria-expanded','false');

    const btn = document.createElement('button');
    btn.innerHTML = `<span class="icon">${group.icon||''}</span>${group.label}<span class="chev">›</span>`;
    btn.addEventListener('click', ()=>{
      const expanded = g.getAttribute('aria-expanded') === 'true';
      // collapse other groups (single-open accordion)
      nav.querySelectorAll('.group[aria-expanded="true"]').forEach(x=> x.setAttribute('aria-expanded','false'));
      g.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    });
    g.appendChild(btn);

    const panel = document.createElement('div');
    panel.className = 'panel';

    (group.children||[]).forEach(item=>{
      if(hasChildren(item)){
        // subgroup
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

        (item.children||[]).forEach(link=>{
          const a = document.createElement('a');
          a.className = 'item';
          a.href = link.href || '#';
          a.innerHTML = `<span class="icon">${link.icon||''}</span>${link.label}`;
          a.addEventListener('click', closeDrawer);
          subpanel.appendChild(a);
        });

        sg.appendChild(subpanel);
        panel.appendChild(sg);
      }else{
        // leaf link
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
}

// Bootstrap after auth so we can apply permissions filtering
onAuthStateChanged(auth, async () => {
  const raw = Array.isArray(window.DF_DRAWER_MENUS) ? window.DF_DRAWER_MENUS : [];
  try{
    const access = await loadAccess();
    const isBuilder = (access.roleKeys||[]).includes("__builder__");
    const filtered = isBuilder ? raw.slice() : filterTree(raw, access, isBuilder);

    // Drop empty groups
    const cleaned = filtered.filter(g => hasChildren(g));
    buildAccordion(cleaned.length ? cleaned : filtered);
  }catch{
    // On any failure, show the raw menu so the drawer still opens
    buildAccordion(raw);
  }
});