window.APP_VERSION = "v2.4.9";

document.addEventListener("DOMContentLoaded", () => {
  const v = document.getElementById("version");
  if (v) v.textContent = window.APP_VERSION;
});
