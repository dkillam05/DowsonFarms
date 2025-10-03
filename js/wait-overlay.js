// js/wait-overlay.js
// Global "Please wait" overlay with spinner + enforced visible delay

let overlayShownAt = 0;

/**
 * Show the wait overlay with optional message
 * @param {string} msg - Message to display
 */
export function showWait(msg = "Please wait…") {
  let el = document.getElementById("waitOverlay");
  if (!el) {
    el = document.createElement("div");
    el.id = "waitOverlay";
    Object.assign(el.style, {
      position: "fixed",
      inset: "0",
      background: "rgba(242,240,228,0.92)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 99999,
      backdropFilter: "blur(3px)"
    });
    el.innerHTML = `
      <div style="text-align:center;color:#143231;font-size:18px;font-weight:600">
        ${msg}<br/><br/>
        <div class="spinner"
             style="margin:auto;width:40px;height:40px;
                    border:4px solid rgba(159,191,111,0.45);
                    border-top:4px solid #365E5A;
                    border-radius:50%;
                    animation:spin 1s linear infinite"></div>
        <style>
          @keyframes spin {
            0%   { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </div>`;
    document.body.appendChild(el);
  } else {
    el.querySelector("div").firstChild.nodeValue = msg;
  }

  overlayShownAt = Date.now(); // track when overlay was shown
}

/**
 * Hide the wait overlay, but enforce a minimum visible time
 * @param {number} minVisibleMs - Minimum time overlay should remain visible
 */
export function hideWait(minVisibleMs = 3000) {
  const el = document.getElementById("waitOverlay");
  if (!el) return;

  const elapsed = Date.now() - overlayShownAt;
  const delay = Math.max(0, minVisibleMs - elapsed);

  setTimeout(() => {
    const el2 = document.getElementById("waitOverlay");
    if (el2) el2.remove();
  }, delay);
}