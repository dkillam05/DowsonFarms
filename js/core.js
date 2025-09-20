/* Dowson Farms — core.js
   - Clock (HH:MM)
   - Report date footer
   - Version stamp (from version.js if present)
   - Breadcrumb helper + Logout button injection
   - Tiny app registry: DF.ready.then(reg => reg.get()/set())
*/

(function Core(){
  const $ = (s, r=document) => r.querySelector(s);

  /* ---------- Tiny registry so other scripts can share state ---------- */
  const registry = new Map();
  function regSet(k,v){ registry.set(k,v); }
  function regGet(k){ return registry.get(k); }
  const ready = Promise.resolve({ set: regSet, get: regGet });
  window.DF = Object.assign(window.DF || {}, { ready });

  /* ---------- Clock (HH:MM, local time) ---------- */
  function two(n){ return n<10 ? '0'+n : ''+n; }
  function drawClock(){
    const el = $('#clock'); if(!el) return;
    const d = new Date();
    el.textContent = `${two(d.getHours())}:${two(d.getMinutes())}`;
  }
  drawClock();
  // tick at the top of each minute
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
    // Accept any of these globals: DF_VERSION, window.VERSION, {major,minor,patch}
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
      // Ensure <nav class="breadcrumbs"><ol>…</ol></nav> exists
      let nav = $('.breadcrumbs');
      if(!nav){
        // create and insert after header
        const hdr = $('.app-header');
        nav = document.createElement('nav');
        nav.className = 'breadcrumbs';
        nav.setAttribute('aria-label','Breadcrumb');
        nav.innerHTML = '<ol></ol>';
        (hdr && hdr.parentNode) ? hdr.parentNode.insertBefore(nav, hdr.nextSibling) : document.body.prepend(nav);
      }
      let ol = $('ol', nav);
      if(!ol){ ol = document.createElement('ol'); nav.appendChild(ol); }

      // Build items (Home link first, last is current)
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

      // Attach (or move) Logout button to breadcrumbs right edge (once)
      ensureLogoutButton(nav);
    }catch(e){ console.error('setBreadcrumbs error:', e); }
  };

  function ensureLogoutButton(nav){
    // if a logout button already exists in .breadcrumbs, leave it
    if ($('.breadcrumbs .logout-btn')) return;

    // if your app has its own auth, wire this handler later
    const btn = document.createElement('button');
    btn.className = 'logout-btn';
    btn.type = 'button';
    btn.textContent = 'Logout';

    // right side of the breadcrumb bar
    nav.appendChild(btn);

    btn.addEventListener('click', ()=>{
      try {
        // Hook point: clear local session keys or call your sign-out flow
        localStorage.removeItem('df_current_user');
        // Optional: navigate to login page if you have one
        // location.href = '/auth/login.html';
        alert('Logged out (frontend only). Wire this to real auth later.');
      } catch(e) {
        console.error(e);
      }
    });
  }

  /* ---------- Apply default breadcrumbs if the page provided none ---------- */
  document.addEventListener('DOMContentLoaded', ()=>{
    const hasStatic = !!$('.breadcrumbs ol li');
    if (!hasStatic) {
      // Try to infer from <title> or <h1>
      const title = (document.title || '').replace(/\s*—.*$/,'').trim();
      const h1 = $('.content h1')?.textContent?.trim();
      const page = h1 || title || 'Page';
      window.setBreadcrumbs([
        {label:'Home', href: relativeHrefFromRoot('index.html') },
        {label: page}
      ]);
    } else {
      // If page already has a breadcrumb trail, still ensure Logout is present
      const nav = $('.breadcrumbs'); if (nav) ensureLogoutButton(nav);
    }
  });

  /* ---------- Utility: build a path to root-friendly href ---------- */
  function relativeHrefFromRoot(file){
    // Works regardless of nesting depth:
    // If current URL ends with "/crop/index.html", root is likely "/"
    // For static GitHub Pages or subfolders you may want to tweak this helper.
    // For now we return the plain file which browsers resolve relative to current doc.
    return file;
  }
})();