// js/auth-guard.js — minimal sign-in guard (no UI, no overlays, no debug)
import { auth } from "./firebase-init.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

const REDIRECT_MS = 8000;
let redirected = false;
const goLogin = () => { if (!redirected) { redirected = true; location.replace("auth/"); } };

// Safety: if Firebase auth never settles (e.g., network), redirect to login.
const watchdog = setTimeout(goLogin, REDIRECT_MS);

onAuthStateChanged(auth, (user) => {
  clearTimeout(watchdog);
  if (!user) return goLogin();
  // Signed in → do nothing. Pages that need permissions will import access.js themselves.
});