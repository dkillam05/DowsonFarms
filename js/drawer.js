<script type="module">
// Drawer: accordion side menu with nested groups + emojis

// --------- small helpers
const ROOT =
  document.querySelector('base')?.getAttribute('href') ||
  (location.pathname.includes('/DowsonFarms/') ? '/DowsonFarms/' : '/');

const R = (p) => (p.startsWith('http') ? p : ROOT + p.replace(/^\/+/, ''));

const LS_OPEN = 'df_drawer_open_v2';

// restore/save open state
const getOpen = () => new Set(JSON.parse(localStorage.getItem(LS_OPEN) || '[]'));
const setOpen = (s) => localStorage.setItem(LS_OPEN, JSON.stringify([...s]));

// --------- DATA (links are site-root relative)
const MENU = [
  {
    key: 'cp',
    label: 'Crop Production',
    icon: '🌽',
    groups: [
      {
        key: 'cp-vr',
        label: 'Views / Reports',
        icon: '📊',
        items: [
          { label: 'Field Trials', icon: '🧬', href: 'crop-production/crop-trials.html' },
        ],
      },
      {
        key: 'cp-add',
        label: 'Add Records',
        icon: '➕',
        items: [
          { label: 'Planting',        icon: '🌱', href: 'crop-production/crop-planting.html' },
          { label: 'Spraying',        icon: '💦', href: 'crop-production/crop-spraying.html' },
          { label: 'Aerial Spraying', icon: '🚁', href: 'crop-production/crop-aerial.html' },
          { label: 'Fertilizer',      icon: '🧪', href: 'crop-production/crop-fertilizer.html' },
          { label: 'Harvest',         icon: '🌾', href: 'crop-production/crop-harvest.html' },
          { label: 'Scouting',        icon: '🔎', href: 'crop-production/crop-scouting.html' },
          { label: 'Field Repairs',   icon: '🛠️', href: 'crop-production/crop-maintenance.html' },
          { label: 'Field Trials',    icon: '🧬', href: 'crop-production/crop-trials.html' },
        ],
      },
    ],
  },

  {
    key: 'grain',
    label: 'Grain Tracking',
    icon: '🌾',
    groups: [
      {
        key: 'grain-main',
        label: 'Inventory & Tickets',
        icon: '📦',
        items: [
          { label: 'Grain Bin Inventory', icon: '🛢️', href: 'grain-tracking/grain-bins.html' },
          { label: 'Grain Bags',          icon: '👝', href: 'grain-tracking/grain-bags.html' },
          { label: 'Grain Contracts',     icon: '🧾', href: 'grain-tracking/grain-contracts.html' },
          { label: 'Add Grain Tickets',   icon: '🎫', href: 'grain-tracking/grain-ticket-ocr.html' },
        ],
      },
    ],
  },

  {
    key: 'equip',
    label: 'Equipment',
    icon: '🚜',
    groups: [
      {
        key: 'equip-vr',
        label: 'Views / Reports',
        icon: '📊',
        items: [
          { label: 'All Equipment', icon: '🗂️', href: 'equipment/' },
        ],
      },
      {
        key: 'equip-add',
        label: 'Add Equipment',
        icon: '➕',
        items: [
          { label: 'StarFire / Tech', icon: '🛰️', href: 'equipment/equipment-starfire.html' },
          { label: 'Tractors',        icon: '🚜', href: 'equipment/equipment-tractors.html' },
          { label: 'Combines',        icon: '🌽', href: 'equipment/equipment-combines.html' },
          { label: 'Sprayers',        icon: '💦', href: 'equipment/equipment-sprayers.html' },
          { label: 'Implements',      icon: '⚙️', href: 'equipment/equipment-implements.html' },
          { label: 'Construction',    icon: '🏗️', href: 'equipment/equipment-construction.html' },
          { label: 'Trucks',          icon: '🚛', href: 'equipment/equipment-trucks.html' },
          { label: 'Trailers',        icon: '🚚', href: 'equipment/equipment-trailers.html' },
        ],
      },
    ],
  },

  {
    key: 'calcs',
    label: 'Calculators',
    icon: '🔢',
    groups: [
      {
        key: 'calcs-all',
        label: 'All Calculators',
        icon: '🧮',
        items: [
          { label: 'Combine Yield', icon: '🌽', href: 'calculators/calc-combine-yield.html' },
          { label: 'Trial Yields',  icon: '🧬', href: 'calculators/calc-trial-yields.html' },
          { label: 'Area',          icon: '📐', href: 'calculators/calc-area.html' },
          { label: 'Grain Bin',     icon: '🛢️', href: 'calculators/calc-grain-bin.html' },
          { label: 'Chemical Mix',  icon: '🧪', href: 'calculators/calc-chemical-mix.html' },
          { label: 'Grain Shrink',  icon: '📉', href: 'calculators/calc-grain-shrink.html' },
        ],
      },
    ],
  },

  {
    key: 'teams',
    label: 'Teams & Partners',
    icon: '🫱🏼‍🫲🏽',
    groups: [
      {
        key: 'teams-dict',
        label: 'Dictionary',
        icon: '🗂️',
        items: [
          { label: 'Shared Terms', icon: '📘', href: 'teams-partners/teams-dictionary.html' },
        ],
      },
      {
        key: 'teams-add',
        label: 'Add Records',
        icon: '➕',
        items: [
          { label: 'Employees',      icon: '👥', href: 'teams-partners/teams-employees.html' },
          { label: 'Sub-Contractors',icon: '🧰', href: 'teams-partners/teams-sub-contractors.html' },
          { label: 'Vendors',        icon: '🏭', href: 'teams-partners/teams-vendors.html' },
        ],
      },
    ],
  },

  {
    key: 'setup',
    label: 'Setup / Settings',
    icon: '⚙️',
    groups: [
      {
        key: 'setup-core',
        label: 'Core Data',
        icon: '🧱',
        items: [
          { label: 'Farms',           icon: '🏡', href: 'settings-setup/ss-farms.html' },
          { label: 'Fields',          icon: '🗺️', href: 'settings-setup/ss-fields.html' },
          { label: 'Equipment Make',  icon: '🏷️', href: 'settings-setup/products/products-make.html' },
          { label: 'Equipment Model', icon: '🏷️', href: 'settings-setup/products/products-model.html' },
          { label: 'Crop Types',      icon: '🌾', href: 'settings-setup/ss-crop-types.html' },
        ],
      },
      {
        key: 'setup-products',
        label: 'Products',
        icon: '📦',
        items: [
          { label: 'Seed',        icon: '🌽', href: 'settings-setup/products/products-seed.html' },
          { label: 'Chemical',    icon: '👨🏼‍🔬', href: 'settings-setup/products/products-chemical.html' },
          { label: 'Fertilizer',  icon: '🧂', href: 'settings-setup/products/products-fertilizer.html' },
          { label: 'Grain Bags',  icon: '🛄', href: 'settings-setup/products/products-grain-bags.html' },
        ],
      },
      {
        key: 'setup-admin',
        label: 'Admin',
        icon: '🛡️',
        items: [
          { label: 'Account Roles',   icon: '🛡️', href: 'settings-setup/ss-roles.html' },
          { label: 'Theme',           icon: '🌗', href: 'settings-setup/ss-theme.html' },
          { label: 'Check for Updates', icon: '🔄', href: 'settings-setup/index.html#check-updates' },
        ],
      },
    ],
  },

  {
    key: 'account',
    label: 'Account Details',
    icon: '👤',
    groups: [
      {
        key: 'acct-main',
        label: 'Profile & Updates',
        icon: '⚙️',
        items: [
          { label: 'Current Login Info', icon: '🔐', href: 'auth/' },
          { label: 'Theme',              icon: '🌗', href: 'settings-setup/ss-theme.html' },
          { label: 'Check for Updates',  icon: '🔄', href: 'settings-setup/index.html#check-updates' },
        ],
      },
    ],
  },

  // quick links (single)
  { key: 'reports', label: 'Reports', icon: '📖', href: 'reports/' },
  { key: 'feedback', label: 'Feedback', icon: '💬', href: 'feedback/' },
];

// --------- render
function makeEl(tag, cls, html) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (html != null) el.innerHTML = html;
  return el;
}

function renderDrawer() {
  const holder = document.getElementById('drawer');
  if (!holder) return;

  // header brand is already in the HTML; build the nav body:
  const nav = holder.querySelector('nav') || holder.appendChild(document.createElement('nav'));
  nav.innerHTML = '';

  const open = getOpen();

  MENU.forEach((section) => {
    // simple link section
    if (section.href) {
      const a = makeEl('a');
      a.href = R(section.href);
      a.innerHTML = `<span>${section.icon || '•'}</span> ${section.label}`;
      nav.appendChild(a);
      return;
    }

    // accordion section
    const sec = makeEl('div', 'acc-section');
    const btn = makeEl('button', 'acc-head');
    btn.type = 'button';
    btn.setAttribute('aria-expanded', open.has(section.key) ? 'true' : 'false');
    btn.innerHTML = `<span class="icn">${section.icon || '•'}</span><span class="label">${section.label}</span><span class="chev">▾</span>`;
    sec.appendChild(btn);

    const body = makeEl('div', 'acc-body');
    if (!open.has(section.key)) body.style.height = '0px';

    // groups
    (section.groups || []).forEach((group) => {
      const g = makeEl('div', 'acc-group');

      const gBtn = makeEl('button', 'acc-subhead');
      const gOpen = open.has(group.key);
      gBtn.type = 'button';
      gBtn.setAttribute('aria-expanded', gOpen ? 'true' : 'false');
      gBtn.innerHTML = `<span class="icn">${group.icon || '•'}</span><span class="label">${group.label}</span><span class="chev">▾</span>`;
      g.appendChild(gBtn);

      const gBody = makeEl('div', 'acc-subbody');
      if (!gOpen) gBody.style.height = '0px';

      (group.items || []).forEach((it) => {
        const a = makeEl('a', 'acc-link');
        a.href = R(it.href);
        a.innerHTML = `<span class="icn">${it.icon || '•'}</span><span>${it.label}</span>`;
        gBody.appendChild(a);
      });

      g.appendChild(gBody);
      body.appendChild(g);

      // group toggle
      gBtn.addEventListener('click', () => {
        const expanded = gBtn.getAttribute('aria-expanded') === 'true';
        gBtn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        if (expanded) {
          gBody.style.height = `${gBody.scrollHeight}px`; // force current height
          requestAnimationFrame(() => (gBody.style.height = '0px'));
          open.delete(group.key);
        } else {
          gBody.style.height = `${gBody.scrollHeight}px`;
          open.add(group.key);
        }
        setOpen(open);
      });
    });

    nav.appendChild(sec);

    // section toggle
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      if (expanded) {
        body.style.height = `${body.scrollHeight}px`;
        requestAnimationFrame(() => (body.style.height = '0px'));
        open.delete(section.key);
      } else {
        body.style.height = `${body.scrollHeight}px`;
        open.add(section.key);
      }
      setOpen(open);
    });

    sec.appendChild(body);
  });
}

// open/close wiring for drawer shell
function wireShell() {
  const drawer = document.getElementById('drawer');
  const backdrop = document.getElementById('drawerBackdrop');
  const openBtn = document.getElementById('drawerOpen');
  const closeBtn = document.getElementById('drawerClose');

  const open = () => { drawer.classList.add('open'); backdrop.classList.add('show'); };
  const close = () => { drawer.classList.remove('open'); backdrop.classList.remove('show'); };

  openBtn?.addEventListener('click', open);
  closeBtn?.addEventListener('click', close);
  backdrop?.addEventListener('click', close);
}

document.addEventListener('DOMContentLoaded', () => {
  wireShell();
  renderDrawer();
});
</script>