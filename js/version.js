// /js/version.js
// Expose version/build for BOTH page (window) and service worker (self).

(function () {
  var VERSION = 'v4.1.2';  // bump this on each release

  // Build date in Central Time
  var BUILD_DATE = (function(){
    try {
      return new Date().toLocaleString('en-US', {
        timeZone: 'America/Chicago',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      });
    } catch (_) { return ''; }
  })();

  // Make available to page and SW
  try { if (typeof self   !== 'undefined') self.DF_VERSION     = VERSION; } catch (_) {}
  try { if (typeof self   !== 'undefined') self.DF_BUILD_DATE  = BUILD_DATE; } catch (_) {}
  try { if (typeof window !== 'undefined') window.DF_VERSION    = VERSION; } catch (_) {}
  try { if (typeof window !== 'undefined') window.DF_BUILD_DATE = BUILD_DATE; } catch (_) {}

  // Update footer + clear update flag when page is ready
  try {
    if (typeof document !== 'undefined') {
      document.addEventListener('DOMContentLoaded', function(){
        var verEl  = document.getElementById('version');
        var dateEl = document.getElementById('report-date');
        if (verEl)  verEl.textContent  = VERSION;
        if (dateEl) dateEl.textContent = BUILD_DATE;
        try { localStorage.removeItem('df_update_in_progress'); } catch(_){}
      });
    }
  } catch (_) {}
})();