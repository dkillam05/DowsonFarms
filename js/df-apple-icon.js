<script>
/*!
  Dowson Farms — Apple/Touch/Favicon injector
  ------------------------------------------------------------
  Purpose:
    • Guarantees the correct icons appear for “Add to Home Screen”
      on iOS and standard favicons on all pages.
    • Works on GitHub Pages with or without a <base> tag.
    • Non-destructive: replaces only our own tags if present.

  Expected files (already in /assets/icons/):
    - apple-touch-icon.png       (180×180)
    - icon-192.png               (192×192)
    - icon-512.png               (512×512, maskable if possible)
*/
(function(){
  'use strict';

  // --- Resolve repo root (works on GH Pages and local) ---
  function getRepoRootPath(){
    var baseEl = document.querySelector('base');
    if (baseEl && baseEl.href){
      try{
        var u = new URL(baseEl.href);
        return u.pathname.endsWith('/') ? u.pathname : (u.pathname + '/');
      }catch(_){}
    }
    var seg = (location.pathname || '/').split('/').filter(Boolean);
    // /MyRepo/...  -> "/MyRepo/"
    if (seg.length) return '/' + seg[0] + '/';
    return '/';
  }
  var root = getRepoRootPath();

  function url(p){ return root.replace(/\/+$/,'/') + String(p||'').replace(/^\/+/,''); }

  // --- Create or replace a <link> by rel + (optional) sizes ---
  function upsertLink(rel, href, sizes){
    var sel = 'link[rel="' + rel + '"]' + (sizes ? '[sizes="'+sizes+'"]' : '');
    var el  = document.head.querySelector(sel);
    if (!el){
      el = document.createElement('link');
      el.setAttribute('rel', rel);
      if (sizes) el.setAttribute('sizes', sizes);
      document.head.appendChild(el);
    }
    el.setAttribute('href', href);
    return el;
  }

  // --- Create or replace a <meta> by name ---
  function upsertMeta(name, content){
    var el = document.head.querySelector('meta[name="'+name+'"]');
    if (!el){
      el = document.createElement('meta');
      el.setAttribute('name', name);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
    return el;
  }

  // --- Inject icons (idempotent) ---
  function injectIcons(){
    // iOS A2HS icon
    upsertLink('apple-touch-icon', url('assets/icons/apple-touch-icon.png'), '180x180');

    // Standard favicons (use PNG—Safari/iOS is happy with these)
    upsertLink('icon', url('assets/icons/icon-192.png'), '192x192');
    upsertLink('icon', url('assets/icons/icon-512.png'), '512x512');

    // PWA maskable (nice on Android if your 512 is maskable)
    var mask = document.head.querySelector('link[rel="icon"][purpose="maskable"]');
    if (!mask){
      mask = document.createElement('link');
      mask.setAttribute('rel','icon');
      mask.setAttribute('sizes','512x512');
      mask.setAttribute('purpose','maskable');
      document.head.appendChild(mask);
    }
    mask.setAttribute('href', url('assets/icons/icon-512.png'));

    // iOS: tell Safari we’re okay as standalone (doesn’t hurt)
    upsertMeta('apple-mobile-web-app-capable', 'yes');
    upsertMeta('apple-mobile-web-app-status-bar-style', 'default'); // or 'black-translucent'
  }

  // Run as early as possible, but after <head> exists
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', injectIcons);
  } else {
    injectIcons();
  }
})();
</script>
