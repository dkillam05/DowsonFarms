// fb-roles.js — populate the <select id="roleName"> from Firestore /roles
// and show clear, on-page status when anything blocks it.

import {
  getDocs, collection
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const $ = s => document.querySelector(s);
const el = {
  roleSelect: $('#roleName'),
  hint:       $('#roleHint'),
  status:     $('#roleStatus'),
  save:       $('#saveBtn'),
  discard:    $('#discardBtn'),
};

function showStatus(msg, color) {
  if (!el.status) return;
  el.status.style.display = msg ? 'block' : 'none';
  el.status.textContent = msg || '';
  el.status.style.color = color || '';
}

function setBusy(on) {
  if (el.hint) el.hint.textContent = on ? 'Loading…' : '';
}

async function waitForFirebaseHandles(maxMs = 12000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    if (window.DF_FB && window.DF_FB_API && window.DF_FB.db && window.DF_FB.auth) {
      return { db: window.DF_FB.db, auth: window.DF_FB.auth };
    }
    await new Promise(r => setTimeout(r, 80));
  }
  throw new Error('Firebase handles not available (DF_FB / DF_FB_API).');
}

async function ensurePersistence() {
  try {
    // true => local (stay signed in across app restarts)
    if (window.DF_FB_API?.setPersistence) await window.DF_FB_API.setPersistence(true);
  } catch {}
}

function requireSignedInOrExplain(auth) {
  const user = auth.currentUser;
  if (!user) {
    showStatus('Not signed in — open the login page from the top-right and sign in first.', '#b00020');
    if (el.roleSelect) el.roleSelect.disabled = true;
    if (el.save)   el.save.disabled   = true;
    if (el.discard) el.discard.disabled = true;
    return false;
  }
  if (el.roleSelect) el.roleSelect.disabled = false;
  if (el.save)   el.save.disabled   = true;   // still disabled until perms UI exists
  if (el.discard) el.discard.disabled = true;
  return true;
}

async function loadRoles(db) {
  // Keep it simplest possible: no orderBy, just list doc IDs (robust even if docs are empty).
  const snaps = await getDocs(collection(db, 'roles'));
  const out = [];
  snaps.forEach(d => {
    const data = d.data() || {};
    const label = (data.label || d.id || '').toString();
    out.push({ id: d.id, label });
  });
  return out;
}

function populateSelect(roles) {
  if (!el.roleSelect) return;

  if (!roles.length) {
    el.roleSelect.innerHTML = '';
    showStatus('No roles found in /roles. Add docs named: Administrator, Owner, Manager, Employee, ViewOnly.', '#b00020');
    return;
  }

  el.roleSelect.innerHTML = roles
    .map(r => `<option value="${r.label}">${r.label}</option>`)
    .join('');

  const last = localStorage.getItem('df_role_selected');
  if (last && roles.some(r => r.label === last)) {
    el.roleSelect.value = last;
  }

  el.roleSelect.addEventListener('change', () => {
    localStorage.setItem('df_role_selected', el.roleSelect.value);
  });

  showStatus(`${roles.length} role${roles.length === 1 ? '' : 's'} loaded.`, '#2e7d32');
}

async function start() {
  try {
    setBusy(true);

    // 1) Wait for firebase-init to expose DF_FB, DF_FB_API
    const { db, auth } = await waitForFirebaseHandles();

    // 2) Make sessions sticky
    await ensurePersistence();

    // 3) Require sign-in (your rules need auth for /roles reads)
    if (!requireSignedInOrExplain(auth)) { setBusy(false); return; }

    // 4) Pull roles
    const roles = await loadRoles(db);

    // 5) Build select
    populateSelect(roles);

  } catch (err) {
    console.error('[fb-roles] failed:', err);
    // Give a specific, human message on screen
    let msg = 'Failed to load roles.';
    const s = String(err && (err.message || err.code || err)).toLowerCase();
    if (s.includes('permission') || s.includes('missing or insufficient permissions')) {
      msg = 'Permission denied reading /roles — check Firestore rules (must allow read when signed in).';
    } else if (s.includes('unavailable') || s.includes('network') || s.includes('offline')) {
      msg = 'Network error loading /roles — check connection.';
    } else if (s.includes('not available') || s.includes('df_fb')) {
      msg = 'Firebase not initialized on this page — ensure ../js/firebase-init.js loads before fb-roles.js.';
    }
    showStatus(msg, '#b00020');
  } finally {
    setBusy(false);
  }
}

start();