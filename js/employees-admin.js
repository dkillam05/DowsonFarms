import { db } from "/DowsonFarms/js/firebase-init.js";
import {
  collection, getDocs, query, orderBy, doc, getDoc, setDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// --- UI refs
const $ = (id)=>document.getElementById(id);
const statusBox = $('status');

const uidInp = $('uid');
const firstInp = $('firstName');
const lastInp  = $('lastName');
const emailInp = $('email');

const rolesSel = $('roles');
const saveUserBtn = $('btnSaveUser');
const loadBtn = $('btnLoad');

const inviteEmail = $('inviteEmail');
const inviteRoles = $('inviteRoles');
const inviteBtn   = $('btnInvite');
const inviteOut   = $('inviteOut');

const rowsBox = $('permRows');
const saveOvBtn = $('btnSaveOverrides');
const clearOvBtn= $('btnClearOverrides');

// --- helpers
function msg(t, ok=true){ statusBox.className = ok?'ok':'err'; statusBox.textContent=t; statusBox.style.display='block'; }
function clearMsg(){ statusBox.style.display='none'; }
function nowISO(){ return new Date().toISOString(); }

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

// collect overrides (only store true flags; omit false/undefined)
function collectOverrides(){
  const inputs = rowsBox.querySelectorAll('input[type=checkbox]');
  const map = {};
  inputs.forEach(i=>{
    const path = i.getAttribute('data-path');
    const k = i.getAttribute('data-k');
    if (!map[path]) map[path] = {view:undefined,create:undefined,edit:undefined,delete:undefined,archive:undefined};
    if (i.checked) map[path][k] = true; // only persist true
  });
  // prune empty
  for(const k in map){
    const p = map[k];
    if(!(p.view||p.create||p.edit||p.delete||p.archive)) delete map[k];
  }
  return map;
}

async function loadRoleOptions(){
  rolesSel.innerHTML = '';
  inviteRoles.innerHTML = '';
  const snap = await getDocs(query(collection(db,'roles'), orderBy('name')));
  snap.forEach(d=>{
    const name = d.data().name || d.id;
    const o1 = document.createElement('option'); o1.value = d.id; o1.textContent = name;
    const o2 = document.createElement('option'); o2.value = d.id; o2.textContent = name;
    rolesSel.appendChild(o1); inviteRoles.appendChild(o2);
  });
}

function getSelectedRoles(selectEl){
  return Array.from(selectEl.selectedOptions || []).map(o=>o.value);
}

// Load an existing user
async function loadUser(){
  clearMsg();
  const uid = uidInp.value.trim();
  if(!uid) return msg('Enter a UID to load.', false);
  const s = await getDoc(doc(db,'users',uid));
  if(!s.exists()){ msg('No user doc yet. Fill details and Save.', false); rolesSel.selectedIndex=-1; firstInp.value=''; lastInp.value=''; emailInp.value=''; renderPermRows({}); return; }
  const u = s.data();
  firstInp.value = u.firstName || '';
  lastInp.value  = u.lastName  || '';
  emailInp.value = u.email     || '';
  const rset = new Set((u.roles||[]).map(String));
  Array.from(rolesSel.options).forEach(o => o.selected = rset.has(o.value));
  renderPermRows(u.overridesByPath || {});
  msg('Loaded user.');
}

// Save user details + roles
async function saveUser(){
  clearMsg();
  const uid = uidInp.value.trim();
  if(!uid) return msg('UID is required to save a user.', false);
  const data = {
    uid,
    firstName: firstInp.value.trim() || null,
    lastName : lastInp.value.trim()  || null,
    email    : emailInp.value.trim() || null,
    roles    : getSelectedRoles(rolesSel),
    updatedAt: nowISO()
  };
  await setDoc(doc(db,'users',uid), data, { merge:true });
  msg('Saved user.');
}

// Save overrides for this user
async function saveOverrides(){
  clearMsg();
  const uid = uidInp.value.trim();
  if(!uid) return msg('Enter a UID first.', false);
  const overrides = collectOverrides();
  await setDoc(doc(db,'users',uid), { overridesByPath: overrides, updatedAt: nowISO() }, { merge:true });
  msg('Overrides saved.');
}

// Clear overrides (remove the map)
async function clearOverrides(){
  clearMsg();
  const uid = uidInp.value.trim();
  if(!uid) return msg('Enter a UID first.', false);
  await setDoc(doc(db,'users',uid), { overridesByPath: {}, updatedAt: nowISO() }, { merge:true });
  renderPermRows({});
  msg('All overrides cleared.');
}

// Create invite
function genToken(){ return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2); }
async function createInvite(){
  clearMsg();
  const email = inviteEmail.value.trim();
  if(!email) return msg('Invite email required.', false);
  const roles = getSelectedRoles(inviteRoles);
  const token = genToken();
  await setDoc(doc(db,'invites', token), {
    email, roles, createdAt: nowISO(), used:false
  });
  const link = `${location.origin}/DowsonFarms/auth/?invite=${token}`;
  inviteOut.value = `Send this link to ${email}:\n${link}`;
  msg('Invite created.');
}

// init
(async function init(){
  try{
    if (!window.DF_MENUS || !Array.isArray(window.DF_MENUS.tiles)){
      msg('menus.js not loaded.', false);
      return;
    }
    await loadRoleOptions();
    renderPermRows({});
    loadBtn.addEventListener('click', loadUser);
    saveUserBtn.addEventListener('click', saveUser);
    saveOvBtn.addEventListener('click', saveOverrides);
    clearOvBtn.addEventListener('click', clearOverrides);
    inviteBtn.addEventListener('click', createInvite);
    msg('Ready. Load or create a user, set roles, then add overrides if needed.');
  }catch(e){
    msg('Init error: '+ (e?.message||e), false);
  }
})();