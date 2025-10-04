(async function () {
  const current = document.currentScript || (function () {
    const scripts = document.getElementsByTagName("script");
    for (let i = scripts.length - 1; i >= 0; i -= 1) {
      const src = scripts[i].src || "";
      if (src.includes("/js/core")) return scripts[i];
    }
    return null;
  })();

  const root = current ? new URL("../", new URL(current.src, location.href)).href : location.origin + "/";

  const toUrl = (relative) => new URL(relative.replace(/^\//, ""), root).href;

  const existingScript = (href) => Array.from(document.scripts || []).some((scr) => scr.src === href);
  const existingStyle = (href) => Array.from(document.querySelectorAll('link[rel="stylesheet"]')).some((lnk) => lnk.href === href);

  const ensureStylesheet = (relativeHref) => {
    const href = toUrl(relativeHref);
    if (existingStyle(href)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  };

  const ensureScript = (relativeSrc, { type } = {}) => {
    const src = toUrl(relativeSrc);
    if (existingScript(src)) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      if (type) script.type = type;
      if (!type || type === "text/javascript") script.async = false;
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  };

  // Hide any legacy headers so page-specific scripts can still target them without duplicating UI
  Array.from(document.querySelectorAll("body > header")).forEach((header) => {
    if (header.dataset && header.dataset.fvGlobal === "1") return;
    header.setAttribute("hidden", "hidden");
    header.style.display = "none";
  });

  // Ensure the modern header + drawer styles are present
  ensureStylesheet("assets/css/header.css");
  ensureStylesheet("assets/css/drawer.css");

  try {
    await ensureScript("assets/data/drawer-menus.js");
    await ensureScript("js/version.js");
    await ensureScript("js/update-check.js", { type: "module" });
    await ensureScript("js/header.js");
    await ensureScript("js/footer.js");
    await ensureScript("js/drawer.js", { type: "module" });
  } catch (err) {
    console.warn("Farm Vista core shell failed to load:", err);
  }
})();
