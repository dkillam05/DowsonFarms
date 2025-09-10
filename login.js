// ===== Dowson Farms — login.js (v11.0.0) =====
(() => {
  'use strict';

  // --- Constants ---
  const KEY_AUTH = 'df_auth';
  const KEY_USER = 'df_user';
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // --- Helpers ---
  const qs  = (s, r = document) => r.querySelector(s);
  const now = () => Date.now();
  const safeSet = (k, v) => { try { localStorage.setItem(k, v); } catch {} };

  // --- Init ---
  document.addEventListener('DOMContentLoaded', () => {
    const form = qs('#login-form');
    const emailInput = qs('#login-email');
    const passInput  = qs('#login-pass');

    if (!form || !emailInput || !passInput) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const email = String(emailInput.value || '').trim();
      const pass  = String(passInput.value  || '').trim();

      if (!email || !pass) {
        alert('Please enter both email and password.');
        return;
      }
      if (!EMAIL_RE.test(email)) {
        alert('Please enter a valid email address.');
        return;
      }

      // Persist lightweight auth token + who
      safeSet(KEY_AUTH, '1');
      safeSet(KEY_USER, email);

      // Navigate to app shell (index.html) with a cache-busting param
      location.replace(`index.html?login=${now()}`);
    });
  });
})();