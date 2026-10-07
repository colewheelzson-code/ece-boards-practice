(function () {
  "use strict";

  const bridge = window.__ecePracticeBridge;
  if (!bridge || typeof window.renderMenu !== "function") return;

  const activeKey = "ece-boards-session-v1-" + bridge.id;
  const recentKey = "ece-boards-recent-exam-v1";
  const originalMenu = window.renderMenu;
  const originalStart = window.startSession;
  const originalRender = window.renderQuestion;
  const originalFinish = window.finishSession;

  function readProgress() {
    try {
      const data = JSON.parse(localStorage.getItem(activeKey) || "null");
      return data && data.version === 1 && Array.isArray(data.items) && data.items.length ? data : null;
    } catch { return null; }
  }

  function writeRecent(data) {
    try { localStorage.setItem(recentKey, JSON.stringify(data)); } catch { /* Storage may be unavailable. */ }
  }

  function saveProgress() {
    const state = bridge.snapshot();
    if (!state || !state.items || !state.items.length) return;
    const data = { ...state, version: 1, title: bridge.title, path: location.pathname, updatedAt: Date.now(), status: "in-progress" };
    try {
      localStorage.setItem(activeKey, JSON.stringify(data));
      writeRecent({ status: data.status, title: data.title, path: data.path, current: data.index + 1, total: data.items.length, updatedAt: data.updatedAt });
    } catch { /* Keep the current practice usable if storage is full or disabled. */ }
  }

  function addResumeCard() {
    const saved = readProgress();
    if (!saved) return;
    if (!bridge.canRestore(saved)) {
      try { localStorage.removeItem(activeKey); } catch { /* Ignore storage errors. */ }
      writeRecent({ status: "completed", title: bridge.title, path: location.pathname, updatedAt: Date.now() });
      return;
    }
    const app = document.querySelector("#app");
    const stats = app && app.querySelector(".stats");
    if (!stats || app.querySelector(".resume-card")) return;
    const card = document.createElement("div");
    card.className = "resume-card";
    const text = document.createElement("div");
    text.innerHTML = '<strong>Continue your last session</strong><span>Question ' + Math.min(saved.index + 1, saved.items.length) + ' of ' + saved.items.length + (saved.mode === "exam" ? " · timed exam" : " · practice") + '</span>';
    const button = document.createElement("button");
    button.type = "button";
    button.className = "secondary";
    button.textContent = "Continue";
    button.addEventListener("click", () => {
      const latest = readProgress();
      if (!latest || !bridge.restore(latest)) {
        try { localStorage.removeItem(activeKey); } catch { /* Ignore storage errors. */ }
        writeRecent({ status: "completed", title: bridge.title, path: location.pathname, updatedAt: Date.now() });
        originalMenu("Your saved session could not be restored. Start a new session.");
      }
    });
    card.append(text, button);
    stats.before(card);
  }

  window.renderMenu = function (...args) {
    const result = originalMenu.apply(this, args);
    addResumeCard();
    return result;
  };
  window.startSession = function (...args) {
    const result = originalStart.apply(this, args);
    saveProgress();
    return result;
  };
  window.renderQuestion = function (...args) {
    const result = originalRender.apply(this, args);
    if (document.querySelector("#app .question")) saveProgress();
    return result;
  };
  window.finishSession = function (...args) {
    const result = originalFinish.apply(this, args);
    const score = bridge.score();
    if (score) {
      try { localStorage.removeItem(activeKey); } catch { /* Ignore storage errors. */ }
      writeRecent({ status: "completed", title: bridge.title, path: location.pathname, updatedAt: Date.now(), rating: score.rating, correct: score.correct, total: score.total });
    }
    return result;
  };

  window.addEventListener("pagehide", saveProgress);
})();
