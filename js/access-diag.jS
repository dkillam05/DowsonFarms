// js/access-diag.js
// Visual diagnostics for role-based nav. No writes. Safe to ship to prod or remove later.
import { loadAccess } from "./access.js";

(function injectStyles(){
  const css = `
  #dfDiag { position: sticky; top: 0; z-index: 9999; font: 13px/1.35 system-ui, -apple-system, Segoe UI, Roboto, Arial; 
            background:#fffbe7; border-bottom:1px solid #e8dba5; padding:10px; color:#333 }
  #dfDiag .row{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:4px 0}
  #dfDiag code{background:#0001;padding:2px 6px;border-radius:6px}
  #dfDiag .ok   { color:#0a6d0a; font-weight:600 }
  #dfDiag .err  { color:#b00020; font-weight:600 }
  #dfDiag table{ width:100%; border-collapse:collapse; margin-top:6px; background:#fff }
  #dfDiag th, #dfDiag td { border:1px solid #eee; padding:6px 8px; text-align:left; }
  #dfDiag th{ background:#faf6d8 }
  `;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);
})();

function normBase(pathname){
  // strip repo base so it matches DF_MENUS hrefs
  return pathname.startsWith("/DowsonFarms/") ? pathname.slice("/DowsonFarms/".length) : pathname.slice(1);
}

// Find the best matching rule key that applies to href
function bestRuleFor(href, perms){
  if (perms[href]) return href;
  let best = null;
  for (const k of Object.keys(perms)) {
    if (k.endsWith("/") && href.startsWith(k)) {
      if (!best || k.length > best.length) best = k;
    }
  }
  return best; // may be null
}

function flattenTopTiles(tiles){
  return (tiles || []).map(t => ({ label:t.label, href:t.href, icon:t.iconEmoji||"" }));
}

function renderTable(container, tiles, access){
  const tbl = document.createElement("table");
  tbl.innerHTML = `
    <thead>
      <tr>
        <th>Top Tile</th>
        <th>Path</th>
        <th>Visible?</th>
        <th>Matched Rule</th>
        <th>Rule Value</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const body = tbl.querySelector("tbody");

  tiles.forEach(t => {
    const ruleKey = bestRuleFor(t.href, access.permsByPath);
    const rule = ruleKey ? access.permsByPath[ruleKey] : null;
    const allow = access.can(t.href, "view");
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${t.icon} ${t.label}</td>
      <td><code>${t.href}</code></td>
      <td class="${allow?'ok':'err'}">${allow?'✅ allowed':'⛔ blocked'}</td>
      <td>${ruleKey ? `<code>${ruleKey}</code>` : '<span class="err">no rule</span>'}</td>
      <td>${rule ? `<code>${JSON.stringify(rule)}</code>` : ''}</td>
    `;
    body.appendChild(tr);
  });

  container.appendChild(tbl);
}

(async function run(){
  try{
    if (!window.DF_MENUS || !Array.isArray(window.DF_MENUS.tiles)) {
      console.warn("[diag] DF_MENUS missing; load assets/data/menus.js first.");
      return;
    }
    const access = await loadAccess();

    // Create bar
    const bar = document.createElement("div");
    bar.id = "dfDiag";

    // Basic identity
    const u = (window.firebaseAuth && window.firebaseAuth.currentUser) || null;
    const uid = u?.uid || "none";
    const email = u?.email || "unknown";
    const path = normBase(location.pathname);

    const roles = access.roleKeys?.length ? access.roleKeys.join(", ") : "(none)";
    const permsCount = Object.keys(access.permsByPath || {}).length;

    bar.innerHTML = `
      <div class="row">
        <strong>Diag —</strong>
        user: <code>${email}</code>
        uid: <code>${uid}</code>
        roles: <code>${roles}</code>
        perms keys: <code>${permsCount}</code>
        page: <code>${path}</code>
      </div>
      <div class="row">
        ${access.roleKeys?.includes("__builder__")
          ? '<span class="ok">BUILDER override is ON (full access)</span>'
          : '<span>Builder override: OFF</span>'}
      </div>
    `;

    // Table of top tiles visibility + rule that matched
    const tiles = flattenTopTiles(window.DF_MENUS.tiles);
    renderTable(bar, tiles, access);

    document.body.prepend(bar);

    // Also dump full object to console for deep inspect
    console.log("[DF_DIAG] access =", access);
    console.log("[DF_DIAG] permsByPath =", access.permsByPath);
  }catch(err){
    console.error("[diag] failed", err);
    const bar = document.createElement("div");
    bar.id = "dfDiag";
    bar.innerHTML = `<span class="err">Diag error:</span> <code>${String(err)}</code>`;
    document.body.prepend(bar);
  }
})();
