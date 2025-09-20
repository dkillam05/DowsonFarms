/* Dowson Farms — core.js
   - Clock (HH:MM)
   - Footer report date + version
   - Breadcrumb helper + Logout injection
   - Repo-aware navigation helpers (DF.root()/DF.go())
   - Auth guard: redirect to /auth/index.html when not logged in
*/

(function Core(){
  const $ = (s, r=document) => r.querySelector(s);

  /* ---------- Tiny shared registry ---------- */
  const registry = new Map();
  function regSet(k,v){ registry.set(k,v); }
  function regGet(k){ return registry.get(k); }
  const ready = Promise.resolve({ set: regSet, get: regGet });

  /* ---------- Repo-aware navigation helpers ---------- */
  function repoBase() {
    // Works on GitHub Pages: /<repo>/...  (and also locally)
    const parts = location.pathname.split('/').filter(Boolean);
    // when served as /<repo>/... take first segment; otherwise empty
    const first = parts.length ? `/${parts[0]}/` : '/';
    return first;
  }
  function root(href) { return repoBase() + href.replace(/^\//,''); }
  function go(href)   { location.href = root(href); }

  // expose small API
  window.DF = Object.assign(window.DF || {}, {
    ready, root, go
  });

  /* ---------- Auth helpers ---------- */
  const AUTH_PATH_PREFIX = '/auth/';  // folder that contains login
  function isAuthPage(){ return location.pathname.includes(AUTH_PATH_PREFIX); }
  function isLoggedIn(){ return !!localStorage.getItem('df_current_user'); }
  function requireAuth(){
    if (isAuthPage()) return;               // never guard the auth pages
    if (!isLoggedIn()) location.replace(root('auth/index.html'));
  }
  // Run guard ASAP
  requireAuth();

  /* ---------- Clock ---------- */
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

  /* ---------- Footer date ---------- */
  (function setReportDate(){
    const el = $('#report-date'); if(!el) return;
    try{
      const d = new Date();
      el.textContent = d.toLocaleDateString(undefined, {weekday:'short', year:'numeric', month:'short', day:'numeric'});
    }catch(_){ el.textContent = new Date().toDateString(); }
  })();

  /* ---------- Version (from version.js) ---------- */
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
  // Usage: window.setBreadcrumbs([{label:'Home', href:'index.html'}, {label:'Settings'}, ...])
  window.setBreadcrumbs = function setBreadcrumbs(trail){
    if (document.body.classList.contains('auth-page')) return; // no crumbs on auth
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
      let ol = $('ol', nav) || nav.appendChild(document.createElement('ol'));

      const items = Array.isArray(trail) ? trail.slice() : [];
      if (!items.length) return;

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
    if (document.body.classList.contains('auth-page')) return; // none on auth
    if ($('.breadcrumbs .logout-btn')) return;

    const btn = document.createElement('button');
    btn.className = 'logout-btn';
    btn.type = 'button';
    btn.textContent = 'Logout';
    nav.appendChild(btn);

    btn.addEventListener('click', ()=>{
      try{
        localStorage.removeItem('df_current_user');
        location.replace(root('auth/index.html'));
      }catch(e){ console.error(e); }
    });
  }

  /* ---------- Apply default breadcrumbs if page provided none ---------- */
  document.addEventListener('DOMContentLoaded', ()=>{
    if (document.body.classList.contains('auth-page')) return; // skip on login
    const hasStatic = !!$('.breadcrumbs ol li');
    if (!hasStatic) {
      const title = (document.title || '').replace(/\s*—.*$/,'').trim();
      const h1 = $('.content h1')?.textContent?.trim();
      const page = h1 || title || 'Page';
      window.setBreadcrumbs([
        {label:'Home', href: root('index.html') },
        {label: page}
      ]);
    } else {
      const nav = $('.breadcrumbs'); if (nav) ensureLogoutButton(nav);
    }
  });
})();