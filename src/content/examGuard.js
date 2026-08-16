(() => {
  const EXAM_KEYWORDS = ["quiz", "exam", "assessment", "test", "midterm", "final", "proctored", "question paper"];
  const DEFAULT_BLOCKED = [
    "gemini.google.com",
    "claude.ai",
    "perplexity.ai",
    "copilot.microsoft.com",
    "chegg.com",
    "coursehero.com",
    "brainly.com",
    "quizlet.com"
  ];

  start();

  async function start() {
    const snapshot = await send({ type: "GET_SNAPSHOT" });
    const settings = snapshot.settings || {};
    if (settings.examGuardEnabled === false) return;

    const examGuard = snapshot.examGuard;
    const host = location.hostname;
    const blockedSites = parseList(settings.examBlockedSites, DEFAULT_BLOCKED);
    const isBlockedSite = matchesHost(host, blockedSites);
    const examSignal = detectExamSignal(parseList(settings.examKeywords, EXAM_KEYWORDS));

    if (examSignal) {
      await send({ type: "ACTIVATE_EXAM_GUARD", detail: { reason: examSignal } });
      installExamPageProtections();
      showExamPageNotice();
      return;
    }

    if (examGuard?.active && isBlockedSite && host !== examGuard.sourceHost) {
      await send({ type: "RECORD_EXAM_GUARD", counter: "blockedSiteVisits" });
      blockCurrentSite();
    }
  }

  function detectExamSignal(keywords) {
    const urlBits = `${location.hostname} ${location.pathname} ${location.search}`.toLowerCase();
    const titleBits = String(document.title || "").toLowerCase();
    const bodyBits = String(document.body?.innerText || "").slice(0, 5000).toLowerCase();
    const haystack = `${urlBits} ${titleBits} ${bodyBits}`;
    const match = keywords.find((keyword) => {
      const token = String(keyword || "").trim().toLowerCase();
      return token.length >= 3 && haystack.includes(token);
    });
    return match ? `keyword:${match}` : "";
  }

  function installExamPageProtections() {
    injectStyle();
    document.documentElement.classList.add("tf-exam-guard-no-select");

    const block = (event, counter) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      send({ type: "RECORD_EXAM_GUARD", counter });
      showToast("Exam Mode active: copying exam content is blocked.");
    };

    document.addEventListener("copy", (event) => block(event, "blockedExamCopies"), true);
    document.addEventListener("cut", (event) => block(event, "blockedExamCopies"), true);
    document.addEventListener("contextmenu", (event) => block(event, "blockedContextMenus"), true);
    document.addEventListener("selectstart", (event) => block(event, "blockedSelections"), true);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        send({ type: "RECORD_EXAM_GUARD", counter: "tabSwitchWarnings" });
      } else {
        showToast("Exam Mode active: stay in the assessment unless your teacher allows switching.");
      }
    });
  }

  function blockCurrentSite() {
    injectStyle();
    const overlay = document.createElement("div");
    overlay.className = "tf-exam-blocker";
    overlay.innerHTML = `
      <div>
        <strong>Exam Mode active</strong>
        <p>This site is blocked while an exam or assessment page is active. Use AI only for learning support allowed by your school.</p>
        <p class="tf-exam-small">ThinkFirst stores temporary counts only, not exam questions or page text.</p>
        <p class="tf-exam-small">Tamper notice: a normal browser extension cannot fully prevent someone from disabling it, switching profiles, or using another device.</p>
      </div>
    `;
    document.documentElement.append(overlay);
    const stop = (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    ["click", "keydown", "paste", "copy", "contextmenu", "beforeinput"].forEach((type) => {
      document.addEventListener(type, stop, true);
    });
  }

  function showExamPageNotice() {
    const notice = document.createElement("div");
    notice.className = "tf-exam-notice";
    notice.innerHTML = `<strong>ThinkFirst Exam Mode active</strong><span>Tamper notice: if this disappears, the extension may have lost access.</span>`;
    document.documentElement.append(notice);
  }

  function showToast(message) {
    document.querySelector(".tf-exam-toast")?.remove();
    const toast = document.createElement("div");
    toast.className = "tf-exam-toast";
    toast.textContent = message;
    document.documentElement.append(toast);
    setTimeout(() => toast.remove(), 3500);
  }

  function injectStyle() {
    if (document.querySelector("#tf-exam-guard-style")) return;
    const style = document.createElement("style");
    style.id = "tf-exam-guard-style";
    style.textContent = `
      .tf-exam-guard-no-select, .tf-exam-guard-no-select * {
        user-select: none !important;
        -webkit-user-select: none !important;
      }
      .tf-exam-notice,
      .tf-exam-toast {
        position: fixed;
        right: 16px;
        bottom: 16px;
        z-index: 2147483647;
        max-width: min(360px, calc(100vw - 32px));
        border: 1px solid #d4b56c;
        border-radius: 999px;
        padding: 10px 14px;
        background: #fff0bf;
        color: #214e44;
        box-shadow: 0 18px 42px rgba(15, 23, 26, 0.22);
        font: 700 13px/1.35 Inter, system-ui, sans-serif;
      }
      .tf-exam-notice {
        border-radius: 14px;
      }
      .tf-exam-notice strong,
      .tf-exam-notice span {
        display: block;
      }
      .tf-exam-notice span {
        margin-top: 2px;
        max-width: 300px;
        font-weight: 500;
        color: #51616b;
      }
      .tf-exam-toast {
        bottom: 64px;
        border-radius: 10px;
        background: #fbfaf7;
      }
      .tf-exam-blocker {
        position: fixed;
        inset: 0;
        z-index: 2147483647;
        display: grid;
        place-items: center;
        padding: 24px;
        background: rgba(15, 23, 26, 0.72);
        backdrop-filter: blur(8px);
        color: #214e44;
        font-family: Inter, system-ui, sans-serif;
      }
      .tf-exam-blocker > div {
        width: min(520px, 100%);
        border: 1px solid #ddd7cb;
        border-radius: 18px;
        padding: 22px;
        background: #fbfaf7;
        box-shadow: 0 28px 80px rgba(15, 23, 26, 0.34);
      }
      .tf-exam-blocker strong {
        display: block;
        margin-bottom: 8px;
        font: 500 28px/1.15 Georgia, "Times New Roman", serif;
      }
      .tf-exam-blocker p {
        margin: 8px 0 0;
        color: #51616b;
        line-height: 1.45;
      }
      .tf-exam-small {
        font-size: 13px;
      }
    `;
    document.documentElement.append(style);
  }

  function parseList(value, fallback = []) {
    if (Array.isArray(value)) return value;
    const parsed = String(value || "")
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean);
    return parsed.length ? parsed : fallback;
  }

  function matchesHost(host, patterns) {
    return patterns.some((pattern) => {
      const normalized = String(pattern).toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
      if (!normalized) return false;
      return host === normalized || host.endsWith(`.${normalized}`);
    });
  }

  function send(message) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (response) => resolve(response || { ok: false }));
    });
  }
})();
