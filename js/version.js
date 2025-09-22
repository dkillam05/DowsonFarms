// /js/version.js  (FULL FILE; ensures version pushes after reload)
(function (g) {
  // 🔁 Bump this on each deploy:
  g.DF_VERSION = 'v1.8.0';       // e.g., 'v9.7.5'
  // Keep legacy alias in sync if referenced anywhere
  g.APP_VERSION = g.DF_VERSION;
})(typeof self !== 'undefined' ? self : window);