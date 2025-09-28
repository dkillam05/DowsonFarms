<!-- assets/data/menus.js -->
<script>
/* Dowson Farms — Global Navigation (one source of truth) */
const DF_MENUS = {
  tiles: [
    {
      label: "Crop Production",
      href: "crop-production/index.html",
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
    { label: "Field Maintenance", href: "crop-production/crop-maintenance.html", iconEmoji: "🛠️", children: [] },
    {
      label: "Grain Tracking",
      href: "grain-tracking/index.html",
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
      href: "equipment/index.html",
      iconEmoji: "🚜",
      children: [
        { label: "Starfire / Technology", href: "equipment/equipment-starfire.html",     iconEmoji: "🛰️" },
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
      href: "calculators/index.html",
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
      href: "teams-partners/index.html",
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
      href: "reports/index.html",
      iconEmoji: "📖",
      children: [
        { label: "Pre-Defined Reports", href: "reports/reports-predefined.html",  iconEmoji: "📁" },
        { label: "AI Reports",          href: "reports/reports-ai.html",          iconEmoji: "🤖" },
        { label: "AI Report History",   href: "reports/reports-ai-history.html",  iconEmoji: "🕘" }
      ]
    },
    {
      label: "Setup / Settings",
      href: "settings-setup/index.html",
      iconEmoji: "⚙️",
      children: [
        { label: "Farms",         href: "settings-setup/ss-farms.html",        iconEmoji: "🏡" },
        { label: "Fields",        href: "settings-setup/ss-fields.html",       iconEmoji: "🗺️" },
        { label: "Crop Types",    href: "settings-setup/ss-crop-types.html",   iconEmoji: "🌾" },
        { label: "Theme",         href: "settings-setup/ss-theme.html",        iconEmoji: "🌗" },
        { label: "Account Roles", href: "settings-setup/ss-roles.html",        iconEmoji: "🛡️" },
        { label: "Check for Updates", href: "settings-setup/index.html#check-updates", iconEmoji: "🔄" },
        {
          label: "Products", href: "settings-setup/products/index.html", iconEmoji: "📦",
          children: [
            { label: "Seed",        href: "settings-setup/products/products-seed.html",        iconEmoji: "🌽" },
            { label: "Fertilizer",  href: "settings-setup/products/products-fertilizer.html",  iconEmoji: "🧂" },
            { label: "Chemical",    href: "settings-setup/products/products-chemical.html",    iconEmoji: "👨🏼‍🔬" },
            { label: "Grain Bags",  href: "settings-setup/products/products-grain-bags.html",  iconEmoji: "🛄" }
          ]
        }
      ]
    },
    {
      label: "Feedback",
      href: "feedback/index.html",
      iconEmoji: "💬",
      children: [
        { label: "Ideas",         href: "feedback/fb-ideas.html", iconEmoji: "💡" },
        { label: "Bugs / Issues", href: "feedback/fb-bugs.html",  iconEmoji: "🐞" }
      ]
    }
  ]
};

window.DF_MENUS = DF_MENUS;
</script>