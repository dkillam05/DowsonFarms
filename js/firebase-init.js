/* Dowson Farms — Firebase bootstrap (FULL FILE)
   Static PWA edition — loads Firebase via CDN and initializes Auth/Firestore/Storage.
*/

(function () {
  'use strict';

  // ---------------------------
  // Firebase SDK (compat builds, v10+)
  // ---------------------------
  const sdkUrls = [
    'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics-compat.js',
    'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js',
    'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js',
    'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage-compat.js'
  ];

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.defer = true;
      s.onload = resolve;
      s.onerror = () => reject(new Error('Failed to load ' + src));
      document.head.appendChild(s);
    });
  }

  async function loadFirebaseSdks() {
    for (const url of sdkUrls) { await loadScript(url); }
  }

  // ---------------------------
  // Config (your values from Firebase Console)
  // ---------------------------
  const FIREBASE_CONFIG = {
    apiKey: "AIzaSyA2QgzfthK3EhIyQsuX3hb4WU-i-tbFVv8",
    authDomain: "dowsonfarms-528ab.firebaseapp.com",
    projectId: "dowsonfarms-528ab",
    storageBucket: "dowsonfarms-528ab.firebasestorage.app",
    messagingSenderId: "921602446527",
    appId: "1:921602446527:web:11bc4bf326bc3dee4be20a",
    measurementId: "G-E82B957E0K"
  };

  // ---------------------------
  // Initialize + expose
  // ---------------------------
  async function init() {
    await loadFirebaseSdks();

    if (window.firebase?.apps?.length) {
      return window.DF_FB;
    }

    const app = firebase.initializeApp(FIREBASE_CONFIG);
    const analytics = firebase.analytics(app);
    const auth = firebase.auth();
    const db = firebase.firestore();
    const storage = firebase.storage();

    // Persist login
    try { await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL); } catch (e) {}

    // Listen for auth state
    auth.onAuthStateChanged(user => {
      window.DF_CURRENT_USER = user || null;
    });

    window.DF_FB = { app, analytics, auth, db, storage };
    return window.DF_FB;
  }

  // Run on DOM ready
  document.addEventListener('DOMContentLoaded', () => { init().catch(console.error); });

  // Expose helpers
  window.DF_FB_API = {
    init,
    signInEmail: (email, pw) => window.DF_FB.auth.signInWithEmailAndPassword(email, pw),
    signUpEmail: (email, pw) => window.DF_FB.auth.createUserWithEmailAndPassword(email, pw),
    signOut: () => window.DF_FB.auth.signOut(),
    db: () => window.DF_FB.db,
    storage: () => window.DF_FB.storage
  };
})();
