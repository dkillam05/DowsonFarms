// Dowson Farms — Global Header (green theme)
(function () {
  const header = document.createElement("header");
  header.className = "app-header";
  header.innerHTML = `
    <button id="drawerToggle" class="burger" aria-label="Open menu">☰</button>
    <img src="assets/icons/icon-192.png" alt="" class="app-logo">
    <div class="app-title">Dowson Farms</div>
    <div class="spacer"></div>
    <span id="clock" class="clock">--:--</span>
  `;
  document.body.prepend(header);

  // Live clock (Central Time)
  const clockEl = header.querySelector("#clock");
  function tick() {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  tick();
  setInterval(tick, 1000);
})();
