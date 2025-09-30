/* js/core.js
   - Sidebar: Section -> (View & Analyze ⌄ | Add Records ⌄) -> concrete links
   - Accordion: one section open at a time; inside, one L2 group open at a time
   - Hamburger in breadcrumbs toggles drawer; backdrop + Esc + re-tap close
   - Header clock + footer date
   - Breadcrumb helper
   - Dynamic home panels from window.DF_MENUS (so ALL sections show)
   - Simple logout redirect
*/
(function(){
  'use strict';

  const tz = 'America/Chicago';
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  function ensureFolderHref(href){
    if (!href) return '#';
    try {
      if (href.endsWith('/')) return href;
      if (href.endsWith('index.html')) return href.slice(0, -'index.html'.length);
      return href.replace(/(\.html)?$/, '/');
    } catch(_) { return href; }
  }

  function slugify(label){
    return String(label||'')
      .toLowerCase()
      .normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
      .replace(/[^a-z0-9]+/g,'-')
      .replace(/^-+|-+$/g,'') || 'item';
  }

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

  /* ---------- breadcrumbs helper ---------- */
  function setCrumbs(list){
    const ol = $('#crumbs');
    if (!ol) return;
    ol.innerHTML = '';
    (list||[]).forEach((it, i) => {
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
  window.setCrumbs = setCrumbs;

  /* ---------- drawer / tree ---------- */
  function buildDrawer(){
    const drawer   = $('#drawer');
    const backdrop = $('#backdrop');
    const ham      = $('#hamburger');
    const nav      = $('#nav');
    if (!drawer || !backdrop || !ham || !nav) return;

    function open(){
      drawer.classList.add('open');
      backdrop.hidden = false;
      document.body.classList.add('drawer-open');
      ham.setAttribute('aria-expanded','true');
    }
    function close(){
      drawer.classList.remove('open');
      backdrop.hidden = true;
      document.body.classList.remove('drawer-open');
      ham.setAttribute('aria-expanded','false');
    }
    function toggle(){
      if (drawer.classList.contains('open')) close(); else open();
    }

    ham.addEventListener('click', toggle);
    backdrop.addEventListener('click', close);
    window.addEventListener('keydown', e=>{ if (e.key === 'Escape') close(); });

    const tiles = (window.DF_MENUS && Array.isArray(window.DF_MENUS.tiles)) ? window.DF_MENUS.tiles : [];
    nav.innerHTML = '';

    // Close any other open section except the one passed
    function closeOtherSections(exceptBtn){