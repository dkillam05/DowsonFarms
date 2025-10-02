// Simple shell utilities used by every page
(function(){
  const root = document.documentElement;
  const openDrawer = () => { root.classList.add('drawer-open'); d.classList.add('open'); }
  const closeDrawer = () => { root.classList.remove('drawer-open'); d.classList.remove('open'); }

  const m = document.getElementById('menuBtn');
  const d = document.getElementById('drawer');
  const b = document.getElementById('drawerBackdrop');
  if(m){ m.addEventListener('click', openDrawer); }
  if(b){ b.addEventListener('click', closeDrawer); }
  if(d){ d.addEventListener('click', (e)=>{ if(e.target.tagName==='A') closeDrawer(); }); }

  // set active tab by prefix match
  const here = location.pathname.replace(/\/+/g,'/'); // normalize
  document.querySelectorAll('.tabbar a').forEach(a=>{
    const href = a.getAttribute('href');
    if(!href) return;
    const path = new URL(href, location.origin).pathname;
    if(here.startsWith(path)) a.classList.add('active');
  });

  // “Ask AI” demo handler (replace with real API later)
  const aiForm = document.getElementById('askForm');
  if(aiForm){
    aiForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const q = aiForm.querySelector('input').value.trim();
      const out = document.getElementById('askOut');
      if(!q){ out.textContent = 'Type a question…'; return; }
      out.textContent = `⚠️ Demo only. You asked: “${q}”. Wire this to your ChatGPT/OpenAI call next.`;
    });
  }
})();
