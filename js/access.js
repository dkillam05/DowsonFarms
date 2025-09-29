// Role-aware access loader
// - Reads current user's role KEYS from users/{uid}.roles (e.g., ["admin","manager"])
// - Loads those role docs from Firestore (collection: roles, field: key)
// - Merges permissionsByPath across roles (OR logic)
// - Exposes DF_ACCESS: { roles, roleKeys, permsByPath, canView(href), can(href, action), filterMenusForHome(tiles), filterChildren(children) }

import { auth, db } from "./firebase-init.js";
import {
  collection, query, where, getDocs
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const BUILDER_UID = "wcTEMrHbY1QIknuKMKrTXV5wpu73"; // Dane: always full access

function normRoles(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String).map(s => s.toLowerCase());
  return [String(v).toLowerCase()];
}

async function getUserRoleKeys() {
  const u = auth.currentUser;
  if (!u) return [];
  if (u.uid === BUILDER_UID) return ["__builder__"];
  try {
    // lazy import to avoid extra cost if unused
    const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js");
    const snap = await getDoc(doc(db, "users", u.uid));
    const data = snap.exists() ? snap.data() : {};
    const keys = normRoles(data.roles && data.roles.length ? data.roles : ["employee"]);
    return keys;
  } catch {
    return ["employee"];
  }
}

function orMergePerms(target, from) {
  for (const [href, p] of Object.entries(from || {})) {
    if (!target[href]) target[href] = { view:false, create:false, edit:false, delete:false };
    const t = target[href];
    t.view   = !!(t.view   || p.view);
    t.create = !!(t.create || p.create);
    t.edit   = !!(t.edit   || p.edit);
    t.delete = !!(t.delete || p.delete);
  }
}

async function loadRoleDocsByKeys(keys) {
  // Firestore "in" supports up to 10 values; batch if needed
  const out = [];
  const rolesCol = collection(db, "roles");
  const chunks = [];
  for (let i=0;i<keys.length;i+=10) chunks.push(keys.slice(i, i+10));
  for (const chunk of chunks) {
    const qs = query(rolesCol, where("key","in", chunk));
    const snap = await getDocs(qs);
    snap.forEach(d => out.push({ id: d.id, ...d.data() }));
  }
  return out;
}

export async function loadAccess() {
  const roleKeys = await getUserRoleKeys();

  // Builder: grant wildcards
  if (roleKeys.includes("__builder__")) {
    window.DF_ACCESS = {
      roles: [], roleKeys, permsByPath: {"*": {view:true, create:true, edit:true, delete:true}},
      canView: () => true,
      can: () => true,
      filterMenusForHome: (tiles) => tiles.slice(), // show all
      filterChildren: (children) => children.slice()
    };
    return window.DF_ACCESS;
  }

  const roleDocs = roleKeys.length ? await loadRoleDocsByKeys(roleKeys) : [];
  const permsByPath = {};
  for (const r of roleDocs) orMergePerms(permsByPath, r.permissionsByPath || {});

  function can(href, action="view") {
    if (!href) return false;
    // Exact path check first
    const p = permsByPath[href];
    if (p && p[action]) return true;
    // Optional: treat parent folder rules (e.g., "equipment/") as default for children
    // Look for the longest prefix rule that ends with "/" and matches the href
    let best = null;
    for (const key in permsByPath) {
      if (!key.endsWith("/")) continue;
      if (href.startsWith(key)) {
        if (!best || key.length > best.length) best = key;
      }
    }
    if (best && permsByPath[best]?.[action]) return true;
    return false;
  }

  function canView(href) { return can(href, "view"); }

  function filterChildren(children = []) {
    return children.filter(ch => canView(ch.href));
  }

  // For HOME tiles (top-level): show a section tile if:
  // - role can view the section itself, OR
  // - role can view at least one child/grandchild (so they can still get in).
  function filterMenusForHome(tiles = []) {
    const out = [];
    for (const top of tiles) {
      const topVisible = canView(top.href);
      let hasVisibleDescendant = false;
      if (Array.isArray(top.children)) {
        for (const c of top.children) {
          if (canView(c.href)) { hasVisibleDescendant = true; break; }
          if (Array.isArray(c.children)) {
            if (c.children.some(g => canView(g.href))) { hasVisibleDescendant = true; break; }
          }
        }
      }
      if (topVisible || hasVisibleDescendant) {
        // Also prune children for the subnav experience
        const copy = { ...top };
        if (Array.isArray(top.children)) {
          copy.children = top.children
            .filter(ch => canView(ch.href) || (Array.isArray(ch.children) && ch.children.some(g => canView(g.href))))
            .map(ch => {
              if (!ch.children) return ch;
              const grand = ch.children.filter(g => canView(g.href));
              return { ...ch, children: grand };
            });
        }
        out.push(copy);
      }
    }
    return out;
  }

  window.DF_ACCESS = { roles: roleDocs, roleKeys, permsByPath, canView, can, filterMenusForHome, filterChildren };
  return window.DF_ACCESS;
}
