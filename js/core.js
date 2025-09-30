/* js/core.js
   Drawer tree (top-level click expands, not navigate)
   + Breadcrumbs
   + Clock & footer date
   + Simple logout
*/
(function(){
  'use strict';

  const tz = 'America/Chicago';
  const $  = (s, r=document) => r.querySelector(s);

  function repoRoot(){
    const base = document.querySelector('base')?.href;
    if (base) { try { return new URL(base).pathname; } catch(_){} }
    const seg = location.pathname.split('/').filter(Boolean);
    return seg.length ? `/${seg[0]}/` : '/';
  }
  function ensureFolderHref(href){ return href && (href.endsWith('/') || href.endsWith('.html')) ? href : (href + '/'); }

  /* ---------- clocks ---------- */
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

  /* ---------- breadcrumbs (optional: set on section pages) ---------- */
  function setCrumbs(list){
    const ol = $('#crumbs');
    if (!ol) return;
    ol.innerHTML = '';
    list.forEach((it, i) => {
      const li = document.createElement('li');
      if (it.href) {
        const a = document.createElement('a'); a.href = it.href; a.textContent = it.label; li.appendChild(a);
      } else {
        const s = document.createElement('span'); s.textContent = it.label; li.appendChild(s);
      }
      ol.appendChild(li);
      if (i < list.length-1){ const sep = document.createElement('li'); sep.className='sep'; sep.textContent='›'; ol.appendChild(sep); }
    });
  }
  // expose for section pages if needed
  window.setCrumbs = setCrumbs;

  /* ---------- drawer / tree ---------- */
  function buildDrawer(){
    const drawer   = $('#drawer');
    const backdrop = $('#backdrop');
    const ham      = $('#hamburger');
    const nav      = $('#nav');
    if (!drawer || !backdrop || !ham || !nav) return;

    function open(){ drawer.classList.add('open'); backdrop.classList.add('show'); document.body.style.overflow='hidden'; }
    function close(){ drawer.classList.remove('open'); backdrop.classList.remove('show'); document.body.style.overflow=''; }
    function toggle(){ drawer.classList.contains('open') ? close() : open(); }

    ham.addEventListener('click', toggle);
    backdrop.addEventListener('click', close);
    window.addEventListener('keydown', e=>{ if (e.key === 'Escape') close(); });

    const tiles = (window.DF_MENUS && Array.isArray(window.DF_MENUS.tiles)) ? window.DF_MENUS.tiles : [];
    nav.innerHTML = '';

    // Make one-at-a-time accordion
    function closeOthers(except){
      nav.querySelectorAll('.section-btn[aria-expanded="true"]').forEach(b=>{
        if (b !== except){
          b.setAttribute('aria-expanded','false');
          b.querySelector('.chev')?.style.setProperty('transform','rotate(0deg)');
          const sub = b.parentElement.querySelector('.sub');
          if (sub) sub.style.display = 'none';
        }
      });
    }

    tiles.forEach(sec=>{
      const li = document.createElement('li');

      const btn = document.createElement('button');
      btn.className = 'section-btn';
      btn.type = 'button';
      btn.setAttribute('aria-expanded','false');
      btn.innerHTML = `
        <span class="section-ico">${sec.iconEmoji || '📁'}</span>
        <span class="section-title">${sec.label || ''}</span>
        <span class="chev" aria-hidden="true" style="transition:transform .15s ease;">›</span>
      `;

      const sub = document.createElement('div');
      sub.className = 'sub';
      sub.style.display = 'none';

      const secPath = ensureFolderHref(sec.href || '#');

      // Inject "View & Analyze" and "Add Records" first
      const view = document.createElement('a');
      view.href = secPath; view.textContent = '📊 View & Analyze';
      sub.appendChild(view);

      const add = document.createElement('a');
      add.href = secPath.replace(/\/?$/, '/') + 'add.html';
      add.textContent = '➕ Add Records';
      sub.appendChild(add);

      // Then your children
      (sec.children || []).forEach(ch=>{
        const a = document.createElement('a');
        a.href = ch.href || '#';
        a.textContent = `${ch.iconEmoji || ''} ${ch.label || ''}`.trim();
        sub.appendChild(a);
      });

      // Clicking the section HEADER toggles the submenu (NO NAV)
      btn.addEventListener('click', ()=>{
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        if (expanded){
          btn.setAttribute('aria-expanded','false');
          btn.querySelector('.chev').style.transform = 'rotate(0deg)';
          sub.style.display = 'none';
        } else {
          closeOthers(btn);
          btn.setAttribute('aria-expanded','true');
          btn.querySelector('.chev').style.transform = 'rotate(90deg)';
          sub.style.display = 'block';
          // optional: scroll into view when opened on small screens
          setTimeout(()=> btn.scrollIntoView({block:'nearest'}), 0);
        }
      });

      li.appendChild(btn);
      li.appendChild(sub);
      nav.appendChild(li);
    });

    // Close drawer when a submenu link is clicked (navigation)
    nav.addEventListener('click', (e)=>{
      if (e.target.tagName === 'A') close();
    });
  }

  /* ---------- logout ---------- */
  function wireLogout(){
    const btn = document.getElementById('logout');
    if (!btn) return;
    btn.addEventListener('click', (e)=>{
      e.preventDefault();
      const auth = repoRoot() + 'auth/';
      try { window.DF_FB_API?.signOut?.().finally(()=> location.href = auth); }
      catch(_) { location.href = auth; }
    });
  }

  /* ---------- boot ---------- */
  document.addEventListener('DOMContentLoaded', ()=>{
    // Default crumbs on pages that don't set them
    if ($('#crumbs') && !$('#crumbs').children.length) setCrumbs([{label:'Home'}]);

    startClocks();
    buildDrawer();
    wireLogout();
  });
})();