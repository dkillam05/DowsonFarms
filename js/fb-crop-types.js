/* ===========================
   /js/fb-crop-types.js
   - Firestore CRUD for crop types
   - DFLoader for loading state
   - Toasts on save/delete
   - Fields: name, moisture, testWeight, color
   - Collection: "crop_types"
   - Quick View: DF_QUICKVIEW_PROVIDER (used by core.js)
   - No page-level auth redirection (core.js owns auth)
   =========================== */

import {
  collection, doc, setDoc, addDoc, deleteDoc, getDocs, getDoc,
  serverTimestamp, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

/* ----- tiny helpers ----- */
const $ = (s) => document.querySelector(s);

function showToast(msg){
  const box = $('#dfToast'), txt = $('#dfToastText');
  if (!box || !txt) { try { alert(msg || 'Saved'); } catch(_) {} return; }
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

/* ----- Firebase handles + wait ----- */
function getHandles(){ const fb = window.DF_FB || {}; return { db: fb.db, auth: fb.auth }; }

async function waitForDb(maxMs = 12000){
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const { db } = getHandles();
    if (db) return db;
    await new Promise(r => setTimeout(r, 120));
  }
  return null;
}

/* ----- collection ref ----- */
function CT(db){ return collection(db, 'crop_types'); }

/* ----- CRUD ----- */
async function listAll(db){
  const snaps = await getDocs(query(CT(db), orderBy('name')));
  const out=[]; snaps.forEach(d=> out.push({ id:d.id, ...(d.data()||{}) }));
  return out;
}

// IMPORTANT: do not overwrite createdAt when editing
async function upsert(db, item){
  const base = {
    name: item.name,
    moisture: item.moisture,
    testWeight: item.testWeight,
    color: item.color || '#1B5E20',
    updatedAt: serverTimestamp()
  };
  if (item.id) {
    // edit — merge, but DO NOT set createdAt here
    await setDoc(doc(CT(db), item.id), base, { merge:true });
    return item.id;
  } else {
    // create — set createdAt
    const ref = await addDoc(CT(db), { ...base, createdAt: serverTimestamp() });
    return ref.id;
  }
}
async function removeOne(db, id){ await deleteDoc(doc(CT(db), id)); }

/* ----- table render ----- */
async function render(){
  const db = await waitForDb();
  const tbody = $('#ctTbody'); const badge = $('#ctCount');
  const host = document.querySelector('main.content');

  if (!db) {
    if (badge) badge.textContent = '0';
    if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="muted-sm">Database not ready. Try again in a moment.</td></tr>`;
    return;
  }

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
      const db = await waitForDb();
      if (!db) { alert('Database not ready.'); return; }
      await removeOne(db, id);
      await render();
      showToast('Deleted');
    });
  });
}

/* ----- edit load ----- */
async function openForEdit(id){
  const db = await waitForDb();
  if (!db) { alert('Database not ready.'); return; }
  const snap = await getDoc(doc(CT(db), id));
  if (!snap.exists()) { alert('Not found'); return; }
  const r = { id:snap.id, ...(snap.data()||{}) };

  $('#ctId').value = r.id;
  $('#ctName').value = r.name || '';
  $('#ctMoisture').value = (typeof r.moisture==='number' ? toOneDecString(r.moisture) : '');
  $('#ctTestWeight').value = (typeof r.testWeight==='number' ? toOneDecString(r.testWeight) : '');
  $('#ctColor').value = r.color || '#1B5E20';

  $('#ctName').focus({preventScroll:false});
  window.scrollTo({top:0, behavior:'smooth'});
}

/* ----- form wiring ----- */
function installForm(){
  const form = $('#ct-form'); if (!form) return;
  const resetBtn = $('#resetBtn');

  // key guards (no live rewriting -> caret never jumps)
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
    const db = await waitForDb();
    if (!db) { alert('Database not initialized yet. Try again.'); return; }

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

/* ---------- Quick View provider for core.js ---------- */
window.DF_QUICKVIEW_PROVIDER = async () => {
  const db = await waitForDb();
  if (!db) return { title: 'Crop Types', html: '<div style="opacity:.7">Database not ready.</div>' };

  const rows = await listAll(db);
  if (!rows.length) {
    return { title: 'Crop Types', html: '<div style="opacity:.7">No crop types yet.</div>' };
  }

  // Build a compact table node (no inline width overflows)
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

  // Breadcrumbs (consistent)
  try {
    window.setBreadcrumbs && window.setBreadcrumbs([
      {label:'Home', href:'../index.html'},
      {label:'Setup / Settings', href:'./index.html'},
      {label:'Crop Types'}
    ]);
  } catch(_) {}

  // If core injected the QV button before this loaded, re-check to wire provider
  try { window.DF_UI?.refreshQuickView?.(); } catch(_) {}
});