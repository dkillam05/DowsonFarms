// /js/auth-guard.js
// Global auth guard + loading overlay (spinner + blurred backdrop)
// • Redirects unauthenticated users to /auth/
// • Shows an overlay while checking auth state

import { auth } from "./firebase-init.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

/* ---------- overlay UI (injected) ---------- */
(function injectOverlay() {
  const style = document.createElement("style");
  style.textContent = `
    .df-guard-overlay {
      position: fixed; inset: 0; z-index: 99999;
      display: flex; align-items: center; justify-content: center;
      background: rgba(250, 250, 245, 0.55);
      -webkit-backdrop-filter: blur(8px);
      backdrop-filter: blur(8px);
      transition: opacity .18s ease;
    }
    .df-guard-overlay[hidden] { opacity: 0; pointer-events: none; }
    .df-guard-card {
      min-width: 220px; padding: 18px 20px; border-radius: 14px;
      background: white; border: 1px solid rgba(0,0,0,.08);
      box-shadow: 0 10px 28px rgba(0,0,0,.12);
      display: grid; gap: 10px; justify-items: center;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
      color: #222;
    }
    .df-guard-spinner {
      width: 36px; height: 36px; border-radius: 50%;
      border: 3px solid rgba(0,0,0,.12);
      border-top-color: #1B5E20;
      animation: dfspin 0.9s linear infinite;
    }
    @keyframes dfspin { to { transform: rotate(360deg); } }
    .df-guard-text { font-size: 14px; color:#444; }
  `;
  document.head.appendChild(style);

  const overlay = document.createElement("div");
  overlay.className = "df-guard-overlay";
  overlay.innerHTML = `
    <div class="df-guard-card" role="alert" aria-live="polite">
      <div class="df-guard-spinner" aria-hidden="true"></div>
      <div class="df-guard-text">Checking sign-in…</div>
    </div>
  `;
  document.body.appendChild(overlay);
})();

/* ---------- behavior ---------- */
const OVERLAY = () => document.querySelector(".df-guard-overlay");

function showOverlay(show) {
  const o = OVERLAY();
  if (!o) return;
  if (show) o.removeAttribute("hidden");
  else o.setAttribute("hidden", "");
}

// Show immediately while we check
showOverlay(true);

// Safety timeout: if Firebase never answers (e.g., blocked), send to /auth/
const watchdog = setTimeout(() => {
  showOverlay(false);
  // Use base-aware relative path (works with <base href="/DowsonFarms/">)
  window.location.replace("auth/");
}, 6000);

// Normal auth path
onAuthStateChanged(auth, (user) => {
  clearTimeout(watchdog);
  if (user) {
    // Expose the user quickly if pages want it
    window.DF = Object.assign(window.DF || {}, { user });
    showOverlay(false);
  } else {
    // Not signed in → bounce to login
    window.location.replace("auth/");
  }
}, (err) => {
  // If listener fails, treat as unauthenticated
  console.warn("Auth guard error:", err);
  clearTimeout(watchdog);
  window.location.replace("auth/");
});
