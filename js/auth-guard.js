// /js/auth-guard.js  — TEST VERSION (with debug footer)
// Base-aware redirects for GitHub Pages (uses <base href="/DowsonFarms/">)

import { auth } from "./firebase-init.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

function showOverlay(msg) {
  let overlay = document.getElementById("authOverlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "authOverlay";
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.background = "rgba(255,255,255,0.7)";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = 9999;
    overlay.innerHTML = `<div style="padding:20px;font-size:18px;font-weight:600;color:#333;">
      ${msg}<br/><br/>
      <div class="spinner" style="border:4px solid #ccc;border-top:4px solid #1B5E20;
        border-radius:50%;width:40px;height:40px;animation:spin 1s linear infinite;margin:auto"></div>
      <style>@keyframes spin {0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}</style>
    </div>`;
    document.body.appendChild(overlay);
  } else {
    overlay.querySelector("div").firstChild.nodeValue = msg;
  }
}
function hideOverlay() {
  const overlay = document.getElementById("authOverlay");
  if (overlay) overlay.remove();
}

// Temporary debug footer
function showDebug(uid, roles) {
  let dbg = document.getElementById("authDebug");
  if (!dbg) {
    dbg = document.createElement("div");
    dbg.id = "authDebug";
    Object.assign(dbg.style, {
      position: "fixed", bottom: "0", left: "0", right: "0",
      background: "#eee", color: "#111", fontSize: "12px",
      padding: "6px 10px", borderTop: "1px solid #ccc", zIndex: 9999
    });
    document.body.appendChild(dbg);
  }
  const isBuilder = uid === "wcTEMrHbY1QIknuKMKrTXV5wpu73";
  dbg.textContent = `UID: ${uid || "none"} | Roles: ${roles?.join(", ") || "none"} ${isBuilder ? "(BUILDER ✅)" : ""}`;
}

// Base-aware redirect (thanks to <base href="/DowsonFarms/"> this works from any page)
const goLogin = () => window.location.replace("auth/");

// Start with overlay visible
showOverlay("Checking sign-in…");

// Safety watchdog: if auth never answers, go to login
const watchdog = setTimeout(goLogin, 8000);

onAuthStateChanged(auth, async (user) => {
  clearTimeout(watchdog);
  if (!user) return goLogin();

  hideOverlay();

  // Load access (for the debug footer)
  try {
    const { loadAccess } = await import("./access.js");
    const acc = await loadAccess();
    showDebug(user.uid, acc.roleKeys);
  } catch (e) {
    console.warn("Access debug load failed:", e);
    showDebug(user.uid, []);
  }
}, () => {
  clearTimeout(watchdog);
  goLogin();
});