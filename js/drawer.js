// Dowson Farms — Drawer + Accordion Control

(function(){
  const drawer   = document.getElementById("drawer");
  const backdrop = document.getElementById("drawerBackdrop");
  const toggleBtn= document.getElementById("drawerToggle");

  function openDrawer(){ drawer.classList.add("open"); backdrop.classList.add("show"); }
  function closeDrawer(){ drawer.classList.remove("open"); backdrop.classList.remove("show"); }

  if(toggleBtn) toggleBtn.addEventListener("click", openDrawer);
  if(backdrop)  backdrop.addEventListener("click", closeDrawer);

  function makeAccordionSection(root, group){
    const btn = document.createElement("button");
    btn.className = "accordion";
    btn.innerHTML = `<span>${group.icon || "•"}</span> ${group.label} <strong>▸</strong>`;
    const panel = document.createElement("div");
    panel.className = "panel";
    (group.children || []).forEach(ch=>{
      const a = document.createElement("a");
      a.href = ch.href || "#";
      a.innerHTML = `<span style="margin-right:6px">${ch.icon || "•"}</span>${ch.label}`;
      panel.appendChild(a);
    });
    btn.addEventListener("click", ()=>{
      const open = panel.style.display === "flex";
      document.querySelectorAll(".drawer nav .panel").forEach(p=>p.style.display="none");
      document.querySelectorAll(".drawer nav button.accordion strong").forEach(s=>s.textContent="▸");
      if(!open){ panel.style.display="flex"; btn.querySelector("strong").textContent="▾"; }
    });
    root.appendChild(btn);
    root.appendChild(panel);
  }

  // Build drawer from DF_DRAWER_MENUS
  const nav = drawer ? drawer.querySelector("nav") : null;
  if(nav && window.DF_DRAWER_MENUS){
    nav.innerHTML = "";
    window.DF_DRAWER_MENUS.forEach(group=> makeAccordionSection(nav, group));
  }
})();