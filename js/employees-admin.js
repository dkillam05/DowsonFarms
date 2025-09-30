// js/employees-admin.js
// Matches the Employees page you installed (ids: btnAdd, btnSave, btnSaveInvite, btnDelete,
// empList, firstName, lastName, email, roles, status)

import { app, auth, db } from "./firebase-init.js";
import {
  collection, getDocs, setDoc, doc
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import {
  getFunctions, httpsCallable
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-functions.js";

// --- Elements ---------------------------------------------------------------
const statusEl   = document.getElementById("status");
const listEl     = document.getElementById("empList");
const addBtn     = document.getElementById("btnAdd");
const saveBtn    = document.getElementById("btnSave");        // note: Save alone does nothing permanent (see below)
const inviteBtn  = document.getElementById("btnSaveInvite");
const deleteBtn  = document.getElementById("btnDelete");      // not wired yet (safe no-op)

const firstInp   = document.getElementById("firstName");
const lastInp    = document.getElementById("lastName");
const emailInp   = document.getElementById("email");
const rolesSel   = document.getElementById("roles");          // <select multiple>

// --- State -----------------------------------------------------------------
let selectedUid = null;  // uid from /users collection (when you click an existing employee)

// --- Helpers ---------------------------------------------------------------
function ok(msg){ statusEl.className = "ok"; statusEl.textContent = msg; statusEl.style.display="block"; }
function err(msg){ statusEl.className = "err"; statusEl.textContent = msg; statusEl.style.display="block"; }
function clearMsg(){ statusEl.style.display="none"; }

function selectedRoleKeys(){
  return Array.from(rolesSel.selectedOptions).map(o => o.value);
}

// --- Load Roles into the dropdown ------------------------------------------
async function loadRoles(){
  rolesSel.innerHTML = "";
  const snap = await getDocs(collection(db,"roles"));
  const roles = [];
  snap.forEach(d=>{
    const r = d.data();
    const key = (r.key || d.id);
    const name = r.name || key;
    roles.push({key, name});
  });
  // sort by name
  roles.sort((a,b)=>a.name.localeCompare(b.name));
  // populate options
  roles.forEach(r=>{
    const opt = document.createElement("option");
    opt.value = r.key;
    opt.textContent = r.name;
    rolesSel.appendChild(opt);
  });
}

// --- Load employees list (from /users, real accounts only) -----------------
async function loadEmployeesList(){
  listEl.innerHTML = "";
  const snap = await getDocs(collection(db,"users"));
  const items = [];
  snap.forEach(d=>{
    const u = d.data();
    items.push({ id:d.id, first:u.firstName||u.first||"", last:u.lastName||u.last||"", email:u.email||"" });
  });
  items.sort((a,b)=> (a.first+a.last).localeCompare(b.first+b.last));

  items.forEach(it=>{
    const row = document.createElement("div");
    row.className = "list-item";
    const left = document.createElement("div");
    left.innerHTML = `<strong>${(it.first+" "+it.last).trim()||"(no name)"}</strong><br><span class="muted">${it.email}</span>`;
    const right = document.createElement("button");
    right.textContent = "Select";
    right.onclick = ()=>selectEmployee(it);
    row.appendChild(left);
    row.appendChild(right);
    listEl.appendChild(row);
  });
}

function selectEmployee(it){
  selectedUid = it.id;
  firstInp.value = it.first || "";
  lastInp.value  = it.last || "";
  emailInp.value = it.email || "";
  clearMsg();
  ok(`Selected: ${it.first||""} ${it.last||""}`);
}

// --- Add button: clear form -------------------------------------------------
function onAdd(){
  selectedUid = null;
  firstInp.value = ""; lastInp.value = ""; emailInp.value = "";
  rolesSel.selectedIndex = -1;
  clearMsg();
  ok("New employee form ready. Use “Save & Send Invite” to create the account.");
}

// --- Save button: (info only) ----------------------------------------------
// To keep things correct, we don’t permanently save without creating the Auth user.
// This button just gives guidance.
function onSave(){
  ok("To create a real account, use “Save & Send Invite”. This will create the Auth user and write /users/{uid}.");
}

// --- Invite button: create Auth user via Cloud Function + write /users/{uid}-
async function onSaveInvite(){
  clearMsg();
  const first = firstInp.value.trim();
  const last  = lastInp.value.trim();
  const email = emailInp.value.trim().toLowerCase();
  const roles = selectedRoleKeys();

  if(!email){ err("Enter an email."); return; }
  if(!roles.length){ err("Choose at least one role."); return; }

  try{
    // Call the deployed function
    const functions = getFunctions(app, "us-central1");
    const invite = httpsCallable(functions, "inviteEmployee");
    const res = await invite({ first, last, email, roles, overrides:{} });
    const uid = res?.data?.uid || res?.data?.userId || null;

    // Upsert Firestore so permissions exist on first login
    if(uid){
      await setDoc(doc(db,"users",uid), {
        firstName:first, lastName:last, email, roles,
        updatedAt: new Date()
      }, {merge:true});
    }

    ok("Invite sent. They must set a password before they can sign in.");
    await loadEmployeesList();
  }catch(e){
    console.error(e);
    err(`Invite failed: ${e?.message || e}`);
  }
}

// --- Delete button (not implemented yet) -----------------------------------
function onDelete(){
  err("Delete is not wired yet in this cut. (Safer while we’re testing.)");
}

// --- Init -------------------------------------------------------------------
(async function init(){
  await loadRoles();          // fixes the empty dropdown
  await loadEmployeesList();  // shows current users
})();

// Bind buttons
addBtn?.addEventListener("click", onAdd);
saveBtn?.addEventListener("click", onSave);
inviteBtn?.addEventListener("click", onSaveInvite);
deleteBtn?.addEventListener("click", onDelete);