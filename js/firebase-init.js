// Firebase v10 modular init for GitHub Pages
// Exports: app, auth, db

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyCMwaDiG3cqS4IhAsfTlxNiHDryQ94Kfvc",
  authDomain: "dowson-farms-illinois.firebaseapp.com",
  projectId: "dowson-farms-illinois",
  storageBucket: "dowson-farms-illinois.firebasestorage.app",
  messagingSenderId: "121999523233",
  appId: "1:121999523233:web:68166e99e057e287621fe0",
  measurementId: "G-4XH5S9LNC5"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

(async () => {
  try { if (await isSupported()) getAnalytics(app); } catch (_) {}
})();

export { app, auth, db };