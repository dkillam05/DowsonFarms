// js/employees-admin.js
// Employees admin (Save & Send Invite via Cloud Function)

import { app, auth, db } from "./firebase-init.js";
import {
  collection, getDocs, setDoc, doc
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import {
  getFunctions, httpsCallable
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-functions.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

// ---------- DOM ----------
const statusEl  = document.getElementById("status");
const listEl    = document.getElementById("empList");
const btnAdd    = document.getElementById("btnAdd");
const btnSave   = document.getElementById("btnSave");
const btnInvite = document.getElementById("btnSaveInvite");
const btnDelete = document.getElementById("btnDelete");

const firstInp  = document.getElementById("firstName");
const lastInp   = document.getElementById("lastName");
const emailInp  = document.getElementById("email");
const rolesSel  = document.getElementById("roles"); // <select multiple>

let authedUser = null;

// ---------- UI helpers ----------
function show(cls,msg){ statusEl.className = cls; statusEl.textContent = msg; statusEl.style.display="block"; }
const ok  = (m)=>show("ok",m);
const err = (m)=>show("err",m);
const hide= ()=>{ statusEl.style.display="none"; };

const roleKeysSelected = () => Array.from(rolesSel.selectedOptions).map(o=>o.value);

function lockButtons(locked){
  [btnAdd, btnSave, btnInvite, btnDelete].forEach(b=> b && (b.disabled = locked));
}

// ---------- Data loaders ----------
async function loadRoles(){
  rolesSel.innerHTML = "";
  const snap = await getDocs(collection(db,"roles"));
  const rows = [];
  snap.forEach(d => {
    const r = d.data();
    rows.push({ key: r.key || d.id, name: r.name || (r.key || d.id) });
  });
  rows.sort((a,b)=>a.name.localeCompare(b.name));
  rows.forEach(r=>{
    const o = document.createElement("option");
    o.value = r.key; o.textContent = r.name;
    rolesSel.appendChild(o);
  });
}

async function loadEmployees(){
  listEl.innerHTML = "";
  const snap = await getDocs(collection(db,"users"));
  const rows = [];
  snap.forEach(d=>{
    const u = d.data();
    rows.push({ id:d.id, first:u.firstName||u.first||"", last:u.lastName||u.last||"", email:u.email||"" });
  });
  rows.sort((a,b)=>(a.first+a.last).localeCompare(b.first+b.last));
  rows.forEach(u=>{
    const row = document.createElement("div");
    row.className = "list-item";
    const left = document.createElement("div");
    left.innerHTML = `<strong>${(u.first+" "+u.last).trim()||"(no name)"}</strong><br><span class="muted">${u.email}</span>`;
    const sel = document.createElement("button");
    sel.textContent = "Select";
    sel.onclick = ()=>selectEmployee(u);
    row.appendChild(left); row.appendChild(sel);
    listEl.appendChild(row);
  });
}

function selectEmployee(u){
  firstInp.value = u.first || "";
  lastInp.value  = u.last  || "";
  emailInp.value = u.email || "";
  ok(`Selected: ${u.first||""} ${u.last||""}`);
}

// ---------- Form actions ----------
function onAdd(){
  firstInp.value=""; lastInp.value=""; emailInp.value="";
  rolesSel.selectedIndex = -1;
  ok("New employee. Use “Save & Send Invite”.");
}

function onSave(){
  ok("Use “Save & Send Invite” (creates Auth user and writes /users/{uid}).");
}

// Create + invite via Cloud Function
async function onInvite(){
  if(!authedUser){ err("Must be signed in."); return; }

  const first = firstInp.value.trim();
  const last  = lastInp.value.trim();
  const email = (emailInp.value || "").trim().toLowerCase();
  const roles = roleKeysSelected();

  if(!email){ err("Enter an email."); return; }
  if(roles.length===0){ err("Pick at least one role."); return; }

  try{
    // ensure fresh token so context.auth is populated in the callable
    await authedUser.getIdToken(true);

    const functions = getFunctions(app, "us-central1");
    const invite    = httpsCallable(functions, "inviteEmployee");

    const res = await invite({ first, last, email, roles, overridesByPath:{} });
    const uid = res?.data?.uid || res?.data?.userId || null;

    if(uid){
      await setDoc(doc(db,"users",uid), {
        firstName:first, lastName:last, email, roles,
        updatedAt: new Date()
      }, { merge:true });
    }

    ok("Invite sent. They’ll set a password before first login.");
    await loadEmployees();
  }catch(e){
    console.error(e);
    err(e?.message || "Invite failed.");
  }
}

function onDelete(){
  err("Delete is disabled in this test build.");
}

// ---------- Auth gate ----------
lockButtons(true);
onAuthStateChanged(auth, async (u)=>{
  authedUser = u || null;
  if(u){
    lockButtons(false);
    ok(`Signed in as ${u.email || u.uid}`);
    await loadRoles();
    await loadEmployees();
  }else{
    lockButtons(true);
    err("Must be signed in.");
  }
});

// Bind
btnAdd?.addEventListener("click", onAdd);
btnSave?.addEventListener("click", onSave);
btnInvite?.addEventListener("click", onInvite);
btnDelete?.addEventListener("click", onDelete);