// ===== App constants =====
const APP_VERSION = 'v6.11'; // shows as vMAJOR.MINOR in footer

// ===== Auth guard (client-side placeholder for invite-only) =====
function isAuthed(){ try { return localStorage.getItem('df_auth') === '1'; } catch { return false; } }
(function enforceAuth(){
  var here = (location.pathname.split('/').pop() || '').toLowerCase();
  if (!isAuthed() && here !== 'login.html') {
    // If you don't want auth right now, comment out the next line:
    // window.location.replace('login.html');
  }
})();

// ===== Theme (light / dark / auto) =====
var THEME_KEY = 'df_theme';
function saveTheme(theme){ try { localStorage.setItem(THEME_KEY, theme); } catch {} }
function loadTheme(){ try { return localStorage.getItem(THEME_KEY) || 'auto'; } catch { return 'auto'; } }
function applyTheme(theme){
  var t = theme || loadTheme() || 'auto';
  document.documentElement.setAttribute('data-theme', t);
}
applyTheme(); // apply ASAP

// ===== Routes =====
const ROUTES = {
  '': 'home',
  '#/home': 'home',

  // Crop Production
  '#/crop': 'Crop Production',
  '#/crop/planting': 'Planting',
  '#/crop/spraying': 'Spraying',
  '#/crop/aerial': 'Aerial',
  '#/crop/harvest': 'Harvest',
  '#/crop/maintenance': 'Maintenance',
  '#/crop/scouting': 'Scouting',
  '#/crop/trials': 'Trials',

  // Equipment
  '#/equipment': 'Equipment',
  '#/equipment/receivers': 'Receivers & Tech',
  '#/equipment/tractors': 'Tractors',
  '#/equipment/combines': 'Combines',
  '#/equipment/sprayer': 'Sprayer / Fertilizer Spreader',
  '#/equipment/construction': 'Construction Equipment',
  '#/equipment/trucks-trailers': 'Trucks & Trailers',
  '#/equipment/implements': 'Implements',
  '#/equipment/shop': 'Shop',
  '#/equipment/barcodes': 'Barcode / QR Codes',

  // Feedback
  '#/feedback': 'Feedback',
  '#/feedback/errors': 'Report Errors',
  '#/feedback/feature': 'Feature Request',

  // Team & Partners
  '#/team': 'Team & Partners',
  '#/team/employees': 'Employees',
  '#/team/subcontractors': 'Subcontractors',
  '#/team/vendors': 'Vendors',
  '#/team/dir': 'Directory',

  // Settings
  '#/settings': 'Settings',
  '#/settings/crops': 'Crop Type',
  '#/settings/theme': 'Theme',

  // AI Reports (hub + 3)
  '#/ai': 'AI Reports',
  '#/ai/premade': 'Pre-made Reports',
  '#/ai/ai': 'AI Reports',
  '#/ai/yield': 'Yield Report',
};

// ===== Utilities =====
function pad2(n){ return n<10 ? '0'+n : ''+n; }
function formatClock12(d){
  var h = d.getHours(), m = d.getMinutes(), ampm = h>=12 ? 'PM':'AM';
  h = h%12 || 12; return h + ':' + pad2(m) + ' ' + ampm;
}
function ordinal(n){ var s=["th","st","nd","rd"], v=n%100; return n + (s[(v-20)%10] || s[v] || s[0]); }
function prettyDate(d){
  var dow = d.toLocaleString(undefined,{ weekday:'long' });
  var month = d.toLocaleString(undefined,{ month:'long' });
  return dow + ' ' + month + ' ' + ordinal(d.getDate()) + ' ' + d.getFullYear();
}
function normalizeVersion(v){
  var m = String(v || '').trim().replace(/^v/i,'');
  var parts = m.split('.');
  return (parts[0]||'0') + '.' + (parts[1]||'0');
}
function displayVersion(v){ return 'v' + normalizeVersion(v); }
function uid(){ return Math.random().toString(36).slice(2) + Date.now().toString(36); }
function capFirst(s){
  s = String(s||'').trim();
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
function looksLikeEmail(e){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e||'').trim()); }
function cleanPhone(p){ return String(p||'').replace(/[^\d]/g,''); }
function formatPhone(digits){
  var d = cleanPhone(digits);
  if (d.length === 10) return '('+d.slice(0,3)+') '+d.slice(3,6)+'-'+d.slice(6);
  return d;
}

// ===== DOM refs =====
var app = document.getElementById('app');
var crumbs = document.getElementById('breadcrumbs');
var versionEl = document.getElementById('version');
var todayEl = document.getElementById('today');
var clockEl = document.getElementById('clock');
var logoutBtn = document.getElementById('logout');
var bannerEl = document.getElementById('update-banner');
var bannerBtn = document.getElementById('update-refresh');

// ===== Layout helpers =====
function applyHeaderHeightVar() {
  var header = document.querySelector('.app-header');
  var h = header ? header.offsetHeight : 0;
  document.documentElement.style.setProperty('--header-h', h + 'px');
}
function applyCrumbsHeightVar() {
  var bc = document.querySelector('.breadcrumbs');
  var h = bc ? bc.offsetHeight : 0;
  document.documentElement.style.setProperty('--crumbs-h', h + 'px');
}
function applyFooterHeightVar() {
  var footer = document.querySelector('.app-footer');
  var h = footer ? footer.offsetHeight : 0;
  document.documentElement.style.setProperty('--footer-h', h + 'px');
}
function applyBannerHeightVar() {
  var b = document.getElementById('update-banner');
  var h = (b && !b.hasAttribute('hidden')) ? b.offsetHeight : 0;
  document.documentElement.style.setProperty('--banner-h', h + 'px');
}

// ===== Rendering helpers =====
function tile(emoji,label,href){
  return (
    '<a class="tile" role="listitem" href="'+href+'" aria-label="'+label+'">' +
      '<span class="emoji">'+emoji+'</span>' +
      '<span class="label">'+label+'</span>' +
    '</a>'
  );
}

function renderBreadcrumb(){
  var hash = location.hash || '#/home';

  // Settings
  if (hash === '#/settings') {
    crumbs.innerHTML = '<a href="#/home">Home</a> &nbsp;&gt;&nbsp; <span>Settings</span>';
    return;
  }
  if (hash.indexOf('#/settings/crops')===0) {
    crumbs.innerHTML = '<a href="#/home">Home</a> &nbsp;&gt;&nbsp; <a href="#/settings">Settings</a> &nbsp;&gt;&nbsp; <span>Crop Type</span>';
    return;
  }
  if (hash.indexOf('#/settings/theme')===0) {
    crumbs.innerHTML = '<a href="#/home">Home</a> &nbsp;&gt;&nbsp; <a href="#/settings">Settings</a> &nbsp;&gt;&nbsp; <span>Theme</span>';
    return;
  }

  // Crop Production
  var cropKids = ['#/crop/planting','#/crop/spraying','#/crop/aerial','#/crop/harvest','#/crop/maintenance','#/crop/scouting','#/crop/trials'];
  if (hash === '#/crop') { crumbs.innerHTML = '<a href="#/home">Home</a> &nbsp;&gt;&nbsp; <span>Crop Production</span>'; return; }
  if (cropKids.indexOf(hash)!==-1) {
    crumbs.innerHTML = '<a href="#/home">Home</a> &nbsp;&gt;&nbsp; <a href="#/crop">Crop Production</a> &nbsp;&gt;&nbsp; <span>'+(ROUTES[hash]||'Section')+'</span>';
    return;
  }

  // Equipment
  var eqKids = ['#/equipment/receivers','#/equipment/tractors','#/equipment/combines','#/equipment/sprayer','#/equipment/construction','#/equipment/trucks-trailers','#/equipment/implements','#/equipment/shop','#/equipment/barcodes'];
  if (hash === '#/equipment') { crumbs.innerHTML = '<a href="#/home">Home</a> &nbsp;&gt;&nbsp; <span>Equipment</span>'; return; }
  if (eqKids.indexOf(hash)!==-1) {
    crumbs.innerHTML = '<a href="#/home">Home</a> &nbsp;&gt;&nbsp; <a href="#/equipment">Equipment</a> &nbsp;&gt;&nbsp; <span>'+(ROUTES[hash]||'Section')+'</span>';
    return;
  }

  // Feedback
  var fbKids = ['#/feedback/errors','#/feedback/feature'];
  if (hash === '#/feedback') { crumbs.innerHTML = '<a href="#/home">Home</a> &nbsp;&gt;&nbsp; <span>Feedback</span>'; return; }
  if (fbKids.indexOf(hash)!==-1) {
    crumbs.innerHTML = '<a href="#/home">Home</a> &nbsp;&gt;&nbsp; <a href="#/feedback">Feedback</a> &nbsp;&gt;&nbsp; <span>'+(ROUTES[hash]||'')+'</span>';
    return;
  }

  // Team & Partners
  var teamKids = ['#/team/employees','#/team/subcontractors','#/team/vendors','#/team/dir'];
  if (hash === '#/team') { crumbs.innerHTML = '<a href="#/home">Home</a> &nbsp;&gt;&nbsp; <span>Team & Partners</span>'; return; }
  if (teamKids.indexOf(hash)!==-1) {
    var labels = { '#/team/employees':'Employees', '#/team/subcontractors':'Subcontractors', '#/team/vendors':'Vendors', '#/team/dir':'Directory' };
    crumbs.innerHTML = '<a href="#/home">Home</a> &nbsp;&gt;&nbsp; <a href="#/team">Team & Partners</a> &nbsp;&gt;&nbsp; <span>'+(labels[hash]||'Section')+'</span>';
    return;
  }

  // AI Reports
  var aiKids = ['#/ai/premade','#/ai/ai','#/ai/yield'];
  if (hash === '#/ai') { crumbs.innerHTML = '<a href="#/home">Home</a> &nbsp;&gt;&nbsp; <span>AI Reports</span>'; return; }
  if (aiKids.indexOf(hash)!==-1) {
    crumbs.innerHTML = '<a href="#/home">Home</a> &nbsp;&gt;&nbsp; <a href="#/ai">AI Reports</a> &nbsp;&gt;&nbsp; <span>'+(ROUTES[hash]||'Section')+'</span>';
    return;
  }

  // Home or generic
  if (hash === '#/home' || hash === '') { crumbs.innerHTML = '<span>Home</span>'; return; }
  var name = ROUTES[hash] || 'Section';
  crumbs.innerHTML = '<a href="#/home">Home</a> &nbsp;&gt;&nbsp; <span>'+name+'</span>';
}

// ===== Home & Hubs =====
function viewHome(){
  app.innerHTML =
    '<div class="grid" role="list">'+
      tile('🌽','Crop Production','#/crop')+
      tile('🔢','Calculator','#/calculator')+
      tile('🛠️','Field Maintenance','#/field')+
      tile('🚜','Equipment','#/equipment')+
      tile('📦','Grain Tracking','#/grain')+
      tile('🤝','Team & Partners','#/team')+
      tile('🤖','AI Reports','#/ai')+
      tile('⚙️','Settings','#/settings')+
      tile('💬','Feedback','#/feedback')+
    '</div>';
}
function viewCropHub(){
  app.innerHTML =
    '<div class="grid">'+
      tile('🌱','Planting','#/crop/planting')+
      tile('🧪','Spraying','#/crop/spraying')+
      tile('🚁','Aerial','#/crop/aerial')+
      tile('🌾','Harvest','#/crop/harvest')+
      tile('🧰','Maintenance','#/crop/maintenance')+
      tile('🔎','Scouting','#/crop/scouting')+
      tile('🧬','Trials','#/crop/trials')+
    '</div>'+
    '<div class="settings-actions"><a class="btn" href="#/home">Back to Dashboard</a></div>';
}
function viewEquipmentHub(){
  app.innerHTML =
    '<div class="grid">'+
      tile('📡','Receivers & Tech','#/equipment/receivers')+
      tile('🚜','Tractors','#/equipment/tractors')+
      tile('🌾','Combines','#/equipment/combines')+
      tile('💦','Sprayer / Fertilizer Spreader','#/equipment/sprayer')+
      tile('🏗️','Construction Equipment','#/equipment/construction')+
      tile('🚚','Trucks & Trailers','#/equipment/trucks-trailers')+
      tile('⚙️','Implements','#/equipment/implements')+
      tile('🛠️','Shop','#/equipment/shop')+
      tile('🔖','Barcode / QR Codes','#/equipment/barcodes')+
    '</div>'+
    '<div class="settings-actions"><a class="btn" href="#/home">Back to Dashboard</a></div>';
}
function viewTeamHub(){
  app.innerHTML =
    '<div class="grid">'+
      tile('👷','Employees','#/team/employees')+
      tile('🛠️','Subcontractors','#/team/subcontractors')+
      tile('🏪','Vendors','#/team/vendors')+
      tile('📇','Directory','#/team/dir')+
    '</div>'+
    '<div class="settings-actions"><a class="btn" href="#/home">Back to Dashboard</a></div>';
}
function viewFeedbackHub(){
  app.innerHTML =
    '<div class="grid">'+
      tile('🛠️','Report Errors','#/feedback/errors')+
      tile('💡','New Feature Request','#/feedback/feature')+
    '</div>'+
    '<div class="settings-actions"><a class="btn" href="#/home">Back to Dashboard</a></div>';
}

// ===== AI Reports hub + pages =====
function viewReportsHub(){
  app.innerHTML =
    '<div class="grid">'+
      tile('📄','Pre-made Reports','#/ai/premade')+
      tile('🤖','AI Reports','#/ai/ai')+
      tile('📊','Yield Report','#/ai/yield')+
    '</div>'+
    '<section class="section" style="margin-top:12px;">'+
      '<h2>🔮 Future</h2>'+
      '<p class="muted">ChatGPT integration to generate & save custom reports is planned.</p>'+
    '</section>'+
    '<div class="settings-actions"><a class="btn" href="#/home">Back to Dashboard</a></div>';
}
function viewReportsPremade(){
  app.innerHTML =
    '<section class="section">'+
      '<h1>📄 Pre-made Reports</h1>'+
      '<p>Placeholder for a library of standard, ready-to-run reports (PDF/CSV) like equipment logs, grain summaries, and seasonal checklists.</p>'+
      '<div class="settings-actions"><a class="btn" href="#/ai">Back to AI Reports</a><a class="btn" href="#/home">Back to Dashboard</a></div>'+
    '</section>';
}
function viewReportsAI(){
  app.innerHTML =
    '<section class="section">'+
      '<h1>🤖 AI Reports</h1>'+
      '<p>Placeholder for AI-assisted custom reports. Future: prompt-based report builder, saved templates, branded PDF export.</p>'+
      '<div class="settings-actions"><a class="btn" href="#/ai">Back to AI Reports</a><a class="btn" href="#/home">Back to Dashboard</a></div>'+
    '</section>';
}
function viewReportsYield(){
  app.innerHTML =
    '<section class="section">'+
      '<h1>📊 Yield Report</h1>'+
      '<p>Placeholder for field/variety yield summaries. Future: filters by crop, field, hybrid, date; charts and export.</p>'+
      '<div class="settings-actions"><a class="btn" href="#/ai">Back to AI Reports</a><a class="btn" href="#/home">Back to Dashboard</a></div>'+
    '</section>';
}

// ===== Feedback pages =====
function saveFeedback(entry){
  try {
    var key = 'df_feedback';
    var list = JSON.parse(localStorage.getItem(key) || '[]');
    list.push(entry);
    localStorage.setItem(key, JSON.stringify(list));
  } catch {}
}
function viewFeedbackErrors(){
  app.innerHTML =
    '<section class="section">'+
      '<h1>🛠️ Report Errors</h1>'+
      '<div class="field"><label for="err-subj">Subject *</label><input id="err-subj" type="text" placeholder="e.g., Crash when opening Equipment"></div>'+
      '<div class="field"><label for="err-desc">What happened? *</label><textarea id="err-desc" rows="5" placeholder="Steps to reproduce, expected vs actual, screenshots…"></textarea></div>'+
      '<div class="field"><label for="err-contact">Contact</label><input id="err-contact" type="text" placeholder="Phone or email (optional)"></div>'+
      '<button id="err-submit" class="btn-primary">Submit</button> '+
      '<a class="btn" href="#/feedback">Back to Feedback</a>'+
    '</section>';

  (function(){
    var btn = document.getElementById('err-submit'); if (!btn) return;
    btn.addEventListener('click', function(){
      var subject = String(document.getElementById('err-subj').value||'').trim();
      var details = String(document.getElementById('err-desc').value||'').trim();
      var contact = String(document.getElementById('err-contact').value||'').trim();
      if (!subject || !details) { alert('Please fill the required fields.'); return; }
      if (contact) {
        var isEmail = looksLikeEmail(contact);
        var isPhone = cleanPhone(contact).length === 10;
        if (!isEmail && !isPhone) { alert('Contact must be a valid email or 10-digit phone.'); return; }
      }
      saveFeedback({ type:'error', subject:subject, details:details, contact:contact, ts:Date.now() });
      alert('Thanks! Your error report was saved.');
      location.hash = '#/feedback';
    });
  })();
}
function viewFeedbackFeature(){
  app.innerHTML =
    '<section class="section">'+
      '<h1>💡 New Feature Request</h1>'+
      '<div class="field"><label for="feat-subj">Feature title *</label><input id="feat-subj" type="text" placeholder="e.g., Barcode printing from Equipment"></div>'+
      '<div class="field"><label for="feat-desc">Describe the idea *</label><textarea id="feat-desc" rows="5" placeholder="What it should do, where it would live, examples…"></textarea></div>'+
      '<div class="field"><label for="feat-contact">Contact</label><input id="feat-contact" type="text" placeholder="Phone or email (optional)"></div>'+
      '<button id="feat-submit" class="btn-primary">Submit</button> '+
      '<a class="btn" href="#/feedback">Back to Feedback</a>'+
    '</section>';

  (function(){
    var btn = document.getElementById('feat-submit'); if (!btn) return;
    btn.addEventListener('click', function(){
      var subject = String(document.getElementById('feat-subj').value||'').trim();
      var details = String(document.getElementById('feat-desc').value||'').trim();
      var contact = String(document.getElementById('feat-contact').value||'').trim();
      if (!subject || !details) { alert('Please fill the required fields.'); return; }
      if (contact) {
        var isEmail = looksLikeEmail(contact);
        var isPhone = cleanPhone(contact).length === 10;
        if (!isEmail && !isPhone) { alert('Contact must be a valid email or 10-digit phone.'); return; }
      }
      saveFeedback({ type:'feature', subject:subject, details:details, contact:contact, ts:Date.now() });
      alert('Thanks! Your feature request was saved.');
      location.hash = '#/feedback';
    });
  })();
}

// ===== Team & Partners: storage + forms + directory =====
var PEOPLE_KEY = 'df_people';
function loadPeople(){ try { return JSON.parse(localStorage.getItem(PEOPLE_KEY) || '[]'); } catch { return []; } }
function savePeople(list){ try { localStorage.setItem(PEOPLE_KEY, JSON.stringify(list)); } catch {} }

function viewTeamForm(kind){
  var icons = { employee:'👷', subcontractor:'🛠️', vendor:'🏪' };
  var titles = { employee:'Add Employee', subcontractor:'Add Subcontractor', vendor:'Add Vendor' };

  app.innerHTML =
    '<section class="section">'+
      '<h1>'+icons[kind]+' '+titles[kind]+'</h1>'+
      '<div class="field"><label for="p-first">First name *</label><input id="p-first" type="text" placeholder="John"></div>'+
      '<div class="field"><label for="p-last">Last name *</label><input id="p-last" type="text" placeholder="Doe"></div>'+
      '<div class="field"><label for="p-role">'+(kind==='vendor'?'Role / Contact Title':'Job role')+'</label><input id="p-role" type="text" placeholder="'+(kind==='vendor'?'Account Rep, Sales, Support…':'Operator, Mechanic, Agronomist…')+'"></div>'+
      '<div class="field"><label for="p-phone">Phone</label><input id="p-phone" type="tel" placeholder="(555) 123-4567"></div>'+
      '<div class="field"><label for="p-email">Email</label><input id="p-email" type="email" placeholder="name@example.com"></div>'+
      '<div class="field"><label for="p-start">'+(kind==='vendor'?'Since (date)':'Start date')+'</label><input id="p-start" type="date"></div>'+
      '<div class="field"><label for="p-bday">Birthday</label><input id="p-bday" type="date"></div>'+
      '<div class="field"><label for="p-notes">Notes</label><textarea id="p-notes" rows="4" placeholder="'+(kind==='vendor'?'Company name, account #, terms…':'Certifications, allergies, preferred equipment…')+'"></textarea></div>'+
      '<div class="field"><label for="p-access">Access / Role</label>'+
        '<select id="p-access">'+
          '<option value="">— None —</option>'+
          '<option value="Admin">Admin</option>'+
          '<option value="Manager">Manager</option>'+
          '<option value="Employee">Employee</option>'+
          '<option value="Guest">Guest</option>'+
        '</select>'+
      '</div>'+
      '<button id="p-save" class="btn-primary">Save</button> '+
      '<div class="settings-actions">'+
        '<a class="btn" href="#/team/dir">View Directory</a> '+
        '<a class="btn" href="#/team">Back to Team & Partners</a>'+
      '</div>'+
    '</section>';

  var first = document.getElementById('p-first');
  var last  = document.getElementById('p-last');
  if (first) first.addEventListener('blur', function(){ first.value = capFirst(first.value); });
  if (last)  last.addEventListener('blur',  function(){ last.value  = capFirst(last.value);  });

  (function(){
    var btn = document.getElementById('p-save'); if (!btn) return;
    btn.addEventListener('click', function(){
      var firstName = capFirst(document.getElementById('p-first').value);
      var lastName  = capFirst(document.getElementById('p-last').value);
      if (!firstName || !lastName) { alert('Please enter first and last name.'); return; }
      if (!/^[A-Z]/.test(firstName) || !/^[A-Z]/.test(lastName)) { alert('First and last names must start with a capital letter.'); return; }

      var role     = String(document.getElementById('p-role').value||'').trim();
      var phoneRaw = String(document.getElementById('p-phone').value||'');
      var email    = String(document.getElementById('p-email').value||'').trim();
      var start    = String(document.getElementById('p-start').value||'').trim();
      var bday     = String(document.getElementById('p-bday').value||'').trim();
      var notes    = String(document.getElementById('p-notes').value||'').trim();
      var access   = document.getElementById('p-access').value;

      var phoneDigits = cleanPhone(phoneRaw);
      if (phoneDigits && phoneDigits.length !== 10) { alert('Phone must be a valid 10-digit number.'); return; }
      if (email && !looksLikeEmail(email)) { alert('Please enter a valid email address.'); return; }

      var people = loadPeople();
      people.push({
        id: uid(),
        type: kind,
        firstName: firstName,
        lastName: lastName,
        role: role,
        phone: phoneDigits,
        email: email,
        startDate: start,
        birthday: bday,
        notes: notes,
        accessRole: access || ''
      });
      savePeople(people);
      alert('Saved.');
      location.hash = '#/team/dir';
    });
  })();
}

function viewTeamDirectory(){
  var people = loadPeople();
  var qs = location.hash.split('?')[1] || '';
  var filter = 'all';
  if (qs) {
    var params = new URLSearchParams(qs);
    filter = params.get('type') || 'all';
  }
  function pill(t, label, emoji){
    var active = (filter === t) ? ' style="border-color:#DAA520;color:#6f5200"' : '';
    var href = (t==='all') ? '#/team/dir' : '#/team/dir?type='+t;
    return '<a class="btn"'+active+' href="'+href+'">'+emoji+' '+label+'</a>';
  }
  var filtered = people.filter(function(p){ return filter==='all' ? true : p.type === filter; });

  var rows = filtered.map(function(p){
    var name = (p.firstName||'') + ' ' + (p.lastName||'');
    var badge = (p.type==='employee') ? '👷' : (p.type==='subcontractor' ? '🛠️' : '🏪');
    var lines = [];
    if (p.role) lines.push('Role: '+p.role);
    if (p.email) lines.push('Email: '+p.email);
    if (p.phone) lines.push('Phone: '+formatPhone(p.phone));
    if (p.startDate) lines.push('Since: '+p.startDate);
    if (p.birthday) lines.push('Birthday: '+p.birthday);
    if (p.accessRole) lines.push('Access: '+p.accessRole);
    if (p.notes) lines.push('Notes: '+p.notes);
    var details = lines.length ? lines.map(function(s){ return '<div class="small muted">'+s+'</div>'; }).join('') : '<span class="small muted">No details</span>';

    return (
      '<li class="crop-row">'+
        '<div class="crop-info"><span class="chip">'+badge+' '+(name.trim()||'(Unnamed)')+'</span></div>'+
        '<div class="crop-actions"></div>'+
        '<div style="flex-basis:100%; padding-left:8px; margin-top:6px;">'+details+'</div>'+
      '</li>'
    );
  }).join('');

  app.innerHTML =
    '<section class="section">'+
      '<h1>📇 Team & Partners — Directory</h1>'+
      '<div class="settings-actions" style="display:flex; gap:8px; flex-wrap:wrap;">'+
        pill('all','All','📇')+
        pill('employee','Employees','👷')+
        pill('subcontractor','Subcontractors','🛠️')+
        pill('vendor','Vendors','🏪')+
      '</div>'+
      '<ul class="crop-list" style="margin-top:10px;">'+(rows || '<li class="muted">No people yet.</li>')+'</ul>'+
      '<div class="settings-actions">'+
        '<a class="btn" href="#/team">Back to Team & Partners</a> '+
        '<a class="btn" href="#/home">Back to Dashboard</a>'+
      '</div>'+
    '</section>';
}

// ===== Settings: Crop Types + Theme =====
var CROPS_KEY = 'df_crops';
function migrateCropsShape(arr){
  if (!Array.isArray(arr)) return [];
  if (arr.length && typeof arr[0] === 'string') return arr.map(function(n){ return { name:n, archived:false }; });
  return arr.map(function(o){ return { name:String(o.name||'').trim(), archived:!!o.archived }; });
}
function loadCrops(){
  try {
    var raw = localStorage.getItem(CROPS_KEY);
    if (!raw) return [{name:'Corn', archived:false},{name:'Soybeans', archived:false}];
    var arr = JSON.parse(raw);
    var norm = migrateCropsShape(arr);
    return norm.length ? norm : [{name:'Corn', archived:false},{name:'Soybeans', archived:false}];
  } catch { return [{name:'Corn', archived:false},{name:'Soybeans', archived:false}]; }
}
function saveCrops(list){ try { localStorage.setItem(CROPS_KEY, JSON.stringify(list)); } catch {} }
function isCropInUse(name){ return false; } // placeholder to integrate later

function viewSettingsHome(){
  app.innerHTML =
    '<div class="grid settings-tabs" role="tablist" aria-label="Settings tabs">'+
      '<a class="tile" role="tab" href="#/settings/crops"><span class="emoji">🌱</span><span class="label">Crop Type</span></a>'+
      '<a class="tile" role="tab" href="#/settings/theme"><span class="emoji">🌓</span><span class="label">Theme</span></a>'+
    '</div>'+
    '<div class="settings-actions"><a class="btn" href="#/home">Back to Dashboard</a></div>';
}

function viewSettingsCrops(){
  var crops = loadCrops();
  var items = crops.map(function(o,i){
    var status = o.archived ? '<span class="chip chip-archived" title="Archived">Archived</span>' : '';
    var actions = o.archived
      ? '<button class="sm" data-unarchive="'+i+'">Unarchive</button> <button class="danger sm" data-delete="'+i+'">Delete</button>'
      : '<button class="warn sm" data-archive="'+i+'">Archive</button> <button class="danger sm" data-delete="'+i+'">Delete</button>';
    return (
      '<li class="crop-row '+(o.archived?'is-archived':'')+'">'+
        '<div class="crop-info"><span class="chip">'+o.name+'</span> '+status+'</div>'+
        '<div class="crop-actions">'+actions+'</div>'+
      '</li>'
    );
  }).join('');

  app.innerHTML =
    '<div class="grid settings-tabs" role="tablist" aria-label="Settings tabs">'+
      '<a class="tile tab-active" role="tab" href="#/settings/crops"><span class="emoji">🌱</span><span class="label">Crop Type</span></a>'+
      '<a class="tile" role="tab" href="#/settings/theme"><span class="emoji">🌓</span><span class="label">Theme</span></a>'+
    '</div>'+
    '<section class="section">'+
      '<h1>Crop Type</h1>'+
      '<p class="muted">Archive crops that are in use to preserve history. Delete only if unused.</p>'+
      '<ul class="crop-list">'+(items || '<li class="muted">No crops yet.</li>')+'</ul>'+
      '<div class="add-row" style="display:grid; grid-template-columns: 1fr auto; gap:8px; align-items:center; margin-top:10px;">'+
        '<input id="new-crop" type="text" placeholder="e.g., Wheat">'+
        '<button id="add-crop" class="btn-primary">➕ Add</button>'+
      '</div>'+
      '<a class="btn" href="#/settings">Back to Settings</a>'+
    '</section>';

  var addBtn = document.getElementById('add-crop');
  var input  = document.getElementById('new-crop');
  var listEl = app.querySelector('.crop-list');

  if (addBtn) addBtn.addEventListener('click', function(){
    var name = String(input.value||'').trim();
    if (!name) return;
    var cs = loadCrops();
    for (var i=0;i<cs.length;i++){ if (cs[i].name.toLowerCase() === name.toLowerCase()) { input.value=''; return; } }
    cs.push({ name:name, archived:false }); saveCrops(cs); viewSettingsCrops();
  });
  if (input) input.addEventListener('keydown', function(e){ if (e.key==='Enter'){ e.preventDefault(); if(addBtn) addBtn.click(); } });

  if (listEl) listEl.addEventListener('click', function(e){
    var btn = e.target.closest ? e.target.closest('button') : null;
    if (!btn) return;
    var cs = loadCrops();
    if (btn.hasAttribute('data-archive')) {
      var i = +btn.getAttribute('data-archive'); if (cs[i]) { cs[i].archived = true; saveCrops(cs); viewSettingsCrops(); }
    } else if (btn.hasAttribute('data-unarchive')) {
      var i2 = +btn.getAttribute('data-unarchive'); if (cs[i2]) { cs[i2].archived = false; saveCrops(cs); viewSettingsCrops(); }
    } else if (btn.hasAttribute('data-delete')) {
      var j = +btn.getAttribute('data-delete'); if (!cs[j]) return;
      var name = cs[j].name;
      if (isCropInUse(name)) { alert('“'+name+'” is used in your data. Archive instead.'); return; }
      if (!confirm('Delete “'+name+'”? This cannot be undone.')) return;
      cs.splice(j,1); saveCrops(cs); viewSettingsCrops();
    }
  });
}

function viewSettingsTheme(){
  var current = loadTheme();
  app.innerHTML =
    '<div class="grid settings-tabs" role="tablist" aria-label="Settings tabs">'+
      '<a class="tile" role="tab" href="#/settings/crops"><span class="emoji">🌱</span><span class="label">Crop Type</span></a>'+
      '<a class="tile tab-active" role="tab" href="#/settings/theme"><span class="emoji">🌓</span><span class="label">Theme</span></a>'+
    '</div>'+
    '<section class="section">'+
      '<h1>Theme</h1>'+
      '<div class="field">'+
        '<label style="font-weight:600; margin-bottom:6px;">Appearance</label>'+
        '<div>'+
          '<label style="display:flex;align-items:center;gap:8px;margin-bottom:6px;"><input type="radio" name="theme" value="auto" '+(current==='auto'?'checked':'')+'> Auto (follow device)</label>'+
          '<label style="display:flex;align-items:center;gap:8px;margin-bottom:6px;"><input type="radio" name="theme" value="light" '+(current==='light'?'checked':'')+'> Light</label>'+
          '<label style="display:flex;align-items:center;gap:8px;margin-bottom:6px;"><input type="radio" name="theme" value="dark" '+(current==='dark'?'checked':'')+'> Dark</label>'+
        '</div>'+
      '</div>'+
      '<div class="settings-actions"><a class="btn" href="#/settings">Back to Settings</a></div>'+
    '</section>';

  (function(){
    var radios = app.querySelectorAll('input[name="theme"]');
    for (var i=0;i<radios.length;i++){
      radios[i].addEventListener('change', function(){
        var val = this.value;
        saveTheme(val); applyTheme(val);
      });
    }
  })();
}

// ===== Router =====
function viewSection(title, backHref, backLabel){
  app.innerHTML =
    '<section class="section">'+
      '<h1>'+title+'</h1>'+
      '<p>Coming soon.</p>'+
      '<a class="btn" href="'+(backHref||'#/home')+'">'+(backLabel||'Back to Dashboard')+'</a>'+
    '</section>';
}

function route(){
  var hash = location.hash || '#/home';
  renderBreadcrumb();

  if (hash === '#/home' || hash === '') { viewHome(); }
  // Crop Production
  else if (hash === '#/crop') { viewCropHub(); }
  else if (hash.indexOf('#/crop/')===0) { viewSection(ROUTES[hash], '#/crop', 'Back to Crop Production'); }

  // Equipment
  else if (hash === '#/equipment') { viewEquipmentHub(); }
  else if (hash.indexOf('#/equipment/')===0) { viewSection(ROUTES[hash], '#/equipment', 'Back to Equipment'); }

  // Feedback
  else if (hash === '#/feedback') { viewFeedbackHub(); }
  else if (hash === '#/feedback/errors') { viewFeedbackErrors(); }
  else if (hash === '#/feedback/feature') { viewFeedbackFeature(); }

  // Team & Partners
  else if (hash === '#/team') { viewTeamHub(); }
  else if (hash === '#/team/employees') { viewTeamForm('employee'); }
  else if (hash === '#/team/subcontractors') { viewTeamForm('subcontractor'); }
  else if (hash === '#/team/vendors') { viewTeamForm('vendor'); }
  else if (hash.indexOf('#/team/dir')===0) { viewTeamDirectory(); }

  // Settings
  else if (hash === '#/settings') { viewSettingsHome(); }
  else if (hash.indexOf('#/settings/crops')===0) { viewSettingsCrops(); }
  else if (hash.indexOf('#/settings/theme')===0) { viewSettingsTheme(); }

  // AI Reports
  else if (hash === '#/ai') { viewReportsHub(); }
  else if (hash === '#/ai/premade') { viewReportsPremade(); }
  else if (hash === '#/ai/ai') { viewReportsAI(); }
  else if (hash === '#/ai/yield') { viewReportsYield(); }

  // Fallback
  else { viewSection('Not Found'); }

  if (app && app.focus) app.focus();

  // Refresh layout vars after render
  applyHeaderHeightVar(); applyCrumbsHeightVar(); applyFooterHeightVar(); applyBannerHeightVar();
}
window.addEventListener('hashchange', route);
window.addEventListener('load', route);
['load','resize','orientationchange'].forEach(function(evt){
  window.addEventListener(evt, applyHeaderHeightVar);
  window.addEventListener(evt, applyCrumbsHeightVar);
  window.addEventListener(evt, applyFooterHeightVar);
  window.addEventListener(evt, applyBannerHeightVar);
});

// ===== Header/Footer text =====
if (versionEl) versionEl.textContent = displayVersion(APP_VERSION);
if (todayEl) todayEl.textContent = prettyDate(new Date());
function tick(){ if (clockEl) clockEl.textContent = formatClock12(new Date()); }
tick(); setInterval(tick, 15000);

// Logout (placeholder)
if (logoutBtn) logoutBtn.addEventListener('click', function(){
  try { localStorage.removeItem('df_auth'); localStorage.removeItem('df_user'); } catch {}
  // window.location.replace('login.html');
  alert('Logged out (placeholder).');
});

// ===== Update banner logic =====
function showUpdateBanner(){ if (bannerEl) { bannerEl.hidden = false; applyBannerHeightVar(); } }
function hideUpdateBanner(){ if (bannerEl) { bannerEl.hidden = true; applyBannerHeightVar(); } }
function markVersionAsCurrent(){ try { localStorage.setItem('df_app_version', normalizeVersion(APP_VERSION)); } catch {} }
function storedVersion(){ try { return localStorage.getItem('df_app_version') || ''; } catch { return ''; } }
function needsUpdate(){
  var saved = storedVersion();
  var current = normalizeVersion(APP_VERSION);
  return saved && saved !== current;
}
function syncBannerWithVersion(){
  if (needsUpdate()) showUpdateBanner(); else { hideUpdateBanner(); markVersionAsCurrent(); }
}
if (bannerBtn){
  bannerBtn.addEventListener('click', function(){
    bannerBtn.disabled = true;
    bannerBtn.textContent = 'Updating…';
    hideUpdateBanner();
    if (window.__waitingSW) window.__waitingSW.postMessage({ type:'SKIP_WAITING' });
    else location.reload();
  });
}
syncBannerWithVersion();

// ===== Service Worker registration =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function(){
    (async function(){
      try {
        var reg = await navigator.serviceWorker.register('service-worker.js');
        reg.update();
        document.addEventListener('visibilitychange', function(){ if (document.visibilityState==='visible') reg.update(); });

        if (reg.waiting) { window.__waitingSW = reg.waiting; if (needsUpdate()) showUpdateBanner(); }

        reg.addEventListener('updatefound', function(){
          var sw = reg.installing; if(!sw) return;
          sw.addEventListener('statechange', function(){
            if (sw.state==='installed' && navigator.serviceWorker.controller){
              window.__waitingSW = reg.waiting || sw;
              if (needsUpdate()) showUpdateBanner();
            }
          });
        });

        navigator.serviceWorker.addEventListener('controllerchange', function(){
          window.__waitingSW = null;
          hideUpdateBanner();
          markVersionAsCurrent();
          setTimeout(function(){ location.reload(); }, 200);
        });
      } catch(e){ console.error('SW registration failed', e); }
    })();
  });
}