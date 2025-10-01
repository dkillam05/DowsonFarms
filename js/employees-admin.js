// js/employees-admin.js
import { app, auth, db } from "./firebase-init.js";
import { collection, getDocs, setDoc, doc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-functions.js";
import { onAuthStateChanged, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

// UI refs
const statusEl  = document.getElementById("status");
const listEl    = document.getElementById("empList");
const btnAdd    = document.getElementById("btnAdd");
const btnRefresh= document.getElementById("btnRefresh");
const btnSave   = document.getElementById("btnSave");
const btnInvite = document.getElementById("btnSaveInvite");
const btnDelete = document.getElementById("btnDelete");
const firstInp  = document.getElementById("firstName");
const lastInp   = document.getElementById("lastName");
const emailInp  = document.getElementById("email");
const rolesSel  = document.getElementById("roles");

const DIAG = window.DF_DIAG || { setError:()=>{}, note:()=>{} };
let authedUser = null;

const show = (cls,msg)=>{ statusEl.className = cls; statusEl.textContent = msg; statusEl.style.display="block"; };
const ok  = (m)=>show("ok",m);
const err = (m)=>show("err",m);
const hide= ()=>{ statusEl.style.display="none"; };
const lockButtons = (locked)=>[btnAdd,btnRefresh,btnSave,btnInvite,btnDelete].forEach(b=>b && (b.disabled=locked));
const selectedRoles = ()=> Array.from(rolesSel.selectedOptions).map(o=>o.value);

async function loadRoles(){
  rolesSel.innerHTML = "";
  const snap = await getDocs(collection(db,"roles"));
  const arr=[];
  snap.forEach(d=>{ const r=d.data(); arr.push({key:r.key||d.id, name:r.name||r.key||d.id}); });
  arr.sort((a,b)=>a.name.localeCompare(b.name));
  arr.forEach(r=>{ const o=document.createElement("option"); o.value=r.key; o.textContent=r.name; rolesSel.appendChild(o); });
}

async function loadEmployees(){
  listEl.innerHTML = "";
  const snap = await getDocs(collection(db,"users"));
  const rows=[];
  snap.forEach(d=>{ const u=d.data(); rows.push({id:d.id, first:u.firstName||u.first||"", last:u.lastName||u.last||"", email:u.email||""}); });
  rows.sort((a,b)=>(a.first+a.last).localeCompare(b.first+b.last));
  rows.forEach(u=>{
    const row=document.createElement("div"); row.className="list-item";
    const left=document.createElement("div");
    left.innerHTML = `<strong>${(u.first+" "+u.last).trim()||"(no name)"}</strong><br><span class="muted">${u.email}</span>`;
    const sel=document.createElement("button"); sel.textContent="Select"; sel.onclick=()=>selectEmployee(u);
    row.appendChild(left); row.appendChild(sel); listEl.appendChild(row);
  });
}

function selectEmployee(u){
  firstInp.value=u.first||""; lastInp.value=u.last||""; emailInp.value=u.email||"";
  ok(`Selected: ${u.first||""} ${u.last||""}`);
}

function onAdd(){ firstInp.value=""; lastInp.value=""; emailInp.value=""; rolesSel.selectedIndex=-1; ok("New employee. Use “Save & Send Invite”."); }
function onSave(){ ok("Use “Save & Send Invite” (creates Auth user and writes /users/{uid})."); }
async function onRefresh(){ await loadEmployees(); ok("List refreshed."); }

async function onInvite(){
  hide();
  if(!authedUser){ err("Must be signed in."); return; }

  const first = firstInp.value.trim();
  const last  = lastInp.value.trim();
  const email = (emailInp.value||"").trim().toLowerCase();
  const roles = selectedRoles();
  if(!email){ err("Enter an email."); return; }
  if(!roles.length){ err("Pick at least one role."); return; }

  try{
    await authedUser.getIdToken(true);

    // 1) Create user + seed Firestore (Cloud Function)
    const inviteFn = httpsCallable(getFunctions(app,"us-central1"), "inviteEmployee");
    const res = await inviteFn({ first, last, email, roles, overridesByPath:{} });
    const uid = res?.data?.uid;

    if(uid){
      await setDoc(doc(db,"users",uid), {
        firstName:first, lastName:last, email, roles, updatedAt: new Date()
      }, { merge:true });
    }

    // 2) SEND EMAIL (this is the missing piece)
    // Firebase sends the reset email using your Auth templates.
    const actionCodeSettings = {
      url: "https://dkillam05.github.io/DowsonFarms/auth/post-reset.html",
      handleCodeInApp: false
    };
    await sendPasswordResetEmail(auth, email, actionCodeSettings);

    ok("Invite email sent. They must set a password before first login.");
    DIAG.note("inviteEmployee + sendPasswordResetEmail OK");
    await loadEmployees();
  }catch(e){
    console.error("Invite failed", e);
    err(e?.message || "Invite failed.");
    DIAG.setError(e);
  }
}

lockButtons(true);
onAuthStateChanged(auth, async (u)=>{
  authedUser = u || null;
  if(u){
    lockButtons(false);
    ok(`Signed in as ${u.email || u.uid}`);
    try{ await loadRoles(); await loadEmployees(); } catch(e){ DIAG.setError(e); }
  }else{
    lockButtons(true);
    err("Must be signed in.");
  }
});

btnAdd?.addEventListener("click", onAdd);
btnRefresh?.addEventListener("click", onRefresh);
btnSave?.addEventListener("click", onSave);
btnInvite?.addEventListener("click", onInvite);
btnDelete?.addEventListener("click", ()=>err("Delete disabled in test build."));