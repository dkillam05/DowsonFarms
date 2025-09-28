/* ===========================
   Dowson Farms — ui-nav.js
   Renders the Home page tiles from window.DF_MENUS.tiles
   =========================== */

(function () {
  "use strict";

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn, { once: true });
  }

  function esc(s) {
    return String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]));
  }

  function renderGlobalTiles() {
    const host = document.querySelector('.df-tiles[data-source="global"]');
    if (!host) return; // nothing to do on non-home pages

    // DF_MENUS should be defined by assets/data/menus.js
    const MENUS = (typeof window !== "undefined" && window.DF_MENUS && Array.isArray(window.DF_MENUS.tiles))
      ? window.DF_MENUS.tiles
      : [];

    // Debug banner (bottom-left) so we know what happened on phones
    function debugBanner(text, ok = true) {
      try {
        const box = document.createElement("div");
        box.style.position = "fixed";
        box.style.left = "12px";
        box.style.bottom = "12px";
        box.style.padding = "10px 12px";
        box.style.borderRadius = "12px";
        box.style.background = "white";
        box.style.border = `2px dashed ${ok ? "#2e7d32" : "#b00020"}`;
        box.style.zIndex = "9999";
        box.style.fontSize = "16px";
        box.style.boxShadow = "0 2px 12px rgba(0,0,0,.08)";
        box.textContent = text;
        document.body.appendChild(box);
        setTimeout(() => box.remove(), 3500);
      } catch (_) {}
    }

    if (!MENUS.length) {
      host.innerHTML = `
        <div class="card" style="border:2px solid #2e7d32;border-radius:14px;padding:24px;display:flex;align-items:center;justify-content:center;min-height:140px;">
          <div style="opacity:.8">
            ⚠️ <strong>Menu not loaded</strong><br>
            Expected global menu at <code>assets/data/menus.js</code>.
          </div>
        </div>`;
      debugBanner("ERR: 0 menu(s) loaded", false);
      console.warn("[ui-nav] DF_MENUS.tiles missing/empty.");
      return;
    }

    // Build tiles
    host.innerHTML = MENUS.map(t => {
      const emoji = t.iconEmoji ? `${esc(t.iconEmoji)} ` : "";
      const label = esc(t.label || "");
      const href  = esc(t.href || "#");
      return `<a href="${href}" class="df-tile">${emoji}<span>${label}</span></a>`;
    }).join("");

    // If nothing actually rendered (CSS or selector mismatch), do a minimal fallback
    if (!host.innerHTML.trim()) {
      host.innerHTML = MENUS.map(t => `<a href="${esc(t.href||"#")}">${esc(t.label||"")}</a>`).join(" • ");
    }

    debugBanner(`OK: ${MENUS.length} menu(s) loaded`, true);
  }

  ready(renderGlobalTiles);
})();