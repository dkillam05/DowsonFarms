// Dowson Farms — fb-roles.js
// Handles Account Roles page logic (Firestore + UI rendering)

import {
  doc, getDoc, setDoc, getDocs, collection, orderBy, query, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// Build MENUS from DF_MENUS (global nav source of truth)
function buildMenusFromDF(df) {
  const out = {};
  if (!df || !Array.isArray(df.tiles)) return out;
  df.tiles.forEach(tile => {
    const top = String(tile.label || "").trim();
    if (!top) return;
    const kids = Array.isArray(tile.children) ? tile.children : [];
    const subs = kids.map(k => String(k.label || "").trim()).filter(Boolean);
    if (subs.length) out[top] = subs;
  });
  return out;
}
const MENUS = buildMenusFromDF(window.DF_MENUS);

const DEFAULT_ROLES = ["Administrator","Owner","Manager","Employee","View Only"];
const $ = s => document.querySelector(s);
const el = {
  role: $('#roleName'),
  roleHint: $('#roleHint'),
  menus: $('#menusContainer'),
  save:  $('#saveBtn'),
  discard: $('#discardBtn'),
  toast: $('#dfToast'), toastTxt: $('#dfToastText'),
  qvBtn: $('#quickViewBtn'), qvB: $('#qvBackdrop'), qvList: $('#qvList'),
  qvRole: $('#qvRole'), qvClose: $('#qvClose')
};

const FB = {
  async ready() {
    if (window.DF_FB_API?.init) { await window.DF_FB_API.init(); }
    const user = window.DF_FB?.auth?.currentUser;
    if (!user) { location.replace("../auth/login.html"); throw new Error("No auth"); }
    return window.DF_FB.db;
  }
};

const deepClone = obj => JSON.parse(JSON.stringify(obj));
const shallowEqual = (a,b) => JSON.stringify(a) === JSON.stringify(b);

function toast(msg){
  el.toastTxt.textContent = msg || "Saved";
  el.toast.style.display = "block";
  clearTimeout(window.__t);
  window.__t = setTimeout(()=> el.toast.style.display="none", 1600);
}

function pill(label, pressed, onToggle){
  const b=document.createElement("button");
  b.type="button"; b.className="pill"; b.textContent=label;
  b.setAttribute("aria-pressed", pressed?"true":"false");
  b.addEventListener("click", ()=>{
    const on = b.getAttribute("aria-pressed")==="true";
    b.setAttribute("aria-pressed", on?"false":"true");
    onToggle(!on, b);
  });
  return b;
}

function ensureShape(perms){
  Object.keys(MENUS).forEach(menu=>{
    perms[menu] = perms[menu] || {};
    MENUS[menu].forEach(sm=>{
      perms[menu][sm] = perms[menu][sm] || {view:false, edit:false, add:false, archive:false, delete:false};
    });
  });
  return perms;
}

function menuSummary(perms, menu){
  const subs = Object.values(perms[menu]||{});
  if (!subs.length) return "No access";
  const allFalse = subs.every(p=>!p.view && !p.edit && !p.add && !p.archive && !p.delete);
  if (allFalse) return "No access";
  const allTrue  = subs.every(p=>p.view && p.edit && p.add && p.archive && p.delete);
  if (allTrue) return "All";
  return "Custom";
}
function summarizeChildren(perms, menu){
  const keys = Object.keys(perms[menu]||{});
  const on = keys.filter(k=>{
    const p = perms[menu][k]; return p.view||p.edit||p.add||p.archive||p.delete;
  }).length;
  if (!on) return "None";
  if (on===keys.length) return "All submenus";
  return `${on} of ${keys.length} submenus`;
}

async function seedRolesIfEmpty(db){
  const haveMenus = Object.keys(MENUS).length > 0;
  const snaps = await getDocs(collection(db,"roles"));
  if (!snaps.empty || !haveMenus) return;
  const base = {}; ensureShape(base);
  for (const name of DEFAULT_ROLES){
    await setDoc(doc(db,"roles",name), { label:name, permissions: base, createdAt: serverTimestamp() }, { merge:true });
  }
}
async function listRoles(db){
  let out=[];
  try{
    const qy = query(collection(db,"roles"), orderBy("label"));
    const snaps = await getDocs(qy);
    snaps.forEach(d=> out.push({ id:d.id, ...(d.data()||{}) }));
  }catch{
    const snaps = await getDocs(collection(db,"roles"));
    snaps.forEach(d=> out.push({ id:d.id, ...(d.data()||{}) }));
  }
  if (!out.length) out = DEFAULT_ROLES.map(label=>({id:label,label}));
  return out;
}
async function loadPerms(db, role){
  const snap = await getDoc(doc(db,"roles", role));
  const data = snap.exists()? (snap.data()||{}) : {};
  return ensureShape(data.permissions || {});
}
async function savePerms(db, role, perms){
  await setDoc(doc(db,"roles", role), { label: role, permissions: perms, updatedAt: serverTimestamp() }, { merge:true });
}

// ========== Page state + rendering ==========
let db;
let activePerms = null;
let lastSavedPerms = null;

function setDirtyState(){
  const dirty = !shallowEqual(activePerms, lastSavedPerms);
  el.save.disabled = !dirty;
  el.discard.disabled = !dirty;
}

function renderMenus(){
  el.menus.innerHTML = "";
  Object.keys(MENUS).forEach(menuName=>{
    const card = document.createElement("div"); card.className="menu-card";

    const head = document.createElement("div"); head.className="menu-head";
    const left = document.createElement("div"); left.style.display="flex"; left.style.alignItems="center"; left.style.gap="10px";
    const caret = document.createElement("span"); caret.textContent="▸"; caret.style.transition="transform .2s";
    const title = document.createElement("strong"); title.textContent = menuName;
    left.append(caret,title);
    const right = document.createElement("div"); right.className="muted-sm";
    head.append(left,right);

    const body = document.createElement("div"); body.className="menu-body"; body.style.display="none";

    const grid = document.createElement("div"); grid.className="pill-grid";
    ["View","Edit","Add","Archive","Delete"].forEach(name=>{
      const k = name.toLowerCase();
      const pressed = MENUS[menuName].every(sm => !!activePerms[menuName][sm][k]);
      const p = pill(name, pressed, (isOn)=>{
        MENUS[menuName].forEach(sm => activePerms[menuName][sm][k] = isOn);
        right.textContent = menuSummary(activePerms, menuName);
        body.querySelectorAll(`[data-sub="${menuName}::${k}"]`).forEach(btn=>{
          btn.setAttribute("aria-pressed", isOn ? "true":"false");
        });
        setDirtyState();
      });
      p.setAttribute("aria-label", `${menuName}::${k}`);
      grid.appendChild(p);
    });
    body.appendChild(grid);

    const subWrap = document.createElement("div"); subWrap.className="subwrap";
    const sh = document.createElement("div"); sh.className="subhead";
    const shL = document.createElement("div"); shL.style.display="flex"; shL.style.alignItems="center"; shL.style.gap="8px";
    const subCaret = document.createElement("span"); subCaret.textContent="▸"; subCaret.style.transition="transform .2s";
    const shT = document.createElement("strong"); shT.textContent="Manage submenus";
    shL.append(subCaret, shT);
    const shR = document.createElement("span"); shR.className="muted-sm";
    sh.append(shL, shR);
    const subBody = document.createElement("div"); subBody.className="subbody"; subBody.style.display="none";

    MENUS[menuName].forEach(sm=>{
      const section = document.createElement("section"); section.style.margin="10px 0 14px";
      const h = document.createElement("h3"); h.style.margin="0 0 8px"; h.textContent = `${menuName} › ${sm}`;
      const grid2 = document.createElement("div"); grid2.className="pill-grid";
      ["View","Edit","Add","Archive","Delete"].forEach(name=>{
        const k = name.toLowerCase();
        const btn = pill(name, !!activePerms[menuName][sm][k], (isOn)=>{
          activePerms[menuName][sm][k] = isOn;
          shR.textContent = summarizeChildren(activePerms, menuName);
          right.textContent = menuSummary(activePerms, menuName);
          const allOn  = MENUS[menuName].every(s=>activePerms[menuName][s][k]===true);
          const allOff = MENUS[menuName].every(s=>activePerms[menuName][s][k]===false);
          const parentBtn = body.querySelector(`.pill[aria-label="${menuName}::${k}"]`);
          if (parentBtn) parentBtn.setAttribute("aria-pressed", allOn ? "true" : (allOff ? "false" : parentBtn.getAttribute("aria-pressed")));
          setDirtyState();
        });
        btn.setAttribute("data-sub", `${menuName}::${k}`);
        grid2.appendChild(btn);
      });
      section.append(h, grid2);
      subBody.appendChild(section);
    });

    sh.addEventListener("click", ()=>{
      const open = subBody.style.display !== "none";
      subBody.style.display = open ? "none" : "block";
      subCaret.style.transform = open ? "rotate(0deg)" : "rotate(90deg)";
    });

    subWrap.append(sh, subBody);
    body.appendChild(subWrap);

    head.addEventListener("click", ()=>{
      const open = body.style.display !== "none";
      body.style.display = open ? "none" : "block";
      caret.style.transform = open ? "rotate(0deg)" : "rotate(90deg)";
    });

    right.textContent = menuSummary(activePerms, menuName);
    shR.textContent   = summarizeChildren(activePerms, menuName);

    card.append(head, body);
    el.menus.appendChild(card);
  });
  set
