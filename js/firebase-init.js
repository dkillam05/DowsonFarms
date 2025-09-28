// js/firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getAuth, setPersistence, browserLocalPersistence, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// 🔧 Replace with YOUR Firebase web config:
const firebaseConfig = {
  apiKey:      "YOUR_API_KEY",
  authDomain:  "YOUR_AUTH_DOMAIN",
  projectId:   "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:       "YOUR_APP_ID"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// Make sessions sticky on phones
try { await setPersistence(auth, browserLocalPersistence); } catch {}

window.DF_FB = { app, auth, db };
window.DF_FB_API = {
  onAuth: (fn)=> onAuthStateChanged(auth, fn),
  signOut: ()=> signOut(auth),
  setPersistence: async (persist=true)=>{
    if (!persist) return;
    await setPersistence(auth, browserLocalPersistence);
  }
};