// Dowson Farms — version.js
window.APP_VERSION = "v8.0.0";

document.addEventListener("DOMContentLoaded", () => {
  const v = document.getElementById("version");
  if (v) v.textContent = window.APP_VERSION;
});