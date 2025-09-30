// js/employee-admin.js
import { auth, db } from "./firebase-init.js";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

import {
  getFunctions,
  httpsCallable,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-functions.js";

const employeesCol = collection(db, "users");
const functions = getFunctions();
const inviteEmployeeFn = httpsCallable(functions, "inviteEmployee");

// Elements
const listEl = document.getElementById("employeeList");
const addBtn = document.getElementById("addEmployeeBtn");
const saveBtn = document.getElementById("saveEmployeeBtn");
const inviteBtn = document.getElementById("inviteEmployeeBtn");
const deleteBtn = document.getElementById("deleteEmployeeBtn");

// Form fields
const firstEl = document.getElementById("empFirst");
const lastEl = document.getElementById("empLast");
const emailEl = document.getElementById("empEmail");
const rolesEl = document.getElementById("empRoles");
const overridesEl = document.getElementById("empOverrides");

let currentId = null;

// Load all employees
async function loadEmployees() {
  listEl.innerHTML = "";
  const snap = await getDocs(employeesCol);
  snap.forEach((docSnap) => {
    const d = docSnap.data();
    const li = document.createElement("li");
    li.textContent = `${d.first || ""} ${d.last || ""} (${d.email || ""})`;
    li.onclick = () => selectEmployee(docSnap.id, d);
    listEl.appendChild(li);
  });
}

function selectEmployee(id, d) {
  currentId = id;
  firstEl.value = d.first || "";
  lastEl.value = d.last || "";
  emailEl.value = d.email || "";
  rolesEl.value = (d.roles || []).join(", ");
  overridesEl.value = JSON.stringify(d.overrides || {}, null, 2);
}

// Add new employee locally (not yet saved)
function addEmployee() {
  currentId = null;
  firstEl.value = "";
  lastEl.value = "";
  emailEl.value = "";
  rolesEl.value = "";
  overridesEl.value = "{}";
}

// Save employee to Firestore
async function saveEmployee() {
  const data = {
    first: firstEl.value.trim(),
    last: lastEl.value.trim(),
    email: emailEl.value.trim(),
    roles: rolesEl.value
      .split(",")
      .map((r) => r.trim())
      .filter((r) => r),
    overrides: JSON.parse(overridesEl.value || "{}"),
  };

  if (currentId) {
    await updateDoc(doc(db, "users", currentId), data);
  } else {
    await addDoc(employeesCol, data);
  }
  await loadEmployees();
  alert("Employee saved.");
}

// Save + Send Invite (calls Cloud Function)
async function inviteEmployee() {
  const data = {
    first: firstEl.value.trim(),
    last: lastEl.value.trim(),
    email: emailEl.value.trim(),
    roles: rolesEl.value
      .split(",")
      .map((r) => r.trim())
      .filter((r) => r),
    overrides: JSON.parse(overridesEl.value || "{}"),
  };

  try {
    const res = await inviteEmployeeFn(data);
    console.log("Invite response:", res.data);
    alert("Invite sent! Link: " + res.data.link);
    await loadEmployees();
  } catch (err) {
    console.error("Invite failed:", err);
    alert("Invite failed: " + err.message);
  }
}

// Delete employee
async function deleteEmployee() {
  if (!currentId) return alert("Select an employee first.");
  await deleteDoc(doc(db, "users", currentId));
  await loadEmployees();
  alert("Employee deleted.");
}

// Bind buttons
addBtn.onclick = addEmployee;
saveBtn.onclick = saveEmployee;
inviteBtn.onclick = inviteEmployee;
deleteBtn.onclick = deleteEmployee;

// Initial load
loadEmployees();