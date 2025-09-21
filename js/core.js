/* Dowson Farms — core.js (stable)
   - Clock (12-hour AM/PM)
   - Footer report date
   - Version (from window.APP_VERSION)
   - Breadcrumb helper + inject Logout button
   - Default breadcrumbs (Home only on index)
*/

(function Core(){
  const $ = (s, r=document) => r.querySelector(s);

  /* ---------------- Time helpers ---------------- */
  function two(n){ return n < 10 ? '0' + n : '' + n; }
  function isHomePage(){
    const file = (location.pathname.split('/').pop() || '').toLowerCase();
    return file === '' || file === 'index.html';
  }

  /* ---------------- Clock (12-hour AM/PM) ---------------- */
  function drawClock(){
    const el = $('#clock'); if (!el) return;
    const d = new Date();
    let h = d.getHours();
    const m = two(d.getMinutes());
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12; if (h === 0) h = 12;
    el.textContent = `${h}:${m} ${ampm}`;
  }
  drawClock();
  (function scheduleClock(){
    const now = new Date();
    const wait = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    setTimeout(()=>{ drawClock(); setInterval(drawClock, 60_000); }, Math.max(250, wait));
  })();

  /* ---------------- Footer date ---------------- */
  (function setReportDate(){
    const el = $('#report-date'); if (!el) return;
    try{
      el.textContent = new Date().toLocaleDateString(undefined, {
        weekday:'short', month:'short', day:'numeric', year:'numeric'
      });
    }catch(_){
      el.textContent = new Date().toDateString();
    }
  })();

  /* ---------------- Version stamp ---------------- */
  (function setVersion(){
    const el = $('#version'); if (!el) return;
    if (typeof window.APP_VERSION === 'string' && window.APP_VERSION) {
      el.textContent = window.APP_VERSION;
    } else {
      el.textContent = el.textContent || 'v0.0.0';
    }
  })();

  /* ---------------- Breadcrumbs + Logout ---------------- */
  // Use from pages if you want custom trails:
  // window.setBreadcrumbs([{label:'Home', href:'../index.html'}, {label:'Section'}])
  window.setBreadcrumbs = function setBreadcrumbs(trail){
    if (!Array.isArray(trail) || !trail.length) return;

    let nav = $('.breadcrumbs');
    if (!nav) {
      // create <nav class="breadcrumbs"><ol></ol></nav> after header
      const hdr = $('.app-header');
      nav = document.createElement('nav');
      nav.className = 'breadcrumbs';
      nav.setAttribute('aria-label', 'Breadcrumb');
      nav.innerHTML = '<ol></ol>';
      (hdr && hdr.parentNode)
        ? hdr.parentNode.insertBefore(nav, hdr.nextSibling)
        : document.body.prepend(nav);
    }
    let ol = nav.querySelector('ol');
    if (!ol) { ol = document.createElement('ol'); nav.appendChild(ol); }

    function esc(s){ return String(s||'').replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

    const parts = [];
    trail.forEach((item, idx)=>{
      if (idx > 0) parts.push('<li class="sep">›</li>');
      const isLast = idx === trail.length - 1;
      const label = esc(item?.label ?? '');
      const href  = !isLast && item?.href ? String(item.href) : null;
      parts.push(href ? `<li><a href="${href}">${label}</a></li>`
                      : `<li><span>${label}</span></li>`);
    });
    ol.innerHTML = parts.join('');

    ensureLogoutButton(nav);
  };

  function ensureLogoutButton(nav){
    if (nav.querySelector('.logout-btn')) return;
    const btn = document.createElement('button');
    btn.className = 'logout-btn';
    btn.type = 'button';
    btn.textContent = 'Logout';
    nav.appendChild(btn);

    btn.addEventListener('click', ()=>{
      try {
        localStorage.removeItem('df_current_user');
        alert('Logged out (frontend only). Wire this to real auth later.');
        // If you want to bounce to your login page, uncomment:
        // location.href = './auth/index.html';
      } catch(e) {
        console.error(e);
      }
    });
  }

  /* ---------------- Default breadcrumbs ---------------- */
  document.addEventListener('DOMContentLoaded', ()=>{
    const nav = $('.breadcrumbs');
    const hasItems = !!nav?.querySelector('ol li');

    if (!hasItems) {
      if (isHomePage()) {
        window.setBreadcrumbs([{ label:'Home', href:'index.html' }]);
      } else {
        // Derive a label from <h1> or <title>
        const label = (document.querySelector('.content h1')?.textContent ||
                       document.title.replace(/\s*—.*$/, '') ||
                       'Page').trim();
        // Compute a relative home link for the current folder
        const homeHref = location.pathname.replace(/\/[^\/]*$/, '/index.html');
        window.setBreadcrumbs([{ label:'Home', href: homeHref }, { label }]);
      }
    } else {
      // Even if the page hard-coded breadcrumbs, make sure Logout is present
      ensureLogoutButton(nav);
    }
  });

})();