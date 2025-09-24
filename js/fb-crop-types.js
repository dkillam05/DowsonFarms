/* ===========================
   /js/fb-crop-types.js
   - Firestore CRUD for crop types
   - DFLoader integration for loading state
   - Toasts on save/delete
   - Graceful error handling (no blocking alerts)
   - Quick View provider (works even when empty or on error)
   - Collection: "crop_types"
   - Auth redirect logic is owned by core.js (none here)
   =========================== */

import {
  collection, doc, setDoc, addDoc, deleteDoc, getDocs, getDoc,
  serverTimestamp, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

/* ----- tiny helpers ----- */
const $ = (s) => document.querySelector(s);

function showToast(msg){
  const box = $('#dfToast'), txt = $('#dfToastText');
  if (!box || !txt) { console.warn(msg); return; }
  txt.textContent = msg || 'Saved';
  box.style.display = 'block';
  clearTimeout(window.__ctToastT);
  window.__ctToastT = setTimeout(() => { box.style.display = 'none'; }, 2000);
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

/* ----- CRUD (with error surfaces) ----- */
async function listAll(db){
  try {
    const snaps = await getDocs(query(CT(db), orderBy('name')));
    const out=[]; snaps.forEach(d=> out.push({ id:d.id, ...(d.data()||{}) }));
    return { rows: out, error: null };
  } catch (err) {
    return { rows: [], error: err };
  }
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
  const { db } = getHandles(); 
  const host = document.querySelector('main.content');
  const tbody = $('#ctTbody'); 
  const badge = $('#ctCount');

  if (!db) {
    if (badge) badge.textContent = '0';
    if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="muted-sm">Database not initialized.</td></tr>`;
    return;
  }

  await DFLoader.with(host, async () => {
    const { rows, error } = await listAll(db);
    if (badge) badge.textContent = String(rows.length);

    if (!tbody) return;

    if (error) {
      const msg = (error && error.code) ? error.code : 'error';
      tbody.innerHTML = `<tr><td colspan="6" class="muted-sm">Error loading crop types: ${msg}</td></tr>`;
      return;
    }

    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="muted-sm">No crop types yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = rows.map(r=>{
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
    }).join('');
  });

  // wire row actions
  tbody?.querySelectorAll('[data-edit]').forEach(btn=>{
    btn.addEventListener('click', ()=> openForEdit(btn.getAttribute('data-edit')));
  });
  tbody?.querySelectorAll('[data-del]').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      const id = btn.getAttribute('data-del');
      if (!id) return;
      if (!confirm('Delete this crop type?')) return;
      try {
        await removeOne(getHandles().db, id);
        await render();
        showToast('Deleted');
      } catch (e) {
        showToast(`Delete failed: ${(e && e.code) || 'error'}`);
      }
    });
  });
}

/* ----- edit load ----- */
async function openForEdit(id){
  const { db } = getHandles(); if (!db) return;
  try {
    const snap = await getDoc(doc(CT(db), id));
    if (!snap.exists()) { showToast('Not found'); return; }
    const r = { id:snap.id, ...(snap.data()||{}) };

    $('#ctId').value = r.id;
    $('#ctName').value = r.name || '';
    $('#ctMoisture').value = (typeof r.moisture==='number' ? toOneDecString(r.moisture) : '');
    $('#ctTestWeight').value = (typeof r.testWeight==='number' ? toOneDecString(r.testWeight) : '');
    $('#ctColor').value = r.color || '#1B5E20';

    $('#ctName').focus({preventScroll:false});
    window.scrollTo({top:0, behavior:'smooth'});
  } catch (e) {
    showToast(`Load failed: ${(e && e.code) || 'error'}`);
  }
}

/* ----- form wiring ----- */
function installForm(){
  const form = $('#ct-form'); if (!form) return;
  const resetBtn = $('#resetBtn');

  // keep iOS caret stable
  function guardOneDot(evt){
    const el = evt.target;
    if (evt.key === '.') {
      if (el.value.includes('.')) { evt.preventDefault(); return; }
      return;
    }
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
  const m = $('#ctMoisture'), t = $('#ctTestWeight');
  m && m.addEventListener('keydown', guardOneDot);
  t && t.addEventListener('keydown', guardOneDot);
  m && m.addEventListener('blur', ()=>fmt1(m,{min:0,max:100}));
  t && t.addEventListener('blur', ()=>fmt1(t,{min:0}));

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const { db } = getHandles(); 
    if (!db) { showToast('Database not ready'); return; }

    const id = ($('#ctId').value || '').trim() || null;
    const name = titleCase(($('#ctName').value || '').trim());
    const moisture = Number(($('#ctMoisture').value || '').trim());
    const testWeight = Number(($('#ctTestWeight').value || '').trim());
    const color = ($('#ctColor').value || '').trim() || '#1B5E20';

    if (!name){ showToast('Crop Type is required'); $('#ctName').focus(); return; }
    if (!Number.isFinite(moisture)){ showToast('Desired Moisture is required'); $('#ctMoisture').focus(); return; }
    if (!Number.isFinite(testWeight)){ showToast('Test Weight is required'); $('#ctTestWeight').focus(); return; }

    try {
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
    } catch (e) {
      showToast(`Save failed: ${(e && e.code) || 'error'}`);
    }
  });

  resetBtn?.addEventListener('click', ()=>{
    form.reset();
    $('#ctId').value = '';
  });
}

/* ---------- Quick View provider for core.js ---------- */
window.DF_QUICKVIEW_PROVIDER = async () => {
  const { db } = getHandles();
  if (!db) return { title: 'Crop Types', html: '<div style="opacity:.7">Database not ready.</div>' };

  const { rows, error } = await listAll(db);

  if (error) {
    const msg = (error && error.code) ? error.code : 'error';
    return { title: 'Crop Types', html: `<div style="opacity:.7">Error: ${msg}</div>` };
  }
  if (!rows.length) {
    return { title: 'Crop Types', html: '<div style="opacity:.7">No crop types yet.</div>' };
  }

  // Build compact table
  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;">
      <strong>Total: ${rows.length}</strong>
    </div>
    <div style="overflow:auto;">
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr>
            <th style="text-align:left;padding:8px;border-bottom:1px solid var(--tile-border)">Name</th>
            <th style="text-align:left;padding:8px;border-bottom:1px solid var(--tile-border)">Moisture</th>
            <th style="text-align:left;padding:8px;border-bottom:1px solid var(--tile-border)">Test Wt</th>
            <th style="text-align:left;padding:8px;border-bottom:1px solid var(--tile-border)">Color</th>
            <th style="text-align:left;padding:8px;border-bottom:1px solid var(--tile-border)">Updated</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
  `;
  const tbody = wrap.querySelector('tbody');
  rows.forEach(r=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="padding:8px;border-bottom:1px solid var(--tile-border)"><strong>${r.name || '(Unnamed)'}</strong></td>
      <td style="padding:8px;border-bottom:1px solid var(--tile-border)">${typeof r.moisture==='number'? toOneDecString(r.moisture)+'%':'—'}</td>
      <td style="padding:8px;border-bottom:1px solid var(--tile-border)">${typeof r.testWeight==='number'? toOneDecString(r.testWeight)+' lb/bu':'—'}</td>
      <td style="padding:8px;border-bottom:1px solid var(--tile-border)">
        <span style="display:inline-block;width:12px;height:12px;border-radius:3px;margin-right:6px;border:1px solid rgba(0,0,0,.18);vertical-align:-2px;background:${r.color||'#1B5E20'}"></span>
        <code style="font-size:.9em;">${r.color || '#1B5E20'}</code>
      </td>
      <td style="padding:8px;border-bottom:1px solid var(--tile-border)">${fmtDate(r.updatedAt || r.createdAt)}</td>
    `;
    tbody.appendChild(tr);
  });

  return { title: 'Crop Types', node: wrap };
};

/* ----- init ----- */
document.addEventListener('DOMContentLoaded', async ()=>{
  DFLoader.attach(document.querySelector('main.content'));
  installForm();
  await render();

  window.setBreadcrumbs && window.setBreadcrumbs([
    {label:'Home', href:'../index.html'},
    {label:'Setup / Settings', href:'./index.html'},
    {label:'Crop Types'}
  ]);

  try { window.DF_UI?.refreshQuickView?.(); } catch(_) {}
});