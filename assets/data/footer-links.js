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

  const bar = document.createElement('nav');
  bar.setAttribute('aria-label','Bottom navigation');
  Object.assign(bar.style, {
    position:'fixed',
    left:0, right:0, bottom:0,
    height:'54px',
    background:'#0f5a1a',
    display:'grid',
    gridTemplateColumns:`repeat(${links.length},1fr)`,
    alignItems:'center',
    borderTop:'1px solid #0003',
    zIndex:80
  });

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
    a.innerHTML = `<div style="font-size:20px;line-height:1">${l.icon||'•'}</div><div>${l.label}</div>`;

    // Permission-aware check
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
  // Prevent content being hidden under footer
  document.body.style.paddingBottom = '56px';
})();