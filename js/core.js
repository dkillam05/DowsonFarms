/* ===========================
   /js/core.js  (FULL REPLACEMENT)
   - Logout (preserves df_theme; unregisters SW; redirects)
   - Clock (America/Chicago)
   - Version/Build Date injection
   - Back button (in-flow above footer) — hidden on home and on /auth/*
   - Logout button in Breadcrumb bar (right-aligned, consistent)
   - Honors <base href="/DowsonFarms/">

   NEW: "Don't kick me out" auth guard
   NEW: Quick View injection (global, consistent)
     • Pages opt-in with:
       <main class="content" data-quick-view="URL" data-qv-label="Quick View"></main>
     • Or <meta name="df-quickview" content="URL">
     • Or window.DF_QUICKVIEW = { href, label }
     • Or window.DF_QUICKVIEW_PROVIDER = async () => ({ title, html|node })
   =========================== */

(function () {
  'use strict';

  /* ---------- URL helpers ---------- */
  function getRepoRootPath() {
    var baseEl = document.querySelector('base');
    if (baseEl && baseEl.href) {
      try {
        var u = new URL(baseEl.href);
        return u.pathname.endsWith('/') ? u.pathname : (u.pathname + '/');
      } catch (_) {}
    }
    var seg = (window.location.pathname || '/').split('/').filter(Boolean);
    if (seg.length > 0) return '/' + seg[0] + '/';
    return '/';
  }
  function resolveAuthURL() { return getRepoRootPath() + 'auth/index.html'; }
  function getHomeURL()      { return getRepoRootPath() + 'index.html'; }

  function isHome() {
    var p = window.location.pathname.replace(/\/+$/, '');
    var seg = p.split('/').filter(Boolean);
    if (seg.length === 0) return true;                         // "/"
    if (seg.length === 1 && seg[0] === 'index.html') return true;
    if (seg.length === 1) return true;                         // "/<repo>"
    if (seg.length === 2 && seg[1] === 'index.html') return true; // "/<repo>/index.html"
    return false;
  }
  function isAuthPage() {
    var p = window.location.pathname.toLowerCase();
    return /\/auth(\/|$)/.test(p);
  }

  /* ---------- LOGOUT ---------- */
  function handleLogout(ev) {
    if (ev && ev.preventDefault) ev.preventDefault();

    var authURL = resolveAuthURL();
    var keepTheme = null;
    try { keepTheme = localStorage.getItem('df_theme'); } catch (_) {}

    // Best-effort Firebase signout
    try {
      if (window.DF_FB_API && typeof window.DF_FB_API.signOut === 'function') {
        window.DF_FB_API.signOut().catch(function(){});
      }
    } catch (_) {}

    try { localStorage.clear(); } catch (_) {}
    try { sessionStorage.clear(); } catch (_) {}
    try { if (keepTheme !== null) localStorage.setItem('df_theme', keepTheme); } catch (_) {}

    function go() {
      try { window.location.replace(authURL); }
      catch (_) { window.location.href = authURL; }
    }

    try {
      if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) {
        navigator.serviceWorker.getRegistrations()
          .then(function (regs) {
            var ops = [];
            for (var i = 0; i < regs.length; i++) ops.push(regs[i].unregister());
            return Promise.allSettled(ops);
          })
          .then(go)
          .catch(go);
      } else {
        go();
      }
    } catch (_) { go(); }
  }

  /* ---------- Breadcrumb Logout (consistent, small) ---------- */
  function injectBreadcrumbLogout() {
    var bc = document.querySelector('nav.breadcrumbs, .breadcrumbs');
    if (!bc) return;

    // Remove any old logout elements
    var old = bc.querySelectorAll('#logout-btn, [data-action="logout"], .logout, a[href*="logout"]');
    for (var i = 0; i < old.length; i++) if (bc.contains(old[i])) old[i].remove();

    // Position host
    var cs = getComputedStyle(bc);
    if (cs.position === 'static') bc.style.position = 'relative';
    var pr = parseInt(cs.paddingRight || '0', 10);
    var needed = 100;
    if (pr < needed) bc.style.paddingRight = needed + 'px';
    if (bc.querySelector('#df-logout-host')) return;

    var host = document.createElement('div');
    host.id = 'df-logout-host';
    host.setAttribute('style', [
      'position:absolute','right:12px','top:50%','transform:translateY(-50%)',
      'display:flex','align-items:center','z-index:2'
    ].join(';'));

    var brand = getComputedStyle(document.documentElement).getPropertyValue('--brand-green').trim() || '#1B5E20';

    var btn = document.createElement('button');
    btn.id = 'logout-btn';
    btn.type = 'button';
    btn.textContent = 'Logout';
    btn.setAttribute('aria-label', 'Log out');
    btn.setAttribute('style', [
      'padding:5px 10px',
      'font-size:12px',
      'font-weight:700',
      'line-height:1',
      'border-radius:8px',
      'border:2px solid ' + brand,
      'background:#fff',
      'color:' + brand,
      'cursor:pointer',
      'box-shadow:0 1px 4px rgba(0,0,0,.08)',
      'touch-action:manipulation',
      '-webkit-tap-highlight-color:transparent'
    ].join(';'));

    var dt = (document.documentElement.getAttribute('data-theme') || '').toLowerCase();
    if (dt === 'dark') {
      btn.style.background = '#15181b';
      btn.style.color = '#dff1e1';
      btn.style.borderColor = '#2d7b35';
    }

    btn.addEventListener('click', handleLogout, { passive: false });
    host.appendChild(btn);
    bc.appendChild(host);
  }

  /* ---------- Clock ---------- */
  function installClock() {
    var clockEl = document.getElementById('clock') || document.getElementById('df-clock');
    var dateEl  = document.getElementById('report-date') || document.getElementById('df-date');
    if (!clockEl && !dateEl) return;

    var tz = 'America/Chicago';
    function render() {
      var now = new Date();
      if (clockEl) clockEl.textContent = now.toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit', hour12: true, timeZone: tz
      });
      if (dateEl) dateEl.textContent = now.toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: '2-digit', year: 'numeric', timeZone: tz
      });
    }
    render();
    var now = new Date();
    var msToNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    setTimeout(function () { render(); setInterval(render, 60000); }, Math.max(0, msToNextMinute));
  }

  /* ---------- Version + Build Date ---------- */
  function injectVersionAndBuildDate() {
    var verEl = document.getElementById('version') || document.getElementById('df-version');
    var buildDateEl = document.getElementById('df-build-date') || null;
    var version = (typeof window !== 'undefined' && window.DF_VERSION) ? String(window.DF_VERSION) : 'v0.0.0';
    if (verEl) { try { verEl.textContent = version; } catch (_) {} }
    if (buildDateEl) {
      try {
        buildDateEl.textContent = new Date().toLocaleDateString('en-US', {
          year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'America/Chicago'
        });
      } catch (_) {}
    }
  }

  /* ---------- Back Button (skip home + login) ---------- */
  function installBackButtonFlow() {
    if (document.getElementById('df-back-flow')) return;
    if (isHome() || isAuthPage()) return;

    var content = document.querySelector('.content') || document.body;

    var host = document.createElement('div');
    host.id = 'df-back-flow';
    host.setAttribute('style','margin:12px 16px; text-align:left;');

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = '← Back';
    btn.setAttribute('style', [
      'font: inherit','font-weight:600','padding:8px 14px',
      'border-radius:10px','border:2px solid var(--brand-green, #1B5E20)',
      'background:#fff','color:#222','box-shadow:0 2px 6px rgba(0,0,0,.08)','cursor:pointer'
    ].join(';'));

    var dt = (document.documentElement.getAttribute('data-theme') || '').toLowerCase();
    if (dt === 'dark') {
      btn.style.background = '#15181b'; btn.style.color = '#eaeaea'; btn.style.borderColor = '#2d7b35';
    }

    var isMenuGrid = !!document.querySelector('.df-tiles[data-section]');
    btn.addEventListener('click', function () {
      if (isMenuGrid) {
        var home = getHomeURL();
        var homePath = new URL(home, window.location.href).pathname;
        var herePath = window.location.pathname;
        if (homePath === herePath) {
          var buster = (home.indexOf('?') > -1 ? '&' : '?') + 'r=' + Date.now();
          window.location.replace(home + buster);
        } else {
          window.location.assign(home);
        }
      } else if (document.referrer && window.history.length > 1) {
        window.history.back();
      } else {
        window.location.assign(getHomeURL());
      }
    });

    host.appendChild(btn);
    content.appendChild(host);

    function pushAboveFooter() {
      try {
        var footer = document.querySelector('footer, .app-footer');
        var h = footer ? Math.ceil(footer.getBoundingClientRect().height) : 0;
        host.style.marginBottom = (h ? (h + 12) : 12) + 'px';
      } catch (_) { host.style.marginBottom = '12px'; }
    }
    pushAboveFooter();
    window.addEventListener('resize', pushAboveFooter);
    window.addEventListener('orientationchange', pushAboveFooter);
  }

  /* ---------- Global loader helpers ---------- */
  function ensureLoaderCSS() {
    if (document.getElementById('df-loader-style')) return;
    var s = document.createElement('style');
    s.id = 'df-loader-style';
    s.textContent =
      '.df-loader{position:fixed;inset:0;display:none;align-items:center;justify-content:center;z-index:4000;background:rgba(0,0,0,.28)}' +
      '[data-loading="true"]>.df-loader,[data-loading="true"] .df-loader{display:flex}' +
      '.df-loader__spinner{width:56px;height:56px;border-radius:50%;border:5px solid rgba(255,255,255,.5);border-top-color:#1B5E20;animation:dfspin 1s linear infinite;background:transparent}' +
      '@keyframes dfspin{to{transform:rotate(360deg)}}';
    document.head.appendChild(s);
  }
  function attachLoader(container) {
    ensureLoaderCSS();
    if (!container) return null;
    container.setAttribute('data-has-loader', '');
    var existing = container.querySelector(':scope > .df-loader');
    if (existing) return existing;
    var wrap = document.createElement('div');
    wrap.className = 'df-loader';
    wrap.setAttribute('aria-live', 'polite');
    wrap.setAttribute('aria-busy', 'true');
    var sp = document.createElement('div');
    sp.className = 'df-loader__spinner';
    sp.setAttribute('role', 'img');
    sp.setAttribute('aria-label', 'Loading');
    wrap.appendChild(sp);
    container.appendChild(wrap);
    return wrap;
  }
  function showLoader(container) {
    var c = container || document.querySelector('main.content') || document.body;
    attachLoader(c);
    c.setAttribute('data-loading', 'true');
  }
  function hideLoader(container) {
    var c = container || document.querySelector('main.content') || document.body;
    c.setAttribute('data-loading', 'false');
  }
  async function withLoader(container, fn) {
    var c = container || document.querySelector('main.content') || document.body;
    showLoader(c);
    try { return await fn(); }
    finally { hideLoader(c); }
  }
  window.DFLoader = { attach: attachLoader, show: showLoader, hide: hideLoader, withLoader: withLoader };

  /* ---------- setBreadcrumbs helper (optional) ---------- */
  window.setBreadcrumbs = function setBreadcrumbs(items) {
    try {
      var nav = document.querySelector('nav.breadcrumbs');
      if (!nav) return;
      var ol = nav.querySelector('ol') || (function(){
        var o = document.createElement('ol'); nav.appendChild(o); return o;
      })();
      ol.innerHTML = '';
      items = Array.isArray(items) ? items : [];
      items.forEach(function (it, i) {
        var li = document.createElement('li');
        if (it && typeof it.href === 'string') {
          var a = document.createElement('a'); a.href = it.href; a.textContent = it.label || '';
          li.appendChild(a);
        } else {
          var sp = document.createElement('span'); sp.textContent = (it && it.label) || '';
          li.appendChild(sp);
        }
        ol.appendChild(li);
        if (i < items.length - 1) {
          var sep = document.createElement('li'); sep.className = 'sep'; sep.textContent = '›';
          ol.appendChild(sep);
        }
      });
    } catch (_) {}
  };

  /* ---------- Quick View (global) ---------- */

  // Tiny modal for Quick View
  function ensureQVModal() {
    if (document.getElementById('df-qv-backdrop')) return;

    var css = document.createElement('style');
    css.textContent = `
      #df-qv-backdrop{position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.38);z-index:3000}
      #df-qv-modal{width:min(720px,92vw);max-height:80vh;overflow:auto;background:var(--tile-bg,#fff);color:var(--ink,#222);border:2px solid var(--tile-border,#2d6a31);border-radius:14px;box-shadow:0 18px 40px rgba(0,0,0,.25)}
      #df-qv-hd{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid var(--tile-border,#2d6a31);position:sticky;top:0;background:inherit}
      #df-qv-ttl{font-weight:700;margin:0}
      #df-qv-x{background:transparent;border:0;font-size:20px;line-height:1;cursor:pointer;color:inherit}
      #df-qv-bd{padding:12px 14px}
    `;
    document.head.appendChild(css);

    var bp = document.createElement('div'); bp.id = 'df-qv-backdrop';
    var md = document.createElement('div'); md.id = 'df-qv-modal';
    var hd = document.createElement('div'); hd.id = 'df-qv-hd';
    var ttl= document.createElement('h3'); ttl.id = 'df-qv-ttl';
    var x  = document.createElement('button'); x.id = 'df-qv-x'; x.type='button'; x.textContent = '×';
    var bd = document.createElement('div'); bd.id = 'df-qv-bd';

    x.addEventListener('click', closeQVModal);
    bp.addEventListener('click', function(e){ if (e.target===bp) closeQVModal(); });

    hd.appendChild(ttl); hd.appendChild(x);
    md.appendChild(hd);  md.appendChild(bd);
    bp.appendChild(md);
    document.body.appendChild(bp);
  }
  function openQVModal(title, contentNodeOrHTML){
    ensureQVModal();
    var bp = document.getElementById('df-qv-backdrop');
    var ttl= document.getElementById('df-qv-ttl');
    var bd = document.getElementById('df-qv-bd');
    ttl.textContent = title || 'Quick View';
    bd.innerHTML = '';
    if (contentNodeOrHTML instanceof Node) bd.appendChild(contentNodeOrHTML);
    else bd.innerHTML = String(contentNodeOrHTML || '');
    bp.style.display = 'flex';
  }
  function closeQVModal(){
    var bp = document.getElementById('df-qv-backdrop');
    if (bp) bp.style.display = 'none';
  }

  function getQuickViewConfig() {
    var main = document.querySelector('main.content') || document.body;
    var href =
      (main && main.getAttribute('data-quick-view')) ||
      (function(){ var m=document.querySelector('meta[name="df-quickview"]'); return m && m.getAttribute('content'); })() ||
      (window.DF_QUICKVIEW && window.DF_QUICKVIEW.href) ||
      '';
    href = (href || '').trim();

    var label =
      (main && main.getAttribute('data-qv-label')) ||
      (window.DF_QUICKVIEW && window.DF_QUICKVIEW.label) ||
      'Quick View';

    return { href: href, label: label };
  }

  function injectQuickView() {
    if (isAuthPage()) return;                       // never on login
    if (document.getElementById('df-quick-view')) return;

    var cfg = getQuickViewConfig();
    var hasProvider = (typeof window.DF_QUICKVIEW_PROVIDER === 'function');

    // If neither provider nor URL, do nothing (page opted out)
    if (!hasProvider && !cfg.href) return;

    var main = document.querySelector('main.content') || document.body;
    var h1   = main.querySelector('h1');

    // Create a header row (matches the Account Roles layout)
    var row = document.createElement('div');
    row.className = 'row';
    row.setAttribute('style','align-items:center;justify-content:space-between;margin:0 0 8px;');

    if (h1) {
      h1.parentNode.insertBefore(row, h1);
      row.appendChild(h1);
    } else {
      var spacer = document.createElement('div'); spacer.textContent = '';
      row.appendChild(spacer);
      main.insertBefore(row, main.firstChild);
    }

    // Button
    var btn = document.createElement('button');
    btn.id = 'df-quick-view';
    btn.type = 'button';
    btn.className = 'btn-outline';
    btn.textContent = cfg.label || 'Quick View';
    btn.addEventListener('click', async function(){
      try {
        // 1) Provider wins: show modal content
        if (typeof window.DF_QUICKVIEW_PROVIDER === 'function') {
          var res = await window.DF_QUICKVIEW_PROVIDER();
          var title = (res && res.title) || 'Quick View';
          var content = (res && (res.node || res.html)) || '<div style="opacity:.7">Nothing to show.</div>';
          openQVModal(title, content);
          return;
        }
        // 2) Fallback: navigate to provided URL
        if (cfg && cfg.href) {
          window.location.assign(cfg.href);
          return;
        }
      } catch(e) {
        console.error('Quick View error:', e);
      }
    });

    row.appendChild(btn);
  }

  /* ---------- Auth Guard with spinner-based grace ---------- */
  function installAuthGuard() {
    if (isAuthPage() || isHome()) return;

    var MAX_TRIES = 150;          // ~12s waiting for firebase-init to load
    var GRACE_MS  = 15000;        // show spinner & wait up to 15s before redirect
    var FORCE_LOGOUT_DAYS = 30;   // monthly sign-out safety
    var tries = 0;

    function bounceToLogin() {
      var url = resolveAuthURL();
      try { window.location.replace(url); } catch (_) { window.location.href = url; }
    }
    function recordHeartbeat() {
      try { localStorage.setItem('df_last_auth_ok', String(Date.now())); } catch (_) {}
    }

    // Monthly forced logout (only if we've ever been authed before)
    try {
      var raw = localStorage.getItem('df_last_auth_ok');
      if (raw) {
        var last = parseInt(raw, 10);
        if (!isNaN(last)) {
          var ms = Date.now() - last;
          if (ms > FORCE_LOGOUT_DAYS * 24 * 60 * 60 * 1000) {
            handleLogout();
            return;
          }
        }
      }
    } catch (_) {}

    var graceTimer = null;
    var gotFirstAuthCallback = false;
    var lastUser = undefined;

    function startGrace() {
      var target = document.querySelector('main.content') || document.body;
      showLoader(target);
      if (graceTimer) return;
      graceTimer = setTimeout(function () {
        hideLoader(target);
        if (!lastUser) bounceToLogin();
      }, GRACE_MS);
    }
    function clearGrace() {
      var target = document.querySelector('main.content') || document.body;
      hideLoader(target);
      if (graceTimer) { clearTimeout(graceTimer); graceTimer = null; }
    }

    function subscribeAuth() {
      if (!window.DF_FB_API || typeof window.DF_FB_API.onAuth !== 'function') return false;

      // Prefer LOCAL persistence so sessions stick on phones
      try {
        if (typeof window.DF_FB_API.setPersistence === 'function') {
          window.DF_FB_API.setPersistence(true).catch(function(){});
        }
      } catch (_) {}

      window.DF_FB_API.onAuth(function (user) {
        gotFirstAuthCallback = true;
        lastUser = user || null;

        if (user) {
          clearGrace();
          recordHeartbeat();
        } else {
          startGrace();
        }
      });

      setTimeout(function(){
        if (!gotFirstAuthCallback) {
          startGrace();
        }
      }, 1200);

      return true;
    }

    (function waitForFirebase() {
      tries++;
      if (!window.DF_FB || !window.DF_FB_API || !window.DF_FB.auth) {
        if (tries < MAX_TRIES) return setTimeout(waitForFirebase, 80);
        startGrace();
        return;
      }
      if (!subscribeAuth()) {
        if (tries < MAX_TRIES) return setTimeout(waitForFirebase, 80);
        startGrace();
        return;
      }
      try { if (window.DF_FB.auth.currentUser) recordHeartbeat(); } catch (_) {}
    })();

    document.addEventListener('visibilitychange', function(){
      if (document.visibilityState === 'visible' && !lastUser && graceTimer) {
        clearTimeout(graceTimer);
        graceTimer = setTimeout(function(){
          var target = document.querySelector('main.content') || document.body;
          hideLoader(target);
          if (!lastUser) bounceToLogin();
        }, Math.min(6000, GRACE_MS));
      }
    });
  }

  /* ---------- DOM Ready ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    var host = document.querySelector('main.content') || document.body;
    attachLoader(host);

    injectBreadcrumbLogout();
    installClock();
    injectVersionAndBuildDate();
    installBackButtonFlow();
    injectQuickView();          // adds Quick View (provider or URL)
    installAuthGuard();
  });

  // Legacy logout triggers
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t) return;
    if (t.matches('[data-action="logout"], .logout')) { e.preventDefault(); handleLogout(e); }
  }, { passive: false });

  // Expose for pages that want to programmatically refresh Quick View later
  window.DF_UI = window.DF_UI || {};
  window.DF_UI.refreshQuickView = injectQuickView;

})();