// js/employees-admin.js — Manage employees + per-employee permission overrides
// This version normalizes name fields so first/last show even if docs used firstName/lastName.

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
const permWrapper   = document.getElementById("permGridWrapper");
const permToggleBtn = document.getElementById("permToggle");
const btnSaveOv     = document.getElementById("btnSaveOverrides");
const btnClearOv    = document.getElementById("btnClearOverrides");

// ---------- State ----------
let employees = [];      // {id, first,last,email,roles, overridesByPath?}
let selectedId = null;   // user doc id
let permTreeRetryCount = 0;

// ---------- Helpers ----------
function toast(ok, msg){
  statusEl.className = ok ? "ok" : "err";
  statusEl.textContent = msg;
  statusEl.style.display = "block";
  setTimeout(() => statusEl.style.display = "none", 4000);
}

function normalizeUser(u = {}) {
  // accept first/last or firstName/lastName; create displayName fallback
  const first = u.first ?? u.firstName ?? "";
  const last  = u.last  ?? u.lastName  ?? "";
  const email = (u.email || "").toLowerCase();
  const displayName = u.displayName || [first, last].filter(Boolean).join(" ").trim() || email || "(no name)";
  // normalize roles to lowercase array
  const roles = Array.isArray(u.roles) ? u.roles.map(r => String(r).toLowerCase()) : (u.roles ? [String(u.roles).toLowerCase()] : []);
  return { ...u, first, last, email, displayName, roles };
}

const ACTIONS = [
  { key: "view", label: "View", hint: "Allow viewing this screen." },
  { key: "create", label: "Add", hint: "Allow adding new records or entries." },
  { key: "edit", label: "Edit", hint: "Allow updating existing information." },
  { key: "archive", label: "Archive", hint: "Allow archiving used records so they stay out of pickers." },
  { key: "delete", label: "Delete", hint: "Allow permanent deletion when the record has never been used." }
];

const STATUS_LABELS = {
  full: "Full access",
  custom: "Custom",
  none: "None"
};

function formatUserSummary(user){
  if (!user) return null;
  const parts = [];
  const name = user.displayName || [user.first, user.last].filter(Boolean).join(" ").trim();
  if (name) parts.push(name);
  const email = user.email || "";
  if (email && (!name || email.toLowerCase() !== name.toLowerCase())) parts.push(email);
  if (!parts.length && user.id) parts.push(user.id);
  return parts.join(" • ");
}

function updateSelectionHint(){
  if (!selHint) return;
  const user = getSelected();
  if (!user) {
    selHint.textContent = "Select a team member to edit";
    selHint.dataset.state = "empty";
    return;
  }
  selHint.textContent = formatUserSummary(user) || "Selected";
  selHint.dataset.state = "selected";
}

function updateSelectedRowHighlight(){
  if (!listEl) return;
  const rows = listEl.querySelectorAll(".list-item");
  rows.forEach(row => {
    if (row.dataset.id === selectedId) {
      row.classList.add("is-selected");
    } else {
      row.classList.remove("is-selected");
    }
  });
}

function renderEmpList(){
  listEl.innerHTML = "";
  employees.forEach(u => {
    const row = document.createElement("div");
    row.className = "list-item";
    row.dataset.id = u.id;
    row.role = "button";
    row.tabIndex = 0;
    const name = u.displayName || [u.first, u.last].filter(Boolean).join(" ").trim() || "(no name)";
    row.innerHTML = `
      <div><strong>${name}</strong><br><span class="muted">${u.email || ""}</span></div>
      <div class="muted">${Array.isArray(u.roles) ? u.roles.join(", ") : ""}</div>
    `;
    row.addEventListener("click", () => selectEmp(u.id));
    listEl.appendChild(row);
  });
  updateSelectedRowHighlight();
}

function getSelected(){
  return employees.find(e => e.id === selectedId) || null;
}

function formToData(){
  const roles = Array.from(rolesEl.selectedOptions).map(o => String(o.value || "").toLowerCase());
  const first = firstEl.value.trim();
  const last  = lastEl.value.trim();
  const email = emailEl.value.trim().toLowerCase();
  const displayName = [first, last].filter(Boolean).join(" ").trim();
  return { first, last, email, roles, displayName };
}

function fillForm(u){
  firstEl.value = u?.first || "";
  lastEl.value  = u?.last || "";
  emailEl.value = u?.email || "";

  Array.from(rolesEl.options).forEach(opt => {
    opt.selected = Array.isArray(u?.roles) && u.roles.includes(String(opt.value).toLowerCase());
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
  snap.forEach(d => employees.push(normalizeUser({ id:d.id, ...d.data() })));
  if (selectedId && !employees.some(e => e.id === selectedId)) {
    selectedId = null;
  }
  renderEmpList();
  updateSelectionHint();
}

// ---------- Overrides UI ----------
function buildMenuTree(){
  const menus = Array.isArray(window.DF_DRAWER_MENUS) ? window.DF_DRAWER_MENUS : [];
  const clone = (node = {}) => ({
    label: node.label || "",
    href: node.href || "",
    children: Array.isArray(node.children) ? node.children.map(clone) : []
  });
  return menus.map(clone);
}

function createLeaf(node, overrides = {}, trail = []){
  if (!node.href) return null;
  const labelTrail = [...trail, node.label].filter(Boolean);
  const labelText = labelTrail.length
    ? labelTrail.join(" › ")
    : (node.label || node.href || "Untitled page");

  const leaf = document.createElement("div");
  leaf.className = "perm-leaf";
  leaf.dataset.path = node.href;

  const label = document.createElement("div");
  label.className = "perm-leaf-label";
  const labelSpan = document.createElement("span");
  labelSpan.textContent = labelText;
  label.appendChild(labelSpan);
  leaf.appendChild(label);

  const actions = document.createElement("div");
  actions.className = "perm-actions";
  const current = overrides[node.href] || {};
  ACTIONS.forEach(action => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "perm-action";
    btn.dataset.path = node.href;
    btn.dataset.k = action.key;
    btn.textContent = action.label;
    if (action.hint) btn.title = action.hint;
    btn.setAttribute("aria-pressed", current[action.key] ? "true" : "false");
    btn.addEventListener("click", () => toggleAction(btn));
    actions.appendChild(btn);
  });
  leaf.appendChild(actions);
  return leaf;
}

function renderMenuNode(node, overrides = {}, trail = []){
  const hasChildren = Array.isArray(node.children) && node.children.length;
  if (!hasChildren) {
    return createLeaf(node, overrides, trail);
  }

  const branch = document.createElement("details");
  branch.className = "perm-branch";

  const summary = document.createElement("summary");
  const title = document.createElement("span");
  title.textContent = node.label || node.href || "Untitled section";
  summary.appendChild(title);

  const status = document.createElement("span");
  status.className = "perm-branch-status perm-branch-status--none";
  status.textContent = STATUS_LABELS.none;
  summary.appendChild(status);
  branch.appendChild(summary);

  const childrenWrap = document.createElement("div");
  childrenWrap.className = "perm-children";

  if (node.href) {
    const leaf = createLeaf(node, overrides, trail);
    if (leaf) childrenWrap.appendChild(leaf);
  }

  const nextTrail = node.label ? [...trail, node.label] : trail;
  node.children.forEach(child => {
    const childEl = renderMenuNode(child, overrides, nextTrail);
    if (childEl) childrenWrap.appendChild(childEl);
  });

  if (!childrenWrap.children.length) {
    const empty = document.createElement("div");
    empty.className = "perm-empty";
    empty.textContent = "No pages in this section yet.";
    childrenWrap.appendChild(empty);
  }

  branch.appendChild(childrenWrap);
  return branch;
}

function toggleAction(btn){
  const current = btn.getAttribute("aria-pressed") === "true";
  btn.setAttribute("aria-pressed", current ? "false" : "true");
  updateBranchStatuses();
}

function renderPermTree(overrides = {}){
  if (!permRowsEl) return;
  const menusReady = Array.isArray(window.DF_DRAWER_MENUS);
  if (!menusReady && permTreeRetryCount < 5) {
    permTreeRetryCount += 1;
    setTimeout(() => renderPermTree(overrides), 200 * permTreeRetryCount);
    return;
  }

  permRowsEl.innerHTML = "";
  const tree = menusReady ? buildMenuTree() : [];
  if (!tree.length) {
    const empty = document.createElement("div");
    empty.className = "perm-empty";
    empty.textContent = menusReady
      ? "No navigation paths were found in drawer-menus.js."
      : "drawer-menus.js not loaded.";
    permRowsEl.appendChild(empty);
    return;
  }

  permTreeRetryCount = 0;
  tree.forEach(node => {
    const el = renderMenuNode(node, overrides, []);
    if (el) permRowsEl.appendChild(el);
  });

  collapseAllBranches();
  updateBranchStatuses();
}

function snapshotOverrides(){
  if (!permRowsEl) return {};
  const buttons = permRowsEl.querySelectorAll(".perm-action");
  const map = {};
  buttons.forEach(btn => {
    const path = btn.dataset.path;
    const key = btn.dataset.k;
    if (!path || !key) return;
    if (!map[path]) map[path] = {};
    map[path][key] = btn.getAttribute("aria-pressed") === "true";
  });
  return map;
}

function collectOverridesFromTree(){
  const snapshot = snapshotOverrides();
  Object.keys(snapshot).forEach(path => {
    const obj = snapshot[path];
    const hasAny = ACTIONS.some(action => obj[action.key]);
    if (!hasAny) delete snapshot[path];
  });
  return snapshot;
}

function computeBranchStatusFromDom(branch){
  if (!branch) return "none";
  const leaves = branch.querySelectorAll(".perm-leaf");
  if (!leaves.length) return "none";
  const states = [];
  leaves.forEach(leaf => {
    const actions = leaf.querySelectorAll(".perm-action");
    if (!actions.length) return;
    let pressed = 0;
    actions.forEach(actionBtn => {
      if (actionBtn.getAttribute("aria-pressed") === "true") pressed += 1;
    });
    if (pressed === 0) {
      states.push("none");
    } else if (pressed === actions.length) {
      states.push("full");
    } else {
      states.push("custom");
    }
  });
  if (!states.length) return "none";
  if (states.every(state => state === "full")) return "full";
  if (states.every(state => state === "none")) return "none";
  return "custom";
}

function applyBranchStatus(branch, state){
  const statusEl = branch.querySelector(":scope > summary .perm-branch-status");
  if (!statusEl) return;
  const nextState = STATUS_LABELS[state] ? state : "none";
  statusEl.textContent = STATUS_LABELS[nextState];
  statusEl.classList.remove("perm-branch-status--full", "perm-branch-status--custom", "perm-branch-status--none");
  statusEl.classList.add(`perm-branch-status--${nextState}`);
}

function updateBranchStatuses(){
  if (!permRowsEl) return;
  const branches = permRowsEl.querySelectorAll("details.perm-branch");
  branches.forEach(branch => {
    const state = computeBranchStatusFromDom(branch);
    applyBranchStatus(branch, state);
  });
}

function collapseAllBranches(){
  if (!permRowsEl) return;
  permRowsEl.querySelectorAll("details.perm-branch").forEach(branch => {
    branch.open = false;
  });
}

// ---------- Actions ----------
async function selectEmp(id){
  selectedId = id;
  updateSelectedRowHighlight();
  let raw = getSelected();
  if (!raw && id) {
    try {
      const snap = await getDoc(doc(db, "users", id));
      if (snap.exists()) raw = normalizeUser({ id, ...snap.data() });
    } catch (err) {
      console.warn("Failed to fetch user", err);
    }
  }
  const u = normalizeUser(raw || {});
  fillForm(u);
  renderPermTree(u.overridesByPath || {});
  updateSelectionHint();
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
  renderPermTree({});
  updateSelectedRowHighlight();
  updateSelectionHint();
  toast(true, "Employee removed.");
}

async function saveOverrides(){
  if (!selectedId) { toast(false, "Select an employee first."); return; }
  const overridesByPath = collectOverridesFromTree();
  await setDoc(doc(db, "users", selectedId), { overridesByPath }, { merge:true });
  const u = getSelected();
  if (u) u.overridesByPath = overridesByPath;
  toast(true, "Overrides saved.");
}

async function clearOverrides(){
  if (!selectedId) { toast(false, "Select an employee first."); return; }
  await setDoc(doc(db, "users", selectedId), { overridesByPath: {} }, { merge:true });
  const u = getSelected();
  if (u) u.overridesByPath = {};
  renderPermTree({});
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

if (permToggleBtn && permWrapper) {
  const mq = window.matchMedia("(max-width: 720px)");
  const setCollapsed = (collapsed) => {
    if (collapsed) {
      permWrapper.setAttribute("hidden", "");
      permToggleBtn.setAttribute("aria-expanded", "false");
      permToggleBtn.textContent = "Show overrides";
    } else {
      permWrapper.removeAttribute("hidden");
      permToggleBtn.setAttribute("aria-expanded", "true");
      permToggleBtn.textContent = "Hide overrides";
    }
  };

  permToggleBtn.addEventListener("click", () => {
    const isCollapsed = permWrapper.hasAttribute("hidden");
    setCollapsed(!isCollapsed);
  });

  const onChange = (event) => setCollapsed(event.matches);
  if (typeof mq.addEventListener === "function") {
    mq.addEventListener("change", onChange);
  } else if (typeof mq.addListener === "function") {
    mq.addListener(onChange);
  }

  setCollapsed(mq.matches);
}

// ---------- Bootstrap ----------
(async function init(){
  await loadRolesIntoSelect();
  renderPermTree({});
  onAuthStateChanged(auth, async () => {
    await refreshList();
  });
})();