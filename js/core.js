/* ===========================
   Dowson Farms — core.js  (FULL REPLACEMENT, Back button above footer)
   - Logout (no Firebase; clears storage but preserves df_theme; unregisters SW; redirects)
   - Clock (HH:MM AM/PM, America/Chicago) → supports #clock and #df-clock
   - Version/Build Date → supports #version/#df-version and #report-date/#df-build-date
   - Honors <base href="/DowsonFarms/"> so relative redirects work anywhere
   - Back button (scrolls with page) INSIDE .content, always above footer; hidden on true home page
   =========================== */

(function () {
  'use strict';

  /* ---------------------------------------
     Resolve /auth/index.html respecting <base>
  ----------------------------------------*/
  function resolveAuthURL() {
    try {
      return new URL('auth/index.html', document.baseURI).href;
    } catch (e) {
      try {
        var scripts = document.getElementsByTagName('script');
        var src = null;
        for (var i = 0; i < scripts.length; i++) {
          var s = scripts[i].getAttribute('src') || '';
          if (/(^|\/)js\/core\.js(\?|#|$)/.test(s)) { src = s; break; }
        }
        if (!src) src = 'js/core.js';
        var coreAbs = new URL(src, window.location.href);
        return new URL('../auth/index.html', coreAbs.href).href;
      } catch (_) {
        return 'auth/index.html';
      }
    }
  }

  function resolveURL(rel) {
    try { return new URL(rel, document.baseURI).href; }
    catch (_) { return rel; }
  }

  /* ---------------------------------------
     LOGOUT (no Firebase)
  ----------------------------------------*/
  function installLogout() {
    var candidates = [];
    var byId = document.getElementById('logout-btn');
    if (byId) candidates.push(byId);
    var byAttr = document.querySelectorAll('[data-action="logout"], .logout');
    for (var i = 0; i < byAttr.length; i++) candidates.push(byAttr[i]);
    if (!candidates.length) return;

    var authURL = resolveAuthURL();

    function handleLogout(ev) {
      if (ev && ev.preventDefault) ev.preventDefault();

      var keepTheme = null;
      try { keepTheme = localStorage.getItem('df_theme'); } catch (_) {}

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
      } catch (_) {
        go();
      }
    }

    for (var j = 0; j < candidates.length; j++) {
      candidates[j].addEventListener('click', handleLogout, { passive: false });
    }
  }

  /* ---------------------------------------
     CLOCK (HH:MM AM/PM)
  ----------------------------------------*/
  function installClock() {
    var clockEl = document.getElementById('clock') || document.getElementById('df-clock');
    var dateEl  = document.getElementById('report-date') || document.getElementById('df-date');
    if (!clockEl && !dateEl) return;

    var tz = 'America/Chicago';

    function render() {
      var now = new Date();
      if (clockEl) {
        clockEl.textContent = now.toLocaleTimeString('en-US', {
          hour: 'numeric', minute: '2-digit', hour12: true, timeZone: tz
        });
      }
      if (dateEl) {
        dateEl.textContent = now.toLocaleDateString('en-US', {
          weekday: 'short', month: 'short', day: '2-digit', year: 'numeric', timeZone: tz
        });
      }
    }

    render();
    var now = new Date();
    var msToNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    setTimeout(function () {
      render();
      setInterval(render, 60000);
    }, Math.max(0, msToNextMinute));
  }

  /* ---------------------------------------
     VERSION + BUILD DATE
  ----------------------------------------*/
  function injectVersionAndBuildDate() {
    var verEl = document.getElementById('version') || document.getElementById('df-version');
    var buildDateEl = document.getElementById('df-build-date') || null;

    var version = (typeof window !== 'undefined' && window.DF_VERSION)
      ? String(window.DF_VERSION)
      : 'v0.0.0';

    if (verEl) {
      try { verEl.textContent = version; } catch (_) {}
    }

    if (buildDateEl) {
      try {
        buildDateEl.textContent = new Date().toLocaleDateString('en-US', {
          year: 'numeric', month: '2-digit', day: '2-digit',
          timeZone: 'America/Chicago'
        });
      } catch (_) {}
    }
  }

  /* ---------------------------------------
     Helpers to detect "home" accurately on GitHub Pages
  ----------------------------------------*/
  function isHome() {
    var p = window.location.pathname.replace(/\/+$/, ''); // strip trailing slash
    var seg = p.split('/').filter(Boolean);               // path segments

    // Cases to treat as "home":
    // 1) "/"                        -> []
    // 2) "/index.html"              -> ['index.html']
    // 3) "/<repo>/"                 -> ['<repo>']
    // 4) "/<repo>/index.html"       -> ['<repo>','index.html']
    if (seg.length === 0) return true;
    if (seg.length === 1 && (seg[0] === 'index.html')) return true;
    if (seg.length === 1) return true; // project root
    if (seg.length === 2 && seg[1] === 'index.html') return true;
    return false;
  }

  /* ---------------------------------------
     Back Button (in-flow inside .content)
     - Always sits ABOVE the footer (accounts for footer height)
     - Hidden on true home page
     - On "menu/grid" pages (have .df-tiles[data-section]) → goes to Home
       Else → history.back() or Home fallback
  ----------------------------------------*/
  function installBackButtonFlow() {
    if (document.getElementById('df-back-flow')) return;
    if (isHome()) return;

    // Where to place it: at the END of .content so it appears near bottom,
    // but still above the footer. If there's no .content, append to body.
    var content = document.querySelector('.content') || document.body;

    var host = document.createElement('div');
    host.id = 'df-back-flow';
    host.setAttribute('style','margin:12px 16px; text-align:left;');

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = '← Back';
    btn.setAttribute('style', [
      'font: inherit',
      'font-weight:600',
      'padding:8px 14px',
      'border-radius:10px',
      'border:2px solid #1B5E20',
      'background:#fff',
      'color:#222',
      'box-shadow:0 2px 6px rgba(0,0,0,.08)',
      'cursor:pointer'
    ].join(';'));

    // Dark mode tweak
    if (document.documentElement.getAttribute('data-theme') === 'dark') {
      btn.style.background = '#15181b';
      btn.style.color = '#eaeaea';
      btn.style.borderColor = '#2d7b35';
    }

    // Determine click behavior
    var isMenuGrid = !!document.querySelector('.df-tiles[data-section]');
    btn.addEventListener('click', function () {
      if (isMenuGrid) {
        // Menu pages: go to Home explicitly
        window.location.href = resolveURL('index.html');
      } else if (document.referrer && window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = resolveURL('index.html');
      }
    });

    host.appendChild(btn);
    content.appendChild(host);

    // Make sure it's visibly above the footer even if the footer is fixed/sticky.
    function pushAboveFooter() {
      try {
        var footer = document.querySelector('footer, .app-footer');
        var h = footer ? Math.ceil(footer.getBoundingClientRect().height) : 0;
        host.style.marginBottom = (h ? (h + 12) : 12) + 'px';
      } catch (_) {
        host.style.marginBottom = '12px';
      }
    }
    // Initial + on resize/orientation changes (iOS Safari quirks)
    pushAboveFooter();
    window.addEventListener('resize', pushAboveFooter);
    window.addEventListener('orientationchange', pushAboveFooter);
  }

  /* ---------------------------------------
     DOM Ready
  ----------------------------------------*/
  document.addEventListener('DOMContentLoaded', function () {
    installLogout();
    installClock();
    injectVersionAndBuildDate();
    installBackButtonFlow();
  });
})();