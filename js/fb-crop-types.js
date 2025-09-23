/* ===========================
   /js/fb-crop-types.js
   - Firestore CRUD for crop types
   - Uses DFLoader for loading state
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

const { db, auth } = window.DF_FB || {};

const $ = (s) => document.querySelector(s);

// --- Toast ---
function showToast(msg) {
  const box = $('#dfToast'), txt = $('#dfToastText');
  if (!box || !txt) return alert(msg || 'Saved');
  txt.textContent = msg || 'Saved';
  box.style.display = 'block';
  clearTimeout(window.__ctToastT);
  window.__ctToastT = setTimeout(() => { box.style.display = 'none'; }, 1800);
}

// --- Firestore handles ---
const CT = collection(db, 'crop_types');

// --- Helpers ---
function titleCase(s){ return (s || '').toLowerCase().replace(/\b([a-z])/g, c => c.toUpperCase()); }
function toNumber(v) {
  const n = Number(v);
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

// --- CRUD ---
async function listAll(){
  const snaps = await getDocs(query(CT, orderBy('name')));
  const out = [];
  snaps.forEach(d => out.push({ id:d.id, ...(d.data()||{}) }));
  return out;
}

async function upsert(item){
  // If editing (has id) -> setDoc with merge;
  // If new -> addDoc for unique id
  const base = {
    name: item.name,
    moisture: item.moisture,
    testWeight: item.testWeight,
    color: item.color || '#1B5E20',
    updatedAt: serverTimestamp(),
    createdAt: item.createdAt || serverTimestamp()
  };
  if (item.id) {
    await setDoc(doc(CT, item.id), base, { merge:true });
    return item.id;
  } else {
    const ref = await addDoc(CT, base);
    return ref.id;
  }
}

async function remove(id){
  await deleteDoc(doc(CT, id));
}

// --- Render table ---
async function render(){
  const tbody = $('#ctTbody');
  const badge = $('#ctCount');
  await window.DFLoader.withLoader(document.querySelector('main.content'), async () => {
    const rows = await listAll();
    badge && (badge.textContent = String(rows.length));
    if (!tbody) return;

    tbody.innerHTML = rows.length ? rows.map(r => {
      const colorDot = `<span class="swatch" style="background:${r.color||'#1B5E20'}"></span>`;
      const moist = (typeof r.moisture === 'number' ? `${r.moisture}%` : '—');
      const tw = (typeof r.testWeight === 'number' ? `${r.testWeight} lb/bu` : '—');
      return `<tr data-id="${r.id}">
        <td><strong>${r.name || '(Unnamed)'}</strong></td>
        <td>${moist}</td>
        <td>${tw}</td>
        <td><span class="chip">${colorDot}<span>${r.color || '#1B5E20'}</span></span></td>
        <td>${fmtDate(r.updatedAt || r.createdAt)}</td>
        <td>
          <button class="btn-secondary" data-edit="${r.id}">Edit</button>
          <button class="btn-outline" data-del="${r.id}">Delete</button>
        </td>
      </tr>`;
    }).join('') : `<tr><td colspan="6" class="muted-sm">No crop types yet.</td></tr>`;
  });

  // Hook up actions
  tbody?.querySelectorAll('[data-edit]').forEach(btn=>{
    btn.addEventListener('click', ()=> openForEdit(btn.getAttribute('data-edit')));
  });
  tbody?.querySelectorAll('[data-del]').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      const id = btn.getAttribute('data-del');
      if (!id) return;
      if (!confirm('Delete this crop type?')) return;
      await remove(id);
      await render();
      showToast('Deleted');
    });
  });
}

// --- Load one into the form for editing ---
async function openForEdit(id){
  const snap = await getDoc(doc(CT, id));
  if (!snap.exists()) return alert('Not found');
  const r = { id:snap.id, ...(snap.data()||{}) };

  $('#ctId').value = r.id;
  $('#ctName').value = r.name || '';
  $('#ctMoisture').value = (typeof r.moisture==='number'? r.moisture : '');
  $('#ctTestWeight').value = (typeof r.testWeight==='number'? r.testWeight : '');
  $('#ctColor').value = r.color || '#1B5E20';

  // Focus first field
  $('#ctName').focus({preventScroll:false});
  window.scrollTo({top:0, behavior:'smooth'});
}

// --- Form wiring ---
function installForm(){
  const form = $('#ct-form');
  const resetBtn = $('#resetBtn');
  if (!form) return;

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();

    const id = ($('#ctId').value || '').trim() || null;
    const name = titleCase(($('#ctName').value || '').trim());
    const moisture = toNumber($('#ctMoisture').value);
    const testWeight = toNumber($('#ctTestWeight').value);
    const color = ($('#ctColor').value || '#1B5E20').trim();

    if(!name){ alert('Crop Type is required.'); return; }
    if(moisture == null || moisture < 0 || moisture > 100){ alert('Enter a valid Desired Moisture (0–100).'); return; }
    if(testWeight == null || testWeight <= 0){ alert('Enter a valid Test Weight (lb/bu).'); return; }

    await window.DFLoader.withLoader(document.querySelector('main.content'), async () => {
      await upsert({ id, name, moisture, testWeight, color });
    });

    // Reset and refresh
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

// --- Auth banner (optional: shows if no user) ---
function checkAuthBanner(){
  try{
    const banner = $('#authWarn');
    if (!banner || !auth) return;
    const user = auth.currentUser;
    banner.style.display = user ? 'none' : 'block';
  }catch(_){}
}

// --- Init ---
document.addEventListener('DOMContentLoaded', async ()=>{
  try{
    // attach loader once to the main content
    window.DFLoader.attach(document.querySelector('main.content'));
  }catch(_){}

  installForm();
  checkAuthBanner();
  await render();

  // Breadcrumbs helper (no-op if already static)
  window.setBreadcrumbs && window.setBreadcrumbs([
    {label:'Home', href:'../index.html'},
    {label:'Setup / Settings', href:'./index.html'},
    {label:'Crop Types'}
  ]);
});