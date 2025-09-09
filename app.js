// ===== Version =====
const APP_VERSION = 'v10.12';

// ===== Init theme =====
(function applySavedTheme() {
  try {
    const t = localStorage.getItem('df_theme') || 'auto';
    document.documentElement.setAttribute('data-theme', t);
  } catch {}
})();

// ===== Auth =====
function isAuthed(){ try { return localStorage.getItem('df_auth') === '1'; } catch { return false; } }
(function enforceAuth(){
  const here = (location.pathname.split('/').pop() || '').toLowerCase();
  if (!isAuthed() && here !== 'login.html') window.location.replace('login.html');
})();

// ===== Utilities =====
function pad2(n){ return n<10?'0'+n:''+n; }
function formatClock12(d){ let h=d.getHours(), m=d.getMinutes(), ap=h>=12?'PM':'AM'; h=h%12||12; return `${h}:${pad2(m)} ${ap}`; }
function ordinal(n){ const s=['th','st','nd','rd'], v=n%100; return n+(s[(v-20)%10]||s[v]||s[0]); }
function prettyDate(d){ const dow=d.toLocaleString(undefined,{weekday:'long'}); const mo=d.toLocaleString(undefined,{month:'long'}); return `${dow} ${mo} ${ordinal(d.getDate())} ${d.getFullYear()}`; }
function normalizeVersion(v){ const m=String(v||'').trim().replace(/^v/i,''); const p=m.split('.'); return (p[0]||'0')+'.'+(p[1]||'0'); }
function displayVersion(v){ return 'v'+normalizeVersion(v); }
function scrollTopAll(){ try{ if (app?.scrollTo) app.scrollTo({top:0,left:0,behavior:'auto'}); window.scrollTo(0,0);}catch{} }
function fmtCommas(n){ try{ return Number(n).toLocaleString(); }catch{ return String(n); } }
function uuid(){ return Math.random().toString(36).slice(2) + Date.now().toString(36); }
function onlyDigits(s){ return String(s||'').replace(/\D+/g,''); }
function todayStr(){ return new Date().toISOString().slice(0,10); }
function capWord(s){ s=String(s||'').trim(); return s ? s[0].toUpperCase()+s.slice(1).toLowerCase() : ''; }
function capName(s){ return String(s||'').trim().split(/\s+/).map(capWord).join(' '); }
function capTitle(s){ return String(s||'').trim().split(/\s+/).map(capWord).join(' '); }
function userEmail(){ try { return localStorage.getItem('df_user') || ''; } catch { return ''; } }
function looksLikeEmail(e){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e||'').trim()); }

// ===== DOM refs =====
const app = document.getElementById('app');
const crumbs = document.getElementById('breadcrumbs');
const versionEl = document.getElementById('version');
const todayEl = document.getElementById('today');
const clockEl = document.getElementById('clock');
const bannerEl = document.getElementById('update-banner');
const bannerBtn = document.getElementById('update-refresh');

/* =========================================
   PHONE INPUT — improved live formatting
   ========================================= */
function phoneDigitsOnly(val){ return String(val||'').replace(/\D/g,'').slice(0,10); }
function formatPhoneUS(val){
  const d = phoneDigitsOnly(val);
  if (!d) return '';
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0,3)}) ${d.slice(3)}`;
  return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;
}
function bindPhoneAutoFormat(root=document){
  root.querySelectorAll('input[type="tel"]').forEach(inp=>{
    if (inp.dataset._phoneBound === '1') return;
    inp.dataset._phoneBound = '1';
    let lastDigits = phoneDigitsOnly(inp.value || '');
    inp.value = formatPhoneUS(lastDigits);
    inp.addEventListener('input', ()=>{
      const digits = phoneDigitsOnly(inp.value);
      lastDigits = digits;
      inp.value = formatPhoneUS(digits);
      try { inp.setSelectionRange(inp.value.length, inp.value.length); } catch {}
      inp.dataset.cleanPhone = digits;
    });
    inp.addEventListener('blur', ()=>{
      const digits = phoneDigitsOnly(inp.value);
      inp.value = formatPhoneUS(digits);
      inp.dataset.cleanPhone = digits;
    });
  });
}

/* =========================================
   INVITE — opens mail draft with login link
   ========================================= */
function inviteMailtoHref(email, name){
  const who = name ? name : 'there';
  const base = location.origin + location.pathname.replace(/index\.html?$/,'');
  const loginUrl = base + 'login.html';
  const subject = encodeURIComponent('Your Dowson Farms account invite');
  const body = encodeURIComponent(
`Hi ${who},

You've been invited to join the Dowson Farms app.

1) Open the login page: ${loginUrl}
2) Sign in with your email (${email})
3) If you haven't set a password yet, choose "Forgot / Set Password" (coming soon) or contact the admin.

— Dowson Farms`
  );
  return `mailto:${encodeURIComponent(email)}?subject=${subject}&body=${body}`;
}

// ===== Layout measures → CSS vars =====
function setCSSVar(name, px){ document.documentElement.style.setProperty(name, `${px}px`); }
function measureBars(){
  const h = document.querySelector('.app-header');
  const c = document.querySelector('.breadcrumbs');
  const f = document.querySelector('.app-footer');
  setCSSVar('--header-h', h ? h.offsetHeight : 52);
  setCSSVar('--crumbs-h', c ? c.offsetHeight : 36);
  setCSSVar('--footer-h', f ? f.offsetHeight : 44);
  const b = document.getElementById('update-banner');
  setCSSVar('--banner-h', (b && !b.hidden) ? b.offsetHeight : 0);
}
function refreshLayout(){ measureBars(); requestAnimationFrame(measureBars); }
['load','resize','orientationchange'].forEach(evt=>window.addEventListener(evt, refreshLayout));

// ===== Tiles =====
function tile(emoji,label,href){
  return `<a class="tile" href="${href}" aria-label="${label}">
    <span class="emoji">${emoji}</span>
    <span class="label">${label}</span>
  </a>`;
}

// ===== Labels for breadcrumbs =====
const LABELS = {
  '#/home':'Home',
  '#/crop':'Crop Production',
  '#/crop/planting':'Planting',
  '#/crop/spraying':'Spraying',
  '#/crop/aerial':'Aerial Spray',
  '#/crop/harvest':'Harvest',
  '#/crop/maintenance':'Field Maintenance',
  '#/crop/scouting':'Scouting',
  '#/crop/trials':'Trials',
  '#/calc':'Calculator',
  '#/calc/fertilizer':'Fertilizer Calculator',
  '#/calc/bin':'Bin Volume Calculator',
  '#/calc/area':'Area Calculator',
  '#/calc/combine':'Combine Yield Calculator',
  '#/calc/chem':'Chemical Mix Sheet',
  '#/equipment':'Equipment',
  '#/equipment/receivers':'StarFire / Technology',
  '#/equipment/tractors':'Tractors',
  '#/equipment/combines':'Combines',
  '#/equipment/sprayer':'Sprayer / Fertilizer Spreader',
  '#/equipment/construction':'Construction Equipment',
  '#/equipment/trucks':'Trucks',
  '#/equipment/trailers':'Trailers',
  '#/equipment/implements':'Farm Implements',
  '#/grain':'Grain Tracking',
  '#/grain/bag':'Grain Bag',
  '#/grain/bins':'Grain Bins',
  '#/grain/contracts':'Grain Contracts',
  '#/grain/tickets':'Grain Ticket OCR',
  '#/team':'Team & Partners',
  '#/team/employees':'Employees',
  '#/team/subcontractors':'Subcontractors',
  '#/team/vendors':'Vendors',
  '#/team/dir':'Directory',
  '#/ai':'Reports',
  '#/ai/premade':'Pre-made Reports',
  '#/ai/premade/feedback':'Feedback Summary',
  '#/ai/premade/grain-bags':'Grain Bag Report',
  '#/ai/ai':'AI Reports',
  '#/ai/yield':'Yield Report',
  '#/settings':'Settings',
  '#/settings/crops':'Crop Type',
  '#/settings/theme':'Theme',
  '#/feedback':'Feedback',
  '#/feedback/errors':'Report Errors',
  '#/feedback/feature':'New Feature Request',
};

// ===== Breadcrumbs =====
function renderBreadcrumb(){
  const hash = location.hash || '#/home';
  if (hash === '#/home' || hash === '') {
    crumbs.innerHTML = `<span aria-current="page">Home</span>`;
    return;
  }
  const parts = hash.split('/').filter(Boolean);
  let trail = [`<a href="#/home">Home</a>`];
  let cur = '#';
  for (let i=1;i<parts.length;i++){
    cur += '/' + parts[i];
    const label = LABELS[cur] || parts[i].replace(/-/g,' ').replace(/\b\w/g, s=>s.toUpperCase());
    if (i < parts.length-1) trail.push(`<a href="${cur}">${label}</a>`);
    else trail.push(`<span aria-current="page">${label}</span>`);
  }
  crumbs.innerHTML = trail.join(' &nbsp;&gt;&nbsp; ');
}

// ===== HOME =====
function viewHome(){
  app.innerHTML = `
    <div class="grid">
      ${tile('🌽','Crop Production','#/crop')}
      ${tile('🔢','Calculator','#/calc')}
      ${tile('🛠️','Field Maintenance','#/crop/maintenance')}
      ${tile('🚜','Equipment','#/equipment')}
      ${tile('📦','Grain Tracking','#/grain')}
      ${tile('🤝','Team & Partners','#/team')}
      ${tile('📊','Reports','#/ai')}
      ${tile('⚙️','Settings','#/settings')}
      ${tile('💬','Feedback','#/feedback')}
    </div>
  `;
}

// ===== Crop Hub =====
function viewCropHub(){
  app.innerHTML = `
    <div class="grid">
      ${tile('🌱','Planting','#/crop/planting')}
      ${tile('🧪','Spraying','#/crop/spraying')}
      ${tile('🚁','Aerial Spray','#/crop/aerial')}
      ${tile('🌾','Harvest','#/crop/harvest')}
      ${tile('🧰','Field Maintenance','#/crop/maintenance')}
      ${tile('🔎','Scouting','#/crop/scouting')}
      ${tile('🧬','Trials','#/crop/trials')}
    </div>
    <div class="section"><a class="btn" href="#/home">Back to Dashboard</a></div>
  `;
}
function viewCropComing(name){
  app.innerHTML = `
    <section class="section">
      <h1>${name}</h1>
      <p>🚧 Coming soon.</p>
      <a class="btn" href="#/crop">Back to Crop Production</a>
    </section>
  `;
}
/* =========================================================
   Part 2/5 — FIELD MAINTENANCE (forms, storage, listing)
   ========================================================= */

/* ---------- Keys ---------- */
const FM_KEY = 'df_field_maint';
const JOB_TYPES_KEY = 'df_job_types';
const FIELD_LIST_KEY = 'df_fields';

/* ---------- JSON helpers (guarded in case already defined in Part 1) ---------- */
if (typeof loadJSON !== 'function') {
  function loadJSON(key, fallback = []) {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch { return fallback; }
  }
}
if (typeof saveJSON !== 'function') {
  function saveJSON(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }
}

/* ---------- Seed data (only if empty) ---------- */
function defaultFields(){
  const existing = loadJSON(FIELD_LIST_KEY);
  if (existing.length) return existing;
  const seed = ['Home Farm', 'North 80', 'South 40', 'River Bottom'];
  saveJSON(FIELD_LIST_KEY, seed);
  return seed;
}
function defaultJobs(){
  const existing = loadJSON(JOB_TYPES_KEY);
  if (existing.length) return existing;
  const seed = ['Tile Hole Repair','Ruts Repair','Tree Removal','Fence Fix'];
  saveJSON(JOB_TYPES_KEY, seed);
  return seed;
}

/* ---------- File -> DataURL helper ---------- */
async function filesToDataURLs(fileList){
  const files = Array.from(fileList||[]);
  const readers = files.map(f => new Promise(res=>{
    const r = new FileReader();
    r.onload = ()=>res(r.result);
    r.readAsDataURL(f);
  }));
  return Promise.all(readers);
}

/* ---------- UI: Field Maintenance ---------- */
function viewFieldMaintenance(){
  const user = (localStorage.getItem('df_user')||'').trim();
  const fields = defaultFields();
  const jobs = defaultJobs();
  const today = todayStr();

  const recent = loadJSON(FM_KEY).slice(0,20).map(r=>{
    const pics = (r.photos||[]).length ? ` • 📷 ${r.photos.length}` : '';
    const statusChip = r.status==='Completed' ? '✅' : (r.status==='In Progress' ? '🟡' : '⏳');
    return `<li class="crop-row">
      <div class="crop-info"><span class="chip">${statusChip} ${r.jobType}</span></div>
      <div class="crop-actions small">${r.location}</div>
      <div style="flex-basis:100%;padding-left:8px;margin-top:6px;">
        <div class="small muted">${r.dateSubmitted} • by ${r.submittedBy||'-'}${pics}</div>
        ${r.status==='Completed' ? `<div class="small muted">Completed ${r.completedDate||''} by ${r.completedBy||''}</div>`:''}
        ${r.notes ? `<div class="small muted">Notes: ${r.notes}</div>`:''}
      </div>
    </li>`;
  }).join('');

  app.innerHTML = `
    <section class="section">
      <h1>🧰 Field Maintenance</h1>

      <div class="field">
        <label style="font-weight:600">Date Submitted <span class="small muted">(Required)</span></label>
        <input id="fm-date" type="date" value="${today}">
      </div>

      <div class="field">
        <label style="font-weight:600">Submitted By <span class="small muted">(defaults to logged in)</span></label>
        <input id="fm-by" type="text" value="${user}">
      </div>

      <div class="field">
        <label style="font-weight:600">Location <span class="small muted">(Required)</span></label>
        <select id="fm-loc">
          <option value="">— Choose —</option>
          ${fields.map(f=>`<option value="${f}">${f}</option>`).join('')}
        </select>
      </div>

      <div class="field">
        <label style="font-weight:600; display:flex; align-items:center; gap:8px;">
          Job Type <span class="small muted">(Required)</span>
          <button id="fm-add-job" class="btn" type="button" title="Add a job type">➕ Add</button>
        </label>
        <select id="fm-job">
          <option value="">— Choose —</option>
          ${jobs.map(j=>`<option value="${j}">${j}</option>`).join('')}
        </select>
      </div>

      <div class="field">
        <label style="font-weight:600">Notes (optional)</label>
        <textarea id="fm-notes" rows="3" placeholder="Add any details…"></textarea>
      </div>

      <div class="field">
        <label style="font-weight:600">Pictures (optional)</label>
        <input id="fm-photos" type="file" accept="image/*" multiple>
      </div>

      <div class="field">
        <label style="font-weight:600">Status</label>
        <select id="fm-status">
          <option>Pending</option>
          <option>In Progress</option>
          <option>Completed</option>
        </select>
      </div>

      <div id="fm-completed-wrap" class="field" style="display:none;">
        <div class="field">
          <label style="font-weight:600">Completed By <span class="small muted">(Required if completed)</span></label>
          <input id="fm-done-by" type="text" placeholder="Name">
        </div>
        <div class="field">
          <label style="font-weight:600">Completed Date <span class="small muted">(Required if completed)</span></label>
          <input id="fm-done-date" type="date" value="${today}">
        </div>
      </div>

      <button id="fm-save" class="btn-primary">Save</button>

      <h2 style="margin-top:14px;">Recent</h2>
      <ul class="crop-list">${recent || '<li class="muted">No maintenance items yet.</li>'}</ul>

      <div class="section">
        <a class="btn" href="#/crop">Back to Crop Production</a>
        <a class="btn" href="#/home">Back to Dashboard</a>
      </div>
    </section>
  `;

  // Add job type
  document.getElementById('fm-add-job')?.addEventListener('click', ()=>{
    const name = capTitle(prompt('New job type name (e.g., Tile Hole Repair):')||'');
    if (!name) return;
    const list = loadJSON(JOB_TYPES_KEY);
    if (!list.find(x=>x.toLowerCase()===name.toLowerCase())) {
      list.push(name); saveJSON(JOB_TYPES_KEY, list);
      viewFieldMaintenance();
    }
  });

  // Completed fields toggle
  const statusSel = document.getElementById('fm-status');
  const doneWrap = document.getElementById('fm-completed-wrap');
  const toggleDone = ()=>{ doneWrap.style.display = (statusSel.value==='Completed') ? '' : 'none'; };
  statusSel.addEventListener('change', toggleDone);
  toggleDone();

  // Save
  document.getElementById('fm-save')?.addEventListener('click', async ()=>{
    const dateSubmitted = String(document.getElementById('fm-date').value||'').trim();
    const submittedBy   = String(document.getElementById('fm-by').value||'').trim();
    const location      = String(document.getElementById('fm-loc').value||'').trim();
    const jobType       = String(document.getElementById('fm-job').value||'').trim();
    const notes         = String(document.getElementById('fm-notes').value||'').trim();
    const status        = String(document.getElementById('fm-status').value||'Pending').trim();

    if (!dateSubmitted || !location || !jobType) {
      alert('Date Submitted, Location, and Job Type are required.');
      return;
    }

    let completedBy='', completedDate='';
    if (status==='Completed') {
      completedBy  = String(document.getElementById('fm-done-by').value||'').trim();
      completedDate= String(document.getElementById('fm-done-date').value||'').trim();
      if (!completedBy || !completedDate) {
        alert('Completed By and Completed Date are required when status is Completed.');
        return;
      }
    }

    const photosInp = document.getElementById('fm-photos');
    let photos = [];
    if (photosInp && photosInp.files && photosInp.files.length) {
      try { photos = await filesToDataURLs(photosInp.files); } catch {}
    }

    const record = {
      id: uuid(),
      dateSubmitted, submittedBy,
      location, jobType, notes,
      status, completedBy, completedDate,
      photos,
      createdAt: new Date().toISOString(),
      createdBy: userEmail()
    };
    const list = loadJSON(FM_KEY);
    list.unshift(record);
    saveJSON(FM_KEY, list);
    alert('Saved.');
    viewFieldMaintenance();
  });
}

/* =======================
   End Part 2/5
   ======================= */
/* =========================================================
   Part 3/5 — PRE-MADE REPORTS (PDF views + shared styles)
   - Feedback Summary (unchanged if you already have it)
   - Grain Bag Report (CORN section then SOYBEANS section)
   - Shared print/letterhead/watermark styles (injected once)
   ========================================================= */

/* ---------- Small helpers (only if not already present) ---------- */
if (typeof fmtCommas !== 'function') {
  function fmtCommas(n){ try{ return Number(n).toLocaleString(); }catch{ return String(n); } }
}
if (typeof loadBags !== 'function') {
  const GRAIN_BAG_KEY='df_grain_bags';
  function loadBags(){ try{ return JSON.parse(localStorage.getItem(GRAIN_BAG_KEY) || '[]'); }catch{ return []; } }
}
if (typeof loadFeedback !== 'function') {
  function loadFeedback(){ try{ return JSON.parse(localStorage.getItem('df_feedback') || '[]'); } catch { return []; } }
}

/* ---------- Inject a shared report stylesheet once ---------- */
function ensureReportStyles(){
  if (document.getElementById('df-report-styles')) return;
  const css = `
    .report-page{max-width:900px;margin:0 auto;padding:12px;}
    .report-head{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #DAA520;padding-bottom:8px;margin-bottom:10px;}
    .report-logo{height:44px;margin-right:10px;}
    .head-left{display:flex;align-items:center;gap:10px;}
    .org-name{font-weight:700;font-size:1.1rem;color:#1B5E20}
    .org-sub{font-size:.9rem;color:#333}
    .r-title{font-weight:700;font-size:1.15rem;text-align:right}
    .r-date{font-size:.9rem;color:#555;text-align:right}
    .report-body{position:relative;min-height:200px;}
    /* darker, always-visible watermark */
    .report-body.watermark::before{
      content:"";
      position:absolute;inset:0;
      background-image:url("icons/logo.png");
      background-repeat:no-repeat;
      background-position:center;
      background-size:380px;
      opacity:.14;               /* a little darker so it's visible */
      pointer-events:none;
      transform:translateZ(0);
    }
    .report-table{width:100%;border-collapse:collapse;font-size:.95rem;margin:8px 0;}
    .report-table th,.report-table td{border:1px solid #ddd;padding:6px 8px;vertical-align:top;}
    .report-table thead th{background:#f6f6f6;font-weight:700}
    .report-table.compact th,.report-table.compact td{padding:5px 6px;}
    .report-table .num{text-align:right}
    .section-head{margin:14px 0 6px 0;border-left:4px solid #1B5E20;padding-left:8px}
    .grand-total{margin-top:12px;padding:10px;border:2px solid #DAA520;border-radius:8px;background:#fffdf5}
    .report-foot{display:flex;justify-content:space-between;align-items:center;border-top:2px solid #DAA520;margin-top:12px;padding-top:6px;font-size:.9rem;color:#333}
    .hidden-print{display:flex;gap:8px;margin-top:10px}
    @media print{
      .hidden-print{display:none !important}
      .app-header,.app-footer,#breadcrumbs{display:none !important}
      body{background:#fff}
      .report-page{margin:0;padding:0}
      /* Keep tables tight and avoid orphan page 2 when content is small */
      .report-table{page-break-inside:auto}
      .report-table tr{page-break-inside:avoid;page-break-after:auto}
      .section-head{page-break-after:avoid}
    }
  `;
  const style = document.createElement('style');
  style.id = 'df-report-styles';
  style.textContent = css;
  document.head.appendChild(style);
}

/* ---------- Reports hub (define only if missing) ---------- */
if (typeof viewReportsPremade !== 'function') {
  function viewReportsPremade(){
    app.innerHTML = `
      <div class="grid">
        ${tile('🧾','Feedback Summary','#/ai/premade/feedback')}
        ${tile('🧺','Grain Bag Report','#/ai/premade/grain-bags')}
      </div>
      <div class="section"><a class="btn" href="#/ai">Back to Reports</a></div>
    `;
  }
}

/* ---------- Feedback Summary (define only if missing) ---------- */
if (typeof viewReportsPremadeFeedback !== 'function') {
  function viewReportsPremadeFeedback(){
    ensureReportStyles();
    const items = loadFeedback().sort((a,b)=> (a.ts||0)-(b.ts||0));
    const rows = items.map((it,i)=>{
      const when = it.date ? it.date : (it.ts ? new Date(it.ts).toLocaleString() : '');
      const kind = it.type==='feature' ? 'Feature' : 'Error';
      const subj = (it.subject||'').replace(/</g,'&lt;');
      const dets = (it.details||'').replace(/</g,'&lt;').replace(/\n/g,'<br>');
      const by   = (it.by||'').replace(/</g,'&lt;');
      return `<tr>
        <td>${i+1}</td>
        <td>${when}</td>
        <td>${kind}</td>
        <td>${subj}</td>
        <td>${dets}</td>
        <td>${by}</td>
      </tr>`;
    }).join('');

    app.innerHTML = `
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
            <div class="r-date">${prettyDate(new Date())}</div>
          </div>
        </header>

        <div class="report-body watermark">
          ${items.length ? `
          <table class="report-table">
            <thead>
              <tr><th>#</th><th>When</th><th>Type</th><th>Subject</th><th>Details</th><th>Submitted By</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>` : `<p class="muted">No feedback saved yet.</p>`}
        </div>

        <footer class="report-foot">
          <div>${displayVersion(APP_VERSION)}</div>
          <div class="page-num">Page 1</div>
        </footer>

        <div class="report-actions hidden-print">
          <button class="btn-primary" id="print-report">Print / Save PDF</button>
          <a class="btn" href="#/ai/premade">Back</a>
        </div>
      </section>
    `;
    document.getElementById('print-report')?.addEventListener('click', ()=>window.print());
  }
}

/* ---------- Grain Bag Report (top=CORN, then=SOYBEANS) ---------- */
/* This redefines the view if it already exists, to match your latest spec */
function viewReportsPremadeGrainBags(){
  ensureReportStyles();

  const all = loadBags();
  const byCrop = { Corn: [], Soybeans: [] };
  for (const b of all) {
    if (String(b.crop).toLowerCase()==='corn') byCrop.Corn.push(b);
    else if (String(b.crop).toLowerCase()==='soybeans') byCrop.Soybeans.push(b);
  }

  function sectionForCrop(cropName, list){
    if (!list.length) {
      return `
        <h3 class="section-head">${cropName}</h3>
        <p class="muted">No ${cropName.toLowerCase()} grain bags.</p>
      `;
    }

    // group by location within the crop (so you still see per-location subtotals)
    const byLoc = {};
    list.forEach(b=>{
      const loc = b.location || 'Unspecified';
      (byLoc[loc] ||= []).push(b);
    });

    let cropTotal = 0;
    const blocks = Object.keys(byLoc).sort().map(loc=>{
      const rows = byLoc[loc].map(b=>{
        const bu = Number(b.bushels||0);
        cropTotal += bu;
        return `<tr>
          <td>${b.date||''}</td>
          <td>${loc}</td>
          <td class="num">${fmtCommas(bu)}</td>
          <td>${(b.notes||'').replace(/</g,'&lt;')}</td>
        </tr>`;
      }).join('');
      const locTotal = byLoc[loc].reduce((s,x)=>s+Number(x.bushels||0),0);
      return `
        <h4 class="section-head" style="margin:10px 0 6px 0;">${loc}</h4>
        <table class="report-table compact">
          <thead><tr><th>Date</th><th>Location</th><th class="num">Est. Bu</th><th>Notes</th></tr></thead>
          <tbody>${rows}</tbody>
          <tfoot><tr><td colspan="2" class="num"><strong>Subtotal</strong></td><td class="num"><strong>${fmtCommas(locTotal)}</strong></td><td></td></tr></tfoot>
        </table>
      `;
    }).join('');

    return `
      <h3 class="section-head">${cropName}</h3>
      ${blocks}
      <div class="grand-total" style="margin-top:8px;">
        <div><strong>${cropName} Total (Est. Bushels):</strong> ${fmtCommas(cropTotal)}</div>
      </div>
    `;
  }

  // overall grand total
  const grandTotal = all.reduce((s,x)=>s+Number(x.bushels||0),0);

  app.innerHTML = `
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
          <div class="r-date">${prettyDate(new Date())}</div>
        </div>
      </header>

      <div class="report-body watermark">
        ${sectionForCrop('Corn', byCrop.Corn)}
        ${sectionForCrop('Soybeans', byCrop.Soybeans)}
        ${all.length ? `
          <div class="grand-total">
            <div><strong>Grand Total (Est. Bushels):</strong> ${fmtCommas(grandTotal)}</div>
            <div class="muted small">Average moisture: (to be added when moisture data is tracked)</div>
          </div>
        ` : `<p class="muted">No grain bags recorded yet.</p>`}
      </div>

      <footer class="report-foot">
        <div>${displayVersion(APP_VERSION)}</div>
        <div class="page-num">Page 1</div>
      </footer>

      <div class="report-actions hidden-print">
        <button class="btn-primary" id="print-report">Print / Save PDF</button>
        <a class="btn" href="#/ai/premade">Back</a>
      </div>
    </section>
  `;
  document.getElementById('print-report')?.addEventListener('click', ()=>window.print());
}

/* =======================
   End Part 3/5
   ======================= */
/* =========================================================
   Part 4/5 — TEAM & PARTNERS ENHANCERS (non-destructive)
   - Safe shims so concatenating parts never breaks existing code
   - Auto phone formatting hookup for any Team forms
   - Minor helpers reused by Directory rendering
   ========================================================= */

/* ---------- Safe shim: fmtPhone (used in Directory) ---------- */
if (typeof fmtPhone !== 'function') {
  function fmtPhone(raw){
    const d = String(raw||'').replace(/\D+/g,'');
    if (d.length !== 10) return raw || '';
    return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;
  }
}

/* ---------- Ensure tel inputs format as (###) ###-#### ---------- */
(function attachPhoneFormatterObserver(){
  if (typeof bindPhoneAutoFormat !== 'function') return; // the main formatter lives in Part 1
  // Bind once now (for whatever is already on screen)
  try { bindPhoneAutoFormat(document); } catch {}

  // Also observe future DOM changes (SPA routes) and bind as needed
  try {
    const mo = new MutationObserver((muts)=>{
      for (const m of muts) {
        if (m.type === 'childList') {
          m.addedNodes && m.addedNodes.forEach(node=>{
            if (node.nodeType === 1) { // Element
              // Bind on subtree to catch any new <input type="tel">
              bindPhoneAutoFormat(node);
            }
          });
        }
      }
    });
    mo.observe(document.getElementById('app') || document.body, { childList: true, subtree: true });
  } catch {}
})();

/* ---------- Optional: normalize saved phone digits on Team saves ----------
   If your Employee/Subcontractor/Vendor forms already store digits-only,
   this does nothing. It simply exposes helpers in case existing code calls them.
--------------------------------------------------------------------------- */
if (typeof phoneDigitsOnly !== 'function') {
  function phoneDigitsOnly(val){ return String(val||'').replace(/\D/g,'').slice(0,10); }
}

/* ---------- Optional: tiny guard to prevent double-binding invites ----------
   If your Employee form already wires #emp-invite, this no-ops gracefully.
--------------------------------------------------------------------------- */
(function guardDuplicateInviteBinding(){
  const root = document;
  // Only attach if the button exists and isn't already bound; this runs on each route naturally,
  // but the dataset flag prevents double wiring.
  const btn = root.getElementById && root.getElementById('emp-invite');
  if (btn && btn.dataset._inviteBound !== '1') {
    btn.dataset._inviteBound = '1';
    // If your real handler is already attached in the view renderer, this does nothing.
    // We keep an empty listener as a safety net.
    btn.addEventListener('click', (e)=>{
      // If the main view already called preventDefault / handled, we don't duplicate any logic.
      // (Intentionally left blank.)
    }, { capture:false });
  }
})();

/* =======================
   End Part 4/5
   ======================= */
/* =========================================================
   Part 5/5 — ROUTER SAFETY + REPORT CSS BACKSTOP + MISC
   - Does NOT replace your router. It only fills gaps safely.
   - Adds backstop routes ONLY if your app has no `route()` function.
   - Ensures labels exist for new menu items.
   - Injects report print/CSS if it wasn’t included earlier.
   ========================================================= */

/* ---------- 1) Ensure LABELS include our new entries ---------- */
(function ensureLabels(){
  try {
    if (!window.LABELS) return; // your file already defines LABELS; we just extend

    if (!LABELS['#/crop/maintenance']) LABELS['#/crop/maintenance'] = 'Field Maintenance';
    if (!LABELS['#/ai/premade/grain-bags']) LABELS['#/ai/premade/grain-bags'] = 'Grain Bag Report';
    if (!LABELS['#/ai/premade/feedback']) LABELS['#/ai/premade/feedback'] = 'Feedback Summary';
  } catch {}
})();

/* ---------- 2) Inject report CSS (only if missing) ------------ */
(function injectReportCssIfMissing(){
  if (document.getElementById('df-report-css')) return;

  const css = `
/* ===== Dowson Reports — Backstop Styles (only if main CSS missing) ===== */
.report-page{ max-width:900px; margin:0 auto; background:#fff; padding:16px 16px 80px; position:relative; }
.report-head{ display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #DAA520; padding-bottom:12px; margin-bottom:14px; }
.report-logo{ height:44px; width:auto; margin-right:10px; }
.head-left{ display:flex; align-items:center; gap:10px; }
.org-name{ font-weight:700; font-size:1.1rem; }
.org-sub{ color:#555; font-size:.9rem; }
.r-title{ font-weight:700; font-size:1.2rem; text-align:right; }
.r-date{ color:#555; font-size:.9rem; text-align:right; }
.report-body{ position:relative; min-height:200px; }
.report-body.watermark::after{
  content:"";
  position:absolute; inset:12% 8% auto 8%;
  background:url('icons/logo.png') no-repeat center/50% auto;
  opacity:.10; pointer-events:none; z-index:0;
  filter:grayscale(1) contrast(1.1);
}
.report-table{ width:100%; border-collapse:collapse; margin:10px 0; position:relative; z-index:1; }
.report-table th, .report-table td{ border:1px solid #ccc; padding:6px 8px; vertical-align:top; }
.report-table th{ background:#f7f7f7; text-align:left; }
.report-table .num{ text-align:right; }
.report-table.compact th, .report-table.compact td{ padding:4px 6px; }
.section-head{ margin:14px 0 6px; font-size:1.05rem; }
.grand-total{ margin-top:12px; font-size:1.05rem; position:relative; z-index:1; }
.report-foot{ position:fixed; left:0; right:0; bottom:0; border-top:2px solid #DAA520; background:#fff;
  display:flex; justify-content:space-between; padding:8px 14px; font-size:.9rem; }
.report-actions{ display:flex; gap:8px; margin-top:14px; position:relative; z-index:1; }

@media print{
  body{ background:#fff !important; }
  .app-header, .breadcrumbs, .app-footer, #update-banner, .hidden-print{ display:none !important; }
  .report-foot{ position:fixed; }
  .report-page{ padding-bottom:100px; }
}
  `.trim();

  const style = document.createElement('style');
  style.id = 'df-report-css';
  style.textContent = css;
  document.head.appendChild(style);
})();

/* ---------- 3) Backstop router ONLY if you don’t have one ----- */
(function addBackstopRouter(){
  // If your main file already declared route(), we do nothing.
  if (typeof window.route === 'function') return;

  function softRender(fn){
    try{
      if (typeof renderBreadcrumb === 'function') renderBreadcrumb();
      fn && fn();
      if (typeof scrollTopAll === 'function') scrollTopAll();
      if (typeof refreshLayout === 'function') refreshLayout();
      if (typeof bindPhoneAutoFormat === 'function') bindPhoneAutoFormat(document.getElementById('app')||document);
    }catch(e){ console.error('Backstop route render error', e); }
  }

  function tinyRouter(){
    const h = location.hash || '#/home';
    // Only handle the two new routes + fallbacks that this patch introduced.
    if (h === '#/crop/maintenance' && typeof window.viewFieldMaintenance === 'function') {
      softRender(()=>viewFieldMaintenance());
      return;
    }
    if (h === '#/ai/premade/grain-bags' && typeof window.viewReportsPremadeGrainBags === 'function') {
      softRender(()=>viewReportsPremadeGrainBags());
      return;
    }
    if (h === '#/ai/premade/feedback' && typeof window.viewReportsPremadeFeedback === 'function') {
      softRender(()=>viewReportsPremadeFeedback());
      return;
    }
    // If nothing matched, we leave your current screen alone.
  }

  window.addEventListener('hashchange', tinyRouter);
  window.addEventListener('load', tinyRouter);
})();

/* ---------- 4) Print buttons: generic delegate (safe) --------- */
(function attachPrintDelegate(){
  document.addEventListener('click', (e)=>{
    const btn = e.target && e.target.closest && e.target.closest('#print-report');
    if (!btn) return;
    try { window.print(); } catch {}
  });
})();

/* ---------- 5) Version footer consistency (safe) -------------- */
(function ensureVersionFooter(){
  try {
    const el = document.getElementById('version');
    if (el && typeof displayVersion === 'function' && typeof APP_VERSION === 'string') {
      el.textContent = displayVersion(APP_VERSION);
    }
  } catch {}
})();

/* =======================
   End Part 5/5
   ======================= */