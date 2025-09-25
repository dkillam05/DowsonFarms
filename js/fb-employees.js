// /js/fb-employees.js  (ES module)
// Usage:
//   import {
//     listEmployees, getEmployee, saveEmployee,
//     inviteEmployee, archiveEmployee, deleteEmployee, saveAndInvite,
//     seedEmployeesPermKey
//   } from '../js/fb-employees.js';

import {
  collection, doc, getDoc, getDocs, query, where, setDoc, deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import {
  fetchSignInMethodsForEmail, sendPasswordResetEmail,
  getAuth, createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { initializeApp, deleteApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";

// ---- Handles from your firebase-init.js (already loaded globally)
const { app, auth, db } = (window.DF_FB || {});
if (!app || !auth || !db) {
  throw new Error('[fb-employees] DF_FB globals not available. Ensure ../js/firebase-init.js loads first.');
}

// ---- Config / constants
const USERS = collection(db, 'users');
const THROTTLE_MS = 10 * 60 * 1000; // 10 minutes
const PERM_KEY = "Teams & Partners › Employees"; // permanent permission key for blanket rules

// ---- Utils
const toId = (email) => String(email || '').trim().toLowerCase();
function userRef(idOrEmail) {
  const id = toId(idOrEmail);
  if (!id) throw new Error('Employee id/email is required');
  return doc(USERS, id);
}
function getPrimaryConfig() {
  const o = (app && app.options) || {};
  return {
    apiKey: o.apiKey, authDomain: o.authDomain, projectId: o.projectId,
    storageBucket: o.storageBucket, appId: o.appId,
    messagingSenderId: o.messagingSenderId, measurementId: o.measurementId
  };
}
function randPwd() {
  return crypto.getRandomValues(new Uint32Array(4)).join('-');
}
function sortByFirstLast(a, b) {
  const A1 = (a.first || '').localeCompare(b.first || '', undefined, { sensitivity: 'base' });
  if (A1 !== 0) return A1;
  return (a.last || '').localeCompare(b.last || '', undefined, { sensitivity: 'base' });
}

// ---- Core CRUD
export async function listEmployees({ includeArchived = false } = {}) {
  // Default: active only
  const qy = includeArchived
    ? query(USERS, where('type', '==', 'employee'))
    : query(USERS, where('type', '==', 'employee'), where('archived', '==', false));

  const snaps = await getDocs(qy);
  const rows = [];
  snaps.forEach(s => rows.push({ id: s.id, ...(s.data() || {}) }));
  rows.sort(sortByFirstLast); // first, then last
  return rows;
}

export async function getEmployee(idOrEmail) {
  const snap = await getDoc(userRef(idOrEmail));
  return snap.exists() ? { id: snap.id, ...(snap.data() || {}) } : null;
}

export async function saveEmployee(payload) {
  // Upsert using lowercase email as document id
  const email = toId(payload?.email);
  if (!email) throw new Error('saveEmployee: payload.email is required');

  const data = {
    id: email,
    type: 'employee',
    permKey: PERM_KEY,              // blanket-rule anchor
    archived: false,
    ...payload,
    email,
    updatedAt: serverTimestamp(),
  };

  // Preserve createdAt if doc exists
  const ref = userRef(email);
  const existing = await getDoc(ref);
  if (!existing.exists()) data.createdAt = serverTimestamp();

  await setDoc(ref, data, { merge: true });
  return email;
}

export async function archiveEmployee(idOrEmail, archived = true) {
  await setDoc(userRef(idOrEmail), {
    archived,
    permKey: PERM_KEY,              // reinforce on updates
    updatedAt: serverTimestamp()
  }, { merge: true });
}

export async function deleteEmployee(idOrEmail) {
  await deleteDoc(userRef(idOrEmail));
}

// ---- Invite (password-reset flow with secondary app so admin stays logged in)
async function ensureAuthUserAndSendReset(email) {
  const id = toId(email);
  if (!id) throw new Error('inviteEmployee: email required');

  const methods = await fetchSignInMethodsForEmail(auth, id);
  if (!methods || methods.length === 0) {
    // Create account via secondary app to avoid signing out the current admin
    const cfg = getPrimaryConfig();
    const secondary = initializeApp(cfg, 'DF-Secondary');
    try {
      const sAuth = getAuth(secondary);
      await createUserWithEmailAndPassword(sAuth, id, randPwd());
      await sendPasswordResetEmail(sAuth, id);
    } finally {
      try { await deleteApp(secondary); } catch {}
    }
  } else {
    await sendPasswordResetEmail(auth, id);
  }
}

export async function inviteEmployee(email, { throttleMs = THROTTLE_MS } = {}) {
  const id = toId(email);
  if (!id) throw new Error('inviteEmployee: email required');

  const ref = userRef(id);
  // Ensure Firestore doc exists (minimal) so app can show them immediately
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      id,
      email: id,
      type: 'employee',
      permKey: PERM_KEY,            // set on first creation
      archived: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
  }

  const data = snap.exists() ? (snap.data() || {}) : {};
  const last = Number(data.invitedAt || 0);
  const now = Date.now();
  if (last && (now - last) < throttleMs) {
    const remaining = throttleMs - (now - last);
    const e = new Error('Invite throttled; try later');
    e.code = 'throttled';
    e.msRemaining = remaining;
    throw e;
  }

  await ensureAuthUserAndSendReset(id);
  await setDoc(ref, {
    invitedAt: Date.now(),
    permKey: PERM_KEY,              // reinforce permKey on invite
    updatedAt: serverTimestamp()
  }, { merge: true });
  return true;
}

// ---- Convenience: save + auto-invite in one call
export async function saveAndInvite(payload, { throttleMs = THROTTLE_MS } = {}) {
  const id = await saveEmployee(payload);
  try {
    await inviteEmployee(id, { throttleMs });
    return { id, invited: true };
  } catch (e) {
    if (e && e.code === 'throttled') return { id, invited: false, throttled: true, msRemaining: e.msRemaining };
    throw e;
  }
}

/* =====================================================
   One-time admin helper: backfill permKey on old docs
   -----------------------------------------------------
   Use from the browser console while logged in as admin:

     await DF_seedEmployeesPermKey()

   or, if importing this module:

     await seedEmployeesPermKey()
   ===================================================== */
export async function seedEmployeesPermKey(){
  const snaps = await getDocs(query(USERS, where('type', '==', 'employee')));
  let n = 0;
  for (const s of snaps.docs) {
    const d = s.data() || {};
    if (d.permKey !== PERM_KEY) {
      await setDoc(doc(USERS, s.id), { permKey: PERM_KEY, updatedAt: serverTimestamp() }, { merge: true });
      n++;
    }
  }
  console.log(`[Employees] permKey backfilled on ${n} doc(s).`);
  return n;
}
// also expose on window for convenience
try { window.DF_seedEmployeesPermKey = seedEmployeesPermKey; } catch(_) {}