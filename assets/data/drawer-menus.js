/* Farm Vista — Drawer Menus (accordion data, separate from DF_MENUS) */
window.DF_DRAWER_MENUS = [
  {
    label: "Crop Production",
    icon: "🌽",
    children: [
      {
        label: "Views / Reports", icon: "📊",
        children: [
          { label: "Field Trials", href: "crop-production/crop-trials.html", icon: "🧬" }
        ]
      },
      {
        label: "Add Records", icon: "➕",
        children: [
          { label: "Planting",        href: "crop-production/crop-planting.html",   icon: "🌱" },
          { label: "Spraying",        href: "crop-production/crop-spraying.html",   icon: "💦" },
          { label: "Aerial Spraying", href: "crop-production/crop-aerial.html",     icon: "🚁" },
          { label: "Fertilizer",      href: "crop-production/crop-fertilizer.html", icon: "🧪" },
          { label: "Harvest",         href: "crop-production/crop-harvest.html",    icon: "🌾" },
          { label: "Scouting",        href: "crop-production/crop-scouting.html",   icon: "🔎" },
          { label: "Field Repairs",   href: "field-maintenance/field-maintenance.html", icon: "🛠️" }
        ]
      }
    ]
  },

  {
    label: "Grain Tracking",
    icon: "🌾",
    children: [
      { label: "Grain Bin Inventory", href: "grain-tracking/grain-bins.html",        icon: "🛢️" },
      { label: "Grain Bags",          href: "grain-tracking/grain-bags.html",        icon: "👝" },
      { label: "Grain Contracts",     href: "grain-tracking/grain-contracts.html",   icon: "📜" },
      { label: "Add Grain Tickets",   href: "grain-tracking/grain-ticket-ocr.html",  icon: "🎫" }
    ]
  },

  {
    label: "Equipment",
    icon: "🚜",
    children: [
      { label: "View / Reports", href: "equipment/",                            icon: "📊" },
      { label: "Add Equipment",  href: "equipment/equipment-implements.html",   icon: "➕" }, /* placeholder */
      { label: "StarFire / Tech",href: "equipment/equipment-starfire.html",     icon: "🛰️" },
      { label: "Tractors",       href: "equipment/equipment-tractors.html",     icon: "🚜" },
      { label: "Combines",       href: "equipment/equipment-combines.html",     icon: "🌽" },
      { label: "Sprayers",       href: "equipment/equipment-sprayers.html",     icon: "💦" },
      { label: "Implements",     href: "equipment/equipment-implements.html",   icon: "⚙️" },
      { label: "Construction",   href: "equipment/equipment-construction.html", icon: "🏗️" },
      { label: "Trucks",         href: "equipment/equipment-trucks.html",       icon: "🚛" },
      { label: "Trailers",       href: "equipment/equipment-trailers.html",     icon: "🚚" }
    ]
  },

  {
    label: "Calculators",
    icon: "🔢",
    children: [
      { label: "Combine Yield", href: "calculators/calc-combine-yield.html", icon: "🌽" },
      { label: "Trial Yields",  href: "calculators/calc-trial-yields.html",  icon: "🧬" },
      { label: "Area",          href: "calculators/calc-area.html",          icon: "📐" },
      { label: "Grain Bin",     href: "calculators/calc-grain-bin.html",     icon: "🛢️" },
      { label: "Chemical Mix",  href: "calculators/calc-chemical-mix.html",  icon: "🧪" },
      { label: "Grain Shrink",  href: "calculators/calc-grain-shrink.html",  icon: "📉" }
    ]
  },

  {
    label: "Teams & Partners",
    icon: "🫱🏼‍🫲🏽",
    children: [
      { label: "Dictionary",         href: "teams-partners/teams-dictionary.html",      icon: "🗂️" },
      { label: "Add Employees",      href: "teams-partners/teams-employees.html",       icon: "👥" },
      { label: "Add Subcontractors", href: "teams-partners/teams-sub-contractors.html", icon: "🧰" },
      { label: "Add Vendors",        href: "teams-partners/teams-vendors.html",         icon: "🏭" }
    ]
  },

  {
    label: "Setup",
    icon: "🛠️",
    children: [
      { label: "Farms",         href: "setup/ss-farms.html",       icon: "🏡" },
      { label: "Fields",        href: "setup/ss-fields.html",      icon: "🗺️" },
      { label: "Equipment Make", href: "equipment/equipment-implements.html", icon: "🏭" }, /* placeholder */
      { label: "Equipment Model",href: "equipment/equipment-implements.html", icon: "📑" }, /* placeholder */
      { label: "Crop Types",    href: "setup/ss-crop-types.html",  icon: "🌾" },
      {
        label: "Products", icon: "📦",
        children: [
          { label: "Seed",        href: "setup/products/products-seed.html",        icon: "🌽" },
          { label: "Chemical",    href: "setup/products/products-chemical.html",    icon: "🧪" },
          { label: "Fertilizer",  href: "setup/products/products-fertilizer.html",  icon: "🧂" },
          { label: "Grain Bags",  href: "setup/products/products-grain-bags.html",  icon: "👝" }
        ]
      },
      { label: "Account Roles",  href: "setup/ss-roles.html",       icon: "🛡️" }
    ]
  },

  {
    label: "Settings",
    icon: "⚙️",
    children: [
      { label: "Account Details",href: "settings/account-details.html", icon: "👤" },
      { label: "Theme",          href: "settings/settings-theme.html",       icon: "🌗" },
      { label: "Check for Updates", href: "settings/index.html#check-updates", icon: "🔄" }
    ]
  },

  /* ✅ NEW: Feedback in the drawer */
  {
    label: "Feedback",
    icon: "💬",
    children: [
      { label: "Ideas",        href: "feedback/fb-ideas.html", icon: "💡" },
      { label: "Bugs / Issues",href: "feedback/fb-bugs.html",  icon: "🐞" }
    ]
  }
];