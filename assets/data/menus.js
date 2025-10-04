/* Farm Vista — Global Navigation (one source of truth)
   Loads as a normal script and sets window.DF_MENUS.
   NOTE: All TOP-LEVEL sections use folder-style hrefs (e.g., "section/").
*/
window.DF_MENUS = {
  tiles: [
    {
      label: "Crop Production",
      href: "crop-production/",                 // folder-style
      iconEmoji: "🌽",
      children: [
        { label: "Planting",          href: "crop-production/crop-planting.html",     iconEmoji: "🌱" },
        { label: "Spraying",          href: "crop-production/crop-spraying.html",     iconEmoji: "💦" },
        { label: "Aerial Spraying",   href: "crop-production/crop-aerial.html",       iconEmoji: "🚁" },
        { label: "Harvest",           href: "crop-production/crop-harvest.html",      iconEmoji: "🌾" },
        { label: "Fertilizer",        href: "crop-production/crop-fertilizer.html",   iconEmoji: "🧪" },
        { label: "Crop Scouting",     href: "crop-production/crop-scouting.html",     iconEmoji: "🔎" },
        { label: "Maintenance",       href: "crop-production/crop-maintenance.html",  iconEmoji: "🛠️" },
        { label: "Trials",            href: "crop-production/crop-trials.html",       iconEmoji: "🧬" }
      ]
    },

    {
      label: "Field Maintenance",
      href: "field-maintenance/",               // folder-style
      iconEmoji: "🛠️",
      children: [
        { label: "Overview", href: "field-maintenance/field-maintenance.html", iconEmoji: "🛠️" }
      ]
    },

    {
      label: "Grain Tracking",
      href: "grain-tracking/",                  // folder-style
      iconEmoji: "🌾",
      children: [
        { label: "Grain Bags",         href: "grain-tracking/grain-bags.html",        iconEmoji: "👝" },
        { label: "Grain Bins",         href: "grain-tracking/grain-bins.html",        iconEmoji: "🛢️" },
        { label: "Grain Contracts",    href: "grain-tracking/grain-contracts.html",   iconEmoji: "🧾" },
        { label: "Grain Ticket (OCR)", href: "grain-tracking/grain-ticket-ocr.html",  iconEmoji: "🎫" }
      ]
    },

    {
      label: "Equipment",
      href: "equipment/",                       // folder-style
      iconEmoji: "🚜",
      children: [
        { label: "StarFire / Technology", href: "equipment/equipment-starfire.html",     iconEmoji: "🛰️" },
        { label: "Tractors",              href: "equipment/equipment-tractors.html",     iconEmoji: "🚜" },
        { label: "Combines",              href: "equipment/equipment-combines.html",     iconEmoji: "🌽" },
        { label: "Sprayers / Spreaders",  href: "equipment/equipment-sprayers.html",     iconEmoji: "💦" },
        { label: "Implements",            href: "equipment/equipment-implements.html",   iconEmoji: "⚙️" },
        { label: "Construction",          href: "equipment/equipment-construction.html", iconEmoji: "🏗️" },
        { label: "Trucks",                href: "equipment/equipment-trucks.html",       iconEmoji: "🚛" },
        { label: "Trailers",              href: "equipment/equipment-trailers.html",     iconEmoji: "🚚" }
      ]
    },

    {
      label: "Calculators",
      href: "calculators/",                     // folder-style
      iconEmoji: "🔢",
      children: [
        { label: "Combine Yield", href: "calculators/calc-combine-yield.html", iconEmoji: "🌽" },
        { label: "Trial Yields",  href: "calculators/calc-trial-yields.html",  iconEmoji: "🧬" },
        { label: "Area",          href: "calculators/calc-area.html",          iconEmoji: "📐" },
        { label: "Grain Bin",     href: "calculators/calc-grain-bin.html",     iconEmoji: "🛢️" },
        { label: "Chemical Mix",  href: "calculators/calc-chemical-mix.html",  iconEmoji: "🧪" },
        { label: "Grain Shrink",  href: "calculators/calc-grain-shrink.html",  iconEmoji: "📉" }
      ]
    },

    {
      label: "Teams & Partners",
      href: "teams-partners/",                  // folder-style
      iconEmoji: "🫱🏼‍🫲🏽",
      children: [
        { label: "Employees",       href: "teams-partners/teams-employees.html",       iconEmoji: "👥" },
        { label: "Sub-Contractors", href: "teams-partners/teams-sub-contractors.html", iconEmoji: "🧰" },
        { label: "Vendors",         href: "teams-partners/teams-vendors.html",         iconEmoji: "🏭" },
        { label: "Dictionary",      href: "teams-partners/teams-dictionary.html",      iconEmoji: "🗂️" }
      ]
    },

    {
      label: "Reports",
      href: "reports/",                         // folder-style
      iconEmoji: "📖",
      children: [
        { label: "Pre-Defined Reports", href: "reports/reports-predefined.html",  iconEmoji: "📁" },
        { label: "AI Reports",          href: "reports/reports-ai.html",          iconEmoji: "🤖" },
        { label: "AI Report History",   href: "reports/reports-ai-history.html",  iconEmoji: "🕘" }
      ]
    },

    {
      label: "Setup",
      href: "setup/",                            // folder-style
      iconEmoji: "🛠️",
      children: [
        { label: "Farms",         href: "setup/ss-farms.html",        iconEmoji: "🏡" },
        { label: "Fields",        href: "setup/ss-fields.html",       iconEmoji: "🗺️" },
        { label: "Crop Types",    href: "setup/ss-crop-types.html",   iconEmoji: "🌾" },
        { label: "Account Roles", href: "setup/ss-roles.html",        iconEmoji: "🛡️" },
        {
          label: "Products", href: "setup/products/",                 // folder-style for nested group
          iconEmoji: "📦",
          children: [
            { label: "Seed",        href: "setup/products/products-seed.html",        iconEmoji: "🌽" },
            { label: "Fertilizer",  href: "setup/products/products-fertilizer.html",  iconEmoji: "🧂" },
            { label: "Chemical",    href: "setup/products/products-chemical.html",    iconEmoji: "👨🏼‍🔬" },
            { label: "Grain Bags",  href: "setup/products/products-grain-bags.html",  iconEmoji: "🛄" }
          ]
        }
      ]
    },

    {
      label: "Settings",
      href: "settings/",                        // folder-style
      iconEmoji: "⚙️",
      children: [
        { label: "Theme",            href: "settings/settings-theme.html",       iconEmoji: "🌗" },
        { label: "Account Details", href: "settings/account-details.html",      iconEmoji: "👤" }
      ]
    },

    {
      label: "Feedback",
      href: "feedback/",                         // folder-style
      iconEmoji: "💬",
      children: [
        { label: "Ideas",         href: "feedback/fb-ideas.html", iconEmoji: "💡" },
        { label: "Bugs / Issues", href: "feedback/fb-bugs.html",  iconEmoji: "🐞" }
      ]
    }
  ]
};