// Minimal, invite-only placeholder login.
// Any non-empty email+password succeeds. Replace with real auth later.

(function applyInitialTheme(){
  try {
    const t = localStorage.getItem('df_theme') || 'auto';
    document.documentElement.setAttribute('data-theme', t);
  } catch {}
})();

// Never show update banner logic here; app.js handles that per-page.

function looksLikeEmail(e){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e||'').trim()); }

document.getElementById('login-btn')?.addEventListener('click', ()=>{
  const email = String(document.getElementById('email').value||'').trim();
  const pass = String(document.getElementById('password').value||'').trim();
  if(!looksLikeEmail(email) || !pass){
    alert('Enter a valid email and password.');
    return;
  }
  try {
    localStorage.setItem('df_auth','1');
    localStorage.setItem('df_user', JSON.stringify({ email }));
  } catch {}
  location.replace('index.html');
});

// Allow Enter key to submit
['email','password'].forEach(id=>{
  const el = document.getElementById(id);
  if (el) el.addEventListener('keydown', e=>{
    if(e.key==='Enter'){ e.preventDefault(); document.getElementById('login-btn').click(); }
  });
});