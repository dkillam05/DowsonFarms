// js/drawer.js — robust hamburger + hero + scrolling footer
// - Auto-creates #drawer and #drawerBackdrop if missing.
// - Works with injected header (delegation + retry).
// - Builds accordion from DF_DRAWER_MENUS.
// - Version label updates once version.js sets window.DF_VERSION.

(function () {
  // ---------- ensure drawer shell exists ----------
  let drawer = document.getElementById("drawer");
  if (!drawer) {
    drawer = document.createElement("div");
    drawer.id = "drawer";
    drawer.className = "drawer";
    const nav = document.createElement("nav"); // content area
    drawer.appendChild(nav);
    document.body.appendChild(drawer);
  }

  // ---------- ensure backdrop exists ----------
  let backdrop = document.getElementById("drawerBackdrop");
  if (!backdrop) {
    backdrop = document.createElement("div");
    backdrop.id = "drawerBackdrop";
    backdrop.className = "drawerBackdrop";
    document.body.appendChild(backdrop);
  }

  // ---------- open / close ----------
  const openDrawer  = () => document.body.classList.add("drawer-open");
  const closeDrawer = () => document.body.classList.remove("drawer-open");
  window.DF_OPEN_DRAWER = openDrawer;

  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) closeDrawer();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDrawer();
  });

  // ---------- HAMBURGER: bind now, keep retrying, plus delegation ----------
  function findToggle() {
    return (
      document.getElementById("drawerToggle") ||
      document.querySelector(".app-header .burger") ||
      document.querySelector('[aria-label="Open menu"]')
    );
  }
  function bindToggle(btn) {
    if (!btn || btn.dataset.dfBound === "1") return;
    const onTap = (ev) => { ev.preventDefault(); openDrawer(); };
    btn.addEventListener("click", onTap, { passive: false });
    btn.addEventListener("touchstart", onTap, { passive: false });
    btn.dataset.dfBound = "1";
  }
  // Try immediately + retry (header may be injected after this runs)
  bindToggle(findToggle());
  let tries = 0, maxTries = 60; // ~6s
  const iv = setInterval(() => {
    const btn = findToggle();
    if (btn && btn.dataset.dfBound === "1") { clearInterval(iv); return; }
    if (btn) bindToggle(btn);
    if (++tries >= maxTries) clearInterval(iv);
  }, 100);
  // Delegation safety-net (future rerenders)
  document.addEventListener("click", (e) => {
    const hit = e.target.closest &&
      (e.target.closest("#drawerToggle") ||
       e.target.closest(".app-header .burger") ||
       e.target.closest('[aria-label="Open menu"]'));
    if (hit) { e.preventDefault(); openDrawer(); }
  }, true);

  // ---------- permission helper ----------
  const canView = (href) => {
    if (!window.DF_ACCESS || typeof window.DF_ACCESS.canView !== "function") return true;
    return window.DF_ACCESS.canView(href);
  };

  // ---------- top hero (uses existing styles; add both classes to match CSS variants) ----------
  function buildHero() {
    const hero = document.createElement("div");
    hero.className = "brand hero"; // supports .brand or .hero CSS you’ve used
    hero.innerHTML = `
      <div class="row">
        <img src="assets/icons/icon-192.png" alt="">
        <div>
          <div class="title">Farm Vista</div>
          <div class="sub">AI-powered field intelligence</div>
        </div>
      </div>
    `;
    return hero;
  }

  // ---------- link row / subgroup / group ----------
  const makeLink = (href, label, icon) => {
    const a = document.createElement("a");
    a.className = "item";
    a.href = href || "#";
    a.innerHTML = `<span class="icon">${icon || ""}</span>${label}`;
    a.addEventListener("click", closeDrawer);
    return a;
  };

  function makeSubgroup(node) {
    const kids = (node.children || []).filter((ch) => canView(ch.href));
    if (!kids.length) return null;

    const sg = document.createElement("div");
    sg.className = "subgroup";
    sg.setAttribute("aria-expanded", "false");

    const btn = document.createElement("button");
    btn.innerHTML = `<span class="icon">${node.icon || ""}</span>${node.label}<span class="chev">›</span>`;
    btn.addEventListener("click", () => {
      const exp = sg.getAttribute("aria-expanded") === "true";
      sg.parentElement
        .querySelectorAll('.subgroup[aria-expanded="true"]')
        .forEach((x) => x.setAttribute("aria-expanded", "false"));
      sg.setAttribute("aria-expanded", exp ? "false" : "true");
    });
    sg.appendChild(btn);

    const pane = document.createElement("div");
    pane.className = "subpanel";
    kids.forEach((ch) => pane.appendChild(makeLink(ch.href, ch.label, ch.icon)));
    sg.appendChild(pane);
    return sg;
  }

  function makeGroup(group, nav) {
    const visible = (group.children || []).filter((it) => {
      if (Array.isArray(it.children) && it.children.length) {
        return it.children.some((l) => canView(l.href || ""));
      }
      return canView(it.href || "");
    });
    if (!visible.length) return null;

    const g = document.createElement("div");
    g.className = "group";
    g.setAttribute("aria-expanded", "false");

    const btn = document.createElement("button");
    btn.innerHTML = `<span class="icon">${group.icon || ""}</span>${group.label}<span class="chev">›</span>`;
    btn.addEventListener("click", () => {
      const expanded = g.getAttribute("aria-expanded") === "true";
      nav.querySelectorAll('.group[aria-expanded="true"]').forEach((x) =>
        x.setAttribute("aria-expanded", "false")
      );
      g.setAttribute("aria-expanded", expanded ? "false" : "true");
    });
    g.appendChild(btn);

    const pane = document.createElement("div");
    pane.className = "panel";

    visible.forEach((it) => {
      if (Array.isArray(it.children) && it.children.length) {
        const sg = makeSubgroup(it);
        if (sg) pane.appendChild(sg);
      } else {
        pane.appendChild(makeLink(it.href, it.label, it.icon));
      }
    });

    g.appendChild(pane);
    return g;
  }

  // ---------- footer (logout + brand/version) ----------
  function buildFooter() {
    const foot = document.createElement("div");
    foot.className = "drawerFooter";

    const logout = document.createElement("a");
    logout.className = "item logout";
    logout.href = "#";
    logout.innerHTML = `<span class="icon">↪️</span>Logout`;
    logout.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        const { auth } = await import("./firebase-init.js");
        const { signOut } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js");
        await signOut(auth);
        closeDrawer();
        location.href = "auth/";
      } catch (err) { console.warn("Logout failed:", err); }
    });

    const hr = document.createElement("div");
    Object.assign(hr.style, { height: "1px", background: "#0001", margin: "8px 0" });

    const brand = document.createElement("div");
    brand.className = "footBrand";
    brand.innerHTML = `
      <div>
        <div class="title">Farm Vista</div>
        <div class="mono">AI-powered field intelligence</div>
      </div>
    `;

    const ver = document.createElement("div");
    ver.className = "ver";

    const formatVersion = (value) => {
      if (!value) return null;
      const raw = String(value).trim();
      if (!raw) return null;
      const normalized = raw.replace(/^V/, "v");
      return normalized.startsWith("v") ? `App ${normalized}` : `App v${normalized}`;
    };

    const resolveVersion = () => {
      const src = window.DF_VERSION;
      if (!src) return null;
      if (typeof src === "string") return formatVersion(src);
      if (typeof src === "object") {
        const cand = src.app || src.version || src.tag || src.v || src.value;
        return formatVersion(cand);
      }
      return null;
    };

    const applyVersion = (event) => {
      if (event && event.detail !== undefined) {
        window.DF_VERSION = event.detail;
      }
      const label = resolveVersion();
      if (label) ver.textContent = label;
      return !!label;
    };

    if (!applyVersion()) {
      ver.textContent = "App v…";
      const onVersion = (event) => {
        if (applyVersion(event)) {
          window.removeEventListener("df-version", onVersion);
        }
      };
      window.addEventListener("df-version", onVersion);
      let n = 0;
      const t = setInterval(() => { if (applyVersion() || ++n > 50) clearInterval(t); }, 100);
    }

    foot.appendChild(logout);
    foot.appendChild(hr);
    foot.appendChild(brand);
    foot.appendChild(ver);
    return foot;
  }

  // ---------- assemble structure ----------
  const navShell = drawer.querySelector("nav") || document.createElement("nav");
  const scrollWrap = document.createElement("div");
  scrollWrap.className = "drawerScroll";

  drawer.innerHTML = "";
  scrollWrap.appendChild(buildHero());
  scrollWrap.appendChild(navShell);
  scrollWrap.appendChild(buildFooter());
  drawer.appendChild(scrollWrap);

  // ---------- build accordion ----------
  const nav = navShell;
  nav.innerHTML = "";
  (window.DF_DRAWER_MENUS || []).forEach((group) => {
    const g = makeGroup(group, nav);
    if (g) nav.appendChild(g);
  });

  // ---------- width autosize (clamped) ----------
  try {
    const measurer = document.createElement("div");
    measurer.style.cssText =
      "position:absolute;visibility:hidden;white-space:nowrap;font:16px system-ui,-apple-system,Segoe UI,Roboto,Arial";
    document.body.appendChild(measurer);
    let longest = 240;
    drawer.querySelectorAll(".group > button, a.item, .subgroup > button").forEach((el) => {
      measurer.textContent = (el.innerText || el.textContent || "").trim();
      longest = Math.max(longest, measurer.offsetWidth + 80);
    });
    document.body.removeChild(measurer);
    const clamped = Math.max(260, Math.min(420, longest));
    drawer.style.width = clamped + "px";
  } catch {}
})();