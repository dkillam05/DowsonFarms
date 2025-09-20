/* Dowson Farms — core.js
   - Tiny registry (DF.ready.then(reg => reg.get()/set()))
   - Clock (HH:MM)
   - Report date (footer)
   - Version stamp (reads window.APP_VERSION, DF_VERSION, etc.)
   - Breadcrumb helper (+ inject Logout)
   - Default breadcrumbs (no “Dashboard” on Home)
   - Global Back button (fixed bottom-left) on all non-Home, non-auth pages
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
  // ✅ Rely on a class you control (set only on the true home page)
  function isHomePage(){ return document.body.classList.contains('home-page'); }
  function esc(s){ return String(s||'').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

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
      let ol = $('ol', nav);
      if(!ol){ ol = document.createElement('ol'); nav.appendChild(ol); }

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
        // Optionally: location.href = '../auth/index.html';
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
        // Home should be just “Home”
        window.setBreadcrumbs([{ label:'Home', href:'index.html' }]);
      } else {
        // Non-home: derive a relative link back to the local index
        const homeHref = location.pathname.replace(/\/[^/]*$/, '/index.html');
        window.setBreadcrumbs([{label:'Home', href: homeHref}, {label: page}]);
      }
    } else if (isHomePage()){
      // If someone left an extra crumb on Home, normalize it
      window.setBreadcrumbs([{label:'Home', href:'index.html'}]);
    }
  });

  /* ---------- Global Back button (fixed bottom-left) ---------- */
  document.addEventListener('DOMContentLoaded', ()=>{
    if (isAuthPage() || isHomePage()) return;
    if ($('.back-fab')) return; // don’t duplicate

    const a = document.createElement('a');
    a.href = 'javascript:void(0)';
    a.className = 'back-fab';
    a.innerHTML = '<span class="chev">‹</span> Back';
    a.addEventListener('click', (e)=>{
      e.preventDefault();
      if (history.length > 1) history.back();
      else location.href = location.pathname.replace(/\/[^/]*$/, '/index.html');
    });

    // Instead of:
document.body.appendChild(a);

// Use:
const footer = document.querySelector('.app-footer');
footer ? footer.parentNode.insertBefore(a, footer) : document.body.appendChild(a);
  });

})();