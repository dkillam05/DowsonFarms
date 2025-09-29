// /js/auth.js
// Email/Password login flow with friendly errors and redirect to /index.html

import {
  onAuthStateChanged,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { auth } from "./firebase-init.js";

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
  toggle.textContent = isPw ? "Hide" : "Show";
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  showMsg("Signing in…", "info");

  const email = emailEl.value.trim();
  const pw    = passEl.value;

  if (!email || !pw) {
    showMsg("Enter your email and password.", "error");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, pw);
    // onAuthStateChanged handles redirect
  } catch (err) {
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
