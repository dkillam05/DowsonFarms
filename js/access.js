/* /js/access.js
   Role/permission engine used by ui-nav.js and other UI.
   - Baseline perms come from roles/* documents.
   - Per-user overrides (users/{uid}.overridesByPath) can GRANT extra rights (true).
   - Builder UID always has full access.
*/

import { auth, db } from "./firebase-init.js";
import {
  collection, query, where, getDocs, doc, getDoc
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// --- Config ---
const BUILDER_UID = "wcTEMrHbY1QIknuKMKrTXV5wpu73"; // Dane

// --- Helpers ---
function normRoles(v){
  if (!v) return [];
  if (Array.isArray(v)) return v.map(s => String(s).toLowerCase());
  return [String(v).toLowerCase()];
}

// Merge "from" into "target" (OR semantics on flags)
function orMergePerms(target, from){
  for (const [href, p] of Object.entries(from || {})){
    if (!target[href]) target[href] = { view:false, create:false, edit:false, delete:false, archive:false };
    const t = target[href];
    t.view    = !!(t.view    || p.view);
    t.create  = !!(t.create  || p.create);
    t.edit    = !!(t.edit    || p.edit);
    t.delete  = !!(t.delete  || p.delete);
    t.archive = !!(t.archive || p.archive);
  }
}

// Load role docs by their keys (batched "in" queries, 10 at a time)
async function loadRoleDocsByKeys(keys){
  const out = [];
  if (!keys || !keys.length) return out;
  const rolesCol = collection(db, "roles");
  for (let i = 0; i < keys.length; i += 10){
    const slice = keys.slice(i, i + 10);
    const qs = query(rolesCol, where("key", "in", slice));
    const snap = await getDocs(qs);
    snap.forEach(d => out.push({ id: d.id, ...d.data() }));
  }
  return out;
}

// Get role keys + per-user overrides for the current user
async function getUserRoleKeysAndOverrides(){
  const u = auth.currentUser;
  if (!u) return { keys: [], overrides: {} };

  // Builder → special-case
  if (u.uid === BUILDER_UID) return { keys: ["__builder__"], overrides: {} };

  try {
    const s = await getDoc(doc(db, "users", u.uid));
    const data = s.exists() ? s.data() : {};
    const keys = normRoles((data.roles && data.roles.length) ? data.roles : ["employee"]);
    const overrides = data.overridesByPath || {};
    return { keys, overrides };
  } catch {
    return { keys: ["employee"], overrides: {} };
  }
}

// --- Public: build and expose DF_ACCESS ---
export async function loadAccess(){
  const { keys: roleKeys, overrides: userOverrides } = await getUserRoleKeysAndOverrides();

  // Builder: full access
  if (roleKeys.includes("__builder__")){
    window.DF_ACCESS = {
      roles: [],
      roleKeys,
      permsByPath: { "*": { view:true, create:true, edit:true, delete:true, archive:true } },
      canView: () => true,
      can:     () => true,
      filterMenusForHome: (tiles=[]) => tiles.slice(),
      filterChildren:     (children=[]) => children.slice()
    };
    return window.DF_ACCESS;
  }

  // Merge all role permissions
  const roleDocs = await loadRoleDocsByKeys(roleKeys);
  const permsByPath = {};
  roleDocs.forEach(r => orMergePerms(permsByPath, r.permissionsByPath || {}));

  // Apply per-user overrides: only TRUE grants are applied (no deny yet)
  for (const [href, ov] of Object.entries(userOverrides || {})){
    if (!permsByPath[href]) permsByPath[href] = { view:false, create:false, edit:false, delete:false, archive:false };
    const t = permsByPath[href];
    if (ov.view    === true) t.view    = true;
    if (ov.create  === true) t.create  = true;
    if (ov.edit    === true) t.edit    = true;
    if (ov.delete  === true) t.delete  = true;
    if (ov.archive === true) t.archive = true;
  }

  // Permission checkers
  function can(href, action = "view"){
    if (!href) return false;
    const p = permsByPath[href];
    if (p && p[action]) return true;

    // Prefix (folder) rule support, e.g., "equipment/"
    let best = null;
    for (const key in permsByPath){
      if (key.endsWith("/") && href.startsWith(key) && (!best || key.length > best.length)){
        best = key;
      }
    }
    return best ? !!permsByPath[best][action] : false;
  }
  const canView = (href) => can(href, "view");

  // Filters for UI
  function filterChildren(children = []){
    return children.filter(ch => canView(ch.href));
  }

  function filterMenusForHome(tiles = []){
    const out = [];
    for (const top of tiles){
      const topVisible = canView(top.href);
      let hasVisibleChild = false;

      if (Array.isArray(top.children)){
        // Check direct children
        for (const c of top.children){
          if (canView(c.href)) { hasVisibleChild = true; break; }
          // Check grandchildren
          if (Array.isArray(c.children) && c.children.some(g => canView(g.href))){ hasVisibleChild = true; break; }
        }
      }

      if (topVisible || hasVisibleChild){
        const copy = { ...top };
        if (Array.isArray(top.children)){
          copy.children = top.children
            .filter(ch => canView(ch.href) || (Array.isArray(ch.children) && ch.children.some(g => canView(g.href))))
            .map(ch => ch.children ? ({ ...ch, children: ch.children.filter(g => canView(g.href)) }) : ch);
        }
        out.push(copy);
      }
    }
    return out;
  }

  window.DF_ACCESS = {
    roles: roleDocs,
    roleKeys,
    permsByPath,
    canView,
    can,
    filterMenusForHome,
    filterChildren
  };
  return window.DF_ACCESS;
}