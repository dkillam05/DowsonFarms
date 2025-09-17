window.APP_VERSION = "v2.5.11";

document.addEventListener("DOMContentLoaded", () => {
  const v = document.getElementById("version");
  if (v) v.textContent = window.APP_VERSION;
});
