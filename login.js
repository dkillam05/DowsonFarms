// Minimal placeholder login: accept any non-empty email + password
(function(){
  const email = document.getElementById('email');
  const pass  = document.getElementById('pass');
  const btn   = document.getElementById('signin');

  function okEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v||'').trim()); }

  btn?.addEventListener('click', ()=>{
    const e = String(email.value||'').trim();
    const p = String(pass.value||'').trim();
    if (!okEmail(e) || !p){ alert('Enter a valid email and password.'); return; }
    try {
      localStorage.setItem('df_auth','1');
      localStorage.setItem('df_user', JSON.stringify({email:e, ts:Date.now()}));
    } catch {}
    location.replace('index.html');
  });
})();