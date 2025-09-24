// /js/fb-roles.js
// Account Roles — edit per-role permissions using DF_MENUS as source of truth.
// This version waits for Firebase auth (onAuthStateChanged) before initializing,
// and avoids red inline errors (quiet UX); no redirects here.

import {
  collection, doc, getDoc, getDocs, setDoc, query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

/* ---------- DOM refs ---------- */
const $ = s => document.querySelector(s);
const el = {
  roleSelect:   $('#roleName'),
  roleHint:     $('#roleHint'),
  roleStatus:   $('#roleStatus'),
  saveBtn:      $('#saveBtn'),
  discardBtn:   $('#discardBtn'),
  menusBox:     $('#menusContainer'),
  permCard:     $('#permCard'),

  // Quick View
  qvBackdrop:   $('#qvBackdrop'),
  qvList:       $('#qvList'),
  qvRole:       $('#qvRole'),
  qvClose:      $('#qvClose'),

  // Toast
  toastBox:     $('#dfToast'),
  toastText:    $('#dfToastText'),
};

const ACTIONS = ['view','edit','add','archive','delete'];
const DEFAULT_ROLES = ["Administrator","Owner","Manager","Employee","ViewOnly"];

/* ---------- Small UI helpers (muted / non-blocking) ---------- */
function toast(msg='Saved'){
  if (!el.toastBox || !el.toastText) return;
  el.toastText.textContent = msg;
  el.toastBox.style.display = 'block';
  clearTimeout(window.__df_toast_t);
  window.__df_toast_t = setTimeout(()=> el.toastBox.style.display='none', 1800);
}
function setStatusMuted(msg=''){
  if (!el.roleStatus) return;
  el.roleStatus.style.display = msg ? 'block' : 'none';
  el.roleStatus.style.color = 'var(--crumb-fg, #666)';
  el.roleStatus.textContent = msg || '';
}
function enableSave(enabled){
  if (!el.saveBtn || !el.discardBtn) return;
  if (enabled){
    el.saveBtn.removeAttribute('disabled');
    el.discardBtn.removeAttribute('disabled');
  } else {
    el.saveBtn.setAttribute('disabled','true');
    el.discardBtn.setAttribute('disabled','true');
  }
}

/* ---------- Build DF_MENUS -> { Menu: [Submenu,...] } ---------- */
function buildMenusFromDF(df){
  const out = {};
  if (!df || !Array.isArray(df.tiles)) return out;
  df.tiles.forEach(tile=>{
    const top = String(tile.label||'').trim();
    if (!top) return;
    const kids = Array.isArray(tile.children) ? tile.children : [];
    const subs = kids.map(k=>String(k.label||'').trim()).filter(Boolean);
    if (subs.length) out[top] = subs;
  });
  return out;
}
let MENUS = buildMenusFromDF(window.DF_MENUS || {});

/* ---------- Firebase handles ---------- */
async function readyFirebase(){
  let tries = 0;
  while ((!window.DF_FB || !window.DF_FB.db || !window.DF_FB.auth) && tries < 250){
    await new Promise(r=>setTimeout(r,60));
    tries++;
  }
  if (!window.DF_FB || !window.DF_FB.db) throw new Error('Firebase not initialized');
  // Sticky sessions on phones
  try { await window.DF_FB_API?.setPersistence?.(true); } catch {}
  return window.DF_FB.db;
}

/* ---------- Roles list (seed if empty) ---------- */
async function fetchRoles(db){
  try{
    const snaps = await getDocs(query(collection(db,'roles'), orderBy('label')));
    const out=[]; snaps.forEach(d=> out.push({ id:d.id, ...(d.data()||{}) }));
    return out;
  }catch{
    const snaps = await getDocs(collection(db,'roles'));
    const out=[]; snaps.forEach(d=> out.push({ id:d.id, ...(d.data()||{}) }));
    return out;
  }
}
async function seedRolesIfEmpty(db){
  const current = await fetchRoles(db);
  if (current.length) return current;
  await Promise.all(DEFAULT_ROLES.map(name =>
    setDoc(doc(db,'roles', name), { label:name, permissions:{} }, { merge:true })
  ));
  return await fetchRoles(db);
}

/* ---------- Current role doc helpers ---------- */
async function readRoleDoc(db, roleId){
  if (!roleId) return null;
  const snap = await getDoc(doc(db,'roles', roleId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data()||{}) };
}
async function saveRoleDoc(db, roleId, payload){
  await setDoc(doc(db,'roles', roleId), { ...payload, updatedAt: serverTimestamp() }, { merge:true });
}

/* ---------- Permissions <-> UI state ---------- */
function emptyPermShape(){
  const perms = {};
  Object.keys(MENUS).forEach(menu=>{
    perms[menu] = {};
    MENUS[menu].forEach(sub=>{
      perms[menu][sub] = { view:false, edit:false, add:false, archive:false, delete:false };
    });
  });
  return perms;
}
function mergePerms(base, incoming){
  const out = emptyPermShape();
  Object.keys(out).forEach(menu=>{
    Object.keys(out[menu]).forEach(sub=>{
      const stored = incoming?.[menu]?.[sub] || {};
      ACTIONS.forEach(a => { out[menu][sub][a] = !!stored[a]; });
    });
  });
  return out;
}

/* ---------- Render UI ---------- */
function pill(label, pressed){
  const b=document.createElement('button');
  b.type='button'; b.className='pill'; b.textContent=label;
  b.setAttribute('aria-pressed', pressed?'true':'false');
  b.addEventListener('click', ()=>{
    const on = b.getAttribute('aria-pressed')==='true';
    b.setAttribute('aria-pressed', on?'false':'true');
    enableSave(true);
  });
  return b;
}
function summarizeMenu(perms, menu){
  const subs = Object.values(perms[menu]||{});
  if (!subs.length) return 'No access';
  const allFalse = subs.every(p=>!p.view && !p.edit && !p.add && !p.archive && !p.delete);
  if (allFalse) return 'No access';
  const allTrue  = subs.every(p=>p.view && p.edit && p.add && p.archive && p.delete);
  if (allTrue) return 'All';
  return 'Custom';
}
function summarizeChildren(perms, menu){
  const keys = Object.keys(perms[menu]||{});
  const on = keys.filter(k=>{
    const p = perms[menu][k]; return p.view||p.edit||p.add||p.archive||p.delete;
  }).length;
  if (!on) return 'None';
  if (on===keys.length) return 'All submenus';
  return `${on} of ${keys.length} submenus`;
}

/**
 * Build the full interactive UI.
 * Returns a controller with getPerms() to read current state.
 */
function buildPermissionsUI(container, startingPerms){
  container.innerHTML = '';
  const perms = mergePerms(emptyPermShape(), startingPerms||{});

  Object.keys(MENUS).forEach(menu=>{
    const card = document.createElement('div'); card.className='menu-card';

    const head = document.createElement('div'); head.className='menu-head';
    const left = document.createElement('div'); left.style.display='flex'; left.style.alignItems='center'; left.style.gap='10px';
    const caret = document.createElement('span'); caret.textContent='▸'; caret.style.transition='transform .2s';
    const title = document.createElement('strong'); title.textContent = menu;
    left.append(caret,title);
    const right = document.createElement('div'); right.className='muted-sm';
    head.append(left,right);

    const body = document.createElement('div'); body.className='menu-body'; body.style.display='none';

    // Parent action row
    const grid = document.createElement('div'); grid.className='pill-grid';
    ACTIONS.forEach(name=>{
      const k = name;
      const pressed = (MENUS[menu]||[]).every(sm => !!perms[menu][sm][k]);
      const p = pill(name[0].toUpperCase()+name.slice(1), pressed);
      p.setAttribute('aria-label', `${menu}::${k}`);
      p.addEventListener('click', ()=>{
        const isOn = p.getAttribute('aria-pressed')==='true';
        (MENUS[menu]||[]).forEach(sm => perms[menu][sm][k] = isOn);
        body.querySelectorAll(`[data-sub="${menu}::${k}"]`).forEach(btn=>{
          btn.setAttribute('aria-pressed', isOn?'true':'false');
        });
        right.textContent   = summarizeMenu(perms, menu);
        subSummary.textContent = summarizeChildren(perms, menu);
      });
      grid.appendChild(p);
    });
    body.appendChild(grid);

    // Submenus
    const subWrap     = document.createElement('div'); subWrap.className='subwrap';
    const subHead     = document.createElement('div'); subHead.className='subhead';
    const subLeft     = document.createElement('div'); subLeft.style.display='flex'; subLeft.style.alignItems='center'; subLeft.style.gap='8px';
    const subCaret    = document.createElement('span'); subCaret.textContent='▸'; subCaret.style.transition='transform .2s';
    const subTitle    = document.createElement('strong'); subTitle.textContent='Manage submenus';
    subLeft.append(subCaret, subTitle);
    const subSummary  = document.createElement('span'); subSummary.className='muted-sm';
    subHead.append(subLeft, subSummary);
    const subBody     = document.createElement('div'); subBody.className='subbody'; subBody.style.display='none';

    (MENUS[menu]||[]).forEach(sm=>{
      const section = document.createElement('section'); section.style.margin='10px 0 14px';
      const h = document.createElement('h3'); h.style.margin='0 0 8px'; h.textContent = `${menu} › ${sm}`;
      const grid2 = document.createElement('div'); grid2.className='pill-grid';
      ACTIONS.forEach(name=>{
        const k = name;
        const btn = pill(name[0].toUpperCase()+name.slice(1), !!perms[menu][sm][k]);
        btn.setAttribute('data-sub', `${menu}::${k}`);
        btn.addEventListener('click', ()=>{
          const isOn = btn.getAttribute('aria-pressed')==='true';
          perms[menu][sm][k] = isOn;
          subSummary.textContent = summarizeChildren(perms, menu);
          right.textContent      = summarizeMenu(perms, menu);

          const allOn  = (MENUS[menu]||[]).every(s=>perms[menu][s][k]===true);
          const allOff = (MENUS[menu]||[]).every(s=>perms[menu][s][k]===false);
          const parentBtn = body.querySelector(`.pill[aria-label="${menu}::${k}"]`);
          if (parentBtn) {
            parentBtn.setAttribute('aria-pressed', allOn ? 'true' : (allOff ? 'false' : parentBtn.getAttribute('aria-pressed')));
          }
        });
        grid2.appendChild(btn);
      });
      section.append(h, grid2);
      subBody.appendChild(section);
    });

    subHead.addEventListener('click', ()=>{
      const open = subBody.style.display !== 'none';
      subBody.style.display = open ? 'none' : 'block';
      subCaret.style.transform = open ? 'rotate(0deg)' : 'rotate(90deg)';
    });

    subSummary.textContent = summarizeChildren(perms, menu);
    right.textContent      = summarizeMenu(perms, menu);

    subWrap.append(subHead, subBody);
    body.appendChild(subWrap);

    head.addEventListener('click', ()=>{
      const open = body.style.display !== 'none';
      body.style.display = open ? 'none' : 'block';
      caret.style.transform = open ? 'rotate(0deg)' : 'rotate(90deg)';
    });

    card.append(head, body);
    container.appendChild(card);
  });

  return {
    getPerms(){
      const out = {};
      Object.keys(MENUS).forEach(menu=>{
        (MENUS[menu]||[]).forEach(sm=>{
          const p = perms[menu][sm];
          if (p.view||p.edit||p.add||p.archive||p.delete){
            out[menu] = out[menu] || {};
            out[menu][sm] = {};
            ACTIONS.forEach(k=>{ if (p[k]) out[menu][sm][k] = true; });
          }
        });
      });
      return out;
    },
    setDirty(on){ enableSave(!!on); }
  };
}

/* ---------- Quick View ---------- */
function openQuickView(roleLabel, permsObj){
  if (!el.qvBackdrop || !el.qvList || !el.qvRole) return;
  el.qvRole.textContent = roleLabel || '—';
  const entries = [];

  Object.keys(permsObj||{}).sort().forEach(menu=>{
    Object.keys(permsObj[menu]||{}).sort().forEach(sub=>{
      const p = permsObj[menu][sub] || {};
      const acts = ACTIONS.filter(a=>p[a]).map(a=>a[0].toUpperCase()+a.slice(1));
      entries.push(`<li><strong>${menu}</strong> › ${sub}: ${acts.length?acts.join(', '):'—'}</li>`);
    });
  });

  el.qvList.innerHTML = entries.length ? entries.join('') : '<li>No permissions set.</li>';
  el.qvBackdrop.style.display='flex';
  el.qvClose?.addEventListener('click', ()=> el.qvBackdrop.style.display='none', {once:true});
  el.qvBackdrop.addEventListener('click', (e)=>{ if(e.target===el.qvBackdrop) el.qvBackdrop.style.display='none'; }, {once:true});
}

/* ---------- Auth-aware boot ---------- */
(function bootWithAuth(){
  let initialized = false;

  // If DF_MENUS wasn’t ready when this file parsed, rebuild once on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    if (!Object.keys(MENUS).length && window.DF_MENUS) {
      MENUS = buildMenusFromDF(window.DF_MENUS);
    }
  });

  function initOnce() {
    if (initialized) return;
    initialized = true;
    start().catch(err => {
      console.error('[fb-roles] init error:', err);
      if (el.roleHint) el.roleHint.textContent = '';
      setStatusMuted(''); // keep UI calm
    });
  }

  // Prefer the API’s onAuth so we start exactly when Firebase restores the session
  const api = window.DF_FB_API;
  if (api && typeof api.onAuth === 'function') {
    api.onAuth(user => { if (user) initOnce(); });
    // If Firebase already restored the user before our listener
    try { if (window.DF_FB?.auth?.currentUser) initOnce(); } catch (_) {}
    return;
  }

  // Fallback: poll for DF_FB + currentUser briefly
  let tries = 0;
  (function waitForAuth(){
    if (window.DF_FB?.auth?.currentUser) { initOnce(); return; }
    if (tries++ > 200) return; // give up quietly
    setTimeout(waitForAuth, 60);
  })();
})();

/* ---------- Main flow (runs after auth is ready) ---------- */
async function start(){
  // Menus must exist
  if (!Object.keys(MENUS).length){
    setStatusMuted('Menus not loaded yet.');
    return;
  }

  // Firebase ready
  if (el.roleHint) el.roleHint.textContent = 'Loading roles…';
  const db = await readyFirebase();

  // Seed roles if empty, then fill dropdown
  const roles = await seedRolesIfEmpty(db);
  if (!roles.length){
    setStatusMuted('No roles found.');
    if (el.roleHint) el.roleHint.textContent = '';
    return;
  }

  // Build dropdown
  el.roleSelect.innerHTML = roles.map(r=>{
    const label = (r.label||r.id||'').toString();
    const value = (r.id || r.label).toString();
    return `<option value="${value}">${label}</option>`;
  }).join('');

  // Restore last selected
  const last = localStorage.getItem('df_role_selected');
  if (last && roles.some(r => (r.id===last || r.label===last))){
    el.roleSelect.value = last;
  }

  if (el.roleHint) el.roleHint.textContent = '';
  //setStatusMuted(`${roles.length} role${roles.length===1?'':'s'} loaded`);

  let currentRoleId   = el.roleSelect.value || roles[0].id || roles[0].label;
  let currentRoleDoc  = await readRoleDoc(db, currentRoleId);
  let ui              = null;

  async function loadRole(roleId){
    enableSave(false);
    el.menusBox.innerHTML = '';
    currentRoleDoc = await readRoleDoc(db, roleId);
    const label    = currentRoleDoc?.label || roleId;
    const perms    = currentRoleDoc?.permissions || {};
    ui = buildPermissionsUI(el.menusBox, perms);

    // Wire form save/discard
    el.saveBtn.onclick = async (ev)=>{
      ev.preventDefault();
      const nextPerms = ui.getPerms();
      await saveRoleDoc(db, roleId, { label, permissions: nextPerms });
      enableSave(false);
      toast('Permissions saved');
    };
    el.discardBtn.onclick = async ()=>{
      await loadRole(roleId);
      toast('Changes discarded');
    };

    // Quick View button (top-right)
    const qvBtn = $('#quickViewBtn');
    if (qvBtn){
      qvBtn.onclick = ()=>{
        const snap = ui.getPerms();
        openQuickView(label, snap);
      };
    }
  }

  // Initial load
  await loadRole(currentRoleId);

  // Change role
  el.roleSelect.addEventListener('change', async ()=>{
    const roleId = el.roleSelect.value;
    localStorage.setItem('df_role_selected', roleId);
    await loadRole(roleId);
  });
}