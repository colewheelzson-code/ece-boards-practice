(function () {
  "use strict";

  const root = "/ece-boards-practice/";
  const installLabel = "Install app";
  let installPrompt = null;

  function addStyles() {
    const style = document.createElement("style");
    style.textContent = `
      .library-search{display:grid;gap:6px;margin:0 0 14px}
      .library-search label{font-size:13px;color:var(--muted);font-weight:650}
      .library-search input{width:100%;padding:12px 14px;border:1px solid var(--line);border-radius:12px;background:var(--panel,#14213b);color:var(--text);font:inherit}
      .library-search input:focus-visible,.site-install:focus-visible,.install-dialog button:focus-visible{outline:3px solid var(--cyan);outline-offset:2px}
      .search-empty{padding:12px 14px;border:1px dashed var(--line);border-radius:12px;color:var(--muted)}
      .list>[hidden]{display:none!important}
      .site-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
      .site-install{border:1px solid var(--line);border-radius:10px;padding:8px 11px;background:transparent;color:var(--text);font:inherit;font-size:13px;cursor:pointer}
      .install-dialog{width:min(420px,calc(100% - 28px));border:1px solid var(--line);border-radius:18px;padding:22px;background:var(--panel,#14213b);color:var(--text);box-shadow:0 20px 70px #0007}
      .install-dialog::backdrop{background:#030711aa}
      .install-dialog h2{margin:0 0 8px;font-size:22px}
      .install-dialog p{color:var(--muted)}
      .install-dialog button{border:0;border-radius:10px;padding:10px 14px;background:var(--cyan);color:#081b27;font:inherit;font-weight:750;cursor:pointer}
      .recent-card{display:flex;align-items:center;gap:14px;border:1px solid var(--line);border-radius:17px;padding:15px 17px;margin:0 0 24px;background:linear-gradient(155deg,#14213b,#101a30)}
      .recent-copy{flex:1;min-width:0}.recent-copy strong{display:block}.recent-copy span{display:block;color:var(--muted);font-size:13px}
      .recent-link{display:inline-block;text-decoration:none;border-radius:10px;padding:9px 12px;background:var(--cyan);color:#081b27;font-weight:750;white-space:nowrap}
      .resume-card{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid var(--line);border-radius:14px;padding:13px 14px;margin:0 0 15px;background:#ffffff06}
      .resume-card strong,.resume-card span{display:block}.resume-card span{font-size:13px;color:var(--muted)}
      body[data-theme="light"] .resume-card{background:#f3f6fb}body[data-theme="midnight"] .resume-card{background:#08080b}
      body[data-theme="light"] .library-search input,body[data-theme="light"] .install-dialog{background:#fff}
      body[data-theme="light"] .recent-card{background:#fff}
      body[data-theme="midnight"] .library-search input,body[data-theme="midnight"] .install-dialog,body[data-theme="midnight"] .recent-card{background:#0e0f14}
      @media(max-width:520px){.recent-card{align-items:flex-start;flex-wrap:wrap}.recent-link{width:100%;text-align:center}.site-actions{justify-content:flex-end}.site-install{padding:7px 9px}}
    `;
    document.head.append(style);
  }

  function setupSearch() {
    const list = document.querySelector(".list");
    if (!list) return;
    const wrapper = document.createElement("div");
    wrapper.className = "library-search";
    wrapper.innerHTML = '<label for="librarySearch">Find a subject or exam</label><input id="librarySearch" type="search" autocomplete="off" placeholder="Search folders and exams" aria-controls="libraryResults"><div class="search-empty" role="status" hidden>No folders or exams match that search.</div>';
    list.id = "libraryResults";
    list.before(wrapper);
    const input = wrapper.querySelector("input");
    const empty = wrapper.querySelector(".search-empty");
    input.addEventListener("input", () => {
      const query = input.value.trim().toLocaleLowerCase();
      let visible = 0;
      [...list.children].forEach(card => {
        const matches = !query || card.textContent.toLocaleLowerCase().includes(query);
        card.hidden = !matches;
        if (matches) visible++;
      });
      empty.hidden = visible !== 0;
    });
  }

  function setupInstall() {
    const header = document.querySelector(".site-header,.top");
    if (!header) return;
    let actions = header.querySelector(".site-actions,.top-actions");
    if (!actions) {
      actions = document.createElement("div");
      actions.className = "site-actions";
      const theme = header.querySelector(".theme-control");
      if (theme) {
        theme.before(actions);
        actions.append(theme);
      } else header.append(actions);
    } else actions.classList.add("site-actions");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "site-install";
    button.textContent = installLabel;
    button.setAttribute("aria-haspopup", "dialog");
    actions.append(button);
    if (window.matchMedia("(display-mode: standalone)").matches || navigator.standalone) {
      button.textContent = "App installed";
      button.disabled = true;
    }

    const dialog = document.createElement("dialog");
    dialog.className = "install-dialog";
    dialog.innerHTML = '<h2>Install ECE Boards</h2><p id="installHelp"></p><button type="button" id="installClose">Got it</button>';
    document.body.append(dialog);
    const help = dialog.querySelector("#installHelp");
    const close = () => { if (dialog.open) dialog.close(); };
    dialog.querySelector("#installClose").addEventListener("click", close);
    dialog.addEventListener("click", event => { if (event.target === dialog) close(); });

    button.addEventListener("click", async () => {
      if (installPrompt) {
        installPrompt.prompt();
        await installPrompt.userChoice;
        installPrompt = null;
        return;
      }
      const ua = navigator.userAgent;
      const isAppleMobile = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      help.textContent = isAppleMobile
        ? "In Safari, tap Share, then choose Add to Home Screen."
        : "Open your browser menu and choose Install app or Add to Home Screen. If that option is missing, refresh this page while online and try again.";
      if (typeof dialog.showModal === "function") dialog.showModal(); else window.alert(help.textContent);
    });
  }

  function setupRecent() {
    if (!location.pathname.replace(/\/$/, "").endsWith("/choose-exam")) return;
    let recent;
    try { recent = JSON.parse(localStorage.getItem("ece-boards-recent-exam-v1") || "null"); } catch { recent = null; }
    if (!recent || typeof recent.path !== "string" || !recent.path.startsWith(root) || !/\/choose-exam\//.test(recent.path)) return;
    const card = document.createElement("section");
    card.className = "recent-card";
    const copy = document.createElement("div");
    copy.className = "recent-copy";
    const title = document.createElement("strong");
    const detail = document.createElement("span");
    const link = document.createElement("a");
    link.className = "recent-link";
    link.href = recent.path;
    if (recent.status === "in-progress") {
      title.textContent = "Continue practicing · " + (recent.title || "Recent exam");
      detail.textContent = "Question " + Math.min(recent.current || 1, recent.total || 1) + " of " + (recent.total || "—");
      link.textContent = "Continue";
    } else {
      title.textContent = "Your latest result · " + (recent.title || "Recent exam");
      detail.textContent = (Number.isFinite(recent.rating) ? recent.rating + "% rating · " : "") + (recent.updatedAt ? new Date(recent.updatedAt).toLocaleDateString() : "Completed recently");
      link.textContent = "Open exam";
    }
    copy.append(title, detail);
    card.append(copy, link);
    const header = document.querySelector(".site-header");
    if (header) header.after(card);
  }

  addStyles();
  setupSearch();
  setupInstall();
  setupRecent();
  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    installPrompt = event;
  });
  window.addEventListener("appinstalled", () => { installPrompt = null; });

  if ("serviceWorker" in navigator && location.protocol === "https:") {
    navigator.serviceWorker.register(root + "sw.js").catch(() => {});
  }
})();
