// roles-admin.js — simple roles CRUD + permission matrix
import { db } from "/FarmVista/js/firebase-init.js";
import {
  collection, query, orderBy, getDocs, doc, getDoc, setDoc, deleteDoc, where
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// --- UI refs
const sel = document.getElementById('roleSelect');
const addBtn = document.getElementById('btnAddRole');
const delBtn = document.getElementById('btnDeleteRole');
const saveBtn = document.getElementById('btnSavePerms');
const nameInput = document.getElementById('newRoleName');
const rowsBox = document.getElementById('permRows');
const statusBox = document.getElementById('status');
const deleteHint = document.getElementById('deleteHint');

const ACTIONS = [
  { key: 'view', label: 'View', hint: 'Allow viewing this screen.' },
  { key: 'create', label: 'Add', hint: 'Allow adding new records or entries.' },
  { key: 'edit', label: 'Edit', hint: 'Allow updating existing information.' },
  { key: 'archive', label: 'Archive', hint: 'Allow archiving used records so they stay out of pickers.' },
  { key: 'delete', label: 'Delete', hint: 'Allow permanent deletion when the record has never been used.' }
];

// --- helpers
function msg(s, ok=true){ statusBox.style.display='block'; statusBox.style.background = ok ? '#e1ede4' : '#ffe9e9';
  statusBox.style.border = ok ? '1px solid #cadbcc' : '1px solid #f3b9b9'; statusBox.style.color = ok ? '#2F563E' : '#a00'; statusBox.textContent=s;
}
function clearMsg(){ statusBox.style.display='none'; }
function keyFromName(n){ return String(n||'').trim().toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'').slice(0,40); }

function emptyPermState(){
  const obj = {};
  ACTIONS.forEach(action => { obj[action.key] = false; });
  return obj;
}

function buildMenuTree(){
  const menus = Array.isArray(window.DF_DRAWER_MENUS) ? window.DF_DRAWER_MENUS : [];
  const clone = (node = {}) => ({
    label: node.label || '',
    href: node.href || '',
    children: Array.isArray(node.children) ? node.children.map(clone) : []
  });
  return menus.map(clone);
}

function createLeaf(node, permsByPath, trail){
  if (!node.href) return null;
  const labelTrail = [...trail, node.label].filter(Boolean);
  const labelText = labelTrail.length ? labelTrail.join(' › ') : (node.href || '');
  const leaf = document.createElement('div');
  leaf.className = 'perm-leaf';
  leaf.dataset.path = node.href;

  const label = document.createElement('div');
  label.className = 'perm-leaf-label';
  label.innerHTML = `<span>${labelText}</span><small>${node.href}</small>`;
  leaf.appendChild(label);

  const actions = document.createElement('div');
  actions.className = 'perm-actions';
  const current = permsByPath[node.href] || {};
  ACTIONS.forEach(action => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'perm-action';
    btn.dataset.path = node.href;
    btn.dataset.k = action.key;
    btn.textContent = action.label;
    if (action.hint) btn.title = action.hint;
    btn.setAttribute('aria-pressed', current[action.key] ? 'true' : 'false');
    btn.addEventListener('click', () => toggleAction(btn));
    actions.appendChild(btn);
  });
  leaf.appendChild(actions);
  return leaf;
}

function renderMenuNode(node, permsByPath, trail = []){
  const hasChildren = Array.isArray(node.children) && node.children.length;
  if (!hasChildren) {
    return createLeaf(node, permsByPath, trail);
  }

  const branch = document.createElement('details');
  branch.className = 'perm-branch';
  if (!trail.length) branch.open = true;

  const summary = document.createElement('summary');
  summary.innerHTML = `<span>${node.label || node.href || 'Untitled section'}</span>`;
  branch.appendChild(summary);

  const childrenWrap = document.createElement('div');
  childrenWrap.className = 'perm-children';

  if (node.href) {
    const leaf = createLeaf(node, permsByPath, trail);
    if (leaf) childrenWrap.appendChild(leaf);
  }

  const nextTrail = node.label ? [...trail, node.label] : trail;
  node.children.forEach(child => {
    const childEl = renderMenuNode(child, permsByPath, nextTrail);
    if (childEl) childrenWrap.appendChild(childEl);
  });

  if (!childrenWrap.children.length) {
    const empty = document.createElement('div');
    empty.className = 'perm-empty';
    empty.textContent = 'No pages in this section yet.';
    childrenWrap.appendChild(empty);
  }

  branch.appendChild(childrenWrap);
  return branch;
}

function toggleAction(btn){
  const current = btn.getAttribute('aria-pressed') === 'true';
  btn.setAttribute('aria-pressed', current ? 'false' : 'true');
}

function renderPermTree(permsByPath = {}){
  rowsBox.innerHTML = '';
  const tree = buildMenuTree();
  if (!tree.length) {
    const empty = document.createElement('div');
    empty.className = 'perm-empty';
    empty.textContent = 'No navigation paths were found in drawer-menus.js.';
    rowsBox.appendChild(empty);
    return;
  }
  tree.forEach(node => {
    const el = renderMenuNode(node, permsByPath, []);
    if (el) rowsBox.appendChild(el);
  });
}

function collectPerms(){
  const buttons = rowsBox.querySelectorAll('.perm-action');
  const perms = {};
  buttons.forEach(btn => {
    const path = btn.getAttribute('data-path');
    const key = btn.getAttribute('data-k');
    if (!path || !key) return;
    if (!perms[path]) perms[path] = emptyPermState();
    perms[path][key] = btn.getAttribute('aria-pressed') === 'true';
  });
  Object.keys(perms).forEach(path => {
    const obj = perms[path];
    const hasAny = ACTIONS.some(action => obj[action.key]);
    if (!hasAny) delete perms[path];
  });
  return perms;
}

function showDeleteButton({ visible, disabled, note, roleKey } = {}){
  if (!delBtn) return;
  if (!visible) {
    delBtn.hidden = true;
    delBtn.disabled = true;
    delBtn.dataset.roleKey = '';
    if (deleteHint) {
      deleteHint.hidden = true;
      deleteHint.textContent = '';
    }
    return;
  }

  delBtn.hidden = false;
  delBtn.disabled = !!disabled;
  delBtn.dataset.roleKey = roleKey || '';
  if (deleteHint) {
    if (note) {
      deleteHint.hidden = false;
      deleteHint.textContent = note;
    } else {
      deleteHint.hidden = true;
      deleteHint.textContent = '';
    }
  }
}

async function countRoleAssignments(roleKey){
  if (!roleKey) return 0;
  const usersCol = collection(db, 'users');
  const snap = await getDocs(query(usersCol, where('roles', 'array-contains', roleKey)));
  return snap.size;
}

async function enforceDeleteGuard(roleId, roleKey){
  if (!roleId) {
    showDeleteButton({ visible: false });
    return;
  }

  showDeleteButton({ visible: true, disabled: true, note: 'Checking assignments…', roleKey });
  try {
    const count = await countRoleAssignments(roleKey);
    if (count > 0) {
      const msgText = count === 1
        ? 'Assigned to 1 teammate. Remove the role before deleting.'
        : `Assigned to ${count} teammates. Remove the role before deleting.`;
      showDeleteButton({ visible: true, disabled: true, note: msgText, roleKey });
    } else {
      showDeleteButton({ visible: true, disabled: false, note: 'Role can be deleted because nobody is using it.', roleKey });
    }
  } catch (err) {
    console.error('countRoleAssignments failed', err);
    showDeleteButton({ visible: true, disabled: true, note: 'Unable to verify assignments right now.', roleKey });
  }
}

// Load role list
async function loadRoles(){
  clearMsg();
  showDeleteButton({ visible: false });
  sel.innerHTML = '';
  const optNew = document.createElement('option'); optNew.value=''; optNew.textContent='— Select a role —';
  sel.appendChild(optNew);

  const q = query(collection(db,'roles'), orderBy('name'));
  const snap = await getDocs(q);
  if (snap.empty){ msg('No roles yet. Create one below.'); }
  snap.forEach(d=>{
    const o = document.createElement('option');
    const data = d.data();
    o.value = d.id;
    o.textContent = data.name || d.id;
    sel.appendChild(o);
  });
}

// Load selected role
async function loadRole(id){
  clearMsg();
  if(!id){
    renderPermTree({});
    await enforceDeleteGuard('', '');
    return;
  }
  const dref = doc(db,'roles',id);
  const s = await getDoc(dref);
  if (!s.exists()){
    msg('Role doc missing.', false);
    await enforceDeleteGuard('', '');
    return;
  }
  const data = s.data();
  renderPermTree(data.permissionsByPath || {});
  const roleKey = (data.key || id || '').toLowerCase();
  await enforceDeleteGuard(id, roleKey);
}

// Add role
addBtn.addEventListener('click', async ()=>{
  clearMsg();
  const name = nameInput.value.trim();
  if(!name){ msg('Enter a role name.', false); return; }
  const key = keyFromName(name);
  if(!key){ msg('Role name invalid.', false); return; }
  const dref = doc(db,'roles', key);
  const now = new Date().toISOString();
  await setDoc(dref, {
    key, name,
    createdAt: now,
    updatedAt: now,
    permissionsByPath: {}
  }, { merge: true });
  nameInput.value='';
  await loadRoles();
  sel.value = key;
  renderPermTree({});
  await enforceDeleteGuard(key, key);
  msg(`Role "${name}" created.`);
});

// Delete role
delBtn.addEventListener('click', async ()=>{
  clearMsg();
  const id = sel.value;
  if(!id){
    msg('Select a role to delete.', false);
    await enforceDeleteGuard('', '');
    return;
  }
  const roleKey = (delBtn.dataset.roleKey || '').toLowerCase() || id;
  const assigned = await countRoleAssignments(roleKey);
  if (assigned > 0){
    await enforceDeleteGuard(id, roleKey);
    const txt = assigned === 1 ? 'Cannot delete: 1 teammate still has this role.' : `Cannot delete: ${assigned} teammates still have this role.`;
    msg(txt, false);
    return;
  }
  if(!confirm('Delete this role? This cannot be undone.')) return;
  await deleteDoc(doc(db,'roles',id));
  await loadRoles();
  sel.value = '';
  renderPermTree({});
  await enforceDeleteGuard('', '');
  msg('Role deleted.');
});

// Save perms
saveBtn.addEventListener('click', async ()=>{
  clearMsg();
  const id = sel.value;
  if(!id){ msg('Select a role.', false); return; }
  const perms = collectPerms();
  const dref = doc(db,'roles', id);
  const s = await getDoc(dref);
  if(!s.exists()){ msg('Role doc missing.', false); return; }
  const data = s.data();
  data.permissionsByPath = perms;
  data.updatedAt = new Date().toISOString();
  await setDoc(dref, data, { merge: true });
  msg('Permissions saved.');
});

// init
(async function init(){
  // Ensure DF_DRAWER_MENUS exists
  if (!Array.isArray(window.DF_DRAWER_MENUS)){
    msg('drawer-menus.js not loaded.', false);
    return;
  }
  await loadRoles();
  renderPermTree({});
  showDeleteButton({ visible: false });
  sel.addEventListener('change', ()=>loadRole(sel.value));
})();
