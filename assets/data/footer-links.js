// assets/data/footer-links.js
// Dowson Farms — Global Bottom Nav (always visible)
// Permission-aware: if user lacks access, redirect to /access-denied.html

window.DF_FOOTER_LINKS = [
  { label: "CP",       href: "crop-production/",  icon: "🌽" },
  { label: "Grain",    href: "grain-tracking/",   icon: "🌾" },
  { label: "Home",     href: "index.html",        icon: "🏠" },
  { label: "Equip",    href: "equipment/",        icon: "🚜" },
  { label: "Feedback", href: "feedback/",         icon: "💬" }
];

(function(){
  const links = (window.DF_FOOTER_LINKS || []);
  if (!links.length) return;

  // ── NEW: use a single barHeight var so padding matches exactly
  const barHeight = 56; // px (was 54 visually; bumping to 56 helps cover small gaps)

  const bar = document.createElement('nav');
  bar.setAttribute('aria-label','Bottom navigation');
  Object.assign(bar.style, {
    position:'fixed',
    left:0, right:0, bottom:0,
    height: barHeight + 'px',
    background:'#0f5a1a',
    display:'grid',
    gridTemplateColumns:`repeat(${links.length},1fr)`,
    alignItems:'center',
    borderTop:'1px solid #0003',
    zIndex:999 // ↑ NEW: ensure it sits above page content
  });

  // ── NEW: compute active section (normalize current path vs link targets)
  const repoBase = '/DowsonFarms/'; // your GitHub Pages base
  const path = location.pathname.startsWith(repoBase)
    ? location.pathname.slice(repoBase.length)
    : location.pathname.replace(/^\//,'');
  const norm = (s) => (s || '')
    .replace(/index\.html$/,'')
    .replace(/\/+$/,'/')
    || ''; // empty means root index

  const current = norm(path);

  links.forEach(l=>{
    const a = document.createElement('a');
    a.href = l.href;
    a.style.display='flex';
    a.style.flexDirection='column';
    a.style.alignItems='center';
    a.style.justifyContent='center';
    a.style.textDecoration='none';
    a.style.color='#fff';
    a.style.fontSize='12px';
    a.style.userSelect='none';
    a.innerHTML = `<div style="font-size:20px;line-height:1">${l.icon||'•'}</div><div>${l.label}</div>`;

    // ── NEW: Active state (bold + slight brighten) based on normalized prefix match
    const target = norm(l.href);
    if (target && current.startsWith(target)) {
      a.style.filter = 'brightness(1.08)';
      a.style.fontWeight = '700';
      a.style.opacity = '1';
    } else {
      a.style.opacity = '0.95';
    }

    // Permission-aware check (KEEPING YOUR ORIGINAL BEHAVIOR)
    a.addEventListener('click', (e)=>{
      if (window.DF_ACCESS && typeof window.DF_ACCESS.canView === 'function') {
        if (!window.DF_ACCESS.canView(l.href)) {
          e.preventDefault();
          location.href = "access-denied.html";
        }
      }
    });

    bar.appendChild(a);
  });

  document.body.appendChild(bar);

  // Prevent content being hidden under footer (KEEP behavior, but tie to barHeight)
  document.body.style.paddingBottom = barHeight + 'px';
})();