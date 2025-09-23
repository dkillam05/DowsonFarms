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

const $ = (s) => document.querySelector(s);

// ---- Toast (shared look with rest of app) ----
function showToast(msg) {
  const box = $('#dfToast'), txt = $('#dfToastText');
  if (!box || !txt) { alert(msg || 'Saved'); return; }
  txt.textContent = msg || 'Saved';
  box.style.display = 'block';
  clearTimeout(window.__ctToastT);
  window.__ctToastT = setTimeout(() => { box.style.display = 'none'; }, 1800);
}

// ---- Safe DFLoader wrappers ----
const DFLoader = {
  attach(host) {
    try { window.DFLoader && window.DFLoader.attach && window.DFLoader.attach(host); } catch (_) {}
  },
  async with(host, fn) {
    if (window.DFLoader && typeof window.DFLoader.withLoader === 'function') {
      return window.DFLoader.withLoader(host, fn);
    }
    return fn();
  }
};

// ---- Helpers ----
function titleCase(s){ return (s || '').toLowerCase().replace(/\b([a-z])/g, c => c.toUpperCase()); }
function toNumber(v) {
  const n = Number(String(v).trim());
  return Number.isFinite(n) ? n : null;
}
function fmtDate(ts){
  try{
    const d = ts?.toDate ? ts.toDate() : (ts ? new Date(ts) : null);
    if(!d) return '—';
    return new Intl.DateTimeFormat(undefined, {
      year:'numeric', month:'short', day:'2-digit',
      hour:'2-digit', minute:'2-digit'
    }).format(d);
  }catch(_){ return '—'; }
}

// ---- Firestore handles ----
function getHandles() {
  const fb = window.DF_FB || {};
  return { db: fb.db, auth: fb.auth };
}

// ---- CRUD ----
function ctCollection(db){ return collection(db, 'crop_types'); }

async function listAll(db){
  const snaps = await getDocs(query(ctCollection(db), orderBy('name')));
  const out = [];
  snaps.forEach(d => out.push({ id:d.id, ...(d.data()||{}) }));
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

// ---- Render table ----
async function render(){
  const { db } = getHandles();
  if (!db) return;

  const tbody = $('#ctTbody');
  const badge = $('#ctCount');
  const host = document.querySelector('main.content');

  await DFLoader.with(host, async () => {
    const rows = await listAll(db);
    if (badge) badge.textContent = String(rows.length);

    if (!tbody) return;
    tbody.innerHTML = rows.length ? rows.map(r => {
      const swatch = `<span style="display:inline-block;width:14px;height:14px;border-radius:3px;margin-right:6px;border:1px solid rgba(0,0,0,.18);vertical-align:-2px;background:${r.color||'#1B5E20'}"></span>`;
      const moist = (typeof r.moisture === 'number' ? `${r.moisture}%` : '—');
      const tw = (typeof r.testWeight === 'number' ? `${r.testWeight} lb/bu` : '—');
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

  // actions
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

// ---- Load one into the form for editing ----
async function openForEdit(id){
  const { db } = getHandles();
  if (!db) return;

  const snap = await getDoc(doc(ctCollection(db), id));
  if (!snap.exists()) return alert('Not found');
  const r = { id:snap.id, ...(snap.data()||{}) };

  $('#ctId').value = r.id;
  $('#ctName').value = r.name || '';
  $('#ctMoisture').value = (typeof r.moisture==='number'? r.moisture : '');
  $('#ctTestWeight').value = (typeof r.testWeight==='number'? r.testWeight : '');
  $('#ctColor').value = r.color || '#1B5E20';

  $('#ctName').focus({preventScroll:false});
  window.scrollTo({top:0, behavior:'smooth'});
}

// ---- Form wiring ----
function installForm(){
  const form = $('#ct-form');
  const resetBtn = $('#resetBtn');
  if (!form) return;

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const { db } = getHandles();
    if (!db) return alert('Database not initialized yet. Try again in a moment.');

    const id = ($('#ctId').value || '').trim() || null;
    const name = titleCase(($('#ctName').value || '').trim());
    const moisture = toNumber($('#ctMoisture').value);
    const testWeight = toNumber($('#ctTestWeight').value);
    const color = ($('#ctColor').value || '#1B5E20').trim();

    if(!name){ alert('Crop Type is required.'); return; }
    if(moisture == null || moisture < 0 || moisture > 100){ alert('Enter a valid Desired Moisture (0–100).'); return; }
    if(testWeight == null || testWeight <= 0){ alert('Enter a valid Test Weight (lb/bu).'); return; }

    await DFLoader.with(document.querySelector('main.content'), async () => {
      await upsert(db, { id, name, moisture, testWeight, color });
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

// ---- Auth handling: hard redirect if signed out ----
function installAuthRedirect(){
  const repoRoot = (function getRepoRootPath(){
    const baseEl = document.querySelector('base');
    if (baseEl && baseEl.href) {
      try { const u=new URL(baseEl.href); return u.pathname.endsWith('/')?u.pathname:(u.pathname+'/'); } catch(_){}
    }
    const seg=(window.location.pathname||'/').split('/').filter(Boolean);
    if (seg.length>0) return '/'+seg[0]+'/';
    return '/';
  })();
  const loginURL = repoRoot + 'auth/index.html';

  const goLogin = ()=> { try{ location.replace(loginURL); }catch(_){ location.href = loginURL; } };

  // If core.js already enforces this, we may never run — still safe.
  const fb = window.DF_FB || {};
  const auth = fb.auth;
  if (!auth) return; // firebase-init not ready yet; core.js will still protect

  // If we already know the user, enforce immediately
  if (!auth.currentUser) {
    // give firebase a tiny beat to populate, then decide
    setTimeout(()=>{ if (!auth.currentUser) goLogin(); }, 250);
  }

  // If your firebase-init exposes an onAuth helper, use it
  if (window.DF_FB_API && typeof window.DF_FB_API.onAuth === 'function') {
    window.DF_FB_API.onAuth((user)=>{ if (!user) goLogin(); });
  } else if (typeof auth.onAuthStateChanged === 'function') {
    auth.onAuthStateChanged((user)=>{ if (!user) goLogin(); });
  }
}

// ---- Init ----
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