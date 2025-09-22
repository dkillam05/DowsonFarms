<!-- /js/fb-roles.js -->
<script type="module">
/* Requires /js/firebase-init.js to have run first (window.DF_FB ready) */
import {
  collection, query, orderBy, onSnapshot, getDocs, doc, setDoc,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const db = window.DF_FB?.db;

const coll = () => collection(db, 'roles');

/** Real-time watcher: keeps a select in sync with Firestore roles */
export function watchRoles(selectEl, { includeBlank = true } = {}) {
  if (!db || !selectEl) return () => {};
  const q = query(coll(), orderBy('order'), orderBy('label'));
  const unsub = onSnapshot(q, snap => {
    const roles = [];
    snap.forEach(d => { const r = d.data() || {}; roles.push({ id: d.id, ...r }); });
    const opts = [
      includeBlank ? `<option value="" disabled selected>Select role…</option>` : ''
    ].concat(
      roles.map(r => `<option value="${r.label}">${r.label}</option>`)
    ).join('');
    selectEl.innerHTML = opts;
  });
  return unsub;
}

/** One-shot list (e.g., for building summaries) */
export async function listRoles() {
  const roles = [];
  const q = query(coll(), orderBy('order'), orderBy('label'));
  const snap = await getDocs(q);
  snap.forEach(d => { const r = d.data() || {}; roles.push({ id: d.id, ...r }); });
  return roles;
}

/** Seed default roles if collection is empty (id = label for readability) */
export async function seedDefaultRolesIfEmpty(defaults = [
  { id: 'Administrator', label: 'Administrator', order: 1 },
  { id: 'Owner',         label: 'Owner',         order: 2 },
  { id: 'Manager',       label: 'Manager',       order: 3 },
  { id: 'Employee',      label: 'Employee',      order: 4 },
  { id: 'View Only',     label: 'View Only',     order: 5 },
]) {
  const existing = await listRoles();
  if (existing.length) return;
  for (const r of defaults) {
    await setDoc(doc(db, 'roles', r.id), {
      label: r.label,
      order: typeof r.order === 'number' ? r.order : 999,
      // permissions: {}  // created later on Roles page
    }, { merge: true });
  }
}
</script>
