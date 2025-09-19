// ui-nav.js
// Renders home tiles from global DF_MENUS (assets/data/menus.js)

(() => {
  if (!window.DF_MENUS) return; // menus.js must load first

  // Hard-order for Home, with the Field Maintenance shortcut at #2.
  const ORDER = [
    "Crop Production",
    "__FIELD_MAINTENANCE_SHORTCUT__", // points to Crop > Field Maintenance
    "Grain Tracking",
    "Equipment",
    "Calculators",
    "Team / Partners",
    "Reports",
    "Setup / Settings",
    "Feedback",
  ];

  // Known routes for top-level menus
  const ROUTES = {
    "Crop Production": "crop.html",
    "Grain Tracking": "grain.html",
    "Equipment": "equip.html",
    "Calculators": "calc.html",
    "Team / Partners": "teams-partners.html",
    "Reports": "reports.html",
    "Setup / Settings": "settings.html",
    "Feedback": "feedback.html",
  };

  // Emoji for the Field Maintenance shortcut (uses your exact emoji)
  const FIELD_MAINTENANCE = {
    emoji: "🛠️",
    label: "Field Maintenance",
    href: "crop-maintenance.html"
  };

  // Pull menu metadata (emoji + label) from DF_MENUS safely
  function getTopMeta(name) {
    const row = window.DF_MENUS?.top?.find?.(m => m.name === name);
    return row ? { emoji: row.emoji || "", label: row.name } : { emoji: "", label: name };
  }

  function makeTile({ emoji, label, href }) {
    const a = document.createElement("a");
    a.className = "df-tile";
    a.href = href;
    a.innerHTML = `${emoji ? `${emoji} ` : ""}<span>${label}</span>`;
    return a;
  }

  function render(container) {
    // Build the tile list in the fixed order above
    const tiles = [];

    ORDER.forEach(key => {
      if (key === "__FIELD_MAINTENANCE_SHORTCUT__") {
        tiles.push(makeTile(FIELD_MAINTENANCE));
        return;
      }
      const meta = getTopMeta(key);
      const href = ROUTES[key] || "#";
      tiles.push(makeTile({ emoji: meta.emoji, label: meta.label, href }));
    });

    container.innerHTML = "";
    tiles.forEach(t => container.appendChild(t));
  }

  // Find any container that opts in
  document.querySelectorAll(".df-tiles[data-source='global']").forEach(render);
})();