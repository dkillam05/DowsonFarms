// Dowson Farms — Drawer + Accordion Control

(function(){
  const drawer = document.getElementById("drawer");
  const backdrop = document.getElementById("drawerBackdrop");
  const toggleBtn = document.getElementById("drawerToggle");

  function openDrawer(){
    drawer.classList.add("open");
    backdrop.classList.add("show");
  }

  function closeDrawer(){
    drawer.classList.remove("open");
    backdrop.classList.remove("show");
  }

  if(toggleBtn){
    toggleBtn.addEventListener("click", openDrawer);
  }
  if(backdrop){
    backdrop.addEventListener("click", closeDrawer);
  }

  // Accordion expand/collapse
  document.querySelectorAll(".drawer nav button.accordion").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const panel = btn.nextElementSibling;
      if(panel.style.display === "flex"){
        panel.style.display = "none";
      } else {
        panel.style.display = "flex";
      }
    });
  });
})();
