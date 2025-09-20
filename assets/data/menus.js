/* Dowson Farms — Global Navigation (ordered)
   This is the single source of truth for menus + submenus + emojis.
   Pages should READ from this, never hardcode.
*/

window.DF_MENUS = {
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
        { label: "Field Maintenance", href: "crop-production/maintenance.html", iconEmoji: "🛠️" },
        { label: "Trials",            href: "crop-production/trials.html",      iconEmoji: "🧬" }
      ]
    },
    {
      label: "Field Maintenance",
      href: "crop-production/maintenance.html",
      iconEmoji: "🛠️",
      children: []
    },
    {
      label: "Grain Tracking",
      href: "grain/index.html",
      iconEmoji: "🌾",
      children: [
        { label: "Grain Bags",         href: "grain/bags.html",        iconEmoji: "👝" },
        { label: "Grain Bins",         href: "grain/bins.html",        iconEmoji: "🛢️" },
        { label: "Grain Contracts",    href: "grain/contracts.html",   iconEmoji: "🧾" },
        { label: "Grain Ticket (OCR)", href: "grain/ticket-ocr.html",  iconEmoji: "🎫" }
      ]
    },
    {
      label: "Equipment",
      href: "equip/index.html",
      iconEmoji: "🚜",
      children: [
        { label: "Starfire / Tech", href: "equip/starfire.html",     iconEmoji: "🛰️" },
        { label: "Tractors",        href: "equip/tractors.html",     iconEmoji: "🚜" },
        { label: "Combines",        href: "equip/combines.html",     iconEmoji: "🌽" },
        { label: "Sprayers",        href: "equip/sprayers.html",     iconEmoji: "💦" },
        { label: "Implements",      href: "equip/implements.html",   iconEmoji: "⚙️" },
        { label: "Construction",    href: "equip/construction.html", iconEmoji: "🏗️" },
        { label: "Trucks",          href: "equip/trucks.html",       iconEmoji: "🚛" },
        { label: "Trailers",        href: "equip/trailers.html",     iconEmoji: "🚚" }
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
      href: "team/index.html",
      iconEmoji: "🫱🏼‍🫲🏽",
      children: [
        { label: "Employees",       href: "team/employees.html",       iconEmoji: "👥" },
        { label: "Sub-Contractors", href: "team/sub-contractors.html", iconEmoji: "🧰" },
        { label: "Vendors",         href: "team/vendors.html",         iconEmoji: "🏭" },
        { label: "Dictionary",      href: "team/dictionary.html",      iconEmoji: "🗂️" }
      ]
    },
    {
      label: "Reports",
      href: "reports/index.html",
      iconEmoji: "📖",
      children: [
        { label: "Pre-Defined", href: "reports/predefined.html", iconEmoji: "📁" },
        { label: "AI Reports",  href: "reports/ai.html",         iconEmoji: "🤖" },
        { label: "History",     href: "reports/ai-history.html", iconEmoji: "🕘" }
      ]
    },
    {
      label: "Settings",
      href: "settings/index.html",
      iconEmoji: "⚙️",
      children: [
        { label: "Farms",      href: "settings/farms.html",      iconEmoji: "🏡" },
        { label: "Fields",     href: "settings/fields.html",     iconEmoji: "🗺️" },
        { label: "Crop Types", href: "settings/crop-types.html", iconEmoji: "🌾" },
        { label: "Theme",      href: "settings/theme.html",      iconEmoji: "🌗" },
        { label: "Roles",      href: "settings/roles.html",      iconEmoji: "🛡️" },
        {
          label: "Products",
          href: "settings/products/index.html",
          iconEmoji: "📦",
          children: [
            { label: "Seed",        href: "settings/products/seed.html",        iconEmoji: "🌽" },
            { label: "Fertilizer",  href: "settings/products/fertilizer.html",  iconEmoji: "🧂" },
            { label: "Chemical",    href: "settings/products/chemical.html",    iconEmoji: "👨🏼‍🔬" },
            { label: "Grain Bags",  href: "settings/products/grain-bags.html",  iconEmoji: "🛄" }
          ]
        }
      ]
    },
    {
      label: "Feedback",
      href: "feedback/index.html",
      iconEmoji: "💡",
      children: [
        { label: "Ideas", href: "feedback/ideas.html", iconEmoji: "💡" },
        { label: "Bugs",  href: "feedback/bugs.html",  iconEmoji: "🐞" }
      ]
    }
  ]
};