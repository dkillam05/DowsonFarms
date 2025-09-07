// ===== App constants =====
const APP_VERSION = 'v1.0.0';
const ROUTES = {
  '': 'home',
  '#/home': 'home',
  '#/crop': 'Crop Production',
  '#/calculator': 'Calculator',
  '#/field': 'Field Maintenance',
  '#/equipment': 'Equipment',
  '#/grain': 'Grain Tracking',
  '#/employees': 'Employees',
  '#/ai': 'AI Reports',
  '#/settings': 'Settings',
  '#/feedback': 'Feedback',
};

// ===== Utilities =====
function pad2(n){ return n<10 ? '0'+n : ''+n; }

function formatClock12(d=new Date()){
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h>=12 ? 'PM':'AM';
  h = h%12 || 12;
  return `${h}:${pad2(m)} ${ampm}`;
}

function ordinal(n){
  const s=["th","st","nd","rd"], v=n%100;
  return n + (s[(v-20)%10] || s[v] || s[0]);
}
function prettyDate(d=new Date()){
  const dow = d.toLocaleString(undefined,{ weekday:'long' });
  const month = d.toLocaleString(undefined,{ month:'long' });
  return `${dow} ${month} ${ordinal(d.getDate())} ${d.getFullYear()}`;
}

// ===== Rendering =====
const app = document.getElementById('app');
const crumbs = document.getElementById('breadcrumbs');

function renderBreadcrumb(routeName){
  if(routeName==='home'){
    crumbs.innerHTML = `<span>Home</span>`;
    return;
  }
  crumbs.innerHTML = `<a href="#/home">Home</a> &nbsp;&gt;&nbsp; <span>${routeName}</span>`;
}

function viewHome(){
  app.innerHTML = `
    <div class="grid" role="list">
      ${tile('🌽','Crop Production','#/crop')}
      ${tile('🔢','Calculator','#/calculator')}
      ${tile('🛠️','Field Maintenance','#/field')}
      ${tile('🚜','Equipment','#/equipment')}
      ${tile('📦','Grain Tracking','#/grain')}
      ${tile('👥','Employees','#/employees')}
      ${tile('🤖','AI Reports','#/ai')}
      ${tile('⚙️','Settings','#/settings')}
      ${tile('💬','Feedback','#/feedback')}
    </div>
  `;
}
function tile(emoji,label,href){
  return `
    <a class="tile" role="listitem" href="${href}" aria-label="${label}">
      <span class="emoji">${emoji}</span>
      <span class="label">${label}</span>
    </a>
  `;
}

function viewSection(title){
  app.innerHTML = `
    <section class="section">
      <h1>${title}</h1>
      <p>Coming soon.</p>
      <a class="btn" href="#/home">Back to Dashboard</a>
    </section>
  `;
}

// ===== Router =====
function route(){
  const hash = location.hash || '#/home';
  const name = ROUTES[hash] || 'Not Found';
  renderBreadcrumb(name==='home' ? 'home' : name);

  if(name==='home') viewHome();
  else if(name==='Not Found') {
    viewSection('Not Found');
  } else {
    viewSection(name);
  }
  // move focus for a11y
  app.focus();
}
window.addEventListener('hashchange', route);
window.addEventListener('load', route);

// ===== Header clock & footer date/version =====
document.getElementById('version').textContent = APP_VERSION;
document.getElementById('today').textContent = prettyDate();

function tick(){
  document.getElementById('clock').textContent = formatClock12(new Date());
}
tick();
setInterval(tick, 1000 * 15); // update every 15s is plenty

// ===== Logout placeholder =====
document.getElementById('logout').addEventListener('click', () => {
  // Later: route to /login once we enable auth
  alert('Logged out (placeholder).');
});

// ===== Register Service Worker =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('service-worker.js', { scope: './' });
      // Optional: listen for updates and prompt refresh
      if (reg.waiting) reg.waiting.postMessage({ type:'SKIP_WAITING' });
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        if (sw) {
          sw.addEventListener('statechange', () => {
            if (sw.state === 'installed' && navigator.serviceWorker.controller) {
              // Auto activate new SW
              sw.postMessage({ type:'SKIP_WAITING' });
            }
          });
        }
      });
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // New SW took control; reload to get fresh files
        location.reload();
      });
    } catch (e) {
      console.error('SW registration failed', e);
    }
  });
}
function applyHeaderHeightVar() {
  const header = document.querySelector('.app-header');
  if (!header) return;
  const h = header.offsetHeight;
  document.documentElement.style.setProperty('--header-h', h + 'px');
}

window.addEventListener('load', applyHeaderHeightVar);
window.addEventListener('resize', applyHeaderHeightVar);
window.addEventListener('orientationchange', applyHeaderHeightVar);
window.addEventListener('hashchange', applyHeaderHeightVar);
}
