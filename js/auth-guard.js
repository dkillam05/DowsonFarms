// js/auth-guard.js — global sign-in guard + wait overlay (no HTML edits needed)
import { auth } from "./firebase-init.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

/* ───────────────── Config (tweak as you like) ───────────────── */
const LOGIN_PATH       = "auth/";    // where to send signed-out users
const AUTH_TIMEOUT_MS  = 8000;       // if auth never settles, bail to login
const MIN_VISIBLE_MS   = 3000;       // overlay must show at least this long

/* ─────────────── Skip guard on the login pages themselves ─────────────── */
const path = location.pathname.toLowerCase();
if (path.includes("/auth/")) {
  // Do nothing on the auth pages; they manage their own UI.
  // (Important so we don't cover your login screen.)
} else {
  /* ───────────────────────── Wait overlay ───────────────────────── */
  let overlayEl = null;
  let overlayShownAt = 0;

  function injectOverlay() {
    if (overlayEl) return;
    overlayShownAt = performance.now();

    // Styles (scoped to this overlay)
    const style = document.createElement("style");
    style.textContent = `
      #dfWaitOverlay {
        position: fixed; inset: 0;
        display: flex; align-items: center; justify-content: center;
        background: rgba(20,50,49,0.42);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        z-index: 10000;
      }
      #dfWaitCard {
        display:flex; flex-direction:column; align-items:center; gap:12px;
        background: #fbf9f0; color:#143231; border-radius: 14px;
        padding: 18px 20px; min-width: 220px; box-shadow: 0 10px 30px rgba(23,52,49,0.22);
        border: 1px solid rgba(54,94,90,0.18);
        font: 14px/1.4 system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      }
      #dfSpinner {
        width: 36px; height: 36px; border-radius: 50%;
        border: 4px solid rgba(159,191,111,0.45); border-top-color: #365E5A;
        animation: dfspin 0.9s linear infinite;
      }
      @keyframes dfspin { to { transform: rotate(360deg); } }
      #dfWaitMsg { font-weight: 600; color:#365E5A; }
      #dfWaitSub { color:rgba(20,50,49,0.65); font-size:12px; }
    `;
    document.head.appendChild(style);

    // Overlay DOM
    overlayEl = document.createElement("div");
    overlayEl.id = "dfWaitOverlay";
    overlayEl.innerHTML = `
      <div id="dfWaitCard" role="status" aria-live="polite" aria-label="Please wait">
        <div id="dfSpinner"></div>
        <div id="dfWaitMsg">Please wait…</div>
        <div id="dfWaitSub">Loading</div>
      </div>
    `;
    document.body.appendChild(overlayEl);
  }

  function removeOverlayRespectingMin() {
    const elapsed = performance.now() - overlayShownAt;
    const delay = Math.max(0, MIN_VISIBLE_MS - elapsed);
    if (delay <= 0) {
      if (overlayEl) { overlayEl.remove(); overlayEl = null; }
    } else {
      setTimeout(() => {
        if (overlayEl) { overlayEl.remove(); overlayEl = null; }
      }, delay);
    }
  }

  /* ────────────────────── Auth guard + timers ────────────────────── */
  const goLogin = () => { location.replace(LOGIN_PATH); };

  // Show overlay immediately
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectOverlay, { once: true });
  } else {
    injectOverlay();
  }

  // Safety: if Firebase auth never settles, redirect to login.
  const watchdog = setTimeout(goLogin, AUTH_TIMEOUT_MS);

  onAuthStateChanged(auth, (user) => {
    clearTimeout(watchdog);
    if (!user) {
      // Not signed in → send to login
      return goLogin();
    }
    // Signed in → hide overlay (respect minimum visible time)
    removeOverlayRespectingMin();
    // No further action here; pages import access.js if they need perms.
  }, () => {
    // Error path: behave like timeout
    clearTimeout(watchdog);
    goLogin();
  });
}