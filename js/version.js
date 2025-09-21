/* /js/version.js  — single source of truth for app version */
(function () {
  var root = (typeof self !== 'undefined') ? self
           : (typeof window !== 'undefined') ? window
           : {};

  // bump here only
  root.APP_VERSION = "v9.0.0";
  root.DF_VERSION  = root.APP_VERSION; // <— core.js expects this

  // Update DOM if we’re in a page (not in SW)
  if (typeof document !== 'undefined') {
    document.addEventListener("DOMContentLoaded", () => {
      var vEls = [
        document.getElementById("version"),
        document.getElementById("df-version")
      ];
      vEls.forEach(el => { if (el) el.textContent = root.APP_VERSION; });
    });
  }
})();
