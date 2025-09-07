// ===== Simple invite-only login mock =====
document.addEventListener('DOMContentLoaded', function(){
  var form = document.getElementById('login-form');
  if(!form) return;

  form.addEventListener('submit', function(e){
    e.preventDefault();
    var email = document.getElementById('email').value.trim();
    var password = document.getElementById('password').value.trim();

    if (!email || !password){
      alert('Please enter email and password.');
      return;
    }

    // Placeholder auth check
    if (email.endsWith('@dowsonfarms.com') && password === 'test123'){
      try { localStorage.setItem('df_auth', '1'); localStorage.setItem('df_user', email); } catch {}
      window.location.replace('index.html#/home');
    } else {
      alert('Invalid login. Invite-only system.');
    }
  });
});