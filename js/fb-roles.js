// /js/fb-roles.js
// Roles → Permissions UI (from DF_MENUS) with default "ALL ON"

import {
  doc, getDoc, setDoc, getDocs, collection, orderBy, query, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

/* -------------------- helpers & handles -------------------- */
const $ = s => document.querySelector(s);
const el = {
  role:    $('#roleName'),
  roleHint:$('#roleHint'),
  status:  $('#roleStatus'),
  menus:   $('#menusContainer'),
  save:    $('#saveBtn'),
  discard: $('#discardBtn'),
  qvBtn:   $('#quickViewBtn'),
  qvB:     $('#qvBackdrop'),
  qvList:  $('#qvList'),
  qvRole:  $('#qvRole'),
  qvClose: $('#qvClose'),
};

function setStatus(msg, color){
  if (!el.status) return;
  el.status.style.display = msg ? 'block' : 'none';
  el.status.textContent = msg || '';
  if (color) el.status.style.color = color;
}
function toast(msg){
  const box = $('#dfToast');
  const txt = $('#dfToastText');
  if (!box || !txt) return;
  txt.textContent = msg || 'Saved';
  box.style.display = 'block';
  clearTimeout(window.__t);
  window.__t = setTimeout(()=> box.style.display='none', 1600);
}

/* -------------------- MENUS from DF_MENUS -------------------- */
function buildMenusFromDF(df){
  const out = {};
  if (!df || !Array.isArray(df.tiles)) return out;
  df.tiles.forEach(tile=>{
    const top = String(tile.label || '').trim();
    if (!top) return;
    const kids = Array.isArray(tile.children) ? tile.children : [];
    const subs = kids.map(k => String(k.label || '').trim()).filter(Boolean);
    if (subs.length) out[top] = subs;
  });
  return out;
}
const MENUS = buildMenusFromDF(window.DF_MENUS);
const ALL_ACTIONS = ['view','edit','add','archive','delete'];

/* -------------------- Firebase wrapper -------------------- */
const FB = {
  async ready() {
    // Wait for firebase-init to populate globals (slow phones)
    let tries = 0;
    while ((!window.DF_FB || !window.DF_FB_API) && tries < 150) {
      await new Promise(r => setTimeout(r, 80)); // ~12s
      tries++;
    }
    if (!window.DF_FB || !window.DF_FB_API) throw new Error('Firebase not initialized');

    // Keep session sticky
    try { await window.DF_FB_API.setPersistence?.(true); } catch {}

    await window.DF_FB_API.init?.();

    if (!window.DF_FB.auth?.currentUser) {
      setStatus('Not signed in', '#b00020');
      el.role.disabled = true;
      el.save?.setAttribute('disabled','true');
      el.discard?.setAttribute('disabled','true');
      return null;
    }
    el.role.disabled = false;
    return window.DF_FB.db;
  }
};

async function listRoles(db){
  try {
    const qy = query(collection(db,'roles'), orderBy('label'));
    const snaps = await getDocs(qy);
    const out=[]; snaps.forEach(d=> out.push({ id:d.id, ...(d.data()||{}) }));
    return out;
  } catch {
    const snaps = await getDocs(collection(db,'roles'));
    const out=[]; snaps.forEach(d=> out.push({ id:d.id, ...(d.data()||{}) }));
    return out;
  }
}
async function loadPerms(db, roleId){
  const snap = await getDoc(doc(db,'roles', roleId));
  const data = snap.exists() ? (snap.data()||{}) : {};
  return data.permissions || null;
}
async function savePerms(db, roleId, perms){
  await setDoc(doc(db,'roles', roleId), {
    label: roleId,
    permissions: perms,
    updatedAt: serverTimestamp()
  }, { merge:true });
}

/* -------------------- shape & UI logic -------------------- */
// ensureShape: guarantee we have MENUS×submenus with all actions; defaultOn = true → all true
function ensureShape(perms, defaultOn){
  const out = JSON.parse(JSON.stringify(perms || {}));
  Object.keys(MENUS).forEach(menu=>{
    out[menu] = out[menu] || {};
    MENUS[menu].forEach(sm=>{
      out[menu][sm] = out[menu][sm] || {};
      ALL_ACTIONS.forEach(a=>{
        if (typeof out[menu][sm][a] !== 'boolean') out[menu][sm][a] = !!defaultOn;
      });
    });
  });
  // Drop any menus/submenus that no longer exist
  Object.keys(out).forEach(menu=>{
    if (!MENUS[menu]) { delete out[menu]; return; }
    Object.keys(out[menu]).forEach(sm=>{
      if (!MENUS[menu].includes(sm)) delete out[menu][sm];
    });
  });
  return out;
}
const deepClone = obj => JSON.parse(JSON.stringify(obj));
const shallowEqual = (a,b) => JSON.stringify(a) === JSON.stringify(b);

function menuSummary(perms, menu){
  const rows = Object.values(perms[menu]||{});
  if (!rows.length) return 'No access';
  const allFalse = rows.every(p=>ALL_ACTIONS.every(a=>!p[a]));
  if (allFalse) return 'No access';
  const allTrue  = rows.every(p=>ALL_ACTIONS.every(a=> p[a]));
  if (allTrue) return 'All';
  return 'Custom';
}
function summarizeChildren(perms, menu){
  const keys = Object.keys(perms[menu]||{});
  const on = keys.filter(k => ALL_ACTIONS.some(a=> (perms[menu][k]||{})[a])).length;
  if (!on) return 'None';
  if (on===keys.length) return 'All submenus';
  return `${on} of ${keys.length} submenus`;
}

let db;
let activePerms = null;
let lastSavedPerms = null;

function setDirtyState(){
  const dirty = !shallowEqual(activePerms, lastSavedPerms);
  if (el.save)   el.save.disabled   = !dirty;
  if (el.discard)el.discard.disabled= !dirty;
}

function pill(label, pressed, onToggle){
  const b=document.createElement('button');
  b.type='button'; b.className='pill'; b.textContent=label;
  b.setAttribute('aria-pressed', pressed ? 'true':'false');
  b.addEventListener('click', ()=>{
    const on = b.getAttribute('aria-pressed')==='true';
    b.setAttribute('aria-pressed', on ? 'false' : 'true');
    onToggle(!on, b);
  });
  return b;
}

function renderMenus(){
  el.menus.innerHTML = '';

  Object.keys(MENUS).forEach(menuName=>{
    const card = document.createElement('div'); card.className='menu-card';

    // header (collapsed by default)
    const head = document.createElement('div'); head.className='menu-head';
    const left = document.createElement('div'); left.style.display='flex'; left.style.alignItems='center'; left.style.gap='10px';
    const caret= document.createElement('span'); caret.textContent='▸'; caret.style.transition='transform .2s';
    const title= document.createElement('strong'); title.textContent = menuName;
    left.append(caret, title);

    const right = document.createElement('div'); right.className='muted-sm';
    head.append(left, right);

    const body = document.createElement('div'); body.className='menu-body'; body.style.display='none';

    // row of bulk pills (View/Edit/Add/Archive/Delete) for entire menu
    const bulk = document.createElement('div'); bulk.className='pill-grid';
    ALL_ACTIONS.map(a=>a[0].toUpperCase()+a.slice(1)).forEach(name=>{
      const k = name.toLowerCase();
      const pressed = MENUS[menuName].every(sm => !!activePerms[menuName][sm][k]);
      const p = pill(name, pressed, (isOn)=>{
        MENUS[menuName].forEach(sm => activePerms[menuName][sm][k] = isOn);
        right.textContent = menuSummary(activePerms, menuName);
        body.querySelectorAll(`[data-sub="${menuName}::${k}"]`).forEach(btn=>{
          btn.setAttribute('aria-pressed', isOn ? 'true' : 'false');
        });
        setDirtyState();
      });
      p.setAttribute('aria-label', `${menuName}::${k}`);
      bulk.appendChild(p);
    });
    body.appendChild(bulk);

    // submenus drill-in (collapsed by default)
    const subWrap = document.createElement('div'); subWrap.className='subwrap';
    const sh = document.createElement('div'); sh.className='subhead';
    const shL = document.createElement('div'); shL.style.display='flex'; shL.style.alignItems='center'; shL.style.gap='8px';
    const subCaret = document.createElement('span'); subCaret.textContent='▸'; subCaret.style.transition='transform .2s';
    const shT = document.createElement('strong'); shT.textContent='Manage submenus';
    shL.append(subCaret, shT);
    const shR = document.createElement('span'); shR.className='muted-sm';
    sh.append(shL, shR);
    const subBody = document.createElement('div'); subBody.className='subbody'; subBody.style.display='none';

    MENUS[menuName].forEach(sm=>{
      const section = document.createElement('section'); section.style.margin='10px 0 14px';
      const h = document.createElement('h3'); h.style.margin='0 0 8px'; h.textContent = `${menuName} › ${sm}`;
      const grid2 = document.createElement('div'); grid2.className='pill-grid';
      ALL_ACTIONS.map(a=>a[0].toUpperCase()+a.slice(1)).forEach(name=>{
        const k = name.toLowerCase();
        const btn = pill(name, !!activePerms[menuName][sm][k], (isOn)=>{
          activePerms[menuName][sm][k] = isOn;
          shR.textContent = summarizeChildren(activePerms, menuName);
          right.textContent = menuSummary(activePerms, menuName);
          // Update parent bulk pill to reflect "all on/off" for this action
          const allOn  = MENUS[menuName].every(s=>activePerms[menuName][s][k]===true);
          const allOff = MENUS[menuName].every(s=>activePerms[menuName][s][k]===false);
          const parentBtn = body.querySelector(`.pill[aria-label="${menuName}::${k}"]`);
          if (parentBtn) parentBtn.setAttribute('aria-pressed', allOn ? 'true' : (allOff ? 'false' : parentBtn.getAttribute('aria-pressed')));
          setDirtyState();
        });
        btn.setAttribute('data-sub', `${menuName}::${k}`);
        grid2.appendChild(btn);
      });
      section.append(h, grid2);
      subBody.appendChild(section);
    });

    sh.addEventListener('click', ()=>{
      const open = subBody.style.display !== 'none';
      subBody.style.display = open ? 'none' : 'block';
      subCaret.style.transform = open ? 'rotate(0deg)' : 'rotate(90deg)';
    });

    subWrap.append(sh, subBody);
    body.appendChild(subWrap);

    head.addEventListener('click', ()=>{
      const open = body.style.display !== 'none';
      body.style.display = open ? 'none' : 'block';
      caret.style.transform = open ? 'rotate(0deg)' : 'rotate(90deg)';
    });

    right.textContent = menuSummary(activePerms, menuName);
    shR.textContent   = summarizeChildren(activePerms, menuName);

    card.append(head, body);
    el.menus.appendChild(card);
  });

  setDirtyState();
}

/* -------------------- page wiring -------------------- */
async function loadRole(roleId){
  el.roleHint.textContent = 'Loading…';
  try {
    const existing = await loadPerms(db, roleId);                         // may be null
    // Default ALL ON if missing; otherwise merge shape & keep existing values
    activePerms = ensureShape(existing || {}, !existing /* default ON if no doc */);
    lastSavedPerms = deepClone(activePerms);
    renderMenus();
    el.roleHint.textContent = '';
    setStatus(existing ? 'Loaded existing permissions' : 'No doc found — showing ALL enabled by default', existing ? '#2e7d32' : '#9a6b00');
  } catch (e) {
    console.error(e);
    el.roleHint.textContent = '';
    setStatus('Failed to load permissions for role.', '#b00020');
  }
}

async function start(){
  try{
    // Guard: need MENUS
    if (!Object.keys(MENUS).length) {
      setStatus('Menus not loaded. Check ../assets/data/menus.js path.', '#b00020');
      return;
    }

    db = await FB.ready();
    if (!db) return;

    // Populate dropdown (should already be filled by your other script; we do it again to be self-contained)
    const roles = await listRoles(db);
    if (!roles.length) {
      el.role.innerHTML = '';
      setStatus('No roles in /roles. Create docs: Administrator, Owner, Manager, Employee, ViewOnly.', '#b00020');
      return;
    }
    el.role.innerHTML = roles.map(r=>{
      const label = (r.label || r.id || '').toString();
      const value = (r.id || r.label || '').toString();
      return `<option value="${value}">${label}</option>`;
    }).join('');

    const last = localStorage.getItem('df_role_selected');
    if (last && roles.some(r => (r.id===last || r.label===last))) el.role.value = last;

    await loadRole(el.role.value || roles[0].id);

    el.role.addEventListener('change', async ()=>{
      localStorage.setItem('df_role_selected', el.role.value);
      await loadRole(el.role.value);
    });

    // Save
    document.getElementById('role-form')?.addEventListener('submit', async (e)=>{
      e.preventDefault();
      try {
        await savePerms(db, el.role.value, activePerms);
        lastSavedPerms = deepClone(activePerms);
        setDirtyState();
        toast('Permissions saved');
        setStatus('Saved', '#2e7d32');
      } catch (err) {
        console.error(err);
        toast(navigator.onLine ? 'Save failed' : 'Offline — not saved');
        setStatus('Save failed', '#b00020');
      }
    });

    // Discard
    el.discard?.addEventListener('click', ()=>{
      activePerms = deepClone(lastSavedPerms);
      renderMenus();
      toast('Changes discarded');
    });

    // Quick View
    el.qvBtn?.addEventListener('click', ()=>{
      if (!activePerms) return;
      el.qvRole.textContent = el.role.value;
      el.qvList.innerHTML = '';
      Object.keys(MENUS).forEach(menu=>{
        const li = document.createElement('li');
        li.innerHTML = `<strong>${menu}</strong> — ${menuSummary(activePerms, menu)}`;
        el.qvList.appendChild(li);
      });
      el.qvB.style.display = 'flex';
    });
    el.qvClose?.addEventListener('click', ()=> el.qvB.style.display='none');
    el.qvB?.addEventListener('click', (e)=>{ if(e.target===el.qvB) el.qvB.style.display='none'; });

  } catch (err){
    console.error(err);
    setStatus('Init failed (auth, rules, or menus)', '#b00020');
  } finally {
    el.roleHint.textContent = '';
  }
}

start();