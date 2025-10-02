/* Global Drawer (uses window.DF_DRAWER_MENUS exactly as you posted) */

(function () {
  if (window.__DF_DRAWER_MOUNTED__) return;
  window.__DF_DRAWER_MOUNTED__ = true;

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const SECTIONS = Array.isArray(window.DF_DRAWER_MENUS) ? window.DF_DRAWER_MENUS : [];

  function ensureHamburger() {
    const header = $('.app-header');
    if (!header || $('#dfHamburger')) return;
    const left = header.querySelector('.app-header__left') || header.firstElementChild || header;
    const btn  = document.createElement('button');
    btn.id = 'dfHamburger';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Open menu');
    btn.style.marginRight = '10px';
    btn.style.border = '0';
    btn.style.background = 'transparent';
    btn.style.fontSize = '22px';
    btn.style.cursor = 'pointer';
    btn.textContent = '☰';
    btn.addEventListener('click', toggleDrawer);
    left.prepend(btn);
  }

  function buildDrawer() {
    if ($('#dfDrawer')) return;

    const wrap = document.createElement('div');
    wrap.id = 'dfDrawerRoot';
    wrap.innerHTML = `
      <div id="dfDrawerBackdrop" class="drawer-backdrop" hidden></div>
      <aside id="dfDrawer" class="drawer" aria-label="Side menu" aria-hidden="true">
        <div class="brand">
          <img src="/DowsonFarms/assets/icons/icon-192.png" alt="Dowson Farms" />
          <div>
            <div class="brand-title">Dowson Farms</div>
            <div class="brand-sub mono" id="farmSub">All systems operational</div>
          </div>
        </div>
        <nav class="drawer-nav"></nav>
      </aside>
    `;
    document.body.appendChild(wrap);

    $('#dfDrawerBackdrop').addEventListener('click', closeDrawer);

    const nav = $('.drawer-nav', wrap);

    // Build one accordion per section
    SECTIONS.forEach(section => {
      const sec = document.createElement('div');
      sec.className = 'drawer-sec';

      const acc = document.createElement('button');
      acc.className = 'drawer-acc';
      acc.type = 'button';
      acc.innerHTML = `<span class="emoji">${section.icon || ''}</span>${section.label}<span class="caret">›</span>`;
      sec.appendChild(acc);

      const panel = document.createElement('div');
      panel.className = 'panel';

      // In your data, items with href:"#"" are **sub-headers**
      let currentGroup = null;
      (section.children || []).forEach(item => {
        if (item && item.href === '#') {
          currentGroup = document.createElement('div');
          currentGroup.className = 'drawer-subtitle';
          currentGroup.textContent = item.label;
          panel.appendChild(currentGroup);
          return;
        }
        const a = document.createElement('a');
        a.className = 'drawer-link';
        a.href = item.href;
        a.innerHTML = `<span>${item.icon || ''}</span> ${item.label}`;
        panel.appendChild(a);
      });

      nav.appendChild(sec);
      nav.appendChild(panel);

      acc.addEventListener('click', () => {
        const open = acc.classList.toggle('open');
        panel.style.maxHeight = open ? panel.scrollHeight + 'px' : '0px';
      });
    });

    // Start collapsed
    $$('.panel', wrap).forEach(p => (p.style.maxHeight = '0px'));
  }

  function openDrawer() {
    $('#dfDrawer')?.setAttribute('aria-hidden', 'false');
    const b = $('#dfDrawerBackdrop'); if (b) b.hidden = false;
    document.documentElement.classList.add('drawer-open');
  }
  function closeDrawer() {
    $('#dfDrawer')?.setAttribute('aria-hidden', 'true');
    const b = $('#dfDrawerBackdrop'); if (b) b.hidden = true;
    document.documentElement.classList.remove('drawer-open');
  }
  function toggleDrawer() {
    const isHidden = $('#dfDrawer')?.getAttribute('aria-hidden') !== 'false';
    isHidden ? openDrawer() : closeDrawer();
  }

  document.addEventListener('DOMContentLoaded', () => {
    ensureHamburger();
    buildDrawer();
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });
  });
})();