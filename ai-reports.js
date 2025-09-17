/* Dowson Farms — AI Reports (Mock Mode)
 * File: ai-reports.js (root directory)
 * Purpose: Provides a chat-style AI Reports page without backend setup.
 * - Simulates ChatGPT-like streaming answers.
 * - Saves sessions/messages in localStorage.
 * - Integrates with your existing theme variables (no extra CSS file needed).
 */

(() => {
  const STORAGE = {
    sessions: "df_ai_sessions_v1",
    messages: "df_ai_messages_v1"
  };

  let currentSessionId = null;

  // ---------- Boot ----------
  document.addEventListener("DOMContentLoaded", init);

  function init() {
    ensureLayout();
    bindUI();
    ensureFirstSession();
    loadHistory();
  }

  // ---------- DOM Helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ---------- Layout Injection (if needed) ----------
  function ensureLayout() {
    if ($(".ai-layout")) return; // already in HTML
    const host = $(".content") || document.body;
    host.innerHTML = `
      <div class="ai-layout" style="display:grid;grid-template-columns:260px 1fr;height:100%;">
        <aside class="ai-sidebar" style="border-right:1px solid var(--tile-border);padding:10px;overflow:auto;">
          <button id="ai-new" class="btn primary" style="margin-bottom:10px;">+ New Report</button>
          <div id="ai-history"></div>
        </aside>
        <main class="ai-main" style="display:grid;grid-template-rows:1fr auto;">
          <section id="ai-stream" class="ai-stream" style="padding:10px;overflow:auto;"></section>
          <footer class="ai-inputbar" style="display:flex;gap:8px;padding:10px;border-top:1px solid var(--tile-border);">
            <textarea id="ai-input" rows="1" placeholder="Ask for a report…" style="flex:1;padding:8px;border-radius:8px;border:1px solid var(--tile-border);"></textarea>
            <button id="ai-send" class="btn primary">Send</button>
          </footer>
        </main>
      </div>
    `;
  }

  // ---------- Session Helpers ----------
  function ensureFirstSession() {
    const sessions = getSessions();
    if (sessions.length === 0) {
      const id = genId();
      const now = Date.now();
      const newSession = { id, title: "Untitled report", updatedAt: now };
      saveSessions([newSession]);
      currentSessionId = id;
    } else {
      currentSessionId = sessions[0].id;
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

  function genId() {
    return Math.random().toString(36).slice(2, 10);
  }

  // ---------- UI Binding ----------
  function bindUI() {
    $("#ai-send").addEventListener("click", onSend);
    $("#ai-input").addEventListener("keydown", e => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onSend();
      }
    });
    $("#ai-new").addEventListener("click", () => {
      const id = genId();
      const now = Date.now();
      const sessions = getSessions();
      sessions.unshift({ id, title: "Untitled report", updatedAt: now });
      saveSessions(sessions);
      currentSessionId = id;
      $("#ai-stream").innerHTML = "";
      loadHistory();
    });
  }

  // ---------- History ----------
  function loadHistory() {
    const sessions = getSessions().sort((a,b) => b.updatedAt - a.updatedAt);
    const host = $("#ai-history");
    host.innerHTML = "";
    sessions.forEach(s => {
      const div = document.createElement("div");
      div.textContent = s.title;
      div.style.cssText = "padding:6px;cursor:pointer;border:1px solid var(--tile-border);border-radius:6px;margin-bottom:6px;";
      div.onclick = () => openSession(s.id);
      host.appendChild(div);
    });
  }

  function openSession(id) {
    currentSessionId = id;
    const msgs = getMessages(id);
    const host = $("#ai-stream");
    host.innerHTML = "";
    msgs.forEach(m => renderMessage(m));
  }

  // ---------- Messaging ----------
  function onSend() {
    const input = $("#ai-input");
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
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
    div.style.cssText = "margin:8px 0;padding:10px 12px;border-radius:10px;max-width:700px;";
    if (m.role === "user") {
      div.style.background = "var(--tile-bg)";
      div.style.border = "1px solid var(--tile-border)";
    } else {
      div.style.background = "#fffef8";
      div.style.border = "1px solid var(--tile-border)";
    }
    div.textContent = m.content;
    host.appendChild(div);
    host.scrollTop = host.scrollHeight;
  }

  function fakeAssistantReply(userText) {
    const host = $("#ai-stream");
    const div = document.createElement("div");
    div.className = "msg assistant";
    div.style.cssText = "margin:8px 0;padding:10px 12px;border-radius:10px;max-width:700px;background:#fffef8;border:1px solid var(--tile-border);";
    div.textContent = "";
    host.appendChild(div);
    host.scrollTop = host.scrollHeight;

    const fake = `This is a mock AI response to: "${userText}"\n\nIn the live version, this would be a real report powered by farm data.`;
    let i = 0;
    const interval = setInterval(() => {
      div.textContent += fake[i++];
      host.scrollTop = host.scrollHeight;
      if (i >= fake.length) {
        clearInterval(interval);
        const msgs = getMessages(currentSessionId);
        msgs.push({ role: "assistant", content: fake });
        saveMessages(currentSessionId, msgs);

        // update session timestamp
        const sessions = getSessions();
        const s = sessions.find(s => s.id === currentSessionId);
        if (s) { s.updatedAt = Date.now(); saveSessions(sessions); loadHistory(); }
      }
    }, 25);
  }
})();
