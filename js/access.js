// access.js — single source of truth for permissions
// NO SEEDING REQUIRED: Builder bypass is entirely in code.

import { auth, db } from "./firebase-init.js";
import {
  collection, query, where, getDocs, doc, getDoc
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// ===== YOUR BUILDER UID (Dane) =====
const BUILDER_UID = "wcTEMrHbY1QIknuKMKrTXV5wpu73";

// helpers
const normRoles = v => !v ? [] : (Array.isArray(v) ? v : [v]).map(s => String(s).toLowerCase());
function orMergePerms(target, from){
  for(const [href,p] of Object.entries(from || {})){
    if(!target[href]) target[href] = {view:false,create:false,edit:false,delete:false,archive:false};
    const t = target[href];
    t.view   = !!(t.view   || p.view);
    t.create = !!(t.create || p.create);
    t.edit   = !!(t.edit   || p.edit);
    t.delete = !!(t.delete || p.delete);
    t.archive= !!(t.archive|| p.archive);
  }
}

async function getUserRoleKeys(){
  const u = auth.currentUser;
  if(!u) return [];
  if(u.uid === BUILDER_UID) return ["__builder__"]; // <- pure code bypass
  try {
    const snap = await getDoc(doc(db,"users",u.uid));
    const data = snap.exists() ? snap.data() : {};
    const roles = data.roles && data.roles.length ? data.roles : ["employee"];
    return normRoles(roles);
  } catch { return ["employee"]; }
}

async function loadRoleDocsByKeys(keys){
  const out=[]; const rolesCol = collection(db,"roles");
  // chunked "in" queries
  for(let i=0;i<keys.length;i+=10){
    const qs = query(rolesCol, where("key","in", keys.slice(i,i+10)));
    const snap = await getDocs(qs);
    snap.forEach(d=>out.push({id:d.id,...d.data()}));
  }
  return out;
}

export async function loadAccess(){
  const roleKeys = await getUserRoleKeys();

  // ===== BUILDER: unlimited in code =====
  if(roleKeys.includes("__builder__")){
    const permsByPath = {"*":{view:true,create:true,edit:true,delete:true,archive:true}};
    function can(){ return true; }
    function canView(){ return true; }
    function filterChildren(children=[]){ return children.slice(); }
    function filterMenusForHome(tiles=[]){ return tiles.slice(); }
    window.DF_ACCESS = { roles:[], roleKeys, permsByPath, can, canView, filterChildren, filterMenusForHome, BUILDER_UID };
    return window.DF_ACCESS;
  }

  // ===== Normal users: merge role docs =====
  const roleDocs = roleKeys.length ? await loadRoleDocsByKeys(roleKeys) : [];
  const permsByPath = {};
  roleDocs.forEach(r=>orMergePerms(permsByPath, r.permissionsByPath || {}));

  function can(href, action="view"){
    const p = permsByPath[href];
    if(p && p[action]) return true;
    // prefix rules like "equipment/"
    let best=null;
    for(const key in permsByPath){
      if(key.endsWith("/") && href.startsWith(key) && (!best || key.length>best.length)) best=key;
    }
    return best ? !!permsByPath[best][action] : false;
  }
  const canView = href => can(href,"view");

  const filterChildren = (children=[]) => children.filter(ch=>canView(ch.href));

  function filterMenusForHome(tiles=[]){
    const out=[];
    for(const top of tiles){
      const topVisible = canView(top.href);
      let hasVisibleChild=false;
      if(Array.isArray(top.children)){
        for(const c of top.children){
          if(canView(c.href)) { hasVisibleChild=true; break; }
          if(Array.isArray(c.children) && c.children.some(g=>canView(g.href))) { hasVisibleChild=true; break; }
        }
      }
      if(topVisible || hasVisibleChild){
        const copy={...top};
        if(Array.isArray(top.children)){
          copy.children = top.children
            .filter(ch=>canView(ch.href) || (Array.isArray(ch.children) && ch.children.some(g=>canView(g.href))))
            .map(ch=> ch.children ? ({...ch, children: ch.children.filter(g=>canView(g.href))}) : ch);
        }
        out.push(copy);
      }
    }
    return out;
  }

  window.DF_ACCESS = { roles: roleDocs, roleKeys, permsByPath, canView, can, filterMenusForHome, filterChildren, BUILDER_UID };
  return window.DF_ACCESS;
}