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

/* =========================
   v12.0.0 — Part 4: SW Handshake + Registration
   Append directly below Part 3
   ========================= */
(function DF_PART4_SW(){
  'use strict';
  if (window.__DF_PART4__) return;
  window.__DF_PART4__ = true;

  const $ = (s,r=document)=>r.querySelector(s);

  // Reads VERSION from Part 1 (DF_VERSION). Fallback if not found.
  const VERSION = (window.DF_VERSION || 'v12.0.0');

  // Register the SW and wire messages → update banner
  function registerSW(){
    if (!('serviceWorker' in navigator)) return;

    // Add a tiny UI hook to force “check for updates”
    window.DF_checkForUpdates = async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        await reg?.update();
      } catch {}
    };

    window.addEventListener('load', async ()=>{
      try{
        // Register once; SW will receive VERSION via postMessage
        const reg = await navigator.serviceWorker.register('service-worker.js', { updateViaCache:'none' });

        // As soon as a worker is ready (installing/waiting/active), send the version
        function sendVersionTo(sw){
          try{ sw?.postMessage({type:'SET_VERSION', version: VERSION}); }catch{}
        }
        if (reg.installing) sendVersionTo(reg.installing);
        if (reg.waiting)    sendVersionTo(reg.waiting);
        if (reg.active)     sendVersionTo(reg.active);

        // When a new SW is found, send the version, and wait for install to complete
        reg.addEventListener('updatefound', ()=>{
          const sw = reg.installing;
          if (!sw) return;
          sendVersionTo(sw);
          sw.addEventListener('statechange', ()=>{
            // When it’s installed **and** we already have a controller,
            // there’s an update waiting → show banner.
            if (sw.state === 'installed' && navigator.serviceWorker.controller) {
              window.dispatchEvent(new Event('DF_NEW_VERSION'));
            }
          });
        });

        // SW → page messages
        navigator.serviceWorker.addEventListener('message', (ev)=>{
          const msg = ev.data || {};
          if (msg.type === 'NEW_VERSION_READY') {
            // Trigger banner (Part 3 listens for this event)
            window.dispatchEvent(new Event('DF_NEW_VERSION'));
          }
        });

        // If the page becomes visible again, poll for updates quickly
        document.addEventListener('visibilitychange', ()=>{
          if (document.visibilityState === 'visible') reg.update().catch(()=>{});
        });

        // Hook the banner “Refresh” button to tell SW to activate immediately
        document.addEventListener('click', (e)=>{
          const btn = e.target.closest?.('#update-refresh');
          if (!btn) return;
          // Ask SW to skip waiting, then hard-reload when controller changes
          (async ()=>{
            const reg2 = await navigator.serviceWorker.getRegistration();
            reg2?.waiting?.postMessage({type:'SKIP_WAITING'});
          })().catch(()=>{});
        });

        // When the active controller changes (new SW takes over), reload
        navigator.serviceWorker.addEventListener('controllerchange', ()=>{
          // Make sure we really pick up the fresh bits
          location.reload();
        });

      }catch(e){
        // Non-fatal; app still runs without SW
        console.warn('[SW] registration failed', e);
      }
    });
  }

  registerSW();
})();

/* =========================================================
   Dowson Farms — v12.0.0
   app.js — PART 5: Reports + Feedback (forms & pre-made)
   ========================================================= */
(function DF_APP_P5(){
  'use strict';
  if (window.__DF_APP_P5__) return;
  window.__DF_APP_P5__ = true;

  // ---------- Safe shims (no-op if core already defined) ----------
  const $ = (s, r=document)=>r.querySelector(s);
  const esc = s => String(s??'').replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#39;' }[m]));
  const nl2br = s => esc(s).replace(/\n/g,'<br>');
  const fmt = (n) => (typeof window.fmtCommas==='function' ? window.fmtCommas(n) : (Number(n).toLocaleString?.() ?? String(n)));
  const pretty = (d) => (typeof window.prettyDate==='function' ? window.prettyDate(d) : new Date(d).toLocaleDateString());
  const appEl = ()=> (window.app || document.getElementById('app') || document.body);

  function tile(emoji,label,href){
    if (typeof window.tile === 'function') return window.tile(emoji,label,href);
    return `<a class="tile" href="${href}"><span class="emoji">${emoji}</span><span class="label">${esc(label)}</span></a>`;
  }

  // ---------- LocalStorage helpers ----------
  function lsGet(key, fb){
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fb; } catch { return fb; }
  }
  function lsSet(key, val){
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  }

  // Feedback storage (shared)
  function loadFeedback(){ return lsGet('df_feedback', []); }
  function saveFeedback(entry){
    const list = loadFeedback(); list.push(entry); lsSet('df_feedback', list);
  }

  // Grain-bag data (for pre-made report). Falls back to empty.
  function loadBags(){
    // Support any prior keys you used
    const a = lsGet('df_bags', null);
    const b = lsGet('df_grain_bags', null);
    return Array.isArray(a) ? a : (Array.isArray(b) ? b : []);
  }

  // ---------- REPORTS: Hub ----------
  window.viewReportsHub = function viewReportsHub(){
    appEl().innerHTML = `
      <section class="section">
        <h1>Reports</h1>
        <div class="grid">
          ${tile('📄','Pre-made Reports','#/ai/premade')}
          ${tile('🤖','AI Reports','#/ai/ai')}
          ${tile('📊','Yield Report','#/ai/yield')}
        </div>
        <section class="section" style="margin-top:12px;">
          <h2>🔮 Future</h2>
          <p class="muted">ChatGPT integration to generate & save custom reports is planned.</p>
        </section>
        <div class="section"><a class="btn" href="#/home">Back to Dashboard</a></div>
      </section>
    `;
  };

  // ---------- REPORTS: Pre-made picker ----------
  window.viewReportsPremade = function viewReportsPremade(){
    appEl().innerHTML = `
      <section class="section">
        <h1>Pre-made Reports</h1>
        <div class="grid">
          ${tile('🧾','Feedback Summary','#/ai/premade/feedback')}
          ${tile('🧺','Grain Bag Report','#/ai/premade/grain-bags')}
        </div>
        <div class="section"><a class="btn" href="#/ai">Back to Reports</a></div>
      </section>
    `;
  };

  // ---------- REPORTS: Feedback Summary ----------
  window.viewReportsPremadeFeedback = function viewReportsPremadeFeedback(){
    const items = loadFeedback().sort((a,b)=> (a.ts||0)-(b.ts||0));
    const rows = items.map((it,i)=>{
      const when = it.date ? it.date : (it.ts ? new Date(it.ts).toLocaleString() : '');
      const kind = it.type==='feature' ? 'Feature' : 'Error';
      const subj = esc(it.subject||'');
      const dets = nl2br(it.details||'');
      const by   = esc(it.by||'');
      const main = esc(it.main||'');
      const sub  = esc(it.sub||'');
      const cat  = esc(it.category||'');
      return `<tr>
        <td>${i+1}</td>
        <td>${when}</td>
        <td>${kind}</td>
        ${main||sub||cat ? `<td>${main}</td><td>${sub}</td><td>${cat}</td>` : ''}
        <td>${subj}</td>
        <td>${dets}</td>
        <td>${by}</td>
      </tr>`;
    }).join('');

    // Include Main/Sub/Category columns only if at least one record has them
    const hasMSC = items.some(x => x && (x.main || x.sub || x.category));

    appEl().innerHTML = `
      <section class="report-page">
        <header class="report-head">
          <div class="head-left">
            <img src="icons/logo.png" alt="Dowson Farms" class="report-logo">
            <div class="org">
              <div class="org-name">Dowson Farms</div>
              <div class="org-sub">Pre-Made Report</div>
            </div>
          </div>
          <div class="head-right">
            <div class="r-title">Feedback Summary</div>
            <div class="r-date">${pretty(new Date())}</div>
          </div>
        </header>

        <div class="report-body watermark">
          ${items.length ? `
          <table class="report-table">
            <thead>
              <tr>
                <th>#</th>
                <th>When</th>
                <th>Type</th>
                ${hasMSC ? '<th>Main</th><th>Sub</th><th>Category</th>' : ''}
                <th>Subject</th>
                <th>Details</th>
                <th>Submitted By</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>` : `<p class="muted">No feedback saved yet.</p>`}
        </div>

        <footer class="report-foot">
          <div>${typeof window.displayVersion==='function' ? window.displayVersion(window.APP_VERSION||'v12.0.0') : (window.APP_VERSION||'v12.0.0')}</div>
          <div class="page-num">Page 1</div>
        </footer>

        <div class="report-actions hidden-print">
          <button class="btn-primary" id="print-report">Print / Save PDF</button>
          <a class="btn" href="#/ai/premade">Back</a>
        </div>
      </section>
    `;
    $('#print-report')?.addEventListener('click', ()=>window.print());
  };

  // ---------- REPORTS: Grain Bag Report (group by location) ----------
  window.viewReportsPremadeGrainBags = function viewReportsPremadeGrainBags(){
    const bags = loadBags();
    const byLoc = {};
    for (const b of bags) {
      const loc = b?.location || 'Unspecified';
      (byLoc[loc] ||= []).push(b);
    }

    let grandTotal = 0;
    const sections = Object.keys(byLoc).sort().map(loc=>{
      const rows = byLoc[loc].map(b=>{
        const bus = Number(b?.bushels||0); grandTotal += bus;
        return `<tr>
          <td>${esc(b?.date||'')}</td>
          <td>${esc(b?.crop||'')}</td>
          <td class="num">${fmt(bus)}</td>
          <td>${esc(b?.notes||'')}</td>
        </tr>`;
      }).join('');

      const locTotal = byLoc[loc].reduce((s,x)=>s + Number(x?.bushels||0), 0);
      return `
        <h3 class="section-head">${esc(loc)}</h3>
        <table class="report-table compact">
          <thead><tr><th>Date</th><th>Crop</th><th class="num">Est. Bu</th><th>Notes</th></tr></thead>
          <tbody>${rows}</tbody>
          <tfoot><tr><td colspan="2" class="num">Subtotal</td><td class="num">${fmt(locTotal)}</td><td></td></tr></tfoot>
        </table>
      `;
    }).join('') || `<p class="muted">No grain bags recorded yet.</p>`;

    appEl().innerHTML = `
      <section class="report-page">
        <header class="report-head">
          <div class="head-left">
            <img src="icons/logo.png" alt="Dowson Farms" class="report-logo">
            <div class="org">
              <div class="org-name">Dowson Farms</div>
              <div class="org-sub">Pre-Made Report</div>
            </div>
          </div>
          <div class="head-right">
            <div class="r-title">Grain Bag Report</div>
            <div class="r-date">${pretty(new Date())}</div>
          </div>
        </header>

        <div class="report-body watermark">
          ${sections}
          ${bags.length ? `
            <div class="grand-total">
              <div><strong>Grand Total (Est. Bushels):</strong> ${fmt(grandTotal)}</div>
              <div class="muted small">Average moisture: (tracking to be added)</div>
            </div>
          `:''}
        </div>

        <footer class="report-foot">
          <div>${typeof window.displayVersion==='function' ? window.displayVersion(window.APP_VERSION||'v12.0.0') : (window.APP_VERSION||'v12.0.0')}</div>
          <div class="page-num">Page 1</div>
        </footer>

        <div class="report-actions hidden-print">
          <button class="btn-primary" id="print-report">Print / Save PDF</button>
          <a class="btn" href="#/ai/premade">Back</a>
        </div>
      </section>
    `;
    $('#print-report')?.addEventListener('click', ()=>window.print());
  };

  // ---------- REPORTS: placeholders for AI / Yield (wired later) ----------
  window.viewReportsAI = window.viewReportsAI || function(){ appEl().innerHTML = `
    <section class="section">
      <h1>AI Reports</h1>
      <p class="muted">Coming soon.</p>
      <a class="btn" href="#/ai">Back to Reports</a>
    </section>`; };

  window.viewReportsYield = window.viewReportsYield || function(){ appEl().innerHTML = `
    <section class="section">
      <h1>Yield Report</h1>
      <p class="muted">Coming soon.</p>
      <a class="btn" href="#/ai">Back to Reports</a>
    </section>`; };

  // ---------- FEEDBACK: Hub ----------
  window.viewFeedbackHub = function viewFeedbackHub(){
    appEl().innerHTML = `
      <section class="section">
        <h1>Feedback</h1>
        <div class="grid">
          ${tile('🛠️','Report Errors','#/feedback/errors')}
          ${tile('💡','New Feature Request','#/feedback/feature')}
          ${tile('🧾','Summary Report','#/ai/premade/feedback')}
        </div>
        <div class="section"><a class="btn" href="#/home">Back to Dashboard</a></div>
      </section>
    `;
  };

  // ---------- FEEDBACK: Report Errors ----------
  window.viewFeedbackErrors = function viewFeedbackErrors(){
    const today = new Date().toISOString().slice(0,10);
    const user = (localStorage.getItem('df_user')||'').trim();
    appEl().innerHTML = `
      <section class="section">
        <h1>🛠️ Report Errors</h1>
        <div class="field"><label class="choice"><input id="err-date" type="date" value="${today}"> <span class="small muted">Date (Required)</span></label></div>
        <div class="field"><input id="err-subj" type="text" placeholder="Subject *"></div>
        <div class="field"><textarea id="err-desc" rows="5" placeholder="What happened? *"></textarea></div>
        <div class="field"><input id="err-by" type="text" placeholder="Submitted by" value="${esc(user)}"></div>
        <button id="err-submit" class="btn-primary">Submit</button> <a class="btn" href="#/feedback">Back to Feedback</a>
      </section>
    `;
    $('#err-submit')?.addEventListener('click', ()=>{
      const date=String($('#err-date').value||'').trim();
      const subject=String($('#err-subj').value||'').trim();
      const details=String($('#err-desc').value||'').trim();
      const by=String($('#err-by').value||'').trim();
      if(!date||!subject||!details){ alert('Please fill the required fields.'); return; }
      saveFeedback({type:'error', date, subject, details, by, ts:Date.now()});
      alert('Thanks! Your error report was saved.'); location.hash='#/feedback';
    });
  };

  // ---------- FEEDBACK: Feature Request ----------
  window.viewFeedbackFeature = function viewFeedbackFeature(){
    const today = new Date().toISOString().slice(0,10);
    const user = (localStorage.getItem('df_user')||'').trim();
    appEl().innerHTML = `
      <section class="section">
        <h1>💡 New Feature Request</h1>
        <div class="field"><label class="choice"><input id="feat-date" type="date" value="${today}"> <span class="small muted">Date (Required)</span></label></div>
        <div class="field"><input id="feat-subj" type="text" placeholder="Feature title *"></div>
        <div class="field"><textarea id="feat-desc" rows="5" placeholder="Describe the idea *"></textarea></div>
        <div class="field"><input id="feat-by" type="text" placeholder="Submitted by" value="${esc(user)}"></div>
        <button id="feat-submit" class="btn-primary">Submit</button> <a class="btn" href="#/feedback">Back to Feedback</a>
      </section>
    `;
    $('#feat-submit')?.addEventListener('click', ()=>{
      const date=String($('#feat-date').value||'').trim();
      const subject=String($('#feat-subj').value||'').trim();
      const details=String($('#feat-desc').value||'').trim();
      const by=String($('#feat-by').value||'').trim();
      if(!date||!subject||!details){ alert('Please fill the required fields.'); return; }
      saveFeedback({type:'feature', date, subject, details, by, ts:Date.now()});
      alert('Thanks! Your feature request was saved.'); location.hash='#/feedback';
    });
  };

  // ---------- Optional: tiny router hooks if your router isn’t wired yet ----------
  // If your central router is already handling these hashes, this is harmless.
  window.addEventListener('hashchange', miniRoute, { passive:true });
  document.addEventListener('DOMContentLoaded', miniRoute, { once:true });
  function miniRoute(){
    const h = location.hash || '#/home';
    if      (h==='#/ai')                       return window.viewReportsHub?.();
    else if (h==='#/ai/premade')               return window.viewReportsPremade?.();
    else if (h==='#/ai/premade/feedback')      return window.viewReportsPremadeFeedback?.();
    else if (h==='#/ai/premade/grain-bags')    return window.viewReportsPremadeGrainBags?.();
    else if (h==='#/ai/ai')                    return window.viewReportsAI?.();
    else if (h==='#/ai/yield')                 return window.viewReportsYield?.();
    else if (h==='#/feedback')                 return window.viewFeedbackHub?.();
    else if (h==='#/feedback/errors')          return window.viewFeedbackErrors?.();
    else if (h==='#/feedback/feature')         return window.viewFeedbackFeature?.();
  }

})(); // end PART 5

/* APP v12 — Part 6: Dashboard tiles + Logout wiring */
(function DF_v12_Part6(){
  'use strict';
  if (window.__DF_V12_P6__) return;
  window.__DF_V12_P6__ = true;

  // --- tiny helpers / shared handles from earlier parts ---
  const $  = (s, r=document)=>r.querySelector(s);
  const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));
  const app = ()=> $('#app');
  const has = (obj, k)=>Object.prototype.hasOwnProperty.call(obj||{}, k);

  // Expose namespace if not present
  window.DF = window.DF || {};
  const NS = window.DF;

  // ======================================================
  // 1) Logout wiring (works with login.html or fallback inline)
  // ======================================================
  function doLogout(){
    try {
      localStorage.removeItem('df_user');
      sessionStorage.clear();
    } catch {}
    fetch('login.html', {method:'HEAD'})
      .then(r=>{
        if (r.ok) location.href = 'login.html';
        else {
          location.hash = '#/login';
          renderLoginInline();
        }
      })
      .catch(()=>{
        location.hash = '#/login';
        renderLoginInline();
      });
  }

  function wireLogout(){
    const btn = $('#logoutBtn') || $$('button, a').find(b=>(b.textContent||'').trim().toLowerCase()==='logout');
    if (!btn) return;
    if (btn.dataset.dfWired==='1') return;
    btn.dataset.dfWired='1';
    btn.addEventListener('click', (e)=>{ e.preventDefault(); doLogout(); });
  }

  // Minimal inline login fallback
  function renderLoginInline(){
    const root = app(); if (!root) return;
    root.innerHTML = `
      <section class="section">
        <h1>Login</h1>
        <div class="field"><input id="li-email" type="email" placeholder="Email"></div>
        <div class="field" style="display:flex;gap:8px;">
          <input id="li-pass" type="password" placeholder="Password" style="flex:1;">
          <button class="btn-primary" id="li-go">Log In</button>
        </div>
      </section>
    `;
    $('#li-go')?.addEventListener('click', ()=>{
      const email = String($('#li-email')?.value||'').trim();
      try { if (email) localStorage.setItem('df_user', email); } catch {}
      location.hash = '#/home';
      if (typeof window.DF?.renderHome === 'function') window.DF.renderHome();
    });
  }

  // Rewire logout on SPA navigation
  window.addEventListener('hashchange', wireLogout, {passive:true});
  document.addEventListener('click', ()=> setTimeout(wireLogout,0), true);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireLogout, {once:true});
  } else {
    wireLogout();
  }

  // ======================================================
  // 2) Dashboard (Home) tiles — emoji/icons from v10.15.1
  // ======================================================
  const TILES = [
    { href:'#/crop',    icon:'🌱', label:'Crop Production' },
    { href:'#/grain',   icon:'🌾', label:'Grain Tracking' },
    { href:'#/equip',   icon:'🚜', label:'Equipment' },
    { href:'#/calc',    icon:'🧮', label:'Calculators' },
    { href:'#/reports', icon:'📊', label:'Reports' },
    { href:'#/team',    icon:'👥', label:'Team / Partners' },
    { href:'#/feedback',icon:'💬', label:'Feedback' },
    { href:'#/settings',icon:'⚙️', label:'Setups / Settings' },
  ];

  function tilesHTML(){
    return `
      <section class="section">
        <h1>Home</h1>
        <div class="df-tiles">
          ${TILES.map(t=>`
            <a class="df-tile" href="${t.href}" aria-label="${t.label}">
              <div class="df-emoji">${t.icon}</div>
              <div class="df-label">${t.label}</div>
            </a>
          `).join('')}
        </div>
      </section>
    `;
  }

  function ensureTileStyles(){
    if ($('#df-tile-styles')) return;
    const css = document.createElement('style');
    css.id = 'df-tile-styles';
    css.textContent = `
      .df-tiles{ display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
      @media (min-width:760px){ .df-tiles{ grid-template-columns:repeat(4,minmax(0,1fr)); } }
      .df-tile{ display:flex; flex-direction:column; align-items:center; justify-content:center;
        text-decoration:none; border:1px solid rgba(0,0,0,.08); border-radius:12px;
        padding:14px 10px; background:#fff; color:inherit; box-shadow:0 1px 0 rgba(0,0,0,.04); }
      .df-tile:active{ transform:scale(.98); }
      .df-emoji{ font-size:28px; line-height:1; margin-bottom:6px; }
      .df-label{ font-weight:600; text-align:center; }
      body{ background:#f7f5e8; }
    `;
    document.head.appendChild(css);
  }

  function renderHome(){
    ensureTileStyles();
    const root = app(); if (!root) return;
    root.innerHTML = tilesHTML();
    wireLogout();
  }

  NS.renderHome = renderHome;

  // ======================================================
  // 3) Router hook for #/home
  // ======================================================
  function route(){
    const h = location.hash || '#/home';
    if (h === '#/home' || h === '#/' || h === '#') {
      renderHome();
      return true;
    }
    return false;
  }
  if (window.DF?.routerHooks) window.DF.routerHooks.push(route);
})();