// /js/firebase-init.js
// Firebase (ESM via gstatic) — Auth + safe Analytics init
// Uses your new project's config. No bundler required.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  getAnalytics,
  isSupported as analyticsIsSupported
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-analytics.js";

// ── Your Firebase config (UPDATED storageBucket to .appspot.com) ───────────────
const firebaseConfig = {
  apiKey: "AIzaSyCMwaDiG3cqS4IhAsfTlxNiHDryQ94Kfvc",
  authDomain: "dowson-farms-illinois.firebaseapp.com",
  projectId: "dowson-farms-illinois",
  storageBucket: "dowson-farms-illinois.appspot.com", // ✅ correct domain
  messagingSenderId: "121999523233",
  appId: "1:121999523233:web:68166e99e057e287621fe0",
  measurementId: "G-4XH5S9LNC5"
};

// ── Initialize ────────────────────────────────────────────────────────────────
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Persist login across refreshes/tabs
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn("Auth persistence warning:", err);
});

// Analytics (optional; only runs where supported, e.g., https pages)
analyticsIsSupported().then((ok) => {
  if (ok) getAnalytics(app);
});
