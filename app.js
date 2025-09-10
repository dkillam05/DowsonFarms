/* ============================================================================
   Dowson Farms — Web App (v11.0.0)
   app.js — PART 1 of N  (Core boot, utilities, layout, nav chrome, Home/Crop)
   ----------------------------------------------------------------------------
   Contents in this part:
     • Version + early theme apply
     • Auth gate (localStorage stub)
     • Small utilities (dates, ids, formatting)
     • DOM refs + safe hash boot
     • Phone input formatter (US)
     • “Invite” mailto link builder
     • Layout measurement → CSS vars
     • Tile helper
     • Route labels + Breadcrumbs renderer
     • Home + Crop hub (lightweight)
   Notes:
     - Parts 2..N will add feature views (Grain, Calculators, Team, Settings…),
       router, update banner, SW hooks, etc.
     - Keep this file loaded BEFORE other app.js parts.
   ========================================================================== */

/* ===== Version (footer shows vMAJOR.MINOR) ===== */
const APP_VERSION = 'v11.0.2';

/* ===== Init theme asap (auto/light/dark) ===== */
(function applySavedTheme() {
  try {
    const t = localStorage.getItem('df_theme') || 'auto';
    document.documentElement.setAttribute('data-theme', t);
  } catch {}
})();

/* ===== Auth (invite-only placeholder) ===== */
function isAuthed() {
  try { return localStorage.getItem('df_auth') === '1'; } catch { return false; }
}
(function enforceAuth() {
  const here = (location.pathname.split('/').pop() || '').toLowerCase();
  if (!isAuthed() && here !== 'login.html') window.location.replace('login.html');
})();

/* ===== Small Utilities ===== */
function pad2(n){ return n<10 ? '0'+n : ''+n; }
function formatClock12(d){
  let h = d.getHours(), m = d.getMinutes(), ap = h>=12 ? 'PM':'AM';
  h = h%12 || 12; return `${h}:${pad2(m)} ${ap}`;
}
function ordinal(n){ const s=['th','st','nd','rd'], v=n%100; return n+(s[(v-20)%10]||s[v]||s[0]); }
function prettyDate(d){
  const dow=d.toLocaleString(undefined,{weekday:'long'});
  const mo=d.toLocaleString(undefined,{month:'long'});
  return `${dow} ${mo} ${ordinal(d.getDate())} ${d.getFullYear()}`;
}
function normalizeVersion(v){
  const m=String(v||'').trim().replace(/^v/i,''); const p=m.split('.');
  return (p[0]||'0')+'.'+(p[1]||'0');
}
function displayVersion(v){ return 'v'+normalizeVersion(v); }
function scrollTopAll(){ try{ if(app?.scrollTo) app.scrollTo({top:0,left:0,behavior:'auto'}); window.scrollTo(0,0);}catch{} }
function fmtCommas(n){ try{ return Number(n).toLocaleString(); }catch{ return String(n); } }
function uuid(){ return Math.random().toString(36).slice(2) + Date.now().toString(36); }
function onlyDigits(s){ return String(s||'').replace(/\D+/g,''); }
function todayStr(){ return new Date().toISOString().slice(0,10); }
function capWord(s){ s=String(s||'').trim(); return s ? s[0].toUpperCase()+s.slice(1).toLowerCase() : ''; }
function capName(s){ return String(s||'').trim().split(/\s+/).map(capWord).join(' '); }
function capTitle(s){ return String(s||'').trim().split(/\s+/).map(capWord).join(' '); }
function userEmail(){ try { return localStorage.getItem('df_user') || ''; } catch { return ''; } }
function looksLikeEmail(e){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e||'').trim()); }

/* ===== DOM refs ===== */
const app       = document.getElementById('app');
const crumbs    = document.getElementById('breadcrumbs');
const versionEl = document.getElementById('version');
const todayEl   = document.getElementById('today');
const clockEl   = document.getElementById('clock');
const bannerEl  = document.getElementById('update-banner');
const bannerBtn = document.getElementById('update-refresh');

/* ===== Ensure we always have a hash (prevents blank page if none) ===== */
function ensureHomeHash() {
  if (!location.hash || location.hash === '#') {
    location.replace('#/home');
  }
}

/* =========================================
   PHONE INPUT — improved live formatting (US)
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

    // initialize display
    inp.value = formatPhoneUS(phoneDigitsOnly(inp.value || ''));

    inp.addEventListener('input', ()=>{
      const digits = phoneDigitsOnly(inp.value);
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

You've been invited to join the Dowson Farms app (v11).

1) Open the login page: ${loginUrl}
2) Sign in with your email (${email})
3) If you haven't set a password yet, choose "Forgot / Set Password" (coming soon) or contact the admin.

— Dowson Farms`
  );
  return `mailto:${encodeURIComponent(email)}?subject=${subject}&body=${body}`;
}

/* ===== Layout measures → CSS vars ===== */
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

/* ===== Tiles ===== */
function tile(emoji,label,href){
  return `<a class="tile" href="${href}" aria-label="${label}">
    <span class="emoji">${emoji}</span>
    <span class="label">${label}</span>
  </a>`;
}

/* ===== Labels for breadcrumbs ===== */
const LABELS = {
  '#/home':'Home',
  // Crop Production
  '#/crop':'Crop Production',
  '#/crop/planting':'Planting',
  '#/crop/spraying':'Spraying',
  '#/crop/aerial':'Aerial Spray',
  '#/crop/harvest':'Harvest',
  '#/crop/maintenance':'Field Maintenance',
  '#/crop/scouting':'Scouting',
  '#/crop/trials':'Trials',

  // Calculators
  '#/calc':'Calculator',
  '#/calc/fertilizer':'Fertilizer Calculator',
  '#/calc/bin':'Bin Volume Calculator',
  '#/calc/area':'Area Calculator',
  '#/calc/combine':'Combine Yield Calculator',
  '#/calc/chem':'Chemical Mix Sheet',

  // Equipment
  '#/equipment':'Equipment',
  '#/equipment/receivers':'StarFire / Technology',
  '#/equipment/tractors':'Tractors',
  '#/equipment/combines':'Combines',
  '#/equipment/sprayer':'Sprayer / Fertilizer Spreader',
  '#/equipment/construction':'Construction Equipment',
  '#/equipment/trucks':'Trucks',
  '#/equipment/trailers':'Trailers',
  '#/equipment/implements':'Farm Implements',

  // Grain Tracking
  '#/grain':'Grain Tracking',
  '#/grain/bag':'Grain Bag',
  '#/grain/bins':'Grain Bins',
  '#/grain/contracts':'Grain Contracts',
  '#/grain/tickets':'Grain Ticket OCR',

  // Team & Partners
  '#/team':'Team & Partners',
  '#/team/employees':'Employees',
  '#/team/subcontractors':'Subcontractors',
  '#/team/vendors':'Vendors',
  '#/team/dir':'Directory',

  // Reports
  '#/ai':'Reports',
  '#/ai/premade':'Pre-made Reports',
  '#/ai/premade/feedback':'Feedback Summary',
  '#/ai/premade/grain-bags':'Grain Bag Report',
  '#/ai/ai':'AI Reports',
  '#/ai/yield':'Yield Report',

  // Settings
  '#/settings':'Settings',
  '#/settings/crops':'Crop Type',
  '#/settings/theme':'Theme',
  '#/settings/farms':'Farms',
  '#/settings/fields':'Fields',

  // Feedback
  '#/feedback':'Feedback',
  '#/feedback/errors':'Report Errors',
  '#/feedback/feature':'New Feature Request',
};

/* ===== Breadcrumbs ===== */
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

/* ===== HOME ===== */
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

/* =========================
   Crop Production (hub + placeholder)
   ========================= */
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

/* ===== Footer text + clock (wire basic footer fields early) ===== */
if (versionEl) versionEl.textContent = displayVersion(APP_VERSION);
if (todayEl) todayEl.textContent = prettyDate(new Date());
function __tickClock(){ if (clockEl) clockEl.textContent = formatClock12(new Date()); }
__tickClock(); setInterval(__tickClock, 15000);

/* ===== Expose a tiny safe shim that later parts can rely on ===== */
window.__DF_CORE_READY__ = true;

/* ============================================================================
   app.js — PART 2 of N (v11.0.0)
   Field Maintenance (FULL) — storage, defaults, image capture, UI
   - Relies on Part 1 utilities (todayStr, fmtCommas, uuid, userEmail, etc.)
   ========================================================================== */

/* ---------- LocalStorage helpers (guarded) ---------- */
if (typeof loadJSON !== 'function') {
  function loadJSON(key, fallback = []) {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch { return fallback; }
  }
}
if (typeof saveJSON !== 'function') {
  function saveJSON(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  }
}

/* ---------- Keys ---------- */
const FM_KEY         = 'df_field_maint';
const JOB_TYPES_KEY  = 'df_job_types';
const FIELD_LIST_KEY = 'df_fields';

/* ---------- Defaults (seed once) ---------- */
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

/* ---------- Image helpers ---------- */
async function filesToDataURLs(fileList){
  const files = Array.from(fileList||[]);
  const readers = files.map(f => new Promise(res=>{
    const r = new FileReader();
    r.onload = ()=>res(r.result);
    r.readAsDataURL(f);
  }));
  return Promise.all(readers);
}

/* =========================
   Field Maintenance (FULL)
   ========================= */
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
        ${r.notes ? `<div class="small muted">Notes: ${r.notes.replace(/</g,'&lt;')}</div>`:''}
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

  // ensure phone auto-format in case inputs are added later
  try { bindPhoneAutoFormat(app); } catch {}
}

/* ============================================================================
   app.js — PART 3 of N (v11.0.0)
   Calculators: Hub + Combine Yield + Fertilizer + Bin Volume + Area + Chem Mix
   - Self-contained; relies on Part 1 utilities (fmtCommas, todayStr, etc.)
   ========================================================================== */

/* ---------- Tiny local helpers (safe) ---------- */
function _num(v){ const n = Number(String(v||'').replace(/,/g,'')); return Number.isFinite(n) ? n : 0; }
function _html(s){ return String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#39;'}[m])); }

/* =========================
   Calculators — HUB
   ========================= */
function viewCalcHub(){
  app.innerHTML = `
    <div class="grid">
      ${tile('🌽🌱','Combine Yield','#/calc/combine')}
      ${tile('🛢️','Bin Volume','#/calc/bin')}
    </div>
    <div class="grid" style="margin-top:12px;">
      ${tile('👨🏼‍🔬','Fertilizer','#/calc/fertilizer')}
      ${tile('🧪','Chemical Mix','#/calc/chem')}
    </div>
    <div class="grid" style="grid-template-columns:1fr;max-width:380px;margin:12px auto 0;">
      ${tile('📐','Area','#/calc/area')}
    </div>
    <div class="section"><a class="btn" href="#/home">Back to Dashboard</a></div>
  `;
}

/* =========================
   Combine Yield Calculator
   - Inputs: Crop, Wet Weight (lb), Moisture %, Length (ft), Header Width (ft)
   - Auto: Dry Basis %, Test Wt (lb/bu) per crop
   - Acres = Length × Header ÷ 43,560
   - Outputs: Wet bu, Adjusted (dry) bu, bu/ac (true shrink & elevator model)
   ========================= */
function viewCalcCombine(){
  const PRESETS = {
    Corn:     { base: 15.5, lbbu: 56, emoji:'🌽' },
    Soybeans: { base: 13.0, lbbu: 60, emoji:'🫘' }
  };
  const cropOpts = Object.keys(PRESETS).map(c=>`<option value="${c}">${c}</option>`).join('');

  app.innerHTML = `
    <section class="section">
      <h1>🌽🌱 Combine Yield Calculator</h1>

      <div class="calc-grid">
        <label><span class="small muted">Crop</span>
          <select id="cy-crop">${cropOpts}</select>
        </label>

        <label><span class="small muted">Wet Weight (lb) *</span>
          <input id="cy-wet" type="number" step="any" placeholder="e.g., 54,000">
        </label>

        <label><span class="small muted">Moisture % *</span>
          <input id="cy-moist" type="number" step="any" placeholder="e.g., 18">
        </label>

        <label><span class="small muted">Length (ft) *</span>
          <input id="cy-length" type="number" step="any" placeholder="Feet harvested">
        </label>

        <label><span class="small muted">Header Width *</span>
          <select id="cy-width">
            <option value="30">30’</option>
            <option value="35">35’</option>
            <option value="40" selected>40’</option>
            <option value="45">45’</option>
          </select>
        </label>

        <label><span class="small muted">Dry Basis % (auto)</span>
          <input id="cy-base" type="number" step="any" placeholder="Corn 15.5 / Soy 13.0">
        </label>

        <label><span class="small muted">lb / bu (auto)</span>
          <input id="cy-lbbu" type="number" step="any" placeholder="Corn 56 / Soy 60">
        </label>
      </div>

      <div class="small muted" style="margin-top:6px;">
        Leave “Dry Basis %” and “lb/bu” blank to auto-fill by crop. Acres = Length × Header ÷ 43,560.
      </div>

      <div class="calc-actions">
        <button id="cy-go" class="btn-primary">Calculate</button>
        <a class="btn" href="#/calc">Back</a>
        <a class="btn" href="#/home">Dashboard</a>
      </div>

      <div id="cy-out" class="result-card" style="display:none;"></div>
    </section>
  `;

  const cropSel = document.getElementById('cy-crop');
  const baseInp = document.getElementById('cy-base');
  const lbbuInp = document.getElementById('cy-lbbu');

  function fillDefaults(){
    const p = PRESETS[cropSel.value];
    if (!baseInp.value) baseInp.value = p.base;
    if (!lbbuInp.value) lbbuInp.value = p.lbbu;
  }
  cropSel.addEventListener('change', fillDefaults);
  fillDefaults();

  function elevatorShrinkPct(moist, base){
    if (moist <= base) return 0;
    const maxM = 29;   // clamp range
    const maxS = 21;   // 21% at 29% moisture
    if (moist >= maxM) return maxS;
    const slope = maxS / (maxM - base);
    return slope * (moist - base);
  }

  document.getElementById('cy-go').addEventListener('click', ()=>{
    const crop   = cropSel.value;
    const wetLb  = _num(document.getElementById('cy-wet').value);
    const moist  = _num(document.getElementById('cy-moist').value);
    const lenFt  = _num(document.getElementById('cy-length').value);
    const headFt = _num(document.getElementById('cy-width').value);
    const base   = _num(baseInp.value || PRESETS[crop].base);
    const lbbu   = _num(lbbuInp.value || PRESETS[crop].lbbu);

    if (!wetLb || !moist || !lenFt || !headFt){
      alert('Enter Wet Weight, Moisture, Length and Header Width.');
      return;
    }

    const acres = (lenFt * headFt) / 43560;
    if (acres <= 0){ alert('Calculated acres <= 0. Check length/header width.'); return; }

    const wetBu = wetLb / lbbu;

    // True shrink
    const dryFactor = (100 - moist) / (100 - base);
    const trueBu = wetBu * dryFactor;
    const trueYield = trueBu / acres;
    const trueShrinkPct = (1 - dryFactor) * 100;

    // Elevator shrink
    const elevPct = elevatorShrinkPct(moist, base);
    const elevBu = wetBu * (1 - elevPct/100);
    const elevYield = elevBu / acres;

    const out = document.getElementById('cy-out');
    out.style.display = '';
    out.innerHTML = `
      <div><strong>Crop:</strong> ${PRESETS[crop].emoji} ${crop}</div>
      <div class="calc-row">
        <div><strong>Acres (calc):</strong> ${acres.toFixed(3)}</div>
        <div><strong>Wet Bushels:</strong> ${fmtCommas(wetBu.toFixed(2))}</div>
        <div><strong>Test Wt:</strong> ${lbbu} lb/bu</div>
        <div><strong>Dry Basis:</strong> ${base}%</div>
      </div>
      <hr style="border:none;border-top:1px solid rgba(0,0,0,.12);margin:10px 0;">
      <div class="calc-row" style="gap:18px;flex-wrap:wrap;">
        <div>
          <h3 style="margin:0 0 6px;">True Shrink</h3>
          <div><strong>Adj. Bushels:</strong> ${fmtCommas(trueBu.toFixed(2))}</div>
          <div><strong>Yield:</strong> ${fmtCommas(trueYield.toFixed(1))} bu/ac</div>
          <div class="small muted">Shrink ≈ ${trueShrinkPct.toFixed(1)}% (to ${base}%).</div>
        </div>
        <div>
          <h3 style="margin:0 0 6px;">Elevator Shrink</h3>
          <div><strong>Adj. Bushels:</strong> ${fmtCommas(elevBu.toFixed(2))}</div>
          <div><strong>Yield:</strong> ${fmtCommas(elevYield.toFixed(1))} bu/ac</div>
          <div class="small muted">Prorated elevator shrink ≈ ${elevPct.toFixed(1)}%.</div>
        </div>
      </div>
    `;
    window.scrollTo({ top: document.body.scrollHeight, behavior:'smooth' });
  });
}

/* =========================
   Fertilizer Calculator
   - Inputs: Nutrient (label), Target lb/ac, Analysis %, Density (lb/gal), Acres
   - Outputs: Product lb/ac, gal/ac, totals
   ========================= */
function viewCalcFertilizer(){
  const KEY='df_calc_fert';
  const s = (function(){ try{ return JSON.parse(localStorage.getItem(KEY)||'{}'); }catch{ return {}; } })();

  app.innerHTML = `
    <section class="section">
      <h1>👨🏼‍🔬 Fertilizer Calculator</h1>
      <div class="calc-grid">
        <label><span class="small muted">Nutrient</span>
          <select id="f-nutrient">
            <option ${s.nutrient==='N'?'selected':''}>N</option>
            <option ${s.nutrient==='P₂O₅'?'selected':''}>P₂O₅</option>
            <option ${s.nutrient==='K₂O'?'selected':''}>K₂O</option>
          </select>
        </label>
        <label><span class="small muted">Target lb/acre *</span>
          <input id="f-target" type="number" step="any" value="${_html(s.target||'')}">
        </label>
        <label><span class="small muted">Product Analysis % *</span>
          <input id="f-analysis" type="number" step="any" value="${_html(s.analysis||'')}" placeholder="e.g., 32">
        </label>
        <label><span class="small muted">Density (lb/gal)</span>
          <select id="f-density">
            <option value="11.06" ${String(s.density||'11.06')==='11.06'?'selected':''}>UAN 32 (11.06)</option>
            <option value="10.67" ${String(s.density)==='10.67'?'selected':''}>UAN 28 (10.67)</option>
            <option value="8.34"  ${String(s.density)==='8.34'?'selected':''}>Water (8.34)</option>
            <option value="${_html(s.density||'11.06')}" ${!['11.06','10.67','8.34'].includes(String(s.density))?'selected':''}>Custom (${_html(s.density||'11.06')})</option>
          </select>
        </label>
        <label><span class="small muted">Acres *</span>
          <input id="f-acres" type="number" step="any" value="${_html(s.acres||'')}">
        </label>
      </div>

      <div class="calc-actions">
        <button id="f-go" class="btn-primary">Calculate</button>
        <a class="btn" href="#/calc">Back</a>
        <a class="btn" href="#/home">Dashboard</a>
      </div>

      <div id="f-out" class="result-card" style="display:none;"></div>
    </section>
  `;

  document.getElementById('f-go').addEventListener('click', ()=>{
    const payload = {
      nutrient: document.getElementById('f-nutrient').value,
      target:   _num(document.getElementById('f-target').value),
      analysis: _num(document.getElementById('f-analysis').value),
      density:  _num(document.getElementById('f-density').value||'11.06'),
      acres:    _num(document.getElementById('f-acres').value)
    };
    try{ localStorage.setItem(KEY, JSON.stringify(payload)); }catch{}

    const {target,analysis,density,acres} = payload;
    if (!target || !analysis || !acres || analysis<=0 || analysis>100){
      alert('Enter valid Target, Analysis (1–100) and Acres.'); return;
    }
    const frac = analysis/100;
    const lbA  = target/frac;
    const galA = lbA/(density||1);

    const out = document.getElementById('f-out');
    out.style.display='';
    out.innerHTML = `
      <div><strong>Product lb/acre:</strong> ${fmtCommas(lbA.toFixed(2))}</div>
      <div><strong>Product gal/acre:</strong> ${fmtCommas(galA.toFixed(2))}</div>
      <div><strong>Total lbs:</strong> ${fmtCommas((lbA*acres).toFixed(0))}</div>
      <div><strong>Total gal:</strong> ${fmtCommas((galA*acres).toFixed(1))}</div>
      <div class="small muted" style="margin-top:6px;">Density affects gal/acre; analysis drives lb/acre.</div>
    `;
  });
}

/* =========================
   Bin Volume Calculator
   - Cylinder + optional cone (roof)
   - Outputs: ft³, bu, weight (lb)
   ========================= */
function viewCalcBin(){
  const KEY='df_calc_bin';
  const s = (function(){ try{ return JSON.parse(localStorage.getItem(KEY)||'{}'); }catch{ return {}; } })();

  app.innerHTML = `
    <section class="section">
      <h1>🛢️ Bin Volume Calculator</h1>

      <div class="calc-grid">
        <label><span class="small muted">Diameter (ft) *</span>
          <input id="b-d" type="number" step="any" value="${_html(s.d||'')}">
        </label>
        <label><span class="small muted">Grain Depth (ft) *</span>
          <input id="b-h" type="number" step="any" value="${_html(s.h||'')}">
        </label>
        <label><span class="small muted">Roof</span>
          <select id="b-roof">
            <option value="flat" ${(!s.roof||s.roof==='flat')?'selected':''}>Flat/Simplified</option>
            <option value="cone" ${s.roof==='cone'?'selected':''}>Cone (add rise)</option>
          </select>
        </label>
        <label id="b-rise-wrap" style="display:${s.roof==='cone'?'block':'none'};"><span class="small muted">Cone Rise (ft)</span>
          <input id="b-rise" type="number" step="any" value="${_html(s.rise||'')}">
        </label>
        <label><span class="small muted">Crop</span>
          <select id="b-crop">
            <option ${(!s.crop||s.crop==='Corn')?'selected':''}>Corn</option>
            <option ${s.crop==='Soybeans'?'selected':''}>Soybeans</option>
            <option ${s.crop==='Custom'?'selected':''}>Custom</option>
          </select>
        </label>
        <label><span class="small muted">lb / bu</span>
          <input id="b-lbbu" type="number" step="any" value="${_html(s.lbbu||'56')}">
        </label>
        <label><span class="small muted">ft³ / bu</span>
          <input id="b-buft3" type="number" step="any" value="${_html(s.buft3||'1.244')}">
        </label>
      </div>

      <div class="calc-actions">
        <button id="b-go" class="btn-primary">Calculate</button>
        <a class="btn" href="#/calc">Back</a>
        <a class="btn" href="#/home">Dashboard</a>
      </div>

      <div id="b-out" class="result-card" style="display:none;"></div>
    </section>
  `;

  document.getElementById('b-roof').addEventListener('change', ()=>{
    document.getElementById('b-rise-wrap').style.display =
      (document.getElementById('b-roof').value==='cone') ? 'block' : 'none';
  });
  document.getElementById('b-crop').addEventListener('change', ()=>{
    const v = document.getElementById('b-crop').value;
    if (v==='Corn') document.getElementById('b-lbbu').value = '56';
    else if (v==='Soybeans') document.getElementById('b-lbbu').value = '60';
  });

  document.getElementById('b-go').addEventListener('click', ()=>{
    const d=_num(document.getElementById('b-d').value);
    const h=_num(document.getElementById('b-h').value);
    const roof=document.getElementById('b-roof').value;
    const rise=_num(document.getElementById('b-rise')?.value||0);
    const lbbu=_num(document.getElementById('b-lbbu').value||56);
    const buft3=_num(document.getElementById('b-buft3').value||1.244);

    try{ localStorage.setItem(KEY, JSON.stringify({
      d,h,roof,rise,crop:document.getElementById('b-crop').value,lbbu,buft3
    })); }catch{}

    if(!d||!h||!lbbu||!buft3){ alert('Enter Diameter, Depth, lb/bu, ft³/bu.'); return; }
    const r=d/2;
    const volCyl = Math.PI*r*r*h;
    const volCone = roof==='cone' && rise>0 ? (Math.PI*r*r*rise)/3 : 0;
    const vol = volCyl + volCone;
    const bu = vol / buft3;
    const wt = bu * lbbu;

    const out=document.getElementById('b-out'); out.style.display='';
    out.innerHTML = `
      <div><strong>Volume (ft³):</strong> ${fmtCommas(vol.toFixed(0))}</div>
      <div><strong>Bushels:</strong> ${fmtCommas(bu.toFixed(0))}</div>
      <div><strong>Estimated Weight (lb):</strong> ${fmtCommas(wt.toFixed(0))}</div>
      <div class="small muted" style="margin-top:6px;">Assumes ideal fill; adjust for void/packing as needed.</div>
    `;
  });
}

/* =========================
   Area Calculator
   - Shapes: Rectangle, Circle, Triangle
   - Units: ft or m; acres conversion
   ========================= */
function viewCalcArea(){
  const KEY='df_calc_area';
  const s = (function(){ try{ return JSON.parse(localStorage.getItem(KEY)||'{}'); }catch{ return {}; } })();

  app.innerHTML = `
    <section class="section">
      <h1>📐 Area Calculator</h1>

      <div class="calc-grid">
        <label><span class="small muted">Shape</span>
          <select id="a-shape">
            <option ${s.shape==='Rectangle'?'selected':''}>Rectangle</option>
            <option ${s.shape==='Circle'?'selected':''}>Circle</option>
            <option ${s.shape==='Triangle'?'selected':''}>Triangle</option>
          </select>
        </label>
        <label><span class="small muted">Units</span>
          <select id="a-unit">
            <option value="ft" ${s.unit!=='m'?'selected':''}>Feet</option>
            <option value="m"  ${s.unit==='m'?'selected':''}>Meters</option>
          </select>
        </label>
      </div>

      <div id="a-rect" class="calc-grid" style="display:${(!s.shape||s.shape==='Rectangle')?'grid':'none'};">
        <label><span class="small muted">Length *</span><input id="a-len" type="number" step="any" value="${_html(s.len||'')}"></label>
        <label><span class="small muted">Width *</span><input id="a-wid" type="number" step="any" value="${_html(s.wid||'')}"></label>
      </div>

      <div id="a-circ" class="calc-grid" style="display:${s.shape==='Circle'?'grid':'none'};">
        <label><span class="small muted">Diameter *</span><input id="a-dia" type="number" step="any" value="${_html(s.dia||'')}"></label>
        <div></div>
      </div>

      <div id="a-tri" class="calc-grid" style="display:${s.shape==='Triangle'?'grid':'none'};">
        <label><span class="small muted">Base *</span><input id="a-base" type="number" step="any" value="${_html(s.base||'')}"></label>
        <label><span class="small muted">Height *</span><input id="a-height" type="number" step="any" value="${_html(s.height||'')}"></label>
      </div>

      <div class="calc-actions">
        <button id="a-go" class="btn-primary">Calculate</button>
        <a class="btn" href="#/calc">Back</a>
        <a class="btn" href="#/home">Dashboard</a>
      </div>

      <div id="a-out" class="result-card" style="display:none;"></div>
    </section>
  `;

  function showShape(){
    document.getElementById('a-rect').style.display = (document.getElementById('a-shape').value==='Rectangle')?'grid':'none';
    document.getElementById('a-circ').style.display = (document.getElementById('a-shape').value==='Circle')?'grid':'none';
    document.getElementById('a-tri').style.display  = (document.getElementById('a-shape').value==='Triangle')?'grid':'none';
  }
  document.getElementById('a-shape').addEventListener('change', showShape);
  showShape();

  document.getElementById('a-go').addEventListener('click', ()=>{
    const shape=document.getElementById('a-shape').value;
    const unit=document.getElementById('a-unit').value;
    let A=0;

    if (shape==='Rectangle'){
      const L=_num(document.getElementById('a-len').value);
      const W=_num(document.getElementById('a-wid').value);
      if(!L||!W) return alert('Enter length & width.');
      A=L*W;
    } else if (shape==='Circle'){
      const D=_num(document.getElementById('a-dia').value);
      if(!D) return alert('Enter diameter.');
      const r=D/2; A=Math.PI*r*r;
    } else {
      const B=_num(document.getElementById('a-base').value);
      const H=_num(document.getElementById('a-height').value);
      if(!B||!H) return alert('Enter base & height.');
      A=0.5*B*H;
    }

    try{ localStorage.setItem(KEY, JSON.stringify({
      shape, unit,
      len:document.getElementById('a-len')?.value,
      wid:document.getElementById('a-wid')?.value,
      dia:document.getElementById('a-dia')?.value,
      base:document.getElementById('a-base')?.value,
      height:document.getElementById('a-height')?.value
    })); }catch{}

    const acres = unit==='ft' ? (A/43560) : (A/4046.8564224);
    const out=document.getElementById('a-out'); out.style.display='';
    out.innerHTML = `
      <div><strong>Area (${unit==='ft'?'ft²':'m²'}):</strong> ${fmtCommas(A.toFixed(2))}</div>
      <div><strong>Area (acres):</strong> ${fmtCommas(acres.toFixed(4))}</div>
    `;
  });
}

/* =========================
   Chemical Mix Sheet
   - Up to 6 products (name, rate, unit)
   - Inputs: Tank Size (gal), Carrier GPA, optional Job Acres
   - Output: per-tank gallons per product, tanks needed
   ========================= */
function viewCalcChem(){
  const KEY='df_calc_chem';
  const s = (function(){ try{ return JSON.parse(localStorage.getItem(KEY)||'{}'); }catch{ return {}; } })();
  const prods = s.prods || Array.from({length:6}).map(()=>({name:'',rate:'',unit:'oz'}));

  function row(i,p){
    return `
      <div class="calc-grid">
        <label><span class="small muted">Product ${i+1}</span>
          <input id="ch-name-${i}" type="text" value="${_html(p.name||'')}" placeholder="Name">
        </label>
        <label><span class="small muted">Rate / acre</span>
          <input id="ch-rate-${i}" type="number" step="any" value="${_html(p.rate||'')}">
        </label>
        <label><span class="small muted">Unit</span>
          <select id="ch-unit-${i}">
            <option ${p.unit==='oz'?'selected':''} value="oz">oz</option>
            <option ${p.unit==='pt'?'selected':''} value="pt">pt</option>
            <option ${p.unit==='qt'?'selected':''} value="qt">qt</option>
            <option ${p.unit==='gal'?'selected':''} value="gal">gal</option>
          </select>
        </label>
      </div>`;
  }

  app.innerHTML = `
    <section class="section">
      <h1>🧪 Chemical Mix Sheet</h1>

      <div class="calc-grid">
        <label><span class="small muted">Tank Size (gal) *</span>
          <input id="ch-tank" type="number" step="any" value="${_html(s.tank||'')}">
        </label>
        <label><span class="small muted">Carrier GPA *</span>
          <input id="ch-gpa" type="number" step="any" value="${_html(s.gpa||'')}">
        </label>
        <label><span class="small muted">Job Acres (optional)</span>
          <input id="ch-job" type="number" step="any" value="${_html(s.job||'')}">
        </label>
      </div>

      <h3 style="margin-top:10px;">Products (rate per acre)</h3>
      ${prods.map((p,i)=>row(i,p)).join('')}

      <div class="calc-actions">
        <button id="ch-go" class="btn-primary">Calculate</button>
        <a class="btn" href="#/calc">Back</a>
        <a class="btn" href="#/home">Dashboard</a>
      </div>

      <div id="ch-out" class="result-card" style="display:none;"></div>
    </section>
  `;

  function unitToGal(u,a){
    const x=_num(a); if(!x) return 0;
    if(u==='gal') return x;
    if(u==='qt') return x/4;
    if(u==='pt') return x/8;
    if(u==='oz') return x/128;
    return 0;
  }

  document.getElementById('ch-go').addEventListener('click', ()=>{
    const tank=_num(document.getElementById('ch-tank').value);
    const gpa=_num(document.getElementById('ch-gpa').value);
    const job=_num(document.getElementById('ch-job').value);
    const ps=[];
    for(let i=0;i<6;i++){ ps.push({ name:document.getElementById('ch-name-'+i).value, rate:document.getElementById('ch-rate-'+i).value, unit:document.getElementById('ch-unit-'+i).value }); }

    try{ localStorage.setItem(KEY, JSON.stringify({tank,gpa,job,prods:ps})); }catch{}
    if(!tank||!gpa){ alert('Enter Tank Size and Carrier GPA.'); return; }

    const acPerTank = tank/gpa;
    let total=0;
    const lines = ps.filter(p=>_num(p.rate)>0).map(p=>{
      const perAcreGal = unitToGal(p.unit, p.rate);
      const perTankGal = perAcreGal * acPerTank;
      total += perTankGal;
      return `<li>${_html(p.name||'(Unnamed)')}: <strong>${fmtCommas(perTankGal.toFixed(3))}</strong> gal / tank <span class="small muted">(${p.rate} ${p.unit}/ac)</span></li>`;
    });

    const out=document.getElementById('ch-out'); out.style.display='';
    const tanks = job>0 ? `<li><strong>Tanks needed for ${fmtCommas(job)} ac:</strong> ${fmtCommas(Math.ceil(job/acPerTank))}</li>` : '';
    out.innerHTML = `
      <div><strong>Acres per tank:</strong> ${fmtCommas(acPerTank.toFixed(2))}</div>
      <div><strong>Carrier per tank (gal):</strong> ${fmtCommas(tank)}</div>
      <ul style="margin:8px 0 0 18px;">${lines.join('') || '<li class="muted">No products entered.</li>'}</ul>
      <div style="margin-top:6px;"><strong>Total product volume in mix (gal):</strong> ${fmtCommas(total.toFixed(3))}</div>
      ${tanks}
      <div class="small muted" style="margin-top:6px;">Confirm compatibility and label requirements.</div>
    `;
  });
}

/* ============================================================================
   app.js — PART 4 of N (v11.0.0)
   Reports + Feedback
   - Reports Hub
   - Pre-made Reports: Feedback Summary, Grain Bag Report
   - Feedback Hub + Forms (Error / Feature)
   - Safe, idempotent helpers (load/save) for feedback
   - Relies on Part 1 utilities (fmtCommas, prettyDate, displayVersion, tile, etc.)
   ========================================================================== */

/* ---------- Local-safe helpers ---------- */
(function initReportsFeedbackHelpers(){
  if (window.__APP_P4_HELPERS__) return;
  window.__APP_P4_HELPERS__ = true;

  // Feedback storage
  window.loadFeedback = function loadFeedback(){
    try { return JSON.parse(localStorage.getItem('df_feedback') || '[]'); }
    catch { return []; }
  };
  window.saveFeedback = function saveFeedback(entry){
    try {
      const key='df_feedback';
      const list = JSON.parse(localStorage.getItem(key) || '[]');
      list.push(entry);
      localStorage.setItem(key, JSON.stringify(list));
    } catch {}
  };

  // Bags accessor (defined in Grain part); provide a safe fallback
  if (typeof window.loadBags !== 'function'){
    window.loadBags = function(){ try{ return JSON.parse(localStorage.getItem('df_grain_bags')||'[]'); }catch{ return []; } };
  }
})();

/* =========================
   Reports — Hub
   ========================= */
function viewReportsHub(){
  app.innerHTML = `
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
  `;
}

/* =========================
   Reports — Pre-made Hub
   ========================= */
function viewReportsPremade(){
  app.innerHTML = `
    <div class="grid">
      ${tile('🧾','Feedback Summary','#/ai/premade/feedback')}
      ${tile('🧺','Grain Bag Report','#/ai/premade/grain-bags')}
    </div>
    <div class="section"><a class="btn" href="#/ai">Back to Reports</a></div>
  `;
}

/* =========================
   Report — Feedback Summary
   ========================= */
function viewReportsPremadeFeedback(){
  const items = loadFeedback().sort((a,b)=> (a.ts||0)-(b.ts||0));

  const rows = items.map((it,i)=>{
    const when = it.date ? it.date : (it.ts ? new Date(it.ts).toLocaleString() : '');
    const kind = it.type==='feature' ? 'Feature' : 'Error';
    const esc  = (s)=>String(s||'').replace(/</g,'&lt;');
    const dets = esc((it.details||'')).replace(/\n/g,'<br>');
    return `<tr>
      <td>${i+1}</td>
      <td>${when}</td>
      <td>${kind}</td>
      <td>${esc(it.main||'')}</td>
      <td>${esc(it.sub||'')}</td>
      <td>${esc(it.category||'')}</td>
      <td>${esc(it.subject||'')}</td>
      <td>${dets}</td>
      <td>${esc(it.by||'')}</td>
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
            <tr>
              <th>#</th><th>When</th><th>Type</th>
              <th>Main</th><th>Sub</th><th>Category</th>
              <th>Subject</th><th>Details</th><th>Submitted By</th>
            </tr>
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

/* =========================
   Report — Grain Bag Report
   Grouped by Location with subtotals + grand total
   ========================= */
function viewReportsPremadeGrainBags(){
  const bags = loadBags();
  const byLoc = {};
  for (const b of bags) {
    const loc = b.location || 'Unspecified';
    if (!byLoc[loc]) byLoc[loc] = [];
    byLoc[loc].push(b);
  }

  let grandTotal = 0;

  const sections = Object.keys(byLoc).sort().map(loc=>{
    const rows = byLoc[loc].map(b=>{
      const bu = Number(b.bushels||0);
      grandTotal += bu;
      return `<tr>
        <td>${b.date||''}</td>
        <td>${b.crop||''}</td>
        <td class="num">${fmtCommas(bu)}</td>
        <td>${String(b.notes||'').replace(/</g,'&lt;')}</td>
      </tr>`;
    }).join('');

    const locTotal = byLoc[loc].reduce((s,x)=>s+Number(x.bushels||0),0);
    return `
      <h3 class="section-head">${loc}</h3>
      <table class="report-table compact">
        <thead><tr><th>Date</th><th>Crop</th><th class="num">Est. Bu</th><th>Notes</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr><td colspan="2" class="num">Subtotal</td><td class="num">${fmtCommas(locTotal)}</td><td></td></tr></tfoot>
      </table>
    `;
  }).join('') || `<p class="muted">No grain bags recorded yet.</p>`;

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
        ${sections}
        ${bags.length ? `
          <div class="grand-total">
            <div><strong>Grand Total (Est. Bushels):</strong> ${fmtCommas(grandTotal)}</div>
            <div class="muted small">Average moisture: (tracking to be added)</div>
          </div>
        `:''}
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

/* =========================
   Feedback — Hub + Forms
   ========================= */
function viewFeedbackHub(){
  app.innerHTML = `
    <div class="grid">
      ${tile('🛠️','Report Errors','#/feedback/errors')}
      ${tile('💡','New Feature Request','#/feedback/feature')}
    </div>
    <div class="section"><a class="btn" href="#/home">Back to Dashboard</a></div>
  `;
}

function viewFeedbackErrors(){
  const today = new Date().toISOString().slice(0,10);
  const user = (localStorage.getItem('df_user')||'').trim();

  // Options for cascaded selects (kept simple; can be extended later)
  const MAIN_TO_SUB = {
    'Crop Production': ['Planting','Spraying','Aerial Spray','Harvest','Field Maintenance','Scouting','Trials'],
    'Calculator': ['Fertilizer','Bin Volume','Area','Combine Yield','Chemical Mix'],
    'Equipment': ['StarFire / Technology','Tractors','Combines','Sprayer / Fertilizer Spreader','Construction Equipment','Trucks','Trailers','Farm Implements'],
    'Grain Tracking': ['Grain Bag','Grain Bins','Grain Contracts','Grain Ticket OCR'],
    'Team & Partners': ['Employees','Subcontractors','Vendors','Directory'],
    'Reports': ['Pre-made Reports','Feedback Summary','Grain Bag Report','AI Reports','Yield Report'],
    'Settings': ['Crop Type','Theme','Farms','Fields'],
    'Feedback': ['Report Errors','New Feature Request']
  };
  const CATEGORIES = ['Bug / Error','UI / Design','Performance'];

  function mainOpts(){ return Object.keys(MAIN_TO_SUB).map(m=>`<option>${m}</option>`).join(''); }
  function catOpts(){ return CATEGORIES.map(c=>`<option>${c}</option>`).join(''); }

  app.innerHTML = `
    <section class="section">
      <h1>🛠️ Report Errors</h1>

      <div class="field" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
        <label><span class="small muted">Main Menu *</span>
          <select id="fb-main"><option value="">— Choose —</option>${mainOpts()}</select>
        </label>
        <label><span class="small muted">Sub Menu *</span>
          <select id="fb-sub"><option value="">— Choose —</option></select>
        </label>
        <label><span class="small muted">Category *</span>
          <select id="fb-cat"><option value="">— Choose —</option>${catOpts()}</select>
        </label>
      </div>

      <div class="field"><label class="choice"><input id="err-date" type="date" value="${today}"> <span class="small muted">Date (Required)</span></label></div>
      <div class="field"><input id="err-subj" type="text" placeholder="Subject *"></div>
      <div class="field"><textarea id="err-desc" rows="5" placeholder="What happened? *"></textarea></div>
      <div class="field"><input id="err-by" type="text" placeholder="Submitted by" value="${user}"></div>

      <button id="err-submit" class="btn-primary">Submit</button>
      <a class="btn" href="#/feedback">Back to Feedback</a>
    </section>
  `;

  const mainSel = document.getElementById('fb-main');
  const subSel  = document.getElementById('fb-sub');
  mainSel.addEventListener('change', ()=>{
    const subs = MAIN_TO_SUB[mainSel.value] || [];
    subSel.innerHTML = `<option value="">— Choose —</option>` + subs.map(s=>`<option>${s}</option>`).join('');
  });

  document.getElementById('err-submit')?.addEventListener('click', ()=>{
    const date=String(document.getElementById('err-date').value||'').trim();
    const subject=String(document.getElementById('err-subj').value||'').trim();
    const details=String(document.getElementById('err-desc').value||'').trim();
    const by=String(document.getElementById('err-by').value||'').trim();
    const main=String(mainSel.value||'').trim();
    const sub =String(subSel.value||'').trim();
    const cat =String(document.getElementById('fb-cat').value||'').trim();

    if(!date||!subject||!details||!main||!sub||!cat){
      alert('Please fill the required fields.'); return;
    }
    saveFeedback({type:'error', date, subject, details, by, main, sub, category:cat, ts:Date.now()});
    alert('Thanks! Your error report was saved.');
    location.hash='#/feedback';
  });
}

function viewFeedbackFeature(){
  const today = new Date().toISOString().slice(0,10);
  const user = (localStorage.getItem('df_user')||'').trim();

  const MAIN_TO_SUB = {
    'Crop Production': ['Planting','Spraying','Aerial Spray','Harvest','Field Maintenance','Scouting','Trials'],
    'Calculator': ['Fertilizer','Bin Volume','Area','Combine Yield','Chemical Mix'],
    'Equipment': ['StarFire / Technology','Tractors','Combines','Sprayer / Fertilizer Spreader','Construction Equipment','Trucks','Trailers','Farm Implements'],
    'Grain Tracking': ['Grain Bag','Grain Bins','Grain Contracts','Grain Ticket OCR'],
    'Team & Partners': ['Employees','Subcontractors','Vendors','Directory'],
    'Reports': ['Pre-made Reports','Feedback Summary','Grain Bag Report','AI Reports','Yield Report'],
    'Settings': ['Crop Type','Theme','Farms','Fields'],
    'Feedback': ['Report Errors','New Feature Request']
  };
  const CATEGORIES = ['New Feature','UI / Design'];

  function mainOpts(){ return Object.keys(MAIN_TO_SUB).map(m=>`<option>${m}</option>`).join(''); }
  function catOpts(){ return CATEGORIES.map(c=>`<option>${c}</option>`).join(''); }

  app.innerHTML = `
    <section class="section">
      <h1>💡 New Feature Request</h1>

      <div class="field" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
        <label><span class="small muted">Main Menu *</span>
          <select id="fb-main"><option value="">— Choose —</option>${mainOpts()}</select>
        </label>
        <label><span class="small muted">Sub Menu *</span>
          <select id="fb-sub"><option value="">— Choose —</option></select>
        </label>
        <label><span class="small muted">Category *</span>
          <select id="fb-cat"><option value="">— Choose —</option>${catOpts()}</select>
        </label>
      </div>

      <div class="field"><label class="choice"><input id="feat-date" type="date" value="${today}"> <span class="small muted">Date (Required)</span></label></div>
      <div class="field"><input id="feat-subj" type="text" placeholder="Feature title *"></div>
      <div class="field"><textarea id="feat-desc" rows="5" placeholder="Describe the idea *"></textarea></div>
      <div class="field"><input id="feat-by" type="text" placeholder="Submitted by" value="${user}"></div>

      <button id="feat-submit" class="btn-primary">Submit</button>
      <a class="btn" href="#/feedback">Back to Feedback</a>
    </section>
  `;

  const mainSel = document.getElementById('fb-main');
  const subSel  = document.getElementById('fb-sub');
  mainSel.addEventListener('change', ()=>{
    const subs = MAIN_TO_SUB[mainSel.value] || [];
    subSel.innerHTML = `<option value="">— Choose —</option>` + subs.map(s=>`<option>${s}</option>`).join('');
  });

  document.getElementById('feat-submit')?.addEventListener('click', ()=>{
    const date=String(document.getElementById('feat-date').value||'').trim();
    const subject=String(document.getElementById('feat-subj').value||'').trim();
    const details=String(document.getElementById('feat-desc').value||'').trim();
    const by=String(document.getElementById('feat-by').value||'').trim();
    const main=String(mainSel.value||'').trim();
    const sub =String(subSel.value||'').trim();
    const cat =String(document.getElementById('fb-cat').value||'').trim();

    if(!date||!subject||!details||!main||!sub||!cat){
      alert('Please fill the required fields.'); return;
    }
    saveFeedback({type:'feature', date, subject, details, by, main, sub, category:cat, ts:Date.now()});
    alert('Thanks! Your feature request was saved.');
    location.hash='#/feedback';
  });
}

/* ============================================================================
   app.js — PART 5 of N (v11.0.0)
   Team & Partners
   - Team Hub
   - Employees (CRUD; clean phone digits; email validation)
   - Subcontractors (CRUD)
   - Vendors (CRUD)
   - Directory (roll-up view)
   Notes:
     • Relies on Part 1 utilities: tile, fmtCommas, capTitle, bindPhoneAutoFormat,
       and DOM refs (app).
     • Uses localStorage keys:
         - df_team_employees
         - df_team_subcontractors
         - df_team_vendors
   ========================================================================== */

/* ---------- Local helpers (safe, idempotent) ---------- */
(function initTeamHelpers(){
  if (window.__APP_P5_HELPERS__) return;
  window.__APP_P5_HELPERS__ = true;

  window.df_load = function df_load(key, fb = []) {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fb)); }
    catch { return fb; }
  };
  window.df_save = function df_save(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  };
  window.df_uid = function df_uid(){
    try { return crypto.getRandomValues(new Uint32Array(2))[0].toString(36)+Date.now().toString(36); }
    catch { return Math.random().toString(36).slice(2)+Date.now().toString(36); }
  };
  window.df_onlyDigits = function df_onlyDigits(s){ return String(s||'').replace(/\D+/g,''); };
  window.df_fmtPhone = function df_fmtPhone(d){
    d = df_onlyDigits(d).slice(0,10);
    if (!d) return '';
    if (d.length <= 3) return `(${d}`;
    if (d.length <= 6) return `(${d.slice(0,3)}) ${d.slice(3)}`;
    return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;
  };
  window.df_emailOk = function df_emailOk(e){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e||'').trim()); };
  window.df_html = function df_html(s){ return String(s||'').replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#39;' }[m])); };
})();

/* ---------- Storage keys ---------- */
const EMP_KEY = 'df_team_employees';
const SUB_KEY = 'df_team_subcontractors';
const VEN_KEY = 'df_team_vendors';

/* =========================
   Team — Hub
   ========================= */
function viewTeamHub(){
  app.innerHTML = `
    <div class="grid">
      ${tile('👷','Employees','#/team/employees')}
      ${tile('🛠️','Subcontractors','#/team/subcontractors')}
      ${tile('🏪','Vendors','#/team/vendors')}
      ${tile('📇','Directory','#/team/dir')}
    </div>
    <div class="section"><a class="btn" href="#/home">Back to Dashboard</a></div>
  `;
}

/* =========================
   Team — Employees
   ========================= */
function viewTeamEmployees(){
  const list = df_load(EMP_KEY);
  const rows = list.map(p=>`
    <tr data-id="${p.id}">
      <td>${df_html(p.name)}</td>
      <td>${df_html(p.role||'')}</td>
      <td>${df_fmtPhone(p.phone||'')}</td>
      <td>${df_html(p.email||'')}</td>
      <td>${df_html(p.notes||'')}</td>
      <td><button class="btn small" data-edit>Edit</button> <button class="btn small" data-del>Delete</button></td>
    </tr>
  `).join('');

  app.innerHTML = `
    <section class="section">
      <h1>👷 Employees</h1>

      <div class="field" style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;">
        <input id="e-name" type="text" placeholder="Full name *">
        <input id="e-role" type="text" placeholder="Role / Title">
      </div>
      <div class="field" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <input id="e-phone" type="tel" placeholder="Phone (digits only)">
        <input id="e-email" type="email" placeholder="Email">
      </div>
      <div class="field">
        <textarea id="e-notes" rows="2" placeholder="Notes (optional)"></textarea>
      </div>
      <div class="field">
        <button id="e-save" class="btn-primary">Save</button>
        <button id="e-clear" class="btn">Clear</button>
      </div>

      <h2>Team</h2>
      <table class="report-table">
        <thead><tr><th>Name</th><th>Role</th><th>Phone</th><th>Email</th><th>Notes</th><th></th></tr></thead>
        <tbody id="e-tbody">${rows||''}</tbody>
      </table>
      ${rows? '' : '<p class="muted">No employees yet.</p>'}

      <div class="section"><a class="btn" href="#/team">Back to Team & Partners</a></div>
    </section>
  `;

  // phone auto-format (from Part 1)
  try { bindPhoneAutoFormat(app); } catch {}

  let editId = null;

  function readForm(){
    const name  = document.getElementById('e-name').value.trim();
    const role  = document.getElementById('e-role').value.trim();
    const phone = df_onlyDigits(document.getElementById('e-phone').value);
    const email = document.getElementById('e-email').value.trim();
    const notes = document.getElementById('e-notes').value.trim();
    if (!name){ alert('Name is required.'); return null; }
    if (email && !df_emailOk(email)){ alert('Email looks invalid.'); return null; }
    return { id: editId || df_uid(), name, role, phone, email, notes };
  }
  function loadForm(p){
    editId = p?.id || null;
    document.getElementById('e-name').value  = p?.name || '';
    document.getElementById('e-role').value  = p?.role || '';
    document.getElementById('e-phone').value = df_fmtPhone(p?.phone||'');
    document.getElementById('e-email').value = p?.email || '';
    document.getElementById('e-notes').value = p?.notes || '';
    try { bindPhoneAutoFormat(app); } catch {}
  }
  function clearForm(){ loadForm({}); }

  document.getElementById('e-save').addEventListener('click', ()=>{
    const rec = readForm(); if (!rec) return;
    const arr = df_load(EMP_KEY);
    const i = arr.findIndex(x=>x.id===rec.id);
    if (i>=0) arr[i]=rec; else arr.unshift(rec);
    df_save(EMP_KEY, arr);
    alert('Saved.');
    viewTeamEmployees();
  });
  document.getElementById('e-clear').addEventListener('click', clearForm);

  document.getElementById('e-tbody')?.addEventListener('click', (e)=>{
    const tr = e.target.closest('tr'); if (!tr) return;
    const id = tr.getAttribute('data-id');
    if (e.target.matches('[data-edit]')){
      const p = df_load(EMP_KEY).find(x=>x.id===id);
      if (p) loadForm(p);
    } else if (e.target.matches('[data-del]')){
      if (!confirm('Delete this employee?')) return;
      const arr = df_load(EMP_KEY).filter(x=>x.id!==id);
      df_save(EMP_KEY, arr);
      viewTeamEmployees();
    }
  });
}

/* =========================
   Team — Subcontractors
   ========================= */
function viewTeamSubcontractors(){
  const list = df_load(SUB_KEY);
  const rows = list.map(p=>`
    <tr data-id="${p.id}">
      <td>${df_html(p.company)}</td>
      <td>${df_html(p.contact||'')}</td>
      <td>${df_fmtPhone(p.phone||'')}</td>
      <td>${df_html(p.email||'')}</td>
      <td>${df_html(p.services||'')}</td>
      <td><button class="btn small" data-edit>Edit</button> <button class="btn small" data-del>Delete</button></td>
    </tr>
  `).join('');

  app.innerHTML = `
    <section class="section">
      <h1>🛠️ Subcontractors</h1>

      <div class="field" style="display:grid;grid-template-columns:1.5fr 1fr;gap:8px;">
        <input id="s-company" type="text" placeholder="Company *">
        <input id="s-contact" type="text" placeholder="Primary contact">
      </div>
      <div class="field" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <input id="s-phone" type="tel" placeholder="Phone">
        <input id="s-email" type="email" placeholder="Email">
      </div>
      <div class="field">
        <input id="s-services" type="text" placeholder="Services (e.g., tiling, trucking)">
      </div>
      <div class="field">
        <button id="s-save" class="btn-primary">Save</button>
        <button id="s-clear" class="btn">Clear</button>
      </div>

      <h2>List</h2>
      <table class="report-table">
        <thead><tr><th>Company</th><th>Contact</th><th>Phone</th><th>Email</th><th>Services</th><th></th></tr></thead>
        <tbody id="s-tbody">${rows||''}</tbody>
      </table>
      ${rows? '' : '<p class="muted">No subcontractors yet.</p>'}

      <div class="section"><a class="btn" href="#/team">Back to Team & Partners</a></div>
    </section>
  `;

  try { bindPhoneAutoFormat(app); } catch {}
  let editId = null;

  function readForm(){
    const company = document.getElementById('s-company').value.trim();
    const contact = document.getElementById('s-contact').value.trim();
    const phone   = df_onlyDigits(document.getElementById('s-phone').value);
    const email   = document.getElementById('s-email').value.trim();
    const services= document.getElementById('s-services').value.trim();
    if (!company){ alert('Company is required.'); return null; }
    if (email && !df_emailOk(email)){ alert('Email looks invalid.'); return null; }
    return { id: editId || df_uid(), company, contact, phone, email, services };
  }
  function loadForm(p){
    editId = p?.id || null;
    document.getElementById('s-company').value = p?.company||'';
    document.getElementById('s-contact').value = p?.contact||'';
    document.getElementById('s-phone').value   = df_fmtPhone(p?.phone||'');
    document.getElementById('s-email').value   = p?.email||'';
    document.getElementById('s-services').value= p?.services||'';
    try { bindPhoneAutoFormat(app); } catch {}
  }
  function clearForm(){ loadForm({}); }

  document.getElementById('s-save').addEventListener('click', ()=>{
    const rec = readForm(); if (!rec) return;
    const arr = df_load(SUB_KEY);
    const i = arr.findIndex(x=>x.id===rec.id);
    if (i>=0) arr[i]=rec; else arr.unshift(rec);
    df_save(SUB_KEY, arr);
    alert('Saved.');
    viewTeamSubcontractors();
  });
  document.getElementById('s-clear').addEventListener('click', clearForm);

  document.getElementById('s-tbody')?.addEventListener('click', (e)=>{
    const tr = e.target.closest('tr'); if (!tr) return;
    const id = tr.getAttribute('data-id');
    if (e.target.matches('[data-edit]')){
      const p = df_load(SUB_KEY).find(x=>x.id===id);
      if (p) loadForm(p);
    } else if (e.target.matches('[data-del]')){
      if (!confirm('Delete this subcontractor?')) return;
      const arr = df_load(SUB_KEY).filter(x=>x.id!==id);
      df_save(SUB_KEY, arr);
      viewTeamSubcontractors();
    }
  });
}

/* =========================
   Team — Vendors
   ========================= */
function viewTeamVendors(){
  const list = df_load(VEN_KEY);
  const rows = list.map(v=>`
    <tr data-id="${v.id}">
      <td>${df_html(v.company)}</td>
      <td>${df_html(v.account||'')}</td>
      <td>${df_fmtPhone(v.phone||'')}</td>
      <td>${df_html(v.email||'')}</td>
      <td>${df_html(v.notes||'')}</td>
      <td><button class="btn small" data-edit>Edit</button> <button class="btn small" data-del>Delete</button></td>
    </tr>
  `).join('');

  app.innerHTML = `
    <section class="section">
      <h1>🏪 Vendors</h1>

      <div class="field" style="display:grid;grid-template-columns:1.5fr 1fr;gap:8px;">
        <input id="v-company" type="text" placeholder="Company *">
        <input id="v-account" type="text" placeholder="Account #">
      </div>
      <div class="field" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <input id="v-phone" type="tel" placeholder="Phone">
        <input id="v-email" type="email" placeholder="Email">
      </div>
      <div class="field">
        <textarea id="v-notes" rows="2" placeholder="Notes (optional)"></textarea>
      </div>
      <div class="field">
        <button id="v-save" class="btn-primary">Save</button>
        <button id="v-clear" class="btn">Clear</button>
      </div>

      <h2>List</h2>
      <table class="report-table">
        <thead><tr><th>Company</th><th>Account #</th><th>Phone</th><th>Email</th><th>Notes</th><th></th></tr></thead>
        <tbody id="v-tbody">${rows||''}</tbody>
      </table>
      ${rows? '' : '<p class="muted">No vendors yet.</p>'}

      <div class="section"><a class="btn" href="#/team">Back to Team & Partners</a></div>
    </section>
  `;

  try { bindPhoneAutoFormat(app); } catch {}
  let editId = null;

  function readForm(){
    const company = document.getElementById('v-company').value.trim();
    const account = document.getElementById('v-account').value.trim();
    const phone   = df_onlyDigits(document.getElementById('v-phone').value);
    const email   = document.getElementById('v-email').value.trim();
    const notes   = document.getElementById('v-notes').value.trim();
    if (!company){ alert('Company is required.'); return null; }
    if (email && !df_emailOk(email)){ alert('Email looks invalid.'); return null; }
    return { id: editId || df_uid(), company, account, phone, email, notes };
  }
  function loadForm(p){
    editId = p?.id || null;
    document.getElementById('v-company').value = p?.company||'';
    document.getElementById('v-account').value = p?.account||'';
    document.getElementById('v-phone').value   = df_fmtPhone(p?.phone||'');
    document.getElementById('v-email').value   = p?.email||'';
    document.getElementById('v-notes').value   = p?.notes||'';
    try { bindPhoneAutoFormat(app); } catch {}
  }
  function clearForm(){ loadForm({}); }

  document.getElementById('v-save').addEventListener('click', ()=>{
    const rec = readForm(); if (!rec) return;
    const arr = df_load(VEN_KEY);
    const i = arr.findIndex(x=>x.id===rec.id);
    if (i>=0) arr[i]=rec; else arr.unshift(rec);
    df_save(VEN_KEY, arr);
    alert('Saved.');
    viewTeamVendors();
  });
  document.getElementById('v-clear').addEventListener('click', clearForm);

  document.getElementById('v-tbody')?.addEventListener('click', (e)=>{
    const tr = e.target.closest('tr'); if (!tr) return;
    const id = tr.getAttribute('data-id');
    if (e.target.matches('[data-edit]')){
      const v = df_load(VEN_KEY).find(x=>x.id===id);
      if (v) loadForm(v);
    } else if (e.target.matches('[data-del]')){
      if (!confirm('Delete this vendor?')) return;
      const arr = df_load(VEN_KEY).filter(x=>x.id!==id);
      df_save(VEN_KEY, arr);
      viewTeamVendors();
    }
  });
}

/* =========================
   Team — Directory (roll-up)
   ========================= */
function viewTeamDirectory(){
  const emps = df_load(EMP_KEY).map(x=>({ type:'Employee', name:x.name, org:x.role||'', phone:x.phone, email:x.email }));
  const subs = df_load(SUB_KEY).map(x=>({ type:'Sub',      name:x.company, org:x.contact||'', phone:x.phone, email:x.email }));
  const vens = df_load(VEN_KEY).map(x=>({ type:'Vendor',   name:x.company, org:x.account||'', phone:x.phone, email:x.email }));
  const all = [...emps,...subs,...vens].sort((a,b)=>a.name.localeCompare(b.name, undefined, {sensitivity:'base'}));

  const rows = all.map((r,i)=>`
    <tr>
      <td>${i+1}</td>
      <td>${df_html(r.type)}</td>
      <td>${df_html(r.name)}</td>
      <td>${df_html(r.org||'')}</td>
      <td>${df_fmtPhone(r.phone||'')}</td>
      <td>${df_html(r.email||'')}</td>
    </tr>
  `).join('');

  app.innerHTML = `
    <section class="section">
      <h1>📇 Directory</h1>
      ${all.length ? `
        <table class="report-table">
          <thead><tr><th>#</th><th>Type</th><th>Name</th><th>Role/Acct</th><th>Phone</th><th>Email</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      ` : `<p class="muted">No contacts yet. Add employees, subcontractors, or vendors to populate this directory.</p>`}
      <div class="section"><a class="btn" href="#/team">Back to Team & Partners</a></div>
    </section>
  `;
}

/* ============================================================================
   app.js — PART 6 of N (v11.0.0)
   Reports
   - Reports Hub
   - Pre-made Reports hub
   - Feedback Summary (printable)
   - Grain Bag Report (grouped, subtotals, grand total; printable)
   - Placeholders: AI Reports, Yield Report
   Notes:
     • Relies on Part 1 utilities: tile, prettyDate, displayVersion, fmtCommas,
       and DOM refs (app).
     • Uses existing storage helpers if present; falls back safely.
   ========================================================================== */

/* ---------- Safe helpers (reuse if already defined) ---------- */
const __r_html = (s)=>String(s??'').replace(/[&<>"']/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#39;' }[m]));
const __r_fmt  = (n)=> (typeof fmtCommas==='function' ? fmtCommas(n) : (Number(n).toLocaleString?.() ?? String(n)));
const __r_todayPretty = ()=> (typeof prettyDate==='function' ? prettyDate(new Date()) : new Date().toDateString());
const __r_ver = ()=> (typeof displayVersion==='function' ? displayVersion(typeof APP_VERSION!=='undefined'?APP_VERSION:'v11.0.0') : (typeof APP_VERSION!=='undefined'?APP_VERSION:'v11.0.0'));

/* Feedback + Grain data access with gentle fallbacks */
function __r_loadFeedback(){
  try{
    // Prefer an app-level utility if defined
    if (typeof loadFeedback === 'function') return loadFeedback();
    const raw = localStorage.getItem('df_feedback'); return raw ? JSON.parse(raw) : [];
  }catch{ return []; }
}
function __r_loadBags(){
  try{
    if (typeof loadBags === 'function') return loadBags();
    const raw = localStorage.getItem('df_grain_bags'); return raw ? JSON.parse(raw) : [];
  }catch{ return []; }
}

/* =========================
   Reports — Hub
   ========================= */
function viewReportsHub(){
  app.innerHTML = `
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
  `;
}

/* =========================
   Reports — Pre-made hub
   ========================= */
function viewReportsPremade(){
  app.innerHTML = `
    <div class="grid">
      ${tile('🧾','Feedback Summary','#/ai/premade/feedback')}
      ${tile('🧺','Grain Bag Report','#/ai/premade/grain-bags')}
    </div>
    <div class="section"><a class="btn" href="#/ai">Back to Reports</a></div>
  `;
}

/* =========================
   Reports — Feedback Summary
   ========================= */
function viewReportsPremadeFeedback(){
  const items = __r_loadFeedback().slice().sort((a,b)=> (a.ts||0)-(b.ts||0));

  const rows = items.map((it,i)=>{
    const when = it.date ? it.date : (it.ts ? new Date(it.ts).toLocaleString() : '');
    const kind = it.type==='feature' ? 'Feature' : 'Error';
    const subj = __r_html(it.subject||'');
    const dets = __r_html(String(it.details||'').replace(/\n/g,'\n')).replace(/\n/g,'<br>');
    const by   = __r_html(it.by||'');
    const main = __r_html(it.main||'');
    const sub  = __r_html(it.sub||'');
    const cat  = __r_html(it.category||'');
    return `<tr>
      <td>${i+1}</td>
      <td>${when}</td>
      <td>${kind}</td>
      <td>${main}</td>
      <td>${sub}</td>
      <td>${cat}</td>
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
          <div class="r-date">${__r_todayPretty()}</div>
        </div>
      </header>

      <div class="report-body watermark">
        ${items.length ? `
        <table class="report-table">
          <thead>
            <tr>
              <th>#</th><th>When</th><th>Type</th><th>Main</th><th>Sub</th><th>Category</th>
              <th>Subject</th><th>Details</th><th>Submitted By</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>` : `<p class="muted">No feedback saved yet.</p>`}
      </div>

      <footer class="report-foot">
        <div>${__r_ver()}</div>
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

/* =========================
   Reports — Grain Bag Report
   Group by Location; subtotals + grand total
   ========================= */
function viewReportsPremadeGrainBags(){
  const bags = __r_loadBags();
  const byLoc = {};
  for (const b of bags) {
    const loc = b.location || 'Unspecified';
    (byLoc[loc] ||= []).push(b);
  }

  let grandTotal = 0;
  const sections = Object.keys(byLoc).sort().map(loc=>{
    const rows = byLoc[loc].map(b=>{
      grandTotal += Number(b.bushels||0);
      return `<tr>
        <td>${__r_html(b.date||'')}</td>
        <td>${__r_html(b.crop||'')}</td>
        <td class="num">${__r_fmt(b.bushels||0)}</td>
        <td>${__r_html(b.notes||'')}</td>
      </tr>`;
    }).join('');

    const locTotal = byLoc[loc].reduce((s,x)=>s+Number(x.bushels||0),0);
    return `
      <h3 class="section-head">${__r_html(loc)}</h3>
      <table class="report-table compact">
        <thead><tr><th>Date</th><th>Crop</th><th class="num">Est. Bu</th><th>Notes</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr><td colspan="2" class="num">Subtotal</td><td class="num">${__r_fmt(locTotal)}</td><td></td></tr></tfoot>
      </table>
    `;
  }).join('') || `<p class="muted">No grain bags recorded yet.</p>`;

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
          <div class="r-date">${__r_todayPretty()}</div>
        </div>
      </header>

      <div class="report-body watermark">
        ${sections}
        ${bags.length ? `
          <div class="grand-total">
            <div><strong>Grand Total (Est. Bushels):</strong> ${__r_fmt(grandTotal)}</div>
            <div class="muted small">Average moisture: (tracking to be added)</div>
          </div>
        `:''}
      </div>

      <footer class="report-foot">
        <div>${__r_ver()}</div>
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

/* =========================
   Reports — Placeholders
   ========================= */
function viewReportsAI(){
  app.innerHTML = `
    <section class="section">
      <h1>🤖 AI Reports</h1>
      <p class="muted">🚧 Coming soon.</p>
      <a class="btn" href="#/ai">Back to Reports</a>
    </section>
  `;
}
function viewReportsYield(){
  app.innerHTML = `
    <section class="section">
      <h1>📊 Yield Report</h1>
      <p class="muted">🚧 Coming soon.</p>
      <a class="btn" href="#/ai">Back to Reports</a>
    </section>
  `;
}

/* ============================================================================
   app.js — PART 7 of N (v11.0.0)
   Settings + Feedback
   - Settings Hub
   - Crop Types (archive / unarchive / delete / add)
   - Theme (Auto / Light / Dark)
   - Feedback Hub
   - Report Errors (save to localStorage)
   - New Feature Request (save to localStorage)
   Notes:
     • Relies on Part 1 utilities: app, tile, fmtCommas, capTitle, displayVersion.
     • Uses localStorage keys:
         - df_crops            (array of {name, archived})
         - df_feedback         (array of feedback entries)
   ========================================================================== */

/* ---------- Safe helpers (reuse if already defined) ---------- */
const __s_html = (s)=>String(s??'').replace(/[&<>"']/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#39;' }[m]));
const __s_capTitle = (s)=> (typeof capTitle==='function' ? capTitle(s) : String(s||'').trim().split(/\s+/).map(w=>w? w[0].toUpperCase()+w.slice(1).toLowerCase() : '').join(' '));
const __s_user = ()=>{ try { return (localStorage.getItem('df_user')||'').trim(); } catch { return ''; } };

/* ============================================================================
   SETTINGS
   ========================================================================== */

function viewSettingsHome(){
  app.innerHTML = `
    <div class="grid">
      ${tile('🌱','Crop Type','#/settings/crops')}
      ${tile('🌓','Theme','#/settings/theme')}
      ${tile('🏠','Farms','#/settings/farms')}
      ${tile('🗺️','Fields','#/settings/fields')}
    </div>
    <div class="section"><a class="btn" href="#/home">Back to Dashboard</a></div>
  `;
}

/* --- Crops storage helpers --- */
const CROPS_KEY = 'df_crops';
function __s_migrateCropsShape(arr){
  if (!Array.isArray(arr)) return [];
  if (arr.length && typeof arr[0]==='string') return arr.map(n=>({name:n, archived:false}));
  return arr.map(o=>({ name:String(o?.name||'').trim(), archived: !!o?.archived }));
}
function __s_loadCrops(){
  try{
    const raw = localStorage.getItem(CROPS_KEY);
    if (!raw) return [{name:'Corn',archived:false},{name:'Soybeans',archived:false}];
    const arr = __s_migrateCropsShape(JSON.parse(raw));
    return arr.length ? arr : [{name:'Corn',archived:false},{name:'Soybeans',archived:false}];
  }catch{
    return [{name:'Corn',archived:false},{name:'Soybeans',archived:false}];
  }
}
function __s_saveCrops(list){ try{ localStorage.setItem(CROPS_KEY, JSON.stringify(list)); }catch{} }
function __s_isCropInUse(/*name*/){ return false; /* placeholder for future cross-checks */ }

function viewSettingsCrops(){
  const crops = __s_loadCrops();
  const items = crops.map((o,i)=>{
    const status = o.archived ? '<span class="chip chip-archived" title="Archived">Archived</span>' : '';
    const actions = o.archived
      ? `<button class="btn" data-unarchive="${i}">Unarchive</button> <button class="btn" data-delete="${i}">Delete</button>`
      : `<button class="btn" data-archive="${i}">Archive</button> <button class="btn" data-delete="${i}">Delete</button>`;
    return `<li class="crop-row ${(o.archived?'is-archived':'')}">
      <div class="crop-info"><span class="chip">${__s_html(o.name)}</span> ${status}</div>
      <div class="crop-actions">${actions}</div>
    </li>`;
  }).join('');

  app.innerHTML = `
    <section class="section">
      <h1>Crop Type</h1>
      <p class="muted">Archive crops that are in use to preserve history. Delete only if unused.</p>
      <ul class="crop-list">${items || '<li class="muted">No crops yet.</li>'}</ul>

      <div class="field add-row" style="display:grid;grid-template-columns:1fr auto;gap:8px;">
        <input id="new-crop" type="text" placeholder="e.g., Wheat">
        <button id="add-crop" class="btn-primary">➕ Add</button>
      </div>

      <a class="btn" href="#/settings">Back to Settings</a>
    </section>
  `;

  const addBtn = document.getElementById('add-crop');
  const input  = document.getElementById('new-crop');
  const listEl = app.querySelector('.crop-list');

  addBtn?.addEventListener('click', ()=>{
    const name = __s_capTitle(input.value||'');
    if (!name) return;
    const cs = __s_loadCrops();
    if (cs.some(c=>c.name.toLowerCase()===name.toLowerCase())){ input.value=''; return; }
    cs.push({name, archived:false});
    __s_saveCrops(cs);
    viewSettingsCrops();
  });
  input?.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); addBtn?.click(); } });

  listEl?.addEventListener('click', e=>{
    const btn = e.target.closest?.('button'); if (!btn) return;
    const cs = __s_loadCrops();

    if (btn.hasAttribute('data-archive')){
      const i = +btn.getAttribute('data-archive');
      if (cs[i]){ cs[i].archived = true; __s_saveCrops(cs); viewSettingsCrops(); }
    }
    else if (btn.hasAttribute('data-unarchive')){
      const j = +btn.getAttribute('data-unarchive');
      if (cs[j]){ cs[j].archived = false; __s_saveCrops(cs); viewSettingsCrops(); }
    }
    else if (btn.hasAttribute('data-delete')){
      const k = +btn.getAttribute('data-delete');
      if (!cs[k]) return;
      const nm = cs[k].name;
      if (__s_isCropInUse(nm)){ alert(`“${nm}” is used in your data. Archive instead.`); return; }
      if (!confirm(`Delete “${nm}”? This cannot be undone.`)) return;
      cs.splice(k,1);
      __s_saveCrops(cs);
      viewSettingsCrops();
    }
  });
}

function viewSettingsTheme(){
  const KEY='df_theme';
  const current = (localStorage.getItem(KEY) || 'auto');

  app.innerHTML = `
    <section class="section">
      <h1>Theme</h1>
      <div class="field">
        <label style="font-weight:600;margin-bottom:6px;">Appearance</label>
        <div class="theme-list">
          <label class="theme-item"><input type="radio" name="theme" value="auto" ${current==='auto'?'checked':''}> <span>Auto (follow device)</span></label>
          <label class="theme-item"><input type="radio" name="theme" value="light" ${current==='light'?'checked':''}> <span>Light</span></label>
          <label class="theme-item"><input type="radio" name="theme" value="dark" ${current==='dark'?'checked':''}> <span>Dark</span></label>
        </div>
      </div>
      <div class="section"><a class="btn" href="#/settings">Back to Settings</a></div>
    </section>
  `;

  app.querySelectorAll('input[name="theme"]').forEach(r=>{
    r.addEventListener('change', ()=>{
      localStorage.setItem(KEY, r.value);
      document.documentElement.setAttribute('data-theme', r.value);
    });
  });
}

/* ============================================================================
   FEEDBACK
   ========================================================================== */

function viewFeedbackHub(){
  app.innerHTML = `
    <div class="grid">
      ${tile('🛠️','Report Errors','#/feedback/errors')}
      ${tile('💡','New Feature Request','#/feedback/feature')}
    </div>
    <div class="section"><a class="btn" href="#/home">Back to Dashboard</a></div>
  `;
}

function __s_saveFeedback(entry){
  try{
    const key='df_feedback';
    const list = JSON.parse(localStorage.getItem(key)||'[]');
    list.push(entry);
    localStorage.setItem(key, JSON.stringify(list));
  }catch{}
}

/* Report Errors */
function viewFeedbackErrors(){
  const today = new Date().toISOString().slice(0,10);
  const user  = __s_user();

  app.innerHTML = `
    <section class="section">
      <h1>🛠️ Report Errors</h1>

      <div class="field"><label class="choice"><input id="err-date" type="date" value="${today}"> <span class="small muted">Date (Required)</span></label></div>
      <div class="field"><input id="err-subj" type="text" placeholder="Subject *"></div>
      <div class="field"><textarea id="err-desc" rows="5" placeholder="What happened? *"></textarea></div>
      <div class="field"><input id="err-by" type="text" placeholder="Submitted by" value="${__s_html(user)}"></div>

      <button id="err-submit" class="btn-primary">Submit</button>
      <a class="btn" href="#/feedback">Back to Feedback</a>
    </section>
  `;

  document.getElementById('err-submit')?.addEventListener('click', ()=>{
    const date    = String(document.getElementById('err-date').value||'').trim();
    const subject = String(document.getElementById('err-subj').value||'').trim();
    const details = String(document.getElementById('err-desc').value||'').trim();
    const by      = String(document.getElementById('err-by').value||'').trim();
    if(!date||!subject||!details){ alert('Please fill the required fields.'); return; }

    __s_saveFeedback({ type:'error', date, subject, details, by, ts:Date.now() });
    alert('Thanks! Your error report was saved.');
    location.hash = '#/feedback';
  });
}

/* New Feature Request */
function viewFeedbackFeature(){
  const today = new Date().toISOString().slice(0,10);
  const user  = __s_user();

  app.innerHTML = `
    <section class="section">
      <h1>💡 New Feature Request</h1>

      <div class="field"><label class="choice"><input id="feat-date" type="date" value="${today}"> <span class="small muted">Date (Required)</span></label></div>
      <div class="field"><input id="feat-subj" type="text" placeholder="Feature title *"></div>
      <div class="field"><textarea id="feat-desc" rows="5" placeholder="Describe the idea *"></textarea></div>
      <div class="field"><input id="feat-by" type="text" placeholder="Submitted by" value="${__s_html(user)}"></div>

      <button id="feat-submit" class="btn-primary">Submit</button>
      <a class="btn" href="#/feedback">Back to Feedback</a>
    </section>
  `;

  document.getElementById('feat-submit')?.addEventListener('click', ()=>{
    const date    = String(document.getElementById('feat-date').value||'').trim();
    const subject = String(document.getElementById('feat-subj').value||'').trim();
    const details = String(document.getElementById('feat-desc').value||'').trim();
    const by      = String(document.getElementById('feat-by').value||'').trim();
    if(!date||!subject||!details){ alert('Please fill the required fields.'); return; }

    __s_saveFeedback({ type:'feature', date, subject, details, by, ts:Date.now() });
    alert('Thanks! Your feature request was saved.');
    location.hash = '#/feedback';
  });
}

/* ============================================================================
   app.js — PART 8 of N (v11.0.0)
   Reports
   - Reports Hub
   - Pre-made Reports hub
   - Feedback Summary report (printable)
   - Grain Bag report (group by location, subtotals, grand total; printable)
   - AI Reports (placeholder)
   - Yield Report (placeholder)
   Notes:
     • Relies on Part 1 utilities: app, tile, fmtCommas, prettyDate, displayVersion.
     • Storage keys used:
         - df_feedback      (array of feedback entries)
         - df_grain_bags    (array of grain bag entries)  ← fallback loader included
   ========================================================================== */

/* ---------- Small safe helpers ---------- */
const __r_html = (s)=>String(s??'').replace(/[&<>"']/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#39;' }[m]));
const __r_arr  = (x)=> Array.isArray(x) ? x : [];
const __r_todayStr = ()=> new Date().toISOString().slice(0,10);

/* Robust bags loader (uses existing global if present) */
function __r_loadBags(){
  if (typeof window.loadBags === 'function') return window.loadBags();
  try { return JSON.parse(localStorage.getItem('df_grain_bags') || '[]'); } catch { return []; }
}

/* ---------- Reports Hub ---------- */
function viewReportsHub(){
  app.innerHTML = `
    <div class="grid">
      ${tile('📄','Pre-made Reports','#/ai/premade')}
      ${tile('🤖','AI Reports','#/ai/ai')}
      ${tile('📊','Yield Report','#/ai/yield')}
    </div>

    <section class="section" style="margin-top:12px;">
      <h2>🔮 Future</h2>
      <p class="muted">ChatGPT integration to generate &amp; save custom reports is planned.</p>
    </section>

    <div class="section"><a class="btn" href="#/home">Back to Dashboard</a></div>
  `;
}

/* ---------- Pre-made Reports Hub ---------- */
function viewReportsPremade(){
  app.innerHTML = `
    <div class="grid">
      ${tile('🧾','Feedback Summary','#/ai/premade/feedback')}
      ${tile('🧺','Grain Bag Report','#/ai/premade/grain-bags')}
    </div>
    <div class="section"><a class="btn" href="#/ai">Back to Reports</a></div>
  `;
}

/* ---------- Feedback Summary (printable) ---------- */
function viewReportsPremadeFeedback(){
  const items = (function(){
    try { return __r_arr(JSON.parse(localStorage.getItem('df_feedback') || '[]')); }
    catch { return []; }
  })().sort((a,b)=> (a.ts||0)-(b.ts||0));

  const rows = items.map((it,i)=>{
    const when = it.date ? it.date : (it.ts ? new Date(it.ts).toLocaleString() : '');
    const kind = it.type==='feature' ? 'Feature' : 'Error';
    const subj = __r_html(it.subject||'');
    const dets = __r_html((it.details||'')).replace(/\n/g,'<br>');
    const by   = __r_html(it.by||'');
    const main = __r_html(it.main||'');
    const sub  = __r_html(it.sub||'');
    const cat  = __r_html(it.category||'');
    return `<tr>
      <td>${i+1}</td>
      <td>${when}</td>
      <td>${kind}</td>
      <td>${main}</td>
      <td>${sub}</td>
      <td>${cat}</td>
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
            <tr>
              <th>#</th><th>When</th><th>Type</th>
              <th>Main</th><th>Sub</th><th>Category</th>
              <th>Subject</th><th>Details</th><th>Submitted By</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>` : `<p class="muted">No feedback saved yet.</p>`}
      </div>

      <footer class="report-foot">
        <div>${displayVersion('v11.0.0')}</div>
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

/* ---------- Grain Bag Report (grouped + totals, printable) ---------- */
function viewReportsPremadeGrainBags(){
  const bags = __r_loadBags();
  const byLoc = {};
  for (const b of bags) {
    const loc = b.location || 'Unspecified';
    (byLoc[loc] ||= []).push(b);
  }

  let grandTotal = 0;
  const sections = Object.keys(byLoc).sort().map(loc=>{
    const rows = byLoc[loc].map(b=>{
      const bu = Number(b.bushels||0);
      grandTotal += bu;
      return `<tr>
        <td>${__r_html(b.date||'')}</td>
        <td>${__r_html(b.crop||'')}</td>
        <td class="num">${fmtCommas(bu, {decimals:0})}</td>
        <td>${__r_html(b.notes||'')}</td>
      </tr>`;
    }).join('');

    const locTotal = byLoc[loc].reduce((s,x)=>s+Number(x.bushels||0),0);
    return `
      <h3 class="section-head">${__r_html(loc)}</h3>
      <table class="report-table compact">
        <thead><tr><th>Date</th><th>Crop</th><th class="num">Est. Bu</th><th>Notes</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr><td colspan="2" class="num">Subtotal</td><td class="num">${fmtCommas(locTotal,{decimals:0})}</td><td></td></tr></tfoot>
      </table>
    `;
  }).join('') || `<p class="muted">No grain bags recorded yet.</p>`;

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
        ${sections}
        ${bags.length ? `
          <div class="grand-total">
            <div><strong>Grand Total (Est. Bushels):</strong> ${fmtCommas(grandTotal,{decimals:0})}</div>
            <div class="muted small">Average moisture: (tracking to be added)</div>
          </div>
        `:''}
      </div>

      <footer class="report-foot">
        <div>${displayVersion('v11.0.0')}</div>
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

/* ---------- AI Reports (placeholder) ---------- */
function viewReportsAI(){
  app.innerHTML = `
    <section class="section">
      <h1>🤖 AI Reports</h1>
      <p class="muted">🚧 Coming soon.</p>
      <a class="btn" href="#/ai">Back to Reports</a>
    </section>
  `;
}

/* ---------- Yield Report (placeholder) ---------- */
function viewReportsYield(){
  app.innerHTML = `
    <section class="section">
      <h1>📊 Yield Report</h1>
      <p class="muted">🚧 Coming soon.</p>
      <a class="btn" href="#/ai">Back to Reports</a>
    </section>
  `;
}

/* ============================================================================
   app.js — PART 9 of N (v11.0.0)
   Feedback
   - Storage helpers
   - Feedback Hub
   - Shared dropdown header (Main/Sub/Category) with simple dependency
   - Report Errors form
   - New Feature Request form
   Notes:
     • Relies on Part 1 utilities: app, tile, prettyDate, displayVersion.
     • Integrates with Reports (Part 8) which expects main/sub/category fields.
     • Storage key: df_feedback
   ========================================================================== */

/* ---------- Storage helpers ---------- */
function loadFeedback(){
  try { return JSON.parse(localStorage.getItem('df_feedback') || '[]'); }
  catch { return []; }
}
function saveFeedback(entry){
  try{
    const list = loadFeedback();
    list.push(entry);
    localStorage.setItem('df_feedback', JSON.stringify(list));
  }catch{}
}

/* ---------- Feedback Hub ---------- */
function viewFeedbackHub(){
  app.innerHTML = `
    <div class="grid">
      ${tile('🛠️','Report Errors','#/feedback/errors')}
      ${tile('💡','New Feature Request','#/feedback/feature')}
    </div>
    <div class="section"><a class="btn" href="#/home">Back to Dashboard</a></div>
  `;
}

/* ---------- Shared dropdown header (Main/Sub/Category) ---------- */
/* Uses app menu structure so users can target areas precisely */
const FB_MAIN_TO_SUB = {
  'Crop Production': ['Planting','Spraying','Aerial Spray','Harvest','Field Maintenance','Scouting','Trials'],
  'Calculator': ['Fertilizer','Bin Volume','Area','Combine Yield','Chemical Mix'],
  'Equipment': ['StarFire / Technology','Tractors','Combines','Sprayer / Fertilizer Spreader','Construction Equipment','Trucks','Trailers','Farm Implements'],
  'Grain Tracking': ['Grain Bag','Grain Bins','Grain Contracts','Grain Ticket OCR'],
  'Team & Partners': ['Employees','Subcontractors','Vendors','Directory'],
  'Reports': ['Pre-made Reports','Feedback Summary','Grain Bag Report','AI Reports','Yield Report'],
  'Settings': ['Crop Type','Theme','Farms','Fields'],
  'Feedback': ['Report Errors','New Feature Request']
};
const FB_CATEGORIES = ['Bug / Error','New Feature','UI / Design'];

function feedbackDropdownHeader(title){
  return `
    <section class="section">
      <h1>${title}</h1>
      <div class="field" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
        <label><span class="small muted">Main Menu *</span>
          <select id="fb-main">
            <option value="">— Choose —</option>
            ${Object.keys(FB_MAIN_TO_SUB).map(m=>`<option>${m}</option>`).join('')}
          </select>
        </label>
        <label><span class="small muted">Sub Menu *</span>
          <select id="fb-sub">
            <option value="">— Choose —</option>
          </select>
        </label>
        <label><span class="small muted">Category *</span>
          <select id="fb-cat">
            <option value="">— Choose —</option>
            ${FB_CATEGORIES.map(c=>`<option>${c}</option>`).join('')}
          </select>
        </label>
      </div>
  `;
}
function wireFeedbackCascade(){
  const mainSel = document.getElementById('fb-main');
  const subSel  = document.getElementById('fb-sub');
  if (!mainSel || !subSel) return;
  const fill = ()=>{
    const subs = FB_MAIN_TO_SUB[mainSel.value] || [];
    const keep = subSel.value;
    subSel.innerHTML = `<option value="">— Choose —</option>` + subs.map(s=>`<option>${s}</option>`).join('');
    if ([...subSel.options].some(o=>o.value===keep)) subSel.value = keep;
  };
  mainSel.addEventListener('change', fill);
  fill();
}

/* ---------- Report Errors form ---------- */
function viewFeedbackErrors(){
  const today = new Date().toISOString().slice(0,10);
  const user  = (localStorage.getItem('df_user')||'').trim();

  app.innerHTML = feedbackDropdownHeader('🛠️ Report Errors') + `
    <div class="field"><label class="choice"><input id="err-date" type="date" value="${today}"> <span class="small muted">Date (Required)</span></label></div>
    <div class="field"><input id="err-subj" type="text" placeholder="Subject *"></div>
    <div class="field"><textarea id="err-desc" rows="5" placeholder="What happened? *"></textarea></div>
    <div class="field"><input id="err-by" type="text" placeholder="Submitted by" value="${user}"></div>
    <button id="err-submit" class="btn-primary">Submit</button> <a class="btn" href="#/feedback">Back to Feedback</a>
  </section>
  `;

  wireFeedbackCascade();

  document.getElementById('err-submit')?.addEventListener('click', ()=>{
    const date   = String(document.getElementById('err-date').value||'').trim();
    const subject= String(document.getElementById('err-subj').value||'').trim();
    const details= String(document.getElementById('err-desc').value||'').trim();
    const by     = String(document.getElementById('err-by').value||'').trim();
    const main   = String(document.getElementById('fb-main').value||'').trim();
    const sub    = String(document.getElementById('fb-sub').value||'').trim();
    const cat    = String(document.getElementById('fb-cat').value||'').trim();

    if (!date || !subject || !details || !main || !sub || !cat) {
      alert('Please fill all required fields.'); return;
    }
    saveFeedback({ type:'error', date, subject, details, by, main, sub, category:cat, ts:Date.now() });
    alert('Thanks! Your error report was saved.');
    location.hash = '#/feedback';
  });
}

/* ---------- New Feature Request form ---------- */
function viewFeedbackFeature(){
  const today = new Date().toISOString().slice(0,10);
  const user  = (localStorage.getItem('df_user')||'').trim();

  app.innerHTML = feedbackDropdownHeader('💡 New Feature Request') + `
    <div class="field"><label class="choice"><input id="feat-date" type="date" value="${today}"> <span class="small muted">Date (Required)</span></label></div>
    <div class="field"><input id="feat-subj" type="text" placeholder="Feature title *"></div>
    <div class="field"><textarea id="feat-desc" rows="5" placeholder="Describe the idea *"></textarea></div>
    <div class="field"><input id="feat-by" type="text" placeholder="Submitted by" value="${user}"></div>
    <button id="feat-submit" class="btn-primary">Submit</button> <a class="btn" href="#/feedback">Back to Feedback</a>
  </section>
  `;

  wireFeedbackCascade();

  // Optional guard: on this form, category “Bug / Error” is less relevant; keep behavior consistent
  // (We show all options so it mirrors current UI and report columns.)

  document.getElementById('feat-submit')?.addEventListener('click', ()=>{
    const date   = String(document.getElementById('feat-date').value||'').trim();
    const subject= String(document.getElementById('feat-subj').value||'').trim();
    const details= String(document.getElementById('feat-desc').value||'').trim();
    const by     = String(document.getElementById('feat-by').value||'').trim();
    const main   = String(document.getElementById('fb-main').value||'').trim();
    const sub    = String(document.getElementById('fb-sub').value||'').trim();
    const cat    = String(document.getElementById('fb-cat').value||'').trim();

    if (!date || !subject || !details || !main || !sub || !cat) {
      alert('Please fill all required fields.'); return;
    }
    saveFeedback({ type:'feature', date, subject, details, by, main, sub, category:cat, ts:Date.now() });
    alert('Thanks! Your feature request was saved.');
    location.hash = '#/feedback';
  });
}

/* ============================================================================
   app.js — PART 10 of 10 (v11.0.0)
   Settings + Theme + Crops + Farms & Fields (management screens)
   - Settings Home (tiles)
   - Crops CRUD (archive/delete guards)
   - Theme (Auto / Light / Dark) with instant apply
   - Farms & Fields CRUD (localStorage) + basic rules
   Notes:
     • Relies on Part 1 utilities (tile, fmtCommas, capTitle, migrate helpers).
     • Uses LABELS map from Part 1 for breadcrumb text.
     • Storage keys:
         CROPS_KEY      = 'df_crops'
         FARMS_KEY      = 'df_farms'
         FIELDS_KEY     = 'df_fields2'
   ========================================================================== */

/* ---------- Settings Home ---------- */
function viewSettingsHome(){
  app.innerHTML = `
    <div class="grid">
      ${tile('🌱','Crop Type','#/settings/crops')}
      ${tile('🌓','Theme','#/settings/theme')}
      ${tile('🏠','Farms','#/settings/farms')}
      ${tile('🗺️','Fields','#/settings/fields')}
    </div>
    <div class="section"><a class="btn" href="#/home">Back to Dashboard</a></div>
  `;
}

/* ============================================================================
   CROPS (archive-first model)
   ========================================================================== */
const CROPS_KEY = 'df_crops';

function migrateCropsShape(arr){
  if(!Array.isArray(arr)) return [];
  if(arr.length && typeof arr[0] === 'string'){
    return arr.map(n => ({ name:n, archived:false }));
  }
  return arr.map(o => ({ name:String(o.name||'').trim(), archived:!!o.archived }));
}
function loadCrops(){
  try{
    const raw = localStorage.getItem(CROPS_KEY);
    if(!raw) return [{name:'Corn',archived:false},{name:'Soybeans',archived:false}];
    const arr = JSON.parse(raw);
    const norm = migrateCropsShape(arr);
    return norm.length ? norm : [{name:'Corn',archived:false},{name:'Soybeans',archived:false}];
  }catch{
    return [{name:'Corn',archived:false},{name:'Soybeans',archived:false}];
  }
}
function saveCrops(list){ try{ localStorage.setItem(CROPS_KEY, JSON.stringify(list)); }catch{} }
/* placeholder – wire to data usage checks when needed */
function isCropInUse(name){ return false; }

function viewSettingsCrops(){
  const crops = loadCrops();
  const items = crops.map((o,i)=>{
    const status = o.archived ? '<span class="chip chip-archived" title="Archived">Archived</span>' : '';
    const actions = o.archived
      ? `<button class="btn" data-unarchive="${i}">Unarchive</button> <button class="btn" data-delete="${i}">Delete</button>`
      : `<button class="btn" data-archive="${i}">Archive</button> <button class="btn" data-delete="${i}">Delete</button>`;
    return `
      <li class="crop-row ${o.archived?'is-archived':''}">
        <div class="crop-info"><span class="chip">${o.name}</span> ${status}</div>
        <div class="crop-actions">${actions}</div>
      </li>`;
  }).join('');

  app.innerHTML = `
    <section class="section">
      <h1>Crop Type</h1>
      <p class="muted">Archive crops that are in use to preserve history. Delete only if unused.</p>
      <ul class="crop-list">${items || '<li class="muted">No crops yet.</li>'}</ul>
      <div class="field add-row" style="display:grid;grid-template-columns:1fr auto;gap:8px;">
        <input id="new-crop" type="text" placeholder="e.g., Wheat">
        <button id="add-crop" class="btn-primary">➕ Add</button>
      </div>
      <a class="btn" href="#/settings">Back to Settings</a>
    </section>
  `;

  const addBtn = document.getElementById('add-crop');
  const input  = document.getElementById('new-crop');
  const listEl = app.querySelector('.crop-list');

  addBtn?.addEventListener('click', ()=>{
    const name = String(input.value||'').trim();
    if (!name) return;
    const cs = loadCrops();
    if (cs.some(c=>c.name.toLowerCase()===name.toLowerCase())){ input.value=''; return; }
    cs.push({name:capTitle(name), archived:false});
    saveCrops(cs); viewSettingsCrops();
  });
  input?.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); addBtn?.click(); } });

  listEl?.addEventListener('click', e=>{
    const btn = e.target.closest?.('button'); if(!btn) return;
    const cs = loadCrops();
    if(btn.hasAttribute('data-archive')){
      const i=+btn.getAttribute('data-archive'); if(cs[i]){ cs[i].archived=true; saveCrops(cs); viewSettingsCrops(); }
    } else if(btn.hasAttribute('data-unarchive')){
      const j=+btn.getAttribute('data-unarchive'); if(cs[j]){ cs[j].archived=false; saveCrops(cs); viewSettingsCrops(); }
    } else if(btn.hasAttribute('data-delete')){
      const k=+btn.getAttribute('data-delete'); if(!cs[k]) return; const nm=cs[k].name;
      if(isCropInUse(nm)){ alert(`“${nm}” is used in your data. Archive instead.`); return; }
      if(!confirm(`Delete “${nm}”? This cannot be undone.`)) return;
      cs.splice(k,1); saveCrops(cs); viewSettingsCrops();
    }
  });
}

/* ============================================================================
   THEME (Auto / Light / Dark)
   ========================================================================== */
function viewSettingsTheme(){
  const KEY='df_theme';
  const current = (localStorage.getItem(KEY) || 'auto');

  app.innerHTML = `
    <section class="section">
      <h1>Theme</h1>
      <div class="field">
        <label style="font-weight:600;margin-bottom:6px;">Appearance</label>
        <div class="seg" id="theme-seg" style="display:inline-flex;border:1px solid rgba(0,0,0,.2);border-radius:10px;overflow:hidden;">
          <button type="button" class="${current==='auto'?'active':''}"  data-val="auto">Auto</button>
          <button type="button" class="${current==='light'?'active':''}" data-val="light">Light</button>
          <button type="button" class="${current==='dark'?'active':''}"  data-val="dark">Dark</button>
        </div>
      </div>
      <div class="section"><a class="btn" href="#/settings">Back to Settings</a></div>
    </section>
  `;

  document.getElementById('theme-seg')?.addEventListener('click', (e)=>{
    const b = e.target.closest('button[data-val]'); if(!b) return;
    const v = b.getAttribute('data-val');
    try{ localStorage.setItem(KEY, v); }catch{}
    document.documentElement.setAttribute('data-theme', v);
    Array.from(document.querySelectorAll('#theme-seg button')).forEach(x=>x.classList.toggle('active', x===b));
  });
}

/* ============================================================================
   FARMS & FIELDS (Settings)
   ========================================================================== */
const FARMS_KEY  = 'df_farms';
const FIELDS_KEY = 'df_fields2';

function loadJSON(k,fb=[]) { try { return JSON.parse(localStorage.getItem(k) || JSON.stringify(fb)); } catch { return fb; } }
function saveJSON(k,v)     { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
function cryptoId(){
  try{ return crypto.getRandomValues(new Uint32Array(2))[0].toString(36)+Date.now().toString(36); }
  catch{ return Math.random().toString(36).slice(2)+Date.now().toString(36); }
}

/* ---------- Farms ---------- */
function viewSettingsFarms(){
  const appEl = app;
  let farms = loadJSON(FARMS_KEY, []);
  farms.sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''), undefined, {sensitivity:'base'}));

  const rows = farms.map((f,i)=>{
    const arch = f.archived ? '<span class="chip chip-archived">Archived</span>' : '';
    const actions = f.archived
      ? `<button class="btn" data-act="unarchive" data-i="${i}">Unarchive</button>
         <button class="btn" data-act="delete" data-i="${i}">Delete</button>`
      : `<button class="btn" data-act="edit" data-i="${i}">Edit</button>
         <button class="btn" data-act="archive" data-i="${i}">Archive</button>
         <button class="btn" data-act="delete" data-i="${i}">Delete</button>`;
    return `<li class="crop-row ${f.archived?'is-archived':''}">
      <div class="crop-info"><span class="chip">${(f.name||'')}</span> ${arch}</div>
      <div class="crop-actions">${actions}</div>
    </li>`;
  }).join('');

  appEl.innerHTML = `
    <section class="section">
      <h1>🏠 Farms</h1>
      <p class="muted">Manage farm names. Can’t delete if fields still assigned.</p>
      <ul class="crop-list">${rows || '<li class="muted">No farms yet.</li>'}</ul>
      <div class="field add-row" style="display:grid;grid-template-columns:1fr auto;gap:8px;">
        <input id="farm-name" type="text" placeholder="e.g., Home Farm">
        <button id="farm-add" class="btn-primary">➕ Add</button>
      </div>
      <a class="btn" href="#/settings">Back to Settings</a>
    </section>
  `;

  document.getElementById('farm-add')?.addEventListener('click', ()=>{
    const name = String(document.getElementById('farm-name').value||'').trim();
    if (!name) return;
    if (farms.some(f=>String(f.name).toLowerCase()===name.toLowerCase())){ alert('That farm name already exists.'); return; }
    farms.push({id: cryptoId(), name: capTitle(name), archived:false});
    saveJSON(FARMS_KEY, farms); viewSettingsFarms();
  });

  appEl.querySelector('.crop-list')?.addEventListener('click', (e)=>{
    const btn=e.target.closest('button'); if (!btn) return;
    const i = Number(btn.getAttribute('data-i')); if (!farms[i]) return;
    const act = btn.getAttribute('data-act');
    if (act==='edit'){
      const nn = prompt('Rename farm:', farms[i].name||''); if (!nn) return;
      if (farms.some((f,ix)=>ix!==i && String(f.name).toLowerCase()===nn.toLowerCase())){ alert('Another farm already uses that name.'); return; }
      farms[i].name = capTitle(nn.trim());
    } else if (act==='archive'){ farms[i].archived = true; }
    else if (act==='unarchive'){ farms[i].archived = false; }
    else if (act==='delete'){
      const used = loadJSON(FIELDS_KEY, []).some(fl=>fl.farmId === farms[i].id);
      if (used){ alert('This farm has fields assigned. Archive instead, or move/delete fields first.'); return; }
      if (!confirm(`Delete “${farms[i].name}”? This cannot be undone.`)) return;
      farms.splice(i,1);
    }
    saveJSON(FARMS_KEY, farms); viewSettingsFarms();
  });
}

/* ---------- Fields ---------- */
function viewSettingsFields(){
  const appEl = app;
  const farms = loadJSON(FARMS_KEY, []).sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''), undefined, {sensitivity:'base'}));
  let fields = loadJSON(FIELDS_KEY, []);

  const farmOpts = farms.map(f=>`<option value="${f.id}">${(f.name||'')}</option>`).join('');
  fields.sort((a,b)=>{
    const fa = farms.find(f=>f.id===a.farmId)?.name||'';
    const fb = farms.find(f=>f.id===b.farmId)?.name||'';
    const n = fa.localeCompare(fb,undefined,{sensitivity:'base'});
    return n || String(a.name||'').localeCompare(String(b.name||''),undefined,{sensitivity:'base'});
  });

  const rows = fields.map((fl,i)=>{
    const farmName = farms.find(f=>f.id===fl.farmId)?.name || '(Unknown)';
    const arch = fl.archived ? '<span class="chip chip-archived">Archived</span>' : '';
    const actions = fl.archived
      ? `<button class="btn" data-act="unarchive" data-i="${i}">Unarchive</button>
         <button class="btn" data-act="delete" data-i="${i}">Delete</button>`
      : `<button class="btn" data-act="edit" data-i="${i}">Edit</button>
         <button class="btn" data-act="archive" data-i="${i}">Archive</button>
         <button class="btn" data-act="delete" data-i="${i}">Delete</button>`;
    const badges = [];
    if (fl.crp?.yes) badges.push(`CRP ${fl.crp.acres||0} ac`);
    if (fl.hel?.yes) badges.push(`HEL ${fl.hel.acres||0} ac`);
    return `<li class="crop-row ${fl.archived?'is-archived':''}">
      <div class="crop-info"><span class="chip">${(fl.name||'')}</span> ${arch}</div>
      <div class="crop-actions small">${(farmName||'')}</div>
      <div style="flex-basis:100%;padding-left:8px;margin-top:6px;">
        <div class="small muted">Tillable: ${fmtCommas(fl.tillable||0)} ac${badges.length?` • ${badges.join(' • ')}`:''}</div>
      </div>
      <div class="crop-actions">${actions}</div>
    </li>`;
  }).join('');

  appEl.innerHTML = `
    <section class="section">
      <h1>🗺️ Fields</h1>
      <p class="muted">Each field belongs to a farm. Enter tillable acres, optional CRP and HEL details.</p>
      <ul class="crop-list">${rows || '<li class="muted">No fields yet.</li>'}</ul>

      <h3 style="margin-top:14px;">Add Field</h3>
      <div class="field" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <label><span class="small muted">Farm *</span><select id="fld-farm">${farmOpts}</select></label>
        <label><span class="small muted">Field Name *</span><input id="fld-name" type="text" placeholder="e.g., North 80"></label>
      </div>
      <div class="field" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
        <label><span class="small muted">Tillable Acres *</span><input id="fld-till" type="number" step="any" min="0.01" placeholder="e.g., 79.5"></label>
        <label><span class="small muted">CRP?</span><select id="fld-crp-yes"><option value="no" selected>No</option><option value="yes">Yes</option></select></label>
        <label><span class="small muted">CRP Acres</span><input id="fld-crp-ac" type="number" step="any" min="0" placeholder="optional" disabled></label>
      </div>
      <div class="field" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <label><span class="small muted">HEL?</span><select id="fld-hel-yes"><option value="no" selected>No</option><option value="yes">Yes</option></select></label>
        <label><span class="small muted">HEL Acres</span><input id="fld-hel-ac" type="number" step="any" min="0" placeholder="optional" disabled></label>
      </div>
      <button id="fld-add" class="btn-primary">➕ Add Field</button>
      <a class="btn" href="#/settings">Back to Settings</a>
    </section>
  `;

  const crpSel=document.getElementById('fld-crp-yes');
  const crpAc =document.getElementById('fld-crp-ac');
  const helSel=document.getElementById('fld-hel-yes');
  const helAc =document.getElementById('fld-hel-ac');

  crpSel.addEventListener('change', ()=>{ crpAc.disabled = crpSel.value!=='yes'; if (crpAc.disabled) crpAc.value=''; });
  helSel.addEventListener('change', ()=>{ helAc.disabled = helSel.value!=='yes'; if (helAc.disabled) helAc.value=''; });

  document.getElementById('fld-add')?.addEventListener('click', ()=>{
    const farmId = document.getElementById('fld-farm').value;
    const name   = String(document.getElementById('fld-name').value||'').trim();
    const till   = Number(String(document.getElementById('fld-till').value||'').replace(/,/g,''));
    const crpYes = crpSel.value==='yes';
    const crpA   = Number(String(crpAc.value||'').replace(/,/g,''));
    const helYes = helSel.value==='yes';
    const helA   = Number(String(helAc.value||'').replace(/,/g,''));

    if (!farmId || !name || !(till>0)){ alert('Farm, Field Name, and Tillable Acres are required.'); return; }
    if (crpYes && !(crpA>0)){ alert('Enter CRP acres (or set CRP to No).'); return; }
    if (helYes && !(helA>0)){ alert('Enter HEL acres (or set HEL to No).'); return; }
    if (crpYes && crpA>till){ alert('CRP acres cannot exceed Tillable.'); return; }
    if (helYes && helA>till){ alert('HEL acres cannot exceed Tillable.'); return; }

    const list = loadJSON(FIELDS_KEY, []);
    if (list.some(f=>f.farmId===farmId && String(f.name).toLowerCase()===name.toLowerCase())){
      alert('A field with that name already exists in this farm.'); return;
    }

    list.push({
      id: cryptoId(),
      farmId, name: capTitle(name),
      tillable: till,
      crp: { yes: crpYes, acres: crpYes?crpA:0 },
      hel: { yes: helYes, acres: helYes?helA:0 },
      archived:false
    });
    saveJSON(FIELDS_KEY, list);
    viewSettingsFields();
  });

  appEl.querySelector('.crop-list')?.addEventListener('click',(e)=>{
    const btn=e.target.closest('button'); if (!btn) return;
    const i = Number(btn.getAttribute('data-i'));
    const act = btn.getAttribute('data-act');
    const list = loadJSON(FIELDS_KEY, []);
    if (!list[i]) return;

    if (act==='edit'){
      const nf = prompt('Rename field:', list[i].name||''); if (!nf) return;
      const farmId = list[i].farmId;
      if (list.some((f,ix)=>ix!==i && f.farmId===farmId && String(f.name).toLowerCase()===nf.toLowerCase())){
        alert('Another field in this farm already uses that name.'); return;
      }
      list[i].name = capTitle(nf.trim());
    } else if (act==='archive'){ list[i].archived = true; }
    else if (act==='unarchive'){ list[i].archived = false; }
    else if (act==='delete'){
      if (!confirm(`Delete “${list[i].name}”? This cannot be undone.`)) return;
      list.splice(i,1);
    }
    saveJSON(FIELDS_KEY, list); viewSettingsFields();
  });
}

/* ---------- Route hooks for direct deep links (safety) ---------- */
window.addEventListener('hashchange', ()=>{
  if (location.hash==='#/settings/farms')  viewSettingsFarms();
  if (location.hash==='#/settings/fields') viewSettingsFields();
});
if (location.hash==='#/settings/farms')  viewSettingsFarms();
if (location.hash==='#/settings/fields') viewSettingsFields();

/* ---------- LABELS (ensure breadcrumb names exist) ---------- */
try{
  LABELS['#/settings'] = LABELS['#/settings'] || 'Settings';
  LABELS['#/settings/crops']  = 'Crop Type';
  LABELS['#/settings/theme']  = 'Theme';
  LABELS['#/settings/farms']  = 'Farms';
  LABELS['#/settings/fields'] = 'Fields';
}catch{}

/* =========================
   PATCH v11.0.1 — Router bootstrap fix
   ========================= */
(function DF_PATCH_1101(){
  if (window.__DF_PATCH_1101__) return;
  window.__DF_PATCH_1101__ = true;

  function start(){
    try{
      if (!location.hash || location.hash === '#') {
        location.replace('#/home');
      }
      if (typeof route === 'function') {
        route();
      }
      // If still empty, inject a fallback
      const app = document.getElementById('app');
      if (app && !app.innerHTML.trim()) {
        app.innerHTML = `
          <section class="section">
            <h1>🏠 Home</h1>
            <p class="muted">Dowson Farms dashboard loaded.</p>
          </section>
        `;
      }
    } catch(e){
      console.error('Patch 11.0.1 bootstrap error', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();

<!-- ⬇️ Paste this entire block at the very end of app.js -->
<script>
/* =========================================================
   Dowson Farms — APPEND-ONLY PATCH v11.0.2
   Safe boot + Logout path fix + Footer version sync
   (No edits to existing functions; fully self-guarded)
   ========================================================= */
(function DF_PATCH_11002(){
  if (window.__DF_PATCH_11002__) return;   // prevent double-run
  window.__DF_PATCH_11002__ = true;

  // --- tiny helpers ---
  const on = (t, fn, o)=> window.addEventListener(t, fn, o||false);
  const $  = (s, r=document)=> r.querySelector(s);
  const txt= (x)=> (x==null?'':String(x));

  // --- 1) Safe boot: guarantee a hash + one router pass
  function ensureHash(){
    try{
      if (!location.hash || location.hash === '#') {
        location.replace('#/home');
      }
    }catch{}
  }
  function kick(){
    try{
      ensureHash();
      if (typeof window.renderBreadcrumb === 'function') window.renderBreadcrumb();
      if (typeof window.route === 'function') window.route();
    }catch{}
  }
  // Run now + a few safe retries (covers SW activation/rehydration)
  kick();
  setTimeout(kick,   0);
  setTimeout(kick, 250);
  setTimeout(kick,1000);

  // Also re-run when page becomes visible or the hash changes
  on('visibilitychange', ()=>{ if (document.visibilityState==='visible') kick(); });
  on('hashchange', ()=> kick());

  // --- 2) Logout path fix (handles project pages vs user root) ---
  // We don’t modify your existing doLogout; we add a robust listener
  // that routes to the correct login.html location for the current site.
  function siteBaseHref(){
    // If a <base> exists, use it; else compute from current location.
    const base = document.querySelector('base')?.getAttribute('href');
    if (base) return base.replace(/\/+$/,'') + '/';
    // If running at https://user.github.io/repo/, keep /repo/ prefix
    const parts = location.pathname.split('/').filter(Boolean);
    if (parts.length>=1){
      // If the first segment looks like a repo (project pages), keep it
      return '/' + parts[0] + '/';
    }
    return '/';
  }
  function gotoLogin(){
    try{
      const base = siteBaseHref();
      const url  = base + 'login.html?bye=' + Date.now();
      // Use replace so Back doesn’t return to an authed page
      location.replace(url);
    }catch{
      // Ultra-safe fallback: clear auth and go to home
      try{ localStorage.removeItem('df_auth'); localStorage.removeItem('df_user'); }catch{}
      location.hash = '#/home';
    }
  }
  // Intercept any element that triggers logout (robust selectors)
  document.addEventListener('click', (e)=>{
    const el = e.target.closest?.('#logout, [data-action="logout"], a[href="logout"]');
    if (!el) return;
    e.preventDefault();
    // mirror your cleanup, then navigate with the fixed path logic
    try{ localStorage.removeItem('df_auth'); localStorage.removeItem('df_user'); }catch{}
    gotoLogin();
  }, true);

  // --- 3) Footer version sync (keeps the label current) ---
  function syncFooterVersion(){
    try{
      const el = document.getElementById('version');
      const v  = (typeof window.APP_VERSION!=='undefined') ? String(window.APP_VERSION) : (txt(el?.textContent)||'').trim();
      if (el && v) el.textContent = v;
    }catch{}
  }
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', syncFooterVersion, {once:true});
  } else {
    syncFooterVersion();
  }

  // --- 4) Background paint reassurance (prevents ivory/black flashes) ---
  (function bgPaintGuard(){
    if (document.getElementById('df-paint-guard-11002')) return;
    const s = document.createElement('style');
    s.id = 'df-paint-guard-11002';
    s.textContent = `
      :root{ --page-bg-light:#f6f6e8; --page-bg-dark:#0f0f0f; }
      [data-theme="auto"]{ --page-bg: var(--page-bg-light); }
      @media (prefers-color-scheme: dark){
        [data-theme="auto"]{ --page-bg: var(--page-bg-dark); }
      }
      [data-theme="light"]{ --page-bg: var(--page-bg-light); }
      [data-theme="dark"] { --page-bg: var(--page-bg-dark); }
      html, body, #app { background: var(--page-bg) !important; min-height: 100%; }
    `;
    document.head.appendChild(s);
  })();

})();
</script>