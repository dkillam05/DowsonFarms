/* Dowson Farms — AI Reports (Mock Mode, Single-Column, Mobile Fixes)
 * - Caps content width and centers it (no overflow on phones)
 * - Prevents iOS input zoom (16px font-size on inputs/textareas)
 * - Mic: detects lack of SpeechRecognition (iOS Safari) and shows hint
 */

(() => {
  const STORAGE = { sessions: "df_ai_sessions_v2", messages: "df_ai_messages_v2" };
  let currentSessionId = null;
  let recognition = null;
  let recognizing = false;
  let micSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  const isiOS = /iP(ad|hone|od)/.test(navigator.userAgent);

  document.addEventListener("DOMContentLoaded", init);

  const $ = (sel, root = document) => root.querySelector(sel);

  function init() {
    ensureLayout();
    bindUI();
    ensureFirstSession();
    loadHistory();
    openSession(currentSessionId);
    if (!micSupported) showMicHint();
  }

  function ensureLayout() {
    const host = $(".content") || document.body;
    if ($(".ai-wrap")) return;

    // Page container is centered and width-limited to avoid horizontal scrolling
    host.innerHTML = `
      <div class="ai-wrap" style="max-width: 980px; margin: 0 auto; padding: 8px 12px; display: grid; gap: 12px;">
        <!-- Top Input Toolbar -->
        <header class="ai-toolbar" style="display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap;">
          <div style="flex:1;min-width:260px;">
            <label for="ai-input" style="display:block;font-size:.95rem;opacity:.8;margin-bottom:4px;">Ask for a new report</label>
            <textarea id="ai-input" rows="1" placeholder="e.g., Daily harvest summary by field with moisture & bu/ac"
              style="width:100%;padding:10px 12px;border-radius:10px;border:1px solid var(--tile-border);background:var(--tile-bg);resize:none;font-size:16px;line-height:1.35;"></textarea>
          </div>
          <div class="ai-controls" style="display:flex;gap:8px;">
            <button id="ai-mic" class="btn" title="Hold to talk"
              style="border:1px solid var(--tile-border);background:var(--tile-bg);border-radius:10px;padding:8px 12px;min-width:44px;">🎤</button>
            <button id="ai-send" class="btn primary"
              style="padding:10px 14px;border-radius:10px;border:none;background:#1B5E20;color:#fff;">Send</button>
          </div>
        </header>

        <!-- Live Chat Stream -->
        <section id="ai-stream" class="ai-stream" style="padding:6px 2px;overflow:auto;"></section>

        <!-- History (collapsible) -->
        <section class="ai-history-section" style="border-top:1px solid var(--tile-border);padding-top:8px;">
          <div class="ai-history-head" style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">
            <div style="display:flex;align-items:center;gap:8px;">
              <button id="ai-history-toggle" class="btn" aria-expanded="true"
                style="border:1px solid var(--tile-border);background:var(--tile-bg);border-radius:10px;padding:4px 10px;">▾</button>
              <h3 style="margin:0;font-size:1rem;">History</h3>
            </div>
            <div style="display:flex;gap:8px;">
              <input id="ai-title" placeholder="Untitled report"
                style="padding:8px 10px;border-radius:8px;border:1px solid var(--tile-border);background:var(--tile-bg);font-size:16px;min-width:220px;" />
              <button id="ai-new" class="btn"
                style="border:1px solid var(--tile-border);background:var(--tile-bg);border-radius:10px;padding:6px 10px;">+ New</button>
            </div>
          </div>
          <div id="ai-history" class="ai-history" style="display:grid;gap:6px;margin-top:8px;"></div>
        </section>
      </div>
    `;
  }

  // ----- Sessions & storage
  function ensureFirstSession() {
    const sessions = getSessions();
    if (sessions.length === 0) {
      const id = genId();
      saveSessions([{ id, title: "Untitled report", updatedAt: Date.now() }]);
      currentSessionId = id;
    } else {
      currentSessionId = sessions.sort((a,b)=>b.updatedAt-a.updatedAt)[0].id;
    }
  }
  function getSessions() { return JSON.parse(localStorage.getItem(STORAGE.sessions) || "[]"); }
  function saveSessions(arr) { localStorage.setItem(STORAGE.sessions, JSON.stringify(arr)); }
  function getMessages(id) {
    const all = JSON.parse(localStorage.getItem(STORAGE.messages) || "{}");
    return all[id] || [];
  }
  function saveMessages(id, msgs) {
    const all = JSON.parse(localStorage.getItem(STORAGE.messages) || "{}");
    all[id] = msgs;
    localStorage.setItem(STORAGE.messages, JSON.stringify(all));
  }
  function touchSession(id, fields = {}) {
    const ses = getSessions();
    const s = ses.find(x => x.id === id);
    if (s) Object.assign(s, { updatedAt: Date.now() }, fields);
    saveSessions(ses);
    loadHistory();
  }
  const genId = () => Math.random().toString(36).slice(2,10);

  // ----- UI
  function bindUI() {
    $("#ai-send").addEventListener("click", onSend);
    $("#ai-input").addEventListener("keydown", e => {
      autoGrow(e.target);
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); }
    });

    // Mic button
    const mic = $("#ai-mic");
    if (!micSupported) {
      mic.title = "Voice dictation requires the live version on iPhone (server transcription).";
      mic.style.opacity = "0.6";
    } else {
      mic.addEventListener("mousedown", startSTT);
      mic.addEventListener("mouseup", stopSTT);
      mic.addEventListener("mouseleave", stopSTT);
      mic.addEventListener("touchstart", startSTT, { passive: true });
      mic.addEventListener("touchend", stopSTT);
    }

    $("#ai-new").addEventListener("click", () => {
      const id = genId();
      const ses = getSessions();
      ses.unshift({ id, title: "Untitled report", updatedAt: Date.now() });
      saveSessions(ses);
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

  function loadHistory() {
    const ses = getSessions().sort((a,b)=>b.updatedAt-a.updatedAt);
    const host = $("#ai-history");
    host.innerHTML = "";
    ses.forEach(s => {
      const div = document.createElement("div");
      div.className = "ai-history-item";
      div.style.cssText = "padding:10px;border:1px solid var(--tile-border);border-radius:10px;background:var(--tile-bg);cursor:pointer;display:flex;justify-content:space-between;gap:10px;";
      div.innerHTML = `<span>${escapeHtml(s.title || "Untitled report")}</span><span style="opacity:.7;font-size:.85rem;">${timeAgo(s.updatedAt)}</span>`;
      div.onclick = () => openSession(s.id);
      host.appendChild(div);
    });
    const cur = ses.find(s => s.id === currentSessionId);
    if (cur) $("#ai-title").value = cur.title || "Untitled report";
  }

  function openSession(id) {
    currentSessionId = id;
    const msgs = getMessages(id);
    const host = $("#ai-stream");
    host.innerHTML = "";
    msgs.forEach(m => renderMessage(m));
    touchSession(id);
  }

  // ----- Send & render
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
    div.style.cssText = "margin:8px 0;padding:12px 14px;border-radius:12px;max-width:900px;border:1px solid var(--tile-border);";
    div.style.background = (m.role === "user") ? "var(--tile-bg)" : "#fffef8";
    div.textContent = m.content;
    host.appendChild(div);
    host.scrollTop = host.scrollHeight;
  }

  function fakeAssistantReply(userText) {
    const host = $("#ai-stream");
    const div = document.createElement("div");
    div.className = "msg assistant";
    div.style.cssText = "margin:8px 0;padding:12px 14px;border-radius:12px;max-width:900px;border:1px solid var(--tile-border);background:#fffef8;";
    host.appendChild(div);

    const fake = `Mock AI response to: "${userText}"

• Live version will query farm data and generate a structured report.
• You’ll be able to export as PDF/CSV and save the session.
• Try: “Daily harvest summary by field, include moisture and bu/ac.”`;

    let i = 0;
    const timer = setInterval(() => {
      div.textContent += fake[i++] || "";
      host.scrollTop = host.scrollHeight;
      if (i >= fake.length) {
        clearInterval(timer);
        const msgs = getMessages(currentSessionId);
        msgs.push({ role: "assistant", content: fake });
        saveMessages(currentSessionId, msgs);
        touchSession(currentSessionId);
      }
    }, 18);
  }

  // ----- Mic (Web Speech API where available)
  function startSTT(e) {
    e.preventDefault?.();
    if (!micSupported) return;
    if (recognizing) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
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
  function stopSTT(e) {
    e?.preventDefault?.();
    try { recognition && recognition.stop(); } catch {}
  }

  // ----- Helpers
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

  function showMicHint() {
    const mic = $("#ai-mic");
    if (!mic) return;
    // iOS Safari has no SpeechRecognition; we’ll enable mic when live (server transcription).
    mic.setAttribute("aria-disabled", "true");
    mic.style.cursor = "not-allowed";
    const note = document.createElement("div");
    note.style.cssText = "font-size:.9rem;opacity:.8";
    note.textContent = isiOS
      ? "Voice dictation on iPhone will be available when we enable server transcription."
      : "Voice dictation not supported in this browser.";
    // Insert the note just under the toolbar
    const wrap = $(".ai-wrap");
    const toolbar = wrap?.querySelector(".ai-toolbar");
    toolbar && toolbar.insertAdjacentElement("afterend", note);
  }
})();