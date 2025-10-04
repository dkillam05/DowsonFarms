// roles-admin.js — simple roles CRUD + permission matrix
import { db } from "/FarmVista/js/firebase-init.js";
import {
  collection, query, orderBy, getDocs, doc, getDoc, setDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// --- UI refs
const sel = document.getElementById('roleSelect');
const addBtn = document.getElementById('btnAddRole');
const delBtn = document.getElementById('btnDeleteRole');
const saveBtn = document.getElementById('btnSavePerms');
const nameInput = document.getElementById('newRoleName');
const rowsBox = document.getElementById('permRows');
const statusBox = document.getElementById('status');

// --- helpers
function msg(s, ok=true){ statusBox.style.display='block'; statusBox.style.background = ok ? '#e1ede4' : '#ffe9e9';
  statusBox.style.border = ok ? '1px solid #cadbcc' : '1px solid #f3b9b9'; statusBox.style.color = ok ? '#2F563E' : '#a00'; statusBox.textContent=s;
}
function clearMsg(){ statusBox.style.display='none'; }
function keyFromName(n){ return String(n||'').trim().toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'').slice(0,40); }

// Build a grouped list of menu paths from the drawer data so new
// features automatically surface here when the navigation updates.
function gatherDrawerGroups(){
  const src = Array.isArray(window.DF_DRAWER_MENUS) ? window.DF_DRAWER_MENUS : [];
  const groups = [];

  const pushItem = (bucket, labelParts, href)=>{
    if (!href) return;
    const label = labelParts.filter(Boolean).join(' › ');
    bucket.items.push({ label, href });
  };

  src.forEach(section=>{
    const bucket = {
      title: section.label || 'Section',
      icon: section.icon || '',
      items: []
    };

    const walk = (node, trail)=>{
      const nextTrail = [...trail, node.label];
      pushItem(bucket, nextTrail, node.href);
      (node.children || []).forEach(child=>walk(child, nextTrail));
    };

    pushItem(bucket, [section.label], section.href);
    (section.children || []).forEach(child=>walk(child, [section.label]));

    if (bucket.items.length){
      groups.push(bucket);
    }
  });

  // Fallback to DF_MENUS (legacy) if drawer data missing
  if (!groups.length && window.DF_MENUS && Array.isArray(window.DF_MENUS.tiles)){
    const bucket = { title: 'App', icon: '', items: [] };
    window.DF_MENUS.tiles.forEach(tile=>{
      const trail = [tile.label];
      pushItem(bucket, trail, tile.href);
      (tile.children || []).forEach(child=>{
        const childTrail = [...trail, child.label];
        pushItem(bucket, childTrail, child.href);
        (child.children || []).forEach(grand=>{
          pushItem(bucket, [...childTrail, grand.label], grand.href);
        });
      });
    });
    if (bucket.items.length){
      groups.push(bucket);
    }
  }

  return groups;
}

// Render checkbox grid
function renderPermRows(permsByPath = {}){
  rowsBox.innerHTML = '';
  const groups = gatherDrawerGroups();

  if (!groups.length){
    rowsBox.innerHTML = '<div class="empty">No navigation items found.</div>';
    return;
  }

  groups.forEach((group, idx)=>{
    const details = document.createElement('details');
    details.className = 'perm-group';
    if (idx === 0) details.open = true;

    const activeCount = group.items.reduce((total,item)=>{
      const pr = permsByPath[item.href] || {};
      return total + (pr.view || pr.create || pr.edit || pr.delete || pr.archive ? 1 : 0);
    }, 0);

    details.innerHTML = `
      <summary>
        <span class="group-title">${group.icon ? `<span class="emoji">${group.icon}</span>` : ''}${group.title}</span>
        <span class="group-count">${activeCount} of ${group.items.length} items toggled</span>
        <span class="chevron" aria-hidden="true">▾</span>
      </summary>
    `;

    const grid = document.createElement('div');
    grid.className = 'perm-grid';
    grid.innerHTML = `
      <div class="perm-grid-header">
        <div class="perm-cell head">Menu Path</div>
        <div class="perm-cell head">View</div>
        <div class="perm-cell head">Create</div>
        <div class="perm-cell head">Edit</div>
        <div class="perm-cell head">Delete</div>
        <div class="perm-cell head">Archive</div>
      </div>
    `;

    const rowsFrag = document.createDocumentFragment();
    group.items.forEach(item=>{
      const pr = permsByPath[item.href] || {};
      const row = document.createElement('div');
      row.className = 'perm-row';
      row.innerHTML = `
        <div class="perm-cell">
          <div class="perm-label">
            <span>${item.label}</span>
            <small>${item.href}</small>
          </div>
        </div>
        <div class="perm-cell"><span class="checkbox-wrap"><input type="checkbox" data-path="${item.href}" data-k="view"   ${pr.view?'checked':''}></span></div>
        <div class="perm-cell"><span class="checkbox-wrap"><input type="checkbox" data-path="${item.href}" data-k="create" ${pr.create?'checked':''}></span></div>
        <div class="perm-cell"><span class="checkbox-wrap"><input type="checkbox" data-path="${item.href}" data-k="edit"   ${pr.edit?'checked':''}></span></div>
        <div class="perm-cell"><span class="checkbox-wrap"><input type="checkbox" data-path="${item.href}" data-k="delete" ${pr.delete?'checked':''}></span></div>
        <div class="perm-cell"><span class="checkbox-wrap"><input type="checkbox" data-path="${item.href}" data-k="archive" ${pr.archive?'checked':''}></span></div>
      `;
      rowsFrag.appendChild(row);
    });

    grid.appendChild(rowsFrag);
    details.appendChild(grid);
    rowsBox.appendChild(details);
  });
}

// Collect perms from UI
function collectPerms(){
  const inputs = rowsBox.querySelectorAll('input[type=checkbox]');
  const perms = {};
  inputs.forEach(i=>{
    const path = i.getAttribute('data-path'); const k = i.getAttribute('data-k');
    if (!perms[path]) perms[path] = {view:false,create:false,edit:false,delete:false,archive:false};
    perms[path][k] = i.checked;
  });
  // prune empty (all false)
  for(const k in perms){
    const p = perms[k]; if(!(p.view||p.create||p.edit||p.delete||p.archive)) delete perms[k];
  }
  return perms;
}

// Load role list
async function loadRoles(){
  clearMsg();
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
  if(!id){ rowsBox.innerHTML=''; return; }
  const dref = doc(db,'roles',id);
  const s = await getDoc(dref);
  if (!s.exists()){ msg('Role doc missing.', false); return; }
  const data = s.data();
  renderPermRows(data.permissionsByPath || {});
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
  renderPermRows({});
  msg(`Role "${name}" created.`);
});

// Delete role
delBtn.addEventListener('click', async ()=>{
  clearMsg();
  const id = sel.value;
  if(!id){ msg('Select a role to delete.', false); return; }
  if(!confirm('Delete this role? This cannot be undone.')) return;
  await deleteDoc(doc(db,'roles',id));
  await loadRoles(); rowsBox.innerHTML='';
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
  // Ensure drawer data exists
  if (!Array.isArray(window.DF_DRAWER_MENUS) && !(window.DF_MENUS && Array.isArray(window.DF_MENUS.tiles))){
    msg('drawer-menus.js not loaded.', false);
    return;
  }
  await loadRoles();
  renderPermRows({}); // empty grid until a role is selected
  sel.addEventListener('change', ()=>loadRole(sel.value));
})();
