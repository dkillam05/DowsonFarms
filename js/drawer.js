// Dowson Farms — Drawer (accordion + global open/close wiring)
// Depends on: assets/data/drawer-menus.js (window.DF_DRAWER_MENUS)
// Optional perms: window.DF_ACCESS.canView(href) -> boolean

(function () {
  // ---- helpers ----
  const $ = (s, r = document) => r.querySelector(s);
  const canView = (href) => {
    try {
      if (!href) return true;
      if (window.DF_ACCESS && typeof window.DF_ACCESS.canView === "function") {
        const ok = window.DF_ACCESS.canView(href);
        return ok || (window.DF_ACCESS.roleKeys || []).includes("__builder__");
      }
    } catch (_) {}
    return true; // permissive if access not ready
  };

  // ---- cache key elements or create shells if missing ----
  let drawer = $("#drawer");
  if (!drawer) {
    drawer = document.createElement("div");
    drawer.id = "drawer";
    drawer.className = "drawer";
    drawer.innerHTML = `<div class="brand">
        <img src="assets/icons/icon-192.png" alt="">
        <div><div style="font-weight:700">Dowson Farms</div>
        <div class="mono" id="farmSub">All systems operational</div></div>
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

  const nav = drawer.querySelector("nav");

  // ---- open/close (keep above footer) ----
  function openDrawer() {
    document.body.classList.add("drawer-open");
    // ensure stacking above footer
    drawer.style.zIndex = "1000";
    backdrop.style.zIndex = "990";
  }
  function closeDrawer() {
    document.body.classList.remove("drawer-open");
  }

  // Global delegated handler so it works regardless of header timing
  document.addEventListener("click", (e) => {
    const t = e.target.closest("#drawerToggle");
    if (t) {
      e.preventDefault();
      openDrawer();
    }
  });

  // Backdrop + Esc close
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) closeDrawer();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDrawer();
  });

  // ---- build accordion from DF_DRAWER_MENUS ----
  function build() {
    const data = Array.isArray(window.DF_DRAWER_MENUS)
      ? window.DF_DRAWER_MENUS
      : [];
    nav.innerHTML = "";

    data.forEach((group) => {
      // hide whole group if nothing viewable inside
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

      // header button
      const btn = document.createElement("button");
      btn.innerHTML = `<span class="icon">${group.icon || ""}</span>${
        group.label
      }<span class="chev">›</span>`;
      btn.addEventListener("click", () => {
        const isOpen = g.getAttribute("aria-expanded") === "true";
        // collapse others
        nav
          .querySelectorAll('.group[aria-expanded="true"]')
          .forEach((x) => x.setAttribute("aria-expanded", "false"));
        g.setAttribute("aria-expanded", isOpen ? "false" : "true");
      });
      g.appendChild(btn);

      // panel content
      const panel = document.createElement("div");
      panel.className = "panel";

      (group.children || []).forEach((item) => {
        const visible =
          (item.children &&
            item.children.some((ch) => canView(ch.href))) ||
          canView(item.href);
        if (!visible) return;

        if (Array.isArray(item.children) && item.children.length) {
          // subgroup
          const sg = document.createElement("div");
          sg.className = "subgroup";
          sg.setAttribute("aria-expanded", "false");

          const sbtn = document.createElement("button");
          sbtn.innerHTML = `<span class="icon">${item.icon || ""}</span>${
            item.label
          }<span class="chev">›</span>`;
          sbtn.addEventListener("click", () => {
            const open = sg.getAttribute("aria-expanded") === "true";
            // collapse sibling subgroups
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
          // leaf link
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
      nav.appendChild(g);
    });

    // Footer section (logout + version) stays as you already have in drawer.css
    // Nothing else to do here.
  }

  // Build now and also rebuild once access arrives (if perms change)
  build();

  // If DF_ACCESS appears later, rebuild once
  let rebuilt = false;
  const accessWatcher = setInterval(() => {
    if (!rebuilt && window.DF_ACCESS) {
      rebuilt = true;
      build();
      clearInterval(accessWatcher);
    }
  }, 300);
})();