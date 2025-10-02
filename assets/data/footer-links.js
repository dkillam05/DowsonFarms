<!-- assets/data/footer-links.js -->
<script>
// ───────────────────────────────────────────────────────────────────────────────
// Dowson Farms — Global Bottom Nav (always visible)
// Permission-aware: if user lacks access, send to /access-denied.html
// ───────────────────────────────────────────────────────────────────────────────

window.DF_FOOTER_LINKS = [
  { label: "CP",       href: "crop-production/",  icon: "🌽" },
  { label: "Grain",    href: "grain-tracking/",   icon: "🌾" },
  { label: "Home",     href: "index.html",        icon: "🏠" },
  { label: "Equip",    href: "equipment/",        icon: "🚜" },
  { label: "Feedback", href: "feedback/",         icon: "💬" }
];

// small helper to ensure DF_ACCESS is loaded (and cached)
async function ensureAccess(){
  if (window.DF_ACCESS) return window.DF_ACCESS;
  try {
    const mod = await import("/DowsonFarms/js/access.js");
    const acc = await mod.loadAccess();
    return acc;
  } catch (e){
    console.warn("[footer] access.js failed; continuing without gating", e);
    return null;
  }
}

// convenience: get the DF_MENUS top-level tile by href (folder-style)
function findTopTileByHref(href){
  const tiles = (window.DF_MENUS && (window.DF_MENUS.tiles || window.DF_MENUS)) || [];
  const norm = (s)=> (s||"").replace(/index\.html$/,"").replace(/\/+$/,"/"); // normalize
  const target = norm(href);
  return tiles.find(t => norm(t.href) === target) || null;
}

function renderFooter(){
  const links = window.DF_FOOTER_LINKS || [];
  if(!links.length) return;
  if(document.getElementById("dfBottomNav")) return; // already rendered

  const bar = document.createElement('nav');
  bar.id = 'dfBottomNav';
  bar.setAttribute('aria-label','Bottom navigation');
  Object.assign(bar.style, {
    position:'fixed', left:0, right:0, bottom:0, height:'56px',
    background:'#0f5a1a', display:'grid',
    gridTemplateColumns:`repeat(${links.length},1fr)`,
    alignItems:'center', borderTop:'1px solid rgba(0,0,0,.25)',
    zIndex: 200
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

    // Gate navigation by permissions; always show, but redirect to denied if blocked
    a.addEventListener('click', async (ev)=>{
      // Home never gated
      if (l.href === "index.html") return;

      const access = await ensureAccess();
      if (!access){ return; } // if access failed, let the link behave normally

      // rule: allow if top href is viewable OR any child in that section is viewable
      let allowed = !!access.can(l.href, "view");
      if (!allowed){
        const top = findTopTileByHref(l.href);
        if (top && Array.isArray(top.children) && top.children.length){
          const kids = access.filterChildren ? access.filterChildren(top.children) : top.children;
          allowed = kids.length > 0;
        }
      }

      if (!allowed){
        ev.preventDefault();
        const area = encodeURIComponent(l.label);
        const back = encodeURIComponent(l.href);
        location.href = `access-denied.html?area=${area}&back=${back}`;
      }
    });

    bar.appendChild(a);
  });

  document.body.appendChild(bar);

  // ensure content isn’t hidden behind the fixed bar
  const currentPad = parseInt(window.getComputedStyle(document.body).paddingBottom || '0', 10);
  if(currentPad < 60) document.body.style.paddingBottom = '60px';
}

try{ renderFooter(); }catch(e){ console.warn("[footer] render failed", e); }
</script>