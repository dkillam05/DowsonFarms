// ===== App Version =====
const APP_VERSION = 'v10.5';

// ===== Auth =====
function isAuthed() {
  try { return localStorage.getItem('df_auth') === '1'; }
  catch { return false; }
}
(function enforceAuth() {
  const here = (location.pathname.split('/').pop() || '').toLowerCase();
  if (!isAuthed() && here !== 'login.html') window.location.replace('login.html');
})();

// ===== Utilities =====
function pad2(n){ return n<10?'0'+n:''+n; }
function formatClock12(d){ let h=d.getHours(),m=d.getMinutes(),ap=h>=12?'PM':'AM'; h=h%12||12; return `${h}:${pad2(m)} ${ap}`; }
function ordinal(n){ const s=['th','st','nd','rd'],v=n%100; return n+(s[(v-20)%10]||s[v]||s[0]); }
function prettyDate(d=new Date()){ return `${d.toLocaleString(undefined,{weekday:'long'})} ${d.toLocaleString(undefined,{month:'long'})} ${ordinal(d.getDate())} ${d.getFullYear()}`; }
function normalizeVersion(v){ const m=String(v||'').replace(/^v/i,''); const [a='0',b='0']=m.split('.'); return `v${a}.${b}`; }

// ===== DOM Refs =====
const app=document.getElementById('app');
const crumbs=document.getElementById('breadcrumbs');
const versionEl=document.getElementById('version');
const todayEl=document.getElementById('today');
const clockEl=document.getElementById('clock');
const bannerEl=document.getElementById('update-banner');
const bannerBtn=document.getElementById('update-refresh');

// ===== Layout Vars =====
function setVar(name,px){document.documentElement.style.setProperty(name,px+'px');}
function refreshLayout(){
  const h=document.querySelector('.app-header'); setVar('--header-h',h?h.offsetHeight:52);
  const c=document.querySelector('.breadcrumbs'); setVar('--crumbs-h',c?c.offsetHeight:36);
  const f=document.querySelector('.app-footer'); setVar('--footer-h',f?f.offsetHeight:44);
  const b=(bannerEl && !bannerEl.hidden)? bannerEl.offsetHeight:0; setVar('--banner-h',b);
}
['load','resize','orientationchange'].forEach(e=>window.addEventListener(e,refreshLayout));

// ===== Tile helper =====
function tile(emoji,label,href){
  return `<a class="tile" href="${href}"><span class="emoji">${emoji}</span><span class="label">${label}</span></a>`;
}

// ===== Breadcrumbs =====
function renderBreadcrumb(){
  const hash=location.hash||'#/home';
  if(hash==='#/home'||hash===''){crumbs.innerHTML='<span aria-current="page">Home</span>';return;}
  const parts=hash.split('/').filter(Boolean);
  let trail=[`<a href="#/home">Home</a>`]; let cur='#';
  for(let i=1;i<parts.length;i++){
    cur+='/'+parts[i];
    const label=parts[i].replace(/-/g,' ').replace(/\b\w/g,s=>s.toUpperCase());
    if(i<parts.length-1) trail.push(`<a href="${cur}">${label}</a>`);
    else trail.push(`<span aria-current="page">${label}</span>`);
  }
  crumbs.innerHTML=trail.join(' &nbsp;&gt;&nbsp; ');
}

// ===== Views =====
function viewHome(){
  app.innerHTML=`
  <div class="grid">
    ${tile('🌽','Crop Production','#/crop')}
    ${tile('🔢','Calculator','#/calc')}
    ${tile('🛠️','Field Maintenance','#/crop/maintenance')}
    ${tile('🚜','Equipment','#/equipment')}
    ${tile('📦','Grain Tracking','#/grain')}
    ${tile('🤝','Team & Partners','#/team')}
    ${tile('🤖','Reports','#/ai')}
    ${tile('⚙️','Settings','#/settings')}
    ${tile('💬','Feedback','#/feedback')}
  </div>`; }

function viewSection(title,back='#/home',label='Back to Dashboard'){
  app.innerHTML=`<section class="section"><h1>${title}</h1><p>🚧 Coming soon…</p><a class="btn" href="${back}">${label}</a></section>`;
}

// --- Crop Production ---
function viewCropHub(){
  app.innerHTML=`
  <div class="grid">
    ${tile('🌱','Planting','#/crop/planting')}
    ${tile('🧪','Spraying','#/crop/spraying')}
    ${tile('🚁','Aerial Spray','#/crop/aerial')}
    ${tile('🌾','Harvest','#/crop/harvest')}
    ${tile('🛠️','Maintenance','#/crop/maintenance')}
    ${tile('🔎','Scouting','#/crop/scouting')}
    ${tile('🧬','Trials','#/crop/trials')}
  </div><div class="section"><a class="btn" href="#/home">Back to Dashboard</a></div>`; }

// --- Calculators ---
function viewCalcHub(){
  app.innerHTML=`
  <div class="grid">
    ${tile('🌾','Yield Calculator','#/calc/yield')}
    ${tile('🌱','Fertilizer Calc','#/calc/fertilizer')}
    ${tile('🏗️','Bin Calculator','#/calc/bin')}
    ${tile('📏','Area Calculator','#/calc/area')}
    ${tile('🧪','Chemical Mix','#/calc/chem')}
  </div><div class="section"><a class="btn" href="#/home">Back to Dashboard</a></div>`; }

// --- Equipment ---
function viewEquipHub(){
  app.innerHTML=`
  <div class="grid">
    ${tile('📡','Starfire & Tech','#/equipment/tech')}
    ${tile('🚜','Tractors','#/equipment/tractors')}
    ${tile('🌾','Combines','#/equipment/combines')}
    ${tile('💦','Sprayer/Fertilizer','#/equipment/sprayer')}
    ${tile('🏗️','Construction','#/equipment/construction')}
    ${tile('🚚','Trucks','#/equipment/trucks')}
    ${tile('🚛','Trailers','#/equipment/trailers')}
    ${tile('⚙️','Implements','#/equipment/implements')}
  </div><div class="section"><a class="btn" href="#/home">Back to Dashboard</a></div>`; }

// --- Grain Tracking ---
function viewGrainHub(){
  app.innerHTML=`
  <div class="grid">
    ${tile('🥫','Grain Bags','#/grain/bags')}
    ${tile('🏗️','Grain Bins','#/grain/bins')}
    ${tile('📜','Grain Contracts','#/grain/contracts')}
    ${tile('🎫','Grain Tickets OCR','#/grain/tickets')}
  </div><div class="section"><a class="btn" href="#/home">Back to Dashboard</a></div>`; }

function viewGrainBags(){
  app.innerHTML=`
  <section class="section">
    <h1>🥫 Grain Bag</h1>
    <div class="field"><label>Date*</label><input type="date" value="${new Date().toISOString().split('T')[0]}"></div>
    <div class="field"><label>Location*</label><input type="text"></div>
    <div class="field"><label>Submitted By*</label><input type="text" value="${localStorage.getItem('df_user')||''}"></div>
    <div class="field"><label>Crop*</label><input type="text"></div>
    <div class="field"><label>Est. Bushels*</label><input type="number"></div>
    <div class="field"><label>Notes</label><textarea></textarea></div>
    <a class="btn" href="#/grain">Back to Grain Tracking</a>
  </section>`; }

// --- Team & Partners ---
function viewTeamHub(){
  app.innerHTML=`
  <div class="grid">
    ${tile('👷','Employees','#/team/employees')}
    ${tile('🛠️','Subcontractors','#/team/subs')}
    ${tile('🏢','Vendors','#/team/vendors')}
    ${tile('📖','Directory','#/team/directory')}
  </div><div class="section"><a class="btn" href="#/home">Back to Dashboard</a></div>`; }

// --- Reports ---
function viewReportsHub(){
  app.innerHTML=`
  <div class="grid">
    ${tile('📄','Pre-made Reports','#/ai/premade')}
    ${tile('🤖','AI Reports','#/ai/ai')}
    ${tile('📊','Yield Report','#/ai/yield')}
  </div><section class="section"><h2>🔮 Future</h2><p>ChatGPT integration coming soon</p></section>
  <div class="section"><a class="btn" href="#/home">Back to Dashboard</a></div>`; }

// --- Settings ---
function viewSettingsHub(){
  app.innerHTML=`
  <div class="grid">
    ${tile('🌱','Crop Types','#/settings/crops')}
    ${tile('🌓','Theme','#/settings/theme')}
  </div><div class="section"><a class="btn" href="#/home">Back to Dashboard</a></div>`; }

// --- Feedback ---
function viewFeedbackHub(){
  app.innerHTML=`
  <div class="grid">
    ${tile('🛠️','Report Errors','#/feedback/errors')}
    ${tile('💡','Feature Request','#/feedback/feature')}
  </div><div class="section"><a class="btn" href="#/home">Back to Dashboard</a></div>`; }

function viewFeedbackErrors(){
  app.innerHTML=`
  <section class="section">
    <h1>🛠️ Report Errors</h1>
    <div class="field"><input id="err-subj" placeholder="Subject*"></div>
    <div class="field"><textarea id="err-desc" rows="4" placeholder="What happened?*"></textarea></div>
    <button id="err-submit" class="btn-primary">Submit</button>
    <a class="btn" href="#/feedback">Back to Feedback</a>
  </section>`;
  document.getElementById('err-submit').onclick=()=>{
    alert('Thanks! Error saved.'); location.hash='#/feedback';
  };
}
function viewFeedbackFeature(){
  app.innerHTML=`
  <section class="section">
    <h1>💡 Feature Request</h1>
    <div class="field"><input id="feat-subj" placeholder="Feature*"></div>
    <div class="field"><textarea id="feat-desc" rows="4" placeholder="Describe idea*"></textarea></div>
    <button id="feat-submit" class="btn-primary">Submit</button>
    <a class="btn" href="#/feedback">Back to Feedback</a>
  </section>`;
  document.getElementById('feat-submit').onclick=()=>{
    alert('Thanks! Feature saved.'); location.hash='#/feedback';
  };
}

// ===== Router =====
function route(){
  const h=location.hash||'#/home'; renderBreadcrumb();
  if(h==='#/home'||h==='') viewHome();
  else if(h==='#/crop') viewCropHub();
  else if(h.startsWith('#/crop/')) viewSection(h.split('/')[2],'#/crop','Back to Crop');
  else if(h==='#/calc') viewCalcHub();
  else if(h.startsWith('#/calc/')) viewSection(h.split('/')[2],'#/calc','Back to Calculators');
  else if(h==='#/equipment') viewEquipHub();
  else if(h.startsWith('#/equipment/')) viewSection(h.split('/')[2],'#/equipment','Back to Equipment');
  else if(h==='#/grain') viewGrainHub();
  else if(h==='#/grain/bags') viewGrainBags();
  else if(h.startsWith('#/grain/')) viewSection(h.split('/')[2],'#/grain','Back to Grain');
  else if(h==='#/team') viewTeamHub();
  else if(h.startsWith('#/team/')) viewSection(h.split('/')[2],'#/team','Back to Team');
  else if(h==='#/ai') viewReportsHub();
  else if(h.startsWith('#/ai/')) viewSection(h.split('/')[2],'#/ai','Back to Reports');
  else if(h==='#/settings') viewSettingsHub();
  else if(h.startsWith('#/settings/')) viewSection(h.split('/')[2],'#/settings','Back to Settings');
  else if(h==='#/feedback') viewFeedbackHub();
  else if(h==='#/feedback/errors') viewFeedbackErrors();
  else if(h==='#/feedback/feature') viewFeedbackFeature();
  else viewSection('Not Found','#/home');
  refreshLayout(); window.scrollTo(0,0);
}
window.addEventListener('hashchange',route);
window.addEventListener('load',route);

// ===== Footer / Clock =====
if(versionEl) versionEl.textContent=normalizeVersion(APP_VERSION);
if(todayEl) todayEl.textContent=prettyDate();
function tick(){ if(clockEl) clockEl.textContent=formatClock12(new Date()); }
tick(); setInterval(tick,15000);

// ===== Logout =====
(function bindLogout(){
  const btn=document.getElementById('logout');
  if(!btn) return;
  btn.addEventListener('click',e=>{
    e.preventDefault();
    try{localStorage.removeItem('df_auth');localStorage.removeItem('df_user');}catch{}
    location.replace('login.html?ts='+Date.now());
  });
})();

// ===== Update Banner Logic =====
function showUpdateBanner(){ if(bannerEl){bannerEl.hidden=false;refreshLayout();} }
function hideUpdateBanner(){ if(bannerEl){bannerEl.hidden=true;refreshLayout();} }
function markVersionAsCurrent(){ try{localStorage.setItem('df_app_version',normalizeVersion(APP_VERSION));}catch{} }
function storedVersion(){ try{return localStorage.getItem('df_app_version')||'';}catch{return'';} }
function needsUpdate(){const s=storedVersion(),c=normalizeVersion(APP_VERSION);return s&&s!==c;}
function syncBannerWithVersion(){ if(needsUpdate()) showUpdateBanner(); else{ hideUpdateBanner(); markVersionAsCurrent(); } }
bannerBtn?.addEventListener('click',()=>{sessionStorage.setItem('df_updating','1');bannerBtn.disabled=true;bannerBtn.textContent='Updating…';hideUpdateBanner();if(window.__waitingSW)window.__waitingSW.postMessage({type:'SKIP_WAITING'});else location.reload();});

// ===== Service Worker =====
if('serviceWorker' in navigator){
  window.addEventListener('load',async()=>{
    try{
      const reg=await navigator.serviceWorker.register(`service-worker.js?v=${normalizeVersion(APP_VERSION)}`,{updateViaCache:'none'});
      reg.update(); document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')reg.update();});
      if(reg.waiting){window.__waitingSW=reg.waiting;if(needsUpdate())showUpdateBanner();}
      reg.addEventListener('updatefound',()=>{const sw=reg.installing;if(!sw)return;sw.addEventListener('statechange',()=>{if(sw.state==='installed'&&navigator.serviceWorker.controller){window.__waitingSW=reg.waiting||sw;if(needsUpdate())showUpdateBanner();}});});
      navigator.serviceWorker.addEventListener('controllerchange',()=>{window.__waitingSW=null;markVersionAsCurrent();hideUpdateBanner();setTimeout(()=>location.reload(),200);});
    }catch(e){console.error('SW registration failed',e);}
  });
}