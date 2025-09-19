window.APP_VERSION = "v4.1.0";

document.addEventListener("DOMContentLoaded", () => {
  const v = document.getElementById("version");
  if (v) v.textContent = window.APP_VERSION;
});
