// /js/auth-guard.js — with on-screen error details for access load
import { auth } from "./firebase-init.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

function showOverlay(msg) {
  let el = document.getElementById("authOverlay");
  if (!el) {
    el = document.createElement("div");
    el.id = "authOverlay";
    Object.assign(el.style, {
      position: "fixed", inset: "0", background: "rgba(255,255,255,.7)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999
    });
    el.innerHTML = `<div style="padding:20px;font-size:18px;font-weight:600;color:#333;">
      ${msg}<br/><br/>
      <div class="spinner" style="border:4px solid #ccc;border-top:4px solid #1B5E20;border-radius:50%;
        width:40px;height:40px;animation:spin 1s linear infinite;margin:auto"></div>
      <style>@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}</style>
    </div>`;
    document.body.appendChild(el);
  } else {
    el.querySelector("div").firstChild.nodeValue = msg;
  }
}
function hideOverlay(){ const el=document.getElementById("authOverlay"); if(el) el.remove(); }

function showDebug(uid, roles, errMsg) {
  let dbg = document.getElementById("authDebug");
  if (!dbg) {
    dbg = document.createElement("div");
    dbg.id = "authDebug";
    Object.assign(dbg.style, {
      position:"fixed",left:0,right:0,bottom:0,background:"#eee",color:"#111",
      fontSize:"12px",padding:"6px 10px",borderTop:"1px solid #ccc",zIndex:9999
    });
    document.body.appendChild(dbg);
  }
  const isBuilder = uid === "wcTEMrHbY1QIknuKMKrTXV5wpu73";
  let text = `UID: ${uid || "none"} | Roles: ${roles?.join(", ") || "none"} ${isBuilder ? "(BUILDER ✅)" : ""}`;
  if (errMsg) text += ` | Roles error: ${errMsg}`;
  dbg.textContent = text;
}

const goLogin = () => location.replace("auth/");
showOverlay("Checking sign-in…");
const watchdog = setTimeout(goLogin, 8000);

onAuthStateChanged(auth, async (user) => {
  clearTimeout(watchdog);
  if (!user) return goLogin();
  hideOverlay();

  try {
    // cache-bust the import in case an old 404/error is stuck
    const { loadAccess } = await import(`./access.js?v=${Date.now()}`);
    const acc = await loadAccess();
    showDebug(user.uid, acc.roleKeys);
  } catch (e) {
    console.warn("access.js import failed", e);
    const msg = e?.message || String(e);
    showDebug(user.uid, [], msg);
  }
}, () => {
  clearTimeout(watchdog);
  goLogin();
});