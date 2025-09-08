// ===== Login.js =====

// Simple validation + fake auth (placeholder until real backend)
document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('login-form');
  const emailInput = document.getElementById('login-email');
  const passInput = document.getElementById('login-pass');

  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const email = String(emailInput.value || '').trim();
    const pass = String(passInput.value || '').trim();

    // --- Basic validation ---
    if (!email || !pass) {
      alert('Please enter both email and password.');
      return;
    }

    // rudimentary email check
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) {
      alert('Please enter a valid email address.');
      return;
    }

    // For now, accept any password if not empty
    // Future: verify against your employee invite system
    try {
      localStorage.setItem('df_auth', '1');
      localStorage.setItem('df_user', email);
    } catch (e) {
      console.error('Unable to save auth info', e);
    }

    // Redirect into app
    window.location.replace('index.html');
  });
});