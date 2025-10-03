// js/fb-crop-types.js
// Crop Types admin (CRUD + role-aware UI)

import { auth, db } from "./firebase-init.js";
import {
  collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc,
  serverTimestamp, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { loadAccess } from "./access.js";

// ----- CONFIG -----
const PATH = "settings-setup/ss-crop-types.html";    // permission path
const COL  = "cropTypes";                            // Firestore collection

// ----- DOM -----
const form     = document.getElementById("ct-form");
const saveBtn  = document.getElementById("saveBtn");
const resetBtn = document.getElementById("resetBtn");

const fId      = document.getElementById("ctId");
const fName    = document.getElementById("ctName");
const fMoist   = document.getElementById("ctMoisture");
const fTestW   = document.getElementById("ctTestWeight");
const fColor   = document.getElementById("ctColor");

const tbody    = document.getElementById("ctTbody");
const ctCount  = document.getElementById("ctCount");

// quick toast
const toastEl  = document.getElementById("dfToast");
const toastTxt = document.getElementById("dfToastText");
function toast(msg){ if(!toastEl) return; toastTxt.textContent = msg; toastEl.classList.add("show"); setTimeout(()=>toastEl.classList.remove("show"),1600); }

// inject a tiny diag bar (kept subtle)
(function ensureDiag(){
  if(document.getElementById("diagBar")) return;
  const d = document.createElement("div");
  d.id = "diagBar";
  d.style.cssText = "font:12px ui-monospace,Menlo,Consolas,monospace;background:#fffbe7;border-bottom:1px solid #0002;padding:6px 8px;white-space:pre-wrap;display:none";
  document.body.insertBefore(d, document.body.firstChild);
})();
const diag = document.getElementById("diagBar");

let access = null;
let currentUser = null;

// ----- PERMS HELPERS -----
function can(action="view"){
  if(!access) return false;
  // Builder bypass is already inside access.can(), but keep it simple:
  try { return access.can(PATH, action); } catch { return false; }
}
function applyPermsToUI(){
  // View gate
  if(!can("view")){
    // Hide form + table, show message
    if(form) form.style.display = "none";
    if(tbody) {
      tbody.innerHTML = `<tr><td colspan="6" style="color:#a00">You do not have permission to view Crop Types.</td></tr>`;
    }
    setDiag(`User: ${currentUser?.email || currentUser?.uid}\nNO VIEW permission for ${PATH}`);
    return;
  }
  // Create/Edit/Delete buttons
  if(saveBtn) saveBtn.disabled = !(can("create") || can("edit"));
  if(resetBtn) resetBtn.disabled = false; // always allow reset
}
function setDiag(s, ok = true){
  if(!diag) return;
  diag.style.display = "block";
  diag.style.background = ok ? "#e1ede4" : "#ffe9e9";
  diag.style.color = ok ? "#2F563E" : "#a00";
  diag.textContent = s;
}

// ----- DATA -----
async function listAll(){
  const q = query(collection(db, COL), orderBy("name"));
  const snap = await getDocs(q);
  const rows = [];
  snap.forEach(d=>{
    const v = d.data();
    rows.push({ id:d.id, ...v });
  });
  renderRows(rows);
  ctCount.textContent = rows.length;
  return rows;
}

function renderRows(rows){
  if(!tbody) return;
  if(!rows.length){
    tbody.innerHTML = `<tr><td colspan="6" style="color:#4B5A58">No crop types yet.</td></tr>`;
    return;
  }
  tbody.innerHTML = "";
  rows.forEach(row=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${esc(row.name)}</td>
      <td>${fmtPct(row.desiredMoisture)}</td>
      <td>${fmtNum(row.testWeight)} lb/bu</td>
      <td><span style="display:inline-block;width:18px;height:18px;border-radius:4px;border:1px solid #0002;background:${esc(row.color||"#365E5A")}"></span> ${esc(row.color||"")}</td>
      <td>${row.updatedAt?.toDate ? row.updatedAt.toDate().toLocaleString() : ""}</td>
      <td>
        <button class="btn-edit" data-id="${row.id}">Edit</button>
        <button class="btn-del"  data-id="${row.id}" style="color:#a00">Delete</button>
      </td>
    `;
    // enable/disable actions based on perms
    const btnEdit = tr.querySelector(".btn-edit");
    const btnDel  = tr.querySelector(".btn-del");
    if(btnEdit) btnEdit.disabled = !can("edit");
    if(btnDel)  btnDel.disabled  = !can("delete");

    tbody.appendChild(tr);
  });

  // wire actions
  tbody.querySelectorAll(".btn-edit").forEach(b=>{
    b.addEventListener("click", onEdit);
  });
  tbody.querySelectorAll(".btn-del").forEach(b=>{
    b.addEventListener("click", onDelete);
  });
}

async function onEdit(ev){
  const id = ev.currentTarget.getAttribute("data-id");
  if(!id) return;
  const ref = doc(db, COL, id);
  const snap = await getDoc(ref);
  if(!snap.exists()) return;
  const v = snap.data();
  fId.value    = id;
  fName.value  = v.name || "";
  fMoist.value = v.desiredMoisture ?? "";
  fTestW.value = v.testWeight ?? "";
  fColor.value = v.color || "#365E5A";
  toast("Loaded for edit");
}

async function onDelete(ev){
  if(!can("delete")) return toast("No delete permission");
  const id = ev.currentTarget.getAttribute("data-id");
  if(!id) return;
  if(!confirm("Delete this crop type?")) return;
  await deleteDoc(doc(db, COL, id));
  toast("Deleted");
  await listAll();
  form.reset();
  fId.value = "";
}

function esc(s){ return String(s ?? "").replace(/[&<>"']/g, m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m])); }
function fmtPct(v){ return (v ?? v===0) ? `${Number(v).toFixed(1)}%` : ""; }
function fmtNum(v){ return (v ?? v===0) ? Number(v).toFixed(1) : ""; }

// ----- FORM -----
form?.addEventListener("submit", async (e)=>{
  e.preventDefault();
  const id   = fId.value.trim();
  const name = fName.value.trim();
  const dm   = Number(fMoist.value);
  const tw   = Number(fTestW.value);
  const col  = fColor.value;

  if(!name){ toast("Crop Type name required"); fName.focus(); return; }
  if(Number.isNaN(dm) || dm<0 || dm>100){ toast("Moisture must be 0–100"); fMoist.focus(); return; }
  if(Number.isNaN(tw) || tw<=0){ toast("Test weight required"); fTestW.focus(); return; }

  const payload = {
    name, desiredMoisture: dm, testWeight: tw, color: col,
    updatedAt: serverTimestamp(),
    updatedBy: currentUser?.uid || null,
    updatedByEmail: currentUser?.email || null
  };

  if(id){
    if(!can("edit")) return toast("No edit permission");
    await updateDoc(doc(db, COL, id), payload);
    toast("Updated");
  } else {
    if(!can("create")) return toast("No create permission");
    payload.createdAt = serverTimestamp();
    await addDoc(collection(db, COL), payload);
    toast("Saved");
  }

  form.reset();
  fId.value = "";
  await listAll();
});

resetBtn?.addEventListener("click", ()=>{
  form.reset(); fId.value = "";
});

// ----- BOOT -----
onAuthStateChanged(auth, async (user)=>{
  if(!user){
    setDiag("No Firebase user — please sign in.", false);
    return;
  }
  currentUser = user;

  try{
    access = await loadAccess();
    applyPermsToUI();

    if(can("view")){
      await listAll();
      const info = [
        `User: ${user.email || user.uid}`,
        `Role keys: ${JSON.stringify(access.roleKeys)}`,
        `Perms on ${PATH}: { view:${access.can(PATH,"view")}, create:${access.can(PATH,"create")}, edit:${access.can(PATH,"edit")}, delete:${access.can(PATH,"delete")} }`,
      ].join("\n");
      setDiag(info, true);
    }
  }catch(e){
    setDiag("Error loading permissions: " + e.message, false);
  }
});
