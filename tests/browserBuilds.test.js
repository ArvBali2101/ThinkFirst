import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

test("browser build targets generate Chromium, Edge, and Firefox manifests", () => {
  execFileSync(process.execPath, ["scripts/build.mjs", "--target=chromium"], { cwd: root, stdio: "pipe" });
  execFileSync(process.execPath, ["scripts/build.mjs", "--target=edge"], { cwd: root, stdio: "pipe" });
  execFileSync(process.execPath, ["scripts/build.mjs", "--target=firefox"], { cwd: root, stdio: "pipe" });

  const chromium = manifest("dist");
  const edge = manifest("dist-edge");
  const firefox = manifest("dist-firefox");

  assert.equal(chromium.background.service_worker, "src/background/serviceWorker.js");
  assert.equal(edge.background.service_worker, "src/background/serviceWorker.js");
  assert.equal(firefox.background.service_worker, undefined);
  assert.deepEqual(firefox.background.scripts, ["src/background/serviceWorker.js"]);
  assert.equal(firefox.browser_specific_settings.gecko.id, "thinkfirst@local");
  assert.equal(existsSync(path.join(root, "dist-firefox", "src", "content", "index.js")), true);
});

function manifest(dist) {
  return JSON.parse(readFileSync(path.join(root, dist, "manifest.json"), "utf8"));
}
