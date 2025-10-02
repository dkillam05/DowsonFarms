// Dowson Farms — Drawer (accordion + sticky footer)
// Uses: assets/data/drawer-menus.js (window.DF_DRAWER_MENUS)
// Respects: window.DF_ACCESS.canView if available
// Shows: small Logout row + version block pinned at drawer bottom

(function () {
  // ----- helpers ------------------------------------------------------------
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const canView = (href) => {
    if (!href) return true;
    const A = window.DF_ACCESS;
    return (A && typeof A.canView === "function") ? A.canView(href) : true;
  };

  // Ensure the shell exists (some pages already include it; if not, create it)
  let drawer = $("#drawer");
  if (!drawer) {
    drawer = document.createElement("div");
    drawer.id = "drawer";
    drawer.className = "drawer";
    drawer.innerHTML = `<div class="brand">
      <img src="assets/icons/icon-192.png" alt="">
      <div>
        <div style="font-weight:700">Dowson Farms Divernon Illinois</div>
        //<div class="mono" id="farmSub">Divernon Illinois</div>
      </div>
    </div>
    <nav></nav>`;
    document.body.appendChild(drawer);
  }

  let backdrop = $("#drawerBackdrop");
  if (!backdrop) {
    backdrop = document.createElement("div");
    backdrop.id = "drawerBackdrop";
    backdrop.className = "drawerBackdrop";
    document.body.appendChild(backdrop);
  }

  // Make sure the drawer is above footer
  drawer.style.zIndex   = "200";
  backdrop.style.zIndex = "190";

  // Re-wrap content so we can pin a footer at the bottom
  (function ensureInnerLayout(){
    if (drawer.querySelector(".drawer__inner")) return;
    const brand = drawer.querySelector(".brand");
    const nav   = drawer.querySelector("nav") || document.createElement("nav");

    const inner = document.createElement("div");
    inner.className = "drawer__inner";
    // flex layout without touching your drawer.css
    inner.style.display = "flex";
    inner.style.flexDirection = "column";
    inner.style.height = "100%";

    const navWrap = document.createElement("div");
    navWrap.className = "drawer__scroll";
    navWrap.style.flex = "1";
    navWrap.style.overflow = "auto";

    navWrap.appendChild(nav);
    inner.appendChild(brand);
    inner.appendChild(navWrap);

    // footer container (sticky visuals kept minimal)
    const foot = document.createElement("div");
    foot.className = "drawer__footer";
    foot.style.borderTop = "1px solid rgba(0,0,0,.08)";
    foot.style.background = "#fbfbfa";
    foot.style.padding = "10px 12px";
    foot.style.position = "relative";
    foot.style.zIndex = "1";

    // small logout row that matches menu items
    const logout = document.createElement("a");
    logout.href = "#";
    logout.className = "item";
    logout.style.display = "flex";
    logout.style.alignItems = "center";
    logout.style.gap = "12px";
    logout.style.padding = "12px 14px";
    logout.style.textDecoration = "none";
    logout.style.color = "#223";
    logout.style.background = "#fff";
    logout.style.border = "1px solid rgba(0,0,0,.08)";
    logout.style.borderRadius = "12px";
    logout.innerHTML = `<span class="icon" style="width:20px">↩️</span> Logout`;
    logout.addEventListener("click", (e) => {
      e.preventDefault();
      // sign out if Firebase auth is on the page
      const trySignOut = async () => {
        try {
          if (window.firebaseAuth && window.firebaseAuth.signOut) {
            await window.firebaseAuth.signOut();
          } else if (window.firebase && firebase.auth) {
            await firebase.auth().signOut();
          }
        } catch (err) {
          console.warn("logout error", err);
        } finally {
          location.href = "auth/";
        }
      };
      trySignOut();
    });

    // brand+version block
    const about = document.createElement("div");
    about.style.display = "flex";
    about.style.alignItems = "center";
    about.style.gap = "10px";
    about.style.marginTop = "10px";
    about.innerHTML = `
      <img src="assets/icons/icon-192.png" alt="" style="width:28px;height:28px;border-radius:6px">
      <div>
        <div style="font-weight:700">Dowson Farms</div>
        <div class="mono" style="color:#456">All systems operational</div>
        <div class="mono" id="dfDrawerVersion" style="color:#456;margin-top:2px">App v0.0.0</div>
      </div>
    `;

    foot.appendChild(logout);
    foot.appendChild(about);
    inner.appendChild(foot);

    // replace drawer content
    drawer.innerHTML = "";
    drawer.appendChild(inner);
  })();

  const nav = $("#drawer nav");
  if (!nav) return;

  // ----- open/close wiring ---------------------------------------------------
  const openDrawer = () => document.body.classList.add("drawer-open");
  const closeDrawer = () => document.body.classList.remove("drawer-open");

  const toggleBtn = $("#drawerToggle");
  if (toggleBtn) toggleBtn.addEventListener("click", openDrawer);
  backdrop.addEventListener("click", (e) => { if (e.target === backdrop) closeDrawer(); });
  window.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDrawer(); });

  // ----- render accordion ----------------------------------------------------
  function renderMenu() {
    const data = Array.isArray(window.DF_DRAWER_MENUS) ? window.DF_DRAWER_MENUS : [];
    nav.innerHTML = "";

    data.forEach(group => {
      // filter children by access (but keep the group if anything remains)
      const children = (group.children || []).filter(ch => {
        if (Array.isArray(ch.children)) {
          ch.children = ch.children.filter(l => canView(l.href));
          return ch.children.length > 0;
        }
        return canView(ch.href);
      });

      if (!children.length) return;

      const g = document.createElement("div");
      g.className = "group";
      g.setAttribute("aria-expanded", "false");

      const btn = document.createElement("button");
      btn.innerHTML = `<span class="icon">${group.icon || ""}</span>${group.label}<span class="chev">›</span>`;
      btn.addEventListener("click", () => {
        const isOpen = g.getAttribute("aria-expanded") === "true";
        // collapse others
        $$(".group[aria-expanded='true']", nav).forEach(x => x.setAttribute("aria-expanded", "false"));
        g.setAttribute("aria-expanded", isOpen ? "false" : "true");
      });
      g.appendChild(btn);

      const panel = document.createElement("div");
      panel.className = "panel";

      children.forEach(item => {
        if (Array.isArray(item.children) && item.children.length) {
          const sg = document.createElement("div");
          sg.className = "subgroup";
          sg.setAttribute("aria-expanded", "false");

          const sbtn = document.createElement("button");
          sbtn.innerHTML = `<span class="icon">${item.icon || ""}</span>${item.label}<span class="chev">›</span>`;
          sbtn.addEventListener("click", () => {
            const open = sg.getAttribute("aria-expanded") === "true";
            $$(".subgroup[aria-expanded='true']", panel).forEach(x => x.setAttribute("aria-expanded", "false"));
            sg.setAttribute("aria-expanded", open ? "false" : "true");
          });
          sg.appendChild(sbtn);

          const subpanel = document.createElement("div");
          subpanel.className = "subpanel";
          item.children.forEach(link => {
            const a = document.createElement("a");
            a.className = "item";
            a.href = link.href || "#";
            a.innerHTML = `<span class="icon">${link.icon || ""}</span>${link.label}`;
            a.addEventListener("click", closeDrawer);
            subpanel.appendChild(a);
          });
          sg.appendChild(subpanel);
          panel.appendChild(sg);
        } else {
          const a = document.createElement("a");
          a.className = "item";
          a.href = item.href || "#";
          a.innerHTML = `<span class="icon">${item.icon || ""}</span>${item.label}`;
          a.addEventListener("click", closeDrawer);
          panel.appendChild(a);
        }
      });

      g.appendChild(panel);
      nav.appendChild(g);
    });

    // version text
    const ver =
      (window.DF_VERSION && window.DF_VERSION.version) ||
      (window.APP_VERSION) ||
      "v0.0.0";
    const vEl = $("#dfDrawerVersion");
    if (vEl) vEl.textContent = `App ${ver}`;
  }

  // initial render (immediately)
  renderMenu();

  // re-render once DF_ACCESS arrives (so filtering applies after auth)
  // If DF_ACCESS is assigned later, listen for it
  let retries = 10;
  const waitAccess = setInterval(() => {
    if (window.DF_ACCESS || --retries <= 0) {
      clearInterval(waitAccess);
      try { renderMenu(); } catch (e) { /* noop */ }
    }
  }, 300);

})();