// Dowson Farms — fb-roles.js
// Account Roles page: reads/writes Firestore; renders permissions grid.

import {
  doc, getDoc, setDoc, getDocs, collection, orderBy, query, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

/* ---------- MENUS from DF_MENUS (global) ---------- */
function buildMenusFromDF(df){
  const out = {};
  if (!df || !Array.isArray(df.tiles)) return out;
  df.tiles.forEach(tile=>{
    const top = String(tile.label||'').trim();
    if (!top) return;
    const kids = Array.isArray(tile.children) ? tile.children : [];
    const subs = kids.map(k=>String(k.label||'').trim()).filter(Boolean);
    if (subs.length) out[top]=subs;
  });
  return out;
}
const MENUS = buildMenusFromDF(window.DF_MENUS);

/* ---------- UI ---------- */
const DEFAULT_ROLES = ["Administrator","Owner","Manager","Employee","View Only"];
const $ = s => document.querySelector(s);
const el = {
  role: $('#roleName'),
  roleHint: $('#roleHint'),
  roleStatus: $('#roleStatus'),
  menus: $('#menusContainer'),
  save: $('#saveBtn'),
  discard: $('#discardBtn'),
  toast: $('#dfToast'), toastTxt: $('#dfToastText'),
  qvBtn: $('#quickViewBtn'), qvB: $('#qvBackdrop'), qvList: $('#qvList'), qvRole: $('#qvRole'), qvClose: $('#qvClose')
};

/* ---------- Auth/DB ---------- */
const FB = {
  async ready(){
    // Wait for firebase-init to attach globals
    let tries=0;
    while ((!window.DF_FB || !window.DF_FB_API) && tries<50){
      await new Promise(r=>setTimeout(r,60)); tries++;
    }
    if (!window.DF_FB || !window.DF_FB_API) throw new Error('Firebase not initialized');
    // Must be signed in
    if (!window.DF_FB.auth?.currentUser) throw new Error('Not signed in');
    // If session dies, go to login
    window.DF_FB_API.onAuth(u=>{ if(!u) location.replace('../auth/login.html'); });
    return window.DF_FB.db;
  }
};

/* ---------- helpers ---------- */
const deepClone = o => JSON.parse(JSON.stringify(o));
const shallowEqual = (a,b) => JSON.stringify(a)===JSON.stringify(b);

function showStatus(msg){
  if (!el.roleStatus) return;
  if (!msg){ el.roleStatus.style.display='none'; el.roleStatus.textContent=''; return; }
  el.roleStatus.style.display='block'; el.roleStatus.textContent=msg;
}

function toast(msg){
  el.toastTxt.textContent = msg || 'Saved';
  el.toast.style.display = 'block';
  clearTimeout(window.__t); window.__t = setTimeout(()=> el.toast.style.display='none', 1600);
}

function pill(label, pressed, onToggle){
  const b=document.createElement('button');
  b.type='button'; b.className='pill'; b.textContent=label;
  b.setAttribute('aria-pressed', pressed?'true':'false');
  b.addEventListener('click', ()=>{
    const on = b.getAttribute('aria-pressed')==='true';
    b.setAttribute('aria-pressed', on?'false':'true');
    onToggle(!on, b);
  });
  return b;
}

function ensureShape(perms){
  Object.keys(MENUS).forEach(menu=>{
    perms[menu]=perms[menu]||{};
    MENUS[menu].forEach(sm=>{
      perms[menu][sm]=perms[menu][sm]||{view:false,edit:false,add:false,archive:false,delete:false};
    });
  });
  return perms;
}

function menuSummary(perms, menu){
  const subs = Object.values(perms[menu]||{});
  if (!subs.length) return 'No access';
  const allFalse = subs.every(p=>!p.view&&!p.edit&&!p.add&&!p.archive&&!p.delete);
  if (allFalse) return 'No access';
  const allTrue  = subs.every(p=>p.view&&p.edit&&p.add&&p.archive&&p.delete);
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

/* ---------- Firestore helpers ---------- */
async function seedRolesIfEmpty(db){
  // Seed regardless of MENUS; shape will be filled when rendering.
  const snaps = await getDocs(collection(db,'roles'));
  if (!snaps.empty) return;
  const base = {}; ensureShape(base);
  for (const name of DEFAULT_ROLES){
    await setDoc(doc(db,'roles',name), { label:name, permissions: base, createdAt: serverTimestamp() }, { merge:true });
  }
}

async function listRoles(db){
  try{
    const out=[];
    try{
      const qy = query(collection(db,'roles'), orderBy('label'));
      const snaps = await getDocs(qy);
      snaps.forEach(d=> out.push({ id:d.id, ...(d.data()||{}) }));
    }catch(_){
      const snaps = await getDocs(collection(db,'roles'));
      snaps.forEach(d=> out.push({ id:d.id, ...(d.data()||{}) }));
    }
    if (!out.length) return DEFAULT_ROLES.map(label=>({id:label,label}));
    return out.map(d=>({id:d.id, label:d.label||d.id}));
  }catch(err){
    // On any failure, still return defaults
    console.error('listRoles failed:', err);
    showStatus('Using defaults (roles read failed).');
    return DEFAULT_ROLES.map(label=>({id:label,label}));
  }
}

async function loadPerms(db, role){
  const snap = await getDoc(doc(db,'roles', role));
  const data = snap.exists()? (snap.data()||{}) : {};
  return ensureShape(data.permissions || {});
}

async function savePerms(db, role, perms){
  await setDoc(doc(db,'roles', role), { label: role, permissions: perms, updatedAt: serverTimestamp() }, { merge:true });
}

/* ---------- Page state + rendering ---------- */
let db;
let activePerms=null;
let lastSavedPerms=null;

function setDirtyState(){
  const dirty = !shallowEqual(activePerms, lastSavedPerms);
  el.save.disabled = !dirty;
  el.discard.disabled = !dirty;
}

function renderMenus(){
  el.menus.innerHTML='';
  Object.keys(MENUS).forEach(menuName=>{
    const card = document.createElement('div'); card.className='menu-card';

    const head = document.createElement('div'); head.className='menu-head';
    const left = document.createElement('div'); left.style.display='flex'; left.style.alignItems='center'; left.style.gap='10px';
    const caret = document.createElement('span'); caret.textContent='▸'; caret.style.transition='transform .2s';
    const title = document.createElement('strong'); title.textContent=menuName;
    left.append(caret,title);
    const right = document.createElement('div'); right.className='muted-sm';
    head.append(left,right);

    const body = document.createElement('div'); body.className='menu-body'; body.style.display='none';

    const grid = document.createElement('div'); grid.className='pill-grid';
    ['View','Edit','Add','Archive','Delete'].forEach(name=>{
      const k=name.toLowerCase();
      const pressed = MENUS[menuName].every(sm=>!!activePerms[menuName][sm][k]);
      const p = pill(name, pressed, (isOn)=>{
        MENUS[menuName].forEach(sm=> activePerms[menuName][sm][k]=isOn);
        right.textContent = menuSummary(activePerms,menuName);
        body.querySelectorAll(`[data-sub="${menuName}::${k}"]`).forEach(btn=>{
          btn.setAttribute('aria-pressed', isOn ? 'true':'false');
        });
        setDirtyState();
      });
      p.setAttribute('aria-label', `${menuName}::${k}`);
      grid.appendChild(p);
    });
    body.appendChild(grid);

    const subWrap = document.createElement('div'); subWrap.className='subwrap';
    const sh = document.createElement('div'); sh.className='subhead';
    const shL = document.createElement('div'); shL.style.display='flex'; shL.style.alignItems='center'; shL.style.gap='8px';
    const subCaret = document.createElement('span'); subCaret.textContent='▸'; subCaret.style.transition='transform .2s';
    const shT = document.createElement('strong'); shT.textContent='Manage submenus';
    shL.append(subCaret,shT);
    const shR = document.createElement('span'); shR.className='muted-sm';
    sh.append(shL,shR);
    const subBody = document.createElement('div'); subBody.className='subbody'; subBody.style.display='none';

    MENUS[menuName].forEach(sm=>{
      const section=document.createElement('section'); section.style.margin='10px 0 14px';
      const h=document.createElement('h3'); h.style.margin='0 0 8px'; h.textContent=`${menuName} › ${sm}`;
      const grid2=document.createElement('div'); grid2.className='pill-grid';
      ['View','Edit','Add','Archive','Delete'].forEach(name=>{
        const k=name.toLowerCase();
        const btn=pill(name, !!activePerms[menuName][sm][k], (isOn)=>{
          activePerms[menuName][sm][k]=isOn;
          shR.textContent=summarizeChildren(activePerms,menuName);
          right.textContent=menuSummary(activePerms,menuName);
          const allOn  = MENUS[menuName].every(s=>activePerms[menuName][s][k]===true);
          const allOff = MENUS[menuName].every(s=>activePerms[menuName][s][k]===false);
          const parentBtn = body.querySelector(`.pill[aria-label="${menuName}::${k}"]`);
          if (parentBtn) parentBtn.setAttribute('aria-pressed', allOn?'true':(allOff?'false':parentBtn.getAttribute('aria-pressed')));
          setDirtyState();
        });
        btn.setAttribute('data-sub', `${menuName}::${k}`);
        grid2.appendChild(btn);
      });
      section.append(h,grid2);
      subBody.appendChild(section);
    });

    sh.addEventListener('click', ()=>{
      const open=subBody.style.display!=='none';
      subBody.style.display=open?'none':'block';
      subCaret.style.transform=open?'rotate(0deg)':'rotate(90deg)';
    });

    subWrap.append(sh,subBody);
    body.appendChild(subWrap);

    head.addEventListener('click', ()=>{
      const open=body.style.display!=='none';
      body.style.display=open?'none':'block';
      caret.style.transform=open?'rotate(0deg)':'rotate(90deg)';
    });

    right.textContent=menuSummary(activePerms,menuName);
    shR.textContent=summarizeChildren(activePerms,menuName);

    card.append(head,body);
    el.menus.appendChild(card);
  });
  setDirtyState();
}

async function loadRole(roleName){
  el.roleHint.textContent='Loading…';
  activePerms = ensureShape(await loadPerms(db, roleName));
  lastSavedPerms = deepClone(activePerms);
  renderMenus();
  el.roleHint.textContent='';
}

/* ---------- Init ---------- */
(async function start(){
  try{
    db = await FB.ready();

    // 1) Seed if empty (safe to run every time)
    await seedRolesIfEmpty(db);

    // 2) Populate dropdown (never empty — defaults if read fails)
    const roles = await listRoles(db);
    el.role.innerHTML = roles.map(r=>`<option value="${r.label||r.id}">${r.label||r.id}</option>`).join('');
    if (!el.role.value && roles.length) el.role.value = roles[0].label || roles[0].id;

    // 3) Load selected role + wire events
    await loadRole(el.role.value);

    el.role.addEventListener('change', async ()=>{
      localStorage.setItem('df_role_selected', el.role.value);
      await loadRole(el.role.value);
    });

    document.getElementById('role-form').addEventListener('submit', async (e)=>{
      e.preventDefault();
      try{
        await savePerms(db, el.role.value, activePerms);
        lastSavedPerms = deepClone(activePerms);
        setDirtyState();
        toast('Permissions saved');
        showStatus(''); // clear any prior warning
      }catch(err){
        console.error(err);
        showStatus('Save failed (see console).');
        toast(navigator.onLine ? 'Save failed' : 'Offline — not saved');
      }
    });

    el.discard.addEventListener('click', ()=>{
      activePerms = deepClone(lastSavedPerms);
      renderMenus();
      toast('Changes discarded');
    });

    el.qvBtn.addEventListener('click', ()=>{
      el.qvRole.textContent = el.role.value;
      el.qvList.innerHTML = '';
      Object.keys(MENUS).forEach(menu=>{
        const li=document.createElement('li');
        li.innerHTML=`<strong>${menu}</strong> — ${menuSummary(activePerms,menu)}`;
        el.qvList.appendChild(li);
      });
      el.qvB.style.display='flex';
    });
    el.qvClose.addEventListener('click', ()=> el.qvB.style.display='none');
    el.qvB.addEventListener('click', (e)=>{ if(e.target===el.qvB) el.qvB.style.display='none'; });

    // Small sanity note if DF_MENUS missing
    if (!Object.keys(MENUS).length) showStatus('Menus file not loaded — permissions grid will be empty.');

  }catch(e){
    console.error(e);
    showStatus(e && e.message ? e.message : 'Init failed.');
    try { toast('Init failed'); } catch(_){}
  }
})();