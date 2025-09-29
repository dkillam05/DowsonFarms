import { db } from "/DowsonFarms/js/firebase-init.js";
import {
  collection, getDocs, query, orderBy, doc, getDoc, setDoc
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const el = (id)=>document.getElementById(id);
const statusBox = el('status'); const uidInp = el('uid'); const emailInp = el('email');
const rolesSel = el('roles'); const loadBtn = el('btnLoad'); const saveBtn = el('btnSave');

function msg(t, ok=true){ statusBox.className = ok?'ok':'err'; statusBox.textContent=t; statusBox.style.display='block'; }
function clearMsg(){ statusBox.style.display='none'; }

async function loadRoleOptions(){
  rolesSel.innerHTML = '';
  const snap = await getDocs(query(collection(db,'roles'), orderBy('name')));
  snap.forEach(d=>{
    const o = document.createElement('option');
    o.value = d.id;
    o.textContent = d.data().name || d.id;
    rolesSel.appendChild(o);
  });
}

function getSelectedRoles(){
  return Array.from(rolesSel.selectedOptions || []).map(o=>o.value);
}

async function loadUser(){
  clearMsg();
  const uid = uidInp.value.trim();
  if(!uid) return msg('Enter a UID.', false);
  const s = await getDoc(doc(db,'users',uid));
  if(!s.exists()){ msg('No user doc yet. Create one with Save.'); rolesSel.selectedIndex=-1; emailInp.value=''; return; }
  const data = s.data();
  emailInp.value = data.email || '';
  const rset = new Set((data.roles||[]).map(String));
  Array.from(rolesSel.options).forEach(o => o.selected = rset.has(o.value));
  msg('Loaded user doc.');
}

async function saveUser(){
  clearMsg();
  const uid = uidInp.value.trim();
  if(!uid) return msg('UID is required.', false);
  const roles = getSelectedRoles();
  const email = emailInp.value.trim() || null;
  await setDoc(doc(db,'users',uid), {
    uid, email, roles, updatedAt: new Date().toISOString()
  }, { merge:true });
  msg('Saved user roles.');
}

(async function init(){
  try{
    await loadRoleOptions();
    loadBtn.addEventListener('click', loadUser);
    saveBtn.addEventListener('click', saveUser);
    msg('Ready. Paste UID, select roles, Save.');
  }catch(e){
    msg('Init error: '+ (e?.message||e), false);
  }
})();
