<!-- /js/core.js -->
<script>(function Core(){
  const $  = (s, r=document) => r.querySelector(s);

  // Tiny shared registry
  const registry = new Map();
  const ready = Promise.resolve({ set:(k,v)=>registry.set(k,v), get:(k)=>registry.get(k) });
  window.DF = Object.assign(window.DF || {}, { ready });

  // Helpers
  const two = n => (n<10?'0':'')+n;
  const isAuth = () => document.body.classList.contains('auth-page');
  const isHome = () => {
    const file = (location.pathname.split('/').pop()||'').toLowerCase();
    return file === '' || file === 'index.html';
  };

  // Clock
  function drawClock(){
    const el = $('#clock'); if(!el) return;
    const d = new Date();
    el.textContent = `${two(d.getHours())}:${two(d.getMinutes())}`;
  }
  drawClock();
  (function tick(){
    const now = new Date();
    const wait = (60 - now.getSeconds())*1000 - now.getMilliseconds();
    setTimeout(()=>{ drawClock(); setInterval(drawClock, 60_000); }, Math.max(wait, 250));
  })();

  // Footer report date
  (function setReportDate(){
    const el = $('#report-date'); if(!el) return;
    try {
      const d = new Date();
      el.textContent = d.toLocaleDateString(undefined, {weekday:'short', year:'numeric', month:'short', day:'numeric'});
    } catch { el.textContent = new Date().toDateString(); }
  })();

  // Version (reads window.APP_VERSION or DF_VERSION)
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

  // Breadcrumbs
  window.setBreadcrumbs = function setBreadcrumbs(trail){
    try{
      if (!Array.isArray(trail) || !trail.length) return;
      let nav = document.querySelector('.breadcrumbs');
      if (!nav){
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
        const label = String(item?.label ?? '');
        const href  = !isLast && item?.href ? String(item.href) : null;
        parts.push(href ? `<li><a href="${href}">${label}</a></li>` : `<li><span>${label}</span></li>`);
      });
      ol.innerHTML = parts.join('');

      ensureLogoutButton(nav);
    }catch(e){ console.error('setBreadcrumbs error:', e); }
  };

  function ensureLogoutButton(nav){
    if (nav.querySelector('.logout-btn')) return;
    const btn = document.createElement('button');
    btn.className = 'logout-btn';
    btn.type = 'button';
    btn.textContent = 'Logout';
    nav.appendChild(btn);
    btn.addEventListener('click', ()=>{
      try{
        localStorage.removeItem('df_current_user');
        alert('Logged out (frontend only). Wire this to real auth later.');
        // Optionally redirect to login:
        // location.href = './auth/index.html';
      }catch(e){ console.error(e); }
    });
  }

  // Default breadcrumbs (Home is just “Home”)
  document.addEventListener('DOMContentLoaded', ()=>{
    const hasTrail = !!document.querySelector('.breadcrumbs ol li');
    if (!hasTrail){
      if (isHome()){
        window.setBreadcrumbs([{ label:'Home', href:'index.html' }]);
      } else {
        const homeHref = location.pathname.replace(/\/[^\/]*$/, '/index.html');
        const page = (document.querySelector('.content h1')?.textContent || document.title || 'Page').replace(/\s*—.*$/,'').trim();
        window.setBreadcrumbs([{label:'Home', href: homeHref}, {label: page}]);
      }
    } else if (isHome()){
      window.setBreadcrumbs([{ label:'Home', href:'index.html' }]);
    }
  });

  // Global Back button (fixed, bottom-left, above footer)
  document.addEventListener('DOMContentLoaded', ()=>{
    if (isAuth() || isHome()) return;
    if (document.querySelector('.back-fab')) return;

    const a = document.createElement('a');
    a.href = 'javascript:void(0)';
    a.className = 'back-fab';
    a.innerHTML = '<span class="chev">‹</span> Back';
    a.addEventListener('click', (e)=>{
      e.preventDefault();
      if (history.length > 1) history.back();
      else location.href = (location.pathname.replace(/\/[^\/]*$/, '/index.html'));
    });
    document.body.appendChild(a);
  });
})();</script>