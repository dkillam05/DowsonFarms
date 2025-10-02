// Drawer controller: open/close + accordion. Works on any page where markup exists.
(function () {
  const $ = (s) => document.querySelector(s);

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else { fn(); }
  }

  ready(() => {
    const drawer   = $("#drawer");
    const backdrop = $("#drawerBackdrop");
    const btnOpen  = $("#drawerOpen");
    const btnClose = $("#drawerClose"); // optional

    if (!drawer || !backdrop || !btnOpen) {
      // If any are missing, silently bail (prevents JS errors)
      return;
    }

    const setBodyLock = (on) => {
      document.documentElement.style.overflow = on ? "hidden" : "";
      document.body.style.overflow = on ? "hidden" : "";
    };

    const open = () => {
      drawer.classList.add("open");
      backdrop.classList.add("show");
      setBodyLock(true);
      btnOpen.setAttribute("aria-expanded", "true");
      drawer.setAttribute("aria-hidden", "false");
    };

    const close = () => {
      drawer.classList.remove("open");
      backdrop.classList.remove("show");
      setBodyLock(false);
      btnOpen.setAttribute("aria-expanded", "false");
      drawer.setAttribute("aria-hidden", "true");
    };

    const toggle = () => (drawer.classList.contains("open") ? close() : open());

    // Wire events
    btnOpen.addEventListener("click", toggle);
    backdrop.addEventListener("click", close);
    btnClose && btnClose.addEventListener("click", close);

    // ESC to close
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && drawer.classList.contains("open")) close();
    });

    // Accordion: any .acc .acc-hd toggles parent .acc
    drawer.addEventListener("click", (e) => {
      const hd = e.target.closest(".acc-hd");
      if (!hd || !drawer.contains(hd)) return;
      const acc = hd.closest(".acc");
      if (!acc) return;

      // Close siblings for clean drawer
      const group = acc.parentElement;
      [...group.children].forEach((sib) => {
        if (sib !== acc && sib.classList.contains("acc")) sib.classList.remove("open");
      });

      acc.classList.toggle("open");
    });
  });
})();