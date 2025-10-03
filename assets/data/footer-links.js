// assets/data/footer-links.js
// Farm Vista — Global Bottom Nav (always visible)
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

  // Height of the footer bar in px (content area)
  const BAR_H = 56;

  const bar = document.createElement('nav');
  bar.setAttribute('aria-label','Bottom navigation');

  // Safe-area helper: returns CSS env() if available, otherwise 0px
  const safe = (name) => (typeof CSS !== "undefined" && CSS.supports?.(`padding-bottom: env(${name})`))
    ? `env(${name})` : '0px';

  Object.assign(bar.style, {
    position:'fixed',
    left:0, right:0, bottom:0,
    height: BAR_H + 'px',
    background:'#0f5a1a',
    display:'grid',
    gridTemplateColumns:`repeat(${links.length},1fr)`,
    alignItems:'center',
    borderTop:'1px solid #0003',
    zIndex: 80,                  // keep footer below the drawer; we’ll adjust drawer in next step
    paddingBottom: safe('safe-area-inset-bottom') // sit above iOS home indicator
  });

  // Compute active section (normalize current path vs link targets)
  const repoBase = '/FarmVista/';
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

    // Active state
    const target = norm(l.href);
    if (target && current.startsWith(target)) {
      a.style.filter = 'brightness(1.08)';
      a.style.fontWeight = '700';
      a.style.opacity = '1';
    } else {
      a.style.opacity = '0.95';
    }

    // Permission-aware check (keep your logic)
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

  // Prevent content being hidden under footer: BAR_H + safe area
  const pb = `calc(${BAR_H}px + ${safe('safe-area-inset-bottom')})`;
  // Don’t stack padding if some page already set it; always set exactly
  document.body.style.paddingBottom = pb;
})();