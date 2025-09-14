/* Dowson Farms — core.js (root)
   - Footer: version (#version) + pretty date (#df-date)
   - Header: live clock in .head-actions (#clock)
   - Breadcrumbs: render into #breadcrumbs (Home → Section)
   - Theme helpers: DF.setTheme('auto'|'light'|'dark') with localStorage
   - Idempotent; safe to include on every page
*/
(function DF_CORE(){
  'use strict';
  if (window.__DF_CORE__) return; window.__DF_CORE__ = true;

  // ---------- tiny helpers ----------
  const $  = (s, r=document)=>r.querySelector(s);
  const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));
  const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  // Namespace
  const DF = window.DF = window.DF || {};
  DF.version = (typeof window.DF_VERSION === 'string' && window.DF_VERSION.trim()) ? window.DF_VERSION.trim() : 'v0.0.0';

  // ---------- formatters ----------
  function ordinal(n){ const s=['th','st','nd','rd'], v=n%100; return n+(s[(v-20)%10]||s[v]||s[0]); }
  function prettyDate(d=new Date()){
    const m = d.toLocaleString(undefined,{month:'long'}); return `${m} ${ordinal(d.getDate())}, ${d.getFullYear()}`;
  }
  function prettyTime(d=new Date()){ return d.toLocaleTimeString(undefined,{hour:'numeric', minute:'2-digit'}); }
  DF.format = { prettyDate, prettyTime };

  // ---------- footer: version + pretty date ----------
  function paintFooter(){
    const foot = $('#footer'); if (!foot) return;
    const inner = foot.querySelector('.foot-inner') || foot;

    // version
    let ver = $('#version');
    if (!ver){ ver = document.createElement('span'); ver.id='version'; inner.appendChild(ver); }
    ver.textContent = DF.version;

    // date
    if (!$('#df-date')){
      const dot = document.createElement('span'); dot.className='dot'; dot.setAttribute('aria-hidden','true'); dot.textContent='•';
      const dateEl = document.createElement('span'); dateEl.id='df-date';
      // insert before version if possible
      if (ver.parentElement === inner){ inner.insertBefore(dot, ver); inner.insertBefore(dateEl, ver); }
      else { inner.appendChild(dot); inner.appendChild(dateEl); }
    }
    const ds = $('#df-date'); if (ds) ds.textContent = prettyDate();
  }

  // ---------- header clock ----------
  let clockTimer = null;
  function wireClock(){
    const header = $('#header'); if (!header) return;
    const actions = header.querySelector('.head-actions') || header;
    let clock = $('#clock');
    if (!clock){
      if (actions.children.length){
        const sep = document.createElement('span'); sep.className='dot'; sep.setAttribute('aria-hidden','true'); sep.textContent='•';
        actions.appendChild(sep);
      }
      clock = document.createElement('span'); clock.id='clock'; actions.appendChild(clock);
    }
    const tick = ()=>{ clock.textContent = prettyTime(); };
    tick();
    if (clockTimer) clearInterval(clockTimer);
    clockTimer = setInterval(tick, 15000);
  }

  // ---------- breadcrumbs ----------
  const LABELS = {
    'index.html'   : 'Home',
    'calc.html'    : 'Calculators',
    'reports.html' : 'Reports',
    'team.html'    : 'Team / Partners',
    'feedback.html': 'Feedback',
    'settings.html': 'Setups / Settings',
    'crop.html'    : 'Crop Production',
    'grain.html'   : 'Grain Tracking',
    'login.html'   : 'Login'
  };
  function filenameFromURL(){
    try {
      const p = window.location.pathname;
      const file = p.split('/').filter(Boolean).pop() || 'index.html';
      return file.includes('.') ? file : 'index.html';
    } catch { return 'index.html'; }
  }
  function paintCrumbs(){
    const nav = $('#breadcrumbs'); if (!nav) return;
    const file = filenameFromURL();
    const current = LABELS[file] || 'Page';
    const homeHref = (file==='index.html') ? '#' : 'index.html';

    // build
    const wrap = document.createElement('div'); wrap.className='inner';
    const aHome = document.createElement('a'); aHome.href = homeHref; aHome.className='bc-link'; aHome.textContent='Home';
    const sep = document.createElement('span'); sep.className='bc-sep'; sep.textContent='›';
    const here = document.createElement('span'); here.className='bc-current'; here.textContent=current;

    // avoid double-render
    nav.innerHTML = '';
    wrap.appendChild(aHome);
    if (file !== 'index.html'){ wrap.appendChild(sep); wrap.appendChild(here); }
    nav.appendChild(wrap);

    // make it sticky under header (safe for our layout)
    nav.style.position = 'sticky';
    nav.style.top = '44px'; // matches our compact header
    nav.style.zIndex = '8';
  }

  // ---------- theme helpers ----------
  DF.setTheme = function(mode){ // 'auto' | 'light' | 'dark'
    try { localStorage.setItem('df.theme', mode); } catch {}
    applyTheme();
  };
  function applyTheme(){
    let mode = 'auto';
    try { mode = localStorage.getItem('df.theme') || 'auto'; } catch {}
    document.body.removeAttribute('data-theme');
    if (mode === 'light') document.body.setAttribute('data-theme','light');
    else if (mode === 'dark') document.body.setAttribute('data-theme','dark');
    // 'auto' = no data-theme (CSS uses prefers-color-scheme)
  }
  DF.getTheme = ()=>{ try { return localStorage.getItem('df.theme') || 'auto'; } catch { return 'auto'; } };

  // ---------- boot ----------
  function init(){
    applyTheme();
    paintFooter();
    wireClock();
    paintCrumbs();
  }
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init, { once:true });
  } else { init(); }

  // keep date/clock fresh and repaint crumbs on navigation
  setInterval(()=>{ const ds=$('#df-date'); if (ds) ds.textContent = prettyDate(); }, 60*1000);
})();
