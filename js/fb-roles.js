// fb-roles.js — MINIMAL: just populate the roles dropdown from /roles

import {
  getDocs, collection, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const $ = s => document.querySelector(s);
const el = {
  roleSelect: $('#roleName'),
  hint:       $('#roleHint'),
  status:     $('#roleStatus'),
  save:       $('#saveBtn'),
  discard:    $('#discardBtn'),
  menusBox:   $('#menusContainer'),
  permCard:   $('#permCard'),
};

function setStatus(msg, color) {
  if (!el.status) return;
  el.status.style.display = msg ? 'block' : 'none';
  el.status.textContent = msg || '';
  if (color) el.status.style.color = color;
}

const FB = {
  async ready() {
    // Ensure firebase-init created DF_FB and DF_FB_API
    let tries = 0;
    while ((!window.DF_FB || !window.DF_FB_API) && tries < 150) {
      await new Promise(r => setTimeout(r, 80)); // wait ~12s max for slow phones
      tries++;
    }
    if (!window.DF_FB || !window.DF_FB_API) throw new Error('Firebase not initialized');

    // Make session persistent across app restarts
    try { await window.DF_FB_API.setPersistence?.(true); } catch {}

    // Require sign-in for reading /roles (your rules enforce this)
    await window.DF_FB_API.init?.();
    if (!window.DF_FB.auth.currentUser) {
      setStatus('Not signed in', '#b00020');
      // Disable UI until signed in
      el.roleSelect.disabled = true;
      el.save?.setAttribute('disabled', 'true');
      el.discard?.setAttribute('disabled', 'true');
      return null;
    }
    el.roleSelect.disabled = false;
    return window.DF_FB.db;
  }
};

async function listRoles(db) {
  // Try to order by label; fall back to unsorted
  try {
    const qy = query(collection(db, 'roles'), orderBy('label'));
    const snaps = await getDocs(qy);
    const out = [];
    snaps.forEach(d => out.push({ id: d.id, ...(d.data() || {}) }));
    return out;
  } catch {
    const snaps = await getDocs(collection(db, 'roles'));
    const out = [];
    snaps.forEach(d => out.push({ id: d.id, ...(d.data() || {}) }));
    return out;
  }
}

async function start() {
  try {
    el.hint.textContent = 'Loading…';
    const db = await FB.ready();
    if (!db) return; // not signed in

    const roles = await listRoles(db);

    if (!roles.length) {
      el.roleSelect.innerHTML = '';
      setStatus('No roles found in /roles. Add docs: Administrator, Owner, Manager, Employee, ViewOnly.', '#b00020');
      el.hint.textContent = '';
      return;
    }

    // Build options using label || id
    el.roleSelect.innerHTML = roles
      .map(r => {
        const label = (r.label || r.id || '').toString();
        const value = (r.label || r.id || '').toString();
        return `<option value="${value}">${label}</option>`;
      })
      .join('');

    // Remember last selected
    const last = localStorage.getItem('df_role_selected');
    if (last && roles.some(r => (r.label || r.id) === last)) {
      el.roleSelect.value = last;
    }
    el.roleSelect.addEventListener('change', () => {
      localStorage.setItem('df_role_selected', el.roleSelect.value);
    });

    setStatus(`${roles.length} role${roles.length===1?'':'s'} loaded`, '#2e7d32');
    el.hint.textContent = '';
  } catch (err) {
    console.error(err);
    el.hint.textContent = '';
    setStatus('Failed to load roles (check auth, project config, rules, or collection name).', '#b00020');
  }
}

start();