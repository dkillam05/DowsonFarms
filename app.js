// ===== Version (footer shows vMAJOR.MINOR) =====
const APP_VERSION = 'v10.14.4';

// ===== Init theme asap (auto/light/dark) =====
(function applySavedTheme() {
  try {
    const t = localStorage.getItem('df_theme') || 'auto';
    document.documentElement.setAttribute('data-theme', t);
  } catch {}
})();

// ===== Auth (invite-only placeholder) =====
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

// ===== Ensure we always have a hash (prevents blank page if none) =====
function ensureHomeHash() {
  if (!location.hash || location.hash === '#') {
    location.replace('#/home');
  }
}

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

  // Feedback
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
/* =========================
   Crop Production
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

/* =========================
   Field Maintenance (FULL)
   ========================= */
const FM_KEY = 'df_field_maint';
const JOB_TYPES_KEY = 'df_job_types';
const FIELD_LIST_KEY = 'df_fields';

function loadJSON(key, fallback = []) { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; } }
function saveJSON(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }

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

async function filesToDataURLs(fileList){
  const files = Array.from(fileList||[]);
  const readers = files.map(f => new Promise(res=>{
    const r = new FileReader();
    r.onload = ()=>res(r.result);
    r.readAsDataURL(f);
  }));
  return Promise.all(readers);
}

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

/* =========================
   Calculators
   ========================= */
function viewCalcHub(){
  app.innerHTML = `
    <div class="grid">
      ${tile('👨🏼‍🔬','Fertilizer','#/calc/fertilizer')}
      ${tile('🛢️','Bin Volume','#/calc/bin')}
      ${tile('📐','Area','#/calc/area')}
      ${tile('🌽🌱','Combine Yield','#/calc/combine')}
      ${tile('🧪','Chemical Mix','#/calc/chem')}
    </div>
    <div class="section"><a class="btn" href="#/home">Back to Dashboard</a></div>
  `;
}
function viewCalcFertilizer(){ app.innerHTML = `<section class="section"><h1>👨🏼‍🔬 Fertilizer Calculator</h1><p>🚧 Coming soon.</p><a class="btn" href="#/calc">Back to Calculator</a></section>`; }
function viewCalcBin(){ app.innerHTML = `<section class="section"><h1>🛢️ Bin Volume Calculator</h1><p>🚧 Coming soon.</p><a class="btn" href="#/calc">Back to Calculator</a></section>`; }
function viewCalcArea(){ app.innerHTML = `<section class="section"><h1>📐 Area Calculator</h1><p>🚧 Coming soon.</p><a class="btn" href="#/calc">Back to Calculator</a></section>`; }
function viewCalcCombine(){ app.innerHTML = `<section class="section"><h1>🌽🌱 Combine Yield Calculator</h1><p>🚧 Coming soon (corn/soy, true shrink, head width 30’/40’/45’).</p><a class="btn" href="#/calc">Back to Calculator</a></section>`; }
function viewCalcChem(){ app.innerHTML = `<section class="section"><h1>🧪 Chemical Mix Sheet</h1><p>🚧 Coming soon.</p><a class="btn" href="#/calc">Back to Calculator</a></section>`; }

/* =========================
   Equipment
   ========================= */
function viewEquipmentHub(){
  app.innerHTML = `
    <div class="grid">
      ${tile('🛰️','StarFire / Technology','#/equipment/receivers')}
      ${tile('🚜','Tractors','#/equipment/tractors')}
      ${tile('🌾','Combines','#/equipment/combines')}
      ${tile('💦','Sprayer / Fertilizer Spreader','#/equipment/sprayer')}
      ${tile('🚧','Construction Equipment','#/equipment/construction')}
      ${tile('🚚','Trucks','#/equipment/trucks')}
      ${tile('🚛','Trailers','#/equipment/trailers')}
      ${tile('⚙️','Farm Implements','#/equipment/implements')}
    </div>
    <div class="section"><a class="btn" href="#/home">Back to Dashboard</a></div>
  `;
}
function viewEquipmentComing(name){
  app.innerHTML = `
    <section class="section">
      <h1>${name}</h1>
      <p>🚧 Coming soon. (Will track Make, Model, Serial; assign barcode; quick repair logs)</p>
      <a class="btn" href="#/equipment">Back to Equipment</a>
    </section>
  `;
}
/* =========================
   Grain Tracking
   ========================= */
const GRAIN_BAG_KEY='df_grain_bags';
function loadBags(){ try{ return JSON.parse(localStorage.getItem(GRAIN_BAG_KEY) || '[]'); }catch{ return []; } }
function saveBags(list){ try{ localStorage.setItem(GRAIN_BAG_KEY, JSON.stringify(list)); }catch{} }

function viewGrainHub(){
  app.innerHTML = `
    <div class="grid">
      ${tile('🧺','Grain Bag','#/grain/bag')}
      ${tile('🛢️','Grain Bins','#/grain/bins')}
      ${tile('📄','Grain Contracts','#/grain/contracts')}
      ${tile('🧾','Ticket OCR','#/grain/tickets')}
    </div>
    <div class="section"><a class="btn" href="#/home">Back to Dashboard</a></div>
  `;
}
function viewGrainBag(){
  const user = (localStorage.getItem('df_user')||'').trim();
  const today = new Date().toISOString().slice(0,10);
  const rows=loadBags().map(b=>{
    return `<li class="crop-row">
      <div class="crop-info"><span class="chip">#${b.no}</span> <span class="chip">${b.date}</span></div>
      <div class="crop-actions"><span class="small">${b.location}</span></div>
      <div style="flex-basis:100%;padding-left:8px;margin-top:6px;">
        <div class="small muted">Crop: ${b.crop} • Est: ${b.bushels.toLocaleString()} bu • By: ${b.submittedBy||'-'}</div>
        ${b.notes ? `<div class="small muted">Notes: ${b.notes}</div>`:''}
      </div>
    </li>`;
  }).join('');
  app.innerHTML = `
    <section class="section">
      <h1>🧺 Grain Bag</h1>
      <div class="field"><label class="choice"><input id="gb-date" type="date" value="${today}"> <span class="small muted">Date (Required)</span></label></div>
      <div class="field"><label>Location <span class="small muted">(Required)</span></label>
        <select id="gb-loc">
          <option value="">— Choose —</option>
          <option value="Divernon Elevator">Divernon Elevator</option>
          <option value="Field (TBD)">Field (TBD)</option>
        </select>
      </div>
      <div class="field"><label>Crop <span class="small muted">(Required)</span></label>
        <select id="gb-crop">
          <option value="">— Choose —</option>
          <option value="Corn">Corn</option>
          <option value="Soybeans">Soybeans</option>
        </select>
      </div>
      <div class="field"><label class="choice"><input id="gb-bu" type="number" inputmode="numeric" min="1" placeholder="Estimated bushels (Required)"></label></div>
      <div class="field"><label class="choice"><input id="gb-by" type="text" placeholder="Submitted by" value="${user}"></label></div>
      <div class="field"><label class="choice"><textarea id="gb-notes" rows="3" placeholder="Notes (optional)"></textarea></label></div>
      <button id="gb-save" class="btn-primary">Save</button>

      <h2 style="margin-top:14px;">Recent</h2>
      <ul class="crop-list">${rows || '<li class="muted">No grain bags recorded.</li>'}</ul>

      <div class="section">
        <a class="btn" href="#/grain">Back to Grain Tracking</a> <a class="btn" href="#/home">Back to Dashboard</a>
      </div>
    </section>
  `;
  document.getElementById('gb-save')?.addEventListener('click', ()=>{
    const date = document.getElementById('gb-date').value;
    const loc  = document.getElementById('gb-loc').value;
    const crop = document.getElementById('gb-crop').value;
    const buStr= String(document.getElementById('gb-bu').value||'').trim();
    const by   = String(document.getElementById('gb-by').value||'').trim();
    const notes= String(document.getElementById('gb-notes').value||'').trim();
    const bu = parseInt(buStr,10);

    if(!date||!loc||!crop||!bu||bu<=0){ alert('Date, Location, Crop, Estimated Bushels are required.'); return; }

    const list = loadBags();
    const nextNo = (list[0]?.no || 0) + 1;
    list.unshift({ no: nextNo, date, location: loc, crop, bushels: bu, submittedBy: by, notes });
    saveBags(list);
    alert('Saved.');
    viewGrainBag();
  });
}

/* =========================
   Reports
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

// feedback storage (already used by your forms)
function loadFeedback(){
  try { return JSON.parse(localStorage.getItem('df_feedback') || '[]'); }
  catch { return []; }
}

function viewReportsPremade(){
  app.innerHTML = `
    <div class="grid">
      ${tile('🧾','Feedback Summary','#/ai/premade/feedback')}
      ${tile('🧺','Grain Bag Report','#/ai/premade/grain-bags')}
    </div>
    <div class="section"><a class="btn" href="#/ai">Back to Reports</a></div>
  `;
}
function viewReportsPremadeFeedback(){
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

// Group by Location; show subtotals and grand total
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
      grandTotal += Number(b.bushels||0);
      return `<tr>
        <td>${b.date||''}</td>
        <td>${b.crop||''}</td>
        <td class="num">${fmtCommas(b.bushels||0)}</td>
        <td>${(b.notes||'').replace(/</g,'&lt;')}</td>
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
   Settings
   ========================= */
function viewSettingsHome(){
  app.innerHTML = `
    <div class="grid">
      ${tile('🌱','Crop Type','#/settings/crops')}
      ${tile('🌓','Theme','#/settings/theme')}
    </div>
    <div class="section"><a class="btn" href="#/home">Back to Dashboard</a></div>
  `;
}
const CROPS_KEY='df_crops';
function migrateCropsShape(arr){ if(!Array.isArray(arr))return[]; if(arr.length && typeof arr[0]==='string') return arr.map(n=>({name:n,archived:false})); return arr.map(o=>({name:String(o.name||'').trim(),archived:!!o.archived})); }
function loadCrops(){
  try{
    const raw=localStorage.getItem(CROPS_KEY);
    if(!raw) return [{name:'Corn',archived:false},{name:'Soybeans',archived:false}];
    const arr=JSON.parse(raw); const norm=migrateCropsShape(arr);
    return norm.length?norm:[{name:'Corn',archived:false},{name:'Soybeans',archived:false}];
  }catch{ return [{name:'Corn',archived:false},{name:'Soybeans',archived:false}]; }
}
function saveCrops(list){ try{ localStorage.setItem(CROPS_KEY, JSON.stringify(list)); }catch{} }
function isCropInUse(name){ return false; }

function viewSettingsCrops(){
  const crops=loadCrops();
  const items=crops.map((o,i)=>{
    const status=o.archived? '<span class="chip chip-archived" title="Archived">Archived</span>':'';
    const actions=o.archived
      ? `<button class="btn" data-unarchive="${i}">Unarchive</button> <button class="btn" data-delete="${i}">Delete</button>`
      : `<button class="btn" data-archive="${i}">Archive</button> <button class="btn" data-delete="${i}">Delete</button>`;
    return `<li class="crop-row ${(o.archived?'is-archived':'')}"><div class="crop-info"><span class="chip">${o.name}</span> ${status}</div><div class="crop-actions">${actions}</div></li>`;
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
  const addBtn=document.getElementById('add-crop');
  const input=document.getElementById('new-crop');
  const listEl=app.querySelector('.crop-list');
  addBtn?.addEventListener('click', ()=>{
    const name=String(input.value||'').trim(); if(!name) return;
    const cs=loadCrops();
    if (cs.some(c=>c.name.toLowerCase()===name.toLowerCase())){ input.value=''; return; }
    cs.push({name,archived:false}); saveCrops(cs); viewSettingsCrops();
  });
  input?.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); addBtn?.click(); } });
  listEl?.addEventListener('click', e=>{
    const btn=e.target.closest?.('button'); if(!btn) return;
    const cs=loadCrops();
    if(btn.hasAttribute('data-archive')){ const i=+btn.getAttribute('data-archive'); if(cs[i]){ cs[i].archived=true; saveCrops(cs); viewSettingsCrops(); } }
    else if(btn.hasAttribute('data-unarchive')){ const j=+btn.getAttribute('data-unarchive'); if(cs[j]){ cs[j].archived=false; saveCrops(cs); viewSettingsCrops(); } }
    else if(btn.hasAttribute('data-delete')){ const k=+btn.getAttribute('data-delete'); if(!cs[k]) return; const nm=cs[k].name;
      if(isCropInUse(nm)){ alert(`“${nm}” is used in your data. Archive instead.`); return; }
      if(!confirm(`Delete “${nm}”? This cannot be undone.`)) return;
      cs.splice(k,1); saveCrops(cs); viewSettingsCrops();
    }
  });
}
function viewSettingsTheme(){
  const key='df_theme';
  const current = (localStorage.getItem(key) || 'auto');
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
      localStorage.setItem(key, r.value);
      document.documentElement.setAttribute('data-theme', r.value);
    });
  });
}

/* =========================
   Feedback (working forms)
   ========================= */
function saveFeedback(entry){
  try{ const key='df_feedback'; const list=JSON.parse(localStorage.getItem(key)||'[]'); list.push(entry); localStorage.setItem(key, JSON.stringify(list)); }catch{}
}
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
  app.innerHTML = `
    <section class="section">
      <h1>🛠️ Report Errors</h1>
      <div class="field"><label class="choice"><input id="err-date" type="date" value="${today}"> <span class="small muted">Date (Required)</span></label></div>
      <div class="field"><input id="err-subj" type="text" placeholder="Subject *"></div>
      <div class="field"><textarea id="err-desc" rows="5" placeholder="What happened? *"></textarea></div>
      <div class="field"><input id="err-by" type="text" placeholder="Submitted by" value="${user}"></div>
      <button id="err-submit" class="btn-primary">Submit</button> <a class="btn" href="#/feedback">Back to Feedback</a>
    </section>
  `;
  document.getElementById('err-submit')?.addEventListener('click', ()=>{
    const date=String(document.getElementById('err-date').value||'').trim();
    const subject=String(document.getElementById('err-subj').value||'').trim();
    const details=String(document.getElementById('err-desc').value||'').trim();
    const by=String(document.getElementById('err-by').value||'').trim();
    if(!date||!subject||!details){ alert('Please fill the required fields.'); return; }
    saveFeedback({type:'error', date, subject, details, by, ts:Date.now()});
    alert('Thanks! Your error report was saved.'); location.hash='#/feedback';
  });
}
function viewFeedbackFeature(){
  const today = new Date().toISOString().slice(0,10);
  const user = (localStorage.getItem('df_user')||'').trim();
  app.innerHTML = `
    <section class="section">
      <h1>💡 New Feature Request</h1>
      <div class="field"><label class="choice"><input id="feat-date" type="date" value="${today}"> <span class="small muted">Date (Required)</span></label></div>
      <div class="field"><input id="feat-subj" type="text" placeholder="Feature title *"></div>
      <div class="field"><textarea id="feat-desc" rows="5" placeholder="Describe the idea *"></textarea></div>
      <div class="field"><input id="feat-by" type="text" placeholder="Submitted by" value="${user}"></div>
      <button id="feat-submit" class="btn-primary">Submit</button> <a class="btn" href="#/feedback">Back to Feedback</a>
    </section>
  `;
  document.getElementById('feat-submit')?.addEventListener('click', ()=>{
    const date=String(document.getElementById('feat-date').value||'').trim();
    const subject=String(document.getElementById('feat-subj').value||'').trim();
    const details=String(document.getElementById('feat-desc').value||'').trim();
    const by=String(document.getElementById('feat-by').value||'').trim();
    if(!date||!subject||!details){ alert('Please fill the required fields.'); return; }
    saveFeedback({type:'feature', date, subject, details, by, ts:Date.now()});
    alert('Thanks! Your feature request was saved.'); location.hash='#/feedback';
  });
}
/* =========================
   Generic Section Fallback
   ========================= */
function viewSection(title, backHref = '#/home', backLabel = 'Back to Dashboard'){
  app.innerHTML = `
    <section class="section">
      <h1>${title}</h1>
      <p>🚧 Coming soon.</p>
      <a class="btn" href="${backHref}">${backLabel}</a>
    </section>
  `;
}

/* =========================
   Router (guarded)
   ========================= */
function route(){
  try {
    ensureHomeHash();
    const hash = location.hash || '#/home';
    renderBreadcrumb();

    if (hash==='#/home'||hash==='') viewHome();

    // Crop
    else if (hash==='#/crop') viewCropHub();
    else if (hash==='#/crop/planting') viewCropComing('Planting');
    else if (hash==='#/crop/spraying') viewCropComing('Spraying');
    else if (hash==='#/crop/aerial') viewCropComing('Aerial Spray');
    else if (hash==='#/crop/harvest') viewCropComing('Harvest');
    else if (hash==='#/crop/maintenance') viewFieldMaintenance();
    else if (hash==='#/crop/scouting') viewCropComing('Scouting');
    else if (hash==='#/crop/trials') viewCropComing('Trials');

    // Calculators
    else if (hash==='#/calc') viewCalcHub();
    else if (hash==='#/calc/fertilizer') viewCalcFertilizer();
    else if (hash==='#/calc/bin') viewCalcBin();
    else if (hash==='#/calc/area') viewCalcArea();
    else if (hash==='#/calc/combine') viewCalcCombine();
    else if (hash==='#/calc/chem') viewCalcChem();

    // Equipment
    else if (hash==='#/equipment') viewEquipmentHub();
    else if (hash.startsWith('#/equipment/')) viewEquipmentComing(LABELS[hash]||'Equipment');

    // Grain
    else if (hash==='#/grain') viewGrainHub();
    else if (hash==='#/grain/bag') viewGrainBag();
    else if (hash==='#/grain/bins') viewGrainComing('Grain Bins');
    else if (hash==='#/grain/contracts') viewGrainComing('Grain Contracts');
    else if (hash==='#/grain/tickets') viewGrainComing('Grain Ticket OCR');

    // Team & Partners (your existing screens elsewhere in your file)
    else if (hash === '#/team') { viewTeamHub(); }
    else if (hash === '#/team/employees') { viewTeamEmployees(); }
    else if (hash === '#/team/subcontractors') { viewTeamSubcontractors(); }
    else if (hash === '#/team/vendors') { viewTeamVendors(); }
    else if (hash.indexOf('#/team/dir') === 0) { viewTeamDirectory(); }

    // Reports
    else if (hash==='#/ai') viewReportsHub();
    else if (hash==='#/ai/premade') viewReportsPremade();
    else if (hash==='#/ai/premade/feedback') viewReportsPremadeFeedback();
    else if (hash==='#/ai/premade/grain-bags') viewReportsPremadeGrainBags();
    else if (hash==='#/ai/ai') viewReportsAI();
    else if (hash==='#/ai/yield') viewReportsYield();

    // Settings
    else if (hash==='#/settings') viewSettingsHome();
    else if (hash==='#/settings/crops') viewSettingsCrops();
    else if (hash==='#/settings/theme') viewSettingsTheme();

    // Feedback
    else if (hash==='#/feedback') viewFeedbackHub();
    else if (hash==='#/feedback/errors') viewFeedbackErrors();
    else if (hash==='#/feedback/feature') viewFeedbackFeature();

    else viewSection('Not Found','#/home');

  } catch (err) {
    console.error('Route error:', err);
    app.innerHTML = `
      <section class="section">
        <h1>Something went wrong</h1>
        <p class="muted">The view failed to render. We’ve defaulted you back to the dashboard.</p>
        <a class="btn" href="#/home">Back to Dashboard</a>
      </section>
    `;
  } finally {
    scrollTopAll();
    refreshLayout();
    bindPhoneAutoFormat(app);
  }
}
window.addEventListener('hashchange', route);
window.addEventListener('load', () => { ensureHomeHash(); route(); });

// ===== Footer text + clock =====
if (versionEl) versionEl.textContent = displayVersion(APP_VERSION);
if (todayEl) todayEl.textContent = prettyDate(new Date());
function tick(){ if (clockEl) clockEl.textContent = formatClock12(new Date()); }
tick(); setInterval(tick, 15000);

// ===== Robust Logout =====
function doLogout(){
  try{ localStorage.removeItem('df_auth'); localStorage.removeItem('df_user'); }catch{}
  location.assign('login.html?bye='+Date.now());
}
document.getElementById('logout')?.addEventListener('click', (e)=>{ e.preventDefault(); doLogout(); });
document.addEventListener('click', (e)=>{
  const el = e.target.closest('#logout,[data-action="logout"],a[href="logout"]');
  if (!el) return; e.preventDefault(); doLogout();
});

// ===== Update banner logic =====
function showUpdateBanner(){ if (bannerEl){ bannerEl.hidden=false; refreshLayout(); } }
function hideUpdateBanner(){ if (bannerEl){ bannerEl.hidden=true; refreshLayout(); } }
function markVersionAsCurrent(){ try{ localStorage.setItem('df_app_version', normalizeVersion(APP_VERSION)); }catch{} }
function storedVersion(){ try{ return localStorage.getItem('df_app_version')||''; }catch{ return ''; } }
function needsUpdate(){ const saved=storedVersion(), cur=normalizeVersion(APP_VERSION); return saved && saved!==cur; }
function syncBannerWithVersion(){ if (needsUpdate()) showUpdateBanner(); else { hideUpdateBanner(); markVersionAsCurrent(); } }

bannerBtn?.addEventListener('click', ()=>{
  try{ sessionStorage.setItem('df_updating','1'); }catch{}
  bannerBtn.disabled = true;
  bannerBtn.textContent = 'Updating…';
  hideUpdateBanner();
  if (window.__waitingSW) window.__waitingSW.postMessage({type:'SKIP_WAITING'}); else location.reload();
});

window.addEventListener('load', ()=>{
  try{
    const flag = sessionStorage.getItem('df_updating');
    if (flag==='1'){ sessionStorage.removeItem('df_updating'); markVersionAsCurrent(); hideUpdateBanner(); return; }
  }catch{}
  if (navigator.serviceWorker && navigator.serviceWorker.controller){ markVersionAsCurrent(); hideUpdateBanner(); }
  else { syncBannerWithVersion(); }
});

// ===== Service Worker registration (cache-bust Chrome) =====
if ('serviceWorker' in navigator){
  window.addEventListener('load', async ()=>{
    try{
      const reg = await navigator.serviceWorker.register(
        `service-worker.js?v=${normalizeVersion(APP_VERSION)}`,
        { updateViaCache: 'none' }
      );

      reg.update();
      document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='visible') reg.update(); });

      if (reg.waiting){ window.__waitingSW = reg.waiting; if (needsUpdate()) showUpdateBanner(); }

      reg.addEventListener('updatefound', ()=>{
        const sw = reg.installing; if(!sw) return;
        sw.addEventListener('statechange', ()=>{
          if (sw.state==='installed' && navigator.serviceWorker.controller){
            window.__waitingSW = reg.waiting || sw;
            if (needsUpdate()) showUpdateBanner();
          }
        });
      });

      navigator.serviceWorker.addEventListener('controllerchange', ()=>{
        window.__waitingSW = null;
        markVersionAsCurrent(); hideUpdateBanner();
        setTimeout(()=>location.reload(), 200);
      });
    }catch(e){ console.error('SW registration failed', e); }
  });
}
/* =========================
   PATCH v10.13.2 — UI polish + dark theme bg fix + Combine calc (length + header)
   Append this at the very end of app.js.
   ========================= */

// --- 1) Dark-theme background “ivory flash” fix ---
(function injectPageBgFix(){
  if (document.getElementById('df-patch-10132-css')) return;
  const css = document.createElement('style');
  css.id = 'df-patch-10132-css';
  css.textContent = `
    :root { --page-bg: #f6f6e8; }                 /* light */
    [data-theme="dark"] { --page-bg: #0f0f0f; }   /* dark */
    html, body, #app { background-color: var(--page-bg) !important; }
    /* calculator grid alignment */
    .calc-grid {
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:10px;
    }
    @media (max-width: 540px){
      .calc-grid { grid-template-columns: 1fr 1fr; } /* stays two-up on phones */
    }
    .calc-row { display:flex; gap:10px; flex-wrap:wrap; }
    .calc-actions { display:flex; gap:10px; flex-wrap:wrap; margin-top:6px; }
    .result-card {
      border:1px solid rgba(0,0,0,.12);
      border-radius:10px;
      padding:10px;
      margin-top:10px;
      background:rgba(255,255,255,.05);
    }
    [data-theme="light"] .result-card { background:#fff; }
  `;
  document.head.appendChild(css);
})();

// small helpers (safe re-declare pattern)
function __df_digits(s){ return String(s||'').replace(/\D+/g,''); }
function __df_number(x){ const n = Number(String(x).replace(/,/g,'')); return Number.isFinite(n)?n:0; }
function __df_commas(n){ try { return Number(n).toLocaleString(); } catch { return String(n); } }

// --- 2) Override Combine Yield Calculator with Length + Header Width ---
(function patchCombineCalculator(){
  if (window.__dfPatched_Combine) return; // avoid double patch
  window.__dfPatched_Combine = true;

  // keep your dry-basis & test weight defaults
  const CROP_PRESETS = {
    'Corn':     { dryBasis: 15.5, testWt: 56, emoji: '🌽' },
    'Soybeans': { dryBasis: 13.0, testWt: 60, emoji: '🫘' }
  };

  // Override function from core
  window.viewCalcCombine = function(){
    const cropOpts = Object.keys(CROP_PRESETS).map(c=>`<option value="${c}">${c}</option>`).join('');
    const todayEmoji = '🌽🌱'; // keeps your breadcrumb emoji feel

    app.innerHTML = `
      <section class="section">
        <h1>${todayEmoji} Combine Yield Calculator</h1>

        <div class="calc-grid">
          <div class="field">
            <label>Crop</label>
            <select id="cy-crop">${cropOpts}</select>
          </div>

          <div class="field">
            <label>Wet Weight (lb) *</label>
            <input id="cy-wet" type="number" inputmode="decimal" placeholder="e.g., 54,000">
          </div>

          <div class="field">
            <label>Moisture % *</label>
            <input id="cy-moist" type="number" inputmode="decimal" placeholder="e.g., 18">
          </div>

          <div class="field">
            <label>Length (ft) *</label>
            <input id="cy-length" type="number" inputmode="decimal" placeholder="Feet harvested">
          </div>

          <div class="field">
            <label>Header Width *</label>
            <select id="cy-width">
              <option value="30">30’</option>
              <option value="35">35’</option>
              <option value="40" selected>40’</option>
              <option value="45">45’</option>
            </select>
          </div>

          <div class="field">
            <label>Dry Basis %</label>
            <input id="cy-dry" type="number" inputmode="decimal" placeholder="Auto by crop">
          </div>

          <div class="field">
            <label>lb / bu (test wt)</label>
            <input id="cy-test" type="number" inputmode="decimal" placeholder="Auto by crop">
          </div>
        </div>

        <div class="small muted" style="margin-top:6px;">
          Leave “Dry Basis %” and “lb/bu” blank to auto-fill by crop. Acres will be calculated from Length × Header Width.
        </div>

        <div class="calc-actions">
          <button id="cy-go" class="btn-primary">Calculate</button>
          <a class="btn" href="#/calc">Back to Calculator</a>
          <a class="btn" href="#/home">Back to Dashboard</a>
        </div>

        <div id="cy-out" class="result-card" style="display:none;"></div>
      </section>
    `;

    // auto-fill presets on crop change
    const cropSel = document.getElementById('cy-crop');
    const dryInp  = document.getElementById('cy-dry');
    const testInp = document.getElementById('cy-test');
    function applyPreset(){
      const p = CROP_PRESETS[cropSel.value];
      if (!dryInp.value)  dryInp.value  = p.dryBasis;
      if (!testInp.value) testInp.value = p.testWt;
    }
    cropSel.addEventListener('change', applyPreset);
    applyPreset();

    document.getElementById('cy-go')?.addEventListener('click', ()=>{
      const crop   = cropSel.value;
      const wetLb  = __df_number(document.getElementById('cy-wet').value);
      const moist  = __df_number(document.getElementById('cy-moist').value);
      const lenFt  = __df_number(document.getElementById('cy-length').value);
      const headFt = __df_number(document.getElementById('cy-width').value);
      const dryPct = __df_number(dryInp.value || CROP_PRESETS[crop].dryBasis);
      const testWt = __df_number(testInp.value || CROP_PRESETS[crop].testWt);

      if (!wetLb || !moist || !lenFt || !headFt){
        alert('Please fill Wet Weight, Moisture, Length and Header Width.');
        return;
      }

      // Acres from length × header width
      const acres = (lenFt * headFt) / 43560; // 43,560 sq ft per acre
      if (acres <= 0){ alert('Calculated acres is zero or negative. Check length/header width.'); return; }

      // Wet bushels from test weight
      const wetBu = wetLb / testWt;

      // Convert to dry (true shrink): factor = (100 - actual) / (100 - dryBasis)
      const dryFactor = (100 - moist) / (100 - dryPct);
      const adjBu = wetBu * dryFactor;

      // Yield (bu/ac)
      const yieldBuAc = adjBu / acres;

      // Simple shrink % shown for clarity
      const shrinkPct = (1 - dryFactor) * 100;

      const out = document.getElementById('cy-out');
      out.style.display = '';
      out.innerHTML = `
        <div><strong>Crop:</strong> ${CROP_PRESETS[crop].emoji} ${crop}</div>
        <div class="calc-row">
          <div><strong>Acres (calc):</strong> ${acres.toFixed(3)}</div>
          <div><strong>Wet Bushels:</strong> ${__df_commas(wetBu.toFixed(2))}</div>
        </div>
        <div class="calc-row">
          <div><strong>Dry Basis %:</strong> ${dryPct}%</div>
          <div><strong>Test Wt:</strong> ${testWt} lb/bu</div>
        </div>
        <div class="calc-row">
          <div><strong>Adjusted (dry) Bu:</strong> ${__df_commas(adjBu.toFixed(2))}</div>
          <div><strong>Yield:</strong> ${__df_commas(yieldBuAc.toFixed(1))} bu/ac</div>
        </div>
        <div class="small muted">Shrink applied ≈ ${shrinkPct.toFixed(1)}% from ${moist}% to ${dryPct}%.</div>
      `;
      window.scrollTo({ top: document.body.scrollHeight, behavior:'smooth' });
    });
  };
})();
/* =========================
   PATCH v10.14.1 — startup + shim + bg
   ========================= */

// 1) Guarantee background never shows ivory in dark mode
(function dfBgFix(){
  if (document.getElementById('df-bgfix-10141')) return;
  const s = document.createElement('style');
  s.id = 'df-bgfix-10141';
  s.textContent = `
    :root{ --page-bg:#f6f6e8; } 
    [data-theme="dark"]{ --page-bg:#0f0f0f; }
    html,body,#app{ background:var(--page-bg)!important; min-height:100%; }
  `;
  document.head.appendChild(s);
})();

// 2) Safety shims so the router never explodes if a view is missing
(function dfViewShims(){
  const noop = (title)=>()=>{ 
    app.innerHTML = `<section class="section"><h1>${title||'Coming Soon'}</h1><p class="muted">Screen not wired yet.</p><a class="btn" href="#/home">Back to Dashboard</a></section>`;
  };
  window.viewTeamHub            = window.viewTeamHub            || noop('Team & Partners');
  window.viewTeamEmployees      = window.viewTeamEmployees      || noop('Employees');
  window.viewTeamSubcontractors = window.viewTeamSubcontractors || noop('Subcontractors');
  window.viewTeamVendors        = window.viewTeamVendors        || noop('Vendors');
  window.viewTeamDirectory      = window.viewTeamDirectory      || noop('Directory');
  window.viewReportsAI          = window.viewReportsAI          || noop('AI Reports');
  window.viewReportsYield       = window.viewReportsYield       || noop('Yield Report');
  window.viewGrainComing        = window.viewGrainComing        || noop('Grain — Coming Soon');
})();

// 3) Make sure a hash exists and kick the router once DOM is ready
(function dfBootstrap(){
  function start(){
    try{
      if (!location.hash || location.hash==='#') location.replace('#/home');
      // force one route pass after hash set
      if (typeof route==='function') route();
      // ensure footer version shows current constant
      if (window.versionEl && typeof displayVersion==='function'){
        versionEl.textContent = displayVersion(typeof APP_VERSION!=='undefined'?APP_VERSION:'v10.14.1');
      }
    }catch(e){ console.error('bootstrap', e); }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
/* =========================
   PATCH v10.13.2 — UI polish + dark theme bg fix + Combine calc (length + header)
   Append this at the very end of app.js.
   ========================= */

// --- 1) Dark-theme background “ivory flash” fix ---
(function injectPageBgFix(){
  if (document.getElementById('df-patch-10132-css')) return;
  const css = document.createElement('style');
  css.id = 'df-patch-10132-css';
  css.textContent = `
    :root { --page-bg: #f6f6e8; }                 /* light */
    [data-theme="dark"] { --page-bg: #0f0f0f; }   /* dark */
    html, body, #app { background-color: var(--page-bg) !important; }
    /* calculator grid alignment */
    .calc-grid {
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:10px;
    }
    @media (max-width: 540px){
      .calc-grid { grid-template-columns: 1fr 1fr; } /* stays two-up on phones */
    }
    .calc-row { display:flex; gap:10px; flex-wrap:wrap; }
    .calc-actions { display:flex; gap:10px; flex-wrap:wrap; margin-top:6px; }
    .result-card {
      border:1px solid rgba(0,0,0,.12);
      border-radius:10px;
      padding:10px;
      margin-top:10px;
      background:rgba(255,255,255,.05);
    }
    [data-theme="light"] .result-card { background:#fff; }
  `;
  document.head.appendChild(css);
})();

// small helpers (safe re-declare pattern)
function __df_digits(s){ return String(s||'').replace(/\D+/g,''); }
function __df_number(x){ const n = Number(String(x).replace(/,/g,'')); return Number.isFinite(n)?n:0; }
function __df_commas(n){ try { return Number(n).toLocaleString(); } catch { return String(n); } }

// --- 2) Override Combine Yield Calculator with Length + Header Width ---
(function patchCombineCalculator(){
  if (window.__dfPatched_Combine) return; // avoid double patch
  window.__dfPatched_Combine = true;

  // keep your dry-basis & test weight defaults
  const CROP_PRESETS = {
    'Corn':     { dryBasis: 15.5, testWt: 56, emoji: '🌽' },
    'Soybeans': { dryBasis: 13.0, testWt: 60, emoji: '🫘' }
  };

  // Override function from core
  window.viewCalcCombine = function(){
    const cropOpts = Object.keys(CROP_PRESETS).map(c=>`<option value="${c}">${c}</option>`).join('');
    const todayEmoji = '🌽🌱'; // keeps your breadcrumb emoji feel

    app.innerHTML = `
      <section class="section">
        <h1>${todayEmoji} Combine Yield Calculator</h1>

        <div class="calc-grid">
          <div class="field">
            <label>Crop</label>
            <select id="cy-crop">${cropOpts}</select>
          </div>

          <div class="field">
            <label>Wet Weight (lb) *</label>
            <input id="cy-wet" type="number" inputmode="decimal" placeholder="e.g., 54,000">
          </div>

          <div class="field">
            <label>Moisture % *</label>
            <input id="cy-moist" type="number" inputmode="decimal" placeholder="e.g., 18">
          </div>

          <div class="field">
            <label>Length (ft) *</label>
            <input id="cy-length" type="number" inputmode="decimal" placeholder="Feet harvested">
          </div>

          <div class="field">
            <label>Header Width *</label>
            <select id="cy-width">
              <option value="30">30’</option>
              <option value="35">35’</option>
              <option value="40" selected>40’</option>
              <option value="45">45’</option>
            </select>
          </div>

          <div class="field">
            <label>Dry Basis %</label>
            <input id="cy-dry" type="number" inputmode="decimal" placeholder="Auto by crop">
          </div>

          <div class="field">
            <label>lb / bu (test wt)</label>
            <input id="cy-test" type="number" inputmode="decimal" placeholder="Auto by crop">
          </div>
        </div>

        <div class="small muted" style="margin-top:6px;">
          Leave “Dry Basis %” and “lb/bu” blank to auto-fill by crop. Acres will be calculated from Length × Header Width.
        </div>

        <div class="calc-actions">
          <button id="cy-go" class="btn-primary">Calculate</button>
          <a class="btn" href="#/calc">Back to Calculator</a>
          <a class="btn" href="#/home">Back to Dashboard</a>
        </div>

        <div id="cy-out" class="result-card" style="display:none;"></div>
      </section>
    `;

    // auto-fill presets on crop change
    const cropSel = document.getElementById('cy-crop');
    const dryInp  = document.getElementById('cy-dry');
    const testInp = document.getElementById('cy-test');
    function applyPreset(){
      const p = CROP_PRESETS[cropSel.value];
      if (!dryInp.value)  dryInp.value  = p.dryBasis;
      if (!testInp.value) testInp.value = p.testWt;
    }
    cropSel.addEventListener('change', applyPreset);
    applyPreset();

    document.getElementById('cy-go')?.addEventListener('click', ()=>{
      const crop   = cropSel.value;
      const wetLb  = __df_number(document.getElementById('cy-wet').value);
      const moist  = __df_number(document.getElementById('cy-moist').value);
      const lenFt  = __df_number(document.getElementById('cy-length').value);
      const headFt = __df_number(document.getElementById('cy-width').value);
      const dryPct = __df_number(dryInp.value || CROP_PRESETS[crop].dryBasis);
      const testWt = __df_number(testInp.value || CROP_PRESETS[crop].testWt);

      if (!wetLb || !moist || !lenFt || !headFt){
        alert('Please fill Wet Weight, Moisture, Length and Header Width.');
        return;
      }

      // Acres from length × header width
      const acres = (lenFt * headFt) / 43560; // 43,560 sq ft per acre
      if (acres <= 0){ alert('Calculated acres is zero or negative. Check length/header width.'); return; }

      // Wet bushels from test weight
      const wetBu = wetLb / testWt;

      // Convert to dry (true shrink): factor = (100 - actual) / (100 - dryBasis)
      const dryFactor = (100 - moist) / (100 - dryPct);
      const adjBu = wetBu * dryFactor;

      // Yield (bu/ac)
      const yieldBuAc = adjBu / acres;

      // Simple shrink % shown for clarity
      const shrinkPct = (1 - dryFactor) * 100;

      const out = document.getElementById('cy-out');
      out.style.display = '';
      out.innerHTML = `
        <div><strong>Crop:</strong> ${CROP_PRESETS[crop].emoji} ${crop}</div>
        <div class="calc-row">
          <div><strong>Acres (calc):</strong> ${acres.toFixed(3)}</div>
          <div><strong>Wet Bushels:</strong> ${__df_commas(wetBu.toFixed(2))}</div>
        </div>
        <div class="calc-row">
          <div><strong>Dry Basis %:</strong> ${dryPct}%</div>
          <div><strong>Test Wt:</strong> ${testWt} lb/bu</div>
        </div>
        <div class="calc-row">
          <div><strong>Adjusted (dry) Bu:</strong> ${__df_commas(adjBu.toFixed(2))}</div>
          <div><strong>Yield:</strong> ${__df_commas(yieldBuAc.toFixed(1))} bu/ac</div>
        </div>
        <div class="small muted">Shrink applied ≈ ${shrinkPct.toFixed(1)}% from ${moist}% to ${dryPct}%.</div>
      `;
      window.scrollTo({ top: document.body.scrollHeight, behavior:'smooth' });
    });
  };
})();
/* === Patch: show full version in footer === */
(function showFullVersionInFooter(){
  try {
    const el = document.getElementById('version');
    if (el) el.textContent = String(APP_VERSION); // e.g., 'v10.14.3'
  } catch {}
})();
/* =========================
   PATCH v10.14.x — Auto theme background fix
   - Ensures page bg is correct when data-theme="auto"
   - Stops ivory flash on iOS Safari while scrolling
   ========================= */
(function injectAutoThemeBgFix(){
  if (document.getElementById('df-auto-bg-fix')) return;
  const css = document.createElement('style');
  css.id = 'df-auto-bg-fix';
  css.textContent = `
    :root{
      --page-bg-light:#f6f6e8;    /* your light ivory */
      --page-bg-dark:#0f0f0f;     /* your dark page */
      --page-bg: var(--page-bg-light);
    }

    /* explicit modes */
    [data-theme="light"] { --page-bg: var(--page-bg-light); }
    [data-theme="dark"]  { --page-bg: var(--page-bg-dark); }

    /* AUTO follows system */
    [data-theme="auto"]  { --page-bg: var(--page-bg-light); }
    @media (prefers-color-scheme: dark){
      [data-theme="auto"] { --page-bg: var(--page-bg-dark); }
    }

    /* Paint everything, including iOS overscroll areas */
    html, body, #app, main {
      background-color: var(--page-bg) !important;
    }
    body { min-height: 100vh; }
  `;
  document.head.appendChild(css);
})();