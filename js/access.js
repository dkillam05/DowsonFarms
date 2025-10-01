// js/access.js — single source of truth for permissions
// Builder gets full access in code. Normal users = roles ⊕ per-employee overrides.

import { auth, db } from "./firebase-init.js";
import {
  collection, query, where, getDocs, doc, getDoc
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// ===== YOUR BUILDER UID (Dane) =====
const BUILDER_UID = "wcTEMrHbY1QIknuKMKrTXV5wpu73";

const EMPTY_PERMS = { view:false, create:false, edit:false, delete:false, archive:false };
const TRUE_PERMS  = { view:true,  create:true,  edit:true,  delete:true,  archive:true  };

const normRoles = v => !v ? [] : (Array.isArray(v) ? v : [v]).map(s => String(s).toLowerCase());

function orMergePerms(target, from){
  for (const [href, p] of Object.entries(from || {})) {
    if (!target[href]) target[href] = { ...EMPTY_PERMS };
    const t = target[href];
    if (p.view)    t.view    = true;
    if (p.create)  t.create  = true;
    if (p.edit)    t.edit    = true;
    if (p.delete)  t.delete  = true;
    if (p.archive) t.archive = true;
  }
}

async function readUserDoc(uid){
  try {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? snap.data() : {};
  } catch {
    return {};
  }
}

async function getUserRoleKeys(){
  const u = auth.currentUser;
  if (!u) return [];
  if (u.uid === BUILDER_UID) return ["__builder__"]; // <- pure code bypass
  const data = await readUserDoc(u.uid);
  const roles = data.roles && data.roles.length ? data.roles : ["employee"];
  return normRoles(roles);
}

async function loadRoleDocsByKeys(keys){
  const out=[]; const rolesCol = collection(db,"roles");
  for (let i=0;i<keys.length;i+=10){
    const qs = query(rolesCol, where("key","in", keys.slice(i,i+10)));
    const snap = await getDocs(qs);
    snap.forEach(d=>out.push({id:d.id,...d.data()}));
  }
  return out;
}

export async function loadAccess(){
  const u = auth.currentUser;
  const roleKeys = await getUserRoleKeys();

  // ===== BUILDER: unlimited in code =====
  if (roleKeys.includes("__builder__")) {
    const permsByPath = { "*": { ...TRUE_PERMS } };
    const allow = () => true;
    const passthru = (arr=[]) => arr.slice();
    window.DF_ACCESS = {
      roles: [], roleKeys, permsByPath,
      can: allow, canView: allow,
      filterMenusForHome: passthru,
      filterChildren: passthru,
      BUILDER_UID
    };
    return window.DF_ACCESS;
  }

  // ===== Normal users: roles ⊕ per-employee overrides
  const roleDocs = roleKeys.length ? await loadRoleDocsByKeys(roleKeys) : [];
  const permsByPath = {};
  // merge role perms first
  roleDocs.forEach(r => orMergePerms(permsByPath, r.permissionsByPath || {}));
  // merge per-employee overrides
  if (u) {
    const userData = await readUserDoc(u.uid);
    if (userData && userData.overridesByPath) {
      orMergePerms(permsByPath, userData.overridesByPath);
    }
  }

  function can(href, action="view"){
    const p = permsByPath[href];
    if (p && p[action]) return true;
    // prefix rules like "equipment/"
    let best = null;
    for (const key in permsByPath) {
      if (key.endsWith("/") && href.startsWith(key) && (!best || key.length > best.length)) best = key;
    }
    return best ? !!permsByPath[best][action] : false;
  }
  const canView = href => can(href, "view");
  const filterChildren = (children=[]) => children.filter(ch => canView(ch.href));

  function filterMenusForHome(tiles=[]){
    const out=[];
    for (const top of tiles){
      const topVisible = canView(top.href);
      let hasVisibleChild=false;
      if (Array.isArray(top.children)){
        for (const c of top.children){
          if (canView(c.href)) { hasVisibleChild=true; break; }
          if (Array.isArray(c.children) && c.children.some(g=>canView(g.href))) { hasVisibleChild=true; break; }
        }
      }
      if (topVisible || hasVisibleChild){
        const copy={...top};
        if (Array.isArray(top.children)){
          copy.children = top.children
            .filter(ch => canView(ch.href) || (Array.isArray(ch.children) && ch.children.some(g=>canView(g.href))))
            .map(ch => ch.children ? ({...ch, children: ch.children.filter(g=>canView(g.href))}) : ch);
        }
        out.push(copy);
      }
    }
    return out;
  }

  window.DF_ACCESS = {
    roles: roleDocs, roleKeys, permsByPath,
    canView, can, filterMenusForHome, filterChildren, BUILDER_UID
  };
  return window.DF_ACCESS;
}