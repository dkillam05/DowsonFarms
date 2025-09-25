// /js/version.js
// Dowson Farms — single source of truth for version/build.
// Exposes to both page (window) and service worker (self). No update-side effects.

(function () {
  var VERSION = 'v5.6.0';  // ← bump this on each release

  // Build date in Central Time (for footer display only)
  var BUILD_DATE = (function(){
    try {
      return new Date().toLocaleString('en-US', {
        timeZone: 'America/Chicago',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      });
    } catch (_) { return ''; }
  })();

  // Make available to Service Worker context
  try { if (typeof self   !== 'undefined') self.DF_VERSION     = VERSION; } catch (_) {}
  try { if (typeof self   !== 'undefined') self.DF_BUILD_DATE  = BUILD_DATE; } catch (_) {}

  // Make available to Page context
  try { if (typeof window !== 'undefined') window.DF_VERSION    = VERSION; } catch (_) {}
  try { if (typeof window !== 'undefined') window.DF_BUILD_DATE = BUILD_DATE; } catch (_) {}

  // Update footer when DOM is ready (no other side effects)
  try {
    if (typeof document !== 'undefined') {
      document.addEventListener('DOMContentLoaded', function(){
        var verEl  = document.getElementById('version');
        var dateEl = document.getElementById('report-date');
        if (verEl)  verEl.textContent  = VERSION;
        if (dateEl) dateEl.textContent = BUILD_DATE;
      });
    }
  } catch (_) {}
})();