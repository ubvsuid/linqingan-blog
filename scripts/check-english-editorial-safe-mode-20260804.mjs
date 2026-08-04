import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const articlePath = "src/lib/english-controller-safe-mode-14.ts";
const registryPath = "src/lib/english-controller-registry-14.ts";
const packagePath = "package.json";
const article = fs.readFileSync(path.join(root, articlePath), "utf8");
const registry = fs.readFileSync(path.join(root, registryPath), "utf8");
const packageSource = fs.readFileSync(path.join(root, packagePath), "utf8");
const failures = [];

function requireText(source, text, label) {
  if (!source.includes(text)) failures.push(`Missing ${label}: ${text}`);
}

for (const [source, text, label] of [
  [article, 'slug: "screeps-controller-activate-safe-mode"', "existing article slug"],
  [article, 'path: "/en/blog/screeps-controller-activate-safe-mode"', "existing English route"],
  [article, 'chinesePath: "/blog/screeps-controller-activate-safe-mode"', "existing Chinese mapping"],
  [article, 'publishedAt: "2026-07-26"', "unchanged publication date"],
  [article, 'title: "Screeps activateSafeMode(): Prevent Same-Tick Intent Overwrite"', "final title"],
  [article, 'finalScore: 98', "98-point article score"],
  [article, 'faq: []', "empty FAQ data"],
  [article, "only the final Controller intent scheduled", "same-tick overwrite warning"],
  [article, "only the last intent survives", "surviving-intent explanation"],
  [article, "one final per-tick dispatcher", "single final dispatcher"],
  [article, "CONTROLLER_DOWNGRADE_SAFEMODE_THRESHOLD", "downgrade threshold"],
  [article, "Memory.safeModePending", "accepted-operation record"],
  [article, "accepted-pending", "accepted versus verified state"],
  [article, "overwritten-or-conflicted", "overwrite evidence state"],
  [article, "activation-observed-charge-confounded", "charge confound state"],
  [article, "generateSafeMode()", "charge-generation confound"],
  [article, "does not create a Room event", "event evidence boundary"],
  [article, "Screeps Console test", "Console evidence status"],
  [article, "Pending", "pending live evidence"],
  [article, "80977824199a596d174d392fd0cf8c458c21fcbd", "official engine commit"],
  [registry, 'updatedAt: "2026-08-04"', "dateModified registry value"],
  [registry, 'title: "Screeps activateSafeMode(): Prevent Same-Tick Intent Overwrite"', "synchronized registry title"],
  [registry, 'finalScore: 98', "98-point registry score"],
  [packageSource, "englisheditorialsafemode20260804check", "dedicated package script"],
  [packageSource, "check-english-editorial-safe-mode-20260804.mjs", "dedicated prebuild gate"],
]) {
  requireText(source, text, label);
}

const tocPairs = [
  ...article.matchAll(/\["([a-z0-9]+(?:-[a-z0-9]+)*)", "([^"]+)"\],/g),
].map((match) => ({ id: match[1], label: match[2] }));
if (tocPairs.length < 13) failures.push(`Only ${tocPairs.length} TOC entries; expected at least 13.`);
for (const { id, label } of tocPairs) {
  if (!article.includes(`<h2 id="${id}">`) && !article.includes(`<h3 id="${id}">`)) {
    failures.push(`TOC entry lacks a body anchor: ${label} (${id})`);
  }
}

const codeBlocks = [
  ...article.matchAll(/<pre><code class="language-javascript">([\s\S]*?)<\/code><\/pre>/g),
].map((match) =>
  match[1]
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&"),
);
if (codeBlocks.length < 10) failures.push(`Only ${codeBlocks.length} JavaScript blocks; expected at least 10.`);
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "english-safe-mode-"));
try {
  codeBlocks.forEach((code, index) => {
    const filePath = path.join(tempDir, `block-${index + 1}.js`);
    fs.writeFileSync(filePath, code, "utf8");
    const result = spawnSync(process.execPath, ["--check", filePath], { encoding: "utf8" });
    if (result.status !== 0) {
      failures.push(`JavaScript block ${index + 1} failed syntax validation: ${result.stderr.trim()}`);
    }
  });
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

function evaluateSafeModeRequest(request, state, constants) {
  if (!request || request.enabled !== true) return "disabled";
  if (request.confirmed !== true) return "confirmation-missing";
  if (
    typeof request.roomName !== "string"
    || typeof request.controllerId !== "string"
    || !Number.isInteger(request.priority)
  ) return "request-invalid";
  if (!state.roomVisible || !state.controllerFound) return "controller-unavailable";
  if (
    state.roomControllerId !== request.controllerId
    || state.controllerId !== request.controllerId
    || state.controllerRoomName !== request.roomName
  ) return "controller-identity-mismatch";
  if (!state.owned || !Number.isInteger(state.level) || state.level <= 0) return "controller-not-owned";
  if (state.safeMode > 0) return "already-active";
  if (!Number.isInteger(state.safeModeAvailable) || state.safeModeAvailable <= 0) return "no-activation";
  if (state.safeModeCooldown > 0) return "activation-cooldown";
  if (state.upgradeBlocked > 0) return "upgrade-blocked";
  const minimum = constants.downgrade[state.level] / 2 - constants.safeModeThreshold;
  if (!Number.isFinite(state.ticksToDowngrade) || state.ticksToDowngrade < minimum) return "downgrade-threshold";
  return "ready";
}

const request = {
  enabled: true,
  confirmed: true,
  roomName: "W1N1",
  controllerId: "controller-1",
  priority: 100,
};
const state = {
  roomVisible: true,
  controllerFound: true,
  roomControllerId: "controller-1",
  controllerId: "controller-1",
  controllerRoomName: "W1N1",
  owned: true,
  level: 6,
  safeMode: 0,
  safeModeAvailable: 1,
  safeModeCooldown: 0,
  upgradeBlocked: 0,
  ticksToDowngrade: 50000,
};
const constants = { downgrade: { 6: 120000 }, safeModeThreshold: 5000 };
const evaluationCases = [
  [null, state, "disabled"],
  [{ ...request, confirmed: false }, state, "confirmation-missing"],
  [{ ...request, controllerId: null }, state, "request-invalid"],
  [request, { ...state, roomVisible: false }, "controller-unavailable"],
  [request, { ...state, roomControllerId: "other" }, "controller-identity-mismatch"],
  [request, { ...state, owned: false }, "controller-not-owned"],
  [request, { ...state, safeMode: 100 }, "already-active"],
  [request, { ...state, safeModeAvailable: 0 }, "no-activation"],
  [request, { ...state, safeModeCooldown: 10 }, "activation-cooldown"],
  [request, { ...state, upgradeBlocked: 10 }, "upgrade-blocked"],
  [request, { ...state, ticksToDowngrade: 54999 }, "downgrade-threshold"],
  [request, { ...state, ticksToDowngrade: 55000 }, "ready"],
];
for (const [candidateRequest, candidateState, expected] of evaluationCases) {
  const actual = evaluateSafeModeRequest(candidateRequest, candidateState, constants);
  if (actual !== expected) failures.push(`Safe Mode evaluation expected ${expected}, received ${actual}.`);
}

function chooseSafeModeCandidate(candidates) {
  return [...candidates]
    .sort((left, right) =>
      right.priority - left.priority
      || left.requestedAt - right.requestedAt
      || left.requestId.localeCompare(right.requestId)
    )[0]?.requestId ?? null;
}
const selectionCases = [
  [[], null],
  [[{ requestId: "a", priority: 1, requestedAt: 10 }], "a"],
  [[{ requestId: "a", priority: 1, requestedAt: 10 }, { requestId: "b", priority: 2, requestedAt: 20 }], "b"],
  [[{ requestId: "b", priority: 2, requestedAt: 10 }, { requestId: "a", priority: 2, requestedAt: 10 }], "a"],
];
for (const [candidates, expected] of selectionCases) {
  const actual = chooseSafeModeCandidate(candidates);
  if (actual !== expected) failures.push(`Safe Mode selection expected ${expected}, received ${actual}.`);
}

function verifySafeModeState(input) {
  const expectedTick = input.submittedAt + 1;
  if (input.gameTime < expectedTick) return "waiting-for-next-tick";
  if (!input.controllerAvailable) return "controller-unavailable";
  if (!input.identityMatches) return "controller-identity-mismatch";
  const activationObserved = input.safeMode > 0;
  const chargeObserved = input.available === input.beforeAvailable - 1;
  if (input.gameTime !== expectedTick) return "late-observation";
  if (activationObserved && chargeObserved) return "verified";
  if (activationObserved && !chargeObserved) return "activation-observed-charge-confounded";
  return input.otherActiveRooms > 0 ? "overwritten-or-conflicted" : "not-observed";
}
const verificationBase = {
  submittedAt: 100,
  gameTime: 101,
  controllerAvailable: true,
  identityMatches: true,
  safeMode: 19999,
  beforeAvailable: 2,
  available: 1,
  otherActiveRooms: 0,
};
const verificationCases = [
  [{ ...verificationBase, gameTime: 100 }, "waiting-for-next-tick"],
  [{ ...verificationBase, controllerAvailable: false }, "controller-unavailable"],
  [{ ...verificationBase, identityMatches: false }, "controller-identity-mismatch"],
  [{ ...verificationBase, gameTime: 102 }, "late-observation"],
  [verificationBase, "verified"],
  [{ ...verificationBase, available: 2 }, "activation-observed-charge-confounded"],
  [{ ...verificationBase, safeMode: 0, available: 2, otherActiveRooms: 1 }, "overwritten-or-conflicted"],
  [{ ...verificationBase, safeMode: 0, available: 2 }, "not-observed"],
];
for (const [input, expected] of verificationCases) {
  const actual = verifySafeModeState(input);
  if (actual !== expected) failures.push(`Safe Mode verification expected ${expected}, received ${actual}.`);
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`ERROR: ${failure}`);
  console.error(`\nSafe Mode editorial gate failed: ${failures.length} issue(s).`);
  process.exit(1);
}

console.log(
  `Safe Mode editorial gate passed: one existing article, ${tocPairs.length} TOC anchors, ${codeBlocks.length} syntax-checked JavaScript blocks, ${evaluationCases.length + selectionCases.length + verificationCases.length} offline boundary cases, synchronized metadata, exact Controller identity, one final per-tick call, and explicit Pending live evidence.`,
);