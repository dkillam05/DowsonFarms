/* Dowson Farms — Global Navigation (one source of truth) */
const DF_MENUS = {
  tiles: [
    {
      label: "Crop Production",
      href: "crop-production/index.html",
      iconEmoji: "🌽",
      children: [
        { label: "Planting",          href: "crop-production/planting.html",    iconEmoji: "🌱" },
        { label: "Spraying",          href: "crop-production/spraying.html",    iconEmoji: "💦" },
        { label: "Aerial Spraying",   href: "crop-production/aerial.html",      iconEmoji: "🚁" },
        { label: "Harvest",           href: "crop-production/harvest.html",     iconEmoji: "🌾" },
        { label: "Fertilizer",        href: "crop-production/fertilizer.html",  iconEmoji: "🧪" },
        { label: "Crop Scouting",     href: "crop-production/scouting.html",    iconEmoji: "🔎" },
        { label: "Field Maintenance", href: "field-maintenance/index.html",     iconEmoji: "🛠️" },
        { label: "Trials",            href: "crop-production/trials.html",      iconEmoji: "🧬" }
      ]
    },

    { // optional shortcut
      label: "Field Maintenance",
      href: "field-maintenance/index.html",
      iconEmoji: "🛠️",
      children: []
    },

    {
      label: "Grain Tracking",
      href: "grain-tracking/index.html",
      iconEmoji: "🌾",
      children: [
        { label: "Grain Bags",         href: "grain-tracking/bags.html",        iconEmoji: "👝" },
        { label: "Grain Bins",         href: "grain-tracking/bins.html",        iconEmoji: "🛢️" },
        { label: "Grain Contracts",    href: "grain-tracking/contracts.html",   iconEmoji: "🧾" },
        { label: "Grain Ticket (OCR)", href: "grain-tracking/ticket-ocr.html",  iconEmoji: "🎫" }
      ]
    },

    {
      label: "Equipment",
      href: "equipment/index.html",
      iconEmoji: "🚜",
      children: [
        { label: "Starfire / Technology", href: "equipment/starfire.html",     iconEmoji: "🛰️" },
        { label: "Tractors",              href: "equipment/tractors.html",     iconEmoji: "🚜" },
        { label: "Combines",              href: "equipment/combines.html",     iconEmoji: "🌽" },
        { label: "Sprayers / Spreaders",  href: "equipment/sprayers.html",     iconEmoji: "💦" },
        { label: "Implements",            href: "equipment/implements.html",   iconEmoji: "⚙️" },
        { label: "Construction",          href: "equipment/construction.html", iconEmoji: "🏗️" },
        { label: "Trucks",                href: "equipment/trucks.html",       iconEmoji: "🚛" },
        { label: "Trailers",              href: "equipment/trailers.html",     iconEmoji: "🚚" }
      ]
    },

    {
      label: "Calculators",
      href: "calculators/index.html",
      iconEmoji: "🔢",
      children: [
        { label: "Combine Yield", href: "calculators/combine-yield.html", iconEmoji: "🌽" },
        { label: "Trial Yields",  href: "calculators/trial-yields.html",  iconEmoji: "🧬" },
        { label: "Area",          href: "calculators/area.html",          iconEmoji: "📐" },
        { label: "Grain Bin",     href: "calculators/grain-bin.html",     iconEmoji: "🛢️" },
        { label: "Chemical Mix",  href: "calculators/chemical-mix.html",  iconEmoji: "🧪" },
        { label: "Grain Shrink",  href: "calculators/grain-shrink.html",  iconEmoji: "📉" }
      ]
    },

    {
      label: "Teams & Partners",
      href: "teams-partners/index.html",
      iconEmoji: "🫱🏼‍🫲🏽",
      children: [
        { label: "Employees",       href: "teams-partners/employees.html",       iconEmoji: "👥" },
        { label: "Sub-Contractors", href: "teams-partners/sub-contractors.html", iconEmoji: "🧰" },
        { label: "Vendors",         href: "teams-partners/vendors.html",         iconEmoji: "🏭" },
        { label: "Dictionary",      href: "teams-partners/dictionary.html",      iconEmoji: "🗂️" }
      ]
    },

    {
      label: "Reports",
      href: "reports/index.html",
      iconEmoji: "📖",
      children: [
        { label: "Pre-Defined Reports", href: "reports/predefined.html", iconEmoji: "📁" },
        { label: "AI Reports",          href: "reports/ai.html",         iconEmoji: "🤖" },
        { label: "AI Report History",   href: "reports/ai-history.html", iconEmoji: "🕘" }
      ]
    },

    {
      label: "Setup / Settings",
      href: "settings-setup/index.html",
      iconEmoji: "⚙️",
      children: [
        { label: "Farms",         href: "settings-setup/farms.html",      iconEmoji: "🏡" },
        { label: "Fields",        href: "settings-setup/fields.html",     iconEmoji: "🗺️" },
        { label: "Crop Types",    href: "settings-setup/crop-types.html", iconEmoji: "🌾" },
        { label: "Theme",         href: "settings-setup/theme.html",      iconEmoji: "🌗" },
        { label: "Account Roles", href: "settings-setup/roles.html",      iconEmoji: "🛡️" },
        {
          label: "Products",
          href: "settings-setup/products/index.html",
          iconEmoji: "📦",
          children: [
            { label: "Seed",        href: "settings-setup/products/seed.html",        iconEmoji: "🌽" },
            { label: "Fertilizer",  href: "settings-setup/products/fertilizer.html",  iconEmoji: "🧂" },
            { label: "Chemical",    href: "settings-setup/products/chemical.html",    iconEmoji: "👨🏼‍🔬" },
            { label: "Grain Bags",  href: "settings-setup/products/grain-bags.html",  iconEmoji: "🛄" }
          ]
        }
      ]
    },

    {
      label: "Feedback",
      href: "feedback/index.html",
      iconEmoji: "💬",
      children: [
        { label: "Ideas",         href: "feedback/ideas.html", iconEmoji: "💡" },
        { label: "Bugs / Issues", href: "feedback/bugs.html",  iconEmoji: "🐞" }
      ]
    }
  ]
};

/* Expose (ESM friendly and <script> friendly) */
try { export default DF_MENUS; } catch (_) {}
if (typeof window !== "undefined") {
  window.DF_MENUS = DF_MENUS;
  if (window.DF && typeof window.DF.ready?.then === "function") {
    window.DF.ready.then(reg => {
      try { reg?.set?.("menus", DF_MENUS); } catch(e){ console.error("menus.js registration failed:", e); }
    });
  }
}
console.log("[menus.js] loaded", DF_MENUS);