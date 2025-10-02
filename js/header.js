// Dowson Farms — Global Header (green theme)
(function () {
  const header = document.createElement("header");
  header.className = "app-header";
  header.innerHTML = `
    <button id="drawerToggle" class="burger" aria-label="Open menu">☰</button>
    <img src="assets/icons/icon-192.png" alt="" class="app-logo">
    <div class="app-title">Dowson Farms</div>
    <div class="spacer"></div>
    <span id="dateDisplay" class="clock">--/--/----</span>
  `;
  document.body.prepend(header);

  // Date display (Central Time)
  const dateEl = header.querySelector("#dateDisplay");
  function updateDate() {
    const now = new Date();
    dateEl.textContent = now.toLocaleDateString("en-US", {
      month: "short", // "Oct"
      day: "numeric", // "2"
      year: "numeric" // "2025"
    });
  }
  updateDate();

  // Optional: refresh at midnight to roll over the day
  const millisTillMidnight =
    new Date().setHours(24, 0, 0, 0) - new Date().getTime();
  setTimeout(function () {
    updateDate();
    setInterval(updateDate, 24 * 60 * 60 * 1000);
  }, millisTillMidnight);
})();