// /js/version.js  (FULL FILE)
// Expose the same version to both window (pages) and self (service worker)
(function (g) {
  g.DF_VERSION = 'v10.0.1';       // <-- set your real version here (e.g., 'v9.7.3')
  g.APP_VERSION = g.DF_VERSION;  // keep legacy alias in sync if referenced anywhere
})(typeof self !== 'undefined' ? self : window);
