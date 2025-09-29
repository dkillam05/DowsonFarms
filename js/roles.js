// /js/roles.js — Role CRUD + Role→Menu Access Matrix
import { auth, db } from "./firebase-init.js";
import {
  collection, query, orderBy, onSnapshot,
  addDoc, doc, getDoc, setDoc, updateDoc, deleteDoc,
  getDocs, where, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

/* =========================
   Helpers & DOM
========================= */
const $  = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
function toast(msg, ms = 2200) {
  const el = $("#toast"); if (!el) return;
  el.textContent = msg; el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), ms);
}
function sanitizeKey(s) { return String(s || "").trim().toLowerCase().replace(/\s+/g, "-"); }
function toDate(ts) { try { return ts?.toDate ? ts.toDate().toLocaleString() : (ts ? new Date(ts).toLocaleString() : ""); } catch { return ""; } }

const roleSelect   = $("#roleSelect");
const roleForm     = $("#roleForm");
const roleDocIdEl  = $("#roleDocId");
const roleNameEl   = $("#roleName");
const roleKeyEl    = $("#roleKey");
const roleDescEl   = $("#roleDesc");
const roleDefaultEl= $("#roleDefault");
const resetBtn     = $("#resetBtn");
const saveRoleBtn  = $("#saveRoleBtn");

const accessBody   = $("#accessBody");
const saveAccessBtn= $("#saveAccessBtn");

// Firestore refs
const rolesCol = collection(db, "roles");

/* =========================
   Build Access Matrix from menus.js
   We generate rows for every top-level and its children.
   Each row has checkboxes: view, create, edit, delete, and "all".
   Stored schema:
     roleDoc.permissionsByPath["<href>"] = { view: bool, create: bool, edit: bool, delete: bool }
========================= */
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

function renderMatrix(currentPerms = {}) {
  const rows = flattenMenus();
  accessBody.innerHTML = "";
  rows.forEach(r => {
    const perms = currentPerms[r.href] || { view:false, create:false, edit:false, delete:false };
    const tr = document.createElement("tr");
    const indentClass = r.level === 0 ? "" : r.level === 1 ? "indent-1" : "indent-2";
    tr.id = rowIdFor(r.href);
    tr.innerHTML = `
      <td class="${indentClass}">${r.icon || "•"} ${r.label} <div class="muted">${r.href}</div></td>
      <td><input type="checkbox" data-act="view"></td>
      <td><input type="checkbox" data-act="create"></td>
      <td><input type="checkbox" data-act="edit"></td>
      <td><input type="checkbox" data-act="delete"></td>
      <td><input type="checkbox" data-act="all"></td>
    `;
    accessBody.appendChild(tr);

    // set initial states
    const cb = (act) => tr.querySelector(`input[data-act="${act}"]`);
    cb("view").checked   = !!perms.view;
    cb("create").checked = !!perms.create;
    cb("edit").checked   = !!perms.edit;
    cb("delete").checked = !!perms.delete;
    cb("all").checked    = !!perms.view && !!perms.create && !!perms.edit && !!perms.delete;

    // wire "all" control
    cb("all").addEventListener("change", (e) => {
      const on = e.target.checked;
      ["view","create","edit","delete"].forEach(a => { cb(a).checked = on; });
    });

    // update "all" when any individual toggled
    ["view","create","edit","delete"].forEach(a => {
      cb(a).addEventListener("change", () => {
        cb("all").checked = ["view","create","edit","delete"].every(x => cb(x).checked);
      });
    });

    // store href so we can serialize later
    tr.dataset.href = r.href;
  });
}

/* =========================
   Load roles into selector
========================= */
function fillRoleSelector(snap) {
  const roles = [];
  snap.forEach(d => roles.push({ id: d.id, ...d.data() }));
  // sort by name
  roles.sort((a,b) => String(a.name||"").localeCompare(String(b.name||"")));
  roleSelect.innerHTML = "";
  const optNew = document.createElement("option");
  optNew.value = "__new__";
  optNew.textContent = "➕ New role…";
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
  // If currently editing a role that just got renamed, keep form as-is.
});

/* =========================
   Role select change → load details + permissions
========================= */
roleSelect.addEventListener("change", async () => {
  const val = roleSelect.value;
  if (val === "__new__") {
    clearRoleForm();
    renderMatrix({});
    return;
  }
  const ref = doc(db, "roles", val);
  const s = await getDoc(ref);
  if (!s.exists()) { toast("Role not found"); return; }
  const r = s.data();
  // populate form
  roleDocIdEl.value  = s.id;
  roleNameEl.value   = r.name || "";
  roleKeyEl.value    = r.key || "";
  roleDescEl.value   = r.description || "";
  roleDefaultEl.checked = !!r.isDefault;
  renderMatrix(r.permissionsByPath || {});
  toast("Loaded role");
});

/* =========================
   Save role (name/key/desc/default)
========================= */
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

  // If making default, unset others (best-effort)
  if (payload.isDefault) {
    try {
      const others = await getDocs(query(rolesCol, where("isDefault","==", true)));
      const updates = [];
      others.forEach(s => { if (s.id !== id) updates.push(updateDoc(doc(db,"roles",s.id), { isDefault: false, updatedAt: serverTimestamp() })); });
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
    // auto-select the new role in the dropdown
    roleSelect.value = newDoc.id;
    toast("Role created");
  }
});

/* =========================
   Save Access (matrix → permissionsByPath)
========================= */
saveAccessBtn.addEventListener("click", async () => {
  const id = roleDocIdEl.value || (roleSelect.value !== "__new__" ? roleSelect.value : "");
  if (!id) { toast("Save the role first (name/key)."); return; }

  const permsByPath = {};
  $$("#accessBody tr").forEach(tr => {
    const href = tr.dataset.href;
    if (!href) return;
    const v = tr.querySelector('input[data-act="view"]').checked;
    const c = tr.querySelector('input[data-act="create"]').checked;
    const e = tr.querySelector('input[data-act="edit"]').checked;
    const d = tr.querySelector('input[data-act="delete"]').checked;
    // Only store if anything is true (keeps docs cleaner)
    if (v || c || e || d) permsByPath[href] = { view:v, create:c, edit:e, delete:d };
  });

  await updateDoc(doc(db,"roles", id), {
    permissionsByPath: permsByPath,
    updatedAt: serverTimestamp(),
    updatedBy: auth.currentUser?.uid || null
  });

  toast("Access saved");
});

/* =========================
   Reset form
========================= */
resetBtn.addEventListener("click", (e) => { e.preventDefault(); clearRoleForm(); renderMatrix({}); });

function clearRoleForm() {
  roleDocIdEl.value = "";
  roleNameEl.value = "";
  roleKeyEl.value = "";
  roleDescEl.value = "";
  roleDefaultEl.checked = false;
}

/* =========================
   First paint
========================= */
renderMatrix({}); // blank matrix until a role is chosen