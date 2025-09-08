// ===== Version =====
const APP_VERSION = 'v10.4';

// ===== Auth guard =====
function isAuthed(){ try { return localStorage.getItem('df_auth') === '1'; } catch { return false; } }
(function enforceAuth(){
  const here = (location.pathname.split('/').pop() || '').toLowerCase();
  if (!isAuthed() && here !== 'login.html') location.replace('login.html');
})();

// ===== Utils =====
function pad2(n){ return n<10?'0'+n:''+n; }
function formatClock12(d){ let h=d.getHours(), m=d.getMinutes(), ap=h>=12?'AM'?'':'':''; }
function formatClock12(d){ let h=d.getHours(), m=d.getMinutes(), ap=h>=12?'PM':'AM'; h=h%12||12; return `${h}:${pad2(m)} ${ap}`; }
function ordinal(n){ const s=['th','st','nd','rd'], v=n%100; return n+(s[(v-20)%10]||s[v]||s[0]); }
function prettyDate(d){ const dow=d.toLocaleString(undefined,{weekday:'long'}); const mo=d.toLocaleString(undefined,{month:'long'}); return `${dow} ${mo} ${ordinal(d.getDate())} ${d.getFullYear()}`; }
function normalizeVersion(v){ const m=String(v||'').replace(/^v/i,''); const [a='0',b='0']=m.split('.'); return `v${a}.${b}`; }
function todayISO(){ const d=new Date(); return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`; }
function userEmail(){ try{ return localStorage.getItem('df_user')||''; }catch{ return ''; } }
function capWords(s){ return s.replace(/\b[a-z]/g, m=>m.toUpperCase()); }

// ===== DOM refs =====
const app = document.getElementById('app');
const crumbs = document.getElementById('breadcrumbs');
const versionEl = document.getElementById('version');
const todayEl = document.getElementById('today');
const clockEl = document.getElementById('clock');
const bannerEl = document.getElementById('update-banner');
const bannerBtn = document.getElementById('update-refresh');

// ===== Robust Logout =====
function doLogout(){
  try{ localStorage.removeItem('df_auth'); localStorage.removeItem('df_user'); }catch{}
  location.assign('login.html?bye=' + Date.now());
}
document.getElementById('logout')?.addEventListener('click', (e)=>{ e.preventDefault(); doLogout(); });
document.addEventListener('click', (e)=>{
  const el = e.target.closest?.('[data-action="logout"],a[href="logout"]');
  if (!el) return; e.preventDefault(); doLogout();
});

// ===== Layout vars =====
function setCSSVar(name, px){ document.documentElement.style.setProperty(name, `${px}px`); }
function measureBars(){
  const h=document.querySelector('.app-header'), c=document.querySelector('.breadcrumbs'), f=document.querySelector('.app-footer');
  setCSSVar('--header-h', h?h.offsetHeight:52);
  setCSSVar('--crumbs-h', c?c.offsetHeight:36);
  setCSSVar('--footer-h', f?f.offsetHeight:44);
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

// ===== Breadcrumbs =====
const LABELS = {
  '#/home':'Home',
  '#/crop':'Crop Production',
  '#/crop/planting':'Planting',
  '#/crop/spraying':'Spraying',
  '#/crop/aerial':'Aerial Spray',
  '#/crop/harvest':'Harvest',
  '#/field':'Field Maintenance',
  '#/crop/scouting':'Scouting',
  '#/crop/trials':'Trials',
  '#/calc':'Calculator',
  '#/calc/fertilizer':'Fertilizer Calculator',
  '#/calc/bin':'Bin Capacity Calculator',
  '#/calc/area':'Area Calculator',
  '#/calc/yield':'Combine Yield Calculator',
  '#/calc/chem':'Chemical Mix Sheet',
  '#/equipment':'Equipment',
  '#/grain':'Grain Tracking',
  '#/grain/bags':'Grain Bags',
  '#/grain/bins':'Grain Bins',
  '#/grain/contracts':'Grain Contracts',
  '#/grain/ocr':'Grain Ticket OCR',
  '#/team':'Team & Partners',
  '#/team/employees':'Employees',
  '#/team/subs':'Subcontractors',
  '#/team/vendors':'Vendors',
  '#/team/directory':'Directory',
  '#/ai':'AI Reports',
  '#/ai/premade':'Pre-made Reports',
  '#/ai/yield':'Yield Reports',
  '#/ai/ai':'AI Reports',
  '#/settings':'Settings',
  '#/settings/crops':'Crop Types',
  '#/settings/theme':'Theme',
  '#/feedback':'Feedback',
  '#/feedback/errors':'Report Errors',
  '#/feedback/feature':'New Feature Request'
};
function renderBreadcrumb(){
  const hash = location.hash || '#/home';
  if (hash==='#/home' || hash===''){ crumbs.innerHTML='<span aria-current="page">Home</span>'; return; }
  const parts=hash.split('/').filter(Boolean);
  let trail=[`<a href="#/home">Home</a>`], cur='#';
  for(let i=1;i<parts.length;i++){
    cur += '/'+parts[i];
    const label = LABELS[cur] || capWords(parts[i].replace(/-/g,' '));
    if(i<parts.length-1) trail.push(`<a href="${cur}">${label}</a>`);
    else trail.push(`<span aria-current="page">${label}</span>`);
  }
  crumbs.innerHTML = trail.join(' &nbsp;&gt;&nbsp; ');
}

// ===== Views =====
function viewHome(){
  app.innerHTML = `
    <div class="grid">
      ${tile('🌽','Crop Production','#/crop')}
      ${tile('🔢','Calculator','#/calc')}
      ${tile('🛠️','Field Maintenance','#/field')}
      ${tile('🚜','Equipment','#/equipment')}
      ${tile('📦','Grain Tracking','#/grain')}
      ${tile('🤝','Team & Partners','#/team')}
      ${tile('🤖','AI Reports','#/ai')}
      ${tile('⚙️','Settings','#/settings')}
      ${tile('💬','Feedback','#/feedback')}
    </div>
  `;
}

/* ---------- Crop Production ---------- */
function viewCrop(){
  app.innerHTML = `
    <div class="grid">
      ${tile('🌱','Planting','#/crop/planting')}
      ${tile('💦','Spraying','#/crop/spraying')}
      ${tile('✈️','Aerial Spray','#/crop/aerial')}
      ${tile('🌾','Harvest','#/crop/harvest')}
      ${tile('🛠️','Field Maintenance','#/field')}
      ${tile('👀','Scouting','#/crop/scouting')}
      ${tile('🧪','Trials','#/crop/trials')}
    </div>
    <div class="section"><a class="btn" href="#/home">Back to Dashboard</a></div>
  `;
}

/* ---------- Field Maintenance form (shared) ---------- */
function viewFieldMaintenance(){
  const defUser = userEmail();
  app.innerHTML = `
    <section class="section">
      <h1>Field Maintenance</h1>
      <div class="field"><label>Location</label><input id="fm-location" placeholder="e.g., North 40" required></div>
      <div class="field"><label>Date</label><input id="fm-date" type="date" required value="${todayISO()}"></div>
      <div class="field"><label>Crop Year</label><input id="fm-year" type="number" min="2000" max="2100" required value="${new Date().getFullYear()}"></div>
      <div class="field"><label>Submitted By</label><input id="fm-user" required value="${defUser}"></div>
      <div class="field"><label>Type of Work</label>
        <select id="fm-type">
          <option>Repair Tile</option>
          <option>Rock Picking</option>
          <option>Clean Fence Row</option>
          <option>Fix Washout</option>
        </select>
      </div>
      <div class="field"><label>Notes</label><textarea id="fm-notes" rows="4" placeholder="Details..."></textarea></div>
      <div class="field"><label>Photo</label><input id="fm-photo" type="file" accept="image/*" capture="environment"></div>
      <button id="fm-save" class="btn-primary">Save</button>
      <a class="btn" href="#/home">Back to Dashboard</a>
    </section>
  `;
  document.getElementById('fm-save')?.addEventListener('click', ()=>{
    const row = {
      when: Date.now(),
      location: document.getElementById('fm-location').value.trim(),
      date: document.getElementById('fm-date').value,
      year: document.getElementById('fm-year').value,
      by: document.getElementById('fm-user').value.trim(),
      type: document.getElementById('fm-type').value,
      notes: document.getElementById('fm-notes').value.trim()
    };
    if(!row.location || !row.date || !row.year || !row.by){ alert('Please fill the required fields.'); return; }
    try{
      const key='df_field_maintenance';
      const list=JSON.parse(localStorage.getItem(key)||'[]'); list.push(row);
      localStorage.setItem(key, JSON.stringify(list));
    }catch{}
    alert('Saved!'); location.hash='#/field';
  });
}

/* ---------- Calculators ---------- */
function viewCalc(){
  app.innerHTML = `
    <div class="grid">
      ${tile('🌾','Fertilizer Calculator','#/calc/fertilizer')}
      ${tile('🏗️','Bin Capacity','#/calc/bin')}
      ${tile('📏','Area','#/calc/area')}
      ${tile('🚜','Combine Yield','#/calc/yield')}
      ${tile('🧴','Chemical Mix (🚧)','#/calc/chem')}
    </div>
    <div class="section"><a class="btn" href="#/home">Back to Dashboard</a></div>
  `;
}
// Fertilizer: lb/ac = (target N - existing N) / analysis
function viewCalcFertilizer(){
  app.innerHTML = `
  <section class="section">
    <h1>Fertilizer Calculator</h1>
    <div class="field"><label>Target N (lb/ac)</label><input id="f-n-target" type="number" step="any" value="180" required></div>
    <div class="field"><label>Existing N (lb/ac)</label><input id="f-n-exist" type="number" step="any" value="20" required></div>
    <div class="field"><label>Product Analysis (%N)</label><input id="f-n-percent" type="number" step="any" value="46" required></div>
    <button id="f-calc" class="btn-primary">Calculate</button>
    <p id="f-out" class="section muted"></p>
    <a class="btn" href="#/calc">Back to Calculators</a>
  </section>`;
  document.getElementById('f-calc').addEventListener('click', ()=>{
    const t=+f('f-n-target'), e=+f('f-n-exist'), p=+f('f-n-percent');
    if (p<=0){ o('Enter a valid %N'); return; }
    const need = Math.max(0, (t - e) / (p/100));
    o(`Apply approximately <b>${need.toFixed(1)} lb/ac</b> of product.`);
    function f(id){return document.getElementById(id).value||0}
    function o(s){ document.getElementById('f-out').innerHTML=s; }
  });
}
// Bin capacity (simple cylinder: πr²h * 0.8 grain factor) — quick estimate
function viewCalcBin(){
  app.innerHTML = `
  <section class="section">
    <h1>Bin Capacity (Estimate)</h1>
    <div class="field"><label>Diameter (ft)</label><input id="b-dia" type="number" step="any" value="36" required></div>
    <div class="field"><label>Height to Grain Peak (ft)</label><input id="b-h" type="number" step="any" value="25" required></div>
    <button id="b-calc" class="btn-primary">Calculate</button>
    <p id="b-out" class="section muted"></p>
    <a class="btn" href="#/calc">Back to Calculators</a>
  </section>`;
  document.getElementById('b-calc').addEventListener('click', ()=>{
    const d=+g('b-dia'), h=+g('b-h'); const r=d/2;
    const ft3 = Math.PI*r*r*h*0.8; const bu = ft3/1.244; // ~1.244 ft³/bu
    s(`~ <b>${Math.round(bu).toLocaleString()}</b> bushels`);
    function g(id){return document.getElementById(id).value||0}
    function s(m){document.getElementById('b-out').innerHTML=m}
  });
}
// Area calculator
function viewCalcArea(){
  app.innerHTML = `
  <section class="section">
    <h1>Area Calculator</h1>
    <div class="field"><label>Length (ft)</label><input id="a-l" type="number" step="any" value="660"></div>
    <div class="field"><label>Width (ft)</label><input id="a-w" type="number" step="any" value="660"></div>
    <button id="a-calc" class="btn-primary">Calculate</button>
    <p id="a-out" class="section muted"></p>
    <a class="btn" href="#/calc">Back to Calculators</a>
  </section>`;
  document.getElementById('a-calc').addEventListener('click', ()=>{
    const l=+v('a-l'), w=+v('a-w'); const ft2=l*w, ac=ft2/43560;
    o(`${ac.toFixed(2)} acres`);
    function v(id){return document.getElementById(id).value||0}
    function o(s){document.getElementById('a-out').innerHTML=s}
  });
}
// Combine Yield (corn/soy) with head width selection + true/custom shrink inputs
function viewCalcYield(){
  app.innerHTML = `
  <section class="section">
    <h1>Combine Yield</h1>
    <div class="field"><label>Crop</label>
      <select id="y-crop"><option value="corn">Corn</option><option value="soy">Soybeans</option></select>
    </div>
    <div class="field"><label>Head Width</label>
      <select id="y-head">
        <option value="30">30'</option>
        <option value="40" selected>40'</option>
        <option value="45">45'</option>
      </select>
    </div>
    <div class="field"><label>Ground Speed (mph)</label><input id="y-mph" type="number" step="any" value="4.5"></div>
    <div class="field"><label>Flow Rate (lbs/sec)</label><input id="y-lbs" type="number" step="any" value="28"></div>
    <div class="field"><label>True Shrink %</label><input id="y-true" type="number" step="any" value="1.2"></div>
    <div class="field"><label>Custom Shrink %</label><input id="y-custom" type="number" step="any" value="0.0"></div>
    <button id="y-calc" class="btn-primary">Calculate</button>
    <p id="y-out" class="section muted"></p>
    <a class="btn" href="#/calc">Back to Calculators</a>
  </section>`;
  document.getElementById('y-calc').addEventListener('click', ()=>{
    const crop=g('y-crop'), head=+g('y-head'), mph=+g('y-mph'), lbs=+g('y-lbs'), t=+g('y-true'), c=+g('y-custom');
    const ftmin = mph*88; const swath=head; // ft/min * feet = ft²/min
    const acph = (ftmin*swath)/43560*60; // acres per hour
    const lbph = lbs*3600;
    const buWt = crop==='corn'?56:60;
    const rawBuPh = lbph/buWt;
    const shrink = 1 - (t+c)/100;
    const buPerAc = (rawBuPh*shrink)/acph;
    s(`≈ <b>${buPerAc.toFixed(1)} bu/ac</b> (${crop})`);
    function g(id){return document.getElementById(id).value||0}
    function s(m){document.getElementById('y-out').innerHTML=m}
  });
}
function viewCalcChem(){
  app.innerHTML = `
  <section class="section">
    <h1>🧴 Chemical Mix (Coming Soon)</h1>
    <p class="muted">A handy sheet for batch & field mixes will live here.</p>
    <a class="btn" href="#/calc">Back to Calculators</a>
  </section>`;
}

/* ---------- Equipment ---------- */
function viewEquipment(){
  app.innerHTML = `
    <div class="grid">
      ${tile('🌐','Starfire / Tech','#/equipment/starfire')}
      ${tile('🚜','Tractors','#/equipment/tractors')}
      ${tile('🌾','Combines','#/equipment/combines')}
      ${tile('💦','Sprayer / Spreader','#/equipment/sprayer')}
      ${tile('🏗️','Construction','#/equipment/construction')}
      ${tile('🚚','Trucks','#/equipment/trucks')}
      ${tile('🛻','Trailers','#/equipment/trailers')}
      ${tile('⚙️','Implements','#/equipment/implements')}
    </div>
    <div class="section"><a class="btn" href="#/home">Back to Dashboard</a></div>
  `;
}
function viewEquipCategory(nameKey){
  const label = LABELS['#/equipment/'+nameKey] || capWords(nameKey);
  app.innerHTML = `
  <section class="section">
    <h1>${label}</h1>
    <div class="field"><label>Make</label><input id="eq-make" required></div>
    <div class="field"><label>Model</label><input id="eq-model" required></div>
    <div class="field"><label>Serial Number</label><input id="eq-serial" required></div>
    <button id="eq-save" class="btn-primary">Add</button>
    <a class="btn" href="#/equipment">Back to Equipment</a>
    <div class="section"><h2>Inventory</h2><ul id="eq-list" class="crop-list"></ul></div>
  </section>`;
  const key = 'df_equip_'+nameKey;
  function render(){
    const list = JSON.parse(localStorage.getItem(key)||'[]');
    document.getElementById('eq-list').innerHTML = list.map(x=>(
      `<li class="crop-row"><div class="crop-info">
        <span class="chip">${x.make} ${x.model}</span>
        <span class="chip">SN: ${x.serial}</span>
        <span class="chip">Barcode: ${x.barcode}</span>
      </div></li>`
    )).join('') || '<p class="muted">No items yet.</p>';
  }
  render();
  document.getElementById('eq-save').addEventListener('click', ()=>{
    const make=document.getElementById('eq-make').value.trim();
    const model=document.getElementById('eq-model').value.trim();
    const serial=document.getElementById('eq-serial').value.trim();
    if(!make||!model||!serial){ alert('All fields required.'); return; }
    const barcode='EQ'+Date.now().toString(36).toUpperCase().slice(-7);
    const list=JSON.parse(localStorage.getItem(key)||'[]'); list.push({make,model,serial,barcode}); localStorage.setItem(key, JSON.stringify(list));
    render(); alert('Added with barcode '+barcode);
  });
}

/* ---------- Grain Tracking ---------- */
function viewGrain(){
  app.innerHTML = `
    <div class="grid">
      ${tile('🌾','Grain Bags','#/grain/bags')}
      ${tile('🏠','Grain Bins (🚧)','#/grain/bins')}
      ${tile('📑','Grain Contracts (🚧)','#/grain/contracts')}
      ${tile('🎟️','Ticket OCR (🚧)','#/grain/ocr')}
    </div>
    <div class="section"><a class="btn" href="#/home">Back to Dashboard</a></div>
  `;
}
function viewGrainBags(){
  const defUser=userEmail();
  app.innerHTML = `
  <section class="section">
    <h1>Grain Bags</h1>
    <div class="field"><label>Date</label><input id="gb-date" type="date" required value="${todayISO()}"></div>
    <div class="field"><label>Location</label><input id="gb-loc" required></div>
    <div class="field"><label>Submitted By</label><input id="gb-by" required value="${defUser}"></div>
    <div class="field"><label>Crop</label>
      <select id="gb-crop"><option>Corn</option><option>Soybeans</option><option>Wheat</option></select>
    </div>
    <div class="field"><label>Estimated Bushels</label><input id="gb-bu" type="number" step="1" min="0" required placeholder="e.g., 25,000"></div>
    <div class="field"><label>Notes</label><textarea id="gb-notes" rows="3"></textarea></div>
    <button id="gb-save" class="btn-primary">Save</button>
    <a class="btn" href="#/grain">Back to Grain</a>
    <div class="section"><h2>Records</h2><ul id="gb-list" class="crop-list"></ul></div>
  </section>`;
  function render(){
    const rows=JSON.parse(localStorage.getItem('df_grain_bags')||'[]');
    document.getElementById('gb-list').innerHTML = rows.map(r=>(
      `<li class="crop-row"><div class="crop-info">
        <span class="chip">#${r.bagNo}</span>
        <span class="chip">${r.crop}</span>
        <span class="chip">${r.location}</span>
        <span class="chip">${Number(r.bushels).toLocaleString()} bu</span>
      </div></li>`
    )).join('') || '<p class="muted">No grain bags yet.</p>';
  }
  render();
  document.getElementById('gb-save').addEventListener('click', ()=>{
    const date=g('gb-date'), loc=g('gb-loc').trim(), by=g('gb-by').trim(), crop=g('gb-crop'), bu=+g('gb-bu'), notes=g('gb-notes').trim();
    if(!date||!loc||!by||!bu){ alert('Please complete required fields.'); return; }
    const key='df_grain_bags'; const list=JSON.parse(localStorage.getItem(key)||'[]');
    const next = (list.filter(x=>x.location.toLowerCase()===loc.toLowerCase()).length || 0) + 1;
    const row={date,location:loc,by,crop,bushels:bu,notes,bagNo:`${loc}-${next}`};
    list.push(row); localStorage.setItem(key, JSON.stringify(list));
    alert('Saved! Assigned Bag # '+row.bagNo); render();
  });
  function g(id){return document.getElementById(id).value||''}
}

/* ---------- Team & Partners ---------- */
function viewTeam(){
  app.innerHTML = `
    <div class="grid">
      ${tile('👤','Employees','#/team/employees')}
      ${tile('🧑‍🔧','Subcontractors','#/team/subs')}
      ${tile('🏢','Vendors','#/team/vendors')}
      ${tile('📒','Directory','#/team/directory')}
    </div>
    <div class="section"><a class="btn" href="#/home">Back to Dashboard</a></div>
  `;
}
function viewEmployees(){
  app.innerHTML = `
  <section class="section">
    <h1>Employees</h1>
    <div class="field"><label>First Name</label><input id="em-f" required></div>
    <div class="field"><label>Last Name</label><input id="em-l" required></div>
    <div class="field"><label>Email (login)</label><input id="em-e" type="email" required></div>
    <div class="field"><label>Phone</label><input id="em-p" type="tel" placeholder="(555) 555-5555"></div>
    <button id="em-save" class="btn-primary">Add</button>
    <a class="btn" href="#/team">Back to Team</a>
    <div class="section"><h2>Roster</h2><ul id="em-list" class="crop-list"></ul></div>
  </section>`;
  const key='df_emp';
  function render(){
    const list=JSON.parse(localStorage.getItem(key)||'[]');
    document.getElementById('em-list').innerHTML = list.map(x=>(
      `<li class="crop-row"><div class="crop-info">
        <span class="chip">${x.first} ${x.last}</span>
        <span class="chip">${x.email}</span>
        <span class="chip">${x.phone||''}</span>
      </div></li>`
    )).join('') || '<p class="muted">No employees yet.</p>';
  }
  render();
  document.getElementById('em-save').addEventListener('click', ()=>{
    let f=v('em-f'), l=v('em-l'); f=capWords(f); l=capWords(l);
    const e=v('em-e').trim(), p=v('em-p').replace(/\D/g,'').replace(/(\d{3})(\d{3})(\d{4})/,'($1) $2-$3');
    if(!f||!l||!e) return alert('First, last, and email are required.');
    const list=JSON.parse(localStorage.getItem(key)||'[]'); list.push({first:f,last:l,email:e,phone:p});
    localStorage.setItem(key, JSON.stringify(list)); render();
  });
  function v(id){return document.getElementById(id).value||''}
}
function simpleList(key,labelBack){
  app.innerHTML = `
  <section class="section">
    <h1>${LABELS[location.hash]||'List'}</h1>
    <div class="field"><label>Name</label><input id="sl-n"></div>
    <div class="field"><label>Contact</label><input id="sl-c"></div>
    <div class="field"><label>Notes</label><textarea id="sl-notes" rows="3"></textarea></div>
    <button id="sl-save" class="btn-primary">Add</button>
    <a class="btn" href="${labelBack}">Back</a>
    <div class="section"><h2>List</h2><ul id="sl-list" class="crop-list"></ul></div>
  </section>`;
  function render(){
    const list=JSON.parse(localStorage.getItem(key)||'[]');
    document.getElementById('sl-list').innerHTML = list.map(x=>(
      `<li class="crop-row"><div class="crop-info">
        <span class="chip">${x.name}</span><span class="chip">${x.contact||''}</span>
      </div></li>`
    )).join('') || '<p class="muted">Empty.</p>';
  }
  render();
  document.getElementById('sl-save').addEventListener('click', ()=>{
    const name=(document.getElementById('sl-n').value||'').trim();
    if(!name){ alert('Name required.'); return; }
    const contact=document.getElementById('sl-c').value.trim();
    const notes=document.getElementById('sl-notes').value.trim();
    const list=JSON.parse(localStorage.getItem(key)||'[]'); list.push({name,contact,notes}); localStorage.setItem(key, JSON.stringify(list)); render();
  });
}
function viewSubs(){ simpleList('df_subs','#/team'); }
function viewVendors(){ simpleList('df_vendors','#/team'); }
function viewDirectory(){
  const emps=JSON.parse(localStorage.getItem('df_emp')||'[]');
  const subs=JSON.parse(localStorage.getItem('df_subs')||'[]');
  const vendors=JSON.parse(localStorage.getItem('df_vendors')||'[]');
  app.innerHTML = `
  <section class="section">
    <h1>Directory</h1>
    <h3>Employees</h3>
    <ul class="crop-list">${emps.map(e=>`<li class="crop-row"><div class="crop-info"><span class="chip">${e.first} ${e.last}</span><span class="chip">${e.email}</span><span class="chip">${e.phone||''}</span></div></li>`).join('') || '<p class="muted">—</p>'}</ul>
    <h3>Subcontractors</h3>
    <ul class="crop-list">${subs.map(e=>`<li class="crop-row"><div class="crop-info"><span class="chip">${e.name}</span><span class="chip">${e.contact||''}</span></div></li>`).join('') || '<p class="muted">—</p>'}</ul>
    <h3>Vendors</h3>
    <ul class="crop-list">${vendors.map(e=>`<li class="crop-row"><div class="crop-info"><span class="chip">${e.name}</span><span class="chip">${e.contact||''}</span></div></li>`).join('') || '<p class="muted">—</p>'}</ul>
    <a class="btn" href="#/team">Back to Team</a>
  </section>`;
}

/* ---------- AI Reports ---------- */
function viewAIHub(){
  app.innerHTML = `
    <div class="grid">
      ${tile('📄','Pre-made Reports','#/ai/premade')}
      ${tile('📊','Yield Reports','#/ai/yield')}
      ${tile('🤖','AI Reports (🚧)','#/ai/ai')}
    </div>
    <div class="section"><a class="btn" href="#/home">Back to Dashboard</a></div>
  `;
}
function viewReportsPremade(){ app.innerHTML = `<section class="section"><h1>Pre-made Reports</h1><p class="muted">Coming soon.</p><a class="btn" href="#/ai">Back to AI</a></section>`; }
function viewReportsYield(){ app.innerHTML = `<section class="section"><h1>Yield Reports</h1><p class="muted">Coming soon.</p><a class="btn" href="#/ai">Back to AI</a></section>`; }
function viewReportsAI(){ app.innerHTML = `<section class="section"><h1>AI Reports</h1><p class="muted">🤖 ChatGPT integration coming soon.</p><a class="btn" href="#/ai">Back to AI</a></section>`; }

/* ---------- Settings ---------- */
function viewSettingsHome(){
  app.innerHTML = `
    <div class="grid">
      ${tile('🌱','Crop Types','#/settings/crops')}
      ${tile('🌓','Theme','#/settings/theme')}
    </div