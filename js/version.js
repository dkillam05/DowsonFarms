/* =========================================================
   Dowson Farms — Global Version Info
   ========================================================= */

// ⚠️ Only bump THIS number when you release a new build
window.DF_VERSION = "v2.4.0";   // <-- bump here

// Build date (Central Time, auto-generated when you bump)
window.DF_BUILD_DATE = new Date().toLocaleString("en-US", {
  timeZone: "America/Chicago",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit"
});

// Inject into footer once DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  const verEl  = document.getElementById("version");
  const dateEl = document.getElementById("report-date");
  if (verEl)  verEl.textContent  = window.DF_VERSION;
  if (dateEl) dateEl.textContent = window.DF_BUILD_DATE;
});