/* Dowson Farms — AI Reports (Mock Mode, v4)
 * - Single-column, farm-themed
 * - Inline mic + send arrow inside the input
 * - Placeholder: "Report message"
 * - TTS playback for assistant replies (🔊)
 * - History: open / rename / delete (no locked item)
 * - iOS-safe: 16px inputs (no zoom), graceful mic handling
 */

(() => {
  const STORAGE = { sessions: "df_ai_sessions_v4", messages: "df_ai_messages_v4" };

  let currentSessionId = null;
  let recognition = null, recognizing = false;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const micSupported = !!SR;
  const synth = window.speechSynthesis;

  document.addEventListener("DOMContentLoaded", init);

  // ---- minimal CSS (keeps theme)
  (function injectStyles(){
    if (document.getElementById("ai-inline-css")) return;
    const css = `
      .ai-wrap{max-width:980px;margin:0 auto;padding:8px 12px;display:grid;gap:12px}
      .ai-inputwrap{position:relative}
      #ai-input{
        width:100%; padding:12px 96px 12px 12px; border-radius:12px;
        border:1px solid var(--tile-border); background:var(--tile-bg);
        resize:none; line-height:1.35; font-size:16px; min-height:48px
      }
      #ai-input::placeholder{opacity:.65}
      .ai-icon{
        position:absolute; top:50%; transform:translateY(-50%);
        width:36px; height:36px; border-radius:10px;
        display:flex; align-items:center; justify-content:center;
        border:1px solid var(--tile-border); background:var(--tile-bg);
        cursor:pointer
      }
      .ai-icon:disabled{opacity:.5; cursor:not-allowed}
      #ai-mic{ right:48px }
      #ai-send{
        right:8px; border:none; background:#1B5E20; color:#fff
      }
      .ai-stream{ padding:6px 2px }
      .msg{ margin:8px 0; padding:12px 14px; border-radius:12px; max-width:900px; border:1px solid var(--tile-border); position:relative }
      .msg.user{ background:var(--tile-bg) }
      .msg.assistant{ background:#fffef8 }
      :root[data-theme="dark"] .msg.assistant{ background:rgba(255,255,255,.05) }
      .msg .play{ position:absolute; top:8px; right:8px; border:1px solid var(--tile-border); background:var(--tile-bg); border-radius:8px; width:30px; height:30px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:14px }
      .ai-hdr{ display:flex; align-items:center; justify-content:space-between; gap:8px; flex-wrap:wrap }
      .ai-hdr-right{ display:flex; gap:8px; align-items:center }
      #ai-title{ padding:8px 10px; border-radius:8px; border:1px solid var(--tile-border); background:var(--tile-bg); font-size:16px; min-width:220px }
      .ai-history{ display:grid; gap:6px; margin-top:8px }
      .ai-item{ display:flex; align-items:center; justify-content:space-between; gap:8px; padding:10px; border:1px solid var(--tile-border); background:var(--tile-bg); border-radius:10px }
      .ai-item-main{ display:flex; align-items:center; gap:10px; min-width:0 }
      .ai-item-title{ white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:60vw }
      .ai-item-acts{ display:flex; gap:6px }
      .iconbtn{ border:1px solid var(--tile-border); background:var(--tile-bg); border-radius:8px; height:30px; width:30px; display:flex; align-items:center; justify-content:center; cursor:pointer }
      .ai-note{ font-size:.9rem; opacity:.85 }
    `;
    const style = document.createElement("style");
    style.id = "ai-inline-css"; style.textContent = css;
    document.head.appendChild(style);
  })();

  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  function init(){
    renderLayout();
    bindUI();
    ensureAtLeastOneSession();
    loadHistory();
    openSession(currentSessionId);
    if (!micSupported) showMicNote();
  }

  // ---------- layout
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
            <div style="display:flex;align-items:center;gap:8px;">
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

  // ---------- sessions & storage
  function ensureAtLeastOneSession(){
    const arr = getSessions();
    if (arr.length === 0){
      const id = nid();
      setSessions([{ id, title:"Untitled report", updatedAt:Date.now() }]);
      currentSessionId = id;
    } else {
      currentSessionId = arr.sort((a,b)=>b.updatedAt-a.updatedAt)[0].id;
    }
  }
  function getSessions(){ return JSON.parse(localStorage.getItem(STORAGE.sessions) || "[]"); }
  function setSessions(a){ localStorage.setItem(STORAGE.sessions, JSON.stringify(a)); }
  function getMessages(id){ const all = JSON.parse(localStorage.getItem(STORAGE.messages) || "{}"); return all[id] || []; }
  function setMessages(id,msgs){ const all = JSON.parse(localStorage.getItem(STORAGE.messages) || "{}"); all[id]=msgs; localStorage.setItem(STORAGE.messages, JSON.stringify(all)); }
  function touchSession(id, fields={}){
    const a = getSessions();
    const s = a.find(x=>x.id===id);
    if (s) Object.assign(s, { updatedAt: Date.now() }, fields);
    setSessions(a); loadHistory();
  }
  const nid = () => Math.random().toString(36).slice(2,10);

  // ---------- UI
  function bindUI(){
    // send
    $("#ai-send").addEventListener("click", onSend);
    $("#ai-input").addEventListener("keydown", e=>{
      autoGrow(e.target);
      if (e.key==="Enter" && !e.shiftKey){ e.preventDefault(); onSend(); }
    });

    // mic
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

  // ---------- history (open/rename/delete)
  function loadHistory(){
    const arr = getSessions().sort((a,b)=>b.updatedAt-a.updatedAt);
    const host = $("#ai-history");
    host.innerHTML = "";
    arr.forEach(s=>{
      const row = document.createElement("div");
      row.className = "ai-item";
      row.innerHTML = `
        <div class="ai-item-main" title="${escapeHtml(s.title)}" style="cursor:pointer;">
          <span class="ai-item-title">${escapeHtml(s.title || "Untitled report")}</span>
          <span style="opacity:.7;font-size:.85rem;">${ago(s.updatedAt)}</span>
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
    s.updatedAt = Date.now();
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

    // choose next session
    if (id === currentSessionId){
      if (arr.length) {
        currentSessionId = arr[0].id;
        openSession(currentSessionId);
      } else {
        // create a fresh one so nothing is "locked"
        newSession();
      }
    }
    loadHistory();
  }

  function newSession(){
    const id = nid();
    const arr = getSessions();
    arr.unshift({ id, title:"Untitled report", updatedAt:Date.now() });
    setSessions(arr);
    currentSessionId = id;
    $("#ai-title").value = "Untitled report";
    $("#ai-stream").innerHTML = "";
    loadHistory();
  }

  // ---------- chat core
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

    fakeAssistant(text);
  }

  function renderMessage(m){
    const host = $("#ai-stream");
    const div = document.createElement("div");
    div.className = `msg ${m.role}`;
    div.textContent = m.content;
    host.appendChild(div);

    if (m.role === "assistant"){
      // add TTS play button
      const btn = document.createElement("button");
      btn.className = "play";
      btn.title = "Listen";
      btn.textContent = "🔊";
      btn.onclick = () => speak(div, m.content, btn);
      div.appendChild(btn);
    }

    host.scrollTop = host.scrollHeight;
  }

  // ---------- mock assistant (streaming feel)
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
        // add TTS button after stream finishes
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

  // ---------- Text-to-Speech (play/pause)
  function speak(container, text, btn){
    try {
      // stop any current speech
      if (synth.speaking || synth.pending){ synth.cancel(); }

      // if clicked while speaking same bubble, act as stop
      if (btn.dataset.state === "playing"){
        btn.dataset.state = "";
        return;
      }

      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 1.0; utter.pitch = 1.0;
      utter.onstart = () => { btn.dataset.state = "playing"; btn.textContent = "⏸"; };
      utter.onend = () => { btn.dataset.state = ""; btn.textContent = "🔊"; };
      utter.onerror = () => { btn.dataset.state = ""; btn.textContent = "🔊"; };
      synth.speak(utter);
    } catch(e) {
      console.warn("TTS failed:", e);
    }
  }

  // ---------- mic / STT (browser-native only)
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
      // Some iOS builds prompt then stop immediately; show a tiny note
      if (!$("#ai-mic-note")){
        const n = document.createElement("div");
        n.id = "ai-mic-note";
        n.className = "ai-note";
        n.textContent = "If the mic stops right away, your browser limits on-device dictation. In the live build we’ll use server transcription so this works reliably on iPhone.";
        const wrap = $(".ai-wrap");
        const inputwrap = wrap?.querySelector(".ai-inputwrap");
        inputwrap && inputwrap.insertAdjacentElement("afterend", n);
      }
    };
    try { recognition.start(); } catch {}
  }
  function stopSTT(e){ e?.preventDefault?.(); try{ recognition && recognition.stop(); }catch{} }

  // ---------- helpers
  function autoGrow(el, reset=false){
    if (reset) el.style.height = "auto";
    el.style.height = "1px";
    el.style.height = Math.min(160, el.scrollHeight) + "px";
  }
  function ago(ts){
    const s = Math.floor((Date.now()-ts)/1000);
    if (s<60) return "just now";
    const m = Math.floor(s/60); if (m<60) return `${m}m ago`;
    const h = Math.floor(m/60); if (h<24) return `${h}h ago`;
    const d = Math.floor(h/24); return `${d}d ago`;
  }
  function escapeHtml(s){ return (s||"").replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function showMicNote(){
    const wrap = $(".ai-wrap");
    const inputwrap = wrap?.querySelector(".ai-inputwrap");
    const n = document.createElement("div");
    n.className = "ai-note";
    n.textContent = "Voice dictation isn’t available in this browser. We’ll enable server transcription in the live build.";
    inputwrap && inputwrap.insertAdjacentElement("afterend", n);
  }
})();