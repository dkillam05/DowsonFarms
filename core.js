/* ===========================
   Dowson Farms — core.js
   - Global HH:MM clock (Central Time)
   - Footer version injection
   - Breadcrumbs helper
   =========================== */

// ---- Footer version (reads APP_VERSION from version.js) ----
(function setFooterVersion() {
  try {
    const el = document.getElementById('version');
    if (!el) return;
    const v = (typeof APP_VERSION !== 'undefined') ? APP_VERSION : 'v0.0.0';
    el.textContent = v;
  } catch (_) {}
})();

// ---- Global clock (HH:MM only, synced to minute boundary) ----
(function initClock() {
  // Prevent multiple intervals across navigations
  if (window.__DF_CLOCK_INTERVAL) {
    clearInterval(window.__DF_CLOCK_INTERVAL);
    window.__DF_CLOCK_INTERVAL = null;
  }
  if (window.__DF_CLOCK_TIMEOUT) {
    clearTimeout(window.__DF_CLOCK_TIMEOUT);
    window.__DF_CLOCK_TIMEOUT = null;
  }

  const el = document.getElementById('clock');
  if (!el) return; // page doesn't have a clock

  function renderClock() {
    el.textContent = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Chicago'
    });
  }

  // Sync to the next minute boundary for zero drift
  function scheduleMinuteTick() {
    const now = new Date();
    const ms = now.getMilliseconds();
    const s = now.getSeconds();
    const untilNextMinute = 60000 - (s * 1000 + ms);

    window.__DF_CLOCK_TIMEOUT = setTimeout(() => {
      renderClock();
      // Then tick every minute
      window.__DF_CLOCK_INTERVAL = setInterval(renderClock, 60000);
    }, untilNextMinute);
  }

  // Initial render and schedule
  renderClock();
  scheduleMinuteTick();

  // If the page regains visibility, resync to minute boundary
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      renderClock();
      if (window.__DF_CLOCK_INTERVAL) clearInterval(window.__DF_CLOCK_INTERVAL);
      if (window.__DF_CLOCK_TIMEOUT) clearTimeout(window.__DF_CLOCK_TIMEOUT);
      scheduleMinuteTick();
    }
  });
})();

// ---- Breadcrumbs helper (optional) ----
// Usage: setBreadcrumbs(["Home","Reports","Soybeans"]);
window.setBreadcrumbs = function setBreadcrumbs(parts) {
  try {
    const ol = document.querySelector('.breadcrumbs ol');
    if (!ol || !Array.isArray(parts)) return;
    ol.innerHTML = '';
    parts.forEach((p, i) => {
      const li = document.createElement('li');
      if (i < parts.length - 1) {
        const a = document.createElement('a');
        a.textContent = p;
        a.href = '#';
        li.appendChild(a);
      } else {
        const span = document.createElement('span');
        span.textContent = p;
        li.appendChild(span);
      }
      ol.appendChild(li);
      if (i < parts.length - 1) {
        const sep = document.createElement('li');
        sep.className = 'sep';
        sep.textContent = '›';
        ol.appendChild(sep);
      }
    });
  } catch (_) {}
};