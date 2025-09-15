window.APP_VERSION = "v1.16.0";

document.addEventListener("DOMContentLoaded", () => {
  const v = document.getElementById("version");
  if (v) v.textContent = window.APP_VERSION;
});
