<!-- /js/firebase.js -->
<script type="module">
// Firebase SDKs (modular, from Google CDN)
import { initializeApp }   from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth }         from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getFirestore }    from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// === YOUR CONFIG (from your message) ===
const firebaseConfig = {
  apiKey: "AIzaSyA2QgzfthK3EhIyQsuX3hb4WU-i-tbFVv8",
  authDomain: "dowsonfarms-528ab.firebaseapp.com",
  projectId: "dowsonfarms-528ab",
  storageBucket: "dowsonfarms-528ab.firebasestorage.app",
  messagingSenderId: "921602446527",
  appId: "1:921602446527:web:11bc4bf326bc3dee4be20a",
  measurementId: "G-E82B957E0K"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// Expose for pages
window.DF_FB = { app, auth, db };
</script>
