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

  /* ---------- Version (prefer version.js -> window.APP_VERSION) ---------- */
  (function setVersion(){
    const el = $('#version'); if(!el) return;

    // Prefer your version.js global if present
    const ver =
      (typeof window.APP_VERSION === 'string' && window.APP_VERSION) ||
      (typeof window.DF_VERSION === 'string' && window.DF_VERSION) ||
      (typeof window.VERSION === 'string' && window.VERSION) ||
      (window.DF_VERSION && typeof window.DF_VERSION === 'object'
        ? `v${window.DF_VERSION.major||0}.${window.DF_VERSION.minor||0}.${window.DF_VERSION.patch||0}`
        : null);

    // Only write if footer is empty or still default; don't fight version.js
    const current = (el.textContent || '').trim();
    if (ver && (!current || /^v0\.0\.0$/i.test(current))) {
      el.textContent = ver;
    }

    // Expose to registry for anyone else
    ready.then(reg => reg.set('version', ver || current || 'v0.0.0'));
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
        let href  = (!isLast && item && item.href) ? String(item.href) : null;

        // If they passed "index.html" as a root-y link, normalize to the actual root from here
        if (href && href.replace(/^\.\/+/,'') === 'index.html') {
          href = relativeHrefFromRoot('index.html');
        }

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
        // location.href = relativeHrefFromRoot('auth/login.html');
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
      // Infer current page from <title> or <h1>
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

  /* ---------- Utility: build a root-relative href from the current depth ---------- */
  function relativeHrefFromRoot(file){
    // e.g. /, /crop/index.html, /settings/products/seed.html
    // We need to walk "up" to the site root regardless of depth, then add file (usually index.html).
    try{
      const path = location.pathname.replace(/\/+$/,''); // trim trailing slash
      const parts = path.split('/').filter(Boolean);
      // If last segment is a file (has a dot), depth is (parts.length - 1); else it's a directory path
      const last = parts[parts.length - 1] || '';
      const isFile = /\.[a-z0-9]+$/i.test(last);
      const dirDepth = isFile ? (parts.length - 1) : parts.length;
      const up = '../'.repeat(Math.max(0, dirDepth));
      return up + (file || '');
    }catch(_){
      return file || 'index.html';
    }
  }
})();