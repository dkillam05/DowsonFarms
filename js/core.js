/* ======================================================================
   Dowson Farms — core.js (Live)
   - Consistent wiring for header/crumbs/footer elements
   - Logout, Clock, Version, Breadcrumbs, Loader, Back, Quick View
   - Optional RBAC Tiles Guard (off by default; no Firestore unless enabled)
   ====================================================================== */
(function () {
  'use strict';

  /* ------------------------- URL + Page helpers ------------------------- */
  function getRepoRootPath() {
    // honors <base>, otherwise assumes first path segment as repo root (e.g. /DowsonFarms/)
    var baseEl = document.querySelector('base');
    if (baseEl && baseEl.href) {
      try {
        var u = new URL(baseEl.href);
        return u.pathname.endsWith('/') ? u.pathname : (u.pathname + '/');
      } catch (_e) {}
    }
    var seg = (location.pathname || '/').split('/').filter(Boolean);
    if (seg.length > 0) return '/' + seg[0] + '/';
    return '/';
  }
  function resolveURL(rel) {
    return new URL(rel.replace(/^\.\//, ''), location.origin + getRepoRootPath()).toString();
  }
  function homeURL() { return resolveURL('./index.html'); }
  function authURL() { return resolveURL('./auth/index.html'); }

  function isAuthPage() { return /\/auth(\/|$)/i.test(location.pathname); }
  function isHome() {
    var p = location.pathname.replace(/\/+$/, '');
    var seg = p.split('/').filter(Boolean);
    if (seg.length === 0) return true;
    if (seg.length === 1) return true;               // /index.html or /
    if (seg.length === 2 && seg[1] === 'index.html') return true;
    return false;
  }

  /* ------------------------------ Logout -------------------------------- */
  async function logout() {
    var keepTheme = null;
    try { keepTheme = localStorage.getItem('df_theme'); } catch (_) {}
    // best-effort: app-provided API
    try { if (window.DF_FB_API && typeof DF_FB_API.signOut === 'function') await DF_FB_API.signOut().catch(()=>{}); } catch (_){}

    // clear storage but keep theme
    try {
      localStorage.clear();
      sessionStorage.clear();
      if (keepTheme !== null) localStorage.setItem('df_theme', keepTheme);
    } catch (_){}

    // unregister any service workers, then navigate
    function go() { try { location.replace(authURL()); } catch (_){ location.href = authURL(); } }
    try {
      if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.allSettled(regs.map(r => r.unregister()));
      }
    } catch (_){}
    go();
  }

  function wireLogoutButton() {
    var btn = document.getElementById('btn-logout');
    if (btn && !btn.__df_wired) {
      btn.__df_wired = true;
      btn.addEventListener('click', function (e) { e.preventDefault(); logout(); }, { passive: false });
    }
    // safety: also capture any `[data-action="logout"]`
    document.addEventListener('click', function (e) {
      var t = e.target;
      if (!t) return;
      if (t.matches('[data-action="logout"], .logout')) {
        e.preventDefault();
        logout();
      }
    }, { passive: false });
  }

  /* ------------------------------ Clock --------------------------------- */
  function startClock() {
    var clockEl = document.getElementById('df-clock');
    if (!clockEl) return;
    var tz = 'America/Chicago';
    function render() {
      var now = new Date();
      clockEl.textContent = now.toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit', hour12: true, timeZone: tz
      });
    }
    render();
    var now = new Date();
    var ms = ((60 - now.getSeconds()) * 1000 - now.getMilliseconds());
    setTimeout(function () { render(); setInterval(render, 60_000); }, Math.max(0, ms));
  }

  /* ----------------------------- Version -------------------------------- */
  function injectVersion() {
    var el = document.getElementById('df-version');
    if (!el) return;
    var ver = (typeof window.DF_VERSION === 'string' && window.DF_VERSION) ? window.DF_VERSION : '0.0.0';
    el.textContent = ver;
  }

  async function refreshVersion() {
    try {
      const res = await fetch(resolveURL('./js/version.js'), { cache: 'no-store' });
      const txt = await res.text();
      const m = txt.match(/DF_VERSION\s*=\s*['"]([^'"]+)['"]/i) || txt.match(/var\s+VERSION\s*=\s*['"]([^'"]+)['"]/i);
      const ver = m ? m[1] : null;
      if (ver) {
        window.DF_VERSION = ver;
        injectVersion();
      }
    } catch (_){}
  }

  /* --------------------------- Breadcrumbs ------------------------------- */
  function setBreadcrumbs(items) {
    // items: [{label, href?}, ...]
    try {
      var nav = document.querySelector('nav.crumbs, nav.breadcrumbs, .breadcrumbs');
      if (!nav) return;
      var ol = nav.querySelector('ol');
      if (!ol) { ol = document.createElement('ol'); nav.insertBefore(ol, nav.firstChild); }
      ol.innerHTML = '';
      (Array.isArray(items) ? items : []).forEach(function (it, i, arr) {
        var li = document.createElement('li');
        if (it && it.href) { var a = document.createElement('a'); a.href = it.href; a.textContent = it.label || ''; li.appendChild(a); }
        else { var sp = document.createElement('span'); sp.textContent = (it && it.label) || ''; li.appendChild(sp); }
        ol.appendChild(li);
        if (i < arr.length - 1) { var s = document.createElement('li'); s.className = 'sep'; s.textContent = '›'; ol.appendChild(s); }
      });
    } catch (e) { console.warn('[core] breadcrumbs error:', e); }
  }

  /* ------------------------------ Loader -------------------------------- */
  function ensureLoaderHost(host) {
    var c = host || document.querySelector('main.content') || document.body;
    var cs = getComputedStyle(c);
    if (cs.position === 'static') c.style.position = 'relative';
    c.setAttribute('data-has-loader', '');
    if (!c.querySelector(':scope > .df-loader')) {
      var wrap = document.createElement('div');
      wrap.className = 'df-loader';
      wrap.setAttribute('aria-live', 'polite');
      wrap.setAttribute('aria-busy', 'true');
      var sp = document.createElement('div');
      sp.className = 'df-loader__spinner';
      wrap.appendChild(sp);
      c.appendChild(wrap);
    }
    return c;
  }
  function showLoader(host) { ensureLoaderHost(host).setAttribute('data-loading', 'true'); }
  function hideLoader(host) { (host || document.querySelector('main.content') || document.body).setAttribute('data-loading', 'false'); }
  async function withLoader(host, fn) { showLoader(host); try { return await fn(); } finally { hideLoader(host); } }

  /* ------------------------------ Back ---------------------------------- */
  function wireBackButton() {
    var btn = document.getElementById('btn-back');
    if (!btn || btn.__df_wired) return;
    btn.__df_wired = true;
    btn.addEventListener('click', function () {
      // prefer history back if available; otherwise go home
      if (document.referrer && history.length > 1) history.back();
      else location.assign(homeURL());
    });
  }
  // Optional: inject a small back button for legacy pages missing one
  function installBack() {
    if (isHome() || isAuthPage()) return;
    if (document.getElementById('df-back-inline')) return;
    var content = document.querySelector('.content') || document.body;
    var host = document.createElement('div');
    host.id = 'df-back-inline';
    host.style.cssText = 'margin:12px 0 8px 0;';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-outline';
    btn.textContent = '◀︎ Back';
    btn.addEventListener('click', function () {
      if (document.referrer && history.length > 1) history.back();
      else location.assign(homeURL());
    });
    host.appendChild(btn);
    content.insertBefore(host, content.firstChild);
  }

  /* ---------------------------- Quick View ------------------------------- */
  function ensureQV() {
    if (document.getElementById('df-qv-backdrop')) return;
    var css = document.createElement('style');
    css.textContent = [
      '#df-qv-backdrop{position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.38);z-index:3000}',
      '#df-qv-modal{width:min(720px,92vw);max-height:80vh;overflow:auto;background:var(--tile-bg,#fff);color:var(--ink,#222);',
      'border:1px solid var(--tile-border,rgba(0,0,0,.14));border-radius:12px;box-shadow:0 18px 40px rgba(0,0,0,.25)}',
      '#df-qv-hd{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid var(--tile-border,rgba(0,0,0,.14));position:sticky;top:0;background:inherit}',
      '#df-qv-ttl{font-weight:700;margin:0}',
      '#df-qv-x{background:transparent;border:0;font-size:20px;line-height:1;cursor:pointer;color:inherit}',
      '#df-qv-bd{padding:12px 14px}'
    ].join('');
    document.head.appendChild(css);
    var bp = document.createElement('div'); bp.id = 'df-qv-backdrop';
    var md = document.createElement('div'); md.id = 'df-qv-modal';
    var hd = document.createElement('div'); hd.id = 'df-qv-hd';
    var ttl = document.createElement('h3'); ttl.id = 'df-qv-ttl';
    var x = document.createElement('button'); x.id = 'df-qv-x'; x.type = 'button'; x.textContent = '×';
    var bd = document.createElement('div'); bd.id = 'df-qv-bd';
    x.addEventListener('click', function(){ bp.style.display='none'; });
    bp.addEventListener('click', function(e){ if (e.target === bp) bp.style.display='none'; });
    hd.appendChild(ttl); hd.appendChild(x); md.appendChild(hd); md.appendChild(bd); bp.appendChild(md); document.body.appendChild(bp);
  }
  function openQuickView(title, content) {
    ensureQV();
    var bp = document.getElementById('df-qv-backdrop');
    var ttl = document.getElementById('df-qv-ttl');
    var bd  = document.getElementById('df-qv-bd');
    ttl.textContent = title || 'Quick View';
    bd.innerHTML = '';
    if (content instanceof Node) bd.appendChild(content);
    else bd.innerHTML = String(content || '<div style="opacity:.7">Nothing to show.</div>');
    bp.style.display = 'flex';
  }

  /* -------------------------- Optional RBAC Guard ------------------------ */
  // OFF by default. To enable:
  //   window.DF_ENABLE_RBAC = true;
  // Requires DF_FB and DF_MENUS present; loads Firestore from CDN lazily.
  function maybeInstallTilesGuard() {
    if (!window.DF_ENABLE_RBAC) return;
    var host = document.querySelector('.df-tiles[data-source]');
    if (!host) return;

    if (!document.getElementById('rbac-tiles-style-core')) {
      var s = document.createElement('style'); s.id = 'rbac-tiles-style-core';
      s.textContent = '.df-tiles[data-source]{visibility:hidden}.df-tiles[data-source].rbac-ready{visibility:visible}';
      document.head.appendChild(s);
    }

    var code = `
      import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
      const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
      async function readyFB(maxMs=12000){
        const t0=Date.now(); while(Date.now()-t0<maxMs){
          if(window.DF_FB&&DF_FB.db&&DF_FB.auth) return window.DF_FB;
          await sleep(60);
        }
        throw new Error('Firebase not ready');
      }
      (async ()=>{
        try{
          const { db, auth } = await readyFB();
          const user = auth.currentUser;

          const MENUS = (window.DF_MENUS && Array.isArray(window.DF_MENUS.tiles))
            ? window.DF_MENUS.tiles.reduce((acc,t)=>{
                const top=String(t.label||'').trim();
                const subs=(Array.isArray(t.children)?t.children:[]).map(c=>String(c.label||'').trim());
                if(top) acc[top]=subs; return acc;
              }, {})
            : {};
          const ACTIONS=['view','edit','add','archive','delete'];
          function empty(){ const p={}; Object.keys(MENUS).forEach(m=>{ p[m]={}; (MENUS[m]||[]).forEach(s=>{ p[m][s]={view:false,edit:false,add:false,archive:false,delete:false}; }); }); return p; }
          function merge(base, ovr){ const out=empty(); Object.keys(out).forEach(m=>{ (MENUS[m]||[]).forEach(s=>{ const b=(base?.[m]?.[s])||{}; const o=(ovr?.[m]?.[s])||{}; ACTIONS.forEach(k=> out[m][s][k]=(k in o)?!!o[k]:!!b[k]); }); }); return out; }
          function canView(eff,m,s){ const p=(eff?.[m]?.[s])||{}; return !!(p.view||p.edit||p.add||p.archive||p.delete); }

          let eff=null;
          if (user){
            const email=(user.email||'').toLowerCase();
            let roleId=null, overrides={};
            try{ const u=await getDoc(doc(db,'users',email)); if (u.exists()){ const d=u.data()||{}; roleId=d.roleId||d.role||null; overrides=(d.exceptions&&d.exceptions.enabled)?(d.exceptions.grants||{}):{}; } }catch(_){}
            let rolePerms={};
            if (roleId){ try{ const r=await getDoc(doc(db,'roles',String(roleId))); if (r.exists()){ const d=r.data()||{}; rolePerms=(d.permissions&&typeof d.permissions==='object')?d.permissions:{}; } }catch(_){ } }
            eff = merge(rolePerms, overrides);
          }

          const host=document.querySelector('.df-tiles[data-source]');
          if (!host){ document.querySelector('.df-tiles[data-source]')?.classList.add('rbac-ready'); return; }

          document.querySelectorAll('.df-tiles [data-section]').forEach(sec=>{
            const menu = sec.getAttribute('data-section')||''; let kept=0;
            sec.querySelectorAll('[data-submenu], a, .tile, button, li, div').forEach(node=>{
              const sub = (node.getAttribute && node.getAttribute('data-submenu')) || (node.textContent||'').trim();
              if (!sub) return; if (node.matches('h1,h2,h3,nav,ol,ul')) return;
              if (eff && !canView(eff, menu, sub)){ node.style.display='none'; } else { kept++; }
            });
            if (!kept) sec.style.display='none';
          });

          host.classList.add('rbac-ready');
          window.dispatchEvent(new CustomEvent('df:tiles-guarded'));
        }catch(e){
          document.querySelector('.df-tiles[data-source]')?.classList.add('rbac-ready');
          console.warn('[core tiles guard] skipped:', e?.message||e);
        }
      })();
    `;
    var mod = document.createElement('script'); mod.type = 'module'; mod.textContent = code;
    document.documentElement.appendChild(mod);
  }

  /* ---------------------------- Auth Guard (passive) --------------------- */
  // Just records last-known auth time if DF_FB_API is present. No redirects.
  function passiveAuthGuard() {
    if (isAuthPage() || isHome()) return;
    var MAX = 150, tries = 0;
    function record(){ try { localStorage.setItem('df_last_auth_ok', String(Date.now())); } catch(_){ } }
    function sub(){
      if (!window.DF_FB_API || typeof DF_FB_API.onAuth !== 'function') return false;
      try { window.DF_FB_API.setPersistence && DF_FB_API.setPersistence(true).catch(()=>{}); } catch(_){}
      DF_FB_API.onAuth(function(user){ if (user) record(); });
      if (window.DF_FB && DF_FB.auth && DF_FB.auth.currentUser) record();
      return true;
    }
    (function wait(){
      tries++;
      if (!sub()) { if (tries < MAX) return setTimeout(wait, 80); }
    })();
  }

  /* --------------------------- Boot sequence ----------------------------- */
  document.addEventListener('DOMContentLoaded', function () {
    // wire UI elements present in the current page
    wireLogoutButton();
    wireBackButton();

    // small utilities
    ensureLoaderHost();      // creates .df-loader container (style comes from CSS)
    startClock();
    injectVersion();
    refreshVersion().catch(()=>{});

    // optional features
    passiveAuthGuard();
    maybeInstallTilesGuard();
  });

  /* ------------------------------ Expose -------------------------------- */
  window.DF = Object.assign(window.DF || {}, {
    // actions
    logout: logout,

    // utilities
    url: { home: homeURL, auth: authURL, resolve: resolveURL },

    // widgets
    loader: { ensure: ensureLoaderHost, show: showLoader, hide: hideLoader, with: withLoader },
    breadcrumbs: { set: setBreadcrumbs },
    back: { install: installBack },
    quickview: { open: openQuickView },

    // diagnostics
    version: { inject: injectVersion, refresh: refreshVersion },
    clock: { start: startClock }
  });
})();