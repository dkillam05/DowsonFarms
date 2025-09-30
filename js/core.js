/* js/core.js (clean)
   - Drawer + tree from DF_MENUS (adds "View & Analyze" + "Add Records")
   - Breadcrumbs
   - Clock + footer date
   - Logout (no fancy fallbacks)
*/
(function(){
  'use strict';

  /* ---------- helpers ---------- */
  const tz = 'America/Chicago';
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));

  function repoRoot(){
    const base = document.querySelector('base')?.href;
    if (base) try { return new URL(base).pathname; } catch(_){}
    const seg = location.pathname.split('/').filter(Boolean);
    if (seg.length) return '/' + seg[0] + '/';
    return '/';
  }
  function homeURL(){ return repoRoot() + 'index.html'; }
  function ensureFolderHref(href){ return href.endsWith('/') || href.endsWith('.html') ? href : (href + '/'); }

  /* ---------- header time + footer date ---------- */
  function startClocks(){
    const clock = $('#df-clock');
    const foot = $('#df-date-footer');
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

  /* ---------- drawer / tree ---------- */
  function buildDrawer(){
    const drawer   = $('#drawer');
    const backdrop = $('#backdrop');
    const ham      = $('#hamburger');
    if (!drawer || !backdrop || !ham) return;

    function open(){ drawer.classList.add('open'); backdrop.classList.add('show'); document.body.style.overflow='hidden'; }
    function close(){ drawer.classList.remove('open'); backdrop.classList.remove('show'); document.body.style.overflow=''; }
    function toggle(){ drawer.classList.contains('open') ? close() : open(); }
    ham.addEventListener('click', toggle);
    backdrop.addEventListener('click', close);

    // Close with Esc
    window.addEventListener('keydown', e=>{ if (e.key === 'Escape') close(); });

    // Build tree
    const nav = $('#nav'); if (!nav) return;
    const tiles = (window.DF_MENUS && Array.isArray(window.DF_MENUS.tiles)) ? window.DF_MENUS.tiles : [];
    nav.innerHTML = '';

    tiles.forEach(sec=>{
      const li = document.createElement('li');

      const btn = document.createElement('button');
      btn.className = 'section-btn';
      btn.setAttribute('aria-expanded','false');
      btn.innerHTML = `
        <span class="section-ico">${sec.iconEmoji || '📁'}</span>
        <span>${sec.label || ''}</span>
        <span class="chev">›</span>
      `;

      const sub = document.createElement('div'); sub.className = 'sub';

      // 1) View & Analyze (top)
      const secPath = ensureFolderHref(sec.href || '#');
      const view = document.createElement('a');
      view.href = secPath;  // points to folder index (section landing)
      view.textContent = '📊 View & Analyze';
      sub.appendChild(view);

      // 2) Add Records (second)
      const add = document.createElement('a');
      // conventional add page location (you can create these per section)
      add.href = secPath.replace(/\/?$/, '/') + 'add.html';
      add.textContent = '➕ Add Records';
      sub.appendChild(add);

      // 3) Existing children from DF_MENUS
      (sec.children || []).forEach(ch=>{
        const a = document.createElement('a');
        a.href = ch.href || '#';
        a.textContent = `${ch.iconEmoji || ''} ${ch.label || ''}`.trim();
        sub.appendChild(a);
      });

      // Expand/collapse (chevron area only expands; label click follows sec.href)
      btn.addEventListener('click', (e)=>{
        const onChevron = e.target.classList.contains('chev');
        if (onChevron) {
          const opened = sub.classList.toggle('open');
          btn.setAttribute('aria-expanded', opened ? 'true' : 'false');
          return;
        }
        // Navigate to section landing
        if (sec.href) location.href = secPath;
      });

      li.appendChild(btn);
      li.appendChild(sub);
      nav.appendChild(li);
    });

    // close drawer when navigating
    nav.addEventListener('click', e=>{
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
      // If you have Firebase signOut wired globally, call it; else simple redirect.
      try { window.DF_FB_API?.signOut?.().finally(()=> location.href = auth); }
      catch(_) { location.href = auth; }
    });
  }

  /* ---------- init ---------- */
  document.addEventListener('DOMContentLoaded', ()=>{
    // Home breadcrumbs by default
    setCrumbs([{label:'Home'}]);

    startClocks();
    buildDrawer();
    wireLogout();
  });

})();