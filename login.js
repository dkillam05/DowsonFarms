// Minimal placeholder: any valid-looking email + any non-empty password.
// (Change this later to your invite-only logic.)
(function(){ try{
  const t = localStorage.getItem('df_theme') || 'auto';
  document.documentElement.setAttribute('data-theme', t);
} catch {} })();

function looksLikeEmail(e){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e||'').trim()); }

document.getElementById('login-btn')?.addEventListener('click', ()=>{
  const email = String(document.getElementById('email').value||'').trim();
  const pass  = String(document.getElementById('password').value||'').trim();
  if(!looksLikeEmail(email) || !pass){ alert('Enter a valid email and password.'); return; }
  try {
    localStorage.setItem('df_auth','1');
    localStorage.setItem('df_user', JSON.stringify({ email }));
  } catch {}
  location.replace('index.html#/home');
});

// Submit on Enter
['email','password'].forEach(id=>{
  const el = document.getElementById(id);
  el?.addEventListener('keydown', e => { if(e.key==='Enter'){ e.preventDefault(); document.getElementById('login-btn').click(); } });
});
