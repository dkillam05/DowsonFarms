/* Dowson Farms — AI Reports (Mock Mode, Single-Column)
 * File: ai-reports.js (root)
 * Layout: Top input bar (+ mic) → live chat → collapsible History list
 * Storage: localStorage (sessions + messages)
 */

(() => {
  const STORAGE = {
    sessions: "df_ai_sessions_v2",
    messages: "df_ai_messages_v2"
  };

  let currentSessionId = null;
  let recognition = null;
  let recognizing = false;

  document.addEventListener("DOMContentLoaded", init);

  // ---- DOM helpers
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function init() {
    ensureLayout();
    bindUI();
    ensureFirstSession();
    loadHistory();
    openSession(currentSessionId);
  }

  // ---- Inject layout into .content (keeps your header/breadcrumbs/footer)
  function ensureLayout() {
    const host = $(".content") || document.body;
    if ($(".ai-wrap")) return;

    host.innerHTML = `
      <div class="ai-wrap" style="display:grid;gap:12px;min-height:60vh;">
        <!-- Top Input Toolbar -->
        <header class="ai-toolbar" style="display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap;">
          <div style="flex:1;min-width:260px;">
            <label for="ai-input" style="display:block;font-size:.9rem;opacity:.8;margin-bottom:4px;">Ask for a new report</label>
            <textarea id="ai-input" rows="1" placeholder="e.g., Daily harvest summary by field with moisture & bu/ac"
              style="width:100%;padding:10px 12px;border-radius:10px;border:1px solid var(--tile-border);background:var(--tile-bg);resize:none;"></textarea>
          </div>
          <div class="ai-controls" style="display:flex;gap:8px;">
            <button id="ai-mic" class="btn" title="Hold to talk" style="border:1px solid var(--tile-border);background:var(--tile-bg);border-radius:10px;padding:8px 12px;">🎤</button>
            <button id="ai-send" class="btn primary" style="padding:10px 14px;border-radius:10px;border:none;background:#1B5E20;color:#fff;">Send</button>
          </div>
        </header>

        <!-- Live Chat Stream -->
        <section id="ai-stream" class="ai-stream" style="padding:6px 2px;overflow:auto;"></section>

        <!-- History (collapsible) -->
        <section class="ai-history-section" style="border-top:1px solid var(--tile-border);padding-top:8px;">
          <div class="ai-history-head" style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <button id="ai-history-toggle" class="btn" aria-expanded="true"
                style="border:1px solid var(--tile-border);background:var(--tile-bg);border-radius:10px;padding:4px 10px;">▾</button>
              <h3 style="margin:0;font-size:1rem;">History</h3>
            </div>
            <div style="display:flex;gap:8px;">
              <input id="ai-title" placeholder="Untitled report" style="padding:6px 10px;border-radius:8px;border:1px solid var(--tile-border);background:var(--tile-bg);" />
              <button id="ai-new" class="btn" style="border:1px solid var(--tile-border);background:var(--tile-bg);border-radius:10px;padding:6px 10px;">+ New</button>
            </div>
          </div>
          <div id="ai-history" class="ai-history" style="display:grid;gap:6px;margin-top:8px;"></div>
        </section>
      </div>
    `;
  }

  // ---- Sessions & Storage
  function ensureFirstSession() {
    const sessions = getSessions();
    if (sessions.length === 0) {
      const id = genId();
      const now = Date.now();
      saveSessions([{ id, title: "Untitled report", updatedAt: now }]);
      currentSessionId = id;
    } else {
      currentSessionId = sessions.sort((a,b)=>b.updatedAt-a.updatedAt)[0].id;
    }
  }
  function getSessions() {
    return JSON.parse(localStorage.getItem(STORAGE.sessions) || "[]");
  }
  function saveSessions(arr) {
    localStorage.setItem(STORAGE.sessions, JSON.stringify(arr));
  }
  function getMessages(sessionId) {
    const all = JSON.parse(localStorage.getItem(STORAGE.messages) || "{}");
    return all[sessionId] || [];
  }
  function saveMessages(sessionId, msgs) {
    const all = JSON.parse(localStorage.getItem(STORAGE.messages) || "{}");
    all[sessionId] = msgs;
    localStorage.setItem(STORAGE.messages, JSON.stringify(all));
  }
  function touchSession(id, fields = {}) {
    const sessions = getSessions();
    const s = sessions.find(x => x.id === id);
    if (s) Object.assign(s, { updatedAt: Date.now() }, fields);
    saveSessions(sessions);
    loadHistory();
  }
  const genId = () => Math.random().toString(36).slice(2, 10);

  // ---- UI Bindings
  function bindUI() {
    $("#ai-send").addEventListener("click", onSend);
    $("#ai-input").addEventListener("keydown", e => {
      autoGrow(e.target);
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); }
    });

    // Mic (Web Speech API)
    const mic = $("#ai-mic");
    mic.addEventListener("mousedown", startSTT);
    mic.addEventListener("mouseup", stopSTT);
    mic.addEventListener("mouseleave", stopSTT);
    mic.addEventListener("touchstart", startSTT, { passive: true });
    mic.addEventListener("touchend", stopSTT);

    $("#ai-new").addEventListener("click", () => {
      const id = genId();
      const sessions = getSessions();
      sessions.unshift({ id, title: "Untitled report", updatedAt: Date.now() });
      saveSessions(sessions);
      currentSessionId = id;
      $("#ai-title").value = "Untitled report";
      $("#ai-stream").innerHTML = "";
      loadHistory();
    });

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

  // ---- History rendering
  function loadHistory() {
    const sessions = getSessions().sort((a,b)=>b.updatedAt-a.updatedAt);
    const host = $("#ai-history");
    host.innerHTML = "";
    sessions.forEach(s => {
      const div = document.createElement("div");
      div.className = "ai-history-item";
      div.style.cssText = "padding:8px;border:1px solid var(--tile-border);border-radius:8px;background:var(--tile-bg);cursor:pointer;display:flex;justify-content:space-between;gap:10px;";
      div.innerHTML = `<span>${escapeHtml(s.title || "Untitled report")}</span><span style="opacity:.7;font-size:.85rem;">${timeAgo(s.updatedAt)}</span>`;
      div.onclick = () => { openSession(s.id); };
      host.appendChild(div);
    });

    // keep title in sync with current session
    const cur = sessions.find(s => s.id === currentSessionId);
    if (cur) $("#ai-title").value = cur.title || "Untitled report";
  }

  // ---- Open session and render messages
  function openSession(id) {
    currentSessionId = id;
    const msgs = getMessages(id);
    const host = $("#ai-stream");
    host.innerHTML = "";
    msgs.forEach(m => renderMessage(m));
    touchSession(id); // bump updatedAt
  }

  // ---- Send / Render / Mock stream
  function onSend() {
    const input = $("#ai-input");
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    autoGrow(input, true);

    const msgs = getMessages(currentSessionId);
    msgs.push({ role: "user", content: text });
    saveMessages(currentSessionId, msgs);
    renderMessage({ role: "user", content: text });

    fakeAssistantReply(text);
  }

  function renderMessage(m) {
    const host = $("#ai-stream");
    const div = document.createElement("div");
    div.className = "msg " + m.role;
    div.style.cssText = "margin:8px 0;padding:10px 12px;border-radius:12px;max-width:900px;border:1px solid var(--tile-border);";
    if (m.role === "user") {
      div.style.background = "var(--tile-bg)";
    } else {
      div.style.background = "#fffef8";
    }
    div.textContent = m.content;
    host.appendChild(div);
    host.scrollTop = host.scrollHeight;
  }

  function fakeAssistantReply(userText) {
    const host = $("#ai-stream");
    const div = document.createElement("div");
    div.className = "msg assistant";
    div.style.cssText = "margin:8px 0;padding:10px 12px;border-radius:12px;max-width:900px;border:1px solid var(--tile-border);background:#fffef8;";
    host.appendChild(div);

    const fake =
`Mock AI response to: "${userText}"

• In the live version this will query your farm data and generate a structured report.
• You’ll be able to export as PDF/CSV and rename/save this session.
• Say “export daily harvest” to see an example layout.`;

    let i = 0;
    const interval = setInterval(() => {
      div.textContent += fake[i++] || "";
      host.scrollTop = host.scrollHeight;
      if (i >= fake.length) {
        clearInterval(interval);
        const msgs = getMessages(currentSessionId);
        msgs.push({ role: "assistant", content: fake });
        saveMessages(currentSessionId, msgs);
        touchSession(currentSessionId);
      }
    }, 18);
  }

  // ---- Mic / Speech-to-Text (Web Speech API)
  function startSTT(e) {
    e.preventDefault?.();
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Speech recognition not supported on this browser."); return; }
    if (recognizing) return;
    recognition = new SR();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognizing = true;
    $("#ai-mic").classList.add("active");

    recognition.onresult = (ev) => {
      let text = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        text += ev.results[i][0].transcript;
      }
      $("#ai-input").value = text;
      autoGrow($("#ai-input"));
    };
    recognition.onend = () => {
      recognizing = false;
      $("#ai-mic").classList.remove("active");
    };
    recognition.start();
  }
  function stopSTT(e) {
    e?.preventDefault?.();
    try { recognition && recognition.stop(); } catch {}
  }

  // ---- Utils
  function autoGrow(el, reset = false) {
    if (reset) el.style.height = "auto";
    el.style.height = "1px";
    el.style.height = Math.min(160, el.scrollHeight) + "px";
  }
  function timeAgo(ts) {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return "just now";
    const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24); return `${d}d ago`;
  }
  function escapeHtml(s) { return (s || "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
})();