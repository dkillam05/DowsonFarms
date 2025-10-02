// Dowson Farms — Drawer (accordion + sticky footer)
// Sources:
//   - assets/data/drawer-menus.js (window.DF_DRAWER_MENUS)
//   - js/version.js (window.DF_VERSION.version) ← polled until available
// Respects DF_ACCESS.canView when present.

(function () {
  // ---------- helpers ----------
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const canView = (href) => {
    if (!href) return true;
    const A = window.DF_ACCESS;
    return (A && typeof A.canView === "function") ? A.canView(href) : true;
  };

  // ---------- shell / z-index ----------
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
  drawer.style.zIndex   = "200"; // above footer
  backdrop.style.zIndex = "190";

  // ---------- inner layout (brand + scroll + footer pinned at bottom) ----------
  if (!drawer.querySelector(".drawer__inner")) {
    const inner = document.createElement("div");
    inner.className = "drawer__inner";
    Object.assign(inner.style, { display:"flex", flexDirection:"column", height:"100%" });

    // Brand
    const brand = document.createElement("div");
    brand.className = "brand";
    brand.innerHTML = `
      <img src="assets/icons/icon-192.png" alt="" />
      <div class="brand-text">
        <div class="brand-line">
          <span class="brand-name" style="font-weight:700">Dowson Farms</span>
          <span class="brand-sep"> · </span>
          <span class="brand-loc">Divernon, Illinois</span>
        </div>
        <div class="mono" id="dfDrawerVersion" style="color:#456">App v0.0.0</div>
      </div>
    `;
    // small tune so name/loc are on one line when space permits
    const bl = brand.querySelector(".brand-line");
    Object.assign(bl.style, { display:"flex", gap:"6px", alignItems:"baseline", flexWrap:"wrap" });

    // Scroll container with <nav>
    const scroll = document.createElement("div");
    scroll.className = "drawer__scroll";
    Object.assign(scroll.style, { flex:"1", overflow:"auto" });

    let nav = drawer.querySelector("nav");
    if (!nav) { nav = document.createElement("nav"); }
    scroll.appendChild(nav);

    // Footer (small row + brand/version; NO big card)
    const foot = document.createElement("div");
    foot.className = "drawer__footer";
    Object.assign(foot.style, {
      borderTop:"1px solid rgba(0,0,0,.08)",
      background:"#fbfbfa",
      padding:"10px 12px"
    });

    const logout = document.createElement("a");
    logout.href = "#";
    logout.className = "item";
    Object.assign(logout.style, {
      display:"flex", alignItems:"center", gap:"12px",
      padding:"12px 14px",
      textDecoration:"none", color:"#223",
      background:"#fff", border:"1px solid rgba(0,0,0,.08)", borderRadius:"12px"
    });
    logout.innerHTML = `<span class="icon" style="width:20px">↪️</span> Logout`;
    logout.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        // Use the SAME modular auth instance
        const [{ auth }, { signOut }] = await Promise.all([
          import("./firebase-init.js"),
          import("https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js")
        ]);
        await signOut(auth);
      } catch (err) {
        console.warn("logout error", err);
      } finally {
        location.href = "auth/"; // no bounce-back
      }
    });

    // append pieces
    foot.appendChild(logout);
    inner.appendChild(brand);
    inner.appendChild(scroll);
    inner.appendChild(foot);

    // replace drawer body
    drawer.innerHTML = "";
    drawer.appendChild(inner);
  }

  const nav = $("#drawer nav");

  // ---------- open/close wiring ----------
  const openDrawer  = () => document.body.classList.add("drawer-open");
  const closeDrawer = () => document.body.classList.remove("drawer-open");

  const toggleBtn = $("#drawerToggle");
  if (toggleBtn) toggleBtn.addEventListener("click", openDrawer);
  $("#drawerBackdrop").addEventListener("click", (e) => { if (e.target.id === "drawerBackdrop") closeDrawer(); });
  window.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDrawer(); });

  // ---------- render accordion ----------
  function renderMenu() {
    const data = Array.isArray(window.DF_DRAWER_MENUS) ? window.DF_DRAWER_MENUS : [];
    nav.innerHTML = "";

    data.forEach(group => {
      // filter children using access
      const kids = (group.children || []).map(ch => {
        if (Array.isArray(ch.children)) {
          const visible = ch.children.filter(l => canView(l.href));
          return { ...ch, children: visible };
        }
        return ch;
      }).filter(ch => Array.isArray(ch.children) ? ch.children.length > 0 : canView(ch.href));

      if (!kids.length) return;

      const g = document.createElement("div");
      g.className = "group";
      g.setAttribute("aria-expanded", "false");

      const btn = document.createElement("button");
      btn.innerHTML = `<span class="icon">${group.icon || ""}</span>${group.label}<span class="chev">›</span>`;
      btn.addEventListener("click", () => {
        const opened = g.getAttribute("aria-expanded") === "true";
        $$(".group[aria-expanded='true']", nav).forEach(x => x.setAttribute("aria-expanded", "false"));
        g.setAttribute("aria-expanded", opened ? "false" : "true");
      });
      g.appendChild(btn);

      const panel = document.createElement("div");
      panel.className = "panel";

      kids.forEach(item => {
        if (Array.isArray(item.children) && item.children.length) {
          const sg = document.createElement("div");
          sg.className = "subgroup";
          sg.setAttribute("aria-expanded", "false");

          const sbtn = document.createElement("button");
          sbtn.innerHTML = `<span class="icon">${item.icon || ""}</span>${item.label}<span class="chev">›</span>`;
          sbtn.addEventListener("click", () => {
            const opened = sg.getAttribute("aria-expanded") === "true";
            $$(".subgroup[aria-expanded='true']", panel).forEach(x => x.setAttribute("aria-expanded", "false"));
            sg.setAttribute("aria-expanded", opened ? "false" : "true");
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

    // version text (update when DF_VERSION appears)
    const vEl = $("#dfDrawerVersion");
    const setVer = () => {
      if (!vEl) return true;
      const ver =
        (window.DF_VERSION && window.DF_VERSION.version) ||
        window.APP_VERSION ||
        null;
      if (ver) { vEl.textContent = `App ${ver}`; return true; }
      return false;
    };
    if (!setVer()) {
      let tries = 20;
      const t = setInterval(() => { if (setVer() || --tries <= 0) clearInterval(t); }, 300);
    }
  }

  // initial render
  renderMenu();

  // Re-render once DF_ACCESS arrives (so filtering applies), and once menus are ready
  let tries = 20;
  const waitAccess = setInterval(() => {
    if (window.DF_ACCESS || --tries <= 0) {
      clearInterval(waitAccess);
      try { renderMenu(); } catch(_) {}
    }
  }, 300);
})();