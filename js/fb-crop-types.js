/* ===========================
   /js/fb-crop-types.js
   - Firestore CRUD for crop types
   - Uses DFLoader for loading state
   - Redirect to login when signed out (no banner)
   - Toasts on save/delete
   - Fields:
     name (string)            -> "Crop Type"
     moisture (number)        -> "Desired Moisture"
     testWeight (number)      -> "Test Weight"
     color (string, hex)      -> "Color for charting"
   - Collection: "crop_types"
   =========================== */

import {
  collection, doc, setDoc, addDoc, deleteDoc, getDocs, getDoc,
  serverTimestamp, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

/* ----------------- tiny helpers ----------------- */
const $ = (s) => document.querySelector(s);
const repoRoot = (function getRepoRootPath(){
  const baseEl = document.querySelector('base');
  if (baseEl && baseEl.href) {
    try { const u=new URL(baseEl.href); return u.pathname.endsWith('/')?u.pathname:(u.pathname+'/'); } catch(_){}
  }
  const seg=(window.location.pathname||'/').split('/').filter(Boolean);
  if (seg.length>0) return '/'+seg[0]+'/';
  return '/';
})();
const LOGIN_URL = repoRoot + 'auth/index.html';

function showToast(msg) {
  const box = $('#dfToast'), txt = $('#dfToastText');
  if (!box || !txt) { alert(msg || 'Saved'); return; }
  txt.textContent = msg || 'Saved';
  box.style.display = 'block';
  clearTimeout(window.__ctToastT);
  window.__ctToastT = setTimeout(() => { box.style.display = 'none'; }, 1800);
}

const DFLoader = {
  attach(host) { try { window.DFLoader?.attach?.(host); } catch(_){} },
  async with(host, fn){
    if (window.DFLoader?.withLoader) return window.DFLoader.withLoader(host, fn);
    return fn();
  }
};

function titleCase(s){ return (s||'').toLowerCase().replace(/\b([a-z])/g, c=>c.toUpperCase()); }
function fmtDate(ts){
  try{
    const d = ts?.toDate ? ts.toDate() : (ts ? new Date(ts) : null);
    if(!d) return '—';
    return new Intl.DateTimeFormat(undefined,{year:'numeric',month:'short',day:'2-digit',hour:'2-digit',minute:'2-digit'}).format(d);
  }catch(_){ return '—'; }
}

/* ----------------- number format: exactly one decimal (xx.x) ----------------- */
function clampOneDecimal(raw, {min=0, max=99.9}={}){
  if (raw==='' || raw==null) return null;
  let n = Number(String(raw).replace(/[^\d.]/g,''));
  if (!Number.isFinite(n)) return null;
  n = Math.min(Math.max(n, min), max);
  // one decimal
  return Math.round(n * 10) / 10;
}
function toXXdotXString(n){
  if (n==null || !Number.isFinite(n)) return '';
  // keep at most two digits before decimal, one after
  const fixed = Number(n).toFixed(1);
  return fixed.length > 4 ? fixed.slice(-4) : fixed; // safety, but fixed is usually 4 chars like "15.5"
}
function installOneDecimalMask(input, opts){
  if (!input) return;
  // prevent iOS zoom via CSS already; this handles content/format
  input.addEventListener('input', ()=>{
    // allow digits and a single decimal; strip others
    let v = input.value;
    // keep only first dot
    const parts = v.replace(/[^\d.]/g,'').split('.');
    v = parts[0].slice(0,2) + (parts.length>1 ? '.' + parts[1].slice(0,1) : '');
    input.value = v;
  });
  input.addEventListener('blur', ()=>{
    const n = clampOneDecimal(input.value, opts);
    input.value = n==null ? '' : toXXdotXString(n);
  });
}

/* ----------------- Firestore handles ----------------- */
function getHandles(){
  const fb = window.DF_FB || {};
  return { db: fb.db, auth: fb.auth };
}
function ctCollection(db){ return collection(db, 'crop_types'); }

/* ----------------- CRUD ----------------- */
async function listAll(db){
  const snaps = await getDocs(query(ctCollection(db), orderBy('name')));
  const out=[]; snaps.forEach(d=> out.push({ id:d.id, ...(d.data()||{}) }));
  return out;
}
async function upsert(db, item){
  const base = {
    name: item.name,
    moisture: item.moisture,
    testWeight: item.testWeight,
    color: (item.color || '#1B5E20'),
    updatedAt: serverTimestamp(),
    createdAt: item.createdAt || serverTimestamp()
  };
  if (item.id) {
    await setDoc(doc(ctCollection(db), item.id), base, { merge:true });
    return item.id;
  } else {
    const ref = await addDoc(ctCollection(db), base);
    return ref.id;
  }
}
async function remove(db, id){
  await deleteDoc(doc(ctCollection(db), id));
}

/* ----------------- table render ----------------- */
async function render(){
  const { db } = getHandles(); if (!db) return;
  const tbody = $('#ctTbody');
  const badge = $('#ctCount');
  const host = document.querySelector('main.content');

  await DFLoader.with(host, async () => {
    const rows = await listAll(db);
    if (badge) badge.textContent = String(rows.length);

    if (!tbody) return;
    tbody.innerHTML = rows.length ? rows.map(r=>{
      const moist = (typeof r.moisture==='number') ? `${toXXdotXString(r.moisture)}%` : '—';
      const tw    = (typeof r.testWeight==='number') ? `${toXXdotXString(r.testWeight)} lb/bu` : '—';
      const swatch = `<span style="display:inline-block;width:14px;height:14px;border-radius:3px;margin-right:6px;border:1px solid rgba(0,0,0,.18);vertical-align:-2px;background:${r.color||'#1B5E20'}"></span>`;
      return `<tr data-id="${r.id}">
        <td><strong>${r.name || '(Unnamed)'}</strong></td>
        <td>${moist}</td>
        <td>${tw}</td>
        <td>${swatch}<code style="font-size:.9em;">${r.color || '#1B5E20'}</code></td>
        <td>${fmtDate(r.updatedAt || r.createdAt)}</td>
        <td>
          <button class="btn-secondary" data-edit="${r.id}">Edit</button>
          <button class="btn-outline" data-del="${r.id}">Delete</button>
        </td>
      </tr>`;
    }).join('') : `<tr><td colspan="6" class="muted-sm">No crop types yet.</td></tr>`;
  });

  tbody?.querySelectorAll('[data-edit]').forEach(btn=>{
    btn.addEventListener('click', ()=> openForEdit(btn.getAttribute('data-edit')));
  });
  tbody?.querySelectorAll('[data-del]').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      const id = btn.getAttribute('data-del');
      if (!id) return;
      if (!confirm('Delete this crop type?')) return;
      await remove(getHandles().db, id);
      await render();
      showToast('Deleted');
    });
  });
}

/* ----------------- edit load ----------------- */
async function openForEdit(id){
  const { db } = getHandles(); if (!db) return;
  const snap = await getDoc(doc(ctCollection(db), id));
  if (!snap.exists()) return alert('Not found');
  const r = { id:snap.id, ...(snap.data()||{}) };

  $('#ctId').value = r.id;
  $('#ctName').value = r.name || '';
  $('#ctMoisture').value = (typeof r.moisture==='number' ? toXXdotXString(r.moisture) : '');
  $('#ctTestWeight').value = (typeof r.testWeight==='number' ? toXXdotXString(r.testWeight) : '');
  $('#ctColor').value = r.color || '#1B5E20';

  $('#ctName').focus({preventScroll:false});
  window.scrollTo({top:0, behavior:'smooth'});
}

/* ----------------- form wiring ----------------- */
function installForm(){
  const form = $('#ct-form'); if (!form) return;
  const resetBtn = $('#resetBtn');

  // one-decimal maskers
  installOneDecimalMask($('#ctMoisture'),   {min:0, max:99.9});
  installOneDecimalMask($('#ctTestWeight'), {min:0, max:99.9});

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const { db } = getHandles(); if (!db) return alert('Database not initialized yet. Try again.');

    const id = ($('#ctId').value || '').trim() || null;
    const name = titleCase(($('#ctName').value || '').trim());
    const moisture = clampOneDecimal($('#ctMoisture').value, {min:0, max:99.9});
    const testWeight = clampOneDecimal($('#ctTestWeight').value, {min:0, max:99.9});
    const color = ($('#ctColor').value || '').trim();

    // Enforce required (all three fields)
    if (!name){ alert('Crop Type is required.'); $('#ctName').focus(); return; }
    if (moisture==null){ alert('Desired Moisture is required (xx.x).'); $('#ctMoisture').focus(); return; }
    if (testWeight==null){ alert('Test Weight is required (xx.x).'); $('#ctTestWeight').focus(); return; }
    if (!color){ alert('Color is required.'); $('#ctColor').focus(); return; }

    await DFLoader.with(document.querySelector('main.content'), async ()=>{
      await upsert(db, {
        id,
        name,
        moisture,
        testWeight,
        color
      });
    });

    form.reset();
    $('#ctId').value = '';
    await render();
    showToast(id ? 'Crop type updated' : 'Crop type added');
  });

  resetBtn?.addEventListener('click', ()=>{
    form.reset();
    $('#ctId').value = '';
  });
}

/* ----------------- auth redirect ----------------- */
function installAuthRedirect(){
  const { auth } = getHandles();
  const goLogin = ()=> { try{ location.replace(LOGIN_URL); }catch(_){ location.href = LOGIN_URL; } };

  if (!auth) return; // core.js guard will also handle this

  if (!auth.currentUser) {
    setTimeout(()=>{ if (!auth.currentUser) goLogin(); }, 250);
  }

  if (window.DF_FB_API?.onAuth) {
    window.DF_FB_API.onAuth((user)=>{ if (!user) goLogin(); });
  } else if (typeof auth.onAuthStateChanged === 'function') {
    auth.onAuthStateChanged((user)=>{ if (!user) goLogin(); });
  }
}

/* ----------------- init ----------------- */
document.addEventListener('DOMContentLoaded', async ()=>{
  DFLoader.attach(document.querySelector('main.content'));
  installAuthRedirect();
  installForm();
  await render();

  // Breadcrumbs helper (no-op if already static)
  window.setBreadcrumbs && window.setBreadcrumbs([
    {label:'Home', href:'../index.html'},
    {label:'Setup / Settings', href:'./index.html'},
    {label:'Crop Types'}
  ]);
});