// js/employees-admin.js — Manage employees + per-employee permission overrides

import { auth, db } from "./firebase-init.js";
import {
  collection, getDocs, addDoc, doc, getDoc, setDoc, updateDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import {
  httpsCallable, getFunctions
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-functions.js";
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

// ---------- DOM refs ----------
const listEl   = document.getElementById("empList");
const statusEl = document.getElementById("status");
const selHint  = document.getElementById("selHint");

const firstEl  = document.getElementById("firstName");
const lastEl   = document.getElementById("lastName");
const emailEl  = document.getElementById("email");
const rolesEl  = document.getElementById("roles");

const btnAdd        = document.getElementById("btnAdd");
const btnRefresh    = document.getElementById("btnRefresh");
const btnSave       = document.getElementById("btnSave");
const btnSaveInvite = document.getElementById("btnSaveInvite");
const btnDelete     = document.getElementById("btnDelete");

const permRowsEl    = document.getElementById("permRows");
const btnSaveOv     = document.getElementById("btnSaveOverrides");
const btnClearOv    = document.getElementById("btnClearOverrides");

// ---------- State ----------
let employees = [];      // {id, first,last,email,roles, overridesByPath?}
let selectedId = null;   // user doc id

// ---------- Helpers ----------
function toast(ok, msg){
  statusEl.className = ok ? "ok" : "err";
  statusEl.textContent = msg;
  statusEl.style.display = "block";
  setTimeout(() => statusEl.style.display = "none", 4000);
}

function getMenus(){
  const root = window.DF_MENUS || {};
  return Array.isArray(root.tiles) ? root.tiles : [];
}
function flattenMenus(){
  const out = [];
  const walk = (node) => {
    if (!node) return;
    if (node.href) out.push({ label: node.label || node.href, href: node.href });
    if (Array.isArray(node.children)) node.children.forEach(walk);
  };
  getMenus().forEach(walk);
  // unique by href
  const seen = new Set();
  return out.filter(x => !seen.has(x.href) && seen.add(x.href));
}

function renderEmpList(){
  listEl.innerHTML = "";
  employees.forEach(u => {
    const row = document.createElement("div");
    row.className = "list-item";
    row.role = "button";
    row.tabIndex = 0;
    row.innerHTML = `
      <div><strong>${u.first || ""} ${u.last || ""}</strong><br><span class="muted">${u.email || ""}</span></div>
      <div class="muted">${Array.isArray(u.roles) ? u.roles.join(", ") : ""}</div>
    `;
    row.addEventListener("click", () => selectEmp(u.id));
    listEl.appendChild(row);
  });
}

function getSelected(){
  return employees.find(e => e.id === selectedId) || null;
}

function formToData(){
  const roles = Array.from(rolesEl.selectedOptions).map(o => String(o.value || "").toLowerCase());
  return {
    first: firstEl.value.trim(),
    last:  lastEl.value.trim(),
    email: emailEl.value.trim().toLowerCase(),
    roles
  };
}

function fillForm(u){
  firstEl.value = u?.first || "";
  lastEl.value  = u?.last || "";
  emailEl.value = u?.email || "";

  // roles options come from roles collection
  Array.from(rolesEl.options).forEach(opt => {
    opt.selected = Array.isArray(u?.roles) && u.roles.map(r=>String(r).toLowerCase()).includes(String(opt.value).toLowerCase());
  });
}

async function loadRolesIntoSelect(){
  rolesEl.innerHTML = "";
  const rs = await getDocs(collection(db, "roles"));
  const opts = [];
  rs.forEach(d => {
    const data = d.data() || {};
    const key = (data.key || d.id || "").toLowerCase();
    if (!key) return;
    const o = document.createElement("option");
    o.value = key;
    o.textContent = key;
    opts.push(o);
  });
  if (!opts.length) {
    const o = document.createElement("option");
    o.value = "employee";
    o.textContent = "employee";
    opts.push(o);
  }
  opts.forEach(o => rolesEl.appendChild(o));
}

async function refreshList(){
  const snap = await getDocs(collection(db, "users"));
  employees = [];
  snap.forEach(d => employees.push({ id:d.id, ...d.data() }));
  renderEmpList();
  selHint.textContent = selectedId ? `(selected ${selectedId})` : "(no employee selected)";
}

// ---------- Overrides UI ----------
function buildPermRow(pathLabel, href, current = {}){
  const row = document.createElement("div");
  row.className = "perm-grid";
  row.dataset.href = href;

  function cb(name){
    const el = document.createElement("input");
    el.type = "checkbox";
    el.checked = !!current[name];
    el.dataset.key = name;
    return el;
    }
  const lbl = document.createElement("div");
  lbl.textContent = pathLabel;

  row.appendChild(lbl);
  row.appendChild(cb("view"));
  row.appendChild(cb("create"));
  row.appendChild(cb("edit"));
  row.appendChild(cb("delete"));
  row.appendChild(cb("archive"));
  return row;
}

function renderOverridesGrid(user){
  permRowsEl.innerHTML = "";
  const flat = flattenMenus();
  const ov = (user && user.overridesByPath) || {};
  flat.forEach(item => {
    const curr = ov[item.href] || {};
    const row = buildPermRow(item.label, item.href, curr);
    permRowsEl.appendChild(row);
  });
}

function collectOverridesFromGrid(){
  const out = {};
  const rows = Array.from(permRowsEl.querySelectorAll(".perm-grid"));
  rows.forEach(r => {
    const href = r.dataset.href;
    const checks = Array.from(r.querySelectorAll("input[type=checkbox]"));
    const obj = {};
    checks.forEach(c => { if (c.checked) obj[c.dataset.key] = true; });
    // only store if ANY true
    if (Object.keys(obj).length) out[href] = obj;
  });
  return out;
}

// ---------- Actions ----------
async function selectEmp(id){
  selectedId = id;
  selHint.textContent = `(selected ${selectedId})`;
  const u = getSelected();
  fillForm(u);
  renderOverridesGrid(u);
}

async function addEmployee(){
  const base = { first:"", last:"", email:"", roles:["employee"], createdAt: Date.now() };
  const dref = await addDoc(collection(db, "users"), base);
  await refreshList();
  await selectEmp(dref.id);
  toast(true, "New employee created (draft). Enter details and Save.");
}

async function saveEmployee(inviteAfter=false){
  if (!selectedId) { toast(false, "Select an employee first."); return; }
  const data = formToData();
  if (!data.email) { toast(false, "Email is required."); return; }
  await updateDoc(doc(db, "users", selectedId), data);
  await refreshList();
  await selectEmp(selectedId);
  toast(true, "Employee saved.");
  if (inviteAfter) {
    try {
      const fns = getFunctions();
      const invite = httpsCallable(fns, "inviteEmployee");
      await invite({ uid: selectedId, email: data.email, first: data.first, last: data.last });
      toast(true, "Invite email sent.");
    } catch (e) {
      toast(false, "Invite failed: " + (e.message || e.code || "unknown"));
    }
  }
}

async function deleteEmployee(){
  if (!selectedId) { toast(false, "Select an employee first."); return; }
  await deleteDoc(doc(db, "users", selectedId));
  selectedId = null;
  await refreshList();
  fillForm(null);
  permRowsEl.innerHTML = "";
  selHint.textContent = "(no employee selected)";
  toast(true, "Employee removed.");
}

async function saveOverrides(){
  if (!selectedId) { toast(false, "Select an employee first."); return; }
  const overridesByPath = collectOverridesFromGrid();
  await setDoc(doc(db, "users", selectedId), { overridesByPath }, { merge:true });
  // reflect in memory state for the selected user
  const u = getSelected();
  if (u) u.overridesByPath = overridesByPath;
  toast(true, "Overrides saved.");
}

async function clearOverrides(){
  if (!selectedId) { toast(false, "Select an employee first."); return; }
  await setDoc(doc(db, "users", selectedId), { overridesByPath: {} }, { merge:true });
  const u = getSelected();
  if (u) u.overridesByPath = {};
  renderOverridesGrid(u);
  toast(true, "Overrides cleared.");
}

// ---------- Wire up ----------
btnAdd?.addEventListener("click", addEmployee);
btnRefresh?.addEventListener("click", refreshList);
btnSave?.addEventListener("click", () => saveEmployee(false));
btnSaveInvite?.addEventListener("click", () => saveEmployee(true));
btnDelete?.addEventListener("click", deleteEmployee);
btnSaveOv?.addEventListener("click", saveOverrides);
btnClearOv?.addEventListener("click", clearOverrides);

// ---------- Bootstrap ----------
(async function init(){
  // load roles select first
  await loadRolesIntoSelect();
  // auth not strictly required here, but nice to ensure
  onAuthStateChanged(auth, async () => {
    await refreshList();
  });
})();