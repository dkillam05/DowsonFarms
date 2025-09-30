/* ===========================
   js/core.js  (FULL)
   - Breadcrumb logout
   - Clock + version injection (network refresh)
   - Back button
   - Global loader helpers
   - Quick View shell
   - PASSIVE auth guard
   - Tiles Guard (RBAC) for home grid
   =========================== */
(function () {
  'use strict';

  function getRepoRootPath() {
    var baseEl = document.querySelector('base');
    if (baseEl && baseEl.href) { try { var u = new URL(baseEl.href); return u.pathname.endsWith('/') ? u.pathname : (u.pathname + '/'); } catch (_) {} }
    var seg = (window.location.pathname || '/').split('/').filter(Boolean);
    if (seg.length > 0) return '/' + seg[0] + '/';
    return '/';
  }
  function resolveAuthURL() { return getRepoRootPath() + 'auth/index.html'; }
  function getHomeURL()      { return getRepoRootPath() + 'index.html'; }
  function resolveAppURL(rel){ return new URL(rel.replace(/^\.\//,''), location.origin + getRepoRootPath()).toString(); }
  function isHome() {
    var p = window.location.pathname.replace(/\/+$/, '');
    var seg = p.split('/').filter(Boolean);
    if (seg.length === 0) return true;
    if (seg.length === 1 && seg[0] === 'index.html') return true;
    if (seg.length === 1) return true;
    if (seg.length === 2 && seg[1] === 'index.html') return true;
    return false;
  }
  function isAuthPage() { return /\/auth(\/|$)/i.test(window.location.pathname); }

  function handleLogout(ev) {
    if (ev && ev.preventDefault) ev.preventDefault();
    var authURL = resolveAuthURL();
    var keepTheme = null;
    try { keepTheme = localStorage.getItem('df_theme'); } catch (_){}
    try { if (window.DF_FB_API?.signOut) window.DF_FB_API.signOut().catch(()=>{}); } catch(_){}
    try { localStorage.clear(); sessionStorage.clear(); if (keepTheme!==null) localStorage.setItem('df_theme', keepTheme); } catch(_){}
    function go(){ try{ location.replace(authURL); }catch(_){ location.href = authURL; } }
    try{
      if (navigator.serviceWorker?.getRegistrations) {
        navigator.serviceWorker.getRegistrations().then(regs=>Promise.allSettled(regs.map(r=>r.unregister()))).finally(go);
      } else go();
    }catch(_){ go(); }
  }

  function injectBreadcrumbLogout() {
    var bc = document.querySelector('nav.breadcrumbs, .breadcrumbs'); if (!bc) return;
    var old = bc.querySelectorAll('#logout-btn,[data-action="logout"],.logout,a[href*="logout"]'); old.forEach(n=>n.remove());
    var cs = getComputedStyle(bc); if (cs.position === 'static') bc.style.position = 'relative';
    if ((parseInt(cs.paddingRight||'0',10)) < 100) bc.style.paddingRight='100px';
    if (bc.querySelector('#df-logout-host')) return;

    var host = document.createElement('div');
    host.id='df-logout-host';
    host.style.cssText='position:absolute;right:12px;top:50%;transform:translateY(-50%);display:flex;align-items:center;z-index:2';
    var brand = getComputedStyle(document.documentElement).getPropertyValue('--brand-green').trim() || '#1B5E20';
    var btn = document.createElement('button');
    btn.id='logout-btn'; btn.type='button'; btn.textContent='Logout';
    btn.style.cssText=`padding:5px 10px;font-size:12px;font-weight:700;line-height:1;border-radius:8px;border:2px solid ${brand};background:#fff;color:${brand};cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,.08);touch-action:manipulation;-webkit-tap-highlight-color:transparent`;
    if ((document.documentElement.getAttribute('data-theme')||'').toLowerCase()==='dark'){ btn.style.background='#15181b'; btn.style.color='#dff1e1'; btn.style.borderColor='#2d7b35'; }
    btn.addEventListener('click', handleLogout, { passive:false });
    host.appendChild(btn); bc.appendChild(host);
  }

  function installClock() {
    var clockEl=document.getElementById('clock'), dateEl=document.getElementById('report-date');
    if (!clockEl && !dateEl) return;
    var tz='America/Chicago';
    function render(){
      var now = new Date();
      if (clockEl) clockEl.textContent = now.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true,timeZone:tz});
      if (dateEl)  dateEl.textContent  = now.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'2-digit',year:'numeric',timeZone:tz});
    }
    render(); var now=new Date(); var ms=((60-now.getSeconds())*1000-now.getMilliseconds()); setTimeout(function(){ render(); setInterval(render, 60000); }, Math.max(0,ms));
  }

  function injectVersionAndBuildDate(){
    var verEl=document.getElementById('version'); var version=window.DF_VERSION ? String(window.DF_VERSION) : 'v0.0.0';
    if (verEl) verEl.textContent = version;
  }
  async function refreshVersionFromNetwork(){
    try {
      const res = await fetch(resolveAppURL('./js/version.js'), { cache:'no-store' });
      const txt = await res.text();
      const m = txt.match(/DF_VERSION\s*=\s*['"]([^'"]+)['"]/i) || txt.match(/var\s+VERSION\s*=\s*['"]([^'"]+)['"]/i);
      const ver = m ? m[1] : null;
      if (ver){ window.DF_VERSION=ver; var verEl=document.getElementById('version'); if (verEl) verEl.textContent=ver; }
    } catch(_){}
  }

  function attachLoader(container){
    if (document.getElementById('df-loader-style')){} else {
      var s=document.createElement('style'); s.id='df-loader-style';
      s.textContent='.df-loader{position:absolute;inset:0;display:none;align-items:center;justify-content:center;z-index:2;background:rgba(0,0,0,.28)}[data-loading="true"]>.df-loader,[data-loading="true"] .df-loader{display:flex}.df-loader__spinner{width:56px;height:56px;border-radius:50%;border:5px solid rgba(255,255,255,.5);border-top-color:#1B5E20;animation:dfspin 1s linear infinite}@keyframes dfspin{to{transform:rotate(360deg)}}';
      document.head.appendChild(s);
    }
    var c=container||document.querySelector('main.content')||document.body;
    var cs=getComputedStyle(c); if (cs.position==='static') c.style.position='relative';
    c.setAttribute('data-has-loader',''); var existing=c.querySelector(':scope > .df-loader'); if (existing) return existing;
    var wrap=document.createElement('div'); wrap.className='df-loader'; wrap.setAttribute('aria-busy','true'); var sp=document.createElement('div'); sp.className='df-loader__spinner'; wrap.appendChild(sp); c.appendChild(wrap); return wrap;
  }
  function showLoader(c){ c=c||document.querySelector('main.content')||document.body; attachLoader(c); c.setAttribute('data-loading','true'); }
  function hideLoader(c){ c=c||document.querySelector('main.content')||document.body; c.setAttribute('data-loading','false'); }
  async function withLoader(c, fn){ c=c||document.querySelector('main.content')||document.body; showLoader(c); try { return await fn(); } finally { hideLoader(c); } }
  window.DFLoader = { attach: attachLoader, show: showLoader, hide: hideLoader, withLoader: withLoader };

  (function(){
    var last='[]';
    function render(items){
      var nav=document.querySelector('nav.breadcrumbs'); if(!nav) return;
      var ol=nav.querySelector('ol'); if(!ol){ ol=document.createElement('ol'); nav.appendChild(ol); }
      ol.innerHTML='';
      for (var i=0;i<items.length;i++){
        var it=items[i]||{}; var li=document.createElement('li');
        if (it.href){ var a=document.createElement('a'); a.href=it.href; a.textContent=it.label||''; li.appendChild(a); }
        else { var sp=document.createElement('span'); sp.textContent=it.label||''; li.appendChild(sp); }
        ol.appendChild(li);
        if (i<items.length-1){ var s=document.createElement('li'); s.className='sep'; s.textContent='›'; ol.appendChild(s); }
      }
    }
    window.setBreadcrumbs=function(items){ try{ items=Array.isArray(items)?items:[]; if(!items.length && last!=='[]') return; last=JSON.stringify(items); render(items); }catch(_){} };
    document.addEventListener('DOMContentLoaded', ()=> {
      var nav=document.querySelector('nav.breadcrumbs'); if (!nav) return;
      var obs=new MutationObserver(()=>{ var ol=nav.querySelector('ol'); if (!ol || !ol.children.length){ try{ render(JSON.parse(last||'[]')); }catch(_){}} });
      obs.observe(nav,{childList:true,subtree:true});
    });
  })();

  function ensureQVModal(){
    if (document.getElementById('df-qv-backdrop')) return;
    var css=document.createElement('style');
    css.textContent='#df-qv-backdrop{position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.38);z-index:3000}#df-qv-modal{width:min(720px,92vw);max-height:80vh;overflow:auto;background:var(--tile-bg,#fff);color:var(--ink,#222);border:2px solid var(--tile-border,#2d6a31);border-radius:14px;box-shadow:0 18px 40px rgba(0,0,0,.25)}#df-qv-hd{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid var(--tile-border,#2d6a31);position:sticky;top:0;background:inherit}#df-qv-ttl{font-weight:700;margin:0}#df-qv-x{background:transparent;border:0;font-size:20px;line-height:1;cursor:pointer;color:inherit}#df-qv-bd{padding:12px 14px}';
    document.head.appendChild(css);
    var bp=document.createElement('div'); bp.id='df-qv-backdrop';
    var md=document.createElement('div'); md.id='df-qv-modal';
    var hd=document.createElement('div'); hd.id='df-qv-hd';
    var ttl=document.createElement('h3'); ttl.id='df-qv-ttl';
    var x=document.createElement('button'); x.id='df-qv-x'; x.type='button'; x.textContent='×';
    var bd=document.createElement('div'); bd.id='df-qv-bd';
    x.addEventListener('click', ()=>bp.style.display='none'); bp.addEventListener('click', e=>{ if(e.target===bp) bp.style.display='none'; });
    hd.appendChild(ttl); hd.appendChild(x); md.appendChild(hd); md.appendChild(bd); bp.appendChild(md); document.body.appendChild(bp);
  }
  function openQVModal(title, content){ ensureQVModal(); var bp=document.getElementById('df-qv-backdrop'); var ttl=document.getElementById('df-qv-ttl'); var bd=document.getElementById('df-qv-bd'); ttl.textContent=title||'Quick View'; bd.innerHTML=''; if (content instanceof Node) bd.appendChild(content); else bd.innerHTML=String(content||''); bp.style.display='flex'; }
  function getQuickViewConfig(){
    var main=document.querySelector('main.content')||document.body;
    var href=(main?.getAttribute('data-quick-view')|| (document.querySelector('meta[name="df-quickview"]')?.getAttribute('content')) || (window.DF_QUICKVIEW && window.DF_QUICKVIEW.href) || '').trim();
    var label=(main?.getAttribute('data-qv-label') || (window.DF_QUICKVIEW && window.DF_QUICKVIEW.label) || 'Quick View');
    return { href, label };
  }
  function injectQuickView(){
    if (isAuthPage()) return;
    if (document.getElementById('df-quick-view')) return;
    var cfg=getQuickViewConfig(); var hasProvider=(typeof window.DF_QUICKVIEW_PROVIDER==='function');
    if (!hasProvider && !cfg.href) return;
    var main=document.querySelector('main.content')||document.body; var h1=main.querySelector('h1');
    var row=document.createElement('div'); row.className='row'; row.style.cssText='align-items:center;justify-content:space-between;margin:0 0 8px;';
    if (h1){ h1.parentNode.insertBefore(row,h1); row.appendChild(h1); } else { var spacer=document.createElement('div'); spacer.textContent=''; row.appendChild(spacer); main.insertBefore(row, main.firstChild); }
    var btn=document.createElement('button'); btn.id='df-quick-view'; btn.type='button'; btn.className='btn-outline'; btn.textContent=cfg.label || 'Quick View';
    btn.addEventListener('click', async ()=> {
      try{
        if (typeof window.DF_QUICKVIEW_PROVIDER==='function'){ var res=await window.DF_QUICKVIEW_PROVIDER(); openQVModal((res&&res.title)||'Quick View', (res&&(res.node||res.html))||'<div style="opacity:.7">Nothing to show.</div>'); return; }
        if (cfg && cfg.href){ location.assign(cfg.href); }
      }catch(e){ console.error('Quick View error:', e); }
    });
    row.appendChild(btn);
  }

  function installAuthGuard(){
    if (isAuthPage() || isHome()) return;
    var MAX=150, tries=0;
    function record(){ try { localStorage.setItem('df_last_auth_ok', String(Date.now())); } catch(_){ } }
    function sub(){ if (!window.DF_FB_API?.onAuth) return false;
      try { window.DF_FB_API.setPersistence?.(true).catch(()=>{}); } catch(_){}
      window.DF_FB_API.onAuth(user=>{ if (user) record(); });
      return true;
    }
    (function wait(){
      tries++;
      if (!window.DF_FB?.auth || !window.DF_FB_API){ if (tries<MAX) return setTimeout(wait,80); return; }
      if (!sub()){ if (tries<MAX) return setTimeout(wait,80); return; }
      try { if (window.DF_FB.auth.currentUser) record(); } catch(_){}
    })();
  }

  function installTilesGuard(){
    var grid=document.querySelector('.df-tiles[data-source]'); if (!grid) return;
    if (!document.getElementById('rbac-tiles-style-core')){
      var s=document.createElement('style'); s.id='rbac-tiles-style-core';
      s.textContent='.df-tiles[data-source]{visibility:hidden}.df-tiles[data-source].rbac-ready{visibility:visible}';
      document.head.appendChild(s);
    }
    var code = `
      import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
      const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
      async function readyFB(maxMs=12000){
        const t0=Date.now(); while(Date.now()-t0<maxMs){ if(window.DF_FB&&DF_FB.db&&DF_FB.auth) return window.DF_FB; await sleep(60); }
        throw new Error('Firebase not ready');
      }
      (async ()=>{
        try{
          const { db, auth } = await readyFB();
          const user = auth.currentUser;
          // Build menu map
          const MENUS = (window.DF_MENUS && Array.isArray(window.DF_MENUS.tiles))
            ? window.DF_MENUS.tiles.reduce((acc,t)=>{ const top=String(t.label||'').trim(); const subs=(Array.isArray(t.children)?t.children:[]).map(c=>String(c.label||'').trim()); if(top) acc[top]=subs; return acc; }, {})
            : {};
          const ACTIONS=['view','edit','add','archive','delete'];
          function empty(){ const p={}; Object.keys(MENUS).forEach(m=>{ p[m]={}; (MENUS[m]||[]).forEach(s=>{ p[m][s]={view:false,edit:false,add:false,archive:false,delete:false}; }); }); return p; }
          function merge(base, ovr){ const out=empty(); Object.keys(out).forEach(m=>{ (MENUS[m]||[]).forEach(s=>{ const b=(base?.[m]?.[s])||{}; const o=(ovr?.[m]?.[s])||{}; ACTIONS.forEach(k=> out[m][s][k]=(k in o)?!!o[k]:!!b[k]); }); }); return out; }
          function canView(eff,m,s){ const p=(eff?.[m]?.[s])||{}; return !!(p.view||p.edit||p.add||p.archive||p.delete); }

          let eff=null;
          if (user){
            const email=(user.email||'').toLowerCase();
            let roleId=null, overrides={};
            try{ const u=await getDoc(doc(db,'users',email)); if (u.exists()){ const d=u.data()||{}; roleId=d.roleId||d.role||null; overrides=(d.exceptions&&d.exceptions.enabled)?(d.exceptions.grants||{}):{}; } }catch(_){}
            let rolePerms={};
            if (roleId){ try{ const r=await getDoc(doc(db,'roles',String(roleId))); if (r.exists()){ const d=r.data()||{}; rolePerms=(d.permissions&&typeof d.permissions==='object')?d.permissions:{}; } }catch(_){ } }
            eff = merge(rolePerms, overrides);
          }

          const host=document.querySelector('.df-tiles[data-source]');
          if (!host){ document.querySelector('.df-tiles[data-source]')?.classList.add('rbac-ready'); return; }

          // expect sections with data-section="<Menu Label>"
          document.querySelectorAll('.df-tiles [data-section]').forEach(sec=>{
            const menu = sec.getAttribute('data-section')||''; let kept=0;
            sec.querySelectorAll('[data-submenu], a, .tile, button, li, div').forEach(node=>{
              const sub = (node.getAttribute && node.getAttribute('data-submenu')) || (node.textContent||'').trim();
              if (!sub) return; if (node.matches('h1,h2,h3,nav,ol,ul')) return;
              if (eff && !canView(eff, menu, sub)){ node.style.display='none'; } else { kept++; }
            });
            if (!kept) sec.style.display='none';
          });

          host.classList.add('rbac-ready');
          window.dispatchEvent(new CustomEvent('df:tiles-guarded'));
        }catch(e){
          document.querySelector('.df-tiles[data-source]')?.classList.add('rbac-ready');
          console.warn('[core tiles guard] skipped:', e?.message||e);
        }
      })();
    `;
    var mod=document.createElement('script'); mod.type='module'; mod.textContent=code; document.documentElement.appendChild(mod);
  }

  document.addEventListener('DOMContentLoaded', function(){
    var host=document.querySelector('main.content')||document.body; attachLoader(host);
    injectBreadcrumbLogout(); installClock(); injectVersionAndBuildDate(); refreshVersionFromNetwork();
    (function installBack(){
      if (document.getElementById('df-back-flow')) return;
      if (isHome() || isAuthPage()) return;
      var content=document.querySelector('.content')||document.body;
      var host=document.createElement('div'); host.id='df-back-flow'; host.style.cssText='margin:12px 16px;text-align:left;';
      var btn=document.createElement('button'); btn.type='button'; btn.textContent='← Back';
      btn.style.cssText='font:inherit;font-weight:600;padding:8px 14px;border-radius:10px;border:2px solid var(--brand-green,#1B5E20);background:#fff;color:#222;box-shadow:0 2px 6px rgba(0,0,0,.08);cursor:pointer';
      if ((document.documentElement.getAttribute('data-theme')||'').toLowerCase()==='dark'){ btn.style.background='#15181b'; btn.style.color='#eaeaea'; btn.style.borderColor='#2d7b35'; }
      var isMenuGrid=!!document.querySelector('.df-tiles[data-section]');
      btn.addEventListener('click', function(){
        if (isMenuGrid){ var home=getHomeURL(); var homePath=new URL(home,location.href).pathname; var herePath=location.pathname; if (homePath===herePath){ var buster=(home.indexOf('?')>-1?'&':'?')+'r='+Date.now(); location.replace(home+buster); } else location.assign(home); }
        else if (document.referrer && history.length>1) history.back();
        else location.assign(getHomeURL());
      });
      host.appendChild(btn); content.appendChild(host);
    })();
    injectQuickView(); installAuthGuard(); installTilesGuard();
  });

  document.addEventListener('click', function(e){ var t=e.target; if (!t) return; if (t.matches('[data-action="logout"],.logout')){ e.preventDefault(); handleLogout(e); } }, { passive:false });
  window.DF_UI = window.DF_UI || {}; window.DF_UI.refreshQuickView = injectQuickView;
})();