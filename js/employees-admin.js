// /js/employees-admin.js
// Employees admin: add/select employees (auto-ID), assign roles,
// per-employee overrides, and "Save & Send Invite" (Firebase Auth email link).

import { db, auth } from "/DowsonFarms/js/firebase-init.js";
import {
  collection, addDoc, getDocs, query, orderBy,
  doc, getDoc, setDoc, updateDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { sendSignInLinkToEmail } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

// ---------- UI refs ----------
const $ = (id)=>document.getElementById(id);
const statusBox = $('status');
const empList = $('empList');
const firstInp = $('firstName');
const lastInp  = $('lastName');
const emailInp = $('email');
const rolesSel = $('roles');
const saveBtn  = $('btnSave');
const saveInviteBtn = $('btnSaveInvite');
const addBtn   = $('btnAdd');
const delBtn   = $('btnDelete');
const refreshBtn = $('btnRefresh');
const selHint = $('selHint');
const rowsBox = $('permRows');
const saveOvBtn = $('btnSaveOverrides');
const clearOvBtn= $('btnClearOverrides');

let currentId = null; // Firestore auto-ID of the selected employee

// ---------- helpers ----------
function msg(t, ok=true){ statusBox.className = ok?'ok':'err'; statusBox.textContent=t; statusBox.style.display='block'; }
function clearMsg(){ statusBox.style.display='none'; }
const nowISO = () => new Date().toISOString();
const clean = (s)=>String(s||'').trim();
const getSelectedRoles = ()=> Array.from(rolesSel.selectedOptions||[]).map(o=>o.value);

// Build flat menu list from DF_MENUS
function gatherPaths(){
  const out=[]; const tiles=(window.DF_MENUS&&window.DF_MENUS.tiles)||[];
  tiles.forEach(t=>{
    if(t.href) out.push({label:t.label, href:t.href});
    (t.children||[]).forEach(c=>{
      if(c.href) out.push({label:`${t.label} › ${c.label}`, href:c.href});
      (c.children||[]).forEach(g=>{
        if(g.href) out.push({label:`${t.label} › ${c.label} › ${g.label}`, href:g.href});
      });
    });
  });
  return out;
}

function renderPermRows(overridesByPath={}){
  rowsBox.innerHTML='';
  const paths=gatherPaths();
  paths.forEach(p=>{
    const row=document.createElement('div'); row.className='perm-grid';
    const pr=overridesByPath[p.href]||{};
    row.innerHTML=`
      <div>${p.label}<div class="muted">${p.href}</div></div>
      <div><input type="checkbox" data-path="${p.href}" data-k="view"   ${pr.view===true?'checked':''}></div>
      <div><input type="checkbox" data-path="${p.href}" data-k="create" ${pr.create===true?'checked':''}></div>
      <div><input type="checkbox" data-path="${p.href}" data-k="edit"   ${pr.edit===true?'checked':''}></div>
      <div><input type="checkbox" data-path="${p.href}" data-k="delete" ${pr.delete===true?'checked':''}></div>
      <div><input type="checkbox" data-path="${p.href}" data-k="archive" ${pr.archive===true?'checked':''}></div>`;
    rowsBox.appendChild(row);
  });
}

function collectOverrides(){
  const map={}; rowsBox.querySelectorAll('input[type=checkbox]').forEach(i=>{
    const path=i.getAttribute('data-path'); const k=i.getAttribute('data-k');
    if(!map[path]) map[path]={view:undefined,create:undefined,edit:undefined,delete:undefined,archive:undefined};
    if(i.checked) map[path][k]=true; // only persist true (grant)
  });
  for(const k in map){
    const p=map[k];
    if(!(p.view||p.create||p.edit||p.delete||p.archive)) delete map[k];
  }
  return map;
}

// ---------- roles + employees list ----------
async function loadRoleOptions(){
  rolesSel.innerHTML='';
  const snap=await getDocs(query(collection(db,'roles'), orderBy('name')));
  snap.forEach(d=>{
    const o=document.createElement('option'); o.value=d.id; o.textContent=d.data().name||d.id;
    rolesSel.appendChild(o);
  });
}

async function loadEmployees(){
  empList.innerHTML='';
  const snap=await getDocs(query(collection(db,'users'), orderBy('lastName')));
  if(snap.empty){ empList.innerHTML='<div class="list-item"><span>No employees yet.</span></div>'; return; }
  snap.forEach(d=>{
    const u=d.data(); const li=document.createElement('div'); li.className='list-item';
    const name=[u.firstName||'',u.lastName||''].join(' ').trim()||'(No name)';
    li.innerHTML=`<div><b>${name}</b><div class="muted">${u.email||''}</div></div>
                  <div><button data-id="${d.id}">Select</button></div>`;
    empList.appendChild(li);
  });
  empList.querySelectorAll('button[data-id]').forEach(b=> b.addEventListener('click',()=>selectEmployee(b.dataset.id)));
}

async function selectEmployee(id){
  clearMsg(); currentId=id; selHint.textContent=`(selected: ${id})`;
  const s=await getDoc(doc(db,'users',id)); if(!s.exists()){ msg('Employee doc missing.', false); return; }
  const u=s.data();
  firstInp.value=u.firstName||''; lastInp.value=u.lastName||''; emailInp.value=u.email||'';
  const rset=new Set((u.roles||[]).map(String));
  Array.from(rolesSel.options).forEach(o=>o.selected=rset.has(o.value));
  renderPermRows(u.overridesByPath||{});
  msg('Loaded employee.');
}

// ---------- CRUD ----------
async function addEmployee(){
  clearMsg();
  const ref=await addDoc(collection(db,'users'), {
    firstName:null,lastName:null,email:null,roles:[],
    overridesByPath:{}, createdAt:nowISO(), updatedAt:nowISO()
  });
  await loadEmployees(); await selectEmployee(ref.id);
  msg('Employee created. Fill details, then Save or Save & Send Invite.');
}

async function saveEmployee(){
  clearMsg(); if(!currentId) return msg('Select an employee first.', false);
  const data={
    firstName: clean(firstInp.value)||null,
    lastName : clean(lastInp.value)||null,
    email    : clean(emailInp.value)||null,
    roles    : getSelectedRoles(),
    updatedAt: nowISO()
  };
  await updateDoc(doc(db,'users',currentId), data);
  await loadEmployees();
  msg('Saved.');
}

async function deleteEmployee(){
  clearMsg(); if(!currentId) return msg('Select an employee first.', false);
  if(!confirm('Delete this employee?')) return;
  await deleteDoc(doc(db,'users',currentId));
  currentId=null; selHint.textContent='(no employee selected)';
  firstInp.value=lastInp.value=emailInp.value='';
  Array.from(rolesSel.options).forEach(o=>o.selected=false);
  renderPermRows({});
  await loadEmployees();
  msg('Deleted.');
}

// ---------- overrides ----------
async function saveOverrides(){
  clearMsg(); if(!currentId) return msg('Select an employee first.', false);
  await updateDoc(doc(db,'users',currentId), { overridesByPath: collectOverrides(), updatedAt: nowISO() });
  msg('Overrides saved.');
}
async function clearOverrides(){
  clearMsg(); if(!currentId) return msg('Select an employee first.', false);
  await updateDoc(doc(db,'users',currentId), { overridesByPath: {}, updatedAt: nowISO() });
  renderPermRows({});
  msg('Overrides cleared.');
}

// ---------- Save & Send Invite (email link) with error visibility ----------
async function saveAndInvite(){
  clearMsg();
  if (!currentId) return msg('Select an employee first.', false);
  const email = clean(emailInp.value);
  if (!email) return msg('Enter an email first.', false);

  try {
    // 1) Save latest details
    await saveEmployee();

    // 2) Create an invite record (so we can apply roles on finish)
    const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    const roles = getSelectedRoles();
    await setDoc(doc(db,'invites', token), {
      email, roles, userDocId: currentId, createdAt: nowISO(), used:false
    });

    // 3) Send Firebase Auth email-link
    const actionCodeSettings = {
      url: `${location.origin}/DowsonFarms/auth/finish.html?invite=${token}`,
      handleCodeInApp: true
    };
    try { localStorage.setItem('df_invite_email', email); } catch(_) {}

    await sendSignInLinkToEmail(auth, email, actionCodeSettings);

    msg('Invite sent to ' + email);
  } catch (e) {
    const code = e?.code || '';
    const hint =
      code === 'auth/operation-not-allowed'        ? 'Enable "Email link (passwordless)" in Auth → Sign-in method.' :
      code === 'auth/invalid-continue-uri'         ? 'actionCodeSettings.url must be a valid HTTPS URL.' :
      code === 'auth/unauthorized-continue-uri'    ? 'Add dkillam05.github.io to Authorized domains (Auth → Settings).' :
      code === 'auth/too-many-requests'            ? 'Rate limited temporarily. Try again shortly.' :
      code === 'auth/invalid-email'                ? 'Email address is invalid.' :
      '';
    msg(`Invite failed: ${code || e?.message || e}. ${hint}`, false);
  }
}

// ---------- init ----------
(async function init(){
  try{
    if(!window.DF_MENUS || !Array.isArray(window.DF_MENUS.tiles)){
      msg('menus.js not loaded.', false); return;
    }
    await loadRoleOptions();
    await loadEmployees();
    renderPermRows({});

    addBtn.addEventListener('click', addEmployee);
    refreshBtn.addEventListener('click', loadEmployees);
    saveBtn.addEventListener('click', saveEmployee);
    saveInviteBtn.addEventListener('click', saveAndInvite);
    delBtn.addEventListener('click', deleteEmployee);
    saveOvBtn.addEventListener('click', saveOverrides);
    clearOvBtn.addEventListener('click', clearOverrides);

    msg('Ready. Add → fill First/Last/Email + Roles → Save & Send Invite.');
  }catch(e){
    msg('Init error: ' + (e?.message||e), false);
  }
})();