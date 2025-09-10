/* Dowson Farms — v12.0.0 clean baseline
   - Single-source VERSION below (SW gets it via ?v=VERSION)
   - Tiny router (#/home, #/login)
   - Header/footer hidden on login
   - Logout only on authenticated screens
   - Update banner when a new SW version is available
*/
(function DF_APP(){
  'use strict';
  if (window.__DF_APP_1200__) return; window.__DF_APP_1200__ = true;

  // ------- Single source of truth for version -------
  const VERSION = 'v12.0.0';
  // Make it visible to any diagnostics
  window.__DF_VERSION__ = VERSION;

  // ------- DOM helpers -------
  const $  = (s,r=document)=>r.querySelector(s);
  const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));

  // ------- Initial paint -------
  $('#version') && ($('#version').textContent = VERSION);

  // ------- Auth/session (temporary localStorage mock) -------
  const SKEY = 'df.auth.email';
  const isAuthed = ()=> !!localStorage.getItem(SKEY);
  const login = (email)=>{ localStorage.setItem(SKEY, (email||'').trim()); };
  const logout = ()=>{ localStorage.removeItem(SKEY); };

  // ------- Views -------
  function viewHome(root){
    root.innerHTML = `
      <section class="container">
        <h1>Welcome to Dowson Farms</h1>
        <p>Version: ${VERSION}</p>
        <div class="grid" style="margin-top:14px;">
          <article class="card">
            <h3>Settings</h3>
            <p>Farms & Fields (coming back step-by-step)</p>
          </article>
          <article class="card">
            <h3>Feedback</h3>
            <p>Report an issue or suggest a feature</p>
          </article>
        </div>
      </section>
    `;
  }

  function viewLogin(root){
    root.innerHTML = `
      <section class="container">
        <h1>Login</h1>
        <form id="login-form" class="grid" style="grid-template-columns:1fr auto; align-items:center;">
          <input id="login-email" type="email" placeholder="Email" autocomplete="email" />
          <div style="display:flex; gap:10px; grid-column:1/-1;">
            <input id="login-pass" type="password" placeholder="Password" autocomplete="current-password" style="flex:1;" />
            <button class="btn" type="submit" style="background:#154d23;color:#fff;">Log In</button>
          </div>
        </form>
      </section>
    `;
    $('#login-form')?.addEventListener('submit', (e)=>{
      e.preventDefault();
      const email = ($('#login-email')?.value||'').trim();
      // (placeholder auth)
      if (!email){ alert('Enter your email to continue.'); return; }
      login(email);
      location.hash = '#/home';
    });
  }

  // ------- Chrome (header/footer) toggle -------
  function setChromeVisible(visible){
    $('#site-header')?.classList.toggle('hide', !visible);
    $('#site-footer')?.classList.toggle('hide', !visible);
  }

  // ------- Router -------
  function route(){
    const hash = location.hash || '#/home';
    const app = $('#app'); if (!app) return;

    if (hash.startsWith('#/login')){
      setChromeVisible(false);
      viewLogin(app);
      return;
    }

    // any other route requires auth
    if (!isAuthed()){
      location.replace('#/login');
      setChromeVisible(false);
      viewLogin(app);
      return;
    }

    // authenticated screen
    setChromeVisible(true);
    viewHome(app);
  }

  window.addEventListener('hashchange', route);
  document.addEventListener('DOMContentLoaded', route);
  if (document.readyState !== 'loading') route();

  // Logout button (only meaningful on authed screens)
  $('#logout-btn')?.addEventListener('click', ()=>{
    logout();
    location.hash = '#/login';
  });

  // ==========================================================
  // Service Worker: single-source version + update banner
  // ==========================================================
  (function registerSW(){
    if (!('serviceWorker' in navigator)) return;

    const SW_URL = `service-worker.js?v=${encodeURIComponent(VERSION)}`;
    navigator.serviceWorker.register(SW_URL).then(reg=>{
      // If there is a waiting worker at load time → show banner
      if (reg.waiting) showUpdateBanner(reg);

      // When a new worker is found
      reg.addEventListener('updatefound', ()=>{
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener('statechange', ()=>{
          // 'installed' with an existing controller => an update is ready
          if (sw.state === 'installed' && navigator.serviceWorker.controller){
            showUpdateBanner(reg);
          }
        });
      });

      // If the active worker tells us it has taken control, we can optionally toast
      navigator.serviceWorker.addEventListener('message', (evt)=>{
        if (evt.data && evt.data.type === 'SW_ACTIVE'){
          // could log or toast evt.data.version if desired
        }
      });
    }).catch(()=>{ /* ignore */ });

    function showUpdateBanner(reg){
      if (document.getElementById('update-banner')) return;

      const bar = document.createElement('div');
      bar.id = 'update-banner';
      bar.className = 'update-banner';
      bar.innerHTML = `
        <div class="msg">New update is available.</div>
        <div class="actions">
          <button class="btn" id="upd-dismiss" type="button">Later</button>
          <button class="btn btn-primary" id="upd-reload" type="button">Refresh</button>
        </div>
      `;
      document.body.appendChild(bar);

      $('#upd-dismiss').addEventListener('click', ()=> bar.remove());
      $('#upd-reload').addEventListener('click', ()=>{
        // Ask SW to activate immediately, then reload the page
        if (reg.waiting) {
          reg.waiting.postMessage({type:'SKIP_WAITING'});
          // after controllerchange, reload
          navigator.serviceWorker.addEventListener('controllerchange', ()=>{
            location.reload();
          }, {once:true});
        } else {
          location.reload();
        }
      });
    }
  })();
})();