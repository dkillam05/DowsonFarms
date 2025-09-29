// /js/roles.js
// Firestore-backed Roles manager (CRUD) for Dowson Farms
import { auth, db } from "./firebase-init.js";
import {
  collection, query, orderBy, onSnapshot,
  addDoc, doc, setDoc, updateDoc, deleteDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

/* ---------- UI helpers ---------- */
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
function toast(msg, ms = 2200) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), ms);
}
function toDate(ts) {
  try {
    if (!ts) return "";
    if (ts.toDate) return ts.toDate().toLocaleString();
    return new Date(ts).toLocaleString();
  } catch { return ""; }
}

/* ---------- Elements ---------- */
const roleForm   = $("#roleForm");
const roleIdEl   = $("#roleId");
const roleNameEl = $("#roleName");
const roleKeyEl  = $("#roleKey");
const roleDescEl = $("#roleDesc");
const roleDefaultEl = $("#roleDefault");
const formTitleEl = $("#formTitle");
const saveBtn    = $("#saveBtn");
const resetBtn   = $("#resetBtn");

const p_viewReports    = $("#p_viewReports");
const p_editEmployees  = $("#p_editEmployees");
const p_manageFarms    = $("#p_manageFarms");
const p_manageInventory= $("#p_manageInventory");
const p_isAdmin        = $("#p_isAdmin");

const tbody = $("#rolesTbody");

/* ---------- Load table live ---------- */
const rolesRef = collection(db, "roles");
const q = query(rolesRef, orderBy("name", "asc"));

onSnapshot(q, (snap) => {
  tbody.innerHTML = "";
  snap.forEach(docSnap => {
    const r = docSnap.data();
    const tr = document.createElement("tr");

    const flags = [];
    if (r.permissions?.isAdmin) flags.push("Admin");
    if (r.permissions?.viewReports) flags.push("View");
    if (r.permissions?.editEmployees) flags.push("Employees");
    if (r.permissions?.manageFarms) flags.push("Farms");
    if (r.permissions?.manageInventory) flags.push("Inventory");
    if (r.isDefault) flags.push("Default");

    tr.innerHTML = `
      <td>${r.name || ""}</td>
      <td><code>${r.key || ""}</code></td>
      <td>${flags.map(f => `<span class="pill">${f}</span>`).join(" ")}</td>
      <td>${toDate(r.updatedAt)}</td>
      <td>
        <div class="row" style="gap:6px;">
          <button class="btn secondary" data-edit="${docSnap.id}">Edit</button>
          <button class="btn danger" data-del="${docSnap.id}">Delete</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
});

/* ---------- Handlers: edit/delete ---------- */
tbody.addEventListener("click", async (e) => {
  const t = e.target;
  if (t.dataset.edit) {
    const id = t.dataset.edit;
    // Fetch current (we could also use doc data we already have via the snapshot,
    // but for simplicity we just read it again with a local cache hit)
    const ref = doc(db, "roles", id);
    const { getDoc } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js");
    const snap = await getDoc(ref);
    if (!snap.exists()) return toast("Role not found");
    const r = snap.data();

    roleIdEl.value = id;
    roleNameEl.value = r.name || "";
    roleKeyEl.value = r.key || "";
    roleDescEl.value = r.description || "";
    roleDefaultEl.checked = !!r.isDefault;

    p_isAdmin.checked         = !!r.permissions?.isAdmin;
    p_viewReports.checked     = !!r.permissions?.viewReports;
    p_editEmployees.checked   = !!r.permissions?.editEmployees;
    p_manageFarms.checked     = !!r.permissions?.manageFarms;
    p_manageInventory.checked = !!r.permissions?.manageInventory;

    formTitleEl.textContent = "Edit Role";
    saveBtn.textContent = "Update Role";
    toast("Loaded role for editing");
  }

  if (t.dataset.del) {
    const id = t.dataset.del;
    const ok = confirm("Delete this role? This cannot be undone.");
    if (!ok) return;
    await deleteDoc(doc(db, "roles", id));
    toast("Role deleted");
    // If you want to prevent deleting a default role or roles in use,
    // add checks here later.
  }
});

/* ---------- Save (create/update) ---------- */
roleForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = roleNameEl.value.trim();
  const key  = roleKeyEl.value.trim().toLowerCase();
  if (!name || !key) {
    toast("Enter a role name and key");
    return;
  }

  const payload = {
    name,
    key,
    description: roleDescEl.value.trim() || null,
    isDefault: roleDefaultEl.checked || false,
    permissions: {
      isAdmin:         p_isAdmin.checked,
      viewReports:     p_viewReports.checked,
      editEmployees:   p_editEmployees.checked,
      manageFarms:     p_manageFarms.checked,
      manageInventory: p_manageInventory.checked
    },
    updatedAt: serverTimestamp(),
    updatedBy: auth.currentUser ? auth.currentUser.uid : null
  };

  const id = roleIdEl.value;

  // If making a role default, unset previous defaults in a simple best-effort step
  if (payload.isDefault) {
    // Async fire-and-forget sweep; not critical to await
    try {
      const { getDocs, where } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js");
      const others = await getDocs(query(rolesRef, where("isDefault", "==", true)));
      const updates = [];
      others.forEach(s => {
        if (s.id !== id) updates.push(updateDoc(doc(db, "roles", s.id), { isDefault: false, updatedAt: serverTimestamp() }));
      });
      Promise.allSettled(updates);
    } catch (err) {
      console.warn("Default role sweep warning:", err);
    }
  }

  if (id) {
    await updateDoc(doc(db, "roles", id), payload);
    toast("Role updated");
  } else {
    payload.createdAt = serverTimestamp();
    payload.createdBy = auth.currentUser ? auth.currentUser.uid : null;
    await addDoc(rolesRef, payload);
    toast("Role created");
  }

  clearForm();
});

/* ---------- Reset form ---------- */
resetBtn.addEventListener("click", (e) => { e.preventDefault(); clearForm(); });

function clearForm() {
  roleIdEl.value = "";
  roleNameEl.value = "";
  roleKeyEl.value = "";
  roleDescEl.value = "";
  roleDefaultEl.checked = false;

  p_isAdmin.checked = false;
  p_viewReports.checked = false;
  p_editEmployees.checked = false;
  p_manageFarms.checked = false;
  p_manageInventory.checked = false;

  formTitleEl.textContent = "Create Role";
  saveBtn.textContent = "Save Role";
}
