/* Dowson Farms — core.js
   - Tiny registry (DF.ready.then(reg => reg.get()/set()))
   - Clock (HH:MM)
   - Report date (footer)
   - Version stamp (reads window.APP_VERSION, DF_VERSION, etc.)
   - Breadcrumb helper (+ inject Logout)
   - Default breadcrumbs (Home only on index)
   - Global Back button (fixed bottom-left via .back-fab) on all non-Home, non-auth pages
*/

(function Core(){
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  /* ---------- Tiny registry (for sharing state across scripts) ---------- */
  const registry = new Map();
  const ready = Promise.resolve({ set:(k,v)=>registry.set(k,v), get:(k)=>registry.get(k) });
  window.DF = Object.assign(window.DF || {}, { ready });

  /* ---------- Helpers ---------- */
  function two(n){ return n<10 ? '0'+n : ''+n; }
  function isAuthPage(){ return document.body.classList.contains('auth-page'); }
  function isHomePage(){
    // treat repo root index.html as home
    const file = (location.pathname.split('/').pop() || '').toLowerCase();
    return file === '' || file === 'index.html';
  }
  function esc(s){ return String(s||'').replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]); }

  /* ---------- Clock (HH:MM) ---------- */
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

  /* ---------- Report date (footer) ---------- */
  (function setReportDate(){
    const el = $('#report-date'); if(!el) return;
    try{
      const d = new Date();
      el.textContent = d.toLocaleDateString(undefined, {weekday:'short', year:'numeric', month:'short', day:'numeric'});
    }catch(_){ el.textContent = new Date().toDateString(); }
  })();

  /* ---------- Version (from version.js if available) ---------- */
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
  // Usage: window.setBreadcrumbs([{label:'Home', href:'../index.html'}, {label:'Page'}])
  window.setBreadcrumbs = function setBreadcrumbs(trail){
    try{
      if (!Array.isArray(trail) || !trail.length) return;

      // Ensure nav exists
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
    if ($('.breadcrumbs .logout-btn')) return; // already there
    const btn = document.createElement('button');
    btn.className = 'logout-btn';
    btn.type = 'button';
    btn.textContent = 'Logout';
    nav.appendChild(btn);
    btn.addEventListener('click', ()=>{
      try{
        localStorage.removeItem('df_current_user');
        alert('Logged out (frontend only). Wire this to real auth later.');
        // Optionally bounce to login:
        // location.href = (isAuthPage() ? './index.html' : './auth/index.html');
      }catch(e){ console.error(e); }
    });
  }

  /* ---------- Default breadcrumbs (if page didn't provide any) ---------- */
  document.addEventListener('DOMContentLoaded', ()=>{
    const hasTrail = !!$('.breadcrumbs ol li');
    if (!hasTrail){
      const title = (document.title || '').replace(/\s*—.*$/,'').trim();
      const h1    = $('.content h1')?.textContent?.trim();
      const page  = h1 || title || 'Page';

      if (isHomePage()){
        // Home should be just “Home” (no “Dashboard”)
        window.setBreadcrumbs([{ label:'Home', href:'index.html' }]);
      } else {
        // Non-home: Home → Current
        const homeHref = location.pathname.includes('/') ? (location.pathname.replace(/\/[^\/]*$/, '/index.html')) : 'index.html';
        window.setBreadcrumbs([{label:'Home', href: homeHref}, {label: page}]);
      }
    } else if (isHomePage()){
      // If Home has a second crumb like “Dashboard”, normalize to just “Home”
      const nav = $('.breadcrumbs');
      if (nav) window.setBreadcrumbs([{label:'Home', href:'index.html'}]);
    }
  });

  /* ---------- Global Back button (fixed bottom-left) ---------- */
  document.addEventListener('DOMContentLoaded', ()=>{
    if (isAuthPage() || isHomePage()) return;

    // Don’t duplicate if a page hard-coded one
    if ($('.back-fab')) return;

    const a = document.createElement('a');
    a.href = 'javascript:void(0)';
    a.className = 'back-fab';
    a.innerHTML = '<span class="chev">‹</span> Back';
    a.addEventListener('click', (e)=>{
      e.preventDefault();
      // If we have history to go back to, use it; otherwise, go Home
      if (history.length > 1) history.back();
      else location.href = (location.pathname.includes('/') ? (location.pathname.replace(/\/[^\/]*$/, '/index.html')) : 'index.html');
    });

    // Append near the end so it sits visually above content but below modals
    document.body.appendChild(a);
  });

})();