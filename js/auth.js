// /js/auth.js
// Email/Password login flow with friendly errors and redirect to /index.html

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { collection, query, where, getDocs, limit } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { auth, db } from "./firebase-init.js";
import { showWait, hideWait } from "./wait-overlay.js";

// If already signed in, bounce to app home
onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.replace("../index.html");
  }
});

const $ = (s) => document.querySelector(s);

const form    = $("#loginForm");
const emailEl = $("#email");
const passEl  = $("#password");
const toggle  = $("#togglePassword");
const msgEl   = $("#msg");
const forgotBtn = $("#forgotPassword");

function showMsg(text, type = "info") {
  msgEl.textContent = text;
  msgEl.dataset.type = type;
  msgEl.hidden = !text;
}

toggle.addEventListener("click", (e) => {
  e.preventDefault();
  const isPw = passEl.type === "password";
  passEl.type = isPw ? "text" : "password";
  toggle.setAttribute("aria-pressed", String(isPw));
  toggle.dataset.state = isPw ? "visible" : "hidden";
  toggle.setAttribute("aria-label", isPw ? "Hide password" : "Show password");
});

async function lookupUserByEmail(email){
  const normalized = (email || "").trim().toLowerCase();
  if (!normalized) return { exists: false };
  try {
    const q = query(collection(db, "users"), where("email", "==", normalized), limit(1));
    const snap = await getDocs(q);
    return { exists: !snap.empty };
  } catch (error) {
    console.warn("Failed to verify user before password reset", error);
    return { exists: null, error };
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  showMsg("");

  const email = emailEl.value.trim();
  const pw    = passEl.value;

  if (!email || !pw) {
    showMsg("Enter your email and password.", "error");
    return;
  }

  showWait("Please wait… Loading");

  try {
    await signInWithEmailAndPassword(auth, email, pw);
    // onAuthStateChanged handles redirect
  } catch (err) {
    hideWait(0);

    let friendly = "Sign-in failed. ";
    switch (err.code) {
      case "auth/invalid-email":     friendly += "Invalid email."; break;
      case "auth/user-disabled":     friendly += "Account disabled."; break;
      case "auth/user-not-found":    friendly += "No account found."; break;
      case "auth/wrong-password":    friendly += "Incorrect password."; break;
      case "auth/too-many-requests": friendly += "Too many attempts. Try later."; break;
      default:                       friendly += err.message || "Please try again.";
    }
    showMsg(friendly, "error");
  }
});

if (forgotBtn) {
  forgotBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    showMsg("");

    const emailRaw = emailEl.value.trim();
    if (!emailRaw) {
      showMsg("Enter your email so we can send reset instructions.", "error");
      emailEl.focus();
      return;
    }

    showWait("Checking your account…");
    const { exists, error } = await lookupUserByEmail(emailRaw);

    if (exists === false) {
      hideWait(0);
      showMsg("This account isn’t active. Contact your Farm Vista administrator for access.", "error");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, emailRaw.toLowerCase());
      hideWait(0);
      const suffix = exists === null && error
        ? " If you don’t receive an email, reach out to your Farm Vista administrator."
        : "";
      showMsg("Password reset link sent! Check your email for next steps." + suffix, "info");
    } catch (err) {
      hideWait(0);
      let friendly = "Unable to send reset email. ";
      switch (err.code) {
        case "auth/invalid-email":
          friendly += "Invalid email.";
          break;
        case "auth/user-disabled":
          friendly += "Account disabled.";
          break;
        case "auth/user-not-found":
          friendly += "This account isn’t active.";
          break;
        default:
          friendly += err.message || "Please try again.";
      }
      showMsg(friendly, "error");
    }
  });
}
