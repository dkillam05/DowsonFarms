<!-- /js/core.js -->
<script>
/* Dowson Farms — core.js
   - Clock (HH:MM)
   - Report date footer
   - Version stamp (from version.js if present)
   - Breadcrumb helper + Logout button injection
   - Back button on non-home pages (scrolls with page)
   - Tiny app registry: DF.ready.then(reg => reg.get()/set()); DF.go(href)
*/
(function Core(){
  const $ = (s, r=document) => r.querySelector(s);

  /* ---------- Tiny registry so other scripts can share state ---------- */
  const registry = new Map();
  function regSet(k,v){ registry.set(k,v); }
  function regGet(k){ return registry.get(k); }
  function go(href){ location.href = href; }
  const ready = Promise.resolve({ set: regSet, get: regGet });
  window.DF = Object.assign(window.DF || {}, { ready, go });

  /* ---------- Clock (HH:MM, local time) ---------- */
  function two(n){ return n<10 ? '0'+n : ''+n; }
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
      (typeof window.DF_VERSION === 'string' && window.DF_VERSION) ||
      (typeof window.VERSION === 'string' && window.VERSION) ||
      (window.DF_VERSION && typeof window.DF_VERSION === 'object'
        ? `v${window.DF_VERSION.major||0}.${window.DF_VERSION.minor||0}.${window.DF_VERSION.patch||0}`
        : null);
    el.textContent = v || el.textContent || 'v0.0.0';
  })();

  /* ---------- Breadcrumbs helper ---------- */
  // Usage: window.setBreadcrumbs([{label:'Home', href:'/'}, {label:'Settings'}, ...])
  window.setBreadcrumbs = function setBreadcrumbs(trail){
    try{
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

      let items = Array.isArray(trail) ? trail.slice() : [];
      if (!items.length) return;

      /* --- SPECIAL: Home page should NOT show “Dashboard” --- */
      if (document.body.classList.contains('home-page')) {
        // Accept either ["Home", "Dashboard"] or anything that ends in "Dashboard"
        items = [{ label: 'Home' }]; // current page only
      }

      const parts = [];
      items.forEach((item, idx)=>{
        if (idx>0) parts.push('<li class="sep">›</li>');
        const isLast = idx === items.length-1;
        const label = (item && item.label) ? String(item.label) : '';
        const href  = (!isLast && item && item.href) ? String(item.href) : null;
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
      try {
        localStorage.removeItem('df_current_user');
        alert('Logged out (frontend only). Wire this to real auth later.');
      } catch(e) { console.error(e); }
    });
  }

  /* ---------- Back button (scrolls with page, not fixed) ---------- */
  function renderBackButton(){
    // Never show on home; only show when there’s somewhere to go
    if (document.body.classList.contains('home-page')) return;

    const content = $('.content'); if (!content) return;
    if (content.querySelector('.back-btn')) return;

    const btn = document.createElement('a');
    btn.href = 'javascript:void(0)';
    btn.className = 'back-btn';
    btn.innerHTML = '<span class="chev">‹</span> Back';

    // Insert at the very top of the content area
    content.insertBefore(btn, content.firstChild);

    btn.addEventListener('click', (e)=>{
      e.preventDefault();
      // Prefer real back if we have history and came from same origin
      const ref = document.referrer;
      const sameOrigin = ref && ref.startsWith(location.origin);
      if (sameOrigin && history.length > 1) {
        history.back();
      } else {
        // Fallback to home
        if (window.DF && window.DF.go) window.DF.go(relativeHrefFromRoot('index.html'));
        else location.href = 'index.html';
      }
    });
  }

  /* ---------- Apply defaults on DOM ready ---------- */
  document.addEventListener('DOMContentLoaded', ()=>{
    // If page didn’t provide crumbs, create a simple one.
    const hasStatic = !!document.querySelector('.breadcrumbs ol li');
    if (!hasStatic) {
      const title = (document.title || '').replace(/\s*—.*$/,'').trim();
      const h1 = document.querySelector('.content h1')?.textContent?.trim();
      const page = h1 || title || 'Page';
      const trail = document.body.classList.contains('home-page')
        ? [{label:'Home'}]
        : [{label:'Home', href: relativeHrefFromRoot('index.html')}, {label: page}];
      window.setBreadcrumbs(trail);
    } else if (document.body.classList.contains('home-page')) {
      // If Home had static crumbs, normalize them to just “Home”
      window.setBreadcrumbs([{label:'Home'}]);
    } else {
      const nav = document.querySelector('.breadcrumbs');
      if (nav) ensureLogoutButton(nav);
    }

    // Back button on non-home pages
    renderBackButton();
  });

  /* ---------- Utility ---------- */
  function relativeHrefFromRoot(file){ return file; }
})();
</script>