// js/employees-diag.js
// Creates a sticky banner that reports auth + function readiness and last error.

import { app, auth } from "./firebase-init.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFunctions } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-functions.js";

const el = document.getElementById("diagBar");
const state = {
  authed: false,
  email: null,
  uid: null,
  tokenAge: null,
  fnRegion: "us-central1",
  lastError: null
};

function show(msg, kind="ok"){
  if(!el) return;
  el.style.display = "block";
  el.className = kind;
  el.innerHTML = msg;
}

function fmt(){
  const err = state.lastError ? `<br>Last error: <code>${state.lastError.code||""}</code> ${state.lastError.message||state.lastError}` : "";
  const who = state.authed ? (state.email || state.uid) : "NOT SIGNED IN";
  const tok = state.tokenAge ? `, token age ~${Math.round(state.tokenAge/1000)}s` : "";
  return `Diag — user: <strong>${who}</strong>${tok} · functions: <code>${state.fnRegion}</code>${err}`;
}

// Public API to let other scripts push errors here
window.DF_DIAG = {
  setError(e){
    try{
      const code = e?.code || e?.error?.status || "";
      const message = e?.message || e?.error?.message || String(e);
      state.lastError = {code, message};
      show(fmt(), "err");
      console.error("[DF_DIAG]", e);
    }catch(_){}
  },
  note(msg){
    show(`Diag — ${msg}`, "ok");
  }
};

// Boot
(async function initDiag(){
  try {
    // test functions init (this will throw if app is missing)
    getFunctions(app, state.fnRegion);
  } catch(e) {
    state.lastError = e;
  }

  onAuthStateChanged(auth, async (u)=>{
    if(!u){
      state.authed = false; state.email = state.uid = null; state.tokenAge = null;
      show(fmt(), "err");
      return;
    }
    state.authed = true; state.email = u.email || null; state.uid = u.uid;
    try{
      const t0 = Date.now();
      // refresh to make sure context.auth is sent with callables
      const token = await u.getIdToken(true);
      state.tokenAge = Date.now() - t0;
      if(!token) throw new Error("no-token");
      show(fmt(), "ok");
    }catch(e){
      state.lastError = e;
      show(fmt(), "err");
    }
  });

  // initial paint
  show("Diag — warming up…", "ok");
})();
