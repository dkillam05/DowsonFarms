/* ===========================
   Dowson Farms — fb-roles.js
   Roles page logic only (no auth checks here)
   - Reads roles from Firestore
   - Populates Role dropdown
   - Saves permission toggles
   =========================== */

(function () {
  window.DF = window.DF || {};
  const fb = () => window.firebase || null;

  // Collection name
  const ROLES_COL = 'roles';

  // UI hooks
  function $id(id) { return document.getElementById(id); }

  // Map Firestore doc -> { id, ...data }
  async function fetchRoles() {
    const fbase = fb();
    const db = fbase?.firestore?.();
    if (!db) throw new Error('no-db');

    const snap = await db.collection(ROLES_COL).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  function fillRoleDropdown(roles) {
    const sel = $id('df-role-select');
    if (!sel) return;
    sel.innerHTML = ''; // reset
    roles.forEach(r => {
      const opt = document.createElement('option');
      opt.value = r.id;
      opt.textContent = r.name || r.id;
      sel.appendChild(opt);
    });
  }

  async function loadPermissionsFor(roleId) {
    const fbase = fb();
    const db = fbase?.firestore?.();
    const doc = await db.collection(ROLES_COL).doc(roleId).get();
    const data = doc.data() || {};

    // Example: data.permissions is an object { "menu:calc": true, ... }
    const container = document.querySelector('[data-df-permissions]');
    if (!container) return;

    // Render simple checkboxes from the object keys (existing keys only)
    container.innerHTML = '';
    const perms = data.permissions || {};
    Object.keys(perms).sort().forEach(key => {
      const row = document.createElement('label');
      row.className = 'perm-row';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = !!perms[key];
      cb.dataset.key = key;
      const span = document.createElement('span');
      span.textContent = key.replace(/:/g, ' › ');
      row.appendChild(cb);
      row.appendChild(span);
      container.appendChild(row);
    });
  }

  async function savePermissions(roleId) {
    const fbase = fb();
    const db = fbase?.firestore?.();
    const container = document.querySelector('[data-df-permissions]');
    if (!container) return;

    const nextPerms = {};
    container.querySelectorAll('input[type="checkbox"][data-key]').forEach(cb => {
      nextPerms[cb.dataset.key] = cb.checked;
    });

    await db.collection(ROLES_COL).doc(roleId).set({ permissions: nextPerms }, { merge: true });
  }

  // Public API
  DF.Roles = {
    async init() {
      // Load roles and fill dropdown
      const roles = await fetchRoles(); // throws if no DB
      if (!roles || roles.length === 0) {
        // If we cannot read roles or collection empty in a production state,
        // let the global guard handle the session (logout). No inline error.
        throw new Error('no-roles');
      }
      fillRoleDropdown(roles);

      const sel = $id('df-role-select');
      if (sel && sel.value) { await loadPermissionsFor(sel.value); }

      // Bind change + buttons
      sel?.addEventListener('change', async () => {
        if (sel.value) await loadPermissionsFor(sel.value);
      });

      const saveBtn = document.querySelector('[data-action="save-perms"]');
      saveBtn?.addEventListener('click', async (e) => {
        e.preventDefault();
        if (!sel?.value) return;
        await savePermissions(sel.value);
      });

      const discardBtn = document.querySelector('[data-action="discard-perms"]');
      discardBtn?.addEventListener('click', async (e) => {
        e.preventDefault();
        if (sel?.value) await loadPermissionsFor(sel.value);
      });
    }
  };
})();