/* Dowson Farms — core.js
   - Clock, footer date, version stamp
   - Breadcrumb helper + Logout button
   - Registry + DF.go() for safe cross-page navigation on GitHub Pages
*/
(function Core(){
  const $ = (s, r=document) => r.querySelector(s);

  // --- Registry & helper navigation that respects repo subfolder ---
  const registry = new Map();
  function regSet(k,v){ registry.set(k,v); }
  function regGet(k){ return registry.get(k); }
  function basePath(){
    // Works for GitHub Pages repo sites: /RepoName/...
    // and for custom domains (root) as well.
    const parts = location.pathname.split('/').filter(Boolean);
    // If first segment looks like a repo folder (e.g., DowsonFarms), use it
    return parts.length ? `/${parts[0]}/` : '/';
  }
  function fromRoot(file){ return basePath() + String(file).replace(/^\//,''); }
  function go(file){ location.href = fromRoot(file); }

  const ready = Promise.resolve({ set: regSet, get: regGet });
  window.DF = Object.assign(window.DF || {}, { ready, go, fromRoot });

  // --- Clock ---
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

  // --- Report date ---
  (function setReportDate(){
    const el = $('#report-date'); if(!el) return;
    try{
      const d = new Date();
      el.textContent = d.toLocaleDateString(undefined, {weekday:'short', year:'numeric', month:'short', day:'numeric'});
    }catch(_){ el.textContent = new Date().toDateString(); }
  })();

  // --- Version from version.js (optional globals) ---
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

  // --- Breadcrumbs + Logout button ---
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
      let ol = $('ol', nav) || nav.appendChild(document.createElement('ol'));
      const items = Array.isArray(trail) ? trail.slice() : [];
      if (!items.length) return;

      const parts = [];
      items.forEach((item, idx)=>{
        if (idx>0) parts.push('<li class="sep">›</li>');
        const isLast = idx === items.length-1;
        const label = (item && item.label) ? String(item.label) : '';
        const href  = (!isLast && item && item.href) ? String(item.href) : null;
        parts.push( href ? `<li><a href="${href}">${label}</a></li>` : `<li><span>${label}</span></li>` );
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
        go('auth/index.html'); // ✅ respects GitHub Pages base path
      } catch(e) {
        console.error(e);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    const hasStatic = !!$('.breadcrumbs ol li');
    if (!hasStatic) {
      const title = (document.title || '').replace(/\s*—.*$/,'').trim();
      const h1 = $('.content h1')?.textContent?.trim();
      const page = h1 || title || 'Page';
      window.setBreadcrumbs([
        {label:'Home', href: fromRoot('index.html') },
        {label: page}
      ]);
    } else {
      const nav = $('.breadcrumbs'); if (nav) ensureLogoutButton(nav);
    }
  });
})();