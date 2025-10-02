// Dowson Farms — Drawer (accordion) with bottom footer + logout
// Uses: window.DF_DRAWER_MENUS, optional window.DF_ACCESS.canView, window.DF_VERSION
// Requires: assets/css/drawer.css for visuals

(function () {
  const $ = (s, r = document) => r.querySelector(s);

  // -------- Ensure shell elements exist (no top brand) --------
  let drawer = $("#drawer");
  if (!drawer) {
    drawer = document.createElement("div");
    drawer.id = "drawer";
    drawer.className = "drawer";
    document.body.appendChild(drawer);
  }
  let backdrop = $("#drawerBackdrop");
  if (!backdrop) {
    backdrop = document.createElement("div");
    backdrop.id = "drawerBackdrop";
    backdrop.className = "drawerBackdrop";
    document.body.appendChild(backdrop);
  }

  // main nav + bottom footer containers
  let main = drawer.querySelector("nav.drawer-main");
  if (!main) {
    main = document.createElement("nav");
    main.className = "drawer-main";
    drawer.appendChild(main);
  }
  let bottom = drawer.querySelector(".drawer-bottom");
  if (!bottom) {
    bottom = document.createElement("div");
    bottom.className = "drawer-bottom";
    drawer.appendChild(bottom);
  }

  // -------- open/close wiring (delegated burger) --------
  function openDrawer() {
    document.body.classList.add("drawer-open");
    drawer.style.zIndex = "1000";
    backdrop.style.zIndex = "990";
  }
  function closeDrawer() {
    document.body.classList.remove("drawer-open");
  }
  document.addEventListener("click", (e) => {
    const t = e.target.closest("#drawerToggle");
    if (t) {
      e.preventDefault();
      openDrawer();
    }
  });
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) closeDrawer();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDrawer();
  });

  // -------- permission helper --------
  function canView(href) {
    try {
      if (!href) return true;
      if (window.DF_ACCESS && typeof window.DF_ACCESS.canView === "function") {
        const ok = window.DF_ACCESS.canView(href);
        if (ok) return true;
        return (window.DF_ACCESS.roleKeys || []).includes("__builder__");
      }
    } catch {}
    return true; // permissive if access not ready yet
  }

  // -------- build main accordion --------
  function buildMain() {
    const data = Array.isArray(window.DF_DRAWER_MENUS)
      ? window.DF_DRAWER_MENUS
      : [];
    main.innerHTML = "";

    data.forEach((group) => {
      const hasVisible =
        (group.children || []).some((it) =>
          it.children
            ? it.children.some((g) => canView(g.href))
            : canView(it.href)
        ) || canView(group.href || "");

      if (!hasVisible) return;

      const g = document.createElement("div");
      g.className = "group";
      g.setAttribute("aria-expanded", "false");

      const btn = document.createElement("button");
      btn.innerHTML = `<span class="icon">${group.icon || ""}</span>${
        group.label
      }<span class="chev">›</span>`;
      btn.addEventListener("click", () => {
        const isOpen = g.getAttribute("aria-expanded") === "true";
        main
          .querySelectorAll('.group[aria-expanded="true"]')
          .forEach((x) => x.setAttribute("aria-expanded", "false"));
        g.setAttribute("aria-expanded", isOpen ? "false" : "true");
      });
      g.appendChild(btn);

      const panel = document.createElement("div");
      panel.className = "panel";

      (group.children || []).forEach((item) => {
        const visible =
          (item.children &&
            item.children.some((ch) => canView(ch.href))) ||
          canView(item.href);
        if (!visible) return;

        if (Array.isArray(item.children) && item.children.length) {
          const sg = document.createElement("div");
          sg.className = "subgroup";
          sg.setAttribute("aria-expanded", "false");

          const sbtn = document.createElement("button");
          sbtn.innerHTML = `<span class="icon">${item.icon || ""}</span>${
            item.label
          }<span class="chev">›</span>`;
          sbtn.addEventListener("click", () => {
            const open = sg.getAttribute("aria-expanded") === "true";
            panel
              .querySelectorAll('.subgroup[aria-expanded="true"]')
              .forEach((x) => x.setAttribute("aria-expanded", "false"));
            sg.setAttribute("aria-expanded", open ? "false" : "true");
          });
          sg.appendChild(sbtn);

          const subpanel = document.createElement("div");
          subpanel.className = "subpanel";
          item.children.forEach((link) => {
            if (!canView(link.href)) return;
            const a = document.createElement("a");
            a.className = "item";
            a.href = link.href || "#";
            a.innerHTML = `<span class="icon">${link.icon || ""}</span>${
              link.label
            }`;
            a.addEventListener("click", closeDrawer);
            subpanel.appendChild(a);
          });
          sg.appendChild(subpanel);
          panel.appendChild(sg);
        } else {
          const a = document.createElement("a");
          a.className = "item";
          a.href = item.href || "#";
          a.innerHTML = `<span class="icon">${item.icon || ""}</span>${
            item.label
          }`;
          a.addEventListener("click", closeDrawer);
          panel.appendChild(a);
        }
      });

      g.appendChild(panel);
      main.appendChild(g);
    });
  }

  // -------- build bottom footer (logout + brand + version) --------
  function buildBottom() {
    const version = (window.DF_VERSION && window.DF_VERSION.app) || "v0.0.0";

    bottom.innerHTML = `
      <div class="drawer-bottom-inner">
        <a href="#" class="item logout" role="button" id="dfLogout">
          <span class="icon">↪️</span>Logout
        </a>

        <div class="drawer-brand-mini">
          <img src="assets/icons/icon-192.png" alt="">
          <div class="brand-text">
            <div class="brand-name">Dowson Farms</div>
            <div class="brand-sub" id="farmSub">All systems operational</div>
            <div class="brand-ver">App ${version}</div>
          </div>
        </div>
      </div>
    `;

    const logout = $("#dfLogout", bottom);
    logout.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        // Try Firebase signOut if available
        if (window.firebaseAuth && window.firebaseAuth.signOut) {
          await window.firebaseAuth.signOut();
        } else if (window.firebase && firebase.auth) {
          await firebase.auth().signOut();
        }
      } catch (_) {}
      // Always send to auth screen
      location.href = "auth/";
    });
  }

  // Build now
  buildMain();
  buildBottom();

  // If access object shows up later (permissions loaded), rebuild once
  let rebuilt = false;
  const accessWatcher = setInterval(() => {
    if (!rebuilt && window.DF_ACCESS) {
      rebuilt = true;
      buildMain();
      clearInterval(accessWatcher);
    }
  }, 300);
})();