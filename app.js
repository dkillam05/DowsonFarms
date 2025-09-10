/* =========================================================
   Dowson Farms — App.js (Part 1/12)
   Version: v12.0.0
   Purpose: Core bootstrap only (no features yet)
   - Single source of truth for version (window.APP_VERSION)
   - Ensure #header, #app, #footer exist
   - Footer version painting
   - Minimal router scaffold (renders a simple Home placeholder)
   - Tiny utilities exported on window.DF for later parts
   ========================================================= */

(function DF_BOOTSTRAP_V12(){
  'use strict';

  // Guard against double-loads
  if (window.__DF_BOOTSTRAP_V12__) return;
  window.__DF_BOOTSTRAP_V12__ = true;

  // ---------- Version (single source of truth) ----------
  const APP_VERSION = 'v12.0.0';
  // Expose for other files (Service Worker / index can read from this script at runtime)
  window.APP_VERSION = APP_VERSION;

  // ---------- DOM helpers ----------
  const $  = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  // ---------- Formatting helpers ----------
  const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[m]));

  const fmtCommas = (n, {decimals=null} = {}) => {
    const v = Number(n);
    if (!Number.isFinite(v)) return String(n);
    const d = decimals==null
      ? (Math.abs(v)%1===0 ? 0 : (Math.abs(v)>=100 ? 1 : 2))
      : Math.max(0, Math.min(6, decimals));
    try { return v.toLocaleString(undefined, {minimumFractionDigits:d, maximumFractionDigits:d}); }
    catch { return String(v); }
  };

  const prettyDate = (d) => {
    try{
      const dt = (d instanceof Date) ? d : new Date(d);
      return dt.toLocaleDateString(undefined, {year:'numeric',month:'short',day:'numeric'});
    }catch{ return String(d); }
  };

  const formatClock12 = (d=new Date())=>{
    try{
      let h=d.getHours(), m=String(d.getMinutes()).padStart(2,'0');
      const ampm = h>=12?'PM':'AM'; h=h%12||12;
      return `${h}:${m} ${ampm}`;
    }catch{ return ''; }
  };

  // ---------- Minimal DOM scaffolding (header/app/footer) ----------
  function ensureShell(){
    // Header
    let header = $('#header');
    if (!header){
      header = document.createElement('header');
      header.id = 'header';
      header.className = 'site-head';
      header.innerHTML = `
        <div class="container head-inner">
          <div class="brand">
            <img src="icons/logo.png" alt="Dowson Farms" class="logo" onerror="this.style.display='none'">
            <span class="brand-name">Dowson Farms</span>
          </div>
        </div>`;
      document.body.prepend(header);
    }

    // Main app mount
    let app = $('#app');
    if (!app){
      app = document.createElement('main');
      app.id = 'app';
      app.setAttribute('role','main');
      document.body.appendChild(app);
    }

    // Footer
    let footer = $('#footer');
    if (!footer){
      footer = document.createElement('footer');
      footer.id = 'footer';
      footer.className = 'site-foot';
      footer.innerHTML = `
        <div class="container foot-inner">
          <span>© Dowson Farms</span>
          <span aria-hidden="true">•</span>
          <span id="version">${esc(APP_VERSION)}</span>
        </div>`;
      document.body.appendChild(footer);
    } else {
      // Try to ensure we have #version inside footer
      if (!$('#version', footer)){
        const span = document.createElement('span');
        span.id = 'version';
        span.textContent = APP_VERSION;
        // place near the end with a dot divider if missing
        const dot = document.createElement('span');
        dot.setAttribute('aria-hidden','true');
        dot.textContent = '•';
        const inner = $('.foot-inner', footer) || footer;
        inner.appendChild(dot);
        inner.appendChild(span);
      }
    }
  }

  // ---------- Footer version painting ----------
  function paintVersion(){
    const vEl = $('#version');
    if (vEl) vEl.textContent = APP_VERSION;
  }

  // ---------- Minimal Home view (placeholder) ----------
  function viewHome(){
    const app = $('#app');
    if (!app) return;
    app.innerHTML = `
      <section class="section">
        <h1>Home</h1>
        <p class="muted">Core loaded ✅ — v12.0.0</p>
        <p class="muted">We’ll add your dashboard tiles in Part 2.</p>
      </section>
    `;
  }

  // ---------- Router scaffold (hash-based) ----------
  function ensureHomeHash(){
    if (!location.hash || location.hash === '#') location.replace('#/home');
  }

  function route(){
    try{
      ensureHomeHash();
      const hash = location.hash || '#/home';

      if (hash === '#/home') {
        viewHome();
      } else {
        // For now, anything else goes to Home until later parts define screens
        viewHome();
      }
    }catch(err){
      console.error('Route error:', err);
      const app = $('#app');
      if (app){
        app.innerHTML = `
          <section class="section">
            <h1>Something went wrong</h1>
            <p class="muted">Core failed to render. Try reloading.</p>
          </section>
        `;
      }
    }
  }

  // ---------- Bootstrap ----------
  function start(){
    ensureShell();       // make sure header/app/footer exist
    paintVersion();      // write version to footer
    ensureHomeHash();    // set default hash
    route();             // initial route
  }

  // Wire route listeners
  window.addEventListener('hashchange', route);

  // Start on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once:true });
  } else {
    start();
  }

  // ---------- Export a tiny namespace for later parts ----------
  window.DF = Object.freeze({
    VERSION: APP_VERSION,
    $, $$, esc, fmtCommas, prettyDate, formatClock12
  });

})();
/* =========================
   v12.0.0 — Part 2: Home screen tiles + labels
   Append directly below Part 1
   ========================= */
(function DF_PART2_HOME(){
  'use strict';
  if (window.__DF_PART2__) return;
  window.__DF_PART2__ = true;

  // Helpers pulled from Part 1 (safe if already defined)
  const $  = (s, r=document)=>r.querySelector(s);
  const esc = s => String(s??'').replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#39;' }[m]));

  // Ensure globals from Part 1 exist
  window.DF = window.DF || {};
  const DF = window.DF;

  // ---- Breadcrumb labels (used by Part 1 renderer) ----
  DF.LABELS = Object.assign(DF.LABELS || {}, {
    '#/home':             'Home',
    '#/crop':             'Crop Production',
    '#/grain':            'Grain Tracking',
    '#/equipment':        'Equipment',
    '#/calc':             'Calculators',
    '#/ai':               'Reports',
    '#/team':             'Team / Partners',
    '#/feedback':         'Feedback',
    '#/settings':         'Setups / Settings'
  });

  // ---- Tile component (minimal, consistent with earlier UI) ----
  function tile(emoji, label, href){
    return `
      <a class="tile" href="${esc(href)}" aria-label="${esc(label)}">
        <span class="emoji" aria-hidden="true">${emoji}</span>
        <span class="label">${esc(label)}</span>
      </a>`;
  }

  // ---- Home View (exact order you specified) ----
  window.viewHome = function(){
    const app = $('#app'); if (!app) return;
    app.innerHTML = `
      <section class="section">
        <h1>Home</h1>
        <div class="grid">
          ${tile('🌱','Crop Production','#/crop')}
          ${tile('🌾','Grain Tracking','#/grain')}
          ${tile('🚜','Equipment','#/equipment')}
          ${tile('🧮','Calculators','#/calc')}
          ${tile('📈','Reports','#/ai')}
          ${tile('👥','Team / Partners','#/team')}
          ${tile('📝','Feedback','#/feedback')}
          ${tile('⚙️','Setups / Settings','#/settings')}
        </div>
      </section>
    `;
  };

  // ---- No-op placeholder views (so router won’t 404 while we build parts) ----
  // These will be replaced in later parts with your 10.15.1 functionality.
  function comingSoon(title, backHref='#/home'){
    const app = $('#app'); if (!app) return;
    app.innerHTML = `
      <section class="section">
        <h1>${esc(title)}</h1>
        <p class="muted">This screen is being wired back in cleanly from 10.15.1.</p>
        <a class="btn" href="${esc(backHref)}">Back</a>
      </section>`;
  }

  window.viewCropHub       = window.viewCropHub       || (()=>comingSoon('Crop Production','#/home'));
  window.viewGrainHub      = window.viewGrainHub      || (()=>comingSoon('Grain Tracking','#/home'));
  window.viewEquipmentHub  = window.viewEquipmentHub  || (()=>comingSoon('Equipment','#/home'));
  window.viewCalcHub       = window.viewCalcHub       || (()=>comingSoon('Calculators','#/home'));
  window.viewReportsHub    = window.viewReportsHub    || (()=>comingSoon('Reports','#/home'));
  window.viewTeamHub       = window.viewTeamHub       || (()=>comingSoon('Team / Partners','#/home'));
  window.viewFeedbackHub   = window.viewFeedbackHub   || (()=>comingSoon('Feedback','#/home'));
  window.viewSettingsHome  = window.viewSettingsHome  || (()=>comingSoon('Setups / Settings','#/home'));

  // ---- Hook into Part 1 router if present; otherwise Part 1 will call viewHome on init ----
  // (No action needed here; Part 1 owns routing.)
})();

/* =========================
   v12.0.0 — Part 3: Update Banner
   Append directly below Part 2
   ========================= */
(function DF_PART3_UPDATE_BANNER(){
  'use strict';
  if (window.__DF_PART3__) return;
  window.__DF_PART3__ = true;

  const $ = (s,r=document)=>r.querySelector(s);

  // Create banner DOM once
  function ensureBanner(){
    if ($('#update-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'update-banner';
    banner.style.cssText = `
      position:fixed; bottom:0; left:0; right:0;
      background:#1B5E20; color:#fff; text-align:center;
      padding:10px; font-size:0.9em;
      display:none; z-index:2000;
    `;
    banner.innerHTML = `
      <span>🔄 New update available</span>
      <button id="update-refresh" style="margin-left:12px;padding:4px 10px;">Refresh</button>
    `;
    document.body.appendChild(banner);
    $('#update-refresh').addEventListener('click', ()=>{
      // Hard reload bypassing cache
      location.reload(true);
    });
  }

  // Show banner when SW posts "NEW_VERSION"
  window.addEventListener('DF_NEW_VERSION', ()=>{
    ensureBanner();
    const b = $('#update-banner');
    if (b) b.style.display = 'block';
  });

  // For manual testing from console:
  // window.dispatchEvent(new Event('DF_NEW_VERSION'));
})();