/* Dowson Farms — core (Live, clean)
   Wires: logout, time/date, version, breadcrumbs, loader helpers
   No hidden fallbacks. No Firestore. No redirects.
*/
(function () {
  'use strict';

  /* URLs */
  function root() {
    const base = document.querySelector('base')?.href;
    if (base) { try { const u = new URL(base); return u.pathname.endsWith('/') ? u.pathname : u.pathname + '/'; } catch(_){} }
    const seg = location.pathname.split('/').filter(Boolean);
    return seg.length ? ('/' + seg[0] + '/') : '/';
  }
  const url = {
    resolve(rel){ return new URL(rel.replace(/^\.\//,''), location.origin + root()).toString(); },
    home(){ return this.resolve('./index.html'); },
    auth(){ return this.resolve('./auth/index.html'); }
  };

  /* Logout */
  async function logout() {
    let keepTheme = null;
    try { keepTheme = localStorage.getItem('df_theme'); } catch(_){}
    try { if (window.DF_FB_API?.signOut) await DF_FB_API.signOut().catch(()=>{}); } catch(_){}
    try { localStorage.clear(); sessionStorage.clear(); if (keepTheme !== null) localStorage.setItem('df_theme', keepTheme); } catch(_){}
    try {
      if (navigator.serviceWorker?.getRegistrations) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.allSettled(regs.map(r => r.unregister()));
      }
    } catch(_){}
    location.replace(url.auth());
  }
  function wireLogout() {
    const btn = document.getElementById('btn-logout');
    if (btn && !btn.__wired) { btn.__wired = true; btn.addEventListener('click', e => { e.preventDefault(); logout(); }, { passive:false }); }
    document.addEventListener('click', e => {
      if (e.target?.matches?.('[data-action="logout"], .logout')) { e.preventDefault(); logout(); }
    }, { passive:false });
  }

  /* Time / Date (America/Chicago) */
  function startClock() {
    const clock = document.getElementById('df-clock');
    const date = document.getElementById('df-date');
    if (!clock && !date) return;
    const tz = 'America/Chicago';
    function render() {
      const now = new Date();
      if (clock) clock.textContent = now.toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit', hour12:true, timeZone: tz });
      if (date)  date.textContent  = now.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'2-digit', year:'numeric', timeZone: tz });
    }
    render();
    const now = new Date();
    const ms = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    setTimeout(() => { render(); setInterval(render, 60_000); }, Math.max(0, ms));
  }

  /* Version */
  function injectVersion() {
    const el = document.getElementById('df-version');
    if (!el) return;
    const v = (typeof window.DF_VERSION === 'string' && window.DF_VERSION) ? window.DF_VERSION : '0.0.0';
    el.textContent = v;
  }
  async function refreshVersion() {
    try {
      const res = await fetch(url.resolve('./js/version.js'), { cache: 'no-store' });
      const txt = await res.text();
      const m = txt.match(/DF_VERSION\s*=\s*['"]([^'"]+)['"]/i) || txt.match(/var\s+VERSION\s*=\s*['"]([^'"]+)['"]/i);
      if (m) { window.DF_VERSION = m[1]; injectVersion(); }
    } catch(_) {}
  }

  /* Breadcrumbs (explicit call; no observers) */
  function setBreadcrumbs(items) {
    try {
      const nav = document.querySelector('nav.breadcrumbs, .breadcrumbs');
      if (!nav) return;
      let ol = nav.querySelector('ol');
      if (!ol) { ol = document.createElement('ol'); nav.appendChild(ol); }
      ol.innerHTML = '';
      (items || []).forEach((it, i, arr) => {
        const li = document.createElement('li');
        if (it?.href) { const a = document.createElement('a'); a.href = it.href; a.textContent = it.label || ''; li.appendChild(a); }
        else { const s = document.createElement('span'); s.textContent = it?.label || ''; li.appendChild(s); }
        ol.appendChild(li);
        if (i < arr.length - 1) { const sep = document.createElement('li'); sep.className = 'sep'; sep.textContent = '›'; ol.appendChild(sep); }
      });
    } catch(e) { console.warn('[breadcrumbs]', e); }
  }

  /* Loader helpers (attribute-driven) */
  function ensureLoaderHost(host) {
    const c = host || document.querySelector('main.content') || document.body;
    const cs = getComputedStyle(c);
    if (cs.position === 'static') c.style.position = 'relative';
    c.setAttribute('data-has-loader','');
    if (!c.querySelector(':scope > .df-loader')) {
      const wrap = document.createElement('div'); wrap.className = 'df-loader';
      const sp = document.createElement('div'); sp.className = 'df-loader__spinner';
      wrap.appendChild(sp); c.appendChild(wrap);
    }
    return c;
  }
  function showLoader(host){ ensureLoaderHost(host).setAttribute('data-loading','true'); }
  function hideLoader(host){ (host || document.querySelector('main.content') || document.body).setAttribute('data-loading','false'); }
  async function withLoader(host, fn){ showLoader(host); try { return await fn(); } finally { hideLoader(host); } }

  /* Boot */
  document.addEventListener('DOMContentLoaded', () => {
    wireLogout();
    ensureLoaderHost();
    startClock();
    injectVersion();
    refreshVersion();
  });

  /* Expose */
  window.DF = Object.assign(window.DF || {}, {
    url, logout, clock:{ start: startClock }, version:{ inject: injectVersion, refresh: refreshVersion },
    breadcrumbs:{ set: setBreadcrumbs }, loader:{ ensure: ensureLoaderHost, show: showLoader, hide: hideLoader, with: withLoader }
  });
})();