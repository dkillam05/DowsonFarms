// /js/fb-employees.js  (ES module)
// Usage:
//   import {
//     listEmployees, getEmployee, saveEmployee,
//     inviteEmployee, archiveEmployee, deleteEmployee, saveAndInvite,
//     writePermsForUid
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
const PERM  = collection(db, 'perm');
const THROTTLE_MS = 10 * 60 * 1000; // 10 minutes

// ---- Utils
const toId = (email) => String(email || '').trim().toLowerCase();
function userRef(idOrEmail) {
  const id = toId(idOrEmail);
  if (!id) throw new Error('Employee id/email is required');
  return doc(USERS, id);
}
function permRef(uid) {
  if (!uid) throw new Error('permRef: uid required');
  return doc(PERM, uid);
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
  await setDoc(userRef(idOrEmail), { archived, updatedAt: serverTimestamp() }, { merge: true });
}

export async function deleteEmployee(idOrEmail) {
  await deleteDoc(userRef(idOrEmail));
}

// ---- Permissions writer (optional helper you can call if you already know uid)
export async function writePermsForUid(uid, effectivePerms) {
  if (!uid) throw new Error('writePermsForUid: uid required');
  const perms = effectivePerms && typeof effectivePerms === 'object' ? effectivePerms : {};
  await setDoc(permRef(uid), { perms, updatedAt: serverTimestamp() }, { merge: true });
}

// ---- Invite (password-reset flow with secondary app so admin stays logged in)
// Returns: { uid: string|null, created: boolean }
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
      const cred = await createUserWithEmailAndPassword(sAuth, id, randPwd());
      const uid  = cred && cred.user ? cred.user.uid : null;
      await sendPasswordResetEmail(sAuth, id);
      return { uid, created: true };
    } finally {
      try { await deleteApp(secondary); } catch {}
    }
  } else {
    await sendPasswordResetEmail(auth, id);
    return { uid: null, created: false }; // Existing user — client can’t resolve uid by email
  }
}

/**
 * Invite an employee by email.
 * If `effectivePerms` is provided and a new Auth user is created,
 * this will also write /perm/{uid} with those permissions and store authUid on /users/{email}.
 */
export async function inviteEmployee(email, { throttleMs = THROTTLE_MS, effectivePerms = null } = {}) {
  const id = toId(email);
  if (!id) throw new Error('inviteEmployee: email required');

  const ref = userRef(id);
  // Ensure Firestore doc exists (minimal) so app can show them immediately
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      id, email: id, type: 'employee', archived: false,
      createdAt: serverTimestamp(), updatedAt: serverTimestamp()
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

  const res = await ensureAuthUserAndSendReset(id);

  // If we just created the Auth user, we have the uid: write perms + store uid on user doc.
  if (res && res.created && res.uid) {
    try {
      if (effectivePerms && typeof effectivePerms === 'object') {
        await writePermsForUid(res.uid, effectivePerms);
      }
      await setDoc(ref, { authUid: res.uid }, { merge: true });
    } catch (e) {
      // Non-fatal: invite should still succeed
      console.warn('[fb-employees] Could not write perms/authUid on invite:', e);
    }
  }

  await setDoc(ref, { invitedAt: Date.now(), updatedAt: serverTimestamp() }, { merge: true });
  return true;
}

/**
 * Convenience: save + auto-invite in one call
 * Accepts payload fields + optional `effectivePerms` (flattened boolean map).
 */
export async function saveAndInvite(payload, { throttleMs = THROTTLE_MS } = {}) {
  const { effectivePerms, ...core } = (payload || {});
  const id = await saveEmployee(core);
  try {
    await inviteEmployee(id, { throttleMs, effectivePerms: effectivePerms || null });
    return { id, invited: true };
  } catch (e) {
    if (e && e.code === 'throttled') return { id, invited: false, throttled: true, msRemaining: e.msRemaining };
    throw e;
  }
}