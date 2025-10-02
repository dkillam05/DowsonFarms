// Dowson Farms — Global wait overlay (blur + spinner)
// Usage: DFWait.show("Checking sign-in…");  DFWait.hide();

(function () {
  if (window.DFWait) return; // singleton

  // Inject minimal CSS once
  const css = `
    #dfWaitBackdrop {
      position: fixed; inset: 0; z-index: 9998;
      background: rgba(15,90,26,.35); backdrop-filter: blur(1px);
      opacity: 0; visibility: hidden; transition: opacity .18s ease;
    }
    #dfWaitCard {
      position: fixed; inset: 0; display: grid; place-items: center; z-index: 9999;
      pointer-events: none; opacity: 0; visibility: hidden; transition: opacity .18s ease;
    }
    #dfWaitCard > div {
      pointer-events: auto;
      background: #fff; color: #123;
      border-radius: 14px; border: 1px solid #0002;
      box-shadow: 0 10px 30px rgba(0,0,0,.15);
      padding: 16px 18px; min-width: 220px; text-align: center;
      font: 600 16px/1.3 system-ui, -apple-system, Segoe UI, Roboto, Arial;
    }
    #dfWaitSpinner {
      width: 34px; height: 34px; margin: 10px auto 4px;
      border-radius: 50%;
      border: 4px solid #e6f0e8; border-top-color: #0f5a1a;
      animation: dfspin 1s linear infinite;
    }
    @keyframes dfspin { to { transform: rotate(360deg); } }

    /* Page blur while waiting */
    .df-wait-blur .app-header,
    .df-wait-blur main,
    .df-wait-blur #drawer,
    .df-wait-blur footer { filter: blur(2px); }

    /* Show state */
    .df-wait-show #dfWaitBackdrop,
    .df-wait-show #dfWaitCard { opacity: 1; visibility: visible; }
  `;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  // Create DOM
  const back = document.createElement("div");
  back.id = "dfWaitBackdrop";
  const cardWrap = document.createElement("div");
  cardWrap.id = "dfWaitCard";
  const card = document.createElement("div");
  card.innerHTML = `
    <div id="dfWaitSpinner"></div>
    <div id="dfWaitText">Please wait…</div>
  `;
  cardWrap.appendChild(card);
  document.body.append(back, cardWrap);

  function show(msg) {
    document.body.classList.add("df-wait-show", "df-wait-blur");
    const t = document.getElementById("dfWaitText");
    if (t) t.textContent = msg || "Please wait…";
  }
  function hide() {
    document.body.classList.remove("df-wait-show", "df-wait-blur");
  }

  window.DFWait = { show, hide };
})();
