/* /js/version.js  — single source of truth for app version */
(function () {
  // Works in window and in service worker
  var root = (typeof self !== 'undefined') ? self
           : (typeof window !== 'undefined') ? window
           : {};

  root.APP_VERSION = "v8.0.9";   // <- bump here only

  // Only touch the DOM if we’re in a page (not in SW)
  if (typeof document !== 'undefined') {
    document.addEventListener("DOMContentLoaded", () => {
      var v = document.getElementById("version");
      if (v) v.textContent = root.APP_VERSION;
    });
  }
})();
