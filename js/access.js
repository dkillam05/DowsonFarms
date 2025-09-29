// Role engine used by ui-nav.js and the debug bar
import { auth, db } from "./firebase-init.js";
import { collection, query, where, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const BUILDER_UID = "wcTEMrHbY1QIknuKMKrTXV5wpu73"; // Dane

function normRoles(v){ if(!v) return []; if(Array.isArray(v)) return v.map(s=>String(s).toLowerCase()); return [String(v).toLowerCase()]; }

async function getUserRoleKeys(){
  const u = auth.currentUser;
  if(!u) return [];
  if(u.uid === BUILDER_UID) return ["__builder__"];
  try {
    const snap = await getDoc(doc(db,"users",u.uid));
    const data = snap.exists() ? snap.data() : {};
    return normRoles(data.roles && data.roles.length ? data.roles : ["employee"]);
  } catch { return ["employee"]; }
}

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

async function loadRoleDocsByKeys(keys){
  const out=[]; const rolesCol = collection(db,"roles");
  for(let i=0;i<keys.length;i+=10){
    const qs = query(rolesCol, where("key","in", keys.slice(i,i+10)));
    const snap = await getDocs(qs); snap.forEach(d=>out.push({id:d.id,...d.data()}));
  }
  return out;
}

export async function loadAccess(){
  const roleKeys = await getUserRoleKeys();

  // Builder: full access
  if(roleKeys.includes("__builder__")){
    window.DF_ACCESS = {
      roles:[], roleKeys, permsByPath: {"*":{view:true,create:true,edit:true,delete:true,archive:true}},
      canView: ()=>true, can: ()=>true,
      filterMenusForHome: (tiles)=>tiles.slice(),
      filterChildren: (children)=>children.slice()
    };
    return window.DF_ACCESS;
  }

  const roleDocs = roleKeys.length ? await loadRoleDocsByKeys(roleKeys) : [];
  const permsByPath = {}; roleDocs.forEach(r=>orMergePerms(permsByPath, r.permissionsByPath || {}));

  function can(href, action="view"){
    const p = permsByPath[href]; if(p && p[action]) return true;
    // Optional prefix rules like "equipment/"
    let best=null; 
    for(const key in permsByPath){
      if(key.endsWith("/") && href.startsWith(key) && (!best || key.length>best.length)) best=key;
    }
    return best ? !!permsByPath[best][action] : false;
  }
  function canView(href){ return can(href,"view"); }

  function filterChildren(children=[]){ return children.filter(ch=>canView(ch.href)); }

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

  window.DF_ACCESS = { roles: roleDocs, roleKeys, permsByPath, canView, can, filterMenusForHome, filterChildren };
  return window.DF_ACCESS;
}