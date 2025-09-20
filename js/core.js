/* Dowson Farms — core.js
   - Clock / Report date / Version
   - Breadcrumbs + Logout
   - Back button that scrolls with the page
   - Tiny registry + DF.go()
*/
(function Core(){
  const $ = (s, r=document) => r.querySelector(s);

  // tiny registry + navigate helper
  const registry = new Map();
  function regSet(k,v){ registry.set(k,v); }
  function regGet(k){ return registry.get(k); }
  function go(href){ location.href = href; }
  const ready = Promise.resolve({ set: regSet, get: regGet });
  window.DF = Object.assign(window.DF || {}, { ready, go });

  // clock HH:MM
  function two(n){ return n<10 ? '0'+n : ''+n; }
  function drawClock(){
    const el = $('#clock'); if(!el) return;
    const d = new Date();
    el.textContent = `${two(d.getHours())}:${two(d.getMinutes())}`;
  }
  drawClock();
  (function tick(){
    const now = new Date();
    const msToNextMin = (60 - now.getSeconds())*1000 - now.getMilliseconds();
    setTimeout(()=>{ drawClock(); setInterval(drawClock, 60_000); }, Math.max(250, msToNextMin));
  })();

  // footer date
  (function setReportDate(){
    const el = $('#report-date'); if(!el) return;
    try{
      const d = new Date();
      el.textContent = d.toLocaleDateString(undefined,{weekday:'short',year:'numeric',month:'short',day:'numeric'});
    }catch(_){ el.textContent = new Date().toDateString(); }
  })();

  // version
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

  // breadcrumbs
  window.setBreadcrumbs = function setBreadcrumbs(trail){
    try{
      let nav = $('.breadcrumbs');
      if(!nav){
        const hdr = $('.app-header');
        nav = document.createElement('nav');
        nav.className = 'breadcrumbs';
        nav.setAttribute('aria-label','Breadcrumb');
        nav.innerHTML = '<ol></ol>';
        (hdr && hdr.parentNode) ? hdr.parentNode.insertBefore(nav, hdr.nextSibling)
                                : document.body.prepend(nav);
      }
      let ol = $('ol', nav); if(!ol){ ol = document.createElement('ol'); nav.appendChild(ol); }

      let items = Array.isArray(trail) ? trail.slice() : [];
      if (!items.length) return;

      // Home page should only show “Home”
      if (document.body.classList.contains('home-page')) items = [{label:'Home'}];

      const parts = [];
      items.forEach((item, i)=>{
        if (i>0) parts.push('<li class="sep">›</li>');
        const last = i===items.length-1;
        const label = (item && item.label) ? String(item.label) : '';
        const href  = (!last && item && item.href) ? String(item.href) : null;
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
      localStorage.removeItem('df_current_user');
      alert('Logged out (frontend only). Wire this to real auth later.');
    });
  }

  // back button (scrolls with page, not fixed)
  function renderBackButton(){
    if (document.body.classList.contains('home-page')) return; // no back on home
    const content = $('.content'); if (!content) return;
    if (content.querySelector('.back-btn')) return;

    const btn = document.createElement('a');
    btn.href = 'javascript:void(0)';
    btn.className = 'back-btn';
    btn.innerHTML = '<span class="chev">‹</span> Back';
    content.insertBefore(btn, content.firstChild);

    btn.addEventListener('click', (e)=>{
      e.preventDefault();
      const ref = document.referrer;
      const sameOrigin = ref && ref.startsWith(location.origin);
      if (sameOrigin && history.length > 1) history.back();
      else (window.DF && window.DF.go) ? window.DF.go('index.html') : (location.href='index.html');
    });
  }

  // defaults on ready
  document.addEventListener('DOMContentLoaded', ()=>{
    const hasStatic = !!document.querySelector('.breadcrumbs ol li');
    if (!hasStatic) {
      const title = (document.title||'').replace(/\s*—.*$/,'').trim();
      const h1 = document.querySelector('.content h1')?.textContent?.trim();
      const page = h1 || title || 'Page';
      const trail = document.body.classList.contains('home-page')
        ? [{label:'Home'}]
        : [{label:'Home', href:'index.html'}, {label: page}];
      window.setBreadcrumbs(trail);
    } else if (document.body.classList.contains('home-page')) {
      window.setBreadcrumbs([{label:'Home'}]);
    } else {
      const nav = document.querySelector('.breadcrumbs'); if (nav) ensureLogoutButton(nav);
    }
    renderBackButton();
  });
})();