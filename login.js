// ===== Login.js =====
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  const emailInput = document.getElementById('login-email');
  const passInput = document.getElementById('login-pass');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = String(emailInput.value||'').trim();
    const pass = String(passInput.value||'').trim();
    if (!email || !pass) return alert('Please enter both email and password.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return alert('Please enter a valid email address.');

    try {
      localStorage.setItem('df_auth','1');
      localStorage.setItem('df_user', email);
    } catch {}
    location.replace('index.html?login=' + Date.now());
  });
});