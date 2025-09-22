<!-- /js/firebase-init.js -->
<script type="module">
/* =========================================================
   Dowson Farms — Firebase Bootstrap + Version Sync
   ========================================================= */

// --- Firebase SDKs (modular, loaded directly from Google CDN) ---
import { initializeApp }   from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth }         from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore }    from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// --- Firebase Project Config (from your Firebase console) ---
const firebaseConfig = {
  apiKey: "AIzaSyA2QgzfthK3EhIyQsuX3hb4WU-i-tbFVv8",
  authDomain: "dowsonfarms-528ab.firebaseapp.com",
  projectId: "dowsonfarms-528ab",
  storageBucket: "dowsonfarms-528ab.firebasestorage.app",
  messagingSenderId: "921602446527",
  appId: "1:921602446527:web:11bc4bf326bc3dee4be20a",
  measurementId: "G-E82B957E0K"
};

// --- Initialize Firebase ---
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// --- Expose handles globally for other scripts ---
window.DF_FB = { app, auth, db };

// --- Version Sync (pull from version.js) ---
const ver   = window.DF_VERSION     || "v0.0.0";
const build = window.DF_BUILD_DATE  || new Date().toLocaleString("en-US",{timeZone:"America/Chicago"});

// Inject into footer (if elements exist)
document.addEventListener("DOMContentLoaded", () => {
  const verEl   = document.getElementById("version");
  const dateEl  = document.getElementById("report-date");
  if (verEl)  verEl.textContent  = ver;
  if (dateEl) dateEl.textContent = build;
});

// Console banner
console.log(`🚀 Dowson Farms App Booted — ${ver} (${build})`);

</script>