// fb-roles.js — roles dropdown that works even if /roles docs are empty,
// and will auto-seed default roles if the collection is empty.

import {
  getDocs, collection, query, orderBy, doc, setDoc
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const DEFAULT_ROLES = ["Administrator","Owner","Manager","Employee","ViewOnly"];

const $ = s => document.querySelector(s);
const el = {
  roleSelect: $('#roleName'),
  hint:       $('#roleHint'),
  status:     $('#roleStatus'),
  save:       $('#saveBtn'),
  discard:    $('#discardBtn'),
};

function setStatus(msg, color) {
  if (!el.status) return;
  el.status.style.display = msg ? 'block' : 'none';
  el.status.textContent = msg || '';
  if (color) el.status.style.color = color;
}

const FB = {
  async ready() {
    // Wait for firebase-init to expose DF_FB / DF_FB_API (mobile-friendly)
    let tries = 0;
    while ((!window.DF_FB || !window.DF_FB_API) && tries < 150) {
      await new Promise(r => setTimeout(r, 80));
      tries++;
    }
    if (!window.DF_FB || !window.DF_FB_API) throw new Error('Firebase not initialized');

    // Persist session across app restarts
    try { await window.DF_FB_API.setPersistence?.(true); } catch {}

    await window.DF_FB_API.init?.();
    if (!window.DF_FB.auth.currentUser) {
      setStatus('Not signed in', '#b00020');
      if (el.roleSelect) el.roleSelect.disabled = true;
      el.save?.setAttribute('disabled', 'true');
      el.discard?.setAttribute('disabled', 'true');
      return null;
    }
    if (el.roleSelect) el.roleSelect.disabled = false;
    return window.DF_FB.db;
  }
};

// Load roles; return [] if none. Works even when docs have no fields.
async function fetchRoles(db) {
  // Try orderBy('label'); if it throws (missing index/field), fall back to unsorted.
  try {
    const snaps = await getDocs(query(collection(db, 'roles'), orderBy('label')));
    const out = [];
    snaps.forEach(d => out.push({ id: d.id, ...(d.data() || {}) }));
    return out;
  } catch (_) {
    const snaps = await getDocs(collection(db, 'roles'));
    const out = [];
    snaps.forEach(d => out.push({ id: d.id, ...(d.data() || {}) }));
    return out;
  }
}

// If /roles has zero docs, seed the defaults with a label + empty permissions
async function seedIfEmpty(db) {
  const current = await fetchRoles(db);
  if (current.length) return current;
  // Create five docs
  await Promise.all(DEFAULT_ROLES.map(name =>
    setDoc(doc(window.DF_FB.db, 'roles', name), {
      label: name,
      permissions: {} // we’ll fill this later in the UI
    }, { merge: true })
  ));
  return await fetchRoles(db);
}

function renderOptions(roles) {
  if (!el.roleSelect) return;
  el.roleSelect.innerHTML = roles.map(r => {
    const label = (r.label ?? r.id ?? '').toString();
    const value = (r.id ?? r.label ?? '').toString();
    return `<option value="${value}">${label}</option>`;
  }).join('');
  // restore last selected if present
  const last = localStorage.getItem('df_role_selected');
  if (last && roles.some(r => (r.id || r.label) === last)) {
    el.roleSelect.value = last;
  }
  el.roleSelect.addEventListener('change', () =>
    localStorage.setItem('df_role_selected', el.roleSelect.value)
  );
}

(async function start(){
  try {
    if (el.hint) el.hint.textContent = 'Loading…';
    const db = await FB.ready();
    if (!db) return; // not signed in

    // Seed if needed, then render
    const roles = await seedIfEmpty(db);

    if (!roles.length) {
      setStatus('No roles found in /roles (and seeding failed).', '#b00020');
      if (el.hint) el.hint.textContent = '';
      return;
    }

    renderOptions(roles);
    setStatus(`${roles.length} role${roles.length===1?'':'s'} loaded`, '#2e7d32');
    if (el.hint) el.hint.textContent = '';
  } catch (err) {
    console.error(err);
    if (el.hint) el.hint.textContent = '';
    setStatus('Failed to load roles. Check auth, rules, or project config.', '#b00020');
  }
})();