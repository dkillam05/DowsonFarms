// /js/access.js — role engine used by ui-nav.js and other pages
import { auth, db } from "./firebase-init.js";
import {
  collection, query, where, getDocs, doc, getDoc
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const BUILDER_UID = "wcTEMrHbY1QIknuKMKrTXV5wpu73"; // Dane

function normRoles(v){
  if(!v) return [];
  if(Array.isArray(v)) return v.map(s=>String(s).trim().toLowerCase()).filter(Boolean);
  return [String(v).trim().toLowerCase()];
}

async function getUserDocAndRoleKeys(){
  const u = auth.currentUser;
  if(!u) return { userDoc:null, roleKeys:[] };

  if(u.uid === BUILDER_UID){
    return { userDoc:{ id:u.uid, roles:["__builder__"], overridesByPath:{} }, roleKeys:["__builder__"] };
  }

  try{
    const s = await getDoc(doc(db,"users",u.uid));
    const data = s.exists() ? s.data() : {};
    const roleKeys = normRoles(data.roles && data.roles.length ? data.roles : ["employee"]);
    return { userDoc: { id:u.uid, ...data }, roleKeys };
  }catch(_){
    return { userDoc:null, roleKeys:["employee"] };
  }
}

function orMergePerms(target, from){
  for(const [href,p] of Object.entries(from || {})){
    if(!target[href]) target[href] = {view:false,create:false,edit:false,delete:false,archive:false};
    const t = target[href];
    t.view    = !!(t.view    || p.view);
    t.create  = !!(t.create  || p.create);
    t.edit    = !!(t.edit    || p.edit);
    t.delete  = !!(t.delete  || p.delete);
    t.archive = !!(t.archive || p.archive);
  }
}

async function loadRoleDocsByIds(keys){
  const out=[];
  for(const k of keys){
    if(k === "__builder__") continue; // synthetic
    try{
      const s = await getDoc(doc(db,"roles", k)); // <-- by doc ID
      if(s.exists()) out.push({ id:s.id, ...s.data() });
      else {
        // backward-compat: try "key" field query batch of one
        const q = query(collection(db,"roles"), where("key","==", k));
        const snap = await getDocs(q);
        snap.forEach(d=> out.push({ id:d.id, ...d.data() }));
      }
    }catch(_){}
  }
  return out;
}

export async function loadAccess(){
  const { userDoc, roleKeys } = await getUserDocAndRoleKeys();

  // Builder = full access
  if(roleKeys.includes("__builder__")){
    const access = {
      roles:[], roleKeys,
      permsByPath: {"*":{view:true,create:true,edit:true,delete:true,archive:true}},
      canView: ()=>true, can: ()=>true,
      filterMenusForHome: (tiles)=>tiles.slice(),
      filterChildren: (children)=>children.slice()
    };
    window.DF_ACCESS = access;
    return access;
  }

  // Load role docs and merge perms
  const roleDocs = roleKeys.length ? await loadRoleDocsByIds(roleKeys) : [];
  const permsByPath = {};
  roleDocs.forEach(r => orMergePerms(permsByPath, r.permissionsByPath || {}));

  // Merge employee-specific overrides (only "true" grants)
  if(userDoc && userDoc.overridesByPath){
    orMergePerms(permsByPath, userDoc.overridesByPath);
  }

  // Permission checkers
  function can(href, action="view"){
    // exact
    const p = permsByPath[href];
    if(p && p[action]) return true;

    // prefix rules e.g. "equipment/"
    let best=null;
    for(const key in permsByPath){
      if(key.endsWith("/") && href.startsWith(key) && (!best || key.length>best.length))
        best=key;
    }
    if(best && permsByPath[best][action]) return true;

    // wildcard
    if(permsByPath["*"] && permsByPath["*"][action]) return true;

    return false;
  }
  const canView = (href)=>can(href,"view");

  // Filters
  function filterChildren(children=[]){ return children.filter(ch => canView(ch.href)); }

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
            .filter(ch => canView(ch.href) ||
                           (Array.isArray(ch.children) && ch.children.some(g=>canView(g.href))))
            .map(ch => ch.children ? ({...ch, children: ch.children.filter(g=>canView(g.href))}) : ch);
        }
        out.push(copy);
      }
    }
    return out;
  }

  const access = { roles: roleDocs, roleKeys, permsByPath, canView, can, filterMenusForHome, filterChildren };
  window.DF_ACCESS = access;
  return access;
}