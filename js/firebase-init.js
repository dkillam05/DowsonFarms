<!-- Include on every page that needs Firebase, BEFORE core.js -->
<script type="module">
  // Firebase Web SDK (modular). No build tools needed.
  // NOTE: You MUST replace the firebaseConfig values with your own from Firebase console.
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
  import {
    getAuth, onAuthStateChanged, signInWithEmailAndPassword,
    signOut, setPersistence, browserLocalPersistence
  } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
  import {
    getFirestore, doc, setDoc, getDoc, collection, getDocs, query, where, serverTimestamp
  } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

  const firebaseConfig = {
    apiKey:        "YOUR_API_KEY",
    authDomain:    "YOUR_PROJECT_ID.firebaseapp.com",
    projectId:     "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId:         "YOUR_APP_ID"
  };

  // Init
  const app  = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db   = getFirestore(app);

  // Persist login across tabs/sessions
  await setPersistence(auth, browserLocalPersistence);

  // Expose minimal helpers globally so your existing core.js can call them.
  window.dfFirebase = {
    auth,
    db,

    // AUTH
    signIn: async (email, password) => {
      return signInWithEmailAndPassword(auth, email, password);
    },
    signOut: async () => {
      return signOut(auth);
    },
    onAuth: (cb) => onAuthStateChanged(auth, cb),

    // DATA
    // upsert a document and attach serverTimestamp on 'updatedAt'
    saveDoc: async (path, data) => {
      const ref = doc(db, path);
      await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
      return ref;
    },
    getDoc: async (path) => {
      const snap = await getDoc(doc(db, path));
      return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    },
    // simple list helper: list all docs in a collection, optional where equals
    list: async (colPath, whereField=null, equals=null) => {
      let qy = collection(db, colPath);
      if (whereField && equals !== null) {
        qy = query(qy, where(whereField, "==", equals));
      }
      const out = [];
      const snaps = await getDocs(qy);
      snaps.forEach(s => out.push({ id: s.id, ...s.data() }));
      return out;
    }
  };

  // Optional: reflect auth state so your UI can react without changing core.js
  window.dfFirebase.onAuth(user => {
    document.documentElement.dataset.authed = user ? "yes" : "no";
    // If your existing logout button calls some core.js code,
    // it can now also call: window.dfFirebase.signOut()
  });
</script>
