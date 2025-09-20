/* Dowson Farms — core.js
   - Tiny registry (DF.ready.then(reg => reg.get()/set()))
   - Clock (HH:MM)
   - Report date (footer)
   - Version stamp (reads window.APP_VERSION, DF_VERSION, etc.)
   - Breadcrumb helper (+ inject Logout)
   - Default breadcrumbs (Home only on index)
   - Global Back button (scrolls with page, inserted above footer)
*/

(function Core(){
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  /* ---------- Tiny registry ---------- */
  const registry = new Map();
  const ready = Promise.resolve({ set:(k,v)=>registry.set(k,v), get:(k)=>registry.get(k) });
  window.DF = Object.assign(window.DF || {}, { ready });

  /* ---------- Helpers ---------- */
  function two(n){ return n<10 ? '0'+n : ''+n; }
  function isAuthPage(){ return document.body.classList.contains('auth-page'); }
  function isHomePage(){
    const file = (location.pathname.split('/').pop() || '').toLowerCase();
    return file === '' || file === 'index.html';
  }
  function esc(s){
    const map = {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'};
    return String(s || '').replace(/[&<>"]/g, c => map[c]);
  }

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
      let nav = $('.breadcrumbs');
      if(!nav){
        const hdr = $('.app-header');
        nav = document.createElement('nav');
        nav.className = 'breadcrumbs';
        nav.setAttribute('aria-label','Breadcrumb');
        nav.innerHTML = '<ol></ol>';
        (hdr && hdr.parentNode) ? hdr.parentNode.insertBefore(nav, hdr.nextSibling) : document.body.prepend(nav);
      }
      const ol = $('ol', nav) || nav.appendChild(document.createElement('ol'));

      const parts = [];
      trail.forEach((item, idx)=>{
        if (idx>0) parts.push('<li class="sep">›</li>');
        const isLast = idx === trail.length-1;
        const label = esc(item?.label ?? '');
        const href  = !isLast && item?.href ? String(item.href) : null;
        parts.push(href ? `<li><a href="${href}">${label}</a></li>` : `<li><span>${label}</span></li>`);
      });
      ol.innerHTML = parts.join('');

      ensureLogoutButton(nav);
    }catch(e){ console.error('setBreadcrumbs error:', e); }
  };

  function ensureLogoutButton(nav){
    if ($('.breadcrumbs .logout-btn')) return;
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

  /* ---------- Default breadcrumbs ---------- */
  document.addEventListener('DOMContentLoaded', ()=>{
    const hasTrail = !!$('.breadcrumbs ol li');
    if (!hasTrail){
      const title = (document.title || '').replace(/\s*—.*$/,'').trim();
      const h1    = $('.content h1')?.textContent?.trim();
      const page  = h1 || title || 'Page';

      if (isHomePage()){
        // Home = just "Home"
        let nav = $('.breadcrumbs');
        if (!nav) {
          const hdr = $('.app-header');
          nav = document.createElement('nav');
          nav.className = 'breadcrumbs';
          nav.setAttribute('aria-label','Breadcrumb');
          nav.innerHTML = '<ol></ol>';
          (hdr && hdr.parentNode) ? hdr.parentNode.insertBefore(nav, hdr.nextSibling) : document.body.prepend(nav);
        }
        $('ol', nav).innerHTML = '<li><span>Home</span></li>';
        ensureLogoutButton(nav);
      } else {
        const homeHref = location.pathname.includes('/') ? (location.pathname.replace(/\/[^\/]*$/, '/index.html')) : 'index.html';
        window.setBreadcrumbs([{label:'Home', href: homeHref}, {label: page}]);
      }
    } else if (isHomePage()){
      // Normalize any "Dashboard" crumb to "Home"
      const nav = $('.breadcrumbs');
      if (nav) {
        $('ol', nav).innerHTML = '<li><span>Home</span></li>';
        ensureLogoutButton(nav);
      }
    }
  });

  /* ---------- Global Back button (scrolls with page, above footer) ---------- */
  document.addEventListener('DOMContentLoaded', ()=>{
    if (isAuthPage() || isHomePage()) return;
    if ($('.back-fab')) return;

    const a = document.createElement('a');
    a.href = 'javascript:void(0)';
    a.className = 'back-fab'; // style comes from theme.css
    a.innerHTML = '<span class="chev">‹</span> Back';
    a.addEventListener('click', (e)=>{
      e.preventDefault();
      if (history.length > 1) history.back();
      else location.href = (location.pathname.includes('/') ? (location.pathname.replace(/\/[^\/]*$/, '/index.html')) : 'index.html');
    });

    const footer = $('.app-footer');
    footer ? footer.parentNode.insertBefore(a, footer) : document.body.appendChild(a);
  });

})();