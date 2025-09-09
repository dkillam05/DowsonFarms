// ===== Version (footer shows vMAJOR.MINOR) =====
const APP_VERSION = 'v10.14.7';

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
/* =========================
   PATCH v10.14.5 — Team & Partners (restore + forms)
   - Employees, Subcontractors, Vendors, Directory
   - Clean phone storage (digits); pretty display; email validation
   - LocalStorage keys:
       df_team_employees, df_team_subs, df_team_vendors
   ========================= */

// ------- Small shared helpers (safe to re-declare) -------
function df_load(key, fb = []){ try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fb)); } catch { return fb; } }
function df_save(key, val){ try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }
function df_uid(){ return Math.random().toString(36).slice(2) + Date.now().toString(36); }
function df_onlyDigits(s){ return String(s||'').replace(/\D+/g,''); }
function df_fmtPhone(d){
  d = df_onlyDigits(d).slice(0,10);
  if (!d) return '';
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0,3)}) ${d.slice(3)}`;
  return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;
}
function df_html(s){ return String(s||'').replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#39;' }[m])); }
function df_emailOk(e){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e||'').trim()); }
function df_chip(txt){ return `<span class="chip">${df_html(txt)}</span>`; }

// Bind our phone auto-formatter in case the core didn’t yet
function df_bindPhones(root=document){ 
  try { if (typeof bindPhoneAutoFormat==='function') bindPhoneAutoFormat(root); } catch {}
}

// ------- Storage keys -------
const EMP_KEY = 'df_team_employees';
const SUB_KEY = 'df_team_subs';
const VEN_KEY = 'df_team_vendors';

// ------- 0) Hub -------
window.viewTeamHub = function(){
  app.innerHTML = `
    <div class="grid">
      ${tile('👷','Employees','#/team/employees')}
      ${tile('🛠️','Subcontractors','#/team/subcontractors')}
      ${tile('🏪','Vendors','#/team/vendors')}
      ${tile('📇','Directory','#/team/dir')}
    </div>
    <div class="section"><a class="btn" href="#/home">Back to Dashboard</a></div>
  `;
};

// ------- 1) Employees -------
window.viewTeamEmployees = function(){
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

  df_bindPhones(app);

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
    df_bindPhones(app);
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
};

// ------- 2) Subcontractors -------
window.viewTeamSubcontractors = function(){
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

  df_bindPhones(app);
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
    df_bindPhones(app);
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
};

// ------- 3) Vendors -------
window.viewTeamVendors = function(){
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

  df_bindPhones(app);
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
    df_bindPhones(app);
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
};

// ------- 4) Directory (roll-up) -------
window.viewTeamDirectory = function(){
  const emps = df_load(EMP_KEY).map(x=>({ type:'Employee', name:x.name, org:x.role||'', phone:x.phone, email:x.email }));
  const subs = df_load(SUB_KEY).map(x=>({ type:'Sub',      name:x.company, org:x.contact||'', phone:x.phone, email:x.email }));
  const vens = df_load(VEN_KEY).map(x=>({ type:'Vendor',   name:x.company, org:x.account||'', phone:x.phone, email:x.email }));
  const all = [...emps,...subs,...vens].sort((a,b)=>a.name.localeCompare(b.name));

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
};
/* =========================================================
   Dowson Farms — PATCH v10.14.6
   Paste at the very bottom of app.js
   Covers:
   - Footer version override to v10.14.6
   - Calculator hub order
   - All 5 calculators working (incl. Elevator Shrink compare)
   - Crop Year selector on Crop hub (multi-year, per-user, +Add next year only)
   - UI polish (result cards, number formatting, small “Add job type” button)
   - Theme Settings: segmented 3-way switch (Auto/Light/Dark)
   ========================================================= */

(function DF_PATCH_10146(){
  'use strict';

  // ---------- Small helpers ----------
  const $ = (sel, root=document)=>root.querySelector(sel);
  const $$ = (sel, root=document)=>Array.from(root.querySelectorAll(sel));
  const num = v => { const n = Number(String(v).replace(/,/g,'')); return Number.isFinite(n)?n:0; };
  const commas = v => { try{ return Number(v).toLocaleString(); }catch{ return String(v); } };
  const html = s => String(s||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  // ---------- Footer version override (keeps incremental patching) ----------
  try{ const vEl = document.getElementById('version'); if (vEl) vEl.textContent = 'v10.14.6'; }catch{}

  // ---------- Minimal CSS for UI polish ----------
  (function injectCSS(){
    if (document.getElementById('df-patch-10146-css')) return;
    const s = document.createElement('style');
    s.id = 'df-patch-10146-css';
    s.textContent = `
      /* result cards & grids */
      .result-card{
        border:1px solid rgba(0,0,0,.12);
        border-radius:10px;
        padding:12px;
        margin-top:12px;
        background:rgba(255,255,255,.05);
      }
      [data-theme="light"] .result-card{ background:#fff; }
      .calc-grid{ display:grid; grid-template-columns:1fr 1fr; gap:10px; }
      @media (max-width:560px){ .calc-grid{ grid-template-columns:1fr 1fr; } }

      /* compact button */
      .btn-compact{ padding:4px 8px; font-size:.85rem; line-height:1.2; }

      /* segmented control for theme */
      .seg{
        display:inline-flex; border:1px solid var(--border,rgba(0,0,0,.2));
        border-radius:10px; overflow:hidden;
      }
      .seg button{
        appearance:none; background:transparent; border:0; padding:8px 14px; cursor:pointer;
      }
      .seg button.active{
        background:var(--seg-active,#1b5e20); color:#fff;
      }

      /* crop year chips */
      .year-bar{ display:flex; flex-wrap:wrap; gap:8px; align-items:center; margin:8px 0 14px; }
      .chip-toggle{
        display:inline-flex; align-items:center; gap:6px;
        border:1px solid rgba(0,0,0,.2); border-radius:999px; padding:6px 10px;
        cursor:pointer; user-select:none;
      }
      .chip-toggle input{ accent-color:#1b5e20; }
      .year-add{ margin-left:4px; }
    `;
    document.head.appendChild(s);
  })();

  // ---------- Field Maintenance: shrink the “Add” button ----------
  (function smallAddJobBtn(){
    const obs = new MutationObserver(()=>{
      const btn = document.getElementById('fm-add-job');
      if (btn && !btn.classList.contains('btn-compact')) btn.classList.add('btn-compact');
    });
    obs.observe(document.getElementById('app')||document.body, {childList:true, subtree:true});
  })();

  // =========================================================
  // 1) Calculator Hub — reorder tiles as requested
  // Row 1: Combine (L) + Bin (R)
  // Row 2: Fertilizer (L) + Chemical (R)
  // Row 3: Area (centered)
  // =========================================================
  window.viewCalcHub = function(){
    const row = (a,b)=>`<div class="grid">${a}${b}</div>`;
    const solo = a => `<div class="grid" style="grid-template-columns:1fr;max-width:380px;margin-inline:auto;">${a}</div>`;
    const t = (emoji,label,href)=>`<a class="tile" href="${href}"><span class="emoji">${emoji}</span><span class="label">${label}</span></a>`;
    app.innerHTML = `
      ${row(t('🌽🌱','Combine Yield','#/calc/combine'), t('🛢️','Bin Volume','#/calc/bin'))}
      ${row(t('👨🏼‍🔬','Fertilizer','#/calc/fertilizer'), t('🧪','Chemical Mix','#/calc/chem'))}
      ${solo(t('📐','Area','#/calc/area'))}
      <div class="section"><a class="btn" href="#/home">Back to Dashboard</a></div>
    `;
  };

  // =========================================================
  // 2) Combine Yield Calculator — Length + Header + True vs Elevator Shrink
  // =========================================================
  (function overrideCombine(){
    const PRESETS = {
      Corn:     { base: 15.5, lbbu:56, emoji:'🌽' },
      Soybeans: { base: 13.0, lbbu:60, emoji:'🫘' }
    };

    // Elevator shrink model:
    //  - 0% at/below base moisture
    //  - Linear up to 21% shrink at 29% moisture (per your earlier guidance)
    //  - Above 29%: clamp at 21% (or expand later if your schedule dictates)
    function elevatorShrinkPct(moist, base){
      if (moist <= base) return 0;
      const maxM = 29;
      const maxS = 21;
      if (moist >= maxM) return maxS;
      const slope = maxS / (maxM - base);
      return slope * (moist - base);
    }

    window.viewCalcCombine = function(){
      const crops = Object.keys(PRESETS).map(c=>`<option value="${c}">${c}</option>`).join('');
      app.innerHTML = `
        <section class="section">
          <h1>🌽🌱 Combine Yield Calculator</h1>

          <div class="calc-grid">
            <label><span class="small muted">Crop</span>
              <select id="cy-crop">${crops}</select>
            </label>
            <label><span class="small muted">Wet Weight (lb) *</span><input id="cy-wet" type="number" step="any" placeholder="e.g. 54,000"></label>
            <label><span class="small muted">Moisture % *</span><input id="cy-moist" type="number" step="any" placeholder="e.g. 18"></label>
            <label><span class="small muted">Length (ft) *</span><input id="cy-length" type="number" step="any" placeholder="Feet harvested"></label>
            <label><span class="small muted">Header Width *</span>
              <select id="cy-width">
                <option value="30">30’</option>
                <option value="35">35’</option>
                <option value="40" selected>40’</option>
                <option value="45">45’</option>
              </select>
            </label>
            <label><span class="small muted">Dry Basis % (auto)</span><input id="cy-base" type="number" step="any" placeholder="e.g. 15.5"></label>
            <label><span class="small muted">lb / bu (auto)</span><input id="cy-lbbu" type="number" step="any" placeholder="Corn 56 / Soy 60"></label>
          </div>

          <div class="small muted" style="margin-top:6px;">
            Leave “Dry Basis %” and “lb/bu” blank to auto-fill by crop. Acres = Length × Header ÷ 43,560.
          </div>

          <div class="calc-actions" style="display:flex;gap:10px;margin-top:8px;">
            <button id="cy-go" class="btn-primary">Calculate</button>
            <a class="btn" href="#/calc">Back</a>
            <a class="btn" href="#/home">Dashboard</a>
          </div>

          <div id="cy-out" class="result-card" style="display:none;"></div>
        </section>
      `;

      const cropSel = $('#cy-crop'), baseInp = $('#cy-base'), lbbuInp = $('#cy-lbbu');
      function fillDefaults(){ const p = PRESETS[cropSel.value]; if(!baseInp.value) baseInp.value=p.base; if(!lbbuInp.value) lbbuInp.value=p.lbbu; }
      cropSel.addEventListener('change', fillDefaults); fillDefaults();

      $('#cy-go').addEventListener('click', ()=>{
        const crop   = cropSel.value;
        const wetLb  = num($('#cy-wet').value);
        const moist  = num($('#cy-moist').value);
        const lenFt  = num($('#cy-length').value);
        const headFt = num($('#cy-width').value);
        const base   = num(baseInp.value || PRESETS[crop].base);
        const lbbu   = num(lbbuInp.value || PRESETS[crop].lbbu);

        if (!wetLb || !moist || !lenFt || !headFt){ alert('Enter Wet Weight, Moisture, Length and Header Width.'); return; }

        const acres = (lenFt * headFt) / 43560;
        if (acres <= 0){ alert('Calculated acres <= 0. Check length/header width.'); return; }

        const wetBu = wetLb / lbbu;

        // True shrink factor:
        const dryFactor = (100 - moist) / (100 - base);
        const trueBu = wetBu * dryFactor;
        const trueYield = trueBu / acres;
        const trueShrinkPct = (1 - dryFactor) * 100;

        // Elevator shrink (percentage off wet bushels), then bu/ac
        const elevShrink = elevatorShrinkPct(moist, base);
        const elevBu = wetBu * (1 - (elevShrink/100));
        const elevYield = elevBu / acres;

        const out = $('#cy-out'); out.style.display='';
        out.innerHTML = `
          <div><strong>Crop:</strong> ${PRESETS[crop].emoji} ${crop}</div>
          <div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:6px;">
            <div><strong>Acres (calc):</strong> ${acres.toFixed(3)}</div>
            <div><strong>Wet Bushels:</strong> ${commas(wetBu.toFixed(2))}</div>
            <div><strong>Test Wt:</strong> ${lbbu} lb/bu</div>
            <div><strong>Dry Basis:</strong> ${base}%</div>
          </div>

          <hr style="border:none;border-top:1px solid rgba(0,0,0,.12);margin:10px 0;">

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
            <div>
              <h3 style="margin:0 0 6px 0;">True Shrink</h3>
              <div><strong>Adj. Bushels:</strong> ${commas(trueBu.toFixed(2))}</div>
              <div><strong>Yield:</strong> ${commas(trueYield.toFixed(1))} bu/ac</div>
              <div class="small muted">Shrink applied ≈ ${trueShrinkPct.toFixed(1)}% (to ${base}%).</div>
            </div>
            <div>
              <h3 style="margin:0 0 6px 0;">Elevator Shrink</h3>
              <div><strong>Adj. Bushels:</strong> ${commas(elevBu.toFixed(2))}</div>
              <div><strong>Yield:</strong> ${commas(elevYield.toFixed(1))} bu/ac</div>
              <div class="small muted">Prorated elevator shrink ≈ ${elevShrink.toFixed(1)}%.</div>
            </div>
          </div>
        `;
        window.scrollTo({ top: document.body.scrollHeight, behavior:'smooth' });
      });
    };
  })();

  // =========================================================
  // 3) Fertilizer Calculator (target lb/ac → lb/ac & gal/ac + totals)
  // =========================================================
  window.viewCalcFertilizer = function(){
    const KEY='df_calc_fert';
    const s = JSON.parse(localStorage.getItem(KEY)||'{}');
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
          <label><span class="small muted">Target lb/acre *</span><input id="f-target" type="number" step="any" value="${html(s.target||'')}"></label>
          <label><span class="small muted">Product Analysis % *</span><input id="f-analysis" type="number" step="any" value="${html(s.analysis||'')}" placeholder="e.g. 32"></label>
          <label><span class="small muted">Density (lb/gal)</span>
            <select id="f-density">
              <option value="11.06" ${String(s.density||'11.06')==='11.06'?'selected':''}>UAN 32 (11.06)</option>
              <option value="10.67" ${String(s.density)==='10.67'?'selected':''}>UAN 28 (10.67)</option>
              <option value="8.34"  ${String(s.density)==='8.34'?'selected':''}>Water (8.34)</option>
              <option value="${html(s.density||'11.06')}" ${!['11.06','10.67','8.34'].includes(String(s.density))?'selected':''}>Custom (${html(s.density||'11.06')})</option>
            </select>
          </label>
          <label><span class="small muted">Acres *</span><input id="f-acres" type="number" step="any" value="${html(s.acres||'')}"></label>
        </div>

        <div class="calc-actions" style="display:flex;gap:10px;margin-top:8px;">
          <button id="f-go" class="btn-primary">Calculate</button>
          <a class="btn" href="#/calc">Back</a>
          <a class="btn" href="#/home">Dashboard</a>
        </div>

        <div id="f-out" class="result-card" style="display:none;"></div>
      </section>
    `;
    $('#f-go').addEventListener('click', ()=>{
      const payload = {
        nutrient: $('#f-nutrient').value,
        target:   num($('#f-target').value),
        analysis: num($('#f-analysis').value),
        density:  num($('#f-density').value||'11.06'),
        acres:    num($('#f-acres').value)
      };
      localStorage.setItem(KEY, JSON.stringify(payload));
      const {target,analysis,density,acres} = payload;
      if (!target || !analysis || !acres || analysis<=0 || analysis>100){ alert('Enter valid target, analysis(1–100) and acres.'); return; }
      const frac = analysis/100;
      const lbA  = target/frac;
      const galA = lbA/(density||1);
      const out = $('#f-out'); out.style.display='';
      out.innerHTML = `
        <div><strong>Product lb/acre:</strong> ${commas(lbA.toFixed(2))}</div>
        <div><strong>Product gal/acre:</strong> ${commas(galA.toFixed(2))}</div>
        <div><strong>Total lbs:</strong> ${commas((lbA*acres).toFixed(0))}</div>
        <div><strong>Total gal:</strong> ${commas((galA*acres).toFixed(1))}</div>
        <div class="small muted" style="margin-top:6px;">Density affects gal/acre; analysis drives lb/acre.</div>
      `;
    });
  };

  // =========================================================
  // 4) Bin Volume Calculator (cyl + optional cone)
  // =========================================================
  window.viewCalcBin = function(){
    const KEY='df_calc_bin';
    const s = JSON.parse(localStorage.getItem(KEY)||'{}');
    app.innerHTML = `
      <section class="section">
        <h1>🛢️ Bin Volume Calculator</h1>

        <div class="calc-grid">
          <label><span class="small muted">Diameter (ft) *</span><input id="b-d" type="number" step="any" value="${html(s.d||'')}"></label>
          <label><span class="small muted">Grain Depth (ft) *</span><input id="b-h" type="number" step="any" value="${html(s.h||'')}"></label>
          <label><span class="small muted">Roof</span>
            <select id="b-roof">
              <option value="flat" ${(!s.roof||s.roof==='flat')?'selected':''}>Flat/Simplified</option>
              <option value="cone" ${s.roof==='cone'?'selected':''}>Cone (add rise)</option>
            </select>
          </label>
          <label id="b-rise-wrap" style="display:${s.roof==='cone'?'block':'none'};"><span class="small muted">Cone Rise (ft)</span><input id="b-rise" type="number" step="any" value="${html(s.rise||'')}"></label>
          <label><span class="small muted">Crop</span>
            <select id="b-crop">
              <option ${(!s.crop||s.crop==='Corn')?'selected':''}>Corn</option>
              <option ${s.crop==='Soybeans'?'selected':''}>Soybeans</option>
              <option ${s.crop==='Custom'?'selected':''}>Custom</option>
            </select>
          </label>
          <label><span class="small muted">lb / bu</span><input id="b-lbbu" type="number" step="any" value="${html(s.lbbu||'56')}"></label>
          <label><span class="small muted">ft³ / bu</span><input id="b-buft3" type="number" step="any" value="${html(s.buft3||'1.244')}"></label>
        </div>

        <div class="calc-actions" style="display:flex;gap:10px;margin-top:8px;">
          <button id="b-go" class="btn-primary">Calculate</button>
          <a class="btn" href="#/calc">Back</a>
          <a class="btn" href="#/home">Dashboard</a>
        </div>

        <div id="b-out" class="result-card" style="display:none;"></div>
      </section>
    `;
    $('#b-roof').addEventListener('change', ()=>{ $('#b-rise-wrap').style.display = ($('#b-roof').value==='cone')?'block':'none'; });
    $('#b-crop').addEventListener('change', ()=>{
      if ($('#b-crop').value==='Corn') $('#b-lbbu').value='56';
      else if ($('#b-crop').value==='Soybeans') $('#b-lbbu').value='60';
    });
    $('#b-go').addEventListener('click', ()=>{
      const d=num($('#b-d').value), h=num($('#b-h').value), roof=$('#b-roof').value, rise=num($('#b-rise')?.value||0);
      const lbbu=num($('#b-lbbu').value||56), buft3=num($('#b-buft3').value||1.244);
      localStorage.setItem(KEY, JSON.stringify({d,h,roof,rise,crop:$('#b-crop').value,lbbu,buft3}));
      if(!d||!h||!lbbu||!buft3){ alert('Enter diameter, depth, lb/bu, ft³/bu.'); return; }
      const r=d/2;
      const volCyl = Math.PI*r*r*h;
      const volCone = roof==='cone' && rise>0 ? (Math.PI*r*r*rise)/3 : 0;
      const vol = volCyl + volCone;
      const bu = vol / buft3;
      const wt = bu * lbbu;
      const out=$('#b-out'); out.style.display='';
      out.innerHTML = `
        <div><strong>Volume (ft³):</strong> ${commas(vol.toFixed(0))}</div>
        <div><strong>Bushels:</strong> ${commas(bu.toFixed(0))}</div>
        <div><strong>Estimated Weight (lb):</strong> ${commas(wt.toFixed(0))}</div>
        <div class="small muted" style="margin-top:6px;">Assumes ideal fill; adjust for void/packing as needed.</div>
      `;
    });
  };

  // =========================================================
  // 5) Area Calculator (rect/circle/triangle; feet/meters; acres)
  // =========================================================
  window.viewCalcArea = function(){
    const KEY='df_calc_area';
    const s = JSON.parse(localStorage.getItem(KEY)||'{}');
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
          <label><span class="small muted">Length *</span><input id="a-len" type="number" step="any" value="${html(s.len||'')}"></label>
          <label><span class="small muted">Width *</span><input id="a-wid" type="number" step="any" value="${html(s.wid||'')}"></label>
        </div>

        <div id="a-circ" class="calc-grid" style="display:${s.shape==='Circle'?'grid':'none'};">
          <label><span class="small muted">Diameter *</span><input id="a-dia" type="number" step="any" value="${html(s.dia||'')}"></label>
          <div></div>
        </div>

        <div id="a-tri" class="calc-grid" style="display:${s.shape==='Triangle'?'grid':'none'};">
          <label><span class="small muted">Base *</span><input id="a-base" type="number" step="any" value="${html(s.base||'')}"></label>
          <label><span class="small muted">Height *</span><input id="a-height" type="number" step="any" value="${html(s.height||'')}"></label>
        </div>

        <div class="calc-actions" style="display:flex;gap:10px;margin-top:8px;">
          <button id="a-go" class="btn-primary">Calculate</button>
          <a class="btn" href="#/calc">Back</a>
          <a class="btn" href="#/home">Dashboard</a>
        </div>

        <div id="a-out" class="result-card" style="display:none;"></div>
      </section>
    `;
    function showShape(){
      $('#a-rect').style.display = ($('#a-shape').value==='Rectangle')?'grid':'none';
      $('#a-circ').style.display = ($('#a-shape').value==='Circle')?'grid':'none';
      $('#a-tri').style.display  = ($('#a-shape').value==='Triangle')?'grid':'none';
    }
    $('#a-shape').addEventListener('change', showShape); showShape();

    $('#a-go').addEventListener('click', ()=>{
      const shape=$('#a-shape').value, unit=$('#a-unit').value;
      let A=0;
      if (shape==='Rectangle'){
        const L=num($('#a-len').value), W=num($('#a-wid').value); if(!L||!W) return alert('Enter length & width.');
        A=L*W;
      } else if (shape==='Circle'){
        const D=num($('#a-dia').value); if(!D) return alert('Enter diameter.'); const r=D/2; A=Math.PI*r*r;
      } else {
        const B=num($('#a-base').value), H=num($('#a-height').value); if(!B||!H) return alert('Enter base & height.');
        A=0.5*B*H;
      }
      localStorage.setItem('df_calc_area', JSON.stringify({
        shape, unit,
        len:$('#a-len')?.value, wid:$('#a-wid')?.value,
        dia:$('#a-dia')?.value, base:$('#a-base')?.value, height:$('#a-height')?.value
      }));
      const acres = unit==='ft' ? (A/43560) : (A/4046.8564224);
      const out=$('#a-out'); out.style.display='';
      out.innerHTML = `
        <div><strong>Area (${unit==='ft'?'ft²':'m²'}):</strong> ${commas(A.toFixed(2))}</div>
        <div><strong>Area (acres):</strong> ${commas(acres.toFixed(4))}</div>
      `;
    });
  };

  // =========================================================
  // 6) Chemical Mix Sheet (up to 6 products → per tank gallons)
  // =========================================================
  window.viewCalcChem = function(){
    const KEY='df_calc_chem';
    const s = JSON.parse(localStorage.getItem(KEY)||'{}');
    const prods = s.prods || Array.from({length:6}).map(()=>({name:'',rate:'',unit:'oz'}));

    function row(i,p){
      return `
        <div class="calc-grid">
          <label><span class="small muted">Product ${i+1}</span><input id="ch-name-${i}" type="text" value="${html(p.name||'')}" placeholder="Name"></label>
          <label><span class="small muted">Rate / acre</span><input id="ch-rate-${i}" type="number" step="any" value="${html(p.rate||'')}"></label>
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
          <label><span class="small muted">Tank Size (gal) *</span><input id="ch-tank" type="number" step="any" value="${html(s.tank||'')}"></label>
          <label><span class="small muted">Carrier GPA *</span><input id="ch-gpa" type="number" step="any" value="${html(s.gpa||'')}"></label>
          <label><span class="small muted">Job Acres (optional)</span><input id="ch-job" type="number" step="any" value="${html(s.job||'')}"></label>
        </div>

        <h3 style="margin-top:10px;">Products (rate per acre)</h3>
        ${prods.map((p,i)=>row(i,p)).join('')}

        <div class="calc-actions" style="display:flex;gap:10px;margin-top:8px;">
          <button id="ch-go" class="btn-primary">Calculate</button>
          <a class="btn" href="#/calc">Back</a>
          <a class="btn" href="#/home">Dashboard</a>
        </div>

        <div id="ch-out" class="result-card" style="display:none;"></div>
      </section>
    `;

    function unitToGal(u,a){
      const x=num(a); if(!x) return 0;
      if(u==='gal') return x;
      if(u==='qt') return x/4;
      if(u==='pt') return x/8;
      if(u==='oz') return x/128;
      return 0;
    }

    $('#ch-go').addEventListener('click', ()=>{
      const tank=num($('#ch-tank').value), gpa=num($('#ch-gpa').value), job=num($('#ch-job').value);
      const ps=[];
      for(let i=0;i<6;i++){ ps.push({ name:$('#ch-name-'+i).value, rate:$('#ch-rate-'+i).value, unit:$('#ch-unit-'+i).value }); }
      localStorage.setItem(KEY, JSON.stringify({tank,gpa,job,prods:ps}));
      if(!tank||!gpa){ alert('Enter Tank Size and Carrier GPA.'); return; }
      const acPerTank = tank/gpa;
      let total=0;
      const lines = ps.filter(p=>num(p.rate)>0).map(p=>{
        const perAcreGal = unitToGal(p.unit, p.rate);
        const perTankGal = perAcreGal * acPerTank;
        total += perTankGal;
        return `<li>${html(p.name||'(Unnamed)')}: <strong>${commas(perTankGal.toFixed(3))}</strong> gal / tank <span class="small muted">(${p.rate} ${p.unit}/ac)</span></li>`;
      });
      const out=$('#ch-out'); out.style.display='';
      const tanks = job>0 ? `<li><strong>Tanks needed for ${commas(job)} ac:</strong> ${commas(Math.ceil(job/acPerTank))}</li>` : '';
      out.innerHTML = `
        <div><strong>Acres per tank:</strong> ${commas(acPerTank.toFixed(2))}</div>
        <div><strong>Carrier per tank (gal):</strong> ${commas(tank)}</div>
        <ul style="margin:8px 0 0 18px;">${lines.join('') || '<li class="muted">No products entered.</li>'}</ul>
        <div style="margin-top:6px;"><strong>Total product volume in mix (gal):</strong> ${commas(total.toFixed(3))}</div>
        ${tanks}
        <div class="small muted" style="margin-top:6px;">Confirm compatibility and label requirements.</div>
      `;
    });
  };

  // =========================================================
  // 7) Crop Year selector (Crop hub): multi-select + “Add next year only”
  //    - Per user last selection persists
  // =========================================================
  (function overrideCropHub(){
    const YEARS_KEY = 'df_crop_years';
    const SEL_KEY = email => `df_crop_year_sel:${email||'anon'}`;

    function getYears(){
      try{
        const arr = JSON.parse(localStorage.getItem(YEARS_KEY)||'[]');
        if (Array.isArray(arr) && arr.length) return arr.sort((a,b)=>a-b);
      }catch{}
      const start = 2024;
      const cur = new Date().getFullYear();
      const seed = [];
      for (let y=start; y<=cur; y++) seed.push(y);
      localStorage.setItem(YEARS_KEY, JSON.stringify(seed));
      return seed;
    }
    function saveYears(arr){ try{ localStorage.setItem(YEARS_KEY, JSON.stringify(Array.from(new Set(arr)).sort((a,b)=>a-b))); }catch{} }
    function getSel(user){ try{ const v=JSON.parse(localStorage.getItem(SEL_KEY(user))||'[]'); return Array.isArray(v)&&v.length?v:[]; }catch{ return []; } }
    function saveSel(user, years){ try{ localStorage.setItem(SEL_KEY(user), JSON.stringify(Array.from(new Set(years)).sort((a,b)=>a-b))); }catch{} }

    // Expose getter for other screens if needed later:
    window.df_getSelectedCropYears = function(){
      const user = (localStorage.getItem('df_user')||'').trim();
      const sel = getSel(user);
      return sel.length ? sel : [new Date().getFullYear()]; // default to this year if none chosen
    };

    window.viewCropHub = function(){
      const user = (localStorage.getItem('df_user')||'').trim();
      const years = getYears();
      let selected = getSel(user);
      if (!selected.length){
        // default: last used if present, else current year
        const cur = new Date().getFullYear();
        selected = [cur];
        saveSel(user, selected);
      }

      function chip(y){
        const id = `year-${y}`;
        const checked = selected.includes(y) ? 'checked' : '';
        return `<label class="chip-toggle" for="${id}">
          <input id="${id}" type="checkbox" ${checked} data-year="${y}"> ${y}
        </label>`;
      }

      // Tiles (same as before)
      const tiles = `
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

      app.innerHTML = `
        <section class="section">
          <h1>Crop Production</h1>

          <div class="year-bar" id="year-bar">
            <span class="small muted">Crop Year:</span>
            ${years.map(chip).join('')}
            <button id="year-add" class="btn btn-compact year-add" title="Add next year">➕ Add</button>
          </div>

          ${tiles}
        </section>
      `;

      // Wire selection changes
      $('#year-bar').addEventListener('change', (e)=>{
        if (e.target && e.target.matches('input[type="checkbox"][data-year]')){
          const y = Number(e.target.getAttribute('data-year'));
          if (e.target.checked){ if (!selected.includes(y)) selected.push(y); }
          else { selected = selected.filter(v=>v!==y); }
          if (!selected.length){
            // Always keep at least one selected; revert toggle
            selected = [y];
            e.target.checked = true;
          }
          saveSel(user, selected);
        }
      });

      // Add next year (only allow current max + 1, and not beyond (currentYear+1))
      $('#year-add').addEventListener('click', ()=>{
        const list = getYears();
        const cur = new Date().getFullYear();
        const allowedMax = cur + 1;
        const next = (list[list.length-1]||cur) + 1;
        if (next > allowedMax){ alert(`You can only add up to ${allowedMax}.`); return; }
        list.push(next); saveYears(list);
        // re-render quickly
        viewCropHub();
      });
    };
  })();

  // =========================================================
  // 8) Theme Settings — segmented buttons (Auto/Light/Dark)
  // =========================================================
  window.viewSettingsTheme = function(){
    const KEY='df_theme';
    const cur = (localStorage.getItem(KEY)||'auto');
    function btn(label,val){ const active = cur===val?'active':''; return `<button type="button" class="${active}" data-val="${val}">${label}</button>`; }
    app.innerHTML = `
      <section class="section">
        <h1>Theme</h1>
        <div class="field">
          <label style="font-weight:600;margin-bottom:6px;">Appearance</label>
          <div class="seg" id="theme-seg">
            ${btn('Auto','auto')}${btn('Light','light')}${btn('Dark','dark')}
          </div>
        </div>
        <div class="section"><a class="btn" href="#/settings">Back to Settings</a></div>
      </section>
    `;
    $('#theme-seg').addEventListener('click', (e)=>{
      const b = e.target.closest('button[data-val]'); if(!b) return;
      const v = b.getAttribute('data-val');
      localStorage.setItem(KEY, v);
      document.documentElement.setAttribute('data-theme', v);
      $$('#theme-seg button').forEach(x=>x.classList.toggle('active', x===b));
    });
  };

})(); // end PATCH v10.14.6
/* ============================
   Dowson Farms — Patch v10.14.7
   Scope:
     • Crop Year dropdown selector (persisted)
     • Feedback dropdowns (Main/Sub/Category with simple dependency)
     • Global number formatting with commas
     • Settings → Farms management (CRUD + localStorage)
     • Settings → Fields management (CRUD + localStorage)
   Append at end of app.js
   ============================ */
(function DF_v10147_patch(){
  const NS = (window.DF = window.DF || {});
  const Patch = NS.v10147 = {};

  /* ---------- Utilities ---------- */
  const ls = {
    get(key, fallback){
      try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
    },
    set(key, value){ try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }
  };

  // Number formatting with commas (keeps decimals)
  function formatNumberWithCommas(value){
    if (value === null || value === undefined) return '';
    const str = String(value).replace(/,/g, '').trim();
    if (str === '' || isNaN(Number(str))) return value; // leave as-is if non-numeric
    const [intPart, decPart] = str.split('.');
    const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return decPart !== undefined ? `${withCommas}.${decPart}` : withCommas;
  }
  Patch.formatNumberWithCommas = formatNumberWithCommas;

  /* Auto-format: any input/element with data-format="number"
     - Formats on blur
     - Cleans commas for value retrieval on change
  */
  document.addEventListener('blur', (e)=>{
    const el = e.target;
    if (el && el.matches('[data-format="number"]')){
      const caret = el.selectionStart;
      el.value = formatNumberWithCommas(el.value);
      // Try to keep caret near end (best effort)
      try { el.setSelectionRange(caret, caret); } catch {}
    }
  }, true);

  // Provide a helper to read numeric values (without commas)
  Patch.readNumeric = (el)=> {
    if (!el) return null;
    const raw = String(el.value || '').replace(/,/g,'').trim();
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  };

  /* ---------- Crop Year Selector ---------- */
  function initCropYearSelects(){
    const STORAGE_KEY = 'df.cropYear';
    const now = new Date();
    const currentYear = now.getFullYear();
    const years = [];
    const start = currentYear + 1;  // include next crop year
    const end = currentYear - 10;   // 10 years back
    for (let y = start; y >= end; y--) years.push(y);

    const saved = ls.get(STORAGE_KEY, null);
    document.querySelectorAll('select[data-df="cropYear"]').forEach(sel=>{
      // If the select is empty, populate; otherwise leave user-defined options
      if (!sel.options.length){
        const ph = document.createElement('option');
        ph.value = ''; ph.textContent = 'Select Crop Year';
        sel.appendChild(ph);
        years.forEach(y=>{
          const o = document.createElement('option');
          o.value = String(y);
          o.textContent = String(y);
          sel.appendChild(o);
        });
      }
      // Set saved or default to currentYear
      const toSet = saved || String(currentYear);
      if ([...sel.options].some(o=>o.value===String(toSet))) sel.value = String(toSet);

      sel.addEventListener('change', ()=>{
        if (sel.value) ls.set(STORAGE_KEY, sel.value);
      });
    });
  }

  /* ---------- Feedback Dropdowns (Main/Sub/Category) ---------- */
  // Defaults (override by putting JSON on data-options on the main select)
  const DEFAULT_FEEDBACK = {
    main: ['Bug', 'Idea', 'Data Fix', 'UX', 'Performance'],
    sub: {
      'Bug': ['Crash', 'Wrong calc', 'Bad link', 'Visual glitch'],
      'Idea': ['New feature', 'Report layout', 'Workflow'],
      'Data Fix': ['Field boundary', 'Acres', 'Crop type', 'Yield entry'],
      'UX': ['Navigation', 'Buttons', 'Accessibility'],
      'Performance': ['Slow load', 'Offline cache', 'Sync issues']
    },
    category: ['Low', 'Normal', 'High', 'Critical']
  };

  function initFeedbackDropdowns(){
    const mainSel = document.querySelector('select[data-df="feedback-main"]');
    const subSel  = document.querySelector('select[data-df="feedback-sub"]');
    const catSel  = document.querySelector('select[data-df="feedback-category"]');

    if (!mainSel && !subSel && !catSel) return; // nothing to do

    // Load overrides if present on main select
    let cfg = DEFAULT_FEEDBACK;
    try {
      if (mainSel && mainSel.dataset.options){
        const parsed = JSON.parse(mainSel.dataset.options);
        cfg = {
          main: parsed.main || DEFAULT_FEEDBACK.main,
          sub:  parsed.sub  || DEFAULT_FEEDBACK.sub,
          category: parsed.category || DEFAULT_FEEDBACK.category
        };
      }
    } catch {}

    // Populate helper
    const fill = (sel, arr, placeholder)=>{
      if (!sel) return;
      if (!sel.options.length){
        const ph = document.createElement('option'); ph.value=''; ph.textContent=placeholder;
        sel.appendChild(ph);
      } else {
        // keep existing if already filled
        return;
      }
      (arr||[]).forEach(v=>{
        const o = document.createElement('option');
        o.value = v; o.textContent = v;
        sel.appendChild(o);
      });
    };

    fill(mainSel, cfg.main, 'Main…');
    fill(catSel, cfg.category, 'Category…');

    // Populate sub based on current main (or placeholder)
    function repopulateSub(mainVal){
      if (!subSel) return;
      const selVal = subSel.value;
      // Clear (except maybe keep first placeholder)
      subSel.innerHTML = '';
      const ph = document.createElement('option'); ph.value=''; ph.textContent='Sub…';
      subSel.appendChild(ph);
      const subs = (cfg.sub && cfg.sub[mainVal]) ? cfg.sub[mainVal] : [];
      subs.forEach(s=>{
        const o = document.createElement('option'); o.value = s; o.textContent = s;
        subSel.appendChild(o);
      });
      // Try restore previous choice if still valid
      if ([...subSel.options].some(o=>o.value===selVal)) subSel.value = selVal;
    }

    if (mainSel){
      // initial
      repopulateSub(mainSel.value || '');
      // on change
      mainSel.addEventListener('change', ()=>repopulateSub(mainSel.value||''));
    }
  }

  /* ---------- Settings: Farms Management ---------- */
  // Data shape: { id: string, name: string, location?: string }
  const FARMS_KEY = 'df.farms';
  function getFarms(){ return ls.get(FARMS_KEY, []); }
  function saveFarms(list){ ls.set(FARMS_KEY, list); }
  function uid(){ return Math.random().toString(36).slice(2,10); }

  function renderFarms(){
    const wrap = document.querySelector('[data-df="farm-list"]');
    if (!wrap) return;
    const farms = getFarms();
    wrap.innerHTML = farms.length ? '' : '<div class="muted">No farms yet.</div>';
    farms.forEach(f=>{
      const row = document.createElement('div');
      row.className = 'df-row df-farm';
      row.dataset.id = f.id;
      row.innerHTML = `
        <div class="df-cell">
          <strong>${f.name || '(unnamed)'}</strong>
          ${f.location ? `<div class="df-sub">${f.location}</div>` : ''}
        </div>
        <div class="df-actions">
          <button type="button" data-action="edit-farm">Edit</button>
          <button type="button" data-action="delete-farm">Delete</button>
        </div>
      `;
      wrap.appendChild(row);
    });
  }

  function bindFarmForm(){
    const form = document.querySelector('[data-df="farm-form"]');
    if (!form) return;
    const nameEl = form.querySelector('[name="farmName"]');
    const locEl  = form.querySelector('[name="farmLocation"]');
    const idEl   = form.querySelector('[name="farmId"]'); // hidden for edit

    form.addEventListener('submit',(e)=>{
      e.preventDefault();
      const name = (nameEl?.value||'').trim();
      const location = (locEl?.value||'').trim();
      if (!name){ alert('Farm name is required.'); return; }
      const list = getFarms();
      const existingId = (idEl?.value||'').trim();
      if (existingId){
        const idx = list.findIndex(f=>f.id===existingId);
        if (idx>=0){ list[idx] = {...list[idx], name, location}; }
      } else {
        list.push({ id: uid(), name, location});
      }
      saveFarms(list);
      form.reset();
      if (idEl) idEl.value = '';
      renderFarms();
    });

    document.addEventListener('click',(e)=>{
      const btn = e.target.closest?.('button[data-action="edit-farm"], button[data-action="delete-farm"]');
      if (!btn) return;
      const row = btn.closest('.df-farm'); if (!row) return;
      const id = row.dataset.id;
      const list = getFarms();
      const farm = list.find(f=>f.id===id);
      if (btn.dataset.action === 'edit-farm'){
        if (!farm) return;
        if (nameEl) nameEl.value = farm.name||'';
        if (locEl)  locEl.value  = farm.location||'';
        if (idEl)   idEl.value   = farm.id;
        nameEl?.focus();
      } else if (btn.dataset.action === 'delete-farm'){
        if (confirm('Delete this farm?')){
          saveFarms(list.filter(f=>f.id!==id));
          renderFarms();
        }
      }
    });
  }

  /* ---------- Settings: Fields Management ---------- */
  // Data shape: { id, farmId, name, acres:number|null, crop?:string }
  const FIELDS_KEY = 'df.fields';
  function getFields(){ return ls.get(FIELDS_KEY, []); }
  function saveFields(list){ ls.set(FIELDS_KEY, list); }

  function renderFields(){
    const wrap = document.querySelector('[data-df="field-list"]');
    if (!wrap) return;
    const fields = getFields();
    const farms  = getFarms();
    const farmName = (id)=> (farms.find(f=>f.id===id)?.name)||'—';

    wrap.innerHTML = fields.length ? '' : '<div class="muted">No fields yet.</div>';
    fields.forEach(fd=>{
      const acresTxt = (fd.acres!=null && !isNaN(fd.acres)) ? formatNumberWithCommas(fd.acres) : '—';
      const row = document.createElement('div');
      row.className = 'df-row df-field';
      row.dataset.id = fd.id;
      row.innerHTML = `
        <div class="df-cell">
          <strong>${fd.name || '(unnamed field)'}</strong>
          <div class="df-sub">${farmName(fd.farmId)} • ${acresTxt} acres${fd.crop?` • ${fd.crop}`:''}</div>
        </div>
        <div class="df-actions">
          <button type="button" data-action="edit-field">Edit</button>
          <button type="button" data-action="delete-field">Delete</button>
        </div>
      `;
      wrap.appendChild(row);
    });
  }

  function bindFieldForm(){
    const form = document.querySelector('[data-df="field-form"]');
    if (!form) return;
    const idEl   = form.querySelector('[name="fieldId"]'); // hidden for edit
    const nameEl = form.querySelector('[name="fieldName"]');
    const acresEl= form.querySelector('[name="fieldAcres"]');
    const cropEl = form.querySelector('[name="fieldCrop"]');
    const farmSel= form.querySelector('[name="fieldFarmId"]');

    // Populate farm selector if present
    if (farmSel && !farmSel.options.length){
      const farms = getFarms();
      const ph = document.createElement('option'); ph.value=''; ph.textContent='Select Farm';
      farmSel.appendChild(ph);
      farms.forEach(f=>{
        const o = document.createElement('option'); o.value=f.id; o.textContent=f.name;
        farmSel.appendChild(o);
      });
    }

    form.addEventListener('submit',(e)=>{
      e.preventDefault();
      const name  = (nameEl?.value||'').trim();
      const farmId= (farmSel?.value||'').trim();
      const acres = Patch.readNumeric(acresEl);
      const crop  = (cropEl?.value||'').trim() || undefined;
      if (!name){ alert('Field name is required.'); return; }
      if (!farmId){ alert('Select a farm.'); return; }

      const list = getFields();
      const existingId = (idEl?.value||'').trim();
      if (existingId){
        const idx = list.findIndex(f=>f.id===existingId);
        if (idx>=0){ list[idx] = {...list[idx], name, farmId, acres, crop}; }
      } else {
        list.push({ id: uid(), name, farmId, acres, crop });
      }
      saveFields(list);
      form.reset();
      if (idEl) idEl.value = '';
      renderFields();
    });

    document.addEventListener('click',(e)=>{
      const btn = e.target.closest?.('button[data-action="edit-field"], button[data-action="delete-field"]');
      if (!btn) return;
      const row = btn.closest('.df-field'); if (!row) return;
      const id = row.dataset.id;
      const list = getFields();
      const field = list.find(f=>f.id===id);
      if (btn.dataset.action === 'edit-field'){
        if (!field) return;
        if (idEl)    idEl.value    = field.id;
        if (nameEl)  nameEl.value  = field.name||'';
        if (acresEl) acresEl.value = field.acres!=null ? formatNumberWithCommas(field.acres) : '';
        if (cropEl)  cropEl.value  = field.crop||'';
        if (farmSel){
          // Ensure farm list is present/updated
          if (!farmSel.options.length){
            const farms = getFarms();
            const ph = document.createElement('option'); ph.value=''; ph.textContent='Select Farm';
            farmSel.appendChild(ph);
            farms.forEach(f=>{
              const o = document.createElement('option'); o.value=f.id; o.textContent=f.name;
              farmSel.appendChild(o);
            });
          }
          farmSel.value = field.farmId || '';
        }
        nameEl?.focus();
      } else if (btn.dataset.action === 'delete-field'){
        if (confirm('Delete this field?')){
          saveFields(list.filter(f=>f.id!==id));
          renderFields();
        }
      }
    });
  }

  /* ---------- Bootstrapping ---------- */
  function init(){
    initCropYearSelects();
    initFeedbackDropdowns();
    bindFarmForm();
    bindFieldForm();
    renderFarms();
    renderFields();
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ---------- Minimal styles (optional, safe) ---------- */
  const styleTag = document.createElement('style');
  styleTag.setAttribute('data-df','v10.14.7');
  styleTag.textContent = `
    .df-row{ display:flex; align-items:center; justify-content:space-between; padding:8px 10px; border:1px solid #e3e3e3; border-radius:6px; background:#fff; margin:6px 0; }
    .df-cell{ min-width:0; }
    .df-sub{ color:#666; font-size:0.9em; margin-top:2px; }
    .df-actions button{ margin-left:6px; }
    .muted{ color:#777; font-style:italic; }
  `;
  document.head.appendChild(styleTag);

})();
