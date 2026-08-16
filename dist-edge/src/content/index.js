(() => {
  const PROVIDER = "chatgpt";
  const STORAGE_SETTINGS = "tf_settings";
  const STORAGE_EXAM_GUARD = "tf_exam_guard";
  const STORAGE_SCHOOL_GUARD = "tf_school_guard";
  const SCHOOL_SCOPE_KEY = "tf_school_scope_id";
  const DEFAULT_SETTINGS = {
    mode: "quick",
    attemptEnabled: true,
    askEveryPrompt: false,
    evaluateEnabled: true,
    verifyEnabled: true,
    reflectEnabled: true,
    commitmentMode: false,
    schoolCopyBlocker: true,
    examGuardEnabled: true,
    examKeywords: "quiz, exam, assessment, test, midterm, final, proctored, question paper",
    examBlockedSites: "gemini.google.com, claude.ai, perplexity.ai, copilot.microsoft.com, chegg.com, coursehero.com, brainly.com, quizlet.com",
    automaticInterventionBudget: 3,
    cooldownMinutes: 5,
    cooldownExchanges: 3,
    understandingMode: "local-context",
    verificationLevel: "intermediate",
    promptComplexity: "standard",
    dyslexiaFriendly: false,
    intensity: "standard",
    historyEnabled: true,
    pausedSites: {}
  };

  class ChatGPTAdapter {
    constructor(controller) {
      this.controller = controller;
      this.cleanups = [];
      this.assistantTimer = null;
      this.lastAssistantCompleteAt = 0;
      this.lastAssistantNode = null;
      this.lastAssistantLength = 0;
      this.stableSince = 0;
    }

    get id() {
      return PROVIDER;
    }

    detectPage() {
      return /(^|\.)chatgpt\.com$/.test(location.hostname) || /(^|\.)chat\.openai\.com$/.test(location.hostname);
    }

    observeUserSubmit(callback) {
      const seenSignals = new WeakSet();
      const notify = (event, perform) => {
        if (seenSignals.has(event)) return;
        seenSignals.add(event);
        callback({ event, perform });
      };

      const submitHandler = (event) => {
        if (this.controller.shouldBypassSubmit()) return;
        const form = event.target?.closest?.("form") || event.target;
        if (!form || !this.findPromptRoot()) return;
        notify(event, () => this.performSubmit({ form }));
      };

      const clickHandler = (event) => {
        if (this.controller.shouldBypassSubmit()) return;
        const button = event.target?.closest?.("button");
        if (!button || !this.isSendButton(button)) return;
        notify(event, () => this.performSubmit({ form: button.closest("form"), button }));
      };

      const keyHandler = (event) => {
        if (this.controller.shouldBypassSubmit()) return;
        if (event.key !== "Enter" || event.shiftKey || event.metaKey || event.ctrlKey || event.altKey) return;
        const prompt = this.findPromptRoot();
        if (!prompt || !prompt.contains(event.target)) return;
        notify(event, () => this.performSubmit({ form: prompt.closest("form") }));
      };

      document.addEventListener("submit", submitHandler, true);
      document.addEventListener("pointerdown", clickHandler, true);
      document.addEventListener("click", clickHandler, true);
      document.addEventListener("keydown", keyHandler, true);
      this.cleanups.push(() => document.removeEventListener("submit", submitHandler, true));
      this.cleanups.push(() => document.removeEventListener("pointerdown", clickHandler, true));
      this.cleanups.push(() => document.removeEventListener("click", clickHandler, true));
      this.cleanups.push(() => document.removeEventListener("keydown", keyHandler, true));
    }

    observePromptIntent(callback) {
      const handler = (event) => {
        if (this.controller.shouldBypassSubmit()) return;
        const prompt = this.findPromptRoot();
        if (!prompt || !prompt.contains(event.target)) return;
        setTimeout(() => {
          if (this.hasPromptText()) callback();
        }, 0);
      };
      document.addEventListener("beforeinput", handler, true);
      document.addEventListener("input", handler, true);
      document.addEventListener("paste", handler, true);
      this.cleanups.push(() => document.removeEventListener("beforeinput", handler, true));
      this.cleanups.push(() => document.removeEventListener("input", handler, true));
      this.cleanups.push(() => document.removeEventListener("paste", handler, true));
    }

    observeAssistantStart(callback) {
      this.lastAssistantNode = this.findLatestAssistant();
      const observer = new MutationObserver(() => {
        const user = this.findLatestUserMessage();
        if (user) {
          this.controller.handleUserMessageObserved(user);
        }
        const assistant = this.findLatestAssistant();
        if (assistant && assistant !== this.lastAssistantNode) {
          this.lastAssistantNode = assistant;
          this.lastAssistantLength = 0;
          this.stableSince = Date.now();
          callback({ node: assistant });
        }
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
      this.cleanups.push(() => observer.disconnect());
    }

    observeAssistantComplete(callback) {
      this.assistantTimer = setInterval(() => {
        const assistant = this.findLatestAssistant();
        if (!assistant) return;
        const length = assistant.textContent?.length || 0;
        const hasSourceLink = assistant.querySelectorAll("a[href^='http']").length > 0;
        if (length === 0 && !hasSourceLink) return;
        if (length !== this.lastAssistantLength) {
          this.lastAssistantLength = length;
          this.stableSince = Date.now();
          return;
        }
        const stableFor = Date.now() - this.stableSince;
        if (stableFor > 2400 && this.lastAssistantCompleteAt < this.stableSince) {
          this.lastAssistantCompleteAt = Date.now();
          callback({
            node: assistant,
            sourcePresent: hasSourceLink
          });
        }
      }, 1200);
      this.cleanups.push(() => clearInterval(this.assistantTimer));
    }

    observeAssistantCopy(callback) {
      const handler = (event) => {
        const assistant = this.findLatestAssistant();
        if (!assistant || !this.lastAssistantCompleteAt) return;
        const selection = document.getSelection();
        if (!selection || selection.rangeCount === 0) return;
        const range = selection.getRangeAt(0);
        if (!assistant.contains(range.commonAncestorContainer)) return;
        const copiedLength = selection.toString().length;
        callback({
          copiedRangeClass: copiedLength > 1200 ? "large" : copiedLength > 250 ? "medium" : "small",
          secondsAfterResponse: Math.round((Date.now() - this.lastAssistantCompleteAt) / 1000)
        }, event);
      };
      document.addEventListener("copy", handler, true);
      this.cleanups.push(() => document.removeEventListener("copy", handler, true));
    }

    observeSourceClick(callback) {
      const handler = (event) => {
        const link = event.target?.closest?.("a[href^='http']");
        const assistant = this.findLatestAssistant();
        if (!link || !assistant || !assistant.contains(link)) return;
        callback();
      };
      document.addEventListener("click", handler, true);
      this.cleanups.push(() => document.removeEventListener("click", handler, true));
    }

    observeFollowupSubmit(callback) {
      this.controller.onFollowup = callback;
    }

    injectIntervention(container) {
      document.body.append(container);
    }

    cleanup() {
      for (const cleanup of this.cleanups.splice(0)) cleanup();
    }

    findPromptRoot() {
      return document.querySelector("#prompt-textarea, textarea, [contenteditable='true']");
    }

    hasPromptText() {
      const prompt = this.findPromptRoot();
      if (!prompt) return false;
      const text = "value" in prompt ? prompt.value : prompt.textContent;
      return Boolean(text?.trim());
    }

    getPromptText() {
      const prompt = this.findPromptRoot();
      if (!prompt) return "";
      return ("value" in prompt ? prompt.value : prompt.textContent) || "";
    }

    focusPrompt() {
      this.findPromptRoot()?.focus();
    }

    findLatestUserMessage() {
      const nodes = [
        ...document.querySelectorAll("[data-message-author-role='user']")
      ];
      return nodes.at(-1) || null;
    }

    findLatestAssistant() {
      const nodes = [
        ...document.querySelectorAll("[data-message-author-role='assistant'], [data-testid^='conversation-turn-'] .markdown")
      ];
      return nodes.at(-1) || null;
    }

    isSendButton(button) {
      const label = [
        button.getAttribute("aria-label"),
        button.getAttribute("title"),
        button.dataset?.testid,
        button.id,
        button.textContent
      ].filter(Boolean).join(" ").toLowerCase();
      return button.type === "submit" || label.includes("send") || label.includes("submit");
    }

    performSubmit({ form, button } = {}) {
      this.controller.withSubmitBypass(() => {
        const sendButton = button || form?.querySelector?.("button[data-testid='send-button'], button[aria-label*='Send'], button[aria-label*='send'], button[type='submit']");
        if (sendButton && !sendButton.disabled) {
          sendButton.click();
        } else if (form?.requestSubmit) {
          form.requestSubmit();
        } else {
          const prompt = this.findPromptRoot();
          prompt?.dispatchEvent(new KeyboardEvent("keydown", {
            key: "Enter",
            code: "Enter",
            bubbles: true,
            cancelable: true
          }));
        }
      });
    }
  }

  class ThinkFirstController {
    constructor() {
      this.settings = { ...DEFAULT_SETTINGS };
      this.examGuard = null;
      this.schoolGuard = null;
      this.schoolScopeId = this.getSchoolScopeId();
      this.adapter = new ChatGPTAdapter(this);
      this.sessionId = null;
      this.promptCount = 0;
      this.attemptShown = false;
      this.attemptCompleted = false;
      this.evaluationShown = false;
      this.verifyShown = false;
      this.reflectionShown = false;
      this.schoolCheckShown = false;
      this.assistantCompleted = false;
      this.awaitingAssistantResponse = false;
      this.userMessageObservedForPrompt = false;
      this.assistantNodeAtSubmit = null;
      this.responseInteracted = false;
      this.submitBypassUntil = 0;
      this.onFollowup = null;
      this.fallbackAttemptShown = false;
      this.currentConversationKey = this.getConversationKey();
      this.lastUserMessageNode = null;
      this.attemptPromptOpen = false;
      this.sidePanelOpen = false;
      this.autoInterventionsUsed = 0;
      this.skipsThisSession = 0;
      this.lastAutoAt = 0;
      this.exchangesSinceAuto = 0;
      this.learningGoalSet = false;
      this.learningGoalPromptOpen = false;
      this.sessionStartPromptOffered = false;
      this.retrieveSuggested = false;
      this.integrityPauseUntil = 0;
      this.integrityPauseTimer = null;
    }

    async start() {
      if (!this.adapter.detectPage()) return;
      await this.loadSettings();
      await this.message({ type: "PROVIDER_STATUS", provider: PROVIDER, detected: true });
      globalThis.__thinkFirstRecord = (type, detail) => this.record(type, detail);
      document.documentElement.classList.toggle("tf-dyslexia-friendly", Boolean(this.settings.dyslexiaFriendly));
      this.renderDock();
      this.adapter.observeUserSubmit((submission) => this.handleUserSubmit(submission));
      this.adapter.observePromptIntent(() => this.handlePromptIntent());
      this.adapter.observeAssistantStart((detail) => this.handleAssistantStart(detail));
      this.adapter.observeAssistantComplete((detail) => this.handleAssistantComplete(detail));
      this.adapter.observeAssistantCopy((detail, event) => this.handleAssistantCopy(detail, event));
      this.adapter.observeSourceClick(() => {
        this.responseInteracted = true;
        this.record("source_clicked");
      });
      this.adapter.observeFollowupSubmit(() => this.record("followup_message_detected"));
      this.installExamChatGuard();
      this.installSchoolChatGuard();
      this.updateExamWarning();
      this.syncSchoolWarning();
      this.installInteractionTracker();
      this.installNavigationWatcher();
      this.installSessionStartPrompt();
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === "local" && changes[STORAGE_SETTINGS]) {
          this.settings = { ...DEFAULT_SETTINGS, ...(changes[STORAGE_SETTINGS].newValue || {}) };
          document.documentElement.classList.toggle("tf-dyslexia-friendly", Boolean(this.settings.dyslexiaFriendly));
          this.renderDock();
          this.installSessionStartPrompt();
        }
        if (area === "local" && changes[STORAGE_EXAM_GUARD]) {
          this.examGuard = changes[STORAGE_EXAM_GUARD].newValue || null;
          this.updateExamWarning();
        }
        if (area === "local" && changes[STORAGE_SCHOOL_GUARD]) {
          this.schoolGuard = changes[STORAGE_SCHOOL_GUARD].newValue || null;
          this.syncSchoolWarning();
        }
      });
    }

    async loadSettings() {
      const snapshot = await this.message({ type: "GET_SNAPSHOT" });
      this.settings = { ...DEFAULT_SETTINGS, ...(snapshot.settings || {}) };
      this.examGuard = snapshot.examGuard || null;
      this.schoolGuard = snapshot.schoolGuard || null;
      this.schoolScopeId = this.getSchoolScopeId();
    }

    isLearningActive() {
      return this.getMode() !== "quick" && !this.settings.pausedSites?.[location.hostname];
    }

    getMode() {
      if (this.settings.mode === "learning") return "learn";
      return ["quick", "learn", "research", "create", "school"].includes(this.settings.mode) ? this.settings.mode : "quick";
    }

    async handleUserSubmit({ event, perform }) {
      this.refreshConversationState();
      if (this.isSchoolChatBlocked()) {
        event.preventDefault();
        event.stopImmediatePropagation();
        this.showSchoolBlocker();
        return;
      }
      if (this.isExamModeActive() && this.looksLikeExamPrompt(this.adapter.getPromptText())) {
        event.preventDefault();
        event.stopImmediatePropagation();
        await this.recordExamGuard("blockedSuspiciousPrompts");
        this.showExamRedirect();
        return;
      }
      if (!this.isLearningActive()) return;
      this.ensureSession();

      if (Date.now() < this.integrityPauseUntil) {
        event.preventDefault();
        event.stopImmediatePropagation();
        this.showIntegrityPause();
        return;
      }

      if (this.promptCount > 0 && this.assistantCompleted) {
        this.onFollowup?.();
      }

      if (this.attemptPromptOpen) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }

      if (this.learningGoalPromptOpen) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }

      if (this.settings.attemptEnabled && !this.attemptShown && (this.isStrictStudentMode() || this.canAutoIntervene())) {
        event.preventDefault();
        event.stopImmediatePropagation();
        this.attemptShown = true;
        this.fallbackAttemptShown = true;
        await this.record("attempt_prompt_shown");
        this.markAutoIntervention();
        this.showAttemptFirst(perform, { submitAfter: true });
        return;
      }

      this.promptCount += 1;
      this.awaitingAssistantResponse = true;
      this.userMessageObservedForPrompt = false;
      this.assistantNodeAtSubmit = this.adapter.findLatestAssistant();
      this.assistantCompleted = false;
      this.evaluationShown = false;
      this.verifyShown = false;
      this.reflectionShown = false;
      this.schoolCheckShown = false;
    }

    async handlePromptIntent() {
      this.refreshConversationState();
      if (this.isExamModeActive()) this.updateExamWarning();
      if (this.isSchoolChatBlocked()) {
        this.showSchoolBlocker();
        return;
      }
      if (!this.isLearningActive()) return;
      if (Date.now() < this.integrityPauseUntil) {
        this.showIntegrityPause();
        return;
      }
      if (!this.settings.attemptEnabled || this.attemptShown || this.attemptPromptOpen || this.learningGoalPromptOpen) return;
      if (!this.isStrictStudentMode() && !this.canAutoIntervene()) return;
      this.ensureSession();
      this.attemptShown = true;
      this.fallbackAttemptShown = true;
      await this.record("attempt_prompt_shown");
      this.markAutoIntervention();
      this.showAttemptFirst(null, { submitAfter: false });
    }

    async handleUserMessageObserved(userNode) {
      this.refreshConversationState();
      if (!this.isLearningActive() || this.lastUserMessageNode === userNode) return;
      this.lastUserMessageNode = userNode;
      this.ensureSession();
      this.userMessageObservedForPrompt = true;
      this.evaluationShown = false;
      this.verifyShown = false;
      this.reflectionShown = false;
      this.schoolCheckShown = false;
      this.promptCount = Math.max(this.promptCount, 1);
    }

    handleAssistantStart({ node } = {}) {
      this.refreshConversationState();
      if (!this.sessionId || !this.isLearningActive() || this.awaitingAssistantResponse || this.assistantCompleted) return;
      if (!this.attemptShown || this.attemptPromptOpen || this.learningGoalPromptOpen) return;
      this.promptCount = Math.max(this.promptCount, 1);
      this.awaitingAssistantResponse = true;
      this.userMessageObservedForPrompt = true;
      this.assistantNodeAtSubmit = null;
      this.assistantCompleted = false;
      this.evaluationShown = false;
      this.verifyShown = false;
      this.reflectionShown = false;
      this.schoolCheckShown = false;
    }

    handleAssistantComplete({ node, sourcePresent }) {
      if (!this.sessionId || !this.isLearningActive() || this.assistantCompleted) return;
      if (!this.awaitingAssistantResponse || this.promptCount < 1) return;
      if (node && this.assistantNodeAtSubmit && node === this.assistantNodeAtSubmit) return;
      this.awaitingAssistantResponse = false;
      this.assistantNodeAtSubmit = null;
      this.assistantCompleted = true;
      this.responseInteracted = false;
      this.exchangesSinceAuto += 1;
      this.record("assistant_response_completed", { sourcePresent });
      this.renderDock();
      const decision = this.choosePostResponseIntervention({ sourcePresent });
      this.record("intervention_decision", decision);
      if (decision.offeredIntervention && this.canAutoIntervene({ bypassCooldown: decision.bypassCooldown })) {
        this.markAutoIntervention();
        setTimeout(() => this.openAutomaticIntervention(decision), 1200);
      }
    }

    installExamChatGuard() {
      const isPromptTarget = (target) => {
        const prompt = this.adapter.findPromptRoot();
        return Boolean(prompt && target && (prompt === target || prompt.contains(target)));
      };
      const block = async (event, counter, message = "Exam Mode active: paste is blocked. Ask for explanation, not answers.") => {
        if (!this.isExamModeActive() || !isPromptTarget(event.target)) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        await this.recordExamGuard(counter);
        this.showExamToast(message);
      };
      document.addEventListener("paste", (event) => {
        block(event, "blockedChatGPTPastes");
      }, true);
      document.addEventListener("beforeinput", (event) => {
        if (!this.isExamModeActive() || !isPromptTarget(event.target)) return;
        const bulkInsert = event.inputType === "insertFromPaste" || String(event.data || "").length > 180;
        if (!bulkInsert) return;
        block(event, "blockedBulkPromptInput", "Exam Mode active: long copied chunks are blocked. Try asking for a concept explanation instead.");
      }, true);
    }

    installSchoolChatGuard() {
      const isPromptTarget = (target) => {
        const prompt = this.adapter.findPromptRoot();
        return Boolean(prompt && target && (prompt === target || prompt.contains(target)));
      };
      const block = (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        this.showSchoolBlocker();
      };
      document.addEventListener("paste", (event) => {
        if (!this.isSchoolChatBlocked() || !isPromptTarget(event.target)) return;
        block(event);
      }, true);
      document.addEventListener("beforeinput", (event) => {
        if (!this.isSchoolChatBlocked() || !isPromptTarget(event.target)) return;
        const pasted = event.inputType === "insertFromPaste";
        const longInsert = String(event.data || "").length > 0;
        if (pasted || longInsert) block(event);
      }, true);
      document.addEventListener("keydown", (event) => {
        if (!this.isSchoolChatBlocked() || !isPromptTarget(event.target)) return;
        if (event.key === "Enter" || event.key.length === 1) block(event);
      }, true);
    }

    isExamModeActive() {
      return Boolean(
        this.settings.examGuardEnabled !== false &&
        this.examGuard?.active &&
        (!this.examGuard.expiresAt || this.examGuard.expiresAt > Date.now())
      );
    }

    isSchoolChatBlocked() {
      return Boolean(
        this.getMode() === "school" &&
        this.schoolGuard?.active &&
        this.schoolGuard?.scopeId === this.schoolScopeId &&
        (!this.schoolGuard.expiresAt || this.schoolGuard.expiresAt > Date.now())
      );
    }

    looksLikeExamPrompt(text = "") {
      const normalized = String(text).replace(/\s+/g, " ").trim();
      if (!normalized) return false;
      if (normalized.length >= 500) return true;
      const lower = normalized.toLowerCase();
      const signals = [
        /question\s*\d+/i,
        /\b\d+\s*marks?\b/i,
        /\b(a|b|c|d)\)\s+.{3,}\s+(a|b|c|d)\)\s+/i,
        /answer\s+(the\s+)?(following|this)/i,
        /\b(quiz|exam|assessment|test|midterm|final)\b/i,
        /\bmultiple\s+choice\b/i,
        /\bshow\s+your\s+working\b/i
      ];
      return signals.some((pattern) => pattern.test(lower));
    }

    async recordExamGuard(counter) {
      return this.message({ type: "RECORD_EXAM_GUARD", counter });
    }

    updateExamWarning() {
      document.querySelector("#tf-exam-chat-warning")?.remove();
      if (!this.isExamModeActive()) return;
      const warning = document.createElement("div");
      warning.id = "tf-exam-chat-warning";
      warning.className = "tf-exam-chat-warning";
      warning.textContent = "Exam Mode active - use AI only for learning. Tamper notice: ThinkFirst cannot stop another browser, profile, or disabled extension.";
      document.body.append(warning);
    }

    syncSchoolWarning() {
      document.querySelector("#tf-school-chat-warning")?.remove();
      document.querySelector("#tf-school-chat-blocker")?.remove();
      if (!this.isSchoolChatBlocked()) return;
      const warning = document.createElement("div");
      warning.id = "tf-school-chat-warning";
      warning.className = "tf-exam-chat-warning tf-school-chat-warning";
      warning.textContent = "School Mode: AI is not allowed for this task, so ChatGPT is blocked until you change the rule or mode.";
      document.body.append(warning);
      this.showSchoolBlocker();
    }

    showExamToast(message) {
      document.querySelector("#tf-exam-chat-toast")?.remove();
      const toast = document.createElement("div");
      toast.id = "tf-exam-chat-toast";
      toast.className = "tf-exam-chat-toast";
      toast.textContent = message;
      document.body.append(toast);
      setTimeout(() => toast.remove(), 4200);
    }

    showExamRedirect() {
      const modal = createModal({
        title: "Exam Mode active",
        body: "ThinkFirst stopped this prompt because it looks like an exam or assessment question. Use AI for learning support, not direct answers.",
        customBody: () => buildPromptExamples([
          "Explain this topic at a high level without solving the question.",
          "Teach me the method I should use for this kind of problem.",
          "Give me a practice example that is not from my exam."
        ]),
        primary: "I will ask for learning help",
        secondary: "",
        why: "Exam Mode is active from an exam-like page. ThinkFirst blocks copied questions and redirects toward learning-only prompts.",
        onPrimary: ({ close }) => close()
      });
      this.adapter.injectIntervention(modal);
    }

    showSchoolBlocker() {
      document.querySelector("#tf-school-chat-blocker")?.remove();
      if (!this.isSchoolChatBlocked()) return;
      const blocker = document.createElement("div");
      blocker.id = "tf-school-chat-blocker";
      blocker.className = "tf-school-chat-blocker";
      blocker.innerHTML = `
        <div>
          <strong>ChatGPT blocked for this task</strong>
          <p>School mode says AI is not allowed here. ThinkFirst is blocking the chat so you do the work without AI.</p>
          <p class="tf-school-small">If this was a mistake, switch mode or reopen School Check and choose a different rule.</p>
          <div class="tf-school-actions">
            <button type="button" data-open-settings>Settings</button>
          </div>
        </div>
      `;
      blocker.querySelector("[data-open-settings]").addEventListener("click", () => this.openSettings());
      document.body.append(blocker);
    }

    async handleAssistantCopy(detail, event) {
      const shouldBlock = this.shouldStartIntegrityPause(detail);
      if (shouldBlock) {
        event?.preventDefault?.();
        event?.stopImmediatePropagation?.();
      }
      await this.record("assistant_copy_detected", detail);
      if (shouldBlock) await this.startIntegrityPause(detail);
    }

    shouldStartIntegrityPause(detail = {}) {
      if (!this.isLearningActive() || this.settings.schoolCopyBlocker === false) return false;
      if (!this.isStrictStudentMode()) return false;
      if (Date.now() < this.integrityPauseUntil) return true;
      return ["small", "medium", "large"].includes(detail.copiedRangeClass);
    }

    isStrictStudentMode() {
      return this.getMode() === "school" || Boolean(this.settings.commitmentMode);
    }

    async startIntegrityPause(detail = {}) {
      if (Date.now() >= this.integrityPauseUntil) {
        this.integrityPauseUntil = Date.now() + 10 * 60_000;
        await this.record("school_integrity_pause_started", {
          copiedRangeClass: detail.copiedRangeClass,
          secondsAfterResponse: detail.secondsAfterResponse,
          pauseSeconds: 600
        });
      }
      this.showIntegrityPause(detail);
    }

    async clearIntegrityPause(reason = "completed") {
      this.integrityPauseUntil = 0;
      if (this.integrityPauseTimer) clearInterval(this.integrityPauseTimer);
      this.integrityPauseTimer = null;
      document.querySelector("#tf-integrity-pause")?.remove();
      await this.record("school_integrity_pause_cleared", { reason });
    }

    showIntegrityPause(detail = {}) {
      document.querySelector("#tf-integrity-pause")?.remove();
      if (this.integrityPauseTimer) clearInterval(this.integrityPauseTimer);

      const overlay = document.createElement("div");
      overlay.id = "tf-integrity-pause";
      overlay.className = "tf-overlay tf-integrity-pause";
      overlay.setAttribute("role", "dialog");
      overlay.setAttribute("aria-modal", "true");
      overlay.innerHTML = `
        <div class="tf-card">
          <div class="tf-card__head">
            <div class="tf-logo-mark" aria-hidden="true"></div>
            <h2>Assignment integrity pause</h2>
          </div>
          <p class="tf-card__body">ThinkFirst blocked this copy because assistant-answer copying is locked in School/Commitment Mode.</p>
          <div class="tf-lock-box">
            <strong data-countdown>10:00</strong>
            <span>Pause, check the rule, and decide what must be rewritten, cited, or verified.</span>
          </div>
          <ul class="tf-example-list">
            <li>ThinkFirst is not judging intent or calling this cheating.</li>
            <li>No copied text or clipboard content is read or stored.</li>
            <li>Complete a School Check to unlock early, or wait 10 minutes.</li>
            <li>While the pause is active, ChatGPT sending is blocked too.</li>
          </ul>
          <div class="tf-actions">
            <button class="tf-secondary" type="button" data-school-check>Do school check</button>
            <button class="tf-primary" type="button" data-continue disabled>Continue after pause</button>
          </div>
        </div>
      `;
      const countdown = overlay.querySelector("[data-countdown]");
      const continueButton = overlay.querySelector("[data-continue]");
      const updateCountdown = () => {
        const remaining = Math.max(0, this.integrityPauseUntil - Date.now());
        const totalSeconds = Math.ceil(remaining / 1000);
        const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
        const seconds = String(totalSeconds % 60).padStart(2, "0");
        countdown.textContent = `${minutes}:${seconds}`;
        if (remaining <= 0) {
          continueButton.disabled = false;
          continueButton.textContent = "Continue";
          clearInterval(this.integrityPauseTimer);
          this.integrityPauseTimer = null;
        }
      };
      overlay.querySelector("[data-school-check]").addEventListener("click", () => {
        overlay.remove();
        this.showSchoolCheck(true, "copy_integrity_pause", {
          unlockOnComplete: true,
          onSkip: () => this.showIntegrityPause(detail)
        });
      });
      continueButton.addEventListener("click", () => {
        if (Date.now() < this.integrityPauseUntil) return;
        this.clearIntegrityPause("timer_completed");
      });
      updateCountdown();
      this.integrityPauseTimer = setInterval(updateCountdown, 1000);
      this.adapter.injectIntervention(overlay);
    }

    choosePostResponseIntervention({ sourcePresent = false } = {}) {
      const mode = this.getMode();
      const verificationRelevant = mode === "research" || Boolean(sourcePresent);
      const relianceCue = this.promptCount >= 3 || this.responseInteracted === false;
      if (verificationRelevant && this.settings.verifyEnabled && !this.verifyShown) {
        return {
          decisionPoint: "post_response",
          offeredIntervention: "verify",
          decisionReason: mode === "research" ? "research_mode" : "sources_visible",
          receptivity: "answer_stable",
          burden: `${this.autoInterventionsUsed}/${this.getAutoBudget()}`,
          bypassCooldown: this.promptCount <= 1
        };
      }
      if (mode === "school" && !this.schoolCheckShown) {
        return {
          decisionPoint: "post_response",
          offeredIntervention: "school_check",
          decisionReason: "school_process_check",
          receptivity: "answer_stable",
          burden: `${this.autoInterventionsUsed}/${this.getAutoBudget()}`,
          bypassCooldown: this.promptCount <= 1
        };
      }
      if ((mode === "learn" || mode === "create") && this.settings.evaluateEnabled && !this.evaluationShown) {
        return {
          decisionPoint: "post_response",
          offeredIntervention: "evaluate",
          decisionReason: mode === "create" ? "authorship_check" : "first_answer_compare",
          receptivity: "answer_stable",
          burden: `${this.autoInterventionsUsed}/${this.getAutoBudget()}`,
          bypassCooldown: this.promptCount <= 1
        };
      }
      if (this.settings.reflectEnabled && !this.retrieveSuggested && relianceCue && this.promptCount >= 3) {
        return {
          decisionPoint: "later_session",
          offeredIntervention: "checkpoint",
          decisionReason: "retrieval_opportunity",
          receptivity: "after_multiple_exchanges",
          burden: `${this.autoInterventionsUsed}/${this.getAutoBudget()}`,
          bypassCooldown: false
        };
      }
      return {
        decisionPoint: "post_response",
        offeredIntervention: "",
        decisionReason: "no_prompt_needed",
        receptivity: "answer_stable",
        burden: `${this.autoInterventionsUsed}/${this.getAutoBudget()}`
      };
    }

    openAutomaticIntervention(decision) {
      if (decision.offeredIntervention === "verify") return this.showVerify(false, decision.decisionReason);
      if (decision.offeredIntervention === "evaluate") return this.showEvaluate(false, decision.decisionReason);
      if (decision.offeredIntervention === "school_check") return this.showSchoolCheck(false, decision.decisionReason);
      if (decision.offeredIntervention === "checkpoint") {
        this.retrieveSuggested = true;
        return this.showRetrieveCheckpoint(decision.decisionReason);
      }
      return undefined;
    }

    ensureSession() {
      if (this.sessionId) return;
      this.sessionId = uuid();
      this.currentConversationKey = this.getConversationKey();
      this.autoInterventionsUsed = 0;
      this.skipsThisSession = 0;
      this.lastAutoAt = 0;
      this.exchangesSinceAuto = 0;
      this.learningGoalSet = false;
      this.retrieveSuggested = false;
      this.record("session_started", { mode: this.settings.mode });
      this.renderDock();
    }

    resetSessionState({ endCurrent = false } = {}) {
      if (endCurrent && this.sessionId) {
        this.record("session_ended");
      }
      this.sessionId = null;
      this.promptCount = 0;
      this.attemptShown = false;
      this.attemptCompleted = false;
      this.evaluationShown = false;
      this.verifyShown = false;
      this.reflectionShown = false;
      this.assistantCompleted = false;
      this.awaitingAssistantResponse = false;
      this.userMessageObservedForPrompt = false;
      this.assistantNodeAtSubmit = null;
      this.responseInteracted = false;
      this.fallbackAttemptShown = false;
      this.currentConversationKey = this.getConversationKey();
      this.lastUserMessageNode = null;
      this.attemptPromptOpen = false;
      this.sidePanelOpen = false;
      this.autoInterventionsUsed = 0;
      this.skipsThisSession = 0;
      this.lastAutoAt = 0;
      this.exchangesSinceAuto = 0;
      this.learningGoalSet = false;
      this.learningGoalPromptOpen = false;
      this.sessionStartPromptOffered = false;
      this.retrieveSuggested = false;
      document.querySelector(".tf-sidepanel")?.remove();
    }

    getConversationKey() {
      const match = location.pathname.match(/^\/c\/[^/?#]+/);
      if (match) return match[0];
      return "new-chat";
    }

    refreshConversationState() {
      const nextKey = this.getConversationKey();
      if (nextKey === this.currentConversationKey) return;
      if (this.currentConversationKey === "new-chat" && nextKey !== "new-chat" && this.sessionId) {
        this.currentConversationKey = nextKey;
        return;
      }
      this.resetSessionState({ endCurrent: true });
    }

    shouldBypassSubmit() {
      return Date.now() < this.submitBypassUntil;
    }

    withSubmitBypass(callback) {
      this.submitBypassUntil = Date.now() + 1800;
      callback();
      setTimeout(() => {
        this.submitBypassUntil = 0;
      }, 1900);
    }

    continueToAI(perform) {
      if (typeof perform === "function") {
        this.promptCount += 1;
        this.awaitingAssistantResponse = true;
        this.userMessageObservedForPrompt = false;
        this.assistantNodeAtSubmit = this.adapter.findLatestAssistant();
        this.assistantCompleted = false;
        perform();
      } else {
        this.adapter.focusPrompt();
      }
      this.renderDock();
    }

    canAutoIntervene({ bypassCooldown = false } = {}) {
      if (this.skipsThisSession >= 2) return false;
      if (this.autoInterventionsUsed >= this.getAutoBudget()) return false;
      if (!this.lastAutoAt) return true;
      if (bypassCooldown) return true;
      const enoughTime = Date.now() - this.lastAutoAt >= (this.settings.cooldownMinutes || 5) * 60_000;
      const enoughExchanges = this.exchangesSinceAuto >= (this.settings.cooldownExchanges || 3);
      return enoughTime && enoughExchanges;
    }

    getAutoBudget() {
      const configured = Number(this.settings.automaticInterventionBudget || 3);
      if (this.settings.commitmentMode) return Math.max(configured, 4);
      if (this.getMode() === "research" || this.getMode() === "school") return Math.max(configured, 3);
      return configured;
    }

    markAutoIntervention() {
      this.autoInterventionsUsed += 1;
      this.lastAutoAt = Date.now();
      this.exchangesSinceAuto = 0;
    }

    noteSkip() {
      this.skipsThisSession += 1;
      if (this.skipsThisSession >= 2) {
        this.retrieveSuggested = true;
      }
      this.renderDock();
    }

    showAttemptFirst(perform, { submitAfter = typeof perform === "function" } = {}) {
      this.attemptPromptOpen = true;
      const mode = this.getMode();
      const strictStudentMode = this.isStrictStudentMode();
      const copy = getAttemptCopy(mode);
      let readiness = "";
      let unfamiliar = "";
      let goalType = mode === "research" ? "evaluate_evidence" : mode === "create" ? "create" : mode === "school" ? "schoolwork" : "understand";
      let schoolTaskType = "assignment";
      let aiUseRule = "unknown";
      const modal = createModal({
        title: copy.title,
        body: copy.body,
        customBody: () => {
          const fragment = document.createDocumentFragment();
          if (!this.learningGoalSet) {
            fragment.append(buildChoiceList([
              ["understand", "Understand something"],
              ["solve", "Solve something"],
              ["remember", "Remember something"],
              ["evaluate_evidence", "Evaluate evidence"],
              ["create", "Create something"],
              ["schoolwork", "Complete schoolwork responsibly"]
            ], (value) => {
              goalType = value;
            }, "tf-goal", goalType, "1. What is the main goal?"));
          }
          if (mode === "school") {
            fragment.append(buildChoiceList([
              ["assignment", "Assignment"],
              ["exam_prep", "Exam prep"],
              ["homework", "Homework"],
              ["project", "Project"],
              ["study_notes", "Study notes"]
            ], (value) => {
              schoolTaskType = value;
            }, "tf-school-task", schoolTaskType, "2. What kind of school task is this?"));
            fragment.append(buildChoiceList([
              ["allowed", "AI is allowed"],
              ["limited", "AI is allowed with limits"],
              ["not_allowed", "AI is not allowed for final work"],
              ["unknown", "I need to check the rule"]
            ], (value) => {
              aiUseRule = value;
            }, "tf-ai-rule", aiUseRule, "3. What are the AI-use rules?"));
          }
          fragment.append(buildChoiceList([
            ["attempt", "I can attempt it"],
            ["partial", "I know part of it"],
            ["no_idea", "I have no idea"]
          ], (value) => {
            readiness = value;
            modal.dispatchEvent(new CustomEvent("tf-refresh"));
          }, "tf-readiness", readiness, mode === "school" ? "4. How much can you do before AI?" : "2. How much can you do before AI?", {
            allowNone: true,
            toggleable: true
          }));
          if (readiness === "no_idea") {
            fragment.append(buildChoiceList([
              ["terminology", "Terminology"],
              ["concept", "Concept"],
              ["method", "Method"],
              ["entire_topic", "Entire topic"],
              ["not_sure", "Not sure"]
            ], (value) => {
              unfamiliar = value;
            }, "tf-unfamiliar", unfamiliar, mode === "school" ? "5. What feels unclear?" : "3. What feels unclear?", {
              allowNone: true,
              toggleable: true
            }));
          } else {
            fragment.append(buildPromptExamples(copy.examples));
          }
          return fragment;
        },
        textareaLabel: "My attempt",
        textareaPlaceholder: copy.placeholder,
        requireText: strictStudentMode,
        footer: "Your attempt is not saved.",
        primary: submitAfter ? "Continue to AI" : "Done - I'll ask AI",
        secondary: strictStudentMode ? "" : submitAfter ? "Send without attempt" : "Skip for this question",
        why: "You're in a learning-style session and this is the first question. ThinkFirst is offering one independent start before AI assistance.",
        feedbackType: "attempt",
        onPrimary: async ({ close }) => {
          this.attemptPromptOpen = false;
          this.attemptCompleted = true;
          if (!this.learningGoalSet) {
            this.learningGoalSet = true;
            await this.record("learning_goal_set", { goalType });
          }
          if (mode === "school") {
            await this.record("school_context_set", { schoolTaskType, aiUseRule });
            if (aiUseRule === "not_allowed") {
              await this.message({ type: "ACTIVATE_SCHOOL_GUARD", detail: { policy: aiUseRule, scopeId: this.schoolScopeId } });
            }
          }
          await this.record("attempt_completed", { readiness: readiness || "not_selected", unfamiliar: readiness === "no_idea" && unfamiliar ? unfamiliar : undefined });
          close();
          this.continueToAI(submitAfter ? perform : null);
        },
        onSecondary: async ({ close }) => {
          this.attemptPromptOpen = false;
          await this.record("attempt_skipped");
          this.noteSkip();
          close();
          this.continueToAI(submitAfter ? perform : null);
        }
      });
      this.adapter.injectIntervention(modal);
    }

    async showEvaluate(manual = true, reason = "manual_compare") {
      if (this.evaluationShown && !manual) return;
      this.evaluationShown = true;
      await this.record("evaluation_prompt_shown");
      const copy = getEvaluateCopy(this.getMode());
      let selected = copy.defaultValue;
      const modal = createModal({
        title: copy.title,
        body: copy.body,
        customBody: buildChoiceList(copy.options, (value) => {
          selected = value;
        }, "tf-evaluation", selected),
        inputLabel: copy.inputLabel,
        inputPlaceholder: copy.inputPlaceholder,
        primary: "Done",
        secondary: "Skip",
        why: manual ? "You asked for Compare from the ThinkFirst tools. This helps separate your reasoning from the AI's contribution." : whyForAutomaticReason(reason),
        feedbackType: "compare",
        onPrimary: async ({ close }) => {
          await this.record("evaluation_completed", { evaluationType: selected });
          close();
        },
        onSecondary: async ({ close }) => {
          await this.record("evaluation_skipped");
          this.noteSkip();
          close();
        }
      });
      this.adapter.injectIntervention(modal);
    }

    async showVerify(manual = false, reason = "verification_relevant") {
      if (this.verifyShown && !manual) return;
      this.verifyShown = true;
      await this.record("verify_prompt_shown");
      let step = 1;
      let sourceJudgement = "unclear";
      let crossCheckCompleted = false;
      const modal = createModal({
        title: "Claim -> Source -> Cross-check",
        body: "",
        customBody: buildVerifySteps(
          () => step,
          (nextStep) => {
            step = nextStep;
            render();
          },
          (judgement) => {
            sourceJudgement = judgement;
          },
          (completed) => {
            crossCheckCompleted = completed;
          },
          () => this.settings.verificationLevel || (this.getMode() === "research" ? "advanced" : "intermediate")
        ),
        primary: "Done",
        secondary: "Skip",
        why: manual ? "You opened Verify from the ThinkFirst tools." : whyForAutomaticReason(reason),
        feedbackType: "verify",
        onPrimary: async ({ close }) => {
          await this.record("verify_prompt_completed", { sourceJudgement, crossCheckCompleted });
          close();
        },
        onSecondary: async ({ close }) => {
          await this.record("verify_skipped");
          this.noteSkip();
          close();
        }
      });
      const render = () => modal.dispatchEvent(new CustomEvent("tf-refresh"));
      this.adapter.injectIntervention(modal);
    }

    async maybeShowReflect() {
      if (!this.sessionId || this.reflectionShown || !this.assistantCompleted || !this.responseInteracted) return;
      this.reflectionShown = true;
      await this.record("reflection_prompt_shown");
      const modal = createModal({
        title: this.getMode() === "create" ? "Without looking back - what is still yours?" : "Without looking back - what is the key idea?",
        body: this.getMode() === "create" ? "Name the decision, sentence, design move, or idea you want to keep as your own." : "Explain it in one sentence as if you were teaching someone else.",
        textareaLabel: "What I learned",
        textareaPlaceholder: this.getMode() === "create" ? "My authorship note..." : "What I learned...",
        customBody: buildPromptExamples(this.getMode() === "create"
          ? ["What is my actual position?", "What would I revise before sharing?", "Which part needs my own judgment?"]
          : ["What would I need to remember tomorrow?", "What am I still unsure about?", "What test question could I give myself?"]),
        requireText: true,
        footer: "Your reflection is not saved.",
        primary: "Done",
        secondary: "Skip",
        why: "You asked for a retrieval-style learning check.",
        feedbackType: "retrieve",
        onPrimary: async ({ close }) => {
          await this.record("reflection_prompt_completed");
          close();
        },
        onSecondary: async ({ close }) => {
          await this.record("reflection_skipped");
          this.noteSkip();
          close();
        }
      });
      this.adapter.injectIntervention(modal);
    }

    async showSchoolCheck(manual = true, reason = "school_process_check", options = {}) {
      if (this.schoolCheckShown && !manual) return;
      this.schoolCheckShown = true;
      let aiUseRule = "unknown";
      let assignmentStage = "drafting";
      const modal = createModal({
        title: "School / assignment check",
        body: "Document the process without storing your assignment text. This is for allowed use, source checks, and your own contribution.",
        customBody: () => {
          const fragment = document.createDocumentFragment();
          fragment.append(buildSectionHeading("1. School rule", "Start here so ThinkFirst knows what AI is allowed to do for this task."));
          fragment.append(buildChoiceList([
            ["allowed", "AI is allowed"],
            ["limited", "AI is allowed with limits"],
            ["not_allowed", "AI is not allowed for final work"],
            ["unknown", "I need to check the rule"]
          ], (value) => {
            aiUseRule = value;
          }, "tf-school-rule", aiUseRule, "", { allowNone: true }));
          fragment.append(buildSectionHeading("2. Assignment stage", "This helps separate planning, drafting, checking, and revision."));
          fragment.append(buildChoiceList([
            ["planning", "Planning or understanding"],
            ["drafting", "Drafting or solving"],
            ["checking", "Checking sources or errors"],
            ["revision", "Revising my own work"],
            ["exam_prep", "Exam preparation"]
          ], (value) => {
            assignmentStage = value;
          }, "tf-assignment-stage", assignmentStage, "", { allowNone: true }));
          fragment.append(buildSectionHeading("3. Your own thinking", "Use these prompts to separate your contribution from the AI output."));
          fragment.append(buildPromptExamples([
            "What part is my own thinking?",
            "What AI output needs source checking?",
            "What must I rewrite or cite before submitting?"
          ]));
          return fragment;
        },
        primary: "Record process check",
        secondary: "Skip",
        why: manual ? "You opened School Check from the ThinkFirst tools." : whyForAutomaticReason(reason),
        feedbackType: "school",
        onPrimary: async ({ close }) => {
          await this.record("school_integrity_check_completed", { aiUseRule, assignmentStage });
          if (aiUseRule === "not_allowed") {
            await this.message({ type: "ACTIVATE_SCHOOL_GUARD", detail: { policy: aiUseRule, scopeId: this.schoolScopeId } });
          }
          if (options.unlockOnComplete) await this.clearIntegrityPause("school_check_completed");
          close();
        },
        onSecondary: async ({ close }) => {
          await this.record("school_integrity_check_skipped");
          this.noteSkip();
          close();
          options.onSkip?.();
        }
      });
      this.adapter.injectIntervention(modal);
    }

    showLearningGoal() {
      if (this.learningGoalSet || !this.isLearningActive()) return;
      this.ensureSession();
      this.learningGoalSet = true;
      this.learningGoalPromptOpen = true;
      let goalType = this.getMode() === "research" ? "evaluate_evidence" : this.getMode() === "create" ? "create" : "understand";
      const modal = createModal({
        title: "What should this session help you do?",
        body: "Choose a learning goal. ThinkFirst stores only the goal category, not the custom text.",
        customBody: buildChoiceList([
          ["understand", "Understand something"],
          ["solve", "Solve something"],
          ["remember", "Remember something"],
          ["evaluate_evidence", "Evaluate evidence"],
          ["create", "Create something"]
        ], (value) => {
          goalType = value;
        }, "tf-goal", goalType),
        inputLabel: "Optional private wording",
        inputPlaceholder: "Example: explain this without AI later...",
        primary: "Start session",
        secondary: "Skip",
        why: "ThinkFirst uses the goal category to choose better tools later. The typed wording is not saved.",
        feedbackType: "goal",
        onPrimary: async ({ close }) => {
          this.learningGoalPromptOpen = false;
          await this.record("learning_goal_set", { goalType });
          close();
          this.renderDock();
        },
        onSecondary: async ({ close }) => {
          this.learningGoalPromptOpen = false;
          await this.record("learning_goal_skipped");
          close();
        }
      });
      this.adapter.injectIntervention(modal);
    }

    showRetrieveCheckpoint(reason = "retrieval_opportunity") {
      if (!this.sessionId || !this.isLearningActive()) return;
      const modal = createModal({
        title: "Useful checkpoint?",
        body: "You've had several exchanges in this learning session. ThinkFirst can help you retrieve, verify, or challenge before continuing.",
        customBody: buildToolButtons([
          ["retrieve", "Finish learning"],
          ["test", "Test me"],
          ["verify", "Verify this"],
          ["challenge", "Challenge AI"],
          ["dismiss", "Stay in Explore"]
        ], (tool) => {
          modal.remove();
          this.openTool(tool);
        }),
        primary: "",
        secondary: "Not now",
        why: whyForAutomaticReason(reason),
        feedbackType: "checkpoint",
        onSecondary: async ({ close }) => {
          await this.record("checkpoint_skipped");
          this.noteSkip();
          close();
        }
      });
      this.adapter.injectIntervention(modal);
    }

    openTool(tool) {
      this.ensureSession();
      this.record("manual_tool_used", { intervention: tool });
      if (tool === "test" || tool === "retrieve" || tool === "finish") return this.showFinishLearning();
      if (tool === "verify") return this.showVerify(true);
      if (tool === "school") return this.showSchoolCheck(true);
      if (tool === "challenge") return this.showChallenge();
      if (tool === "compare") return this.showEvaluate();
      if (tool === "uncertainty") return this.showUncertainty();
      if (tool === "explain") {
        this.assistantCompleted = true;
        this.responseInteracted = true;
        this.reflectionShown = false;
        return this.maybeShowReflect();
      }
      if (tool === "dismiss") return;
    }

    showChallenge() {
      const modal = createModal({
        title: "Challenge AI",
        body: "Identify one assumption, claim, step, or conclusion that could be wrong.",
        customBody: buildPromptExamples(["What evidence would change my mind?", "Could a different explanation fit?", "Which step feels weakest?"]),
        textareaLabel: "Private challenge",
        textareaPlaceholder: "One thing I would challenge...",
        requireText: false,
        footer: "Your challenge text is not saved.",
        primary: "Done",
        secondary: "Skip",
        why: "You opened Challenge AI from the ThinkFirst tools.",
        feedbackType: "challenge",
        onPrimary: async ({ close }) => {
          await this.record("challenge_completed");
          close();
        },
        onSecondary: async ({ close }) => {
          await this.record("challenge_skipped");
          this.noteSkip();
          close();
        }
      });
      this.adapter.injectIntervention(modal);
    }

    showUncertainty() {
      let uncertaintyType = "nothing";
      const modal = createModal({
        title: "What am I unsure about?",
        body: "Choose the uncertainty. ThinkFirst will suggest the next action.",
        customBody: () => {
          const fragment = document.createDocumentFragment();
          fragment.append(buildChoiceList([
            ["concept", "I don't understand a concept"],
            ["truth", "I'm unsure whether a claim is true"],
            ["reasoning", "I don't understand a reasoning step"],
            ["application", "I don't know how to apply this"],
            ["nothing", "Nothing currently"]
          ], (value) => {
            uncertaintyType = value;
            modal.dispatchEvent(new CustomEvent("tf-refresh"));
          }, "tf-uncertainty", uncertaintyType));
          fragment.append(buildPromptExamples([nextActionForUncertainty(uncertaintyType)]));
          return fragment;
        },
        primary: "Done",
        secondary: "Skip",
        why: "You opened Uncertainty from the ThinkFirst tools.",
        feedbackType: "uncertainty",
        onPrimary: async ({ close }) => {
          await this.record("uncertainty_completed", { uncertaintyType });
          close();
        },
        onSecondary: async ({ close }) => {
          await this.record("uncertainty_skipped");
          this.noteSkip();
          close();
        }
      });
      this.adapter.injectIntervention(modal);
    }

    showFinishLearning() {
      let step = 1;
      let transfer = "probably";
      const modal = createModal({
        title: "Finish Learning",
        body: "",
        customBody: () => buildFinishSteps(
          () => step,
          (nextStep) => {
            step = nextStep;
            modal.dispatchEvent(new CustomEvent("tf-refresh"));
          },
          (value) => {
            transfer = value;
          }
        ),
        primary: "Complete session",
        secondary: "Keep exploring",
        why: "You opened an end-of-session retrieval check. ThinkFirst will not grade this or save your typed answers.",
        feedbackType: "retrieve",
        onPrimary: async ({ close }) => {
          await this.record("retrieval_completed", { transfer });
          await this.record("reflection_prompt_completed");
          await this.record("session_ended");
          close();
          this.resetSessionState();
          this.renderDock();
        },
        onSecondary: async ({ close }) => {
          await this.record("retrieval_skipped");
          close();
        }
      });
      this.adapter.injectIntervention(modal);
    }

    installInteractionTracker() {
      const mark = () => {
        if (this.assistantCompleted) this.responseInteracted = true;
      };
      document.addEventListener("click", mark, true);
      document.addEventListener("scroll", mark, true);
      document.addEventListener("keydown", mark, true);
    }

    installNavigationWatcher() {
      let lastHref = location.href;
      const check = () => {
        if (location.href === lastHref) return;
        lastHref = location.href;
        this.refreshConversationState();
        this.renderDock();
      };

      const wrapHistory = (method) => {
        const original = history[method];
        history[method] = function patchedHistoryMethod(...args) {
          const result = original.apply(this, args);
          setTimeout(check, 0);
          return result;
        };
      };

      wrapHistory("pushState");
      wrapHistory("replaceState");
      window.addEventListener("popstate", check);
      window.addEventListener("hashchange", check);
      setInterval(check, 1500);
    }

    installSessionStartPrompt() {
      const tryShow = () => {
        this.refreshConversationState();
        if (this.isSchoolChatBlocked()) return true;
        if (this.sessionStartPromptOffered || this.attemptShown || this.attemptPromptOpen || this.learningGoalPromptOpen) return true;
        if (!this.isLearningActive() || !this.adapter.findPromptRoot()) return false;
        if (this.adapter.findLatestUserMessage() || this.adapter.findLatestAssistant()) return true;
        this.sessionStartPromptOffered = true;
        this.ensureSession();
        this.attemptShown = true;
        this.fallbackAttemptShown = true;
        this.record("attempt_prompt_shown");
        this.markAutoIntervention();
        this.showAttemptFirst(null, { submitAfter: false });
        return true;
      };
      setTimeout(tryShow, 900);
      let attempts = 0;
      const timer = setInterval(() => {
        attempts += 1;
        if (tryShow() || attempts > 30) clearInterval(timer);
      }, 700);
    }

    renderDock() {
      document.querySelector(".tf-dock")?.remove();
      document.querySelector(".tf-pill")?.remove();
      const dock = document.createElement("section");
      dock.className = "tf-pill";
      dock.setAttribute("aria-label", "ThinkFirst");
      const active = this.isLearningActive();
      const modeLabel = modeLabelFor(this.getMode());
      dock.innerHTML = `
        <button class="tf-pill__button" type="button">
          <span>${this.getMode() === "quick" ? "⚡" : "🧠"}</span>
          <strong>ThinkFirst</strong>
          <small>${active ? `${modeLabel.replace(" Mode", "")} · ${this.getJourneyStage()}` : "Quick"}</small>
        </button>
      `;
      dock.querySelector("button").addEventListener("click", () => this.toggleSidePanel());
      document.body.append(dock);
    }

    getJourneyStage() {
      if (!this.attemptShown) return "Generate";
      if (this.promptCount < 2) return "Explore";
      if (this.verifyShown) return "Verify";
      if (this.reflectionShown || this.retrieveSuggested) return "Retrieve";
      return "Explore";
    }

    toggleSidePanel() {
      if (document.querySelector(".tf-sidepanel")) {
        document.querySelector(".tf-sidepanel").remove();
        this.sidePanelOpen = false;
        return;
      }
      this.ensureSession();
      this.sidePanelOpen = true;
      const panel = document.createElement("aside");
      panel.className = "tf-sidepanel";
      panel.setAttribute("aria-label", "ThinkFirst learning session");
      panel.innerHTML = `
        <div class="tf-sidepanel__head">
          <div>
            <strong>ThinkFirst</strong>
            <p>${modeLabelFor(this.getMode())} · ${Math.max(1, this.promptCount)} exchange${this.promptCount === 1 ? "" : "s"}</p>
          </div>
          <button type="button" data-action="close" aria-label="Close ThinkFirst panel">×</button>
        </div>
        <ol class="tf-journey">
          ${this.renderJourneyItem("Generate", this.attemptShown, this.getJourneyStage() === "Generate")}
          ${this.renderJourneyItem("Explore", this.promptCount > 1, this.getJourneyStage() === "Explore")}
          ${this.renderJourneyItem("Evaluate", this.evaluationShown, this.getJourneyStage() === "Evaluate")}
          ${this.renderJourneyItem("Verify", this.verifyShown, this.getJourneyStage() === "Verify")}
          ${this.renderJourneyItem("Retrieve", this.reflectionShown || this.retrieveSuggested, this.getJourneyStage() === "Retrieve")}
        </ol>
        <div class="tf-sidepanel__tools">
          <h3>ThinkFirst tools</h3>
          <button type="button" data-tool="test">Test me</button>
          <button type="button" data-tool="verify">Verify this</button>
          <button type="button" data-tool="school">School check</button>
          <button type="button" data-tool="challenge">Challenge AI</button>
          <button type="button" data-tool="compare">Compare</button>
          <button type="button" data-tool="uncertainty">What am I unsure about?</button>
          <button type="button" data-tool="explain">Explain it myself</button>
          <button type="button" data-tool="finish">Finish learning</button>
        </div>
        <div class="tf-sidepanel__foot">
          <button type="button" data-action="reset">New learning session</button>
          <p>No conversation content stored.</p>
        </div>
      `;
      panel.querySelector("[data-action='close']").addEventListener("click", () => this.toggleSidePanel());
      panel.querySelector("[data-action='reset']").addEventListener("click", () => {
        this.resetSessionState({ endCurrent: true });
        panel.remove();
        this.renderDock();
      });
      panel.querySelectorAll("[data-tool]").forEach((button) => {
        button.addEventListener("click", () => this.openTool(button.dataset.tool));
      });
      document.body.append(panel);
    }

    renderJourneyItem(label, done, active) {
      return `<li class="${active ? "is-active" : ""}"><span>${done ? "✓" : active ? "●" : "○"}</span>${label}</li>`;
    }

    async record(type, detail = {}) {
      if (!this.sessionId && type !== "session_started") return;
      await this.message({
        type: "RECORD_EVENT",
        event: {
          eventId: uuid(),
          type,
          sessionId: this.sessionId,
          provider: PROVIDER,
          timestamp: Date.now(),
          mode: this.settings.mode,
          ...detail
        }
      });
    }

    message(payload) {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage(payload, (response) => resolve(response || { ok: false }));
      });
    }

    openSettings() {
      this.message({ type: "OPEN_SETTINGS" });
    }

    getSchoolScopeId() {
      const existing = globalThis.sessionStorage?.getItem(SCHOOL_SCOPE_KEY);
      if (existing) return existing;
      const generated = globalThis.crypto?.randomUUID?.() || uuid();
      globalThis.sessionStorage?.setItem(SCHOOL_SCOPE_KEY, generated);
      return generated;
    }
  }

  function createModal(config) {
    const overlay = document.createElement("div");
    overlay.className = "tf-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.innerHTML = `
      <div class="tf-card">
        <div class="tf-card__head">
          <div class="tf-logo-mark" aria-hidden="true"></div>
          <h2>${escapeHtml(config.title)}</h2>
        </div>
        ${config.body ? `<p class="tf-card__body">${escapeHtml(config.body)}</p>` : ""}
        <div class="tf-card__custom"></div>
        ${config.textareaLabel ? `<label class="tf-field">${escapeHtml(config.textareaLabel)}<textarea placeholder="${escapeHtml(config.textareaPlaceholder || "")}"></textarea></label>` : ""}
        ${config.inputLabel ? `<label class="tf-field">${escapeHtml(config.inputLabel)}<input type="text" placeholder="${escapeHtml(config.inputPlaceholder || "")}"></label>` : ""}
        ${config.footer ? `<p class="tf-card__footer">${escapeHtml(config.footer)}</p>` : ""}
        ${config.why ? `<details class="tf-why"><summary>Why now?</summary><p>${escapeHtml(config.why)}</p></details>` : ""}
        ${config.feedbackType ? `<div class="tf-feedback" aria-label="Intervention feedback"><button type="button" data-feedback="helpful">Helpful</button><button type="button" data-feedback="not_useful">Not useful</button></div>` : ""}
        <div class="tf-actions">
          ${config.secondary !== "" ? `<button class="tf-secondary" type="button">${escapeHtml(config.secondary || "Skip")}</button>` : ""}
          ${config.primary !== "" ? `<button class="tf-primary" type="button">${escapeHtml(config.primary || "Done")}</button>` : ""}
        </div>
      </div>
    `;
    const custom = overlay.querySelector(".tf-card__custom");
    const renderCustom = () => {
      custom.replaceChildren();
      if (typeof config.customBody === "function") {
        custom.append(config.customBody());
      } else if (config.customBody) {
        custom.append(config.customBody);
      }
    };
    const close = () => overlay.remove();
    overlay.addEventListener("tf-refresh", renderCustom);
    overlay.querySelector(".tf-primary")?.addEventListener("click", () => config.onPrimary?.({ close }));
    overlay.querySelector(".tf-secondary")?.addEventListener("click", () => config.onSecondary?.({ close }));
    overlay.querySelectorAll("[data-feedback]").forEach((button) => {
      button.addEventListener("click", () => {
        if (config.onFeedback) {
          config.onFeedback(button.dataset.feedback);
        } else if (config.feedbackType && globalThis.__thinkFirstRecord) {
          globalThis.__thinkFirstRecord("intervention_feedback", {
            intervention: config.feedbackType,
            feedback: button.dataset.feedback
          });
        }
        button.closest(".tf-feedback").querySelectorAll("button").forEach((item) => item.classList.remove("is-selected"));
        button.classList.add("is-selected");
      });
    });
    renderCustom();
    if (config.requireText) {
      const textarea = overlay.querySelector("textarea");
      const primary = overlay.querySelector(".tf-primary");
      if (primary && textarea) {
        primary.disabled = true;
        textarea.addEventListener("input", () => {
          primary.disabled = textarea.value.trim().length === 0;
        });
      }
    }
    setTimeout(() => overlay.querySelector("textarea, input, button:not(:disabled)")?.focus(), 50);
    return overlay;
  }

  function buildChoiceList(options, onSelect, name = "tf-evaluation", current = "", legend = "", config = {}) {
    const fieldset = document.createElement("fieldset");
    fieldset.className = "tf-choice-list";
    fieldset.innerHTML = legend
      ? `<legend class="tf-choice-legend">${escapeHtml(legend)}</legend>`
      : "<legend class='tf-sr-only'>Choice</legend>";
    options.forEach(([value, label], index) => {
      const id = `${name}-${value}`;
      const row = document.createElement("label");
      row.className = "tf-choice";
      const checked = current ? value === current : !config.allowNone && (value === "unsure" || index === 0);
      row.innerHTML = `<input type="radio" name="${escapeHtml(name)}" id="${id}" value="${value}" ${checked ? "checked" : ""}> <span>${escapeHtml(label)}</span>`;
      const input = row.querySelector("input");
      input.addEventListener("click", (event) => {
        if (!config.toggleable || !input.checked || current !== value) return;
        event.preventDefault();
        input.checked = false;
        current = "";
        onSelect("");
      });
      input.addEventListener("change", () => {
        current = value;
        onSelect(value);
      });
      fieldset.append(row);
    });
    return fieldset;
  }

  function buildToolButtons(tools, onSelect) {
    const wrap = document.createElement("div");
    wrap.className = "tf-tool-grid";
    for (const [value, label] of tools) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.addEventListener("click", () => onSelect(value));
      wrap.append(button);
    }
    return wrap;
  }

  function buildSectionHeading(title, body = "") {
    const wrap = document.createElement("div");
    wrap.className = "tf-section-heading";
    wrap.innerHTML = `
      <h3>${escapeHtml(title)}</h3>
      ${body ? `<p>${escapeHtml(body)}</p>` : ""}
    `;
    return wrap;
  }

  function buildFinishSteps(getStep, setStep, setTransfer) {
    const wrap = document.createElement("div");
    wrap.className = "tf-finish";
    const step = getStep();
    if (step === 1) {
      wrap.innerHTML = "<h3>1. Retrieve</h3><p>What are the 3 most important things you learned?</p><textarea placeholder='Private retrieval notes...'></textarea><button type='button' class='tf-inline'>Next</button>";
      wrap.querySelector("button").addEventListener("click", () => setStep(2));
    } else if (step === 2) {
      wrap.innerHTML = "<h3>2. Explain</h3><p>Explain the core idea without looking back.</p><textarea placeholder='Private explanation...'></textarea><button type='button' class='tf-inline'>Next</button>";
      wrap.querySelector("button").addEventListener("click", () => setStep(3));
    } else if (step === 3) {
      wrap.innerHTML = "<h3>3. Uncertainty</h3><p>What are you still unsure about?</p><textarea placeholder='Private uncertainty...'></textarea><button type='button' class='tf-inline'>Next</button>";
      wrap.querySelector("button").addEventListener("click", () => setStep(4));
    } else {
      wrap.innerHTML = "<h3>4. Transfer</h3><p>Could you use this knowledge in a different problem?</p>";
      wrap.append(buildChoiceList([
        ["confident", "Yes confidently"],
        ["probably", "Probably"],
        ["not_yet", "Not yet"]
      ], setTransfer, "tf-transfer", "probably"));
    }
    return wrap;
  }

  function nextActionForUncertainty(type) {
    return {
      concept: "Next action: ask AI for another explanation or analogy.",
      truth: "Next action: use Verify and check an independent source.",
      reasoning: "Next action: ask AI to expose steps and assumptions.",
      application: "Next action: try a new problem or example.",
      nothing: "Next action: continue exploring, or finish with retrieval when ready."
    }[type] || "Next action: choose the smallest thing that would reduce uncertainty.";
  }

  function buildVerifySteps(getStep, setStep, setJudgement, setCrossCheck, getLevel) {
    return () => {
      const wrap = document.createElement("div");
      wrap.className = "tf-verify";
      const step = getStep();
      const level = getLevel();
      if (step === 1) {
        wrap.innerHTML = `
          <h3>Pick one important factual claim.</h3>
          <p>Choose one statement from the answer that you would rely on.</p>
          <button type="button" class="tf-inline">I picked a claim</button>
        `;
        wrap.querySelector("button").addEventListener("click", () => setStep(2));
      } else if (step === 2) {
        wrap.innerHTML = `
          <h3>Check the source.</h3>
          <p>${level === "beginner" ? "Open a source and notice who made it." : "Who produced the evidence? Does it actually support the claim?"}</p>
          <div class="tf-segmented">
            <button type="button" data-value="supports">Supports</button>
            <button type="button" data-value="contradicts">Contradicts</button>
            <button type="button" data-value="unclear">Uncertain</button>
          </div>
        `;
        wrap.querySelectorAll("button").forEach((button) => {
          button.addEventListener("click", () => {
            setJudgement(button.dataset.value);
            setStep(3);
          });
        });
      } else {
        wrap.innerHTML = `
          <h3>Cross-check</h3>
          <p>${level === "advanced" ? "Compare one independent source and notice whether experts disagree." : "For an important claim, check one independent source outside the current page."}</p>
          <div class="tf-segmented">
            <button type="button" data-complete="true">I cross-checked</button>
            <button type="button" data-complete="false">Skip cross-check</button>
          </div>
        `;
        wrap.querySelectorAll("button").forEach((button) => {
          button.addEventListener("click", () => {
            setCrossCheck(button.dataset.complete === "true");
            button.closest(".tf-segmented").querySelectorAll("button").forEach((item) => item.classList.remove("is-selected"));
            button.classList.add("is-selected");
          });
        });
      }
      return wrap;
    };
  }

  function buildPromptExamples(examples = []) {
    if (!examples.length) return document.createDocumentFragment();
    const list = document.createElement("ul");
    list.className = "tf-example-list";
    for (const example of examples) {
      const item = document.createElement("li");
      item.textContent = example;
      list.append(item);
    }
    return list;
  }

  function getEvaluateCopy(mode) {
    if (mode === "create") {
      return {
        title: "Keep authorship visible.",
        body: "What changed between your direction and the AI's version?",
        inputLabel: "One authorship decision",
        inputPlaceholder: "One thing I will keep, rewrite, reject, or check...",
        defaultValue: "not_sure_mine",
        options: [
          ["useful_direction", "AI gave me a useful direction"],
          ["voice_changed", "AI changed my voice too much"],
          ["structure_improved", "AI improved the structure"],
          ["idea_to_use", "AI added an idea I might use"],
          ["rewrite_own_words", "I need to rewrite this in my own words"],
          ["needs_citation", "This needs citation or checking"],
          ["audience_mismatch", "It does not match my audience"],
          ["not_sure_mine", "I'm not sure what is still mine"]
        ]
      };
    }
    if (mode === "research") {
      return {
        title: "Compare the claim, not just the answer.",
        body: "What changed in the evidence, source quality, or claim you would rely on?",
        inputLabel: "One claim or source note",
        inputPlaceholder: "One claim, source, or disagreement I noticed...",
        defaultValue: "need_independent_source",
        options: [
          ["claim_to_check", "AI made a factual claim I need to check"],
          ["new_evidence", "AI added evidence I did not know"],
          ["changed_understanding", "AI changed my understanding of the issue"],
          ["source_quality_uncertain", "The source quality is uncertain"],
          ["possible_disagreement", "I found possible disagreement"],
          ["need_independent_source", "I need an independent source"],
          ["not_sure", "I'm not sure yet"]
        ]
      };
    }
    return {
      title: "Compare, don't just replace.",
      body: "What changed between your thinking and the AI answer?",
      inputLabel: "One thing I noticed",
      inputPlaceholder: "One thing I noticed...",
      defaultValue: "unsure",
      options: [
        ["added_missing", "Added something I missed"],
        ["corrected_mistake", "Corrected a mistake"],
        ["different_approach", "Used a different approach"],
        ["confirmed", "Confirmed my approach"],
        ["disagree", "I disagree with part of the answer"],
        ["challenge", "I want to challenge one part"],
        ["confused", "I don't understand part of the answer"],
        ["unsure", "I'm not sure yet"]
      ]
    };
  }

  function getAttemptCopy(mode) {
    if (mode === "research") {
      return {
        title: "Before AI investigates - what claim matters?",
        body: "Name what you need to verify, not the whole answer. This keeps research focused.",
        placeholder: "The claim or evidence I need to check...",
        examples: ["What would count as reliable evidence?", "Which fact would change my decision?", "What source would I trust?"]
      };
    }
    if (mode === "create") {
      return {
        title: "Before AI creates - what is your direction?",
        body: "Write your intention, criteria, thesis, audience, or rough outline before generating.",
        placeholder: "My direction...",
        examples: ["My thesis is...", "The tone should be...", "A good result must include..."]
      };
    }
    if (mode === "school") {
      return {
        title: "Before AI helps with schoolwork - what is your move?",
        body: "Name the task type, what your teacher allows, and your first attempt before AI contributes.",
        placeholder: "My first attempt or plan...",
        examples: ["My current answer is...", "The source I need to check is...", "The rule for AI use is..."]
      };
    }
    return {
      title: "Before AI answers - what do you think?",
      body: "Write a prediction, first step, equation, explanation, outline, or what you do not understand yet.",
      placeholder: "My attempt...",
      examples: ["I think the first step is...", "My hypothesis is...", "I am unsure about..."]
    };
  }

  function modeLabelFor(mode) {
    return {
      quick: "Quick Mode",
      learn: "Learn Mode",
      research: "Research Mode",
      create: "Create Mode",
      school: "School Mode"
    }[mode] || "Learn Mode";
  }

  function whyForAutomaticReason(reason) {
    return {
      research_mode: "You're in Research Mode, so ThinkFirst prioritizes claim checking after the AI answer stabilizes.",
      sources_visible: "This answer includes visible source links, so ThinkFirst is offering a quick Claim -> Source -> Cross-check loop.",
      authorship_check: "You're in Create Mode, so ThinkFirst is asking what changed between your intent and the AI's version.",
      school_process_check: "You're in School Mode. ThinkFirst is asking you to document allowed use, source checks, and your own contribution before the answer becomes schoolwork.",
      first_answer_compare: "The first AI answer has arrived. This is the best moment to compare it with your own attempt before simply accepting it.",
      retrieval_opportunity: "You've had several exchanges. A short retrieval checkpoint can help turn the conversation into something you can use later."
    }[reason] || "ThinkFirst found a local learning moment and is offering one short prompt within your session budget.";
  }

  function uuid() {
    return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char]));
  }

  new ThinkFirstController().start();
})();
