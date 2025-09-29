import { db, auth } from "/DowsonFarms/js/firebase-init.js";
import {
  collection, addDoc, getDocs, query, orderBy, doc, getDoc, setDoc, updateDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import {
  sendSignInLinkToEmail
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

// UI refs
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

let currentId = null; // Firestore auto-ID (selected employee)

function msg(t, ok=true){ statusBox.className = ok?'ok':'err'; statusBox.textContent=t; statusBox.style.display='block'; }
function clearMsg(){ statusBox.style.display='none'; }
function nowISO(){ return new Date().toISOString(); }
function getSelectedRoles(){ return Array.from(rolesSel.selectedOptions || []).map(o=>o.value); }
function clean(s){ return String(s||'').trim(); }

// Build flat menu list from DF_MENUS
function gatherPaths(){
  const out = [];
  const tiles = (window.DF_MENUS && window.DF_MENUS.tiles) ? window.DF_MENUS.tiles : [];
  tiles.forEach(t=>{
    if (t.href) out.push({label:t.label, href:t.href});
    (t.children||[]).forEach(c=>{
      if (c.href) out.push({label:`${t.label} › ${c.label}`, href:c.href});
      (c.children||[]).forEach(g=>{
        if (g.href) out.push({label:`${t.label} › ${c.label} › ${g.label}`, href:g.href});
      });
    });
  });
  return out;
}

function renderPermRows(overridesByPath = {}){
  rowsBox.innerHTML = '';
  const paths = gatherPaths();
  paths.forEach(p=>{
    const row = document.createElement('div'); row.className = 'perm-grid';
    const pr = overridesByPath[p.href] || {};
    row.innerHTML = `
      <div>${p.label} <div class="muted">${p.href}</div></div>
      <div><input type="checkbox" data-path="${p.href}" data-k="view"   ${pr.view===true?'checked':''}></div>
      <div><input type="checkbox" data-path="${p.href}" data-k="create" ${pr.create===true?'checked':''}></div>
      <div><input type="checkbox" data-path="${p.href}" data-k="edit"   ${pr.edit===true?'checked':''}></div>
      <div><input type="checkbox" data-path="${p.href}" data-k="delete" ${pr.delete===true?'checked':''}></div>
      <div><input type="checkbox" data-path="${p.href}" data-k="archive" ${pr.archive===true?'checked':''}></div>
    `;
    rowsBox.appendChild(row);
  });
}

function collectOverrides(){
  const inputs = rowsBox.querySelectorAll('input[type=checkbox]');
  const map = {};
  inputs.forEach(i=>{
    const path = i.getAttribute('data-path');
    const k = i.getAttribute('data-k');
    if (!map[path]) map[path] = {view:undefined,create:undefined,edit:undefined,delete:undefined,archive:undefined};
    if (i.checked) map[path][k] = true; // only persist true (grant)
  });
  for(const k in map){
    const p = map[k];
    if(!(p.view||p.create||p.edit||p.delete||p.archive)) delete map[k];
  }
  return map;
}

// Roles select options
async function loadRoleOptions(){
  rolesSel.innerHTML = '';
  const snap = await getDocs(query(collection(db,'roles'), orderBy('name')));
  snap.forEach(d=>{
    const name = d.data().name || d.id;
    const o = document.createElement('option'); o.value = d.id; o.textContent = name;
    rolesSel.appendChild(o);
  });
}

// Employees list
async function loadEmployees(){
  empList.innerHTML = '';
  const snap = await getDocs(query(collection(db,'users'), orderBy('lastName')));
  if (snap.empty){ empList.innerHTML = '<div class="list-item"><span>No employees yet.</span></div>'; return; }
  snap.forEach(d=>{
    const u = d.data();
    const li = document.createElement('div'); li.className='list-item';
    const name = [u.firstName||'', u.lastName||''].join(' ').trim() || '(No name)';
    const email = u.email || '';
    li.innerHTML = `<div><b>${name}</b><div class="muted">${email}</div></div>
                    <div><button data-id="${d.id}">Select</button></div>`;
    empList.appendChild(li);
  });
  empList.querySelectorAll('button[data-id]').forEach(b=>{
    b.addEventListener('click', ()=>selectEmployee(b.getAttribute('data-id')));
  });
}

async function selectEmployee(id){
  clearMsg();
  currentId = id;
  selHint.textContent = `(selected: ${id})`;
  const s = await getDoc(doc(db,'users', id));
  if (!s.exists()){ msg('Employee doc missing.', false); return; }
  const u = s.data();
  firstInp.value = u.firstName || '';
  lastInp.value  = u.lastName || '';
  emailInp.value = u.email || '';
  const rset = new Set((u.roles||[]).map(String));
  Array.from(rolesSel.options).forEach(o => o.selected = rset.has(o.value));
  renderPermRows(u.overridesByPath || {});
  msg('Loaded employee.');
}

// Add new employee (auto-ID), minimal defaults
async function addEmployee(){
  clearMsg();
  const ref = await addDoc(collection(db,'users'), {
    firstName: null, lastName: null, email: null, roles: [],
    overridesByPath: {}, createdAt: nowISO(), updatedAt: nowISO()
  });
  await loadEmployees();
  await selectEmployee(ref.id);
  msg('Employee created. Fill details and Save.');
}

// Save details/roles
async function saveEmployee(){
  clearMsg();
  if (!currentId) return msg('Select an employee first.', false);
  const data = {
    firstName: clean(firstInp.value) || null,
    lastName : clean(lastInp.value)  || null,
    email    : clean(emailInp.value) || null,
    roles    : getSelectedRoles(),
    updatedAt: nowISO()
  };
  await updateDoc(doc(db,'users', currentId), data);
  await loadEmployees();
  msg('Saved.');
}

// Delete
async function deleteEmployee(){
  clearMsg();
  if (!currentId) return msg('Select an employee first.', false);
  if (!confirm('Delete this employee?')) return;
  await deleteDoc(doc(db,'users', currentId));
  currentId = null; selHint.textContent = '(no employee selected)';
  firstInp.value = lastInp.value = emailInp.value = '';
  Array.from(rolesSel.options).forEach(o => o.selected = false);
  renderPermRows({});
  await loadEmployees();
  msg('Deleted.');
}

// Save overrides
async function saveOverrides(){
  clearMsg();
  if (!currentId) return msg('Select an employee first.', false);
  const overrides = collectOverrides();
  await updateDoc(doc(db,'users', currentId), { overridesByPath: overrides, updatedAt: nowISO() });
  msg('Overrides saved.');
}
async function clearOverrides(){
  clearMsg();
  if (!currentId) return msg('Select an employee first.', false);
  await updateDoc(doc(db,'users', currentId), { overridesByPath: {}, updatedAt: nowISO() });
  renderPermRows({});
  msg('Overrides cleared.');
}

// Save & Invite (uses the Email field of the selected employee)
async function saveAndInvite(){
  clearMsg();
  if (!currentId) return msg('Select an employee first.', false);
  const email = clean(emailInp.value);
  if (!email) return msg('Enter an email, then Save & Send Invite.', false);

  // Save latest details first
  await saveEmployee();

  // Create invite record (so we can attach roles)
  const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  const roles = getSelectedRoles();
  await setDoc(doc(db,'invites', token), {
    email, roles, userDocId: currentId, createdAt: nowISO(), used:false
  });

  // Send email link
  const actionCodeSettings = {
    url: `${location.origin}/DowsonFarms/auth/finish.html?invite=${token}`,
    handleCodeInApp: true
  };
  await sendSignInLinkToEmail(auth, email, actionCodeSettings);

  msg('Invite sent to '+email);
}

// init
(async function init(){
  try{
    if (!window.DF_MENUS || !Array.isArray(window.DF_MENUS.tiles)){
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

    msg('Ready. Add → fill details → Save or Save & Send Invite.');
  }catch(e){
    msg('Init error: ' + (e?.message || e), false);
  }
})();