import { cp, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const targetArg = process.argv.find((arg) => arg.startsWith("--target="));
const target = targetArg ? targetArg.split("=")[1] : "chromium";
const distName = target === "firefox" ? "dist-firefox" : target === "edge" ? "dist-edge" : "dist";
const dist = path.join(root, distName);

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

if (!["chromium", "edge", "firefox"].includes(target)) {
  throw new Error(`Unknown build target: ${target}`);
}

if (existsSync(path.join(root, "src"))) {
  await cp(path.join(root, "src"), path.join(dist, "src"), { recursive: true });
}

const manifest = JSON.parse(await readFileUtf8(path.join(root, "manifest.json")));
const outputManifest = manifestForTarget(manifest, target);
await writeFileUtf8(path.join(dist, "manifest.json"), `${JSON.stringify(outputManifest, null, 2)}\n`);

console.log(`ThinkFirst ${target} extension built in ${distName}/`);

async function readFileUtf8(file) {
  const { readFile } = await import("node:fs/promises");
  return readFile(file, "utf8");
}

async function writeFileUtf8(file, text) {
  const { writeFile } = await import("node:fs/promises");
  return writeFile(file, text);
}

function manifestForTarget(base, targetName) {
  const next = structuredClone(base);
  if (targetName === "firefox") {
    delete next.minimum_chrome_version;
    next.background = {
      scripts: [base.background.service_worker],
      type: "module"
    };
    next.browser_specific_settings = {
      gecko: {
        id: "thinkfirst@local",
        strict_min_version: "121.0"
      }
    };
  }
  if (targetName === "edge") {
    next.name = "ThinkFirst";
  }
  return next;
}
