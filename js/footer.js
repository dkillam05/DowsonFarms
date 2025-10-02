// Dowson Farms — Global Footer Renderer
(function(){
  const links = (window.DF_FOOTER_LINKS || []).slice();
  if (!links.length) return;

  // Create footer element
  const nav = document.createElement("nav");
  nav.className = "app-footer-nav";
  nav.setAttribute("aria-label", "Primary");

  // Current path (GitHub Pages uses absolute paths after <base href="/DowsonFarms/">)
  const here = location.pathname.replace(/\/+/g,'/');

  links.forEach(item => {
    const a = document.createElement("a");
    a.href = item.href;
    a.innerHTML = `<span>${item.icon || "•"}</span>${item.label}`;

    // Active state if current location starts with link (simple highlight)
    try {
      const linkPath = new URL(a.href, location.origin).pathname;
      if (here === linkPath || here.startsWith(linkPath)) {
        a.style.opacity = "1";
        a.style.fontWeight = "700";
        a.style.textDecoration = "underline";
      } else {
        a.style.opacity = "0.9";
      }
    } catch(_) {}

    nav.appendChild(a);
  });

  // Mount at end of body so it’s global
  document.addEventListener("DOMContentLoaded", () => {
    document.body.appendChild(nav);
  });
})();
