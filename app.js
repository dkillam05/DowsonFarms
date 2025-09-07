// ===== App constants =====
const APP_VERSION = 'v6.15'; // footer shows vMAJOR.MINOR

// ===== Auth guard (invite-only placeholder) =====
function isAuthed(){ try { return localStorage.getItem('df_auth') === '1'; } catch { return false; } }
(function enforceAuth(){
  var here = (location.pathname.split('/').pop() || '').toLowerCase();
  if (!isAuthed() && here !== 'login.html') {
    // login.html must exist
    window.location.replace('login.html');
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

  // AI Reports
  '#/ai': 'AI Reports',
  '#/ai/premade': 'Pre-made Reports',
  '#/ai/ai': 'AI Reports',
  '#/ai/yield': 'Yield Report',

  // Grain Tracking
  '#/grain': 'Grain Tracking',
  '#/grain/bag': 'Grain Bag',
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
function normalizeVersion(v){ var m=String(v||'').trim().replace(/^v/i,''); var p=m.split('.'); return (p[0]||'0')+'.'+(p[1]||'0'); }
function displayVersion(v){ return 'v' + normalizeVersion(v); }
function uid(){ return Math.random().toString(36).slice(2) + Date.now().toString(36); }
function capFirst(s){ s=String(s||'').trim(); return s? s.charAt(0).toUpperCase()+s.slice(1).toLowerCase() : ''; }
function looksLikeEmail(e){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e||'').trim()); }
function cleanPhone(p){ return String(p||'').replace(/[^\d]/g,''); }
function formatPhone(digits){ var d=cleanPhone(digits); return d.length===10 ? '('+d.slice(0,3)+') '+d.slice(3,6)+'-'+d.slice(6) : d; }

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
function applyHeaderHeightVar(){ var el=document.querySelector('.app-header'); document.documentElement.style.setProperty('--header-h', (el?el.offsetHeight:0)+'px'); }
function applyCrumbsHeightVar(){ var el=document.querySelector('.breadcrumbs'); document.documentElement.style.setProperty('--crumbs-h', (el?el.offsetHeight:0)+'px'); }
function applyFooterHeightVar(){ var el=document.querySelector('.app-footer'); document.documentElement.style.setProperty('--footer-h', (el?el.offsetHeight:0)+'px'); }
function applyBannerHeightVar(){ var el=document.getElementById('update-banner'); var h=(el && !el.hasAttribute('hidden'))? el.offsetHeight : 0; document.documentElement.style.setProperty('--banner-h', h+'px'); }

// ===== Rendering helpers =====
function tile(emoji,label,href){
  return '<a class="tile" role="listitem" href="'+href+'" aria-label="'+label+'"><span class="emoji">'+emoji+'</span><span class="label">'+label+'</span></a>';
}

function renderBreadcrumb(){
  var hash = location.hash || '#/home';

  // Settings
  if (hash === '#/settings'){ crumbs.innerHTML = '<a href="#/home">Home</a> &nbsp;&gt;&nbsp; <span>Settings</span>'; return; }
  if (hash.indexOf('#/settings/crops')===0){ crumbs.innerHTML = '<a href="#/home">Home</a> &nbsp;&gt;&nbsp; <a href="#/settings">Settings</a> &nbsp;&gt;&nbsp; <span>Crop Type</span>'; return; }
  if (hash.indexOf('#/settings/theme')===0){ crumbs.innerHTML = '<a href="#/home">Home</a> &nbsp;&gt;&nbsp; <a href="#/settings">Settings</a> &nbsp;&gt;&nbsp; <span>Theme</span>'; return; }

  // Crop Production
  var cropKids=['#/crop/planting','#/crop/spraying','#/crop/aerial','#/crop/harvest','#/crop/maintenance','#/crop/scouting','#/crop/trials'];
  if (hash === '#/crop'){ crumbs.innerHTML = '<a href="#/home">Home</a> &nbsp;&gt;&nbsp; <span>Crop Production</span>'; return; }
  if (cropKids.indexOf(hash)!==-1){ crumbs.innerHTML = '<a href="#/home">Home</a> &nbsp;&gt;&nbsp; <a href="#/crop">Crop Production</a> &nbsp;&gt;&nbsp; <span>'+(ROUTES[hash]||'')+'</span>'; return; }

  // Equipment
  var eqKids=['#/equipment/receivers','#/equipment/tractors','#/equipment/combines','#/equipment/sprayer','#/equipment/construction','#/equipment/trucks-trailers','#/equipment/implements','#/equipment/shop','#/equipment/barcodes'];
  if (hash === '#/equipment'){ crumbs.innerHTML = '<a href="#/home">Home</a> &nbsp;&gt;&nbsp; <span>Equipment</span>'; return; }
  if (eqKids.indexOf(hash)!==-1){ crumbs.innerHTML = '<a href="#/home">Home</a> &nbsp;&gt;&nbsp; <a href="#/equipment">Equipment</a> &nbsp;&gt;&nbsp; <span>'+(ROUTES[hash]||'')+'</span>'; return; }

  // Feedback
  var fbKids=['#/feedback/errors','#/feedback/feature'];
  if (hash === '#/feedback'){ crumbs.innerHTML = '<a href="#/home">Home</a> &nbsp;&gt;&nbsp; <span>Feedback</span>'; return; }
  if (fbKids.indexOf(hash)!==-1){ crumbs.innerHTML = '<a href="#/home">Home</a> &nbsp;&gt;&nbsp; <a href="#/feedback">Feedback</a> &nbsp;&gt;&nbsp; <span>'+(ROUTES[hash]||'')+'</span>'; return; }

  // Team & Partners
  var teamKids=['#/team/employees','#/team/subcontractors','#/team/vendors','#/team/dir'];
  if (hash === '#/team'){ crumbs.innerHTML = '<a href="#/home">Home</a> &nbsp;&gt;&nbsp; <span>Team & Partners</span>'; return; }
  if (teamKids.indexOf(hash)!==-1){ var labels={'#/team/employees':'Employees','#/team/subcontractors':'Subcontractors','#/team/vendors':'Vendors','#/team/dir':'Directory'}; crumbs.innerHTML = '<a href="#/home">Home</a> &nbsp;&gt;&nbsp; <a href="#/team">Team & Partners</a> &nbsp;&gt;&nbsp; <span>'+(labels[hash]||'')+'</span>'; return; }

  // AI Reports
  var aiKids=['#/ai/premade','#/ai/ai','#/ai/yield'];
  if (hash === '#/ai'){ crumbs.innerHTML = '<a href="#/home">Home</a> &nbsp;&gt;&nbsp; <span>AI Reports</span>'; return; }
  if (aiKids.indexOf(hash)!==-1){ crumbs.innerHTML = '<a href="#/home">Home</a> &nbsp;&gt;&nbsp; <a href="#/ai">AI Reports</a> &nbsp;&gt;&nbsp; <span>'+(ROUTES[hash]||'')+'</span>'; return; }

  // Grain Tracking
  var grainKids=['#/grain/bag'];
  if (hash === '#/grain'){ crumbs.innerHTML = '<a href="#/home">Home</a> &nbsp;&gt;&nbsp; <span>Grain Tracking</span>'; return; }
  if (grainKids.indexOf(hash)!==-1){ crumbs.innerHTML = '<a href="#/home">Home</a> &nbsp;&gt;&nbsp; <a href="#/grain">Grain Tracking</a> &nbsp;&gt;&nbsp; <span>'+(ROUTES[hash]||'')+'</span>'; return; }

  if (hash === '#/home' || hash === ''){ crumbs.innerHTML = '<span>Home</span>'; return; }
  crumbs.innerHTML = '<a href="#/home">Home</a> &nbsp;&gt;&nbsp; <span>'+(ROUTES[hash]||'Section')+'</span>';
}

// ===== Home & Hubs =====
function viewHome(){
  app.innerHTML =
    '<div class="grid" role="list">'+
      tile('🌽','Crop Production','#/crop')+
      tile('🔢','Calculator','#/calculator')+
      // Link Field Maintenance straight to Crop → Maintenance
      tile('🛠️','Field Maintenance','#/crop/maintenance')+
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
  try { var key='df_feedback'; var list=JSON.parse(localStorage.getItem(key) || '[]'); list.push(entry); localStorage.setItem(key, JSON.stringify(list)); } catch {}
}
function viewFeedbackErrors(){
  app.innerHTML =
    '<section class="section">'+
      '<h1>🛠️ Report Errors</h1>'+
      '<div class="field"><label class="choice"><input type="text" id="err-subj" placeholder="Subject *"></label></div>'+
      '<div class="field"><label class="choice"><textarea id="err-desc" rows="5" placeholder="What happened? *"></textarea></label></div>'+
      '<div class="field"><label class="choice"><input id="err-contact" type="text" placeholder="Phone or email (optional)"></label></div>'+
      '<button id="err-submit" class="btn-primary">Submit</button> '+
      '<a class="btn" href="#/feedback">Back to Feedback</a>'+
    '</section>';
  var btn=document.getElementById('err-submit'); if(!btn) return;
  btn.addEventListener('click', function(){
    var subject=String(document.getElementById('err-subj').value||'').trim();
    var details=String(document.getElementById('err-desc').value||'').trim();
    var contact=String(document.getElementById('err-contact').value||'').trim();
    if(!subject||!details){ alert('Please fill the required fields.'); return; }
    if(contact){ var isEmail=looksLikeEmail(contact); var isPhone=cleanPhone(contact).length===10; if(!isEmail&&!isPhone){ alert('Contact must be a valid email or 10-digit phone.'); return; } }
    saveFeedback({type:'error',subject:subject,details:details,contact:contact,ts:Date.now()});
    alert('Thanks! Your error report was saved.'); location.hash='#/feedback';
  });
}
function viewFeedbackFeature(){
  app.innerHTML =
    '<section class="section">'+
      '<h1>💡 New Feature Request</h1>'+
      '<div class="field"><label class="choice"><input id="feat-subj" type="text" placeholder="Feature title *"></label></div>'+
      '<div class="field"><label class="choice"><textarea id="feat-desc" rows="5" placeholder="Describe the idea *"></textarea></label></div>'+
      '<div class="field"><label class="choice"><input id="feat-contact" type="text" placeholder="Phone or email (optional)"></label></div>'+
      '<button id="feat-submit" class="btn-primary">Submit</button> '+
      '<a class="btn" href="#/feedback">Back to Feedback</a>'+
    '</section>';
  var btn=document.getElementById('feat-submit'); if(!btn) return;
  btn.addEventListener('click', function(){
    var subject=String(document.getElementById('feat-subj').value||'').trim();
    var details=String(document.getElementById('feat-desc').value||'').trim();
    var contact=String(document.getElementById('feat-contact').value||'').trim();
    if(!subject||!details){ alert('Please fill the required fields.'); return; }
    if(contact){ var isEmail=looksLikeEmail(contact); var isPhone=cleanPhone(contact).length===10; if(!isEmail&&!isPhone){ alert('Contact must be a valid email or 10-digit phone.'); return; } }
    saveFeedback({type:'feature',subject:subject,details:details,contact:contact,ts:Date.now()});
    alert('Thanks! Your feature request was saved.'); location.hash='#/feedback';
  });
}

// ===== Team & Partners =====
var PEOPLE_KEY = 'df_people';
function loadPeople(){ try { return JSON.parse(localStorage.getItem(PEOPLE_KEY) || '[]'); } catch { return []; } }
function savePeople(list){ try { localStorage.setItem(PEOPLE_KEY, JSON.stringify(list)); } catch {} }

function viewTeamForm(kind){
  var icons={employee:'👷',subcontractor:'🛠️',vendor:'🏪'};
  var titles={employee:'Add Employee',subcontractor:'Add Subcontractor',vendor:'Add Vendor'};
  app.innerHTML =
    '<section class="section">'+
      '<h1>'+icons[kind]+' '+titles[kind]+'</h1>'+
      '<div class="field"><label class="choice"><input id="p-first" type="text" placeholder="First name *"></label></div>'+
      '<div class="field"><label class="choice"><input id="p-last" type="text" placeholder="Last name *"></label></div>'+
      '<div class="field"><label class="choice"><input id="p-role" type="text" placeholder="'+(kind==='vendor'?'Role / Contact Title':'Job role')+'"></label></div>'+
      '<div class="field"><label class="choice"><input id="p-phone" type="tel" placeholder="(555) 123-4567"></label></div>'+
      '<div class="field"><label class="choice"><input id="p-email" type="email" placeholder="name@example.com"></label></div>'+
      '<div class="field"><label class="choice"><input id="p-start" type="date" placeholder="Start date"></label></div>'+
      '<div class="field"><label class="choice"><input id="p-bday" type="date" placeholder="Birthday"></label></div>'+
      '<div class="field"><label class="choice"><textarea id="p-notes" rows="4" placeholder="'+(kind==='vendor'?'Company name, account #, terms…':'Certifications, allergies, preferred equipment…')+'"></textarea></label></div>'+
      '<div class="field">'+
        '<label style="font-weight:600;">Access / Role</label>'+
        '<select id="p-access">'+
          '<option value="">— None —</option>'+
          '<option value="Admin">Admin</option>'+
          '<option value="Manager">Manager</option>'+
          '<option value="Employee">Employee</option>'+
          '<option value="Guest">Guest</option>'+
        '</select>'+
      '</div>'+
      '<button id="p-save" class="btn-primary">Save</button> '+
      '<div class="settings-actions"><a class="btn" href="#/team/dir">View Directory</a> <a class="btn" href="#/team">Back to Team & Partners</a></div>'+
    '</section>';
  var first=document.getElementById('p-first'); var last=document.getElementById('p-last');
  if(first) first.addEventListener('blur', function(){ first.value = capFirst(first.value); });
  if(last)  last.addEventListener('blur',  function(){ last.value  = capFirst(last.value);  });
  var btn=document.getElementById('p-save'); if(!btn) return;
  btn.addEventListener('click', function(){
    var firstName=capFirst(document.getElementById('p-first').value);
    var lastName=capFirst(document.getElementById('p-last').value);
    if(!firstName||!lastName){ alert('Please enter first and last name.'); return; }
    if(!/^[A-Z]/.test(firstName)||!/^[A-Z]/.test(lastName)){ alert('Names must start with a capital letter.'); return; }
    var role=String(document.getElementById('p-role').value||'').trim();
    var phoneRaw=String(document.getElementById('p-phone').value||'');
    var email=String(document.getElementById('p-email').value||'').trim();
    var start=String(document.getElementById('p-start').value||'').trim();
    var bday=String(document.getElementById('p-bday').value||'').trim();
    var notes=String(document.getElementById('p-notes').value||'').trim();
    var access=document.getElementById('p-access').value;
    var phoneDigits=cleanPhone(phoneRaw);
    if(phoneDigits && phoneDigits.length!==10){ alert('Phone must be a valid 10-digit number.'); return; }
    if(email && !looksLikeEmail(email)){ alert('Please enter a valid email address.'); return; }
    var list=loadPeople();
    list.push({id:uid(),type:kind,firstName:firstName,lastName:lastName,role:role,phone:phoneDigits,email:email,startDate:start,birthday:bday,notes:notes,accessRole:access||''});
    savePeople(list); alert('Saved.'); location.hash='#/team/dir';
  });
}

function viewTeamDirectory(){
  var people=loadPeople(); var qs=location.hash.split('?')[1]||''; var filter='all';
  if(qs){ var params=new URLSearchParams(qs); filter=params.get('type')||'all'; }
  function pill(t,label,emoji){ var active=(filter===t)?' style="border-color:#DAA520;color:#6f5200"':''; var href=(t==='all')?'#/team/dir':'#/team/dir?type='+t; return '<a class="btn"'+active+' href="'+href+'">'+emoji+' '+label+'</a>'; }
  var filtered=people.filter(function(p){ return filter==='all'? true : p.type===filter; });
  var rows=filtered.map(function(p){
    var name=(p.firstName||'')+' '+(p.lastName||'');
    var badge=(p.type==='employee')?'👷':(p.type==='subcontractor'?'🛠️':'🏪');
    var lines=[]; if(p.role)lines.push('Role: '+p.role); if(p.email)lines.push('Email: '+p.email); if(p.phone)lines.push('Phone: '+formatPhone(p.phone)); if(p.startDate)lines.push('Since: '+p.startDate); if(p.birthday)lines.push('Birthday: '+p.birthday); if(p.accessRole)lines.push('Access: '+p.accessRole); if(p.notes)lines.push('Notes: '+p.notes);
    var details=lines.length? lines.map(function(s){return '<div class="small muted">'+s+'</div>';}).join('') : '<span class="small muted">No details</span>';
    return '<li class="crop-row"><div class="crop-info"><span class="chip">'+badge+' '+(name.trim()||'(Unnamed)')+'</span></div><div class="crop-actions"></div><div style="flex-basis:100%;padding-left:8px;margin-top:6px;">'+details+'</div></li>';
  }).join('');
  app.innerHTML =
    '<section class="section">'+
      '<h1>📇 Team & Partners — Directory</h1>'+
      '<div class="settings-actions" style="display:flex;gap:8px;flex-wrap:wrap;">'+
        pill('all','All','📇')+pill('employee','Employees','👷')+pill('subcontractor','Subcontractors','🛠️')+pill('vendor','Vendors','🏪')+
      '</div>'+
      '<ul class="crop-list" style="margin-top:10px;">'+(rows || '<li class="muted">No people yet.</li>')+'</ul>'+
      '<div class="settings-actions"><a class="btn" href="#/team">Back to Team & Partners</a> <a class="btn" href="#/home">Back to Dashboard</a></div>'+
    '</section>';
}

// ===== Settings: Crops + Theme =====
var CROPS_KEY='df_crops';
function migrateCropsShape(arr){ if(!Array.isArray(arr))return[]; if(arr.length && typeof arr[0]==='string') return arr.map(function(n){return{name:n,archived:false};}); return arr.map(function(o){return{name:String(o.name||'').trim(),archived:!!o.archived};}); }
function loadCrops(){ try{ var raw=localStorage.getItem(CROPS_KEY); if(!raw) return [{name:'Corn',archived:false},{name:'Soybeans',archived:false}]; var arr=JSON.parse(raw); var norm=migrateCropsShape(arr); return norm.length? norm : [{name:'Corn',archived:false},{name:'Soybeans',archived:false}]; }catch{ return [{name:'Corn',archived:false},{name:'Soybeans',archived:false}]; } }
function saveCrops(list){ try{ localStorage.setItem(CROPS_KEY, JSON.stringify(list)); }catch{} }
function isCropInUse(name){ return false; } // placeholder

function viewSettingsHome(){
  app.innerHTML =
    '<div class="grid settings-tabs" role="tablist" aria-label="Settings tabs">'+
      '<a class="tile" role="tab" href="#/settings/crops"><span class="emoji">🌱</span><span class="label">Crop Type</span></a>'+
      '<a class="tile" role="tab" href="#/settings/theme"><span class="emoji">🌓</span><span class="label">Theme</span></a>'+
    '</div>'+
    '<div class="settings-actions"><a class="btn" href="#/home">Back to Dashboard</a></div>';
}

function viewSettingsCrops(){
  var crops=loadCrops();
  var items=crops.map(function(o,i){
    var status=o.archived? '<span class="chip chip-archived" title="Archived">Archived</span>' : '';
    var actions=o.archived? '<button class="sm" data-unarchive="'+i+'">Unarchive</button> <button class="danger sm" data-delete="'+i+'">Delete</button>' : '<button class="warn sm" data-archive="'+i+'">Archive</button> <button class="danger sm" data-delete="'+i+'">Delete</button>';
    return '<li class="crop-row '+(o.archived?'is-archived':'')+'"><div class="crop-info"><span class="chip">'+o.name+'</span> '+status+'</div><div class="crop-actions">'+actions+'</div></li>';
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
      '<div class="add-row" style="display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;margin-top:10px;">'+
        '<input id="new-crop" type="text" placeholder="e.g., Wheat">'+
        '<button id="add-crop" class="btn-primary">➕ Add</button>'+
      '</div>'+
      '<a class="btn" href="#/settings">Back to Settings</a>'+
    '</section>';
  var addBtn=document.getElementById('add-crop'); var input=document.getElementById('new-crop'); var listEl=app.querySelector('.crop-list');
  if(addBtn) addBtn.addEventListener('click', function(){ var name=String(input.value||'').trim(); if(!name) return; var cs=loadCrops(); for(var i=0;i<cs.length;i++){ if(cs[i].name.toLowerCase()===name.toLowerCase()){ input.value=''; return; } } cs.push({name:name,archived:false}); saveCrops(cs); viewSettingsCrops(); });
  if(input) input.addEventListener('keydown', function(e){ if(e.key==='Enter'){ e.preventDefault(); if(addBtn) addBtn.click(); } });
  if(listEl) listEl.addEventListener('click', function(e){
    var btn=e.target.closest? e.target.closest('button'):null; if(!btn) return;
    var cs=loadCrops();
    if(btn.hasAttribute('data-archive')){ var i=+btn.getAttribute('data-archive'); if(cs[i]){ cs[i].archived=true; saveCrops(cs); viewSettingsCrops(); } }
    else if(btn.hasAttribute('data-unarchive')){ var j=+btn.getAttribute('data-unarchive'); if(cs[j]){ cs[j].archived=false; saveCrops(cs); viewSettingsCrops(); } }
    else if(btn.hasAttribute('data-delete')){ var k=+btn.getAttribute('data-delete'); if(!cs[k]) return; var nm=cs[k].name; if(isCropInUse(nm)){ alert('“'+nm+'” is used in your data. Archive instead.'); return; } if(!confirm('Delete “'+nm+'”? This cannot be undone.')) return; cs.splice(k,1); saveCrops(cs); viewSettingsCrops(); }
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
        '<label style="font-weight:600;margin-bottom:6px;">Appearance</label>'+
        '<div class="theme-list">'+
          '<label class="theme-item"><input type="radio" name="theme" value="auto" '+(current==='auto'?'checked':'')+'><span>Auto (follow device)</span></label>'+
          '<label class="theme-item"><input type="radio" name="theme" value="light" '+(current==='light'?'checked':'')+'><span>Light</span></label>'+
          '<label class="theme-item"><input type="radio" name="theme" value="dark" '+(current==='dark'?'checked':'')+'><span>Dark</span></label>'+
        '</div>'+
      '</div>'+
      '<div class="settings-actions"><a class="btn" href="#/settings">Back to Settings</a></div>'+
    '</section>';

  var radios = app.querySelectorAll('input[name="theme"]');
  for (var i=0; i<radios.length; i++){
    radios[i].addEventListener('change', function(){
      saveTheme(this.value);
      applyTheme(this.value);
    });
  }
}

// ===== Grain Tracking: hub + Grain Bag =====
var GRAIN_BAG_KEY='df_grain_bags';
function loadBags(){ try{ return JSON.parse(localStorage.getItem(GRAIN_BAG_KEY) || '[]'); }catch{ return []; } }
function saveBags(list){ try{ localStorage.setItem(GRAIN_BAG_KEY, JSON.stringify(list)); }catch{} }

function viewGrainHub(){
  app.innerHTML =
    '<div class="grid">'+
      tile('🧺','Grain Bag','#/grain/bag')+
    '</div>'+
    '<div class="settings-actions"><a class="btn" href="#/home">Back to Dashboard</a></div>';
}
function viewGrainBag(){
  var crops=loadCrops().filter(function(c){return !c.archived;});
  var cropOptions=crops.map(function(c){return '<option value="'+c.name+'">'+c.name+'</option>';}).join('') || '<option value="" disabled>(No crops — add in Settings)</option>';
  var rows=loadBags().map(function(b){
    return '<li class="crop-row"><div class="crop-info"><span class="chip">📅 '+b.date+'</span></div><div class="crop-actions"><span class="small">'+b.location+'</span></div><div style="flex-basis:100%;padding-left:8px;margin-top:6px;"><div class="small muted">Crop: '+b.crop+' • Moisture: '+b.moisture+'%</div>'+(b.notes?'<div class="small muted">Notes: '+b.notes+'</div>':'')+'</div></li>';
  }).join('');
  app.innerHTML =
    '<section class="section">'+
      '<h1>🧺 Grain Bag</h1>'+
      '<div class="field"><label class="choice"><input id="gb-date" type="date"> <span class="small muted">(Required)</span></label></div>'+
      '<div class="field"><label>Crop <span class="small muted">(Required)</span></label><select id="gb-crop">'+cropOptions+'</select></div>'+
      '<div class="field"><label>Location <span class="small muted">(Required)</span></label>'+
        '<select id="gb-loc">'+
          '<option value="">— Choose —</option>'+
          '<option value="Divernon Elevator">Divernon Elevator</option>'+
          '<option value="Field (TBD)">Field (TBD)</option>'+
        '</select>'+
      '</div>'+
      '<div class="field"><label class="choice"><input id="gb-moist" type="number" inputmode="decimal" step="0.1" min="0" max="100" placeholder="Moisture % (Required)"></label></div>'+
      '<div class="field"><label class="choice"><textarea id="gb-notes" rows="3" placeholder="Notes (optional)"></textarea></label></div>'+
      '<button id="gb-save" class="btn-primary">Save</button>'+
      '<h2 style="margin-top:14px;">Recent</h2>'+
      '<ul class="crop-list">'+(rows || '<li class="muted">No grain bags recorded.</li>')+'</ul>'+
      '<div class="settings-actions"><a class="btn" href="#/grain">Back to Grain Tracking</a> <a class="btn" href="#/home">Back to Dashboard</a></div>'+
    '</section>';
  var btn=document.getElementById('gb-save'); if(!btn) return;
  btn.addEventListener('click', function(){
    var date=document.getElementById('gb-date').value;
    var crop=document.getElementById('gb-crop').value;
    var loc=document.getElementById('gb-loc').value;
    var moist=String(document.getElementById('gb-moist').value||'').trim();
    var notes=String(document.getElementById('gb-notes').value||'').trim();
    if(!date||!crop||!loc||!moist){ alert('Date, Crop, Location and Moisture are required.'); return; }
    var m=parseFloat(moist); if(isNaN(m)||m<0||m>100){ alert('Moisture must be between 0 and 100.'); return; }
    var list=loadBags(); list.unshift({id:uid(),date:date,crop:crop,location:loc,moisture:m.toFixed(1),notes:notes}); saveBags(list);
    alert('Saved.'); viewGrainBag();
  });
}

// ===== Generic section fallback =====
function viewSection(title, backHref, backLabel){
  app.innerHTML =
    '<section class="section"><h1>'+title+'</h1><p>Coming soon.</p><a class="btn" href="'+(backHref||'#/home')+'">'+(backLabel||'Back to Dashboard')+'</a></section>';
}

// ===== Router =====
function route(){
  var hash = location.hash || '#/home';
  renderBreadcrumb();

  if (hash === '#/home' || hash === '') { viewHome(); }

  // Crop
  else if (hash === '#/crop') { viewCropHub(); }
  else if (hash.indexOf('#/crop/')===0) { viewSection(ROUTES[hash], '#/crop', 'Back to Crop Production'); }

  // Equipment
  else if (hash === '#/equipment') { viewEquipmentHub(); }
  else if (hash.indexOf('#/equipment/')===0) { viewSection(ROUTES[hash], '#/equipment', 'Back to Equipment'); }

  // Feedback
  else if (hash === '#/feedback') { viewFeedbackHub(); }
  else if (hash === '#/feedback/errors') { viewFeedbackErrors(); }
  else if (hash === '#/feedback/feature') { viewFeedbackFeature(); }

  // Team
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

  // Grain
  else if (hash === '#/grain') { viewGrainHub(); }
  else if (hash === '#/grain/bag') { viewGrainBag(); }

  else { viewSection('Not Found'); }

  if (app && app.focus) app.focus();
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

// Logout → clear auth and go to login
if (logoutBtn) logoutBtn.addEventListener('click', function(){
  try { localStorage.removeItem('df_auth'); localStorage.removeItem('df_user'); } catch {}
  window.location.replace('login.html');
});

// ===== Update banner logic (more robust) =====
function showUpdateBanner(){ if (bannerEl){ bannerEl.hidden=false; applyBannerHeightVar(); } }
function hideUpdateBanner(){ if (bannerEl){ bannerEl.hidden=true; applyBannerHeightVar(); } }
function markVersionAsCurrent(){ try { localStorage.setItem('df_app_version', normalizeVersion(APP_VERSION)); } catch {} }
function storedVersion(){ try { return localStorage.getItem('df_app_version') || ''; } catch { return ''; } }
function needsUpdate(){ var saved=storedVersion(); var cur=normalizeVersion(APP_VERSION); return saved && saved !== cur; }
function syncBannerWithVersion(){ if (needsUpdate()) showUpdateBanner(); else { hideUpdateBanner(); markVersionAsCurrent(); } }

if (bannerBtn){
  bannerBtn.addEventListener('click', function(){
    try { sessionStorage.setItem('df_updating', '1'); } catch {}
    bannerBtn.disabled = true;
    bannerBtn.textContent = 'Updating…';
    hideUpdateBanner();

    if (window.__waitingSW) {
      window.__waitingSW.postMessage({ type:'SKIP_WAITING' });
    } else {
      location.reload();
    }
  });
}

// On load, decide banner state
window.addEventListener('load', function(){
  // If we just came back from pressing Refresh, suppress the banner once
  (function afterUpdateOneShot(){
    var flag = null;
    try { flag = sessionStorage.getItem('df_updating'); } catch {}
    if (flag === '1') {
      try { sessionStorage.removeItem('df_updating'); } catch {}
      markVersionAsCurrent();
      hideUpdateBanner();
      return; // stop here, don't re-run normal sync
    }
  })();

  // If a SW already controls the page, keep banner hidden on hard reloads
  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    markVersionAsCurrent();
    hideUpdateBanner();
  } else {
    syncBannerWithVersion();
  }
});

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
          markVersionAsCurrent();
          hideUpdateBanner();
          setTimeout(function(){ location.reload(); }, 200);
        });
      } catch(e){ console.error('SW registration failed', e); }
    })();
  });
}