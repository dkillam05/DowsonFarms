// /js/firebase-init.js  (ES module, load with: <script type="module" src="../js/firebase-init.js"></script>)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged,
  signInWithEmailAndPassword, signOut,
  setPersistence, browserLocalPersistence, browserSessionPersistence,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  getFirestore, doc, setDoc, getDoc,
  collection, getDocs, query, where, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

/* --- Your Firebase config --- */
const firebaseConfig = {
  apiKey: "AIzaSyA2QgzfthK3EhIyQsuX3hb4WU-i-tbFVv8",
  authDomain: "dowsonfarms-528ab.firebaseapp.com",
  projectId: "dowsonfarms-528ab",
  // NOTE: Console usually shows ...appspot.com. If storage ever fails, switch to:
  // storageBucket: "dowsonfarms-528ab.appspot.com",
  storageBucket: "dowsonfarms-528ab.firebasestorage.app",
  messagingSenderId: "921602446527",
  appId: "1:921602446527:web:11bc4bf326bc3dee4be20a",
  measurementId: "G-E82B957E0K"
};

/* --- Init --- */
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

/* --- Expose handles globally --- */
window.DF_FB = { app, auth, db };

/* --- Minimal API used by pages --- */
window.DF_FB_API = {
  init: async () => true,

  // Auth
  signInEmail: (email, pass) => signInWithEmailAndPassword(auth, email, pass),
  signOut:     () => signOut(auth),
  onAuth:      (cb) => onAuthStateChanged(auth, cb),

  // remember=true -> local persistence (stay signed in); false -> session
  setPersistence: (remember) =>
    setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence),

  sendReset:   (email) => sendPasswordResetEmail(auth, email),

  // Firestore helpers
  saveDoc: async (path, data) => {
    const ref = doc(db, path);
    await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
    return ref;
  },
  getDoc: async (path) => {
    const snap = await getDoc(doc(db, path));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },
  list: async (colPath, whereField=null, equals=null) => {
    let qy = collection(db, colPath);
    if (whereField && equals !== null) qy = query(qy, where(whereField, "==", equals));
    const out = [];
    const snaps = await getDocs(qy);
    snaps.forEach(s => out.push({ id: s.id, ...s.data() }));
    return out;
  }
};

/* --- Reflect auth on <html data-authed> (optional) --- */
window.DF_FB_API.onAuth(user => {
  document.documentElement.dataset.authed = user ? "yes" : "no";
});

// If you want Analytics later (optional), use the CDN module like this:
// import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-analytics.js";
// const analytics = getAnalytics(app);