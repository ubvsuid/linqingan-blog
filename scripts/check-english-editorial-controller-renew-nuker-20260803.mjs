import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const overridePath = path.join(
  root,
  "src/lib/english-editorial-controller-renew-nuker-20260803.ts",
);
const publishedPath = path.join(
  root,
  "src/lib/english-editorial-published-20260731.ts",
);
const registryPaths = [
  "src/lib/english-controller-registry-14.ts",
  "src/lib/english-lifecycle-registry-4.ts",
  "src/lib/english-defense-operations-registry-17.ts",
];

const source = fs.readFileSync(overridePath, "utf8");
const published = fs.readFileSync(publishedPath, "utf8");
const registries = registryPaths
  .map((file) => fs.readFileSync(path.join(root, file), "utf8"))
  .join("\n");
const packageJson = fs.readFileSync(path.join(root, "package.json"), "utf8");
const failures = [];

const articles = [
  {
    slug: "screeps-reserve-vs-claim-controller",
    path: "/en/blog/screeps-reserve-vs-claim-controller",
    chinesePath: "/blog/screeps-reserve-vs-claim-controller",
    title: "Screeps reserveController() vs claimController(): Verify the Exact Mission",
    headline: "Reserve or Claim a Controller Without Losing Mission Identity",
    signals: [
      "Memory.pendingControllerOperations",
      "EVENT_RESERVE_CONTROLLER",
      "event.objectId === pending.creepId",
      "does not include a Controller targetId",
      "claimController() has no Room event",
      "controller.owner?.username === pending.username",
      "reserve-event-window-missed",
      "claim-owner-observed",
    ],
  },
  {
    slug: "screeps-renew-creep",
    path: "/en/blog/screeps-renew-creep",
    chinesePath: "/blog/screeps-spawn-renew-creep",
    title: "Screeps renewCreep(): Coordinate Spawn Time and Verify TTL Gain",
    headline: "Renew a Creep Without Hiding Spawn Contention or Boost Loss",
    signals: [
      "createRenewalDispatcher",
      "usedSpawnIds",
      "usedCreepIds",
      "Memory.pendingRenewals",
      "expectedAddedTicks",
      "pending.before.ticksToLive",
      "renewal-ttl-signature-mismatch",
      "renewal-observed-energy-confounded",
      "does not create a Room event",
    ],
  },
  {
    slug: "screeps-nuker-launch",
    path: "/en/blog/screeps-nuker-launch",
    chinesePath: "/blog/screeps-nuker-launch-checklist",
    title: "Screeps launchNuke(): Exact Target Records and Post-Launch Proof",
    headline: "Launch a Nuke Once and Preserve the Exact Operation Record",
    signals: [
      "Memory.pendingNukeLaunches",
      "accepted-awaiting-verification",
      "launcher-signature-observed",
      "room.find(FIND_NUKES)",
      "nuke.launchRoomName",
      "target-evidence-unavailable",
      "does not emit a Room event",
    ],
  },
];

for (const article of articles) {
  for (const expected of [
    `slug: \"${article.slug}\"`,
    `path: \"${article.path}\"`,
    `chinesePath: \"${article.chinesePath}\"`,
    `title: \"${article.title}\"`,
    `headline: \"${article.headline}\"`,
    ...article.signals,
  ]) {
    if (!source.includes(expected)) {
      failures.push(`${article.slug}: 正文覆盖缺少 ${expected}`);
    }
  }

  for (const expected of [
    `href: \"${article.path}\"`,
    `chinesePath: \"${article.chinesePath}\"`,
    `title: \"${article.title}\"`,
    `updatedAt: \"2026-08-03\"`,
    "finalScore: 98",
  ]) {
    if (!registries.includes(expected)) {
      failures.push(`${article.slug}: 登记元数据缺少 ${expected}`);
    }
  }
}

for (const expected of [
  "englishEditorialControllerRenewNukerOverrides20260803",
  "...englishEditorialControllerRenewNukerOverrides20260803",
]) {
  if (!published.includes(expected)) {
    failures.push(`发布聚合缺少 ${expected}`);
  }
}

for (const expected of [
  "Screeps Console test",
  "Pending",
  "Genuine room or Console screenshots",
  "Last verified",
  "August 3, 2026",
]) {
  if (!source.includes(expected)) {
    failures.push(`证据边界缺少 ${expected}`);
  }
}

const scores = [...source.matchAll(/finalScore:\s*(\d+)/g)]
  .map((match) => Number(match[1]));
if (scores.length !== 3 || scores.some((score) => score < 96)) {
  failures.push(`本批评分不满足发布门槛：${scores.join(", ")}`);
}

const faqArrays = [...source.matchAll(/faq:\s*\[\]/g)];
if (faqArrays.length !== 3) {
  failures.push(`预期三篇均移除 FAQ，实际空 FAQ 数量 ${faqArrays.length}`);
}

const tocPairs = [...source.matchAll(/\["([a-z0-9-]+)", "([^"]+)"\],/g)];
if (tocPairs.length < 27) {
  failures.push(`目录条目不足：${tocPairs.length}`);
}
for (const match of tocPairs) {
  const id = match[1];
  if (!source.includes(`<h2 id=\"${id}\">`) && !source.includes(`<h3 id=\"${id}\">`)) {
    failures.push(`目录锚点不存在：${id}`);
  }
}

const blocks = [...source.matchAll(
  /<pre><code class="language-javascript">([\s\S]*?)<\/code><\/pre>/g,
)].map((match) => match[1]
  .replaceAll("&lt;", "<")
  .replaceAll("&gt;", ">")
  .replaceAll("&amp;", "&"));

if (blocks.length !== 16) {
  failures.push(`JavaScript 代码块数量应为 16，实际 ${blocks.length}`);
}

const temp = fs.mkdtempSync(path.join(os.tmpdir(), "editorial-crn-"));
try {
  blocks.forEach((code, index) => {
    const file = path.join(temp, `${index + 1}.js`);
    fs.writeFileSync(file, code, "utf8");
    const result = spawnSync(process.execPath, ["--check", file], {
      encoding: "utf8",
    });
    if (result.status !== 0) {
      failures.push(`代码块 ${index + 1} 语法失败：${result.stderr.trim()}`);
    }
  });
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}

function classifyReserve(input) {
  if (input.gameTime <= input.submittedAt) return "wait-for-next-tick";
  if (input.gameTime > input.submittedAt + 1) return "reserve-event-window-missed";
  if (!input.roomVisible) return "room-not-visible";
  if (input.controllerId !== input.pendingControllerId) return "controller-identity-mismatch";
  const matches = input.events.filter((event) =>
    event.type === "reserve"
    && event.objectId === input.creepId
  );
  if (matches.length === 0) return "accepted-reserve-event-missing";
  if (matches.length > 1) return "reserve-event-ambiguous";
  return input.reservationUsername === input.username
    ? "reserve-event-and-state-observed"
    : "reserve-event-state-mismatch";
}

const reserveBase = {
  gameTime: 101,
  submittedAt: 100,
  roomVisible: true,
  controllerId: "controller-a",
  pendingControllerId: "controller-a",
  creepId: "creep-a",
  username: "me",
  reservationUsername: "me",
  events: [{ type: "reserve", objectId: "creep-a", amount: 1000 }],
};
for (const [input, expected] of [
  [{ ...reserveBase, gameTime: 100 }, "wait-for-next-tick"],
  [{ ...reserveBase, gameTime: 102 }, "reserve-event-window-missed"],
  [{ ...reserveBase, roomVisible: false }, "room-not-visible"],
  [{ ...reserveBase, controllerId: "controller-b" }, "controller-identity-mismatch"],
  [{ ...reserveBase, events: [] }, "accepted-reserve-event-missing"],
  [{ ...reserveBase, events: [...reserveBase.events, ...reserveBase.events] }, "reserve-event-ambiguous"],
  [{ ...reserveBase, reservationUsername: "other" }, "reserve-event-state-mismatch"],
  [reserveBase, "reserve-event-and-state-observed"],
]) {
  if (classifyReserve(input) !== expected) {
    failures.push(`Reserve 离线边界失败：${expected}`);
  }
}

function classifyClaim(input) {
  if (!input.roomVisible) return "claimed-room-not-visible";
  if (input.controllerId !== input.pendingControllerId) return "controller-identity-mismatch";
  return input.ownerUsername === input.username && input.controllerMy
    ? "claim-owner-observed"
    : "accepted-claim-owner-not-observed";
}

for (const [input, expected] of [
  [{ roomVisible: false }, "claimed-room-not-visible"],
  [{ roomVisible: true, controllerId: "b", pendingControllerId: "a" }, "controller-identity-mismatch"],
  [{ roomVisible: true, controllerId: "a", pendingControllerId: "a", ownerUsername: null, username: "me", controllerMy: false }, "accepted-claim-owner-not-observed"],
  [{ roomVisible: true, controllerId: "a", pendingControllerId: "a", ownerUsername: "me", username: "me", controllerMy: true }, "claim-owner-observed"],
]) {
  if (classifyClaim(input) !== expected) {
    failures.push(`Claim 离线边界失败：${expected}`);
  }
}

function classifyRenew(input) {
  const expectedTtl = input.beforeTtl - 1 + input.addedTicks;
  if (input.observedTtl !== expectedTtl) return "renewal-ttl-signature-mismatch";
  if (input.hadBoosts && input.boostsRemaining > 0) return "renewal-boost-removal-mismatch";
  return input.energyTransferCount > 0
    ? "renewal-observed-energy-confounded"
    : "renewal-local-signature-observed";
}

for (const [input, expected] of [
  [{ beforeTtl: 300, addedTicks: 200, observedTtl: 498, hadBoosts: false, boostsRemaining: 0, energyTransferCount: 0 }, "renewal-ttl-signature-mismatch"],
  [{ beforeTtl: 300, addedTicks: 200, observedTtl: 499, hadBoosts: true, boostsRemaining: 1, energyTransferCount: 0 }, "renewal-boost-removal-mismatch"],
  [{ beforeTtl: 300, addedTicks: 200, observedTtl: 499, hadBoosts: false, boostsRemaining: 0, energyTransferCount: 1 }, "renewal-observed-energy-confounded"],
  [{ beforeTtl: 300, addedTicks: 200, observedTtl: 499, hadBoosts: false, boostsRemaining: 0, energyTransferCount: 0 }, "renewal-local-signature-observed"],
]) {
  if (classifyRenew(input) !== expected) {
    failures.push(`Renew 离线边界失败：${expected}`);
  }
}

function classifyNuker(input) {
  if (!input.nukerVisible) return "nuker-not-visible";
  if (!(input.cooldown > 0 && input.energy === 0 && input.ghodium === 0)) {
    return "accepted-launch-signature-mismatch";
  }
  if (!input.targetVisible) return "launcher-observed-target-unavailable";
  const matches = input.nukes.filter((nuke) =>
    nuke.x === input.x
    && nuke.y === input.y
    && nuke.launchRoomName === input.launchRoomName
  );
  if (matches.length === 0) return "target-nuke-not-observed";
  if (matches.length > 1) return "target-nuke-ambiguous";
  return "launcher-and-target-observed";
}

const nukeBase = {
  nukerVisible: true,
  cooldown: 100000,
  energy: 0,
  ghodium: 0,
  targetVisible: true,
  x: 25,
  y: 25,
  launchRoomName: "W1N1",
  nukes: [{ x: 25, y: 25, launchRoomName: "W1N1" }],
};
for (const [input, expected] of [
  [{ ...nukeBase, nukerVisible: false }, "nuker-not-visible"],
  [{ ...nukeBase, energy: 1 }, "accepted-launch-signature-mismatch"],
  [{ ...nukeBase, targetVisible: false }, "launcher-observed-target-unavailable"],
  [{ ...nukeBase, nukes: [] }, "target-nuke-not-observed"],
  [{ ...nukeBase, nukes: [...nukeBase.nukes, ...nukeBase.nukes] }, "target-nuke-ambiguous"],
  [nukeBase, "launcher-and-target-observed"],
]) {
  if (classifyNuker(input) !== expected) {
    failures.push(`Nuker 离线边界失败：${expected}`);
  }
}

if (!packageJson.includes("englisheditorialcontrollerrenewnuker20260803check")) {
  failures.push("package.json 尚未接入本批质量门禁");
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  console.error(`\nController、续命与 Nuker 深度编辑门禁失败：${failures.length} 项。`);
  process.exit(1);
}

console.log(
  `Controller、续命与 Nuker 深度编辑门禁通过：3 个现有路由、${blocks.length} 个 JavaScript 代码块、精确 Reserve/Claim/Renew/Nuker 证据边界、Pending 真实环境证据与 98 分内部门槛均有效。`,
);
