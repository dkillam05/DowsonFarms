// Firebase v10 modular init for GitHub Pages
// Exports: app, auth, db  (and analytics when supported)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-analytics.js";

// ---- Your Firebase config (keep as-is) ----
const firebaseConfig = {
  apiKey: "AIzaSyCMwaDiG3cqS4IhAsfTlxNiHDryQ94Kfvc",
  authDomain: "dowson-farms-illinois.firebaseapp.com",
  projectId: "dowson-farms-illinois",
  storageBucket: "dowson-farms-illinois.firebasestorage.app",
  messagingSenderId: "121999523233",
  appId: "1:121999523233:web:68166e99e057e287621fe0",
  measurementId: "G-4XH5S9LNC5"
};

// ---- Initialize Firebase ----
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// Analytics is optional on web; don’t crash if unsupported
(async () => {
  try {
    if (await isSupported()) getAnalytics(app);
  } catch (_) { /* no-op */ }
})();

// ---- Exports for the rest of the app ----
export { app, auth, db };