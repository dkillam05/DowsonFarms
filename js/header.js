// Farm Vista — Global Header (green theme)
(function () {
  const header = document.createElement("header");
  header.className = "app-header";
  header.innerHTML = `
    <button id="drawerToggle" class="burger" aria-label="Open menu">☰</button>
    <div class="header-breadcrumbs" role="presentation"></div>
    <span id="dateDisplay" class="clock">--/--/----</span>
  `;
  document.body.prepend(header);

  const breadcrumbHost = header.querySelector(".header-breadcrumbs");
  const pageBreadcrumbs = document.querySelector("nav.breadcrumbs");
  if (pageBreadcrumbs && !header.contains(pageBreadcrumbs)) {
    pageBreadcrumbs.classList.add("in-app-header");
    breadcrumbHost.appendChild(pageBreadcrumbs);
  } else {
    breadcrumbHost.remove();
  }

  // Date display (Central Time)
  const dateEl = header.querySelector("#dateDisplay");
  function updateDate() {
    const now = new Date();
    dateEl.textContent = now.toLocaleDateString("en-US", {
      weekday: "short",
      month: "long",
      day: "numeric",
      year: "numeric"
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