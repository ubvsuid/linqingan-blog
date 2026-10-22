import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { ESLint } from "eslint";

// Bounded mitigation for GHSA-vfj7-8cjw-p6xm, not a general glob adapter.
// tinyglobby expands literal directories differently from fast-glob. The reviewed
// Next plugin calls globSync only for settings.next.rootDir, which must stay unset.
// Config, caller or dependency changes require a new compatibility review.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(root, "package.json"));
const callerHash = "886677432990a735e5ebdfb345ff1cbd40e264f9947a8432eeeb254b3a926bde";
const pluginHash = "2363890cddf83532994d1859f246e013ca6efb0cb8279f16cbefb8de01ef934f";
const configHash = "48be8a4f3b84809818b0fa7883cc5d16e2a6cf1b100481c969d211e447ab6bd3";
const digest = (value) => createHash("sha256").update(value).digest("hex");

function installed(from, name) {
  const entry = from.resolve(name);
  let directory = path.dirname(entry);
  while (!fs.existsSync(path.join(directory, "package.json"))) {
    const parent = path.dirname(directory);
    assert.notEqual(parent, directory, `Cannot locate installed ${name}`);
    directory = parent;
  }
  return {
    directory,
    manifest: JSON.parse(fs.readFileSync(path.join(directory, "package.json"), "utf8")),
    require: createRequire(entry),
  };
}

function javascriptFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? javascriptFiles(file) : entry.name.endsWith(".js") ? [file] : [];
  });
}

export function assertReviewedCaller(source) {
  assert.equal(digest(source), callerHash, "Unreviewed Next glob caller semantics; stop and review");
}

export function assertGlobInterface(module) {
  assert.equal(typeof module?.globSync, "function", "Unreviewed globSync export; stop and review");
}

export function assertNoRootDir(config, file) {
  assert.ok(!Object.hasOwn(config.settings?.next ?? {}, "rootDir"),
    `${file}: settings.next.rootDir is outside the reviewed glob boundary`);
}

export async function checkEffectiveConfigs(eslint, files) {
  let checked = 0;
  for (const file of files) {
    const config = await eslint.calculateConfigForFile(file);
    if (!config) continue;
    assertNoRootDir(config, file);
    checked += 1;
  }
  assert.ok(checked > 0, "No effective ESLint configurations checked");
  return checked;
}

function assertDependencyClosure(packages) {
  for (const [location, item] of Object.entries(packages)) {
    assert.ok(!/(?:^|\/)node_modules\/(?:braces|micromatch)$/.test(location),
      `Vulnerable dependency chain returned at ${location}`);
    if (location.endsWith("/fast-glob")) {
      assert.equal(item.name, "tinyglobby", `Unreviewed fast-glob dependency at ${location}`);
      assert.equal(item.version, "0.2.17", "Unreviewed alias version");
    }
  }
}

async function main() {
  assert.equal(process.versions.node.split(".")[0], "22", "This boundary is validated on Node 22");
  assert.equal(process.argv.length, 2, "This guard accepts no bypass arguments");
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  assert.deepEqual(manifest.overrides["@next/eslint-plugin-next@16.2.10"],
    { "fast-glob": "npm:tinyglobby@0.2.17" }, "Scoped alias changed; stop and review");
  assert.equal(manifest.scripts.lint,
    "node scripts/check-eslint-glob-boundary.mjs && eslint .", "Required lint guard integration changed");
  assert.equal(digest(fs.readFileSync(path.join(root, "eslint.config.mjs"))), configHash,
    "Unreviewed ESLint configuration; stop and review");

  const plugin = installed(require, "@next/eslint-plugin-next");
  assert.equal(plugin.manifest.version, "16.2.10", "Unreviewed Next plugin version");
  assert.equal(installed(require, "eslint-config-next").manifest.version, "16.2.10",
    "Unreviewed Next ESLint configuration version");
  const alias = installed(plugin.require, "fast-glob");
  assert.equal(alias.manifest.name, "tinyglobby", "Scoped alias was not installed");
  assert.equal(alias.manifest.version, "0.2.17", "Unreviewed alias version");
  assert.equal(installed(alias.require, "fdir").manifest.version, "6.5.0", "Unreviewed fdir version");
  assert.equal(installed(alias.require, "picomatch").manifest.version, "4.0.7", "Unreviewed picomatch version");
  const glob = plugin.require("fast-glob");
  assertGlobInterface(glob);

  const dist = path.join(plugin.directory, "dist");
  const files = javascriptFiles(dist).sort();
  const fingerprint = createHash("sha256");
  const importers = [];
  for (const file of files) {
    const relative = path.relative(dist, file).split(path.sep).join("/");
    const source = fs.readFileSync(file, "utf8");
    fingerprint.update(`${relative}\0${source}\0`);
    if (source.includes("fast-glob")) importers.push(relative);
  }
  assert.equal(fingerprint.digest("hex"), pluginHash, "Unreviewed Next plugin code; stop and review");
  assert.deepEqual(importers, ["utils/get-root-dirs.js"], "Unreviewed glob caller set");
  const source = fs.readFileSync(path.join(dist, "utils/get-root-dirs.js"), "utf8");
  assertReviewedCaller(source);
  const callerModule = { exports: {} };
  vm.runInNewContext(source, {
    module: callerModule,
    exports: callerModule.exports,
    require(name) {
      assert.equal(name, "fast-glob");
      return { globSync() { throw new Error("Default root path must never call globSync"); } };
    },
  }, { timeout: 1000 });
  assert.deepEqual(Array.from(callerModule.exports.getRootDirs({ cwd: root, settings: {} })), [root]);

  const lock = JSON.parse(fs.readFileSync(path.join(root, "package-lock.json"), "utf8"));
  assertDependencyClosure(lock.packages);
  const candidates = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    { cwd: root, encoding: "utf8" }).split("\0").filter((file) => /\.[cm]?[jt]sx?$/.test(file));
  const count = await checkEffectiveConfigs(new ESLint({ cwd: root, cache: false, fix: false }), candidates);

  // Negative tests exercise the real effective-config API without editing the
  // repository config or executing an incompatible glob path.
  for (const rootDir of ["src/**", ["src/**"]]) {
    const eslint = new ESLint({ cwd: root, overrideConfig: [{ settings: { next: { rootDir } } }] });
    await assert.rejects(checkEffectiveConfigs(eslint, ["src/components/article-feedback.tsx"]),
      /settings\.next\.rootDir/);
  }
  for (const rootDir of ["", [], null, undefined]) {
    assert.throws(() => assertNoRootDir({ settings: { next: { rootDir } } }, "negative fixture"),
      /settings\.next\.rootDir/);
  }
  assert.throws(() => assertReviewedCaller(source.replace("onlyDirectories: true", "onlyDirectories: false")),
    /Unreviewed Next glob caller/);
  assert.throws(() => assertGlobInterface({ ...glob, globSync: undefined }), /Unreviewed globSync export/);
  assert.throws(() => assertDependencyClosure({ ...lock.packages, "node_modules/braces": { version: "3.0.3" } }),
    /Vulnerable dependency chain/);

  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "eslint-glob-boundary-"));
  try {
    fs.mkdirSync(path.join(fixture, "one"));
    fs.mkdirSync(path.join(fixture, "two"));
    fs.writeFileSync(path.join(fixture, "file.txt"), "fixture");
    const directories = glob.globSync(`${fixture.replaceAll("\\", "/")}/*`, { onlyDirectories: true });
    assert.deepEqual(directories.map((directory) => path.basename(directory.replace(/\/$/, ""))).sort(),
      ["one", "two"], "Unreviewed globSync directory-only interface");
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
  console.log(`ESLint glob boundary passed: ${count} effective configurations; reviewed caller and alias; 9 negative tests.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`ESLint glob boundary FAILED: ${error.message}`);
    process.exitCode = 1;
  });
}
