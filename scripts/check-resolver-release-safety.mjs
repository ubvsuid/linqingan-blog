import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const routePath = path.join(root, "src/app/(zh)/api/resolver/event/route.ts");
const chinesePagePath = path.join(root, "src/app/(zh)/resolver/page.tsx");
const englishPagePath = path.join(root, "src/app/(en)/en/resolver/page.tsx");
const revisionsPath = path.join(root, "src/data/static-page-revisions.json");
const failures = [];

if (!fs.existsSync(routePath)) {
  failures.push("Missing Resolver telemetry API route.");
} else {
  const route = fs.readFileSync(routePath, "utf8");
  const smokeBranchIndex = route.indexOf("if (isSmokeRequest(request))");
  const persistenceIndex = route.indexOf("const stored = await persistResolverEvent");

  if (!route.includes('request.headers.get("x-platform-smoke-test") === "1"')) {
    failures.push("Resolver telemetry API must recognize x-platform-smoke-test=1.");
  }
  if (!route.includes("{ stored: false, smoke: true }")) {
    failures.push("Resolver telemetry smoke requests must return an explicit non-persisted smoke response.");
  }
  if (smokeBranchIndex < 0 || persistenceIndex < 0 || smokeBranchIndex > persistenceIndex) {
    failures.push("Resolver telemetry smoke short-circuit must run before persistence.");
  }
  if (!route.includes("status: stored ? 200 : 202")) {
    failures.push("Resolver telemetry API must return 202 when best-effort persistence fails.");
  }
  if (!route.includes('headers: { "Cache-Control": "no-store" }')) {
    failures.push("Resolver telemetry responses must remain no-store.");
  }
}

for (const page of [
  {
    path: chinesePagePath,
    label: "Chinese Resolver boundary",
    staleSignals: ["没有数据库写入", "这是只读、确定性的 V1"],
    requiredSignals: [
      "不会写入 Runtime Evidence 或你的 Screeps 业务状态",
      "受限、匿名的结构化 Resolver 事件",
      "自由文本、IP、Referer、User-Agent 或地理位置",
    ],
  },
  {
    path: englishPagePath,
    label: "English Resolver boundary",
    staleSignals: ["or database writes", "This is a read-only deterministic V1"],
    requiredSignals: [
      "does not write to Runtime Evidence or your Screeps game state",
      "limited set of anonymous structured Resolver events",
      "best-effort basis",
      "free text, IP addresses, Referer, User-Agent, or geolocation",
    ],
  },
]) {
  if (!fs.existsSync(page.path)) {
    failures.push(`Missing ${page.label} page.`);
    continue;
  }
  const source = fs.readFileSync(page.path, "utf8");
  for (const staleSignal of page.staleSignals) {
    if (source.includes(staleSignal)) {
      failures.push(`${page.label} must not claim a fully read-only/no-database-write boundary after telemetry persistence shipped.`);
    }
  }
  for (const requiredSignal of page.requiredSignals) {
    if (!source.includes(requiredSignal)) {
      failures.push(`${page.label} missing telemetry boundary signal: ${requiredSignal}`);
    }
  }
}

if (!fs.existsSync(revisionsPath)) {
  failures.push("Missing static page revisions registry.");
} else {
  const revisions = JSON.parse(fs.readFileSync(revisionsPath, "utf8"));
  for (const route of ["/resolver", "/en/resolver"]) {
    if ((revisions[route] ?? "") < "2026-09-10") {
      failures.push(`${route} static revision must reflect the telemetry boundary copy correction.`);
    }
  }
}

if (failures.length > 0) {
  console.error(`Resolver telemetry release safety check failed:\n${failures.map((item) => `- ${item}`).join("\n")}`);
  process.exit(1);
}

console.log(
  "Resolver telemetry release safety check passed: smoke requests are write-free, persistence failures return 202, and bilingual boundary copy accurately discloses limited telemetry persistence.",
);
