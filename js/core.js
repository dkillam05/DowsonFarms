/* =========================================================
   js/core.js
   - Builds sidebar from window.DF_MENUS with two inner groups:
       View & Analyze  ⌄  and  Add Records  ⌄
   - Drawer pushes layout; hamburger toggles open/close
   - Breadcrumbs helper (simple)
   - Header clock + footer date
   - Home panels are rendered from DF_MENUS (all sections)
   - Logout sending to auth/index.html if present, else home
   ========================================================= */
(function(){
  'use strict';

  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const tz = 'America/Chicago';

  /* ---------- clock & date ---------- */
  function startClocks(){
    const clock = $('#df-clock');
    const foot  = $('#df-date-footer');
    function render(){
      const now = new Date();
      if (clock) clock.textContent = now.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true,timeZone:tz});
      if (foot)  foot.textContent  = now.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'2-digit',year:'numeric',timeZone:tz});
    }
    render();
    const n=new Date(), ms=(60-n.getSeconds())*1000-n.getMilliseconds();
    setTimeout(()=>{ render(); setInterval(render, 60000); }, Math.max(0,ms));
  }

  /* ---------- breadcrumbs ---------- */
  function setCrumbs(list){
    const ol = $('#crumbs'); if (!ol) return;
    ol.innerHTML = '';
    (list||[]).forEach((it,i)=>{
      const li = document.createElement('li');
      if (it.href){ const a=document.createElement('a'); a.href=it.href; a.textContent=it.label; li.appendChild(a); }
      else { const s=document.createElement('span'); s.textContent=it.label; li.appendChild(s); }
      ol.appendChild(li);
      if (i<list.length-1){ const sep=document.createElement('li'); sep.className='sep'; sep.textContent='›'; ol.appendChild(sep); }
    });
  }
  window.setCrumbs = setCrumbs;

  /* ---------- helpers ---------- */
  function slug(s){
    return String(s||'').toLowerCase().trim()
      .normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
      .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'') || 'item';
  }
  function ensureHrefFolder(href){
    if (!href) return '#';
    if (href.endsWith('/')) return href;
    if (href.endsWith('index.html')) return href;
    return href; // leave as-is; you already provide .html in DF_MENUS
  }

  /* ---------- drawer build ---------- */
  function buildDrawer(){
    const drawer   = $('#drawer');
    const backdrop = $('#backdrop');
    const ham      = $('#hamburger');
    const nav      = $('#nav');
    if (!drawer || !backdrop || !ham || !nav) return;

    function open(){
      document.body.classList.add('drawer-open');
      drawer.setAttribute('aria-hidden','false');
      ham.setAttribute('aria-expanded','true');
      backdrop.hidden = false;
    }
    function close(){
      document.body.classList.remove('drawer-open');
      drawer.setAttribute('aria-hidden','true');
      ham.setAttribute('aria-expanded','false');
      backdrop.hidden = true;
    }
    function toggle(){ drawerIsOpen() ? close() : open(); }
    function drawerIsOpen(){ return document.body.classList.contains('drawer-open'); }

    ham.addEventListener('click', toggle);
    backdrop.addEventListener('click', close);
    window.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

    const tiles = (window.DF_MENUS && Array.isArray(window.DF_MENUS.tiles)) ? window.DF_MENUS.tiles : [];
    nav.innerHTML = '';

    // Close all other sections when opening a new one (accordion)
    function closeOtherSections(except){
      $$('.section-btn[aria-expanded="true"]', nav).forEach(btn=>{
        if (btn !== except){
          btn.setAttribute('aria-expanded','false');
          const che = btn.querySelector('.chev'); if (che) che.style.transform = 'rotate(0deg)';
          const sec = btn.closest('.section'); if (sec) sec.removeAttribute('aria-expanded');
        }
      });
    }

    // Close other groups inside the same section
    function closeOtherGroups(sectionEl, except){
      $$('.group', sectionEl).forEach(g=>{
        if (g !== except){
          g.removeAttribute('aria-expanded');
          const c = g.querySelector('.chev'); if (c) c.style.transform = 'rotate(0deg)';
        }
      });
    }

    // Build each top-level section
    tiles.forEach(tile=>{
      const section = document.createElement('li');
      section.className = 'section';

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'section-btn';
      btn.setAttribute('aria-expanded','false');
      btn.dataset.key = slug(tile.label);

      const left = document.createElement('div');
      left.className = 'section-left';
      const em = document.createElement('span');
      em.className = 'section-emoji';
      em.textContent = tile.iconEmoji || '📁';
      const lab = document.createElement('span');
      lab.className = 'section-label';
      lab.textContent = tile.label || 'Section';
      left.appendChild(em); left.appendChild(lab);

      const che = document.createElement('span');
      che.className = 'chev'; che.textContent = '▾';

      btn.appendChild(left); btn.appendChild(che);
      section.appendChild(btn);

      const sub = document.createElement('ul');
      sub.className = 'section-sub';

      // --- Group 1: View & Analyze ---
      const g1 = document.createElement('li'); g1.className='group';
      const g1btn = document.createElement('button'); g1btn.type='button'; g1btn.className='group-btn';
      g1btn.innerHTML = `<span class="label">View & Analyze</span><span class="chev">▾</span>`;
      const g1list = document.createElement('ul'); g1list.className='group-list';

      // "Overview" goes to the section href (if it exists)
      if (tile.href){
        const li = document.createElement('li'); li.className='leaf';
        const a = document.createElement('a'); a.href = ensureHrefFolder(tile.href); a.textContent = 'Overview';
        const e = document.createElement('span'); e.className='emoji'; e.textContent='📊';
        li.appendChild(a); li.appendChild(e); g1list.appendChild(li);
      }
      // Global AI Reports (scoped via query if you want later)
      const liAI = document.createElement('li'); liAI.className='leaf';
      const aAI = document.createElement('a'); aAI.href = 'reports/reports-ai.html';
      aAI.textContent = 'AI Reports';
      const eAI = document.createElement('span'); eAI.className='emoji'; eAI.textContent='🤖';
      liAI.appendChild(aAI); liAI.appendChild(eAI); g1list.appendChild(liAI);

      g1.appendChild(g1btn); g1.appendChild(g1list);
      sub.appendChild(g1);

      // --- Group 2: Add Records ---
      const g2 = document.createElement('li'); g2.className='group';
      const g2btn = document.createElement('button'); g2btn.type='button'; g2btn.className='group-btn';
      g2btn.innerHTML = `<span class="label">Add Records</span><span class="chev">▾</span>`;
      const g2list = document.createElement('ul'); g2list.className='group-list';

      const kids = Array.isArray(tile.children) ? tile.children : [];
      kids.forEach(child=>{
        const li = document.createElement('li'); li.className='leaf';
        const a = document.createElement('a'); a.href = ensureHrefFolder(child.href);
        a.textContent = child.label || 'Item';
        const e = document.createElement('span'); e.className='emoji'; e.textContent = child.iconEmoji || '•';
        li.appendChild(a); li.appendChild(e);
        g2list.appendChild(li);
      });

      // Only add Add Records group if it has children
      if (g2list.children.length){
        g2.appendChild(g2btn); g2.appendChild(g2list);
        sub.appendChild(g2);
      }

      section.appendChild(sub);
      nav.appendChild(section);

      // Interactions
      btn.addEventListener('click', ()=>{
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        if (!expanded){
          closeOtherSections(btn);
          btn.setAttribute('aria-expanded','true');
          che.style.transform = 'rotate(180deg)';
          section.setAttribute('aria-expanded','true');
        } else {
          btn.setAttribute('aria-expanded','false');
          che.style.transform = 'rotate(0deg)';
          section.removeAttribute('aria-expanded');
        }
      });

      g1btn.addEventListener('click', ()=>{
        const nowOpen = !g1.hasAttribute('aria-expanded');
        closeOtherGroups(section, g1);
        if (nowOpen){ g1.setAttribute('aria-expanded','true'); g1btn.querySelector('.chev').style.transform='rotate(180deg)'; }
        else { g1.removeAttribute('aria-expanded'); g1btn.querySelector('.chev').style.transform='rotate(0deg)'; }
      });

      g2btn.addEventListener('click', ()=>{
        const nowOpen = !g2.hasAttribute('aria-expanded');
        closeOtherGroups(section, g2);
        if (nowOpen){ g2.setAttribute('aria-expanded','true'); g2btn.querySelector('.chev').style.transform='rotate(180deg)'; }
        else { g2.removeAttribute('aria-expanded'); g2btn.querySelector('.chev').style.transform='rotate(0deg)'; }
      });
    });

    // Start with drawer closed
    close();
  }

  /* ---------- home panels (from DF_MENUS) ---------- */
  function renderHomePanels(){
    const host = $('#home-panels'); if (!host) return;
    const tiles = (window.DF_MENUS && Array.isArray(window.DF_MENUS.tiles)) ? window.DF_MENUS.tiles : [];
    host.innerHTML = '';
    tiles.forEach(t=>{
      const a = document.createElement('a');
      a.className='panel';
      a.href = t.href ? t.href : '#';
      a.innerHTML = `<span class="emoji">${t.iconEmoji || '📁'}</span><span class="label">${t.label || 'Section'}</span>`;
      host.appendChild(a);
    });
  }

  /* ---------- logout ---------- */
  function handleLogout(){
    // keep theme
    let keep=null; try{ keep=localStorage.getItem('df_theme'); }catch(_){}
    try{ localStorage.clear(); sessionStorage.clear(); if(keep!==null) localStorage.setItem('df_theme', keep); }catch(_){}
    const auth = 'auth/index.html';
    fetch(auth, {method:'HEAD'}).then(()=>location.href=auth).catch(()=>location.href='index.html');
  }

  /* ---------- boot ---------- */
  document.addEventListener('DOMContentLoaded', ()=>{
    // wire logout
    const out = $('#logout'); if (out) out.addEventListener('click', handleLogout);

    // crumbs on home
    setCrumbs([{label:'Home'}]);

    // clocks
    startClocks();

    // drawer
    buildDrawer();

    // home cards
    renderHomePanels();
  });
})();