/* Dowson Farms — core.js
   - Session check (redirect to /auth if not signed in)
   - Clock (HH:MM)
   - Report date footer
   - Version stamp (from version.js if present)
   - Breadcrumb helper + Logout button injection
   - Tiny app registry: DF.ready.then(reg => reg.get()/set())
*/

(function Core(){
  const $ = (s, r=document) => r.querySelector(s);

  /* ---------- Session check ---------- */
  (function enforceAuth(){
    const loggedIn = !!localStorage.getItem('df_current_user');
    const onAuthPage = location.pathname.includes('/auth/');
    if (!loggedIn && !onAuthPage) {
      location.replace('/auth/index.html'); // adjust path if needed
    }
  })();

  /* ---------- Tiny registry ---------- */
  const registry = new Map();
  function regSet(k,v){ registry.set(k,v); }
  function regGet(k){ return registry.get(k); }
  const ready = Promise.resolve({ set: regSet, get: regGet });
  window.DF = Object.assign(window.DF || {}, { ready });

  /* ---------- Clock (HH:MM) ---------- */
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
      (typeof window.DF_VERSION === 'string' && window.DF_VERSION) ||
      (typeof window.VERSION === 'string' && window.VERSION) ||
      (window.DF_VERSION && typeof window.DF_VERSION === 'object'
        ? `v${window.DF_VERSION.major||0}.${window.DF_VERSION.minor||0}.${window.DF_VERSION.patch||0}`
        : null);
    el.textContent = v || el.textContent || 'v0.0.0';
  })();

  /* ---------- Breadcrumbs ---------- */
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

      const items = Array.isArray(trail) ? trail.slice() : [];
      if (!items.length) return;

      const parts = [];
      items.forEach((item, idx)=>{
        if (idx>0) parts.push('<li class="sep">›</li>');
        const isLast = idx === items.length-1;
        const label = (item && item.label) ? String(item.label) : '';
        const href  = (!isLast && item && item.href) ? String(item.href) : null;
        parts.push(
          href ? `<li><a href="${href}">${label}</a></li>` : `<li><span>${label}</span></li>`
        );
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
        location.replace('/auth/index.html'); // go back to login
      } catch(e) { console.error(e); }
    });
  }

  /* ---------- Apply default breadcrumbs if missing ---------- */
  document.addEventListener('DOMContentLoaded', ()=>{
    const hasStatic = !!$('.breadcrumbs ol li');
    if (!hasStatic) {
      const title = (document.title || '').replace(/\s*—.*$/,'').trim();
      const h1 = $('.content h1')?.textContent?.trim();
      const page = h1 || title || 'Page';
      window.setBreadcrumbs([
        {label:'Home', href:'index.html' },
        {label: page}
      ]);
    } else {
      const nav = $('.breadcrumbs'); if (nav) ensureLogoutButton(nav);
    }
  });
})();