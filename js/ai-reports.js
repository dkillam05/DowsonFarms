/* Dowson Farms — AI Reports (Mock Mode, v5)
 * Single-column chat UI with inline mic + send arrow, TTS playback,
 * full history (open/rename/delete), and iOS-safe sizing.
 * Works without Firebase; uses localStorage. Injects its own minimal CSS.
 */

(() => {
  // Bump these keys if you want to reset mock data
  const STORAGE = { sessions: "df_ai_sessions_v5", messages: "df_ai_messages_v5" };

  let currentSessionId = null;
  let recognition = null, recognizing = false;

  // Browser capabilities
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const micSupported = !!SR;
  const synth = window.speechSynthesis;

  document.addEventListener("DOMContentLoaded", init);

  // ---------- Inject minimal CSS (keeps your theme intact)
  (function injectStyles(){
    if (document.getElementById("ai-inline-css")) return;
    const css = `
      /* Contain width on phones; no sideways scroll */
      .ai-wrap{
        width:100%;
        max-width:640px;              /* tuned for iPhone width */
        margin:0 auto;
        padding:8px 12px;
        display:grid; gap:12px;
        box-sizing:border-box;
      }
      /* Input group (pill) */
      .ai-inputwrap{
        position:relative;
        overflow:hidden;              /* keep icons inside */
        border-radius:12px;
        background:var(--tile-bg);
        border:1px solid var(--tile-border);
      }
      #ai-input{
        box-sizing:border-box;
        width:100%;
        padding:12px 96px 12px 12px;  /* space for mic + send */
        border:0;                     /* border handled by wrapper */
        background:transparent;
        resize:none; line-height:1.35; font-size:16px; min-height:48px;
      }
      #ai-input::placeholder{opacity:.65}

      /* Inline icons inside input */
      .ai-icon{
        position:absolute; top:50%; transform:translateY(-50%);
        width:36px; height:36px; border-radius:10px;
        display:flex; align-items:center; justify-content:center;
        cursor:pointer;
      }
      .ai-icon:disabled{opacity:.5; cursor:not-allowed}
      #ai-mic{
        right:48px;
        border:1px solid var(--tile-border);
        background:var(--tile-bg);
      }
      #ai-send{
        right:8px;
        border:none;
        background:#1B5E20; color:#fff;
      }

      /* Stream & bubbles */
      .ai-stream{ padding:6px 2px; overflow-x:hidden; }
      .msg{
        margin:8px 0; padding:12px 14px; border-radius:12px;
        max-width:100%;                 /* never wider than container */
        border:1px solid var(--tile-border);
        position:relative;
        word-wrap:break-word; overflow-wrap:break-word;
      }
      .msg.user{ background:var(--tile-bg) }
      .msg.assistant{ background:#fffef8 }
      :root[data-theme="dark"] .msg.assistant{ background:rgba(255,255,255,.05) }

      /* TTS button on assistant bubbles */
      .msg .play{
        position:absolute; top:8px; right:8px;
        border:1px solid var(--tile-border); background:var(--tile-bg);
        border-radius:8px; width:30px; height:30px;
        display:flex; align-items:center; justify-content:center;
        cursor:pointer; font-size:14px;
      }

      /* History */
      .ai-hdr{ display:flex; align-items:center; justify-content:space-between; gap:8px; flex-wrap:wrap }
      .ai-hdr-left{ display:flex; align-items:center; gap:8px }
      .ai-hdr-right{ display:flex; gap:8px; align-items:center }
      #ai-title{
        padding:8px 10px; border-radius:8px; border:1px solid var(--tile-border);
        background:var(--tile-bg); font-size:16px; min-width:220px;
      }
      .ai-history{ display:grid; gap:6px; margin-top:8px }
      .ai-item{
        display:flex; align-items:center; justify-content:space-between; gap:8px;
        padding:10px; border:1px solid var(--tile-border); background:var(--tile-bg); border-radius:10px;
      }
      .ai-item-main{ display:flex; align-items:center; gap:10px; min-width:0; cursor:pointer; }
      .ai-item-title{ white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:60vw }
      .ai-item-acts{ display:flex; gap:6px }
      .iconbtn{
        border:1px solid var(--tile-border); background:var(--tile-bg);
        border-radius:8px; height:30px; width:30px; display:flex; align-items:center; justify-content:center; cursor:pointer
      }
      .ai-note{ font-size:.9rem; opacity:.85 }
    `;
    const style = document.createElement("style");
    style.id = "ai-inline-css";
    style.textContent = css;
    document.head.appendChild(style);

    // Kill any accidental sideways scroll globally
    document.documentElement.style.overflowX = 'hidden';
  })();

  // ---------- Tiny helpers
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const now = () => Date.now();
  const nid = () => Math.random().toString(36).slice(2,10);
  const escapeHtml = (s) => (s||"").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  // ---------- Storage
  function getSessions(){ return JSON.parse(localStorage.getItem(STORAGE.sessions) || "[]"); }
  function setSessions(a){ localStorage.setItem(STORAGE.sessions, JSON.stringify(a)); }
  function getMessages(id){ const all = JSON.parse(localStorage.getItem(STORAGE.messages) || "{}"); return all[id] || []; }
  function setMessages(id,msgs){ const all = JSON.parse(localStorage.getItem(STORAGE.messages) || "{}"); all[id]=msgs; localStorage.setItem(STORAGE.messages, JSON.stringify(all)); }
  function touchSession(id, fields={}){
    const a = getSessions();
    const s = a.find(x=>x.id===id);
    if (s) Object.assign(s, { updatedAt: now() }, fields);
    setSessions(a); loadHistory();
  }

  // ---------- Boot
  function init(){
    renderLayout();
    bindUI();
    ensureAtLeastOneSession();
    loadHistory();
    openSession(currentSessionId);
    if (!micSupported) showMicNote();
  }

  // ---------- Layout injection (keeps your shell header/footer/breadcrumbs)
  function renderLayout(){
    const host = $(".content") || document.body;
    if ($(".ai-wrap")) return;
    host.innerHTML = `
      <div class="ai-wrap">
        <header>
          <label for="ai-input" style="display:block;font-size:.95rem;opacity:.8;margin:4px 0 6px;">Ask for a new report</label>
          <div class="ai-inputwrap">
            <textarea id="ai-input" rows="1" placeholder="Report message"></textarea>
            <button id="ai-mic" class="ai-icon" title="${micSupported ? "Hold to talk" : "Voice not available here"}">🎤</button>
            <button id="ai-send" class="ai-icon" title="Send" aria-label="Send">
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 12l16-7-7 16-2-6-7-3z" fill="currentColor"/></svg>
            </button>
          </div>
        </header>

        <section id="ai-stream" class="ai-stream"></section>

        <section style="border-top:1px solid var(--tile-border);padding-top:8px;">
          <div class="ai-hdr">
            <div class="ai-hdr-left">
              <button id="ai-history-toggle" class="iconbtn" aria-expanded="true">▾</button>
              <h3 style="margin:0;font-size:1rem;">History</h3>
            </div>
            <div class="ai-hdr-right">
              <input id="ai-title" placeholder="Untitled report" />
              <button id="ai-new" class="iconbtn" title="New session">＋</button>
            </div>
          </div>
          <div id="ai-history" class="ai-history"></div>
        </section>
      </div>
    `;
  }

  // ---------- Ensure we have a session
  function ensureAtLeastOneSession(){
    const arr = getSessions();
    if (arr.length === 0){
      const id = nid();
      setSessions([{ id, title:"Untitled report", updatedAt:now() }]);
      currentSessionId = id;
    } else {
      currentSessionId = arr.sort((a,b)=>b.updatedAt-a.updatedAt)[0].id;
    }
  }

  // ---------- Bind UI
  function bindUI(){
    $("#ai-send").addEventListener("click", onSend);
    $("#ai-input").addEventListener("keydown", e=>{
      autoGrow(e.target);
      if (e.key==="Enter" && !e.shiftKey){ e.preventDefault(); onSend(); }
    });

    // Mic behavior (browser-native only; iOS Safari usually not supported)
    const mic = $("#ai-mic");
    if (micSupported){
      mic.addEventListener("mousedown", startSTT);
      mic.addEventListener("mouseup", stopSTT);
      mic.addEventListener("mouseleave", stopSTT);
      mic.addEventListener("touchstart", startSTT, { passive:true });
      mic.addEventListener("touchend", stopSTT);
    } else {
      mic.disabled = true;
    }

    $("#ai-new").addEventListener("click", newSession);
    $("#ai-title").addEventListener("change", ()=>{
      const title = $("#ai-title").value.trim() || "Untitled report";
      touchSession(currentSessionId, { title });
    });

    $("#ai-history-toggle").addEventListener("click", ()=>{
      const list = $("#ai-history");
      const btn = $("#ai-history-toggle");
      const open = list.style.display !== "none";
      list.style.display = open ? "none" : "grid";
      btn.textContent = open ? "▸" : "▾";
      btn.setAttribute("aria-expanded", String(!open));
    });
  }

  // ---------- History
  function loadHistory(){
    const arr = getSessions().sort((a,b)=>b.updatedAt-a.updatedAt);
    const host = $("#ai-history");
    host.innerHTML = "";
    arr.forEach(s=>{
      const row = document.createElement("div");
      row.className = "ai-item";
      row.innerHTML = `
        <div class="ai-item-main" title="${escapeHtml(s.title)}">
          <span class="ai-item-title">${escapeHtml(s.title || "Untitled report")}</span>
          <span style="opacity:.7;font-size:.85rem;">${timeAgo(s.updatedAt)}</span>
        </div>
        <div class="ai-item-acts">
          <button class="iconbtn" title="Rename" data-act="rename">✏️</button>
          <button class="iconbtn" title="Delete" data-act="delete">🗑️</button>
          <button class="iconbtn" title="Open" data-act="open">↗︎</button>
        </div>
      `;
      row.querySelector('.ai-item-main').onclick = () => openSession(s.id);
      row.querySelector('[data-act="open"]').onclick = () => openSession(s.id);
      row.querySelector('[data-act="rename"]').onclick = () => renameSession(s.id);
      row.querySelector('[data-act="delete"]').onclick = () => deleteSession(s.id);
      host.appendChild(row);
    });
    const cur = arr.find(x=>x.id===currentSessionId);
    if (cur) $("#ai-title").value = cur.title || "Untitled report";
  }

  function renameSession(id){
    const arr = getSessions();
    const s = arr.find(x=>x.id===id);
    if (!s) return;
    const name = prompt("Rename report:", s.title || "Untitled report");
    if (name === null) return;
    s.title = name.trim() || "Untitled report";
    s.updatedAt = now();
    setSessions(arr);
    if (id === currentSessionId) $("#ai-title").value = s.title;
    loadHistory();
  }

  function deleteSession(id){
    if (!confirm("Delete this report and its messages?")) return;

    // remove messages
    const all = JSON.parse(localStorage.getItem(STORAGE.messages) || "{}");
    delete all[id];
    localStorage.setItem(STORAGE.messages, JSON.stringify(all));

    // remove session
    const arr = getSessions().filter(x=>x.id!==id);
    setSessions(arr);

    // if we deleted the current (or last), pick next or make a fresh one
    if (id === currentSessionId){
      if (arr.length) {
        currentSessionId = arr[0].id;
        openSession(currentSessionId);
      } else {
        newSession();
      }
    }
    loadHistory();
  }

  function newSession(){
    const id = nid();
    const arr = getSessions();
    arr.unshift({ id, title:"Untitled report", updatedAt:now() });
    setSessions(arr);
    currentSessionId = id;
    $("#ai-title").value = "Untitled report";
    $("#ai-stream").innerHTML = "";
    loadHistory();
  }

  // ---------- Chat core
  function openSession(id){
    currentSessionId = id;
    const msgs = getMessages(id);
    const host = $("#ai-stream");
    host.innerHTML = "";
    msgs.forEach(m => renderMessage(m));
    touchSession(id);
  }

  function onSend(){
    const ta = $("#ai-input");
    const text = ta.value.trim();
    if (!text) return;
    ta.value = "";
    autoGrow(ta, true);

    const msgs = getMessages(currentSessionId);
    msgs.push({ role:"user", content:text });
    setMessages(currentSessionId, msgs);
    renderMessage({ role:"user", content:text });

    // Mock assistant (stream-like)
    fakeAssistant(text);
  }

  function renderMessage(m){
    const host = $("#ai-stream");
    const div = document.createElement("div");
    div.className = `msg ${m.role}`;
    div.textContent = m.content;
    host.appendChild(div);

    if (m.role === "assistant"){
      const btn = document.createElement("button");
      btn.className = "play";
      btn.title = "Listen";
      btn.textContent = "🔊";
      btn.onclick = () => speak(div, m.content, btn);
      div.appendChild(btn);
    }

    host.scrollTop = host.scrollHeight;
  }

  function fakeAssistant(userText){
    const host = $("#ai-stream");
    const div = document.createElement("div");
    div.className = "msg assistant";
    host.appendChild(div);

    const txt = `Mock AI response to: "${userText}"

• Live version will use your farm data to generate a structured report.
• You’ll be able to export to PDF/CSV and save the session.
• Tip: Ask for “Daily harvest summary by field with moisture and bu/ac.”`;
    let i = 0;
    const t = setInterval(() => {
      div.textContent += txt[i++] || "";
      host.scrollTop = host.scrollHeight;
      if (i >= txt.length){
        clearInterval(t);

        const btn = document.createElement("button");
        btn.className = "play";
        btn.title = "Listen";
        btn.textContent = "🔊";
        btn.onclick = () => speak(div, txt, btn);
        div.appendChild(btn);

        const msgs = getMessages(currentSessionId);
        msgs.push({ role:"assistant", content:txt });
        setMessages(currentSessionId, msgs);
        touchSession(currentSessionId);
      }
    }, 18);
  }

  // ---------- Text-to-Speech playback
  function speak(container, text, btn){
    try {
      // stop any current speech
      if (synth.speaking || synth.pending){ synth.cancel(); }

      // toggle off if already playing this bubble
      if (btn.dataset.state === "playing"){
        btn.dataset.state = "";
        btn.textContent = "🔊";
        return;
      }

      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 1.0; utter.pitch = 1.0;
      utter.onstart = () => { btn.dataset.state = "playing"; btn.textContent = "⏸"; };
      utter.onend   = () => { btn.dataset.state = "";        btn.textContent = "🔊"; };
      utter.onerror = () => { btn.dataset.state = "";        btn.textContent = "🔊"; };
      synth.speak(utter);
    } catch(e) {
      console.warn("TTS failed:", e);
    }
  }

  // ---------- Mic (browser-native only; iOS Safari often stops early)
  function startSTT(e){
    e.preventDefault?.();
    if (!micSupported || recognizing) return;
    recognition = new SR();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognizing = true;
    $("#ai-mic").classList.add("active");

    recognition.onresult = (ev)=>{
      let text = "";
      for (let i=ev.resultIndex;i<ev.results.length;i++){
        text += ev.results[i][0].transcript;
      }
      const ta = $("#ai-input");
      ta.value = text; autoGrow(ta);
    };
    recognition.onend = ()=>{
      recognizing = false;
      $("#ai-mic").classList.remove("active");
      // If the mic stops immediately (common on iOS), show a small note
      if (!$("#ai-mic-note")){
        const n = document.createElement("div");
        n.id = "ai-mic-note";
        n.className = "ai-note";
        n.textContent = "If the mic stops right away, your browser limits on-device dictation. In the live build we’ll use server transcription so this works on iPhone.";
        const wrap = $(".ai-wrap");
        const inputwrap = wrap?.querySelector(".ai-inputwrap");
        inputwrap && inputwrap.insertAdjacentElement("afterend", n);
      }
    };
    try { recognition.start(); } catch {}
  }
  function stopSTT(e){ e?.preventDefault?.(); try{ recognition && recognition.stop(); }catch{} }

  // ---------- Utilities
  function autoGrow(el, reset=false){
    if (reset) el.style.height = "auto";
    el.style.height = "1px";
    el.style.height = Math.min(160, el.scrollHeight) + "px";
  }
  function timeAgo(ts){
    const s = Math.floor((now()-ts)/1000);
    if (s<60) return "just now";
    const m = Math.floor(s/60); if (m<60) return `${m}m ago`;
    const h = Math.floor(m/60); if (h<24) return `${h}h ago`;
    const d = Math.floor(h/24); return `${d}d ago`;
  }
  function showMicNote(){
    const wrap = $(".ai-wrap");
    const inputwrap = wrap?.querySelector(".ai-inputwrap");
    const n = document.createElement("div");
    n.className = "ai-note";
    n.textContent = "Voice dictation isn’t available in this browser. We’ll enable server transcription in the live build.";
    inputwrap && inputwrap.insertAdjacentElement("afterend", n);
  }
})();
