// ===== Version in footer =====
const APP_VERSION = 'v10.0';

// ===== Theme boot (auto/light/dark) =====
(function(){
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
function normalizeVersion(v){ const m=String(v||'').replace(/^v/i,''); const [a='0',b='0']=m.split('.'); return `${a}.${b}`; }
function displayVersion(v){ return 'v'+normalizeVersion(v); }
function todayISO(){ const d=new Date(); return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`; }
function currentYear(){ return String(new Date().getFullYear()); }
function currentUser(){ try{ return localStorage.getItem('df_user') || ''; } catch{ return ''; } }
function withCommas(num){ const s=String(num||'').replace(/[^\d.]/g,''); if(!s) return ''; const [i,f=''] = s.split('.'); return i.replace(/\B(?=(\d{3})+(?!\d))/g,',') + (f?'.'+f:''); }

// ===== DOM refs =====
const app = document.getElementById('app');
const crumbs = document.getElementById('breadcrumbs');
const versionEl = document.getElementById('version');
const todayEl = document.getElementById('today');
const clockEl = document.getElementById('clock');
const bannerEl = document.getElementById('update-banner');
const bannerBtn = document.getElementById('update-refresh');

// ===== Layout vars =====
function setCSSVar(name, px){ document.documentElement.style.setProperty(name, `${px}px`); }
function measureBars(){
  const h = document.querySelector('.app-header');
  const c = document.querySelector('.breadcrumbs');
  const f = document.querySelector('.app-footer');
  setCSSVar('--header-h', h ? h.offsetHeight : 52);
  setCSSVar('--crumbs-h', c ? c.offsetHeight : 36);
  setCSSVar('--footer-h', f ? f.offsetHeight : 44);
}
function refreshLayout(){ measureBars(); requestAnimationFrame(measureBars); }
['load','resize','orientationchange'].forEach(evt=>window.addEventListener(evt, refreshLayout));

// ===== Tiles =====
function tile(emoji,label,href){
  return `<a class="tile" href="${href}" aria-label="${label}">
    <span class="emoji">${emoji}</span><span class="label">${label}</span>
  </a>`;
}

// ===== Breadcrumbs =====
const LABELS = {
  '#/home': 'Home',
  '#/crop': 'Crop Production',
  '#/crop/maintenance': 'Field Maintenance',
  '#/calc': 'Calculator',
  '#/equipment': 'Equipment',
  '#/grain': 'Grain Tracking',
  '#/grain/bag': 'Grain Bag',
  '#/ai': 'AI Reports',
  '#/ai/premade': 'Pre-made Reports',
  '#/ai/ai': 'AI Reports',
  '#/ai/yield': 'Yield Report',
  '#/settings': 'Settings',
  '#/settings/crops': 'Crop Type',
  '#/settings/theme': 'Theme',
  '#/feedback': 'Feedback',
  '#/feedback/errors': 'Report Errors',
  '#/feedback/feature': 'New Feature Request'
};
function renderBreadcrumb(){
  const hash = location.hash || '#/home';
  if (hash === '#/home' || hash === '') {
    crumbs.innerHTML = `<span aria-current="page">Home</span>`;
    return;
  }
  const parts = hash.split('/').filter(Boolean); // ['#','crop','maintenance']
  let trail = [`<a href="#/home">Home</a>`];
  let cur = '#';
  for (let i=1; i<parts.length; i++){
    cur += '/' + parts[i];
    const label = LABELS[cur] || parts[i].replace(/-/g,' ').replace(/\b\w/g, s=>s.toUpperCase());
    if (i < parts.length-1) trail.push(`<a href="${cur}">${label}</a>`);
    else trail.push(`<span aria-current="page">${label}</span>`);
  }
  crumbs.innerHTML = trail.join(' &nbsp;&gt;&nbsp; ');
}

// ===== Home & hubs =====
function viewHome(){
  app.innerHTML = `
    <div class="grid">
      ${tile('🌽','Crop Production','#/crop')}
      ${tile('🔢','Calculator','#/calc')}
      ${tile('🛠️','Field Maintenance','#/crop/maintenance')}
      ${tile('🚜','Equipment','#/equipment')}
      ${tile('📦','Grain Tracking','#/grain')}
      ${tile('🤝','Team & Partners','#/team')}
      ${tile('🤖','AI Reports','#/ai')}
      ${tile('⚙️','Settings','#/settings')}
      ${tile('💬','Feedback','#/feedback')}
    </div>
  `;
}

// ===== Settings: Crop Type =====
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
function isCropInUse(name){ return false; } // placeholder

function viewSettingsHome(){
  app.innerHTML = `
    <div class="grid">
      ${tile('🌱','Crop Type','#/settings/crops')}
      ${tile('🌓','Theme','#/settings/theme')}
    </div>
    <div class="section"><a class="btn" href="#/home">Back to Dashboard</a></div>
  `;
}
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

// ===== Theme settings =====
function saveTheme(theme){ try{ localStorage.setItem('df_theme', theme); }catch{} }
function loadTheme(){ try{ return localStorage.getItem('df_theme') || 'auto'; }catch{ return 'auto'; } }
function applyTheme(theme){ const t=theme||loadTheme(); document.documentElement.setAttribute('data-theme', t); }
function viewSettingsTheme(){
  const current = loadTheme();
  app.innerHTML = `
    <section class="section">
      <h1>Theme</h1>
      <div class="field">
        <label><input type="radio" name="theme" value="auto" ${current==='auto'?'checked':''}> Auto (device)</label>
      </div>
      <div class="field">
        <label><input type="radio" name="theme" value="light" ${current==='light'?'checked':''}> Light</label>
      </div>
      <div class="field">
        <label><input type="radio" name="theme" value="dark" ${current==='dark'?'checked':''}> Dark</label>
      </div>
      <a class="btn" href="#/settings">Back to Settings</a>
    </section>
  `;
  app.querySelectorAll('input[name="theme"]').forEach(r=>{
    r.addEventListener('change', ()=>{
      saveTheme(r.value);
      applyTheme(r.value);
    });
  });
}

// ===== Feedback pages (now with Date + Submitted By) =====
function looksLikeEmail(e){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e||'').trim()); }
function cleanPhone(p){ return String(p||'').replace(/[^\d]/g,''); }

function saveFeedback(entry){
  try {
    const key='df_feedback';
    const list=JSON.parse(localStorage.getItem(key)||'[]');
    list.push(entry);
    localStorage.setItem(key, JSON.stringify(list));
  } catch {}
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
  app.innerHTML = `
    <section class="section">
      <h1>🛠️ Report Errors</h1>
      <div class="field"><input id="err-date" type="date" value="${todayISO()}"><div class="small muted">Date (required)</div></div>
      <div class="field"><input id="err-user" type="text" value="${currentUser()}" placeholder="Submitted by (required)"><div class="small muted">Submitted by</div></div>
      <div class="field"><input id="err-subj" type="text" placeholder="Subject *"></div>
      <div class="field"><textarea id="err-desc" rows="5" placeholder="What happened? *"></textarea></div>
      <div class="field"><input id="err-contact" type="text" placeholder="Phone or email (optional)"></div>
      <button id="err-submit" class="btn-primary">Submit</button> <a class="btn" href="#/feedback">Back to Feedback</a>
    </section>
  `;
  document.getElementById('err-submit')?.addEventListener('click', ()=>{
    const date=document.getElementById('err-date').value||'';
    const user=String(document.getElementById('err-user').value||'').trim();
    const subject=String(document.getElementById('err-subj').value||'').trim();
    const details=String(document.getElementById('err-desc').value||'').trim();
    const contact=String(document.getElementById('err-contact').value||'').trim();
    if(!date||!user||!subject||!details){ alert('Please fill the required fields.'); return; }
    saveFeedback({type:'error',date,user,subject,details,contact,ts:Date.now()});
    alert('Thanks! Your error report was saved.'); location.hash='#/feedback';
  });
}
function viewFeedbackFeature(){
  app.innerHTML = `
    <section class="section">
      <h1>💡 New Feature Request</h1>
      <div class="field"><input id="feat-date" type="date" value="${todayISO()}"><div class="small muted">Date (required)</div></div>
      <div class="field"><input id="feat-user" type="text" value="${currentUser()}" placeholder="Submitted by (required)"><div class="small muted">Submitted by</div></div>
      <div class="field"><input id="feat-subj" type="text" placeholder="Feature title *"></div>
      <div class="field"><textarea id="feat-desc" rows="5" placeholder="Describe the idea *"></textarea></div>
      <div class="field"><input id="feat-contact" type="text" placeholder="Phone or email (optional)"></div>
      <button id="feat-submit" class="btn-primary">Submit</button> <a class="btn" href="#/feedback">Back to Feedback</a>
    </section>
  `;
  document.getElementById('feat-submit')?.addEventListener('click', ()=>{
    const date=document.getElementById('feat-date').value||'';
    const user=String(document.getElementById('feat-user').value||'').trim();
    const subject=String(document.getElementById('feat-subj').value||'').trim();
    const details=String(document.getElementById('feat-desc').value||'').trim();
    const contact=String(document.getElementById('feat-contact').value||'').trim();
    if(!date||!user||!subject||!details){ alert('Please fill the required fields.'); return; }
    saveFeedback({type:'feature',date,user,subject,details,contact,ts:Date.now()});
    alert('Thanks! Your feature request was saved.'); location.hash='#/feedback';
  });
}

// ===== AI Reports hub (unchanged, with placeholders) =====
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
function viewReportsPremade(){ viewSection('📄 Pre-made Reports','#/ai','Back to AI Reports'); }
function viewReportsAI(){ viewSection('🤖 AI Reports','#/ai','Back to AI Reports'); }
function viewReportsYield(){ viewSection('📊 Yield Report','#/ai','Back to AI Reports'); }

// ===== Grain Tracking: Grain Bag (now with Required Estimated Bushels) =====
const GRAIN_BAG_KEY='df_grain_bags';
function loadBags(){ try{ return JSON.parse(localStorage.getItem(GRAIN_BAG_KEY)||'[]'); }catch{ return []; } }
function saveBags(list){ try{ localStorage.setItem(GRAIN_BAG_KEY, JSON.stringify(list)); }catch{} }

function viewGrainHub(){
  app.innerHTML = `
    <div class="grid">
      ${tile('🧺','Grain Bag','#/grain/bag')}
    </div>
    <div class="section"><a class="btn" href="#/home">Back to Dashboard</a></div>
  `;
}
function viewGrainBag(){
  const crops=loadCrops().filter(c=>!c.archived);
  const cropOptions=crops.map(c=>`<option value="${c.name}">${c.name}</option>`).join('') || '<option value="" disabled>(Add crops in Settings)</option>';
  const rows=loadBags().map(b=>{
    return `<li class="crop-row">
      <div class="crop-info"><span class="chip">📅 ${b.date}</span> <span class="chip">📦 ${withCommas(b.bushels)} bu</span></div>
      <div class="crop-actions"><span class="small">${b.location}</span></div>
      <div style="flex-basis:100%;padding-left:8px;margin-top:6px;">
        <div class="small muted">Crop: ${b.crop} • Moisture: ${b.moisture}% • By: ${b.user||''}</div>
        ${b.notes?`<div class="small muted">Notes: ${b.notes}</div>`:''}
      </div>
    </li>`;
  }).join('');
  app.innerHTML = `
    <section class="section">
      <h1>🧺 Grain Bag</h1>

      <div class="field"><input id="gb-date" type="date" value="${todayISO()}"><div class="small muted">Date (required)</div></div>
      <div class="field">
        <label>Crop <span class="small muted">(required)</span></label>
        <select id="gb-crop">${cropOptions}</select>
      </div>
      <div class="field">
        <label>Location <span class="small muted">(required)</span></label>
        <select id="gb-loc">
          <option value="">— Choose —</option>
          <option value="Divernon Elevator">Divernon Elevator</option>
          <option value="Field (TBD)">Field (TBD)</option>
        </select>
      </div>
      <div class="field">
        <input id="gb-moist" type="number" inputmode="decimal" step="0.1" min="0" max="100" placeholder="Moisture % (required)">
      </div>
      <div class="field">
        <input id="gb-bushels" type="text" inputmode="numeric" placeholder="Estimated bushels (required)">
      </div>
      <div class="field">
        <input id="gb-user" type="text" value="${currentUser()}" placeholder="Submitted by (required)">
      </div>
      <div class="field"><textarea id="gb-notes" rows="3" placeholder="Notes (optional)"></textarea></div>

      <button id="gb-save" class="btn-primary">Save</button>

      <h2 style="margin-top:14px;">Recent</h2>
      <ul class="crop-list">${rows || '<li class="muted">No grain bags recorded.</li>'}</ul>

      <div class="section"><a class="btn" href="#/grain">Back to Grain Tracking</a> <a class="btn" href="#/home">Back to Dashboard</a></div>
    </section>
  `;
  // format bushels with commas as user types
  const bus = document.getElementById('gb-bushels');
  bus?.addEventListener('input', ()=>{
    const digits = bus.value.replace(/[^\d]/g,'');
    if(!digits){ bus.value=''; return; }
    bus.value = withCommas(digits);
  });
  document.getElementById('gb-save')?.addEventListener('click', ()=>{
    const date=document.getElementById('gb-date').value;
    const crop=document.getElementById('gb-crop').value;
    const loc=document.getElementById('gb-loc').value;
    const moist=String(document.getElementById('gb-moist').value||'').trim();
    const user=String(document.getElementById('gb-user').value||'').trim();
    const bushelsDigits=(document.getElementById('gb-bushels').value||'').replace(/[^\d]/g,'');
    const notes=String(document.getElementById('gb-notes').value||'').trim();
    if(!date||!crop||!loc||!moist||!user||!bushelsDigits){ alert('Date, Crop, Location, Moisture, Estimated Bushels, and Submitted by are required.'); return; }
    const m=parseFloat(moist); if(isNaN(m)||m<0||m>100){ alert('Moisture must be between 0 and 100.'); return; }
    const list=loadBags();
    list.unshift({id:Date.now(),date,crop,location:loc,moisture:m.toFixed(1),bushels:bushelsDigits,user,notes});
    saveBags(list);
    alert('Saved.'); viewGrainBag();
  });
}

// ===== Field Maintenance (full form) =====
const WORK_TYPES_KEY='df_work_types';
function loadWorkTypes(){ try{ return JSON.parse(localStorage.getItem(WORK_TYPES_KEY)||'["Tillage","Tile Repair","Spot Spray","Lime","Fertilizer","Road Repair"]'); }catch{ return ["Tillage","Tile Repair","Spot Spray","Lime","Fertilizer","Road Repair"]; } }
function saveWorkTypes(arr){ try{ localStorage.setItem(WORK_TYPES_KEY, JSON.stringify(arr)); }catch{} }

const FM_KEY='df_field_maint';
function loadFM(){ try{ return JSON.parse(localStorage.getItem(FM_KEY)||'[]'); }catch{ return []; } }
function saveFM(arr){ try{ localStorage.setItem(FM_KEY, JSON.stringify(arr)); }catch{} }

function isAdmin(){ try{ return localStorage.getItem('df_is_admin')==='1'; } catch { return false; } }

function viewFieldMaintenance(){
  const crops=loadCrops().filter(c=>!c.archived);
  const cropYears = [currentYear(), String(+currentYear()-1), String(+currentYear()-2)];
  const workTypes = loadWorkTypes();

  const cropOptions=crops.map(c=>`<option value="${c.name}">${c.name}</option>`).join('') || '<option value="" disabled>(Add crops in Settings)</option>';
  const yearOptions=cropYears.map(y=>`<option value="${y}" ${y===currentYear()?'selected':''}>${y}</option>`).join('');
  const wtOptions=workTypes.map(w=>`<option value="${w}">${w}</option>`).join('');

  const items=loadFM().map(r=>{
    return `<li class="crop-row">
      <div class="crop-info"><span class="chip">📅 ${r.date}</span> <span class="chip">${r.cropYear}</span> <span class="chip">${r.workType}</span></div>
      <div class="crop-actions"><span class="small">${r.location}</span></div>
      <div style="flex-basis:100%;padding-left:8px;margin-top:6px;">
        <div class="small muted">Crop: ${r.crop||'-'} • By: ${r.user||''}</div>
        ${r.notes?`<div class="small muted">Notes: ${r.notes}</div>`:''}
      </div>
    </li>`;
  }).join('');

  app.innerHTML = `
    <section class="section">
      <h1>🛠️ Field Maintenance</h1>

      <div class="field"><input id="fm-date" type="date" value="${todayISO()}"><div class="small muted">Date (required)</div></div>

      <div class="field">
        <label>Location <span class="small muted">(required)</span></label>
        <input id="fm-location" type="text" placeholder="Field or area">
      </div>

      <div class="field">
        <label>Crop Year <span class="small muted">(required)</span></label>
        <select id="fm-year">${yearOptions}</select>
      </div>

      <div class="field">
        <label>Crop (optional)</label>
        <select id="fm-crop">
          <option value="">— Select —</option>
          ${cropOptions}
        </select>
      </div>

      <div class="field">
        <label>Type of Work <span class="small muted">(required)</span></label>
        <div style="display:grid;grid-template-columns:1fr auto;gap:8px;">
          <select id="fm-type">${wtOptions}</select>
          ${isAdmin()?'<button id="fm-add-type" class="btn">➕ Add Type</button>':''}
        </div>
      </div>

      <div class="field">
        <label>Submitted by <span class="small muted">(required)</span></label>
        <input id="fm-user" type="text" value="${currentUser()}" placeholder="Your name or email">
      </div>

      <div class="field"><textarea id="fm-notes" rows="3" placeholder="Notes (optional)"></textarea></div>

      <button id="fm-save" class="btn-primary">Save</button>

      <h2 style="margin-top:14px;">Recent</h2>
      <ul class="crop-list">${items || '<li class="muted">No maintenance recorded.</li>'}</ul>

      <div class="section"><a class="btn" href="#/home">Back to Dashboard</a></div>
    </section>
  `;

  // Admin: add work type
  const addTypeBtn = document.getElementById('fm-add-type');
  addTypeBtn?.addEventListener('click', ()=>{
    const name = prompt('New work type name:');
    const n = (name||'').trim();
    if(!n) return;
    const list = loadWorkTypes();
    if (list.some(x=>x.toLowerCase()===n.toLowerCase())) return;
    list.push(n);
    saveWorkTypes(list);
    viewFieldMaintenance();
  });

  document.getElementById('fm-save')?.addEventListener('click', ()=>{
    const date=document.getElementById('fm-date').value;
    const location=document.getElementById('fm-location').value.trim();
    const cropYear=document.getElementById('fm-year').value;
    const crop=document.getElementById('fm-crop').value;
    const workType=document.getElementById('fm-type').value;
    const user=document.getElementById('fm-user').value.trim();
    const notes=document.getElementById('fm-notes').value.trim();

    if(!date||!location||!cropYear||!workType||!user){
      alert('Date, Location, Crop Year, Type of Work, and Submitted by are required.');
      return;
    }
    const list = loadFM();
    list.unshift({id:Date.now(),date,location,cropYear,crop,workType,user,notes});
    saveFM(list);
    alert('Saved.');
    viewFieldMaintenance();
  });
}

// ===== Generic section fallback =====
function viewSection(title, backHref = '#/home', backLabel = 'Back to Dashboard'){
  app.innerHTML = `
    <section class="section">
      <h1>${title}</h1>
      <p>Coming soon.</p>
      <a class="btn" href="${backHref}">${backLabel}</a>
    </section>
  `;
}

// ===== Router =====
function route(){
  const hash = location.hash || '#/home';
  renderBreadcrumb();

  if (hash === '#/home' || hash === '') { viewHome(); }

  else if (hash === '#/crop') { viewSection('Crop Production','#/home'); }
  else if (hash === '#/crop/maintenance') { viewFieldMaintenance(); }

  else if (hash === '#/calc') { viewSection('Calculator','#/home'); }
  else if (hash === '#/equipment') { viewSection('Equipment','#/home'); }

  else if (hash === '#/grain') { viewGrainHub(); }
  else if (hash === '#/grain/bag') { viewGrainBag(); }

  else if (hash === '#/ai') { viewReportsHub(); }
  else if (hash === '#/ai/premade') { viewReportsPremade(); }
  else if (hash === '#/ai/ai') { viewReportsAI(); }
  else if (hash === '#/ai/yield') { viewReportsYield(); }

  else if (hash === '#/settings') { viewSettingsHome(); }
  else if (hash === '#/settings/crops') { viewSettingsCrops(); }
  else if (hash === '#/settings/theme') { viewSettingsTheme(); }

  else if (hash === '#/feedback') { viewFeedbackHub(); }
  else if (hash === '#/feedback/errors') { viewFeedbackErrors(); }
  else if (hash === '#/feedback/feature') { viewFeedbackFeature(); }

  else { viewSection('Not Found','#/home'); }

  try {
    if (app && app.scrollTo) app.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    window.scrollTo(0, 0);
  } catch {}

  refreshLayout();
}
window.addEventListener('hashchange', route);
window.addEventListener('load', route);

// ===== Footer text + clock =====
if (versionEl) versionEl.textContent = displayVersion(APP_VERSION);
if (todayEl) todayEl.textContent = prettyDate(new Date());
function tick(){ if (clockEl) clockEl.textContent = formatClock12(new Date()); }
tick(); setInterval(tick, 15000);

// ===== Logout (robust) =====
(function bindLogout(){
  const btn = document.getElementById('logout');
  if (!btn) return;
  btn.addEventListener('click', (e) => {
    e.preventDefault?.();
    try { localStorage.removeItem('df_auth'); localStorage.removeItem('df_user'); } catch {}
    const ts = Date.now();
    window.location.replace('login.html?ts=' + ts);
  });
})();

// ===== Update banner logic (same proven flow) =====
function showUpdateBanner(){ if (bannerEl){ bannerEl.hidden=false; refreshLayout(); } }
function hideUpdateBanner(){ if (bannerEl){ bannerEl.hidden=true; refreshLayout(); } }
function markVersionAsCurrent(){ try { localStorage.setItem('df_app_version', normalizeVersion(APP_VERSION)); } catch {} }
function storedVersion(){ try { return localStorage.getItem('df_app_version') || ''; } catch { return ''; } }
function needsUpdate(){ const saved=storedVersion(); const cur=normalizeVersion(APP_VERSION); return saved && saved !== cur; }
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

// ===== Service Worker registration (cache-bust for Chrome) =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register(
        `service-worker.js?v=${normalizeVersion(APP_VERSION)}`,
        { updateViaCache: 'none' }
      );
      reg.update();
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') reg.update();
      });
      if (reg.waiting) { window.__waitingSW = reg.waiting; if (needsUpdate()) showUpdateBanner(); }
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing; if (!sw) return;
        sw.addEventListener('statechange', () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) {
            window.__waitingSW = reg.waiting || sw;
            if (needsUpdate()) showUpdateBanner();
          }
        });
      });
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.__waitingSW = null;
        markVersionAsCurrent();
        hideUpdateBanner();
        setTimeout(() => location.reload(), 200);
      });
    } catch (e) {
      console.error('SW registration failed', e);
    }
  });
}