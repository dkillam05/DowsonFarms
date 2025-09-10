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