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
    ...manifest.content_scripts.flatMap((script) => [...script.js, ...script.css]),
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
  assert.match(content, /userMessageObservedForPrompt = true/);
  assert.match(content, /if \(!this\.awaitingAssistantResponse \|\| !this\.userMessageObservedForPrompt \|\| this\.promptCount < 1\) return/);
  assert.match(content, /if \(typeof perform === "function"\) \{[\s\S]*?this\.promptCount \+= 1/);
});
