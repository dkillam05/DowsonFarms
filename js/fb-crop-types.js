// Dowson Farms — fb-crop-types.js
// Simple pipeline check: add/read/update/delete crop types from Firestore.

import {
  collection, doc, getDoc, getDocs, setDoc, deleteDoc, serverTimestamp, orderBy, query
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const $ = s => document.querySelector(s);
const el = {
  form: $('#ct-form'),
  id:   $('#ctId'),
  name: $('#ctName'),
  code: $('#ctCode'),
  color:$('#ctColor'),
  save: $('#saveBtn'),
  reset:$('#resetBtn'),
  table:$('#ctTable'),
  tbody:$('#ctTbody'),
  count:$('#ctCount'),
  authWarn: $('#authWarn'),
  toast: $('#dfToast'), toastTxt: $('#dfToastText')
};

function toast(msg){
  el.toastTxt.textContent = msg || 'Saved';
  el.toast.style.display = 'block';
  clearTimeout(window.__t); window.__t = setTimeout(()=> el.toast.style.display='none', 1600);
}

function slugifyCode(v){
  return String(v||'').trim().toUpperCase().replace(/[^A-Z0-9_-]/g,'').slice(0,24);
}

function asHex(v){
  const s = String(v||'').trim();
  return /^#[0-9a-fA-F]{6}$/.test(s) ? s : '#1B5E20';
}

function fmtDate(ts){
  try{
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : (ts.seconds ? new Date(ts.seconds*1000) : new Date(ts));
    return new Intl.DateTimeFormat(undefined,{month:'short',day:'2-digit',year:'numeric',hour:'numeric',minute:'2-digit'}).format(d);
  }catch{ return '—'; }
}

function renderRows(rows){
  el.tbody.innerHTML = '';
  rows.forEach(row=>{
    const tr = document.createElement('tr');

    const tdName = document.createElement('td');
    tdName.textContent = row.name || '—';

    const tdCode = document.createElement('td');
    tdCode.textContent = row.code || row.id || '—';

    const tdColor = document.createElement('td');
    const swatch = document.createElement('span');
    swatch.textContent = row.color || '—';
    swatch.style.display='inline-flex';
    swatch.style.alignItems='center';
    swatch.style.gap='8px';
    const b = document.createElement('b');
    b.style.display='inline-block';
    b.style.width='14px'; b.style.height='14px';
    b.style.borderRadius='4px'; b.style.border='1px solid var(--tile-border)';
    b.style.background = row.color || '#1B5E20';
    swatch.prepend(b);
    tdColor.appendChild(swatch);

    const tdUpdated = document.createElement('td');
    tdUpdated.textContent = fmtDate(row.updatedAt);

    const tdAct = document.createElement('td');
    const edit = document.createElement('button');
    edit.type='button'; edit.className='btn-secondary'; edit.textContent='Edit';
    edit.addEventListener('click', ()=> {
      el.id.value   = row.id;
      el.name.value = row.name || '';
      el.code.value = row.code || '';
      el.color.value= row.color || '#1B5E20';
      el.name.focus();
    });
    const del = document.createElement('button');
    del.type='button'; del.className='btn-outline'; del.textContent='Delete';
    del.style.marginLeft='8px';
    del.addEventListener('click', async ()=>{
      if (!confirm(`Delete "${row.name||row.id}"?`)) return;
      try{
        await deleteDoc(doc(window.DF_FB.db, 'cropTypes', row.id));
        toast('Deleted');
        await refresh();
      }catch(e){ console.error(e); toast('Delete failed'); }
    });
    tdAct.append(edit, del);

    tr.append(tdName, tdCode, tdColor, tdUpdated, tdAct);
    el.tbody.appendChild(tr);
  });
  el.count.textContent = String(rows.length);
}

async function refresh(){
  // Require auth to write; allow non-auth to at least see banner
  const user = window.DF_FB?.auth?.currentUser || null;
  el.authWarn.style.display = user ? 'none' : 'block';

  try{
    const qy = query(collection(window.DF_FB.db, 'cropTypes'), orderBy('name'));
    const snaps = await getDocs(qy);
    const rows = [];
    snaps.forEach(s=>{
      const d = s.data()||{};
      rows.push({ id:s.id, ...d });
    });
    renderRows(rows);
  }catch(e){
    console.error(e);
    renderRows([]);
  }
}

async function saveOne(e){
  e?.preventDefault?.();
  const user = window.DF_FB?.auth?.currentUser || null;
  if (!user) { toast('Sign in required'); return; }

  const name = String(el.name.value||'').trim();
  const code = slugifyCode(el.code.value||name);
  const color= asHex(el.color.value);

  if (!name || !code){ toast('Name and code required'); return; }

  const id = String(el.id.value||code);
  const ref = doc(window.DF_FB.db, 'cropTypes', id);

  try{
    const prev = await getDoc(ref);
    await setDoc(ref, {
      name, code, color,
      updatedAt: serverTimestamp(),
      createdAt: prev.exists()? (prev.data()?.createdAt || serverTimestamp()) : serverTimestamp()
    }, { merge:true });
    toast('Saved');
    el.form.reset();
    el.id.value='';
    await refresh();
  }catch(e){
    console.error(e);
    toast('Save failed');
  }
}

function wire(){
  el.form?.addEventListener('submit', saveOne);
  el.reset?.addEventListener('click', ()=>{ el.form.reset(); el.id.value=''; el.name.focus(); });

  // Basic auth listener (non-aggressive)
  window.DF_FB_API?.onAuth?.(function(u){
    el.authWarn.style.display = u ? 'none' : 'block';
  });
}

(async function start(){
  try{
    // Ensure firebase-init ran
    if (!window.DF_FB || !window.DF_FB.db) {
      console.error('Firebase not initialized');
      return;
    }
    wire();
    await refresh();
  }catch(e){
    console.error(e);
  }
})();
