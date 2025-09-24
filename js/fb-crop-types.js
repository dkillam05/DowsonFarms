/* ===========================
   /js/fb-crop-types.js
   - Firestore CRUD for crop types
   - Uses DFLoader for loading state
   - Redirect to login when signed out
   - Toasts on save/delete
   - Fields: name, moisture, testWeight, color
   - Collection: "crop_types"
   =========================== */

import {
  collection, doc, setDoc, addDoc, deleteDoc, getDocs, getDoc,
  serverTimestamp, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

/* ----- tiny helpers ----- */
const $ = (s) => document.querySelector(s);
const repoRoot = (function(){
  const baseEl = document.querySelector('base');
  if (baseEl && baseEl.href) {
    try { const u = new URL(baseEl.href); return u.pathname.endsWith('/')?u.pathname:(u.pathname+'/'); } catch(_){}
  }
  const seg=(location.pathname||'/').split('/').filter(Boolean);
  return seg.length ? '/'+seg[0]+'/' : '/';
})();
const LOGIN_URL = repoRoot + 'auth/index.html';

function showToast(msg){
  const box = $('#dfToast'), txt = $('#dfToastText');
  if (!box || !txt) { alert(msg || 'Saved'); return; }
  txt.textContent = msg || 'Saved';
  box.style.display = 'block';
  clearTimeout(window.__ctToastT);
  window.__ctToastT = setTimeout(() => { box.style.display = 'none'; }, 1800);
}

const DFLoader = {
  attach(host){ try{ window.DFLoader?.attach?.(host); }catch(_){} },
  async with(host, fn){ return (window.DFLoader?.withLoader ? window.DFLoader.withLoader(host, fn) : fn()); }
};

function titleCase(s){ return (s||'').toLowerCase().replace(/\b([a-z])/g, c=>c.toUpperCase()); }
function fmtDate(ts){
  try{
    const d = ts?.toDate ? ts.toDate() : (ts ? new Date(ts) : null);
    if(!d) return '—';
    return new Intl.DateTimeFormat(undefined,{year:'numeric',month:'short',day:'2-digit',hour:'2-digit',minute:'2-digit'}).format(d);
  }catch(_){ return '—'; }
}
function toOneDecString(n){
  return (n==null || !Number.isFinite(n)) ? '' : Number(n).toFixed(1);
}

/* ----- Firestore handles ----- */
function getHandles(){ const fb = window.DF_FB || {}; return { db: fb.db, auth: fb.auth }; }
function CT(db){ return collection(db, 'crop_types'); }

/* ----- CRUD ----- */
async function listAll(db){
  const snaps = await getDocs(query(CT(db), orderBy('name')));
  const out=[]; snaps.forEach(d=> out.push({ id:d.id, ...(d.data()||{}) }));
  return out;
}
async function upsert(db, item){
  const base = {
    name: item.name,
    moisture: item.moisture,
    testWeight: item.testWeight,
    color: item.color || '#1B5E20',
    updatedAt: serverTimestamp(),
    createdAt: item.createdAt || serverTimestamp()
  };
  if (item.id) {
    await setDoc(doc(CT(db), item.id), base, { merge:true });
    return item.id;
  } else {
    const ref = await addDoc(CT(db), base);
    return ref.id;
  }
}
async function removeOne(db, id){ await deleteDoc(doc(CT(db), id)); }

/* ----- table render ----- */
async function render(){
  const { db } = getHandles(); if (!db) return;
  const tbody = $('#ctTbody'); const badge = $('#ctCount');
  const host = document.querySelector('main.content');

  await DFLoader.with(host, async () => {
    const rows = await listAll(db);
    if (badge) badge.textContent = String(rows.length);
    if (!tbody) return;

    tbody.innerHTML = rows.length ? rows.map(r=>{
      const moist = (typeof r.moisture==='number') ? `${toOneDecString(r.moisture)}%` : '—';
      const tw = (typeof r.testWeight==='number') ? `${toOneDecString(r.testWeight)} lb/bu` : '—';
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
      await removeOne(getHandles().db, id);
      await render();
      showToast('Deleted');
    });
  });
}

/* ----- edit load ----- */
async function openForEdit(id){
  const { db } = getHandles(); if (!db) return;
  const snap = await getDoc(doc(CT(db), id));
  if (!snap.exists()) return alert('Not found');
  const r = { id:snap.id, ...(snap.data()||{}) };

  $('#ctId').value = r.id;
  $('#ctName').value = r.name || '';
  $('#ctMoisture').value = (typeof r.moisture==='number' ? toOneDecString(r.moisture) : '');
  $('#ctTestWeight').value = (typeof r.testWeight==='number' ? toOneDecString(r.testWeight) : '');
  $('#ctColor').value = r.color || '#1B5E20';

  $('#ctName').focus({preventScroll:false});
  window.scrollTo({top:0, behavior:'smooth'});
}

/* ----- number input behavior (single source of truth) ----- */
function installNumberGuards(){
  const m = $('#ctMoisture'), t = $('#ctTestWeight');

  function guardOneDot(evt){
    const el = evt.target;
    if (evt.key === '.') { if (el.value.includes('.')) evt.preventDefault(); return; }
    const ok = /[0-9]/.test(evt.key) ||
               ['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Home','End','Enter'].includes(evt.key);
    if (!ok) evt.preventDefault();
  }
  function fmt1(el, opts){
    var v = String(el.value || '').trim(); if (!v) return;
    var n = Number(v); if (!Number.isFinite(n)) return;
    if (opts && typeof opts.min === 'number' && n < opts.min) n = opts.min;
    if (opts && typeof opts.max === 'number' && n > opts.max) n = opts.max;
    el.value = n.toFixed(1);
  }
  m && m.addEventListener('keydown', guardOneDot);
  t && t.addEventListener('keydown', guardOneDot);
  m && m.addEventListener('blur', ()=>fmt1(m,{min:0,max:100}));
  t && t.addEventListener('blur', ()=>fmt1(t,{min:0}));
}

/* ----- form wiring ----- */
function installForm(){
  const form = $('#ct-form'); if (!form) return;
  const resetBtn = $('#resetBtn');

  installNumberGuards();

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const { db } = getHandles(); if (!db) return alert('Database not initialized yet. Try again.');

    const id = ($('#ctId').value || '').trim() || null;
    const name = titleCase(($('#ctName').value || '').trim());
    const moisture = Number(($('#ctMoisture').value || '').trim());
    const testWeight = Number(($('#ctTestWeight').value || '').trim());
    const color = ($('#ctColor').value || '').trim();

    // required fields
    if (!name){ alert('Crop Type is required.'); $('#ctName').focus(); return; }
    if (!Number.isFinite(moisture)){ alert('Desired Moisture is required (xx.x).'); $('#ctMoisture').focus(); return; }
    if (!Number.isFinite(testWeight)){ alert('Test Weight is required (xx.x).'); $('#ctTestWeight').focus(); return; }
    if (!color){ alert('Color is required.'); $('#ctColor').focus(); return; }

    await DFLoader.with(document.querySelector('main.content'), async ()=>{
      await upsert(db, {
        id,
        name,
        moisture: Number(moisture.toFixed(1)),
        testWeight: Number(testWeight.toFixed(1)),
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

/* ----- auth redirect ----- */
function installAuthRedirect(){
  const { auth } = getHandles();
  const goLogin = ()=> { try{ location.replace(LOGIN_URL); }catch(_){ location.href = LOGIN_URL; } };
  if (!auth) return;
  if (!auth.currentUser) setTimeout(()=>{ if (!auth.currentUser) goLogin(); }, 250);
  if (window.DF_FB_API?.onAuth) {
    window.DF_FB_API.onAuth((user)=>{ if (!user) goLogin(); });
  } else if (typeof auth.onAuthStateChanged === 'function') {
    auth.onAuthStateChanged((user)=>{ if (!user) goLogin(); });
  }
}

/* ----- init ----- */
document.addEventListener('DOMContentLoaded', async ()=>{
  DFLoader.attach(document.querySelector('main.content'));
  installAuthRedirect();
  installForm();
  await render();

  window.setBreadcrumbs && window.setBreadcrumbs([
    {label:'Home', href:'../index.html'},
    {label:'Setup / Settings', href:'./index.html'},
    {label:'Crop Types'}
  ]);
});