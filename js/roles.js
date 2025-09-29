// /js/roles.js — Role CRUD + Access Matrix (View/Create/Edit/Delete/Archive)
import { auth, db } from "./firebase-init.js";
import {
  collection, query, orderBy, onSnapshot,
  addDoc, doc, getDoc, setDoc, updateDoc, deleteDoc,
  getDocs, where, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

/* ===== Helpers & DOM ===== */
const $  = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
function toast(msg, ms = 2200) {
  const el = $("#toast"); if (!el) return; el.textContent = msg; el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), ms);
}
function sanitizeKey(s) { return String(s || "").trim().toLowerCase().replace(/\s+/g, "-"); }

const roleSelect    = $("#roleSelect");
const roleForm      = $("#roleForm");
const roleDocIdEl   = $("#roleDocId");
const roleNameEl    = $("#roleName");
const roleKeyEl     = $("#roleKey");
const roleDescEl    = $("#roleDesc");
const roleDefaultEl = $("#roleDefault");
const resetBtn      = $("#resetBtn");
const saveRoleBtn   = $("#saveRoleBtn");
const deleteRoleBtn = $("#deleteRoleBtn");

const accessBody    = $("#accessBody");
const saveAccessBtn = $("#saveAccessBtn");

const rolesCol = collection(db, "roles");

/* ===== Build Access Matrix from menus.js =====
   permissionsByPath[href] = { view, create, edit, delete, archive }
*/
function flattenMenus() {
  const M = window.DF_MENUS?.tiles || [];
  const out = [];
  for (const top of M) {
    out.push({ level: 0, label: top.label, href: top.href, icon: top.iconEmoji });
    if (Array.isArray(top.children)) {
      for (const child of top.children) {
        out.push({ level: 1, label: child.label, href: child.href, icon: child.iconEmoji });
        if (Array.isArray(child.children)) {
          for (const g of child.children) {
            out.push({ level: 2, label: g.label, href: g.href, icon: g.iconEmoji });
          }
        }
      }
    }
  }
  return out;
}
function rowIdFor(href) { return "r_" + btoa(href).replace(/=+$/,''); }

function renderMatrix(current = {}) {
  const rows = flattenMenus();
  accessBody.innerHTML = "";
  rows.forEach(r => {
    const p = current[r.href] || { view:false, create:false, edit:false, delete:false, archive:false };
    const tr = document.createElement("tr");
    tr.id = rowIdFor(r.href);
    tr.dataset.href = r.href;
    const indent = r.level === 0 ? "" : r.level === 1 ? "indent-1" : "indent-2";
    tr.innerHTML = `
      <td class="${indent}">${r.icon || "•"} ${r.label}<div class="muted">${r.href}</div></td>
      <td><input type="checkbox" data-act="view"></td>
      <td><input type="checkbox" data-act="create"></td>
      <td><input type="checkbox" data-act="edit"></td>
      <td><input type="checkbox" data-act="delete"></td>
      <td><input type="checkbox" data-act="archive"></td>
      <td><input type="checkbox" data-act="all"></td>
    `;
    accessBody.appendChild(tr);

    const cb = (act) => tr.querySelector(`input[data-act="${act}"]`);
    cb("view").checked    = !!p.view;
    cb("create").checked  = !!p.create;
    cb("edit").checked    = !!p.edit;
    cb("delete").checked  = !!p.delete;
    cb("archive").checked = !!p.archive;
    cb("all").checked     = ["view","create","edit","delete","archive"].every(a => cb(a).checked);

    cb("all").addEventListener("change", (e) => {
      const on = e.target.checked;
      ["view","create","edit","delete","archive"].forEach(a => cb(a).checked = on);
    });
    ["view","create","edit","delete","archive"].forEach(a => {
      cb(a).addEventListener("change", () => {
        cb("all").checked = ["view","create","edit","delete","archive"].every(x => cb(x).checked);
      });
    });
  });
}

/* ===== Role list ===== */
function fillRoleSelector(snap) {
  const roles = [];
  snap.forEach(d => roles.push({ id: d.id, ...d.data() }));
  roles.sort((a,b) => String(a.name||"").localeCompare(String(b.name||"")));
  roleSelect.innerHTML = "";
  const optNew = document.createElement("option");
  optNew.value = "__new__"; optNew.textContent = "➕ New role…";
  roleSelect.appendChild(optNew);
  roles.forEach(r => {
    const o = document.createElement("option");
    o.value = r.id;
    o.textContent = `${r.name || r.key || r.id}`;
    roleSelect.appendChild(o);
  });
}
onSnapshot(query(rolesCol, orderBy("name","asc")), (snap) => {
  fillRoleSelector(snap);
});

/* ===== Load selected role ===== */
roleSelect.addEventListener("change", async () => {
  const val = roleSelect.value;
  if (val === "__new__") {
    clearRoleForm();
    renderMatrix({});
    return;
  }
  const ref = doc(db, "roles", val);
  const s = await getDoc(ref);
  if (!s.exists()) return toast("Role not found");
  const r = s.data();
  roleDocIdEl.value      = s.id;
  roleNameEl.value       = r.name || "";
  roleKeyEl.value        = r.key || "";
  roleDescEl.value       = r.description || "";
  roleDefaultEl.checked  = !!r.isDefault;
  renderMatrix(r.permissionsByPath || {});
  toast("Loaded role");
});

/* ===== Save role (name/key/desc/default) ===== */
roleForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = roleNameEl.value.trim();
  const key  = sanitizeKey(roleKeyEl.value);
  if (!name || !key) return toast("Enter a role name and key");

  const id   = roleDocIdEl.value;
  const payload = {
    name, key,
    description: roleDescEl.value.trim() || null,
    isDefault: roleDefaultEl.checked || false,
    updatedAt: serverTimestamp(),
    updatedBy: auth.currentUser?.uid || null
  };

  if (payload.isDefault) {
    try {
      const others = await getDocs(query(rolesCol, where("isDefault","==", true)));
      const updates = [];
      others.forEach(s => { if (s.id !== id) updates.push(updateDoc(doc(db,"roles",s.id), { isDefault:false, updatedAt: serverTimestamp() })); });
      Promise.allSettled(updates);
    } catch (err) { console.warn("Default sweep:", err); }
  }

  if (id) {
    await updateDoc(doc(db,"roles",id), payload);
    toast("Role saved");
  } else {
    payload.createdAt = serverTimestamp();
    payload.createdBy = auth.currentUser?.uid || null;
    const newDoc = await addDoc(rolesCol, { ...payload, permissionsByPath: {} });
    roleDocIdEl.value = newDoc.id;
    roleSelect.value = newDoc.id;
    toast("Role created");
  }
});

/* ===== Delete role ===== */
deleteRoleBtn.addEventListener("click", async () => {
  const id = roleDocIdEl.value || (roleSelect.value !== "__new__" ? roleSelect.value : "");
  if (!id) return toast("Pick a role first.");
  if (!confirm("Delete this role? This cannot be undone.")) return;
  await deleteDoc(doc(db,"roles",id));
  clearRoleForm();
  roleSelect.value = "__new__";
  renderMatrix({});
  toast("Role deleted");
});

/* ===== Save Access (matrix -> permissionsByPath) ===== */
saveAccessBtn.addEventListener("click", async () => {
  const id = roleDocIdEl.value || (roleSelect.value !== "__new__" ? roleSelect.value : "");
  if (!id) return toast("Save the role (name/key) first.");

  const permsByPath = {};
  $$("#accessBody tr").forEach(tr => {
    const href = tr.dataset.href; if (!href) return;
    const v = tr.querySelector('input[data-act="view"]').checked;
    const c = tr.querySelector('input[data-act="create"]').checked;
    const e = tr.querySelector('input[data-act="edit"]').checked;
    const d = tr.querySelector('input[data-act="delete"]').checked;
    const a = tr.querySelector('input[data-act="archive"]').checked;
    if (v || c || e || d || a) permsByPath[href] = { view:v, create:c, edit:e, delete:d, archive:a };
  });

  await updateDoc(doc(db,"roles", id), {
    permissionsByPath: permsByPath,
    updatedAt: serverTimestamp(),
    updatedBy: auth.currentUser?.uid || null
  });
  toast("Access saved");
});

/* ===== Reset form ===== */
resetBtn.addEventListener("click", (e) => { e.preventDefault(); clearRoleForm(); renderMatrix({}); });

function clearRoleForm() {
  roleDocIdEl.value = "";
  roleNameEl.value = "";
  roleKeyEl.value = "";
  roleDescEl.value = "";
  roleDefaultEl.checked = false;
}

/* ===== First paint ===== */
renderMatrix({});