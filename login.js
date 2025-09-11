/* Dowson Farms — login.js (v12.x, compact)
   - Demo credentials (not prefilled): demo@dowsonfarms.com / Demo123
   - Password rules: >6 chars, ≥1 uppercase, ≥1 number (specials allowed)
   - Forgot password flow (demo-only success)
   - Show/Hide password toggle (eye icon)
   - iOS zoom fix (16px inputs)
   - Minimal, centered layout; header/footer hidden on login
   - Small footer with live time + long date
*/
(function DF_LOGIN_COMPACT(){
  'use strict';
  if (window.__DF_LOGIN_COMPACT__) return;
  window.__DF_LOGIN_COMPACT__ = true;

  // ---------- Config ----------
  const DEMO = { email:'demo@dowsonfarms.com', pass:'Demo123' };

  // ---------- Helpers ----------
  const $  = (s, r=document)=>r.querySelector(s);
  const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));
  const toEmail = s => String(s||'').trim().toLowerCase();
  const hasUC = s => /[A-Z]/.test(s||'');
  const hasNum = s => /\d/.test(s||'');

  function validPassword(p){ return typeof p==='string' && p.length>6 && hasUC(p) && hasNum(p); }

  // ---------- Styles ----------
  (function injectCSS(){
    if ($('#df-login-css')) return;
    const css = document.createElement('style');
    css.id = 'df-login-css';
    css.textContent = `
      /* iOS zoom prevention */
      input, select, textarea, button { font-size:16px; }

      /* Hide app chrome on login */
      .site-head, .site-foot { display:none !important; }

      /* Centered card */
      .login-wrap{ max-width: 440px; margin: 9vh auto 4vh; padding: 22px 20px;
        background:#111; border:1px solid rgba(255,255,255,.06); border-radius:14px;
        box-shadow:0 10px 30px rgba(0,0,0,.25); color:#eee; }
      body{ background:#000; }
      .login-brand{ display:flex; flex-direction:column; align-items:center; gap:8px; margin-bottom:12px; }
      .login-brand img{ width:72px; height:72px; border-radius:50%; object-fit:cover; box-shadow:0 4px 18px rgba(0,0,0,.35); }
      .login-brand .title{ font-weight:800; font-size:24px; letter-spacing:.2px; }

      .field{ margin:14px 0; }
      .label{ display:block; font-size:13px; opacity:.85; margin:0 0 6px; }
      .control{ position:relative; }
      .control input{
        width:100%; padding:12px 44px 12px 14px; border-radius:12px; border:1px solid rgba(255,255,255,.12);
        background:#1a1a1a; color:#f2f2f2; outline:none;
      }
      .control input::placeholder{ color:#a7a7a7; }
      .eye-btn{
        position:absolute; top:50%; right:10px; transform:translateY(-50%);
        width:32px; height:32px; border-radius:8px; border:0; background:#262626; color:#ddd;
      }
      .eye-btn:active{ transform:translateY(-50%) scale(.98); }

      .row{ display:flex; gap:10px; align-items:center; }
      .btn-primary{ background:#0f4d1d; color:#fff; border:0; border-radius:12px; padding:12px 16px; font-weight:700; }
      .link{ background:transparent; border:0; color:#82c08a; padding:8px 0; }
      .muted{ color:#aaa; }
      .rules{ font-size:12px; color:#bbb; margin-top:6px; }
      .error{ color:#ff5a5a; margin:8px 0 0; min-height:1.2em; }

      .login-foot{ margin: 14px auto 0; text-align:center; color:#adadad; font-weight:600; font-size:13px; }
      .login-foot .dot{ opacity:.6; margin:0 8px; }
    `;
    document.head.appendChild(css);
  })();

  // ---------- Footer clock ----------
  function longDate(d){
    try{ return d.toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric',year:'numeric'}); }
    catch{ return d.toDateString(); }
  }
  function shortTime(d){
    try{ return d.toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'}); }
    catch{ return d.toTimeString().slice(0,5); }
  }
  function startClock(){
    const dEl=$('#login-date'), tEl=$('#login-time');
    if (!dEl && !tEl) return;
    const tick=()=>{ const n=new Date(); if(dEl)dEl.textContent=longDate(n); if(tEl)tEl.textContent=shortTime(n); };
    tick(); setInterval(tick,30_000);
  }

  // ---------- Forgot password (demo-only) ----------
  function forgot(emailInput){
    const email = toEmail(emailInput?.value || '');
    if (!email) { alert('Enter your email first.'); emailInput?.focus(); return; }
    if (email !== DEMO.email) { alert('No account found for that email.'); return; }
    alert('A password reset link has been sent to your email address (demo).');
  }

  // ---------- Login handling ----------
  function bindLogin(form, emailInput, passInput, errEl){
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      errEl.textContent = '';

      const email = toEmail(emailInput.value);
      const pass  = String(passInput.value || '');

      if (!validPassword(pass)) {
        errEl.textContent = 'Password must be >6 chars and include one capital and one number.';
        passInput.focus(); return;
      }
      if (email !== DEMO.email || pass !== DEMO.pass) {
        errEl.textContent = 'These credentials are not recognized.';
        passInput.focus(); return;
      }

      try { localStorage.setItem('df_auth','1'); localStorage.setItem('df_user',email); } catch {}
      location.replace('index.html#/home?t=' + Date.now());
    });
  }

  // ---------- Eye toggle ----------
  function wireEyeToggle(btn, input){
    if (!btn || !input) return;
    const render=()=>{ btn.textContent = (input.type==='password') ? '👁️' : '🙈'; btn.setAttribute('aria-label',(input.type==='password')?'Show password':'Hide password'); };
    btn.addEventListener('click', (e)=>{ e.preventDefault(); input.type = (input.type==='password')?'text':'password'; render(); input.focus(); });
    render();
  }

  // ---------- Boot ----------
  function init(){
    const form = $('#login-form') || $('form');
    const email = $('#email') || $$('input[type="email"]')[0];
    const pass  = $('#password') || $$('input[type="password"]')[0];
    const eye   = $('#pw-eye') || $('.eye-btn');
    const forgotBtn = $('#forgotBtn') || $$('.link').find(x=>(x.textContent||'').toLowerCase().includes('forgot'));
    const errEl = $('#login-error') || (()=>{
      const el=document.createElement('div'); el.id='login-error'; el.className='error';
      form?.appendChild(el); return el;
    })();

    // If your login.html already renders the structure, we just enhance:
    if (form && email && pass){
      // do NOT prefill demo email anymore
      bindLogin(form, email, pass, errEl);
      wireEyeToggle(eye, pass);
      if (forgotBtn && !forgotBtn.dataset.dfWired){
        forgotBtn.dataset.dfWired='1';
        forgotBtn.addEventListener('click', (e)=>{ e.preventDefault(); forgot(email); });
      }
    }

    startClock();
  }

  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();