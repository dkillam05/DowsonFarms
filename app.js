// ===== Version shown in footer =====
const APP_VERSION = 'v10.3';

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
function normalizeVersion(v){ const m=String(v||'').replace(/^v/i,''); const [a='0',b='0']=m.split('.'); return `v${a}.${b}`; }
function num(v){ const n = Number(v); return Number.isFinite(n) ? n : 0; }

// ===== DOM refs =====
const app = document.getElementById('app');
const crumbs = document.getElementById('breadcrumbs');
const versionEl = document.getElementById('version');
const todayEl = document.getElementById('today');
const clockEl = document.getElementById('clock');

// ---- Robust Logout (works for button or link) ----
function doLogout() {
  try {
    localStorage.removeItem('df_auth');
    localStorage.removeItem('df_user');
  } catch {}
  location.assign('login.html?bye=' + Date.now()); // cache-bust
}
document.getElementById('logout')?.addEventListener('click', (e)=>{ e.preventDefault(); doLogout(); });
document.addEventListener('click', (e)=>{
  const el = e.target.closest('#logout,[data-action="logout"],a[href="logout"]');
  if (!el) return;
  e.preventDefault(); doLogout();
});

// ===== Measure header/crumbs/footer heights -> CSS vars =====
function setCSSVar(name, px){ document.documentElement.style.setProperty(name, `${px}px`); }
function measureBars(){
  const h = document.querySelector('.app-header');
  const c = document.querySelector('.breadcrumbs');
  const f = document.querySelector('.app-footer');
  setCSSVar('--header-h', h ? h.offsetHeight : 52);
  setCSSVar('--crumbs-h', c ? c.offsetHeight : 36);
  setCSSVar('--footer-h', f ? f.offsetHeight : 44);
}
function refreshLayout(){
  measureBars();
  requestAnimationFrame(measureBars);
}
['load','resize','orientationchange'].forEach(evt=>window.addEventListener(evt, refreshLayout));

// ===== Tiles =====
function tile(emoji,label,href){
  return `<a class="tile" href="${href}" aria-label="${label}">
    <span class="emoji">${emoji}</span>
    <span class="label">${label}</span>
  </a>`;
}

// ===== Breadcrumb labels =====
const LABELS = {
  '#/home': 'Home',

  // Crop
  '#/crop': 'Crop Production',
  '#/crop/planting': 'Planting',
  '#/crop/scouting': 'Scouting',
  '#/crop/irrigation': 'Irrigation',
  '#/crop/harvest': 'Harvest',
  '#/crop/storage': 'Storage',
  '#/crop/maintenance': 'Maintenance (Crop)',

  // Equipment
  '#/equipment': 'Equipment',
  '#/equipment/tractors': 'Tractors',
  '#/equipment/combines': 'Combines',
  '#/equipment/trucks': 'Trucks',
  '#/equipment/implements': 'Implements',
  '#/equipment/maintenance': 'Maintenance Logs',

  // Calculators
  '#/calc': 'Calculators',
  '#/calc/acreage': 'Acreage',
  '#/calc/seedpop': 'Seed Population',
  '#/calc/fert': 'Fertilizer Rate',
  '#/calc/moisture': 'Grain Moisture Adjust',
  '#/calc/bin': 'Bin Volume',

  // Other hubs
  '#/grain': 'Grain Tracking',
  '#/employees': 'Employees',
  '#/ai': 'AI Reports',
  '#/ai/premade': 'Pre-made Reports',
  '#/ai/ai': 'AI Reports',
  '#/ai/yield': 'Yield Report',
  '#/settings': 'Settings',
  '#/settings/crops': 'Crop Type',
  '#/settings/theme': 'Theme',
  '#/feedback': 'Feedback',
  '#/feedback/errors': 'Report Errors',
  '#/feedback/feature': 'New Feature Request',
};

// ===== Breadcrumb generator =====
function renderBreadcrumb(){
  const hash = location.hash || '#/home';
  if (hash === '#/home' || hash === '') {
    crumbs.innerHTML = `<span aria-current="page">Home</span>`;
    return;
  }
  const parts = hash.split('/').filter(Boolean); // ["#", "crop", "planting"]
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

// ===== Home =====
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

/* =========================
   CROP PRODUCTION HUB + PAGES
   ========================= */
function viewCropHub(){
  app.innerHTML = `
    <div class="grid">
      ${tile('🌱','Planting','#/crop/planting')}
      ${tile('🔍','Scouting','#/crop/scouting')}
      ${tile('💧','Irrigation','#/crop/irrigation')}
      ${tile('🌾','Harvest','#/crop/harvest')}
      ${tile('🏷️','Storage','#/crop/storage')}
      ${tile('🛠️','Maintenance','#/crop/maintenance')}
    </div>
    <div class="section"><a class="btn" href="#/home">Back to Dashboard</a></div>
  `;
}
function viewCropStub(title){
  app.innerHTML = `
    <section class="section">
      <h1>${title}</h1>
      <p class="muted">Coming soon.</p>
      <a class="btn" href="#/crop">Back to Crop Production</a>
    </section>
  `;
}

/* =========================
   EQUIPMENT HUB + PAGES
   ========================= */
function viewEquipmentHub(){
  app.innerHTML = `
    <div class="grid">
      ${tile('🚜','Tractors','#/equipment/tractors')}
      ${tile('🌾','Combines','#/equipment/combines')}
      ${tile('🚚','Trucks','#/equipment/trucks')}
      ${tile('🧰','Implements','#/equipment/implements')}
      ${tile('📝','Maintenance Logs','#/equipment/maintenance')}
    </div>
    <div class="section"><a class="btn" href="#/home">Back to Dashboard</a></div>
  `;
}
function viewEquipmentStub(title){
  app.innerHTML = `
    <section class="section">
      <h1>${title}</h1>
      <p class="muted">Coming soon.</p>
      <a class="btn" href="#/equipment">Back to Equipment</a>
    </section>
  `;
}

/* =========================
   CALCULATORS HUB + TOOLS
   ========================= */
function viewCalcHub(){
  app.innerHTML = `
    <div class="grid">
      ${tile('📐','Acreage','#/calc/acreage')}
      ${tile('🌱','Seed Population','#/calc/seedpop')}
      ${tile('🧪','Fertilizer Rate','#/calc/fert')}
      ${tile('🌾','Moisture Adjust','#/calc/moisture')}
      ${tile('🛢️','Bin Volume','#/calc/bin')}
    </div>
    <div class="section"><a class="btn" href="#/home">Back to Dashboard</a></div>
  `;
}

// Acreage: length & width (feet) → acres
function viewCalcAcreage(){
  app.innerHTML = `
    <section class="section">
      <h1>📐 Acreage</h1>
      <div class="field"><label>Length (ft)</label><input id="lenft" type="number" inputmode="decimal" placeholder="e.g., 1320"></div>
      <div class="field"><label>Width (ft)</label><input id="widft" type="number" inputmode="decimal" placeholder="e.g., 660"></div>
      <button id="go" class="btn-primary">Calculate</button>
      <p id="out" class="section"></p>
      <a class="btn" href="#/calc">Back to Calculators</a>
    </section>
  `;
  document.getElementById('go')?.addEventListener('click', ()=>{
    const a = num(document.getElementById('lenft').value);
    const b = num(document.getElementById('widft').value);
    const acres = (a*b)/43560;
    document.getElementById('out').textContent = isFinite(acres) ? `Area: ${acres.toFixed(3)} acres` : '';
  });
}

// Seed Population: row spacing (inches), plants per 1,000 ft → plants/acre
function viewCalcSeedPop(){
  app.innerHTML = `
    <section class="section">
      <h1>🌱 Seed Population</h1>
      <div class="field"><label>Row Spacing (in)</label><input id="rowin" type="number" inputmode="decimal" placeholder="e.g., 30"></div>
      <div class="field"><label>Plants per 1,000 ft of row</label><input id="p1000" type="number" inputmode="decimal" placeholder="e.g., 170"></div>
      <button id="go" class="btn-primary">Calculate</button>
      <p id="out" class="section"></p>
      <a class="btn" href="#/calc">Back to Calculators</a>
    </section>
  `;
  document.getElementById('go')?.addEventListener('click', ()=>{
    const row = num(document.getElementById('rowin').value);
    const p = num(document.getElementById('p1000').value);
    if (!row || !p){ document.getElementById('out').textContent=''; return; }
    // 43,560 sq ft per acre; rows per acre = 43560 / (row_spacing_in/12 * 1000 ft?) Better method:
    // plants/acre = (plants per 1000 ft) * (43560 / (row_spacing_ft * 1000))
    const rowFt = row/12;
    const plantsPerAcre = p * (43560 / (rowFt*1000));
    document.getElementById('out').textContent = `Population: ${Math.round(plantsPerAcre).toLocaleString()} plants/acre`;
  });
}

// Fertilizer Rate: desired N-P2O5-K2O lb/ac and analysis % → product lb/ac
function viewCalcFert(){
  app.innerHTML = `
    <section class="section">
      <h1>🧪 Fertilizer Rate</h1>
      <div class="field"><label>Target N (lb/ac)</label><input id="n" type="number" inputmode="decimal"></div>
      <div class="field"><label>Target P₂O₅ (lb/ac)</label><input id="p" type="number" inputmode="decimal"></div>
      <div class="field"><label>Target K₂O (lb/ac)</label><input id="k" type="number" inputmode="decimal"></div>
      <div class="field"><label>Analysis (N-P-K %)</label>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
          <input id="an" type="number" inputmode="decimal" placeholder="e.g., 28">
          <input id="ap" type="number" inputmode="decimal" placeholder="e.g., 0">
          <input id="ak" type="number" inputmode="decimal" placeholder="e.g., 0">
        </div>
      </div>
      <button id="go" class="btn-primary">Calculate</button>
      <p id="out" class="section"></p>
      <a class="btn" href="#/calc">Back to Calculators</a>
    </section>
  `;
  document.getElementById('go')?.addEventListener('click', ()=>{
    const N = num(document.getElementById('n').value);
    const P = num(document.getElementById('p').value);
    const K = num(document.getElementById('k').value);
    const aN = num(document.getElementById('an').value)/100;
    const aP = num(document.getElementById('ap').value)/100;
    const aK = num(document.getElementById('ak').value)/100;

    // Simple single-product estimate: choose the binding nutrient
    const reqN = aN? N/aN : 0;
    const reqP = aP? P/aP : 0;
    const reqK = aK? K/aK : 0;
    const lbsPerAcre = Math.max(reqN||0, reqP||0, reqK||0);
    if (!isFinite(lbsPerAcre) || lbsPerAcre<=0){ document.getElementById('out').textContent=''; return; }

    const delivers = {
      N: (aN*lbsPerAcre).toFixed(1),
      P: (aP*lbsPerAcre).toFixed(1),
      K: (aK*lbsPerAcre).toFixed(1),
    };
    document.getElementById('out').innerHTML =
      `Apply about <b>${lbsPerAcre.toFixed(1)} lb/ac</b> of your ${Math.round(aN*100)}-${Math.round(aP*100)}-${Math.round(aK*100)} blend.<br>
       Delivers ≈ N ${delivers.N}, P₂O₅ ${delivers.P}, K₂O ${delivers.K} (lb/ac).`;
  });
}

// Grain Moisture Adjustment: wet % to dry basis
function viewCalcMoisture(){
  app.innerHTML = `
    <section class="section">
      <h1>🌾 Moisture Adjust</h1>
      <div class="field"><label>Wet Weight (lb or bu)</label><input id="wetw" type="number" inputmode="decimal"></div>
      <div class="field"><label>Measured Moisture (%)</label><input id="wm" type="number" inputmode="decimal" placeholder="e.g., 18"></div>
      <div class="field"><label>Target Moisture (%)</label><input id="tm" type="number" inputmode="decimal" placeholder="e.g., 15"></div>
      <button id="go" class="btn-primary">Calculate</button>
      <p id="out" class="section"></p>
      <a class="btn" href="#/calc">Back to Calculators</a>
    </section>
  `;
  document.getElementById('go')?.addEventListener('click', ()=>{
    const W = num(document.getElementById('wetw').value);
    const wm = num(document.getElementById('wm').value)/100;
    const tm = num(document.getElementById('tm').value)/100;
    if (!W || !wm || !tm || wm<=tm){ document.getElementById('out').textContent=''; return; }
    // Dry basis correction: dry matter = W*(1-wm). New weight at tm = dry/(1-tm)
    const dryMatter = W*(1-wm);
    const corrected = dryMatter/(1-tm);
    document.getElementById('out').textContent = `Corrected to target moisture: ${corrected.toFixed(2)}`;
  });
}

// Bin Volume: Cylinder (diameter ft, height ft) → bushels (use 1.24446 ft³/bu for corn approx)
function viewCalcBin(){
  app.innerHTML = `
    <section class="section">
      <h1>🛢️ Bin Volume</h1>
      <div class="field"><label>Diameter (ft)</label><input id="dia" type="number" inputmode="decimal"></div>
      <div class="field"><label>Height (ft)</label><input id="h" type="number" inputmode="decimal"></div>
      <button id="go" class="btn-primary">Calculate</button>
      <p id="out" class="section"></p>
      <p class="muted small">Note: cylinder only; roof/heap not included. Uses 1.2445 ft³ per bu (corn).</p>
      <a class="btn" href="#/calc">Back to Calculators</a>
    </section>
  `;
  document.getElementById('go')?.addEventListener('click', ()=>{
    const d = num(document.getElementById('dia').value);
    const h = num(document.getElementById('h').value);
    const r = d/2;
    const volFt3 = Math.PI * r * r * h;
    const bu = volFt3 / 1.2445;
    document.getElementById('out').textContent = isFinite(bu) ? `Volume: ${Math.round(bu).toLocaleString()} bushels` : '';
  });
}

/* =========================
   FEEDBACK / REPORTS / SETTINGS (existing)
   ========================= */
function viewReportsHub(){
  app.innerHTML = `
    <div class="grid">
      ${tile('📄','Pre-made Reports','#/ai/premade')}
      ${tile('🤖','AI Reports','#/ai/ai')}
      ${tile('📊','Yield Report','#/ai/yield')}
    </div>
    <div class="section"><a class="btn" href="#/home">Back to Dashboard</a></div>
  `;
}
function viewReportsPremade(){ viewCropStub('📄 Pre-made Reports'); }
function viewReportsAI(){ viewCropStub('🤖 AI Reports'); }
function viewReportsYield(){ viewCropStub('📊 Yield Report'); }

function viewSettingsHome(){
  app.innerHTML = `
    <div class="grid">
      ${tile('🌱','Crop Type','#/settings/crops')}
      ${tile('🌓','Theme','#/settings/theme')}
    </div>
    <div class="section"><a class="btn" href="#/home">Back to Dashboard</a></div>
  `;
}
function viewSettingsCrops(){ viewCropStub('Crop Type'); }

function viewFeedbackHub(){
  app.innerHTML = `
    <div class="grid">
      ${tile('🛠️','Report Errors','#/feedback/errors')}
      ${tile('💡','New Feature Request','#/feedback/feature')}
    </div>
    <div class="section"><a class="btn" href="#/home">Back to Dashboard</a></div>
  `;
}
function viewFeedbackErrors(){ viewCropStub('🛠️ Report Errors'); }
function viewFeedbackFeature(){ viewCropStub('💡 New Feature Request'); }

/* =========================
   Router
   ========================= */
function route(){
  const hash = location.hash || '#/home';
  renderBreadcrumb();

  if (hash === '#/home' || hash === '') viewHome();

  // Crop hub + pages
  else if (hash === '#/crop') viewCropHub();
  else if (hash === '#/crop/planting') viewCropStub('Planting');
  else if (hash === '#/crop/scouting') viewCropStub('Scouting');
  else if (hash === '#/crop/irrigation') viewCropStub('Irrigation');
  else if (hash === '#/crop/harvest') viewCropStub('Harvest');
  else if (hash === '#/crop/storage') viewCropStub('Storage');
  else if (hash === '#/crop/maintenance') viewCropStub('Maintenance (Crop)');

  // Equipment hub + pages
  else if (hash === '#/equipment') viewEquipmentHub();
  else if (hash === '#/equipment/tractors') viewEquipmentStub('Tractors');
  else if (hash === '#/equipment/combines') viewEquipmentStub('Combines');
  else if (hash === '#/equipment/trucks') viewEquipmentStub('Trucks');
  else if (hash === '#/equipment/implements') viewEquipmentStub('Implements');
  else if (hash === '#/equipment/maintenance') viewEquipmentStub('Maintenance Logs');

  // Calculators
  else if (hash === '#/calc') viewCalcHub();
  else if (hash === '#/calc/acreage') viewCalcAcreage();
  else if (hash === '#/calc/seedpop') viewCalcSeedPop();
  else if (hash === '#/calc/fert') viewCalcFert();
  else if (hash === '#/calc/moisture') viewCalcMoisture();
  else if (hash === '#/calc/bin') viewCalcBin();

  // Other unchanged
  else if (hash === '#/grain') viewCropStub('Grain Tracking');
  else if (hash === '#/employees') viewCropStub('Employees');
  else if (hash === '#/ai') viewReportsHub();
  else if (hash === '#/ai/premade') viewReportsPremade();
  else if (hash === '#/ai/ai') viewReportsAI();
  else if (hash === '#/ai/yield') viewReportsYield();
  else if (hash === '#/settings') viewSettingsHome();
  else if (hash === '#/settings/crops') viewSettingsCrops();
  else if (hash === '#/feedback') viewFeedbackHub();
  else if (hash === '#/feedback/errors') viewFeedbackErrors();
  else if (hash === '#/feedback/feature') viewFeedbackFeature();
  else viewCropStub('Not Found');

  // reset scroll and recompute layout
  try { app?.scrollTo?.({top:0,left:0,behavior:'auto'}); window.scrollTo(0,0); } catch {}
  refreshLayout();
}
window.addEventListener('hashchange', route);
window.addEventListener('load', route);

// ===== Footer text + clock =====
if (versionEl) versionEl.textContent = normalizeVersion(APP_VERSION);
if (todayEl) todayEl.textContent = prettyDate(new Date());
function tick(){ if (clockEl) clockEl.textContent = formatClock12(new Date()); }
tick(); setInterval(tick, 15000);

// ===== Update banner helpers (unchanged from your setup) =====
const bannerEl = document.getElementById('update-banner');
const bannerBtn = document.getElementById('update-refresh');
function showUpdateBanner(){ if (bannerEl){ bannerEl.hidden=false; measureBars(); } }
function hideUpdateBanner(){ if (bannerEl){ bannerEl.hidden=true; measureBars(); } }
function markVersionAsCurrent(){ try{ localStorage.setItem('df_app_version', normalizeVersion(APP_VERSION)); }catch{} }
function storedVersion(){ try{ return localStorage.getItem('df_app_version')||''; }catch{ return ''; } }
function needsUpdate(){ const saved=storedVersion(), cur=normalizeVersion(APP_VERSION); return saved && saved!==cur; }
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
  const here = (location.pathname.split('/').pop()||'').toLowerCase();
  if (here==='login.html'){ markVersionAsCurrent(); hideUpdateBanner(); return; }
  if (navigator.serviceWorker && navigator.serviceWorker.controller){
    markVersionAsCurrent(); hideUpdateBanner();
  }
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
      if (reg.waiting) {
        window.__waitingSW = reg.waiting;
        if (needsUpdate()) showUpdateBanner();
      }
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        if (!sw) return;
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