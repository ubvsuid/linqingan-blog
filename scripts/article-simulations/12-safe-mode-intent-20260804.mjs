import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const article = fs.readFileSync(
  path.join(root, "src/lib/english-controller-safe-mode-14.ts"),
  "utf8",
);
const registry = fs.readFileSync(
  path.join(root, "src/lib/english-controller-registry-14.ts"),
  "utf8",
);
const failures = [];

function requireText(source, text, label) {
  if (!source.includes(text)) failures.push(`Missing ${label}: ${text}`);
}

for (const [source, text, label] of [
  [article, 'slug: "screeps-controller-activate-safe-mode"', "existing slug"],
  [article, 'path: "/en/blog/screeps-controller-activate-safe-mode"', "existing route"],
  [article, 'chinesePath: "/blog/screeps-controller-activate-safe-mode"', "Chinese mapping"],
  [article, 'publishedAt: "2026-07-26"', "unchanged publication date"],
  [article, 'title: "Screeps activateSafeMode(): Prevent Same-Tick Intent Overwrite"', "title"],
  [article, 'finalScore: 98', "article score"],
  [article, 'faq: []', "empty FAQ"],
  [article, "only the final Controller intent scheduled", "same-tick warning"],
  [article, "only the last intent survives", "last-intent behavior"],
  [article, "one final per-tick dispatcher", "dispatcher contract"],
  [article, "CONTROLLER_DOWNGRADE_SAFEMODE_THRESHOLD", "downgrade threshold"],
  [article, "Memory.safeModePending", "pending identity"],
  [article, "accepted-pending", "accepted state"],
  [article, "overwritten-or-conflicted", "overwrite state"],
  [article, "activation-observed-charge-confounded", "charge confound"],
  [article, "generateSafeMode()", "charge-generation boundary"],
  [article, "does not create a Room event", "event boundary"],
  [article, "Screeps Console test", "Console status"],
  [article, "Pending", "pending live evidence"],
  [article, "80977824199a596d174d392fd0cf8c458c21fcbd", "engine commit"],
  [registry, 'updatedAt: "2026-08-04"', "modified date"],
  [registry, 'title: "Screeps activateSafeMode(): Prevent Same-Tick Intent Overwrite"', "registry title"],
  [registry, 'finalScore: 98', "registry score"],
]) {
  requireText(source, text, label);
}

const tocPairs = [
  ...article.matchAll(/\["([a-z0-9]+(?:-[a-z0-9]+)*)", "([^"]+)"\],/g),
].map((match) => ({ id: match[1], label: match[2] }));
if (tocPairs.length < 13) failures.push(`TOC count ${tocPairs.length}; expected at least 13.`);
for (const { id, label } of tocPairs) {
  if (!article.includes(`<h2 id="${id}">`) && !article.includes(`<h3 id="${id}">`)) {
    failures.push(`TOC anchor missing: ${label} (${id})`);
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
if (codeBlocks.length < 10) failures.push(`JavaScript block count ${codeBlocks.length}; expected at least 10.`);
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "safe-mode-editorial-"));
try {
  codeBlocks.forEach((code, index) => {
    const filePath = path.join(tempDir, `block-${index + 1}.js`);
    fs.writeFileSync(filePath, code, "utf8");
    const result = spawnSync(process.execPath, ["--check", filePath], { encoding: "utf8" });
    if (result.status !== 0) {
      failures.push(`JavaScript block ${index + 1} failed: ${result.stderr.trim()}`);
    }
  });
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

function evaluate(request, state, constants) {
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
  if (!Number.isInteger(state.available) || state.available <= 0) return "no-activation";
  if (state.cooldown > 0) return "activation-cooldown";
  if (state.upgradeBlocked > 0) return "upgrade-blocked";
  const minimum = constants.downgrade[state.level] / 2 - constants.threshold;
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
  available: 1,
  cooldown: 0,
  upgradeBlocked: 0,
  ticksToDowngrade: 55000,
};
const constants = { downgrade: { 6: 120000 }, threshold: 5000 };
const evaluationCases = [
  [null, state, "disabled"],
  [{ ...request, confirmed: false }, state, "confirmation-missing"],
  [{ ...request, controllerId: null }, state, "request-invalid"],
  [request, { ...state, roomVisible: false }, "controller-unavailable"],
  [request, { ...state, roomControllerId: "other" }, "controller-identity-mismatch"],
  [request, { ...state, owned: false }, "controller-not-owned"],
  [request, { ...state, safeMode: 10 }, "already-active"],
  [request, { ...state, available: 0 }, "no-activation"],
  [request, { ...state, cooldown: 10 }, "activation-cooldown"],
  [request, { ...state, upgradeBlocked: 10 }, "upgrade-blocked"],
  [request, { ...state, ticksToDowngrade: 54999 }, "downgrade-threshold"],
  [request, state, "ready"],
];
for (const [candidateRequest, candidateState, expected] of evaluationCases) {
  const actual = evaluate(candidateRequest, candidateState, constants);
  if (actual !== expected) failures.push(`Evaluation expected ${expected}, received ${actual}.`);
}

function choose(candidates) {
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
  const actual = choose(candidates);
  if (actual !== expected) failures.push(`Selection expected ${expected}, received ${actual}.`);
}

function verify(input) {
  const expectedTick = input.submittedAt + 1;
  if (input.gameTime < expectedTick) return "waiting-for-next-tick";
  if (!input.controllerAvailable) return "controller-unavailable";
  if (!input.identityMatches) return "controller-identity-mismatch";
  const active = input.safeMode > 0;
  const charge = input.available === input.beforeAvailable - 1;
  if (input.gameTime !== expectedTick) return "late-observation";
  if (active && charge) return "verified";
  if (active && !charge) return "activation-observed-charge-confounded";
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
  const actual = verify(input);
  if (actual !== expected) failures.push(`Verification expected ${expected}, received ${actual}.`);
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`ERROR: ${failure}`);
  console.error(`\nSafe Mode article simulation failed: ${failures.length} issue(s).`);
  process.exit(1);
}

console.log(
  `Safe Mode article simulation passed: ${tocPairs.length} anchors, ${codeBlocks.length} syntax-checked blocks, ${evaluationCases.length + selectionCases.length + verificationCases.length} offline cases, exact Controller identity, one final same-tick call, and explicit Pending live evidence.`,
);