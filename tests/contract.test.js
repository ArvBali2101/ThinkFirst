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
