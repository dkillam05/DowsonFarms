/* ===========================
   /js/fb-employees.js
   Handles Employee CRUD in Firestore
   =========================== */

import {
  getFirestore, doc, getDoc, setDoc,
  collection, getDocs, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const db = window.DF_FB?.db || getFirestore();
const PERM_KEY = "df"; // marker for app-owned docs

function toId(email) {
  return (email || "").trim().toLowerCase();
}
function userRef(email) {
  return doc(db, "users", toId(email));
}

/* -------- Save / Update Employee -------- */
export async function saveEmployee(payload) {
  const email = toId(payload?.email);
  if (!email) throw new Error("saveEmployee: payload.email is required");

  // Normalize role
  const roleId = String(payload?.role || payload?.roleId || "").trim();
  const roleLabel = roleId;

  const data = {
    id: email,
    type: "employee",
    permKey: PERM_KEY,
    archived: false,

    // 🔑 store BOTH for consistency
    roleId: roleId || null,
    role: roleLabel || null,

    exceptions: payload?.exceptions || { enabled: false, grants: {} },

    first: payload?.first || "",
    last: payload?.last || "",
    phone: payload?.phone || "",
    email,

    updatedAt: serverTimestamp(),
  };

  const ref = userRef(email);
  const existing = await getDoc(ref);
  if (!existing.exists()) {
    data.createdAt = serverTimestamp();
  }

  await setDoc(ref, data, { merge: true });
  return email;
}

/* -------- Invite Employee -------- */
export async function inviteEmployee(email) {
  const id = toId(email);
  if (!id) throw new Error("inviteEmployee: email is required");

  const ref = userRef(id);
  const existing = await getDoc(ref);

  if (!existing.exists()) {
    await setDoc(ref, {
      id,
      email: id,
      type: "employee",
      permKey: PERM_KEY,
      archived: false,
      exceptions: { enabled: false, grants: {} },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else {
    await setDoc(ref, {
      permKey: PERM_KEY,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }

  return id;
}

/* -------- List Employees -------- */
export async function listEmployees() {
  const snaps = await getDocs(collection(db, "users"));
  const out = [];
  snaps.forEach((s) => {
    const d = s.data();
    if (d.type === "employee") out.push({ id: s.id, ...d });
  });
  return out;
}

/* -------- Get Employee -------- */
export async function getEmployee(email) {
  const snap = await getDoc(userRef(email));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}