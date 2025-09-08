// ===== Version (footer) =====
const APP_VERSION = 'v9.0';

// ===== Auth (simple invite-only placeholder) =====
function isAuthed(){ try { return localStorage.getItem('df_auth') === '1'; } catch { return false; } }
(function enforceAuth(){
  const here = (location.pathname.split('/').pop() || '').toLowerCase();
  if (!isAuthed() && here !== 'login.html') window.location.replace('login.html');
})();

// ===== Utilities =====
function pad2(n){ return n<10 ? '0'+n : ''+n; }
function formatClock12(d){ let h=d.getHours(), m=d.getMinutes(), ap=h>=12?'PM':'AM'; h=h%12||12; return `${h}:${pad2(m)} ${ap}`; }
function ordinal(n){ const s=['th','st','nd','rd'], v=n%100; return n+(s[(v-20)%10]||s[v]||s[0]); }
function prettyDate(d){ const dow=d.toLocaleString(undefined,{weekday:'long'}); const mo=d.toLocaleString(undefined,{month:'long'}); return `${dow} ${mo} ${ordinal(d.getDate())} ${d.getFullYear()}`; }
function normalizeVersion(v){ const m=String(v||'').replace(/^v/i,''); const [a='0',b='0']=m.split('.'); return `v${a}.${b}`; }

// ===== DOM refs =====
const app = document.getElementById('app');
const crumbs = document.getElementById('breadcrumbs');
const versionEl = document.getElementById('version');
const todayEl = document.getElementById('today');
const clockEl = document.getElementById('clock');
const logoutBtn = document.getElementById('logout');

// ===== Simple tiles + views =====
function tile(emoji,label,href){
  return `<a class="tile" href="${href}" aria-label="${label}">
    <span class="emoji">${emoji}</span>
    <span class="label">${label}</span>
  </a>`;
}
function renderBreadcrumb(){ crumbs.innerHTML = '<span>Home</span>'; }

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
function viewSection(title, backHref = '#/home', backLabel = 'Back to Dashboard'){
  app.innerHTML = `
    <section class="section">
      <h1>${title}</h1>
      <p>Coming soon.</p>
      <a class="btn" href="${backHref}">${backLabel}</a>
    </section>
  `;
}

// ===== Router (minimal) =====
function route(){
  const hash = location.hash || '#/home';
  renderBreadcrumb();

  if (hash==='#/home' || hash==='') viewHome();
  else if (hash==='#/crop') viewSection('Crop Production');
  else if (hash==='#/crop/maintenance') viewSection('Maintenance (Crop)');
  else if (hash==='#/calc') viewSection('Calculator');
  else if (hash==='#/equipment') viewSection('Equipment');
  else if (hash==='#/grain') viewSection('Grain Tracking');
  else if (hash==='#/employees') viewSection('Employees');
  else if (hash==='#/ai') viewSection('AI Reports');
  else if (hash==='#/settings') viewSection('Settings');
  else if (hash==='#/feedback') viewSection('Feedback');
  else viewSection('Not Found');

  // Start each view at the top
  try { window.scrollTo(0,0); } catch {}
  app?.focus?.();
}
window.addEventListener('hashchange', route);
window.addEventListener('load', route);

// ===== Footer content + clock =====
if (versionEl) versionEl.textContent = normalizeVersion(APP_VERSION);
if (todayEl) todayEl.textContent = prettyDate(new Date());
function tick(){ if (clockEl) clockEl.textContent = formatClock12(new Date()); }
tick(); setInterval(tick, 15000);

// ===== Logout =====
logoutBtn?.addEventListener('click', ()=>{
  try { localStorage.removeItem('df_auth'); localStorage.removeItem('df_user'); } catch {}
  location.replace('login.html');
});

// ===== Register SW (optional but recommended) =====
if ('serviceWorker' in navigator){
  window.addEventListener('load', async ()=>{
    try { await navigator.serviceWorker.register('service-worker.js'); } catch(e){ console.error(e); }
  });
}