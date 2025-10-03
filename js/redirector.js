// js/redirector.js
// Force all shared links to return to main index.html

(function () {
  const here = location.pathname.split("/").pop();

  // Allow index.html to load normally
  if (!here || here === "index.html") return;

  // Redirect everything else back to home
  location.replace("/FarmVista/index.html");
})();
