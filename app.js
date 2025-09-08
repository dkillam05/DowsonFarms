// ===== Version shown in footer (vMAJOR.MINOR only) =====
const APP_VERSION = 'v7.4';

// ===== Minimal theme (kept as-is) =====
(function(){ try{
  const t = localStorage.getItem('df_theme') || 'auto';
  document.documentElement.setAttribute('data-theme', t);
} catch {} })();

// ===== Invite-only guard (placeholder) =====
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

// ===== DOM refs =====
const app = document.getElementById('app');
const crumbs = document.getElementById('breadcrumbs');
const versionEl = document.getElementById('version');
const todayEl = document.getElementById('today');
const clockEl = document.getElementById('clock');
const logoutBtn = document.getElementById('logout');
const bannerEl = document.getElementById('update-banner');
const bannerBtn = document.getElementById('update-refresh');

// ===== Layout vars (CSS custom properties) =====
function applyHeaderHeightVar(){ const el=document.querySelector('.app-header'); document.documentElement.style.setProperty('--header-h',(el?el.offsetHeight:0)+'px'); }
function applyCrumbsHeightVar(){ const el=document.querySelector('.breadcrumbs'); document.documentElement.style.setProperty('--crumbs-h',(el?el.offsetHeight:0)+'px'); }
function applyFooterHeightVar(){ const el=document.querySelector('.app-footer'); document.documentElement.style.setProperty('--footer-h',(el?el.offsetHeight:0)+'px'); }
function applyBannerHeightVar(){ const el=document.getElementById('update-banner'); const h=(el && !el.hidden)? el.offsetHeight:0; document.documentElement.style.setProperty('--banner-h',h+'px'); }

// Auto-update layout vars on load/resize/orientation
['load','resize','orientationchange'].forEach(function(evt){
  window.addEventListener(evt, function(){
    applyHeaderHeightVar();
    applyCrumbsHeightVar();
    applyFooterHeightVar();
    applyBannerHeightVar();
  });
});
// Run twice on load to catch font/safe-area settling
window.addEventListener('load', function(){
  applyHeaderHeightVar();
  setTimeout(applyHeaderHeightVar, 100);
});

// ===== Tiles & breadcrumbs =====
function tile(emoji,label,href){
  return `<a class="tile" href="${href}" aria-label="${label}">
    <span class="emoji">${emoji}</span><span class="label">${label}</span>
  </a>`;
}
function renderBreadcrumb(){ crumbs.innerHTML='<span>Home</span>'; }

// ===== Views: Home & generic section =====
function viewHome(){
  app.innerHTML = `
    <div class="grid">
      ${tile('🌽','Crop Production','#/crop')}
      ${tile('🔢','Calculator','#/calc')}
      ${tile('🛠️','Field Maintenance','#/crop/maintenance')}
      ${tile('🚜','Equipment','#/equipment')}
      ${tile('📦','Grain Tracking','#/grain')}
      ${tile('👥','Employees','#/employees')}
      ${tile('🤖','AI Reports','#/ai')}
      ${tile('⚙️','Settings','#/settings')}
      ${tile('💬','Feedback','#/feedback')}
    </div>
  `;
}
function viewSection(title, backHref, backLabel){
  app.innerHTML = `
    <section class="section">
      <h1>${title}</h1>
      <p>Coming soon.</p>
      <a class="btn" href="${backHref||'#/home'}">${backLabel||'Back to Dashboard'}</a>
    </section>
  `;
}

// ===== Settings → Crop Type =====
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
function isCropInUse(name){ return false; } // placeholder for future checks

function viewSettingsHome(){
  app.innerHTML = `
    <div class="grid">
      ${tile('🌱','Crop Type','#/settings/crops')}
    </div>
    <div class="section">
      <a class="btn" href="#/home">Back to Dashboard</a>
    </div>
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

// ===== Feedback =====
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
  app.innerHTML = `
    <section class="section">
      <h1>🛠️ Report Errors</h1>
      <div class="field"><input id="err-subj" type="text" placeholder="Subject *"></div>
      <div class="field"><textarea id="err-desc" rows="5" placeholder="What happened? *"></textarea></div>
      <div class="field"><input id="err-contact" type="text" placeholder="Phone or email (optional)"></div>
      <button id="err-submit" class="btn-primary">Submit</button> <a class="btn" href="#/feedback">Back to Feedback</a>
    </section>
  `;
  document.getElementById('err-submit')?.addEventListener('click', ()=>{
    const subject=String(document.getElementById('err-subj').value||'').trim();
    const details=String(document.getElementById('err-desc').value||'').trim();
    const contact=String(document.getElementById('err-contact').value||'').trim();
    if(!subject||!details){ alert('Please fill the required fields.'); return; }
    saveFeedback({type:'error',subject,details,contact,ts:Date.now()});
    alert('Thanks! Your error report was saved.'); location.hash='#/feedback';
  });
}
function viewFeedbackFeature(){
  app.innerHTML = `
    <section class="section">
      <h1>💡 New Feature Request</h1>
      <div class="field"><input id="feat-subj" type="text" placeholder="Feature title *"></div>
      <div class="field"><textarea id="feat-desc" rows="5" placeholder="Describe the idea *"></textarea></div>
      <div class="field"><input id="feat-contact" type="text" placeholder="Phone or email (optional)"></div>
      <button id="feat-submit" class="btn-primary">Submit</button> <a class="btn" href="#/feedback">Back to Feedback</a>
    </section>
  `;
  document.getElementById('feat-submit')?.addEventListener('click', ()=>{
    const subject=String(document.getElementById('feat-subj').value||'').trim();
    const details=String(document.getElementById('feat-desc').value||'').trim();
    const contact=String(document.getElementById('feat-contact').value||'').trim();
    if(!subject||!details){ alert('Please fill the required fields.'); return; }
    saveFeedback({type:'feature',subject,details,contact,ts:Date.now()});
    alert('Thanks! Your feature request was saved.'); location.hash='#/feedback';
  });
}

// ===== AI Reports hub + placeholders =====
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

// ===== Router =====
function route(){
  const hash = location.hash || '#/home';
  renderBreadcrumb();

  if (hash==='#/home'||hash==='') viewHome();
  else if (hash==='#/crop') viewSection('Crop Production','#/home');
  else if (hash==='#/crop/maintenance') viewSection('Maintenance (Crop)','#/home');
  else if (hash==='#/calc') viewSection('Calculator','#/home');
  else if (hash==='#/equipment') viewSection('Equipment','#/home');
  else if (hash==='#/grain') viewSection('Grain Tracking','#/home');
  else if (hash==='#/employees') viewSection('Employees','#/home');
  else if (hash==='#/ai') viewReportsHub();
  else if (hash==='#/ai/premade') viewReportsPremade();
  else if (hash==='#/ai/ai') viewReportsAI();
  else if (hash==='#/ai/yield') viewReportsYield();
  else if (hash==='#/settings') viewSettingsHome();
  else if (hash==='#/settings/crops') viewSettingsCrops();
  else if (hash==='#/feedback') viewFeedbackHub();
  else if (hash==='#/feedback/errors') viewFeedbackErrors();
  else if (hash==='#/feedback/feature') viewFeedbackFeature();
  else viewSection('Not Found','#/home');

  app?.focus?.();
  // ensure offsets reflect current sizes
  applyHeaderHeightVar(); applyCrumbsHeightVar(); applyFooterHeightVar(); applyBannerHeightVar();
}
window.addEventListener('hashchange', route);
window.addEventListener('load', route);

// ===== Header/Footer text =====
versionEl && (versionEl.textContent = displayVersion(APP_VERSION));
todayEl && (todayEl.textContent = prettyDate(new Date()));
function tick(){ clockEl && (clockEl.textContent = formatClock12(new Date())); }
tick(); setInterval(tick, 15000);

// ===== Logout =====
logoutBtn?.addEventListener('click', ()=>{
  try{ localStorage.removeItem('df_auth'); localStorage.removeItem('df_user'); }catch{}
  location.replace('login.html');
});

// ===== Update banner logic (stable) =====
function showUpdateBanner(){ if (bannerEl){ bannerEl.hidden=false; applyBannerHeightVar(); } }
function hideUpdateBanner(){ if (bannerEl){ bannerEl.hidden=true; applyBannerHeightVar(); } }
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

// One-shot suppression + login-page suppression
window.addEventListener('load', ()=>{
  try{
    const flag = sessionStorage.getItem('df_updating');
    if (flag==='1'){ sessionStorage.removeItem('df_updating'); markVersionAsCurrent(); hideUpdateBanner(); return; }
  }catch{}
  const here = (location.pathname.split('/').pop()||'').toLowerCase();
  if (here==='login.html'){ markVersionAsCurrent(); hideUpdateBanner(); return; }

  if (navigator.serviceWorker && navigator.serviceWorker.controller){
    markVersionAsCurrent(); hideUpdateBanner();
  } else {
    syncBannerWithVersion();
  }
});

// ===== SW registration =====
if ('serviceWorker' in navigator){
  window.addEventListener('load', async ()=>{
    try{
      const reg = await navigator.serviceWorker.register('service-worker.js');
      reg.update();
      document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='visible') reg.update(); });

      const here = (location.pathname.split('/').pop()||'').toLowerCase();
      if (reg.waiting && here!=='login.html'){ window.__waitingSW = reg.waiting; if (needsUpdate()) showUpdateBanner(); }

      reg.addEventListener('updatefound', ()=>{
        const sw = reg.installing; if(!sw) return;
        sw.addEventListener('statechange', ()=>{
          if (sw.state==='installed' && navigator.serviceWorker.controller){
            window.__waitingSW = reg.waiting || sw;
            const here2 = (location.pathname.split('/').pop()||'').toLowerCase();
            if(here2!=='login.html' && needsUpdate()) showUpdateBanner();
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