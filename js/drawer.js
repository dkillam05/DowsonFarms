<script>
(function(){
  const body = document.body;

  const drawer = document.getElementById('drawer');
  const backdrop = document.getElementById('drawerBackdrop');
  const burger = document.getElementById('hamburger');

  if(!drawer || !backdrop || !burger){
    console.warn('Drawer: missing #drawer, #drawerBackdrop, or #hamburger');
    return;
  }

  function openDrawer(){ body.classList.add('drawer-open'); burger.setAttribute('aria-expanded','true'); trapStart.focus(); }
  function closeDrawer(){ body.classList.remove('drawer-open'); burger.setAttribute('aria-expanded','false'); burger.focus(); }
  function toggleDrawer(){ body.classList.contains('drawer-open') ? closeDrawer() : openDrawer(); }

  // Backdrop / esc / clicks
  burger.addEventListener('click', toggleDrawer);
  backdrop.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeDrawer(); });

  // Close when any link inside drawer is clicked
  drawer.addEventListener('click', (e)=>{
    const a = e.target.closest('a');
    if(a) closeDrawer();
  });

  // Focus trap (basic)
  const trapStart = document.createElement('button');
  trapStart.style.position='fixed'; trapStart.style.opacity='0'; trapStart.tabIndex = 0;
  const trapEnd = trapStart.cloneNode(true);
  drawer.prepend(trapStart); drawer.appendChild(trapEnd);
  trapStart.addEventListener('focus', ()=>{ const focusables = drawer.querySelectorAll('a,button,[tabindex]:not([tabindex="-1"])'); (focusables[1]||burger).focus(); });
  trapEnd.addEventListener('focus', ()=>{ const focusables = drawer.querySelectorAll('a,button,[tabindex]:not([tabindex="-1"])'); (focusables[focusables.length-2]||burger).focus(); });

  // Accordion toggle
  drawer.querySelectorAll('.drawer-sec > button').forEach(btn=>{
    btn.addEventListener('click', ()=> btn.parentElement.classList.toggle('open'));
  });
})();
</script>