// ===== Version in footer =====
const APP_VERSION = 'v9.1';

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

// ===== DOM refs =====
const app = document.getElementById('app');
const crumbs = document.getElementById('breadcrumbs');
const versionEl = document.getElementById('version');
const todayEl = document.getElementById('today');
const clockEl = document.getElementById('clock');

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
  // kick once more after layout settles (fonts/safe-area)
  requestAnimationFrame(measureBars);
}
['load','resize','orientationchange'].forEach(evt=>window.addEventListener(evt, refreshLayout));

// ===== Tiles & views =====
function tile(emoji,label,href){
  return `<a class="tile" href="${href}" aria-label="${label}">
    <span class="emoji">${emoji}</span>
    <span class="label">${label}</span>
  </a>`;
}

const LABELS = {
  '#/home': 'Home',
  '#/crop': 'Crop Production',
  '#/crop/maintenance': 'Maintenance (Crop)',
  '#/calc': 'Calculator',
  '#/equipment': 'Equipment',
  '#/grain': 'Grain Tracking',
  '#/employees': 'Employees',
  '#/ai': 'AI Reports',
  '#/settings': 'Settings',
  '#/feedback': 'Feedback'
};

// Breadcrumb generator: Home > Section > Sub-page
function renderBreadcrumb(){
  const hash = location.hash || '#/home';
  if (hash === '#/home' || hash === '') {
    crumbs.innerHTML = `<span aria-current="page">Home</span>`;
    return;
  }
  const parts = hash.split('/').filter(Boolean); // ["#", "crop", "maintenance"] -> ["#","crop","maintenance"]
  let trail = [`<a href="#/home">Home</a>`];
  let cur = '#';
  for (let i=1;i<parts.length;i++){
    cur += '/' + parts[i];
    const label = LABELS[cur] || parts[i].replace(/-/g,' ').replace(/\b\w/g, s=>s.toUpperCase());
    if (i < parts.length-1) {
      trail.push(`<a href="${cur}">${label}</a>`);
    } else {
      trail.push(`<span aria-current="page">${label}</span>`);
    }
  }
  crumbs.innerHTML = trail.join(' &nbsp;&gt;&nbsp; ');
}

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

// ===== Router =====
function route(){
  const hash = location.hash || '#/home';
  renderBreadcrumb();

  if (hash === '#/home' || hash === '') viewHome();
  else if (hash === '#/crop') viewSection('Crop Production');
  else if (hash === '#/crop/maintenance') viewSection('Maintenance (Crop)', '#/crop', 'Back to Crop Production');
  else if (hash === '#/calc') viewSection('Calculator');
  else if (hash === '#/equipment') viewSection('Equipment');
  else if (hash === '#/grain') viewSection('Grain Tracking');
  else if (hash === '#/employees') viewSection('Employees');
  else if (hash === '#/ai') viewSection('AI Reports');
  else if (hash === '#/settings') viewSection('Settings');
  else if (hash === '#/feedback') viewSection('Feedback');
  else viewSection('Not Found');

  // Start each view at the top and re-measure layout
  try { window.scrollTo(0,0); } catch {}
  app?.focus?.();
  refreshLayout();
}
window.addEventListener('hashchange', route);
window.addEventListener('load', route);
window.addEventListener('pageshow', route);

// ===== Footer text + clock =====
if (versionEl) versionEl.textContent = normalizeVersion(APP_VERSION);
if (todayEl) todayEl.textContent = prettyDate(new Date());
function tick(){ if (clockEl) clockEl.textContent = formatClock12(new Date()); }
tick(); setInterval(tick, 15000);

// ===== Robust Logout (works after any re-render) =====
document.addEventListener('click', (e)=>{
  const btn = e.target.closest('#logout');
  if (!btn) return;
  e.preventDefault();
  try {
    localStorage.removeItem('df_auth');
    localStorage.removeItem('df_user');
  } catch {}
  window.location.replace('login.html');
});

// ===== Service Worker (optional; UI unaffected) =====
if ('serviceWorker' in navigator){
  window.addEventListener('load', async ()=>{
    try { await navigator.serviceWorker.register('service-worker.js'); } catch(e){ console.error(e); }
  });
}