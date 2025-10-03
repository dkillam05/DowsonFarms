(function(){
  // Footer navigation was distracting and has been removed.
  // This script now simply ensures any legacy footer element is cleaned up.
  const legacyFooter = document.querySelector('nav[aria-label="Bottom navigation"]');
  if (legacyFooter) legacyFooter.remove();
  document.body.style.removeProperty('padding-bottom');
})();
