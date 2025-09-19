/* Dowson Farms — Global Navigation (ordered)
   Single source of truth for menus + submenus + emojis.
   Pages should READ from this, never hardcode.
*/
const MENUS = {
  tiles: [
    // 1
    {
      label: "Crop Production",
      href: "crop.html",
      iconEmoji: "🌽",
      children: [
        { label: "Planting",          href: "crop-planting.html",    iconEmoji: "🌱" },
        { label: "Spraying",          href: "crop-spraying.html",    iconEmoji: "💦" },
        { label: "Aerial Spraying",   href: "crop-aerial.html",      iconEmoji: "🚁" },
        { label: "Harvest",           href: "crop-harvest.html",     iconEmoji: "🌾" },
        { label: "Fertilizer",        href: "crop-fertilizer.html",  iconEmoji: "🧪" },
        { label: "Crop Scouting",     href: "crop-scouting.html",    iconEmoji: "🔎" },
        { label: "Field Maintenance", href: "crop-maintenance.html", iconEmoji: "🛠️" },
        { label: "Trials",            href: "crop-trials.html",      iconEmoji: "🧬" }
      ]
    },

    // 2 — shortcut tile (quick link into Crop Production → Field Maintenance)
    {
      label: "Field Maintenance",
      href: "crop-maintenance.html",
      iconEmoji: "🛠️",
      children: []
    },

    // 3
    {
      label: "Grain Tracking",
      href: "grain.html",
      iconEmoji: "🌾",
      children: [
        { label: "Grain Bags",         href: "grain-bags.html",        iconEmoji: "👝" },
        { label: "Grain Bins",         href: "grain-bins.html",        iconEmoji: "🛢️" },
        { label: "Grain Contracts",    href: "grain-contracts.html",   iconEmoji: "🧾" },
        { label: "Grain Ticket (OCR)", href: "grain-ticket-ocr.html",  iconEmoji: "🎫" }
      ]
    },

    // 4
    {
      label: "Equipment",
      href: "equip.html",
      iconEmoji: "🚜",
      children: [
        { label: "Starfire / Technology", href: "equipment-starfire.html",     iconEmoji: "🛰️" },
        { label: "Tractors",              href: "equipment-tractors.html",     iconEmoji: "🚜" },
        { label: "Combines",              href: "equipment-combines.html",     iconEmoji: "🌽" },
        { label: "Sprayers / Spreaders",  href: "equipment-sprayers.html",     iconEmoji: "💦" },
        { label: "Implements",            href: "equipment-implements.html",   iconEmoji: "⚙️" },
        { label: "Construction",          href: "equipment-construction.html", iconEmoji: "🏗️" },
        { label: "Trucks",                href: "equipment-trucks.html",       iconEmoji: "🚛" },
        { label: "Trailers",              href: "equipment-trailers.html",     iconEmoji: "🚚" }
      ]
    },

    // 5
    {
      label: "Calculators",
      href: "calculators.html",
      iconEmoji: "🔢",
      children: [
        { label: "Combine Yield", href: "calc-combine-yield.html", iconEmoji: "🌽" },
        { label: "Trial Yields",  href: "calc-trial-yields.html",  iconEmoji: "🧬" },
        { label: "Area",          href: "calc-area.html",          iconEmoji: "📐" },
        { label: "Grain Bin",     href: "calc-grain-bin.html",     iconEmoji: "🛢️" },
        { label: "Chemical Mix",  href: "calc-chemical-mix.html",  iconEmoji: "🧪" },
        { label: "Grain Shrink",  href: "calc-grain-shrink.html",  iconEmoji: "📉" }
      ]
    },

    // 6
    {
      label: "Teams & Partners",
      href: "team.html",
      iconEmoji: "🫱🏼‍🫲🏽",
      children: [
        { label: "Employees",       href: "teams-employees.html",       iconEmoji: "👥" },
        { label: "Sub-Contractors", href: "teams-sub-contractors.html", iconEmoji: "🧰" },
        { label: "Vendors",         href: "teams-vendors.html",         iconEmoji: "🏭" },
        { label: "Dictionary",      href: "teams-dictionary.html",      iconEmoji: "🗂️" }
      ]
    },

    // 7
    {
      label: "Reports",
      href: "reports.html",
      iconEmoji: "📖",
      children: [
        { label: "Pre-Defined Reports", href: "reports-predefined.html", iconEmoji: "📁" },
        { label: "AI Reports",          href: "reports-ai.html",         iconEmoji: "🤖" },
        { label: "AI Report History",   href: "reports-ai-history.html", iconEmoji: "🕘" }
      ]
    },

    // 8
    {
      label: "Setup / Settings",
      href: "settings.html",
      iconEmoji: "⚙️",
      children: [
        { label: "Farms",         href: "farms.html",      iconEmoji: "🏡" },
        { label: "Fields",        href: "fields.html",     iconEmoji: "🗺️" },
        { label: "Crop Types",    href: "crop-types.html", iconEmoji: "🌾" },
        { label: "Theme",         href: "theme.html",      iconEmoji: "🌗" },
        { label: "Account Roles", href: "roles.html",      iconEmoji: "🛡️" },
        {
          label: "Products",
          href: "products.html",
          iconEmoji: "📦",
          children: [
            { label: "Seed",        href: "products-seed.html",        iconEmoji: "🌽" },
            { label: "Fertilizer",  href: "products-fertilizer.html",  iconEmoji: "🧂" },
            { label: "Chemical",    href: "products-chemical.html",    iconEmoji: "👨🏼‍🔬" },
            { label: "Grain Bags",  href: "products-grain-bags.html",  iconEmoji: "🛄" }
          ]
        }
      ]
    },

    // 9
    {
      label: "Feedback",
      href: "feedback.html",
      iconEmoji: "💡",
      children: [
        { label: "Ideas",         href: "ideas.html", iconEmoji: "💡" },
        { label: "Bugs / Issues", href: "bugs.html",  iconEmoji: "🐞" }
      ]
    }
  ]
};

/* ---- Export / Globals ---- */
try { export default MENUS; } catch (_) {}

if (typeof window !== 'undefined') {
  window.DF_MENUS = MENUS;

  // Optional shims so legacy renderers don’t no-op:
  if (!window.NAV_HOME || !window.NAV_MENUS) {
    window.NAV_HOME  = MENUS.tiles.map((_, i) => `tile${i}`);
    window.NAV_MENUS = Object.fromEntries(
      MENUS.tiles.map((t, i) => [
        `tile${i}`,
        { id:`tile${i}`, label:t.label, emoji:t.iconEmoji, href:t.href }
      ])
    );
  }
}