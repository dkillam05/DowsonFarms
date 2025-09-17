/* Dowson Farms — AI Reports (Mock Mode)
 * Chat-style single column, mobile-safe
 * - Input bar with inline mic + send arrow (ChatGPT-like)
 * - LocalStorage sessions/messages
 * - History: open, rename, delete
 * - iOS: 16px inputs to prevent zoom; mic gracefully disabled if unsupported
 */

(() => {
  const STORAGE = { sessions: "df_ai_sessions_v3", messages: "df_ai_messages_v3" };
  let currentSessionId = null;
  let recognition = null, recognizing = false;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const micSupported = !!SR;

  document.addEventListener("DOMContentLoaded", init);

  // inject minimal CSS so we don't touch theme.css right now
  (function injectStyles() {
    if (document.getElementById("ai-inline-css")) return;
    const css = `
    .ai-wrap{max-width:980px;margin:0 auto;padding:8px 12px;display:grid;gap:12px}
    .ai-inputwrap{position:relative}
    #ai-input{width:100%;padding:12px 96px 12px 12px;border-radius:12px;border:1px solid var(--tile-border);
      background:var(--tile-bg);resize:none;line-height:1.35;font-size:16px;min-height:48px}
    .ai-icon{position:absolute;top:50%;transform:translateY(-50%);border:0;background:transparent;cursor:pointer;
      width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center}
    .ai-icon:disabled{opacity:.5;cursor:not-allowed}
    #ai-mic{right:48px;border:1px solid var(--tile-border);background:var(--tile-bg)}
    #ai-send{right:8px;background:#1B5E20;color:#fff}
    .ai-stream{padding:6px 2px}
    .msg{margin:8px 0;padding:12px 14px;border-radius:12px;max-width:900px;border:1px solid var(--tile-border)}
    .msg.user{background:var(--tile-bg)}
    .msg.assistant{background:#fffef8}
    :root[data-theme="dark"] .msg.assistant{background:rgba(255,255,255,.05)}
    .ai-hdr{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
    .ai-hdr-right{display:flex;gap:8px;align-items:center}
    #ai-title{padding:8px 10px;border-radius:8px;border:1px solid var(--tile-border);background:var(--tile-bg);font-size:16px;min-width:220px}
    .ai-history{display:grid;gap:6px;margin-top:8px}
    .ai-item{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px;border:1px solid var(--tile-border);
      background:var(--tile-bg);border-radius:10px}
    .ai-item-main{display:flex;align-items:center;gap:10px;min-width:0}
    .ai-item-title{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:60vw}
    .ai-item-acts{display:flex;gap:6px}
    .iconbtn{border:1px solid var(--tile-border);background:var(--tile-bg);border-radius:8px;height:30px;width:30px;display:flex;align-items:center;justify-content:center;cursor:pointer}
    .ai-note{font-size:.9rem;opacity:.85}
    `;
    const style = document.createElement("style");
    style.id = "ai-inline-css";
    style.textContent = css;
    document.head.appendChild(style);
  })();

  const $ = (sel, root = document) => root.querySelector(sel);

  function init() {
    renderLayout();
    bindUI();
    ensureFirstSession();
    loadHistory();
    openSession(currentSessionId);
    if (!micSupported) showMicNote();
  }

  function renderLayout() {
    const host = $(".content") || document.body;
    if ($(".ai-wrap")) return;
    host.innerHTML = `
      <div class="ai-wrap">
        <header class="ai-toolbar">
          <label for="ai-input" style="display:block;font-size:.95rem;opacity:.8;margin:4px 0 6px;">Ask for a new report</label>
          <div class="ai-inputwrap">
            <textarea id="ai-input" rows="1" placeholder="e.g., Daily harvest summary by field with moisture & bu/ac"></textarea>
            <button id="ai-mic" class="ai-icon" title="${micSupported ? "Hold to talk" : "Voice not available here"}">🎤</button>
            <button id="ai-send" class="ai-icon" title="Send" aria-label="Send">
              <!-- simple arrow -->
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

  // -------- sessions / storage
  function ensureFirstSession() {
    const s = getSessions();
    if (s.length === 0) {
      const id = uid();
      setSessions([{ id, title: "Untitled report", updatedAt: Date.now() }]);
      currentSessionId = id;
    } else {
      currentSessionId = s.sort((a,b)=>b.updatedAt-a.updatedAt)[0].id;
    }
  }
  function getSessions(){ return JSON.parse(localStorage.getItem(STORAGE.sessions) || "[]"); }
  function setSessions(arr){ localStorage.setItem(STORAGE.sessions, JSON.stringify(arr)); }
  function getMessages(id){ const all = JSON.parse(localStorage.getItem(STORAGE.messages) || "{}"); return all[id] || []; }
  function setMessages(id,msgs){ const all = JSON.parse(localStorage.getItem(STORAGE.messages) || "{}"); all[id]=msgs; localStorage.setItem(STORAGE.messages, JSON.stringify(all)); }
  function touchSession(id, fields={}) {
    const arr = getSessions();
    const s = arr.find(x=>x.id===id);
    if (s) Object.assign(s, { updatedAt: Date.now() }, fields);
    setSessions(arr); loadHistory();
  }
  const uid = () => Math.random().toString(36).slice(2,10);

  // -------- UI bindings
  function bindUI() {
    // send on click
    $("#ai-send").addEventListener("click", onSend);
    // send on Enter (no Shift)
    $("#ai-input").addEventListener("keydown", e => {
      autoGrow(e.target);
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); }
    });

    // mic behavior
    const mic = $("#ai-mic");
    if (micSupported) {
      mic.addEventListener("mousedown", startSTT);
      mic.addEventListener("mouseup", stopSTT);
      mic.addEventListener("mouseleave", stopSTT);
      mic.addEventListener("touchstart", startSTT, { passive: true });
      mic.addEventListener("touchend", stopSTT);
    } else {
      mic.disabled = true;
    }

    $("#ai-new").addEventListener("click", newSession);

    $("#ai-title").addEventListener("change", () => {
      const title = $("#ai-title").value.trim() || "Untitled report";
      touchSession(currentSessionId, { title });
    });

    $("#ai-history-toggle").addEventListener("click", () => {
      const list = $("#ai-history");
      const btn = $("#ai-history-toggle");
      const open = list.style.display !== "none";
      list.style.display = open ? "none" : "grid";
      btn.textContent = open ? "▸" : "▾";
      btn.setAttribute("aria-expanded", String(!open));
    });
  }

  // -------- history rendering (+ rename / delete)
  function loadHistory() {
    const arr = getSessions().sort((a,b)=>b.updatedAt-a.updatedAt);
    const host = $("#ai-history");
    host.innerHTML = "";
    arr.forEach(s => {
      const row = document.createElement("div");
      row.className = "ai-item";
      row.innerHTML = `
        <div class="ai-item-main" title="${escape(s.title)}">
          <span class="ai-item-title">${escape(s.title || "Untitled report")}</span>
          <span style="opacity:.7;font-size:.85rem;">${ago(s.updatedAt)}</span>
        </div>
        <div class="ai-item-acts">
          <button class="iconbtn" title="Rename" data-act="rename">✏️</button>
          <button class="iconbtn" title="Delete" data-act="delete">🗑️</button>
          <button class="iconbtn" title="Open" data-act="open">↗︎</button>
        </div>
      `;
      row.querySelector('[data-act="open"]').onclick = () => openSession(s.id);
      row.querySelector('[data-act="rename"]').onclick = () => renameSession(s.id);
      row.querySelector('[data-act="delete"]').onclick = () => deleteSession(s.id);
      host.appendChild(row);
    });
    const cur = arr.find(x => x.id === currentSessionId);
    if (cur) $("#ai-title").value = cur.title || "Untitled report";
  }

  function renameSession(id) {
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

  function deleteSession(id) {
    if (!confirm("Delete this report and its messages?")) return;
    const arr = getSessions().filter(x=>x.id!==id);
    setSessions(arr);
    // remove messages
    const all = JSON.parse(localStorage.getItem(STORAGE.messages) || "{}");
    delete all[id];
    localStorage.setItem(STORAGE.messages, JSON.stringify(all));

    if (id === currentSessionId) {
      if (arr.length) {
        currentSessionId = arr[0].id;
        openSession(currentSessionId);
      } else {
        newSession();
      }
    }
    loadHistory();
  }

  function newSession() {
    const id = uid();
    const arr = getSessions();
    arr.unshift({ id, title: "Untitled report", updatedAt: Date.now() });
    setSessions(arr);
    currentSessionId = id;
    $("#ai-title").value = "Untitled report";
    $("#ai-stream").innerHTML = "";
    loadHistory();
  }

  // -------- open / send / render
  function openSession(id) {
    currentSessionId = id;
    const msgs = getMessages(id);
    const host = $("#ai-stream");
    host.innerHTML = "";
    msgs.forEach(m => renderMsg(m));
    touchSession(id);
  }

  function onSend() {
    const ta = $("#ai-input");
    const text = ta.value.trim();
    if (!text) return;
    ta.value = "";
    autoGrow(ta, true);

    const msgs = getMessages(currentSessionId);
    msgs.push({ role: "user", content: text });
    setMessages(currentSessionId, msgs);
    renderMsg({ role: "user", content: text });
    fakeAssistant(text);
  }

  function renderMsg(m) {
    const host = $("#ai-stream");
    const div = document.createElement("div");
    div.className = `msg ${m.role}`;
    div.textContent = m.content;
    host.appendChild(div);
    host.scrollTop = host.scrollHeight;
  }

  function fakeAssistant(userText) {
    const host = $("#ai-stream");
    const div = document.createElement("div");
    div.className = "msg assistant";
    host.appendChild(div);

    const txt = `Mock AI response to: "${userText}"

• Live version will use your farm data to generate a structured report.
• Export (PDF/CSV) and advanced filters will be available in the live build.
• Try: “Daily harvest summary by field, include moisture and bu/ac.”`;
    let i = 0;
    const t = setInterval(() => {
      div.textContent += txt[i++] || "";
      host.scrollTop = host.scrollHeight;
      if (i >= txt.length) {
        clearInterval(t);
        const msgs = getMessages(currentSessionId);
        msgs.push({ role: "assistant", content: txt });
        setMessages(currentSessionId, msgs);
        touchSession(currentSessionId);
      }
    }, 18);
  }

  // -------- mic
  function startSTT(e){
    e.preventDefault?.();
    if (!micSupported || recognizing) return;
    recognition = new SR();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognizing = true;
    $("#ai-mic").classList.add("active");
    recognition.onresult = (ev) => {
      let text = "";
      for (let i=ev.resultIndex;i<ev.results.length;i++){
        text += ev.results[i][0].transcript;
      }
      const ta = $("#ai-input");
      ta.value = text;
      autoGrow(ta);
    };
    recognition.onend = () => {
      recognizing = false;
      $("#ai-mic").classList.remove("active");
    };
    try { recognition.start(); } catch {}
  }
  function stopSTT(e){ e?.preventDefault?.(); try{ recognition && recognition.stop(); }catch{} }

  // -------- utils
  function autoGrow(el, reset=false){
    if (reset) el.style.height = "auto";
    el.style.height = "1px";
    el.style.height = Math.min(160, el.scrollHeight) + "px";
  }
  const escape = s => (s||"").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function ago(ts){
    const s = Math.floor((Date.now()-ts)/1000);
    if (s<60) return "just now";
    const m = Math.floor(s/60); if (m<60) return `${m}m ago`;
    const h = Math.floor(m/60); if (h<24) return `${h}h ago`;
    const d = Math.floor(h/24); return `${d}d ago`;
  }
  function showMicNote(){
    const note = document.createElement("div");
    note.className = "ai-note";
    note.textContent = "Voice dictation on iPhone will be enabled when we add server transcription.";
    const wrap = $(".ai-wrap");
    const toolbar = wrap?.querySelector(".ai-inputwrap");
    toolbar && toolbar.insertAdjacentElement("afterend", note);
  }
})();