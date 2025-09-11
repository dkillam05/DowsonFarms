/* Dowson Farms — login.js (v12.x)
   - Demo credentials only: demo@dowsonfarms.com / Demo123
   - Password rules: >6 chars, ≥1 uppercase, ≥1 number (specials allowed)
   - Forgot password flow: succeeds only for the demo account
   - Prevents iOS zoom by forcing 16px input font-size
   - Hides any app header on login page; centers form
   - Shows live time + long date on the login page footer
*/

(function DF_LOGIN(){
  'use strict';
  if (window.__DF_LOGIN_INIT__) return;
  window.__DF_LOGIN_INIT__ = true;

  // ---------- Config ----------
  const DEMO = {
    email: 'demo@dowsonfarms.com',
    pass:  'Demo123'
  };

  // ---------- Tiny helpers ----------
  const $  = (s, r=document)=>r.querySelector(s);
  const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));
  const toEmail = s => String(s||'').trim().toLowerCase();

  function isValidPassword(pw){
    // > 6 characters, at least one uppercase and one digit
    if (typeof pw !== 'string') return false;
    if (pw.length <= 6) return false;
    if (!/[A-Z]/.test(pw)) return false;
    if (!/\d/.test(pw)) return false;
    return true; // special characters allowed implicitly
  }

  // ---------- Style injection (iOS zoom fix + layout tweaks) ----------
  (function injectLoginCSS(){
    if ($('#df-login-css')) return;
    const css = document.createElement('style');
    css.id = 'df-login-css';
    css.textContent = `
      /* Prevent iOS zoom-in on focus */
      input, select, textarea, button { font-size: 16px; }

      /* Optional layout polish if your login.html is bare */
      .login-wrap{
        max-width: 420px;
        margin: 8vh auto 4vh;
        padding: 18px;
        border-radius: 12px;
        background: #ffffff;
        border: 1px solid rgba(0,0,0,.08);
        box-shadow: 0 10px 30px rgba(0,0,0,.05);
      }
      .login-brand{
        display:flex; align-items:center; justify-content:center; gap:10px; margin-bottom:14px;
      }
      .login-brand img{ border-radius: 8px; width:56px; height:56px; object-fit:cover; }
      .login-brand .title{ font-weight: 800; font-size: 20px; }
      .login-actions{ display:flex; gap:10px; align-items:center; }
      .muted{ color:#666; }
      .btn-primary{ background:#0f4d1d; color:#fff; border:0; border-radius:10px; padding:10px 14px; }
      .btn{ background:#fff; border:1px solid rgba(0,0,0,.12); border-radius:10px; padding:10px 14px; }
      .field{ margin:10px 0; }
      .field input{ width:100%; padding:12px 12px; border:1px solid rgba(0,0,0,.14); border-radius:10px; }
      .login-foot{
        margin: 16px auto 0;
        text-align:center; color:#666; font-weight:600;
      }

      /* Hide main header/footer if they exist in DOM */
      body .site-head{ display:none !important; }
      /* Keep footer hidden on login pages that use the global foot */
      body .site-foot{ display:none !important; }
    `;
    document.head.appendChild(css);
  })();

  // ---------- Ensure date/time footer on login ----------
  function formatLongDate(d){
    try {
      return d.toLocaleDateString(undefined, { weekday:'long', year:'numeric', month:'long', day:'numeric' });
    } catch {
      return d.toDateString();
    }
  }
  function formatTime(d){
    try {
      return d.toLocaleTimeString(undefined, { hour:'numeric', minute:'2-digit' });
    } catch {
      return d.toTimeString().slice(0,5);
    }
  }
  function mountClock(){
    const dateEl = $('#login-date');
    const timeEl = $('#login-time');
    if (!dateEl && !timeEl) return;
    const tick = ()=>{
      const now = new Date();
      if (dateEl) dateEl.textContent = formatLongDate(now);
      if (timeEl) timeEl.textContent = formatTime(now);
    };
    tick();
    setInterval(tick, 1000 * 30); // update every 30s
  }

  // ---------- Forgot password (demo-only) ----------
  function forgotPasswordFlow(emailInput){
    const email = toEmail(emailInput?.value || '');
    if (!email) {
      alert('Enter your email first, then tap “Forgot password?”.');
      emailInput?.focus();
      return;
    }
    if (email === DEMO.email) {
      // Simulate sending email (static site)
      alert('A password reset link has been sent to your email address.');
      // Optionally, open the user’s mail app pre-filled:
      const subj = encodeURIComponent('Dowson Farms — Password Reset');
      const body = encodeURIComponent(
        'Hi,\n\nUse this demo link to reset your password:\n\nhttps://example.com/reset?token=demo\n\n(For the real app, this would be a unique, time-limited link.)\n\n— Dowson Farms'
      );
      // Only open if the user confirms; some folks don’t like mailto popups
      // window.location.href = `mailto:${DEMO.email}?subject=${subj}&body=${body}`;
    } else {
      alert('No account found for that email.');
    }
  }

  // ---------- Login handling ----------
  function handleLogin(form, emailInput, passInput){
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const email = toEmail(emailInput.value);
      const pass  = String(passInput.value || '');

      // Require demo creds
      if (email !== DEMO.email) {
        alert('Invalid login. Please check your email and password.');
        emailInput.focus();
        return;
      }
      if (pass !== DEMO.pass) {
        // Give a helpful hint if it fails the rule specifically
        if (!isValidPassword(pass)) {
          alert('Password must be more than 6 characters, include at least one capital letter and one number.');
        } else {
          alert('Invalid login. Please check your email and password.');
        }
        passInput.focus();
        return;
      }

      // Success — store session hints and go to app
      try {
        localStorage.setItem('df_auth', '1');
        localStorage.setItem('df_user', email);
      } catch {}
      // Force a “fresh” navigation so the app shell boots clean
      const target = 'index.html#' + encodeURIComponent('/home') + '&t=' + Date.now();
      location.replace(target);
    });
  }

  // ---------- Boot ----------
  function init(){
    // If your login.html already contains elements with these IDs, we bind to them.
    // If not, we enhance whatever is present (this file focuses on behavior).
    const form = $('#login-form') || $('form');
    const emailInput = $('#email') || $('#li-email') || $$('input[type="email"]')[0];
    const passInput  = $('#password') || $('#li-pass') || $$('input[type="password"]')[0];
    const forgotBtn  = $('#forgotBtn') || $$('button, a').find(x => (x.textContent||'').toLowerCase().includes('forgot'));

    // If there’s no known form structure, we do nothing (keeps this file safe).
    if (!form || !emailInput || !passInput) {
      // Still try to mount the clock if present
      mountClock();
      return;
    }

    // Pre-fill demo email to be friendly (optional)
    if (!emailInput.value) emailInput.value = DEMO.email;

    // Bind login + forgot
    handleLogin(form, emailInput, passInput);
    if (forgotBtn) {
      if (!forgotBtn.dataset.dfWired) {
        forgotBtn.dataset.dfWired = '1';
        forgotBtn.addEventListener('click', (e)=>{ e.preventDefault(); forgotPasswordFlow(emailInput); });
      }
    }

    // Clock
    mountClock();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once:true });
  } else {
    init();
  }
})();