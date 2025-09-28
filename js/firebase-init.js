// js/firebase-init.js
// Firebase (ESM via gstatic) — Auth + Firestore (+ optional Analytics)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import {
  getAnalytics,
  isSupported as analyticsIsSupported
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-analytics.js";

// ── Your Firebase project (public web) config ───────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyA2QgzfthK3EhIyQsuX3hb4WU-i-tbFVv8",
  authDomain: "dowsonfarms-528ab.firebaseapp.com",
  projectId: "dowsonfarms-528ab",
  storageBucket: "dowsonfarms-528ab.firebasestorage.app",
  messagingSenderId: "921602446527",
  appId: "1:921602446527:web:11bc4bf326bc3dee4be20a",
  measurementId: "G-E82B957E0K"
};

// ── Init core SDKs ─────────────────────────────────────────────────────────────
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// Optional: Analytics (only if supported in this environment)
let analytics = null;
try {
  if (await analyticsIsSupported()) {
    analytics = getAnalytics(app);
  }
} catch (_) {
  // ignore analytics errors (e.g., unsupported environment)
}

// Keep sessions sticky on phones (local persistence)
try {
  await setPersistence(auth, browserLocalPersistence);
} catch (_) {
  // ignore — auth still works with default persistence
}

// Expose for the rest of the app (core.js, RBAC, etc.)
window.DF_FB = { app, auth, db, analytics };
window.DF_FB_API = {
  onAuth: (fn) => onAuthStateChanged(auth, fn),
  signOut: () => signOut(auth),
  setPersistence: async (persist = true) => {
    if (!persist) return;
    await setPersistence(auth, browserLocalPersistence);
  }
};