// ===== Version (footer shows vMAJOR.MINOR) =====
const APP_VERSION = 'v10.8';

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

// ===== DOM refs =====
const app = document.getElementById('app');
const crumbs = document.getElementById('breadcrumbs');
const versionEl = document.getElementById('version');
const todayEl = document.getElementById('today');
const clockEl = document.getElementById('clock');
const bannerEl = document.getElementById('update-banner');
const bannerBtn = document.getElementById('update-refresh');

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
   Calculators
   ========================= */
function viewCalcHub(){
  app.innerHTML = `
    <div class="grid">
      ${tile('👨🏼‍🔬','Fertilizer','#/calc/fertilizer')}
      ${tile('🗑️','Bin Volume','#/calc/bin')}
      ${tile('📐','Area','#/calc/area')}
      ${tile('🌽','Combine Yield','#/calc/combine')}
      ${tile('🧪','Chemical Mix','#/calc/chem')}
    </div>
    <div class="section"><a class="btn" href="#/home">Back to Dashboard</a></div>
  `;
}
function viewCalcFertilizer(){ app.innerHTML = `<section class="section"><h1>🧮 Fertilizer Calculator</h1><p>🚧 Coming soon.</p><a class="btn" href="#/calc">Back to Calculator</a></section>`; }
function viewCalcBin(){ app.innerHTML = `<section class="section"><h1>🏗️ Bin Volume Calculator</h1><p>🚧 Coming soon.</p><a class="btn" href="#/calc">Back to Calculator</a></section>`; }
function viewCalcArea(){ app.innerHTML = `<section class="section"><h1>📐 Area Calculator</h1><p>🚧 Coming soon.</p><a class="btn" href="#/calc">Back to Calculator</a></section>`; }
function viewCalcCombine(){ app.innerHTML = `<section class="section"><h1>🧮 Combine Yield Calculator</h1><p>🚧 Coming soon (corn/soy, true shrink, head width 30’/40’/45’).</p><a class="btn" href="#/calc">Back to Calculator</a></section>`; }
function viewCalcChem(){ app.innerHTML = `<section class="section"><h1>🧪 Chemical Mix Sheet</h1><p>🚧 Coming soon.</p><a class="btn" href="#/calc">Back to Calculator</a></section>`; }

/* =========================
   Equipment
   ========================= */
function viewEquipmentHub(){
  app.innerHTML = `
    <div class="grid">
      ${tile('📡','StarFire / Technology','#/equipment/receivers')}
      ${tile('🚜','Tractors','#/equipment/tractors')}
      ${tile('🌾','Combines','#/equipment/combines')}
      ${tile('💦','Sprayer / Fertilizer Spreader','#/equipment/sprayer')}
      ${tile('🏗️','Construction Equipment','#/equipment/construction')}
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
      ${tile('🏠','Grain Bins','#/grain/bins')}
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
function viewGrainComing(name){
  app.innerHTML = `
    <section class="section">
      <h1>${name}</h1>
      <p>🚧 Coming soon.</p>
      <a class="btn" href="#/grain">Back to Grain Tracking</a>
    </section>
  `;
}

/* =========================
   Team & Partners (stubs)
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
function viewTeamComing(name){
  app.innerHTML = `
    <section class="section">
      <h1>${name}</h1>
      <p>🚧 Coming soon.</p>
      <a class="btn" href="#/team">Back to Team & Partners</a>
    </section>
  `;
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
function viewReportsPremade(){ app.innerHTML = `<section class="section"><h1>📄 Pre-made Reports</h1><p>🚧 Coming soon.</p><div class="section"><a class="btn" href="#/ai">Back to Reports</a></div></section>`; }
function viewReportsAI(){ app.innerHTML = `<section class="section"><h1>🤖 AI Reports</h1><p>🚧 Coming soon.</p><div class="section"><a class="btn" href="#/ai">Back to Reports</a></div></section>`; }
function viewReportsYield(){ app.innerHTML = `<section class="section"><h1>📊 Yield Report</h1><p>🚧 Coming soon.</p><div class="section"><a class="btn" href="#/ai">Back to Reports</a></div></section>`; }

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
   Router
   ========================= */
function route(){
  const hash = location.hash || '#/home';
  renderBreadcrumb();

  if (hash==='#/home'||hash==='') viewHome();

  // Crop
  else if (hash==='#/crop') viewCropHub();
  else if (hash==='#/crop/planting') viewCropComing('Planting');
  else if (hash==='#/crop/spraying') viewCropComing('Spraying');
  else if (hash==='#/crop/aerial') viewCropComing('Aerial Spray');
  else if (hash==='#/crop/harvest') viewCropComing('Harvest');
  else if (hash==='#/crop/maintenance') viewCropComing('Field Maintenance');
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

  // Team
  else if (hash==='#/team') viewTeamHub();
  else if (hash.startsWith('#/team/')) viewTeamComing(LABELS[hash]||'Team & Partners');

  // Reports
  else if (hash==='#/ai') viewReportsHub();
  else if (hash==='#/ai/premade') viewReportsPremade();
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

  // Reset scroll & layout on every route
  scrollTopAll();
  refreshLayout();
}
window.addEventListener('hashchange', route);
window.addEventListener('load', route);

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