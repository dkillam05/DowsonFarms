// /js/auth-guard.js
// Guard pages so only signed-in users see them
// + temporary debug footer showing UID + roles

import { auth } from "./firebase-init.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

function showOverlay(msg) {
  let overlay = document.getElementById("authOverlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "authOverlay";
    overlay.style.position = "fixed";
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.right = 0;
    overlay.style.bottom = 0;
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
    dbg.style.position = "fixed";
    dbg.style.bottom = "0";
    dbg.style.left = "0";
    dbg.style.right = "0";
    dbg.style.background = "#eee";
    dbg.style.color = "#111";
    dbg.style.fontSize = "12px";
    dbg.style.padding = "6px 10px";
    dbg.style.borderTop = "1px solid #ccc";
    dbg.style.zIndex = 9999;
    document.body.appendChild(dbg);
  }
  dbg.textContent = `UID: ${uid || "none"} | Roles: ${roles?.join(", ") || "none"} ${uid === "wcTEMrHbY1QIknuKMKrTXV5wpu73" ? "(BUILDER ✅)" : ""}`;
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    location.href = "../auth/";
    return;
  }
  hideOverlay();

  // Load access roles for debug
  const { loadAccess } = await import("./access.js");
  const acc = await loadAccess();
  showDebug(user.uid, acc.roleKeys);
});