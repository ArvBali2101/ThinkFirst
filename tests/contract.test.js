import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

test("manifest keeps minimal privacy-first permissions", () => {
  const manifest = JSON.parse(readFileSync(path.join(root, "manifest.json"), "utf8"));
  assert.deepEqual(manifest.permissions, ["storage"]);
  assert.equal(manifest.host_permissions.includes("https://chatgpt.com/*"), true);
  assert.equal(manifest.host_permissions.includes("https://chat.openai.com/*"), true);
  for (const forbidden of ["tabs", "history", "clipboardRead", "clipboardWrite", "webRequest"]) {
    assert.equal(manifest.permissions.includes(forbidden), false);
  }
  assert.equal(manifest.web_accessible_resources[0].matches.includes("<all_urls>"), false);
});

test("manifest entry points and web accessible resources exist", () => {
  const manifest = JSON.parse(readFileSync(path.join(root, "manifest.json"), "utf8"));
  const files = [
    manifest.background.service_worker,
    manifest.action.default_popup,
    manifest.options_page,
    ...manifest.content_scripts.flatMap((script) => [...(script.js || []), ...(script.css || [])]),
    ...manifest.web_accessible_resources.flatMap((resource) => resource.resources)
  ];
  for (const file of files) {
    assert.equal(existsSync(path.join(root, file)), true, `${file} should exist`);
  }
});

test("HTML pages reference existing local assets only", () => {
  const htmlFiles = [
    "src/popup/popup.html",
    "src/dashboard/dashboard.html",
    "src/onboarding/onboarding.html",
    "src/settings/settings.html"
  ];

  for (const htmlFile of htmlFiles) {
    const html = readFileSync(path.join(root, htmlFile), "utf8");
    const dir = path.dirname(path.join(root, htmlFile));
    const refs = [
      ...html.matchAll(/<script[^>]+src="([^"]+)"/g),
      ...html.matchAll(/<link[^>]+href="([^"]+)"/g)
    ].map((match) => match[1]).filter((ref) => !ref.startsWith("http"));
    for (const ref of refs) {
      assert.equal(existsSync(path.resolve(dir, ref)), true, `${htmlFile} references missing ${ref}`);
    }
  }
});

test("short assistant answers can still trigger response completion", () => {
  const content = readFileSync(path.join(root, "src/content/index.js"), "utf8");
  assert.equal(content.includes("length < 40"), false);
  assert.match(content, /length === 0 && !hasSourceLink/);
});

test("delete-all flows also clear the local pilot survey", () => {
  const dashboard = readFileSync(path.join(root, "src/dashboard/Dashboard.js"), "utf8");
  const settings = readFileSync(path.join(root, "src/settings/Settings.js"), "utf8");
  assert.match(dashboard, /localStorage\.removeItem\(\"tf_pilot_survey_local\"\)/);
  assert.match(settings, /localStorage\.removeItem\(\"tf_pilot_survey_local\"\)/);
});

test("popup uses one mode picker instead of duplicate dropdown and cards", () => {
  const popupHtml = readFileSync(path.join(root, "src/popup/popup.html"), "utf8");
  const popupJs = readFileSync(path.join(root, "src/popup/Popup.js"), "utf8");
  assert.equal(popupHtml.includes("modeSelect"), false);
  assert.equal(popupHtml.includes("<select"), false);
  assert.equal(popupJs.includes("modeSelect"), false);
  assert.match(popupHtml, /modeCards/);
});

test("late observed ChatGPT messages do not open an attempt prompt after AI has already started", () => {
  const content = readFileSync(path.join(root, "src/content/index.js"), "utf8");
  const handler = content.match(/async handleUserMessageObserved\(userNode\) \{[\s\S]*?\n    \}/)?.[0] || "";
  assert.equal(handler.includes("showAttemptFirst"), false);
  assert.equal(handler.includes("attempt_prompt_shown"), false);
});

test("attempt readiness choices are optional and can be cleared", () => {
  const content = readFileSync(path.join(root, "src/content/index.js"), "utf8");
  assert.match(content, /let readiness = ""/);
  assert.match(content, /let unfamiliar = ""/);
  assert.match(content, /allowNone: true/);
  assert.match(content, /toggleable: true/);
  assert.match(content, /readiness: readiness \|\| "not_selected"/);
});

test("first attempt can trigger from composer input before ChatGPT send", () => {
  const content = readFileSync(path.join(root, "src/content/index.js"), "utf8");
  assert.match(content, /observePromptIntent\(callback\)/);
  assert.match(content, /this\.adapter\.observePromptIntent\(\(\) => this\.handlePromptIntent\(\)\)/);
  assert.match(content, /async handlePromptIntent\(\)/);
  assert.match(content, /this\.showAttemptFirst\(null, \{ submitAfter: false \}\)/);
  assert.match(content, /Done - I'll ask AI/);
});

test("fresh ChatGPT sessions show the full Attempt First prompt before the first exchange", () => {
  const content = readFileSync(path.join(root, "src/content/index.js"), "utf8");
  assert.match(content, /installSessionStartPrompt\(\)/);
  assert.match(content, /this\.installSessionStartPrompt\(\)/);
  assert.match(content, /this\.showAttemptFirst\(null, \{ submitAfter: false \}\)/);
  assert.match(content, /this\.record\("attempt_prompt_shown"\)/);
  assert.match(content, /Before AI answers - what do you think\?/);
  assert.match(content, /this\.ensureSession\(\)/);
  const startupHook = content.match(/installSessionStartPrompt\(\) \{[\s\S]*?\n    \}/)?.[0] || "";
  assert.equal(startupHook.includes("showLearningGoal"), false);
});

test("Compare waits for a real submitted user message and completed assistant response", () => {
  const content = readFileSync(path.join(root, "src/content/index.js"), "utf8");
  assert.match(content, /awaitingAssistantResponse = true/);
  assert.match(content, /assistantNodeAtSubmit = this\.adapter\.findLatestAssistant\(\)/);
  assert.match(content, /if \(!this\.awaitingAssistantResponse \|\| this\.promptCount < 1\) return/);
  assert.match(content, /node && this\.assistantNodeAtSubmit && node === this\.assistantNodeAtSubmit/);
  assert.match(content, /if \(typeof perform === "function"\) \{[\s\S]*?this\.promptCount \+= 1/);
});

test("Compare recovers when ChatGPT send events are missed but a new assistant starts", () => {
  const content = readFileSync(path.join(root, "src/content/index.js"), "utf8");
  assert.match(content, /this\.lastAssistantNode = this\.findLatestAssistant\(\)/);
  assert.match(content, /this\.adapter\.observeAssistantStart\(\(detail\) => this\.handleAssistantStart\(detail\)\)/);
  assert.match(content, /handleAssistantStart\(\{ node \} = \{\}\)/);
  assert.match(content, /if \(!this\.attemptShown \|\| this\.attemptPromptOpen \|\| this\.learningGoalPromptOpen\) return/);
  assert.match(content, /this\.promptCount = Math\.max\(this\.promptCount, 1\)/);
  assert.match(content, /this\.awaitingAssistantResponse = true/);
});

test("Create and Research modes use mode-specific evaluation forms", () => {
  const content = readFileSync(path.join(root, "src/content/index.js"), "utf8");
  assert.match(content, /function getEvaluateCopy\(mode\)/);
  assert.match(content, /AI changed my voice too much/);
  assert.match(content, /I need to rewrite this in my own words/);
  assert.match(content, /I'm not sure what is still mine/);
  assert.match(content, /AI made a factual claim I need to check/);
  assert.match(content, /The source quality is uncertain/);
  assert.match(content, /I need an independent source/);
  assert.match(content, /const copy = getEvaluateCopy\(this\.getMode\(\)\)/);
});

test("visible sources prioritize verification before mode-specific Compare", () => {
  const content = readFileSync(path.join(root, "src/content/index.js"), "utf8");
  assert.match(content, /const verificationRelevant = mode === "research" \|\| Boolean\(sourcePresent\)/);
  assert.match(content, /decisionReason: mode === "research" \? "research_mode" : "sources_visible"/);
  assert.equal(content.includes("mode !== \"create\" && Boolean(sourcePresent)"), false);
});

test("measurement tab uses learner-friendly labels while keeping audit events visible", () => {
  const dashboard = readFileSync(path.join(root, "src/dashboard/Dashboard.js"), "utf8");
  assert.equal(dashboard.includes("<dt>Numerator</dt>"), false);
  assert.equal(dashboard.includes("<dt>Denominator</dt>"), false);
  assert.match(dashboard, /What raises this metric/);
  assert.match(dashboard, /What it is measured against/);
  assert.match(dashboard, /Privacy boundary/);
  assert.match(dashboard, /formatMeasurementValue/);
});

test("School student guard requires attempt, blocks copying, and preserves privacy", () => {
  const constants = readFileSync(path.join(root, "src/shared/constants.js"), "utf8");
  const settingsHtml = readFileSync(path.join(root, "src/settings/settings.html"), "utf8");
  const settingsJs = readFileSync(path.join(root, "src/settings/Settings.js"), "utf8");
  const serviceWorker = readFileSync(path.join(root, "src/background/serviceWorker.js"), "utf8");
  const content = readFileSync(path.join(root, "src/content/index.js"), "utf8");
  assert.match(constants, /schoolCopyBlocker: true/);
  assert.match(constants, /schoolGuard: "tf_school_guard"/);
  assert.match(settingsHtml, /School copy blocker/);
  assert.match(settingsJs, /schoolCopyBlocker/);
  assert.match(serviceWorker, /ACTIVATE_SCHOOL_GUARD/);
  assert.match(serviceWorker, /GET_SCHOOL_GUARD/);
  assert.match(content, /isStrictStudentMode\(\)/);
  assert.match(content, /this\.settings\.attemptEnabled && !this\.attemptShown && \(this\.isStrictStudentMode\(\) \|\| this\.canAutoIntervene\(\)\)/);
  assert.match(content, /this\.schoolGuard = snapshot\.schoolGuard \|\| null/);
  assert.match(content, /this\.isSchoolChatBlocked\(\)/);
  assert.match(content, /ChatGPT blocked for this task/);
  assert.match(content, /1\. School rule/);
  assert.match(content, /2\. Assignment stage/);
  assert.match(content, /3\. Your own thinking/);
  assert.match(content, /const strictStudentMode = this\.isStrictStudentMode\(\)/);
  assert.match(content, /requireText: strictStudentMode/);
  assert.match(content, /secondary: strictStudentMode \? ""/);
  assert.match(content, /handleAssistantCopy\(detail, event\)/);
  assert.match(content, /event\?\.preventDefault\?\.\(\)/);
  assert.match(content, /const shouldBlock = this\.shouldStartIntegrityPause\(detail\)[\s\S]*?event\?\.preventDefault\?\.\(\)[\s\S]*?await this\.record\("assistant_copy_detected", detail\)/);
  assert.match(content, /this\.getMode\(\) === "school" \|\| Boolean\(this\.settings\.commitmentMode\)/);
  assert.match(content, /Date\.now\(\) < this\.integrityPauseUntil[\s\S]*?event\.preventDefault\(\)/);
  assert.match(content, /\["small", "medium", "large"\]\.includes\(detail\.copiedRangeClass\)/);
  assert.match(content, /10 \* 60_000/);
  assert.match(content, /pauseSeconds: 600/);
  assert.match(content, /ACTIVATE_SCHOOL_GUARD/);
  assert.equal(content.includes("clipboardText"), false);
  assert.equal(content.includes("ThinkFirst is not judging intent or calling this cheating."), true);
});

test("Exam Guard runs broadly but keeps logs temporary and metadata-only", () => {
  const manifest = JSON.parse(readFileSync(path.join(root, "manifest.json"), "utf8"));
  const constants = readFileSync(path.join(root, "src/shared/constants.js"), "utf8");
  const serviceWorker = readFileSync(path.join(root, "src/background/serviceWorker.js"), "utf8");
  const examGuard = readFileSync(path.join(root, "src/content/examGuard.js"), "utf8");
  const chatgpt = readFileSync(path.join(root, "src/content/index.js"), "utf8");
  const settingsHtml = readFileSync(path.join(root, "src/settings/settings.html"), "utf8");
  const allUrlsScript = manifest.content_scripts.find((script) => script.matches.includes("<all_urls>"));
  assert.ok(allUrlsScript, "Exam Guard broad content script is missing");
  assert.deepEqual(allUrlsScript.js, ["src/content/examGuard.js"]);
  for (const forbidden of ["tabs", "history", "clipboardRead", "clipboardWrite", "webRequest"]) {
    assert.equal(manifest.permissions.includes(forbidden), false);
  }
  assert.match(constants, /examGuard: "tf_exam_guard"/);
  assert.match(constants, /examGuardEnabled: true/);
  assert.match(settingsHtml, /Exam Guard/);
  assert.match(serviceWorker, /ACTIVATE_EXAM_GUARD/);
  assert.match(serviceWorker, /RECORD_EXAM_GUARD/);
  assert.match(examGuard, /detectExamSignal/);
  assert.match(examGuard, /blockedExamCopies/);
  assert.match(examGuard, /tabSwitchWarnings/);
  assert.match(examGuard, /blockedSiteVisits/);
  assert.match(chatgpt, /Exam Mode active - use AI only for learning\./);
  assert.match(chatgpt, /blockedChatGPTPastes/);
  assert.match(chatgpt, /blockedSuspiciousPrompts/);
  assert.equal(serviceWorker.includes("questionText"), false);
  assert.equal(examGuard.includes("setExamQuestion"), false);
});
