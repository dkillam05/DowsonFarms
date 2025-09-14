// Core.js - shared header/footer rendering
document.addEventListener("DOMContentLoaded", () => {
  const header = document.getElementById("site-header");
  const footer = document.getElementById("site-footer");

  if (header) {
    header.innerHTML = `
      <div class="head-inner">
        <img src="assets/icons/logo.png" alt="Logo" style="height:32px;border-radius:50%;vertical-align:middle;">
        <span style="font-weight:bold;color:var(--brand-gold);margin-left:8px;">Dowson Farms</span>
        <span id="clock" style="margin-left:auto;"></span>
        <a href="login.html" class="btn-logout">Logout</a>
      </div>`;
  }

  if (footer) {
    footer.innerHTML = `
      <div class="foot-inner">
        © Dowson Farms • <span id="date"></span> • <span id="version"></span>
      </div>`;
  }

  // Date
  document.getElementById("date").textContent =
    new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"});
});
