/* Dowson Farms — core.js
   - Registry (DF.ready.then(reg => reg.get()/set()))
   - Clock + Report date + Version label
   - Breadcrumb helper (+ Logout injection)
   - Home breadcrumb normalized to just “Home”
   - Global Back button (fixed bottom-left above footer)
   - Service Worker registration with auto path to /js/serviceworker.js
*/

(function Core(){
  const $  = (s, r=document) => r.querySelector(s);

  /* ---------- Tiny registry ---------- */
  const registry = new Map();
  const ready = Promise.resolve({ set:(k,v)=>registry.set(k,v), get:(k)=>registry.get(k) });
  window.DF = Object.assign(window.DF || {}, { ready });

  /* ---------- Helpers ---------- */
  function two(n){ return n<10 ? '0'+n : ''+n; }
  function isAuthPage(){ return document.body.classList.contains('auth-page'); }
  function isHomePage(){
    const f = (location.pathname.split('/').pop() || '').toLowerCase();
    return f === '' || f === 'index.html';
  }
  function esc(s){ return String(s||'').replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]); }

  /* ---------- Clock ---------- */
  function drawClock(){
    const el = $('#clock'); if(!el) return;
    const d = new Date();
    el.textContent = `${two(d.getHours())}:${two(d.getMinutes())}`;
  }
  drawClock();
  (function scheduleClock(){
    const now = new Date();
    const msToNextMin = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    setTimeout(()=>{ drawClock(); setInterval(drawClock, 60_000); }, Math.max(250, msToNextMin));
  })();

  /* ---------- Report date ---------- */
  (function setReportDate(){
    const el = $('#report-date'); if(!el) return;
    try{
      const d = new Date();
      el.textContent = d.toLocaleDateString(undefined, {weekday:'short', year:'numeric', month:'short', day:'numeric'});
    }catch(_){ el.textContent = new Date().toDateString(); }
  })();

  /* ---------- Version ---------- */
  (function setVersion(){
    const el = $('#version'); if(!el) return;
    const v =
      (typeof window.APP_VERSION === 'string' && window.APP_VERSION) ||
      (typeof window.DF_VERSION  === 'string' && window.DF_VERSION)  ||
      (typeof window.VERSION     === 'string' && window.VERSION)     ||
      (window.DF_VERSION && typeof window.DF_VERSION === 'object'
        ? `v${window.DF_VERSION.major||0}.${window.DF_VERSION.minor||0}.${window.DF_VERSION.patch||0}`
        : null);
    el.textContent = v || el.textContent || 'v0.0.0';
  })();

  /* ---------- Breadcrumbs helper ---------- */
  window.setBreadcrumbs = function setBreadcrumbs(trail){
    try{
      if (!Array.isArray(trail) || !trail.length) return;
      let nav = document.querySelector('.breadcrumbs');
      if(!nav){
        const hdr = document.querySelector('.app-header');
        nav = document.createElement('nav');
        nav.className = 'breadcrumbs';
        nav.setAttribute('aria-label','Breadcrumb');
        nav.innerHTML = '<ol></ol>';
        (hdr && hdr.parentNode) ? hdr.parentNode.insertBefore(nav, hdr.nextSibling) : document.body.prepend(nav);
      }
      const ol = nav.querySelector('ol') || nav.appendChild(document.createElement('ol'));

      const parts = [];
      trail.forEach((item, idx)=>{
        if (idx>0) parts.push('<li class="sep">›</li>');
        const isLast = idx === trail.length-1;
        const label = esc(item?.label ?? '');
        const href  = !isLast && item?.href ? String(item.href) : null;
        parts.push(href ? `<li><a href="${href}">${label}</a></li>` : `<li><span>${label}</span></li>`);
      });
      ol.innerHTML = parts.join('');

      // inject Logout button once
      if (!nav.querySelector('.logout-btn')) {
        const btn = document.createElement('button');
        btn.className = 'logout-btn';
        btn.type = 'button';
        btn.textContent = 'Logout';
        nav.appendChild(btn);
        btn.addEventListener('click', ()=>{
          try{
            localStorage.removeItem('df_current_user');
            alert('Logged out (frontend only). Wire this to real auth later.');
          }catch(e){ console.error(e); }
        });
      }
    }catch(e){ console.error('setBreadcrumbs error:', e); }
  };

  /* ---------- Default breadcrumbs ---------- */
  document.addEventListener('DOMContentLoaded', ()=>{
    const hasTrail = !!document.querySelector('.breadcrumbs ol li');
    if (!hasTrail){
      const title = (document.title || '').replace(/\s*—.*$/,'').trim();
      const h1    = document.querySelector('.content h1')?.textContent?.trim();
      const page  = h1 || title || 'Page';
      if (isHomePage()){
        window.setBreadcrumbs([{ label:'Home', href:'index.html' }]);
      } else {
        // compute a Home link that goes to repo root index.html from any depth
        const path = location.pathname.replace(/\/+$/, '');
        const segs = path.split('/').filter(Boolean);
        const depth = Math.max(0, segs.length - 1);
        const up = depth > 0 ? '../'.repeat(depth) : '';
        window.setBreadcrumbs([{label:'Home', href: up + 'index.html'}, {label: page}]);
      }
    } else if (isHomePage()){
      window.setBreadcrumbs([{label:'Home', href:'index.html'}]);
    }
  });

  /* ---------- Global Back button (fixed above footer) ---------- */
  document.addEventListener('DOMContentLoaded', ()=>{
    if (isAuthPage() || isHomePage()) return;
    if (document.querySelector('.back-fab')) return;

    // Minimal CSS (doesn’t rely on theme.css order)
    const style = document.createElement('style');
    style.textContent = `
      :root { --footer-h: var(--footer-h, 40px); }
      .back-fab{
        position: fixed;
        left: 10px;
        bottom: calc(env(safe-area-inset-bottom, 0px) + var(--footer-h) + 8px);
        display: inline-flex; align-items: center; gap: 6px;
        padding: 6px 10px;
        background: var(--tile-bg, #fff);
        color: var(--brand-green, #1B5E20);
        border: 2px solid var(--brand-green, #1B5E20);
        border-radius: 12px;
        font: 600 .9rem 'Playfair Display', serif;
        box-shadow: 0 6px 16px rgba(0,0,0,.12);
        cursor: pointer; z-index: 999;
        text-decoration: none;
      }
      .back-fab .chev{ font-size: 1.1rem; line-height: 1; transform: translateY(-1px); }
      .back-fab:hover, .back-fab:focus-visible{ background:#fefefe; outline: none; }
      .modal-open .back-fab { display: none !important; } /* your earlier modal rule */
    `;
    document.head.appendChild(style);

    const a = document.createElement('a');
    a.href = 'javascript:void(0)';
    a.className = 'back-fab';
    a.innerHTML = '<span class="chev">‹</span> Back';
    a.addEventListener('click', (e)=>{
      e.preventDefault();
      if (history.length > 1) history.back();
      else {
        const path = location.pathname.replace(/\/+$/, '');
        const segs = path.split('/').filter(Boolean);
        const depth = Math.max(0, segs.length - 1);
        const up = depth > 0 ? '../'.repeat(depth) : '';
        location.href = up + 'index.html';
      }
    });

    document.body.appendChild(a);
  });

  /* ---------- Service Worker registration ----------
     You said your SW file lives in /js/serviceworker.js (not root).
     This computes a RELATIVE path from the current page to that file.
  -------------------------------------------------- */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const path = location.pathname.replace(/\/+$/, '');
      const segs = path.split('/').filter(Boolean);
      const depth = Math.max(0, segs.length - 1);
      const up = depth > 0 ? '../'.repeat(depth) : '';
      const swUrl = up + 'js/serviceworker.js';
      navigator.serviceWorker.register(swUrl).catch(console.error);
    });
  }

})();