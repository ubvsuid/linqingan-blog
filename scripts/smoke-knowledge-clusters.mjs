const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

const demonstratorChecks = [
  {
    pathname: "/knowledge/spawn-lifecycle",
    expected: [
      "Spawn 与 Creep 生命周期：同一个问题空间，五种工作方式",
      "按系统顺序学习",
      "定位故障路径",
      "Graph 关联面: 3 API · 1 症状 · 2 工具 · 1 Tick Lab · 11 ReturnCode",
    ],
    forbidden: ["同一个 Spawn 问题空间，五种工作方式"],
  },
  {
    pathname: "/knowledge/room-economy",
    expected: [
      "资源采集与房间经济：同一个问题空间，五种工作方式",
      "按系统顺序学习",
      "定位故障路径",
      "Graph 关联面: 4 API · 2 症状 · 2 工具 · 1 Tick Lab · 6 ReturnCode",
    ],
    forbidden: [
      "同一个 Spawn 问题空间，五种工作方式",
      "定位为什么 Spawn 停止生产",
      "用 Spawn Tick Lab",
    ],
  },
  {
    pathname: "/en/knowledge/spawn-creep-lifecycle",
    expected: [
      "Spawn & Creep Lifecycle: one problem space, five ways to work with it",
      "Learn this system in order",
      "Diagnose the failure path",
      "Graph-related surface: 3 API · 1 symptom · 2 tools · 1 Tick Lab · 11 ReturnCode",
    ],
    forbidden: ["One Spawn problem space, five ways to work with it"],
  },
  {
    pathname: "/en/knowledge/room-economy",
    expected: [
      "Room Economy: one problem space, five ways to work with it",
      "Learn this system in order",
      "Diagnose the failure path",
      "Graph-related surface: 4 API · 2 symptoms · 2 tools · 1 Tick Lab · 6 ReturnCode",
    ],
    forbidden: [
      "One Spawn problem space, five ways to work with it",
      "Diagnose why spawning stopped",
      "Use the Spawn Tick Lab experiment",
    ],
  },
];

const nonDemonstratorPaths = [
  "/knowledge/memory-engineering",
  "/knowledge/movement-vision",
  "/knowledge/controller-control",
  "/knowledge/construction-defense",
  "/knowledge/market-advanced-resources",
  "/knowledge/operations-debugging",
  "/en/knowledge/memory-code-structure",
  "/en/knowledge/movement-vision",
  "/en/knowledge/controllers-expansion",
  "/en/knowledge/construction-defense",
  "/en/knowledge/market-advanced-resources",
  "/en/knowledge/operations-debugging",
];

const failures = [];

function normalizeHtml(body) {
  return body
    .replace(/<!--.*?-->/g, "")
    .replaceAll("&amp;", "&")
    .replaceAll("&#x27;", "'")
    .replaceAll("&quot;", '"');
}

for (const check of demonstratorChecks) {
  const response = await fetch(`${baseUrl}${check.pathname}`, { redirect: "manual" });
  const body = normalizeHtml(await response.text());

  if (response.status !== 200) {
    failures.push(`${check.pathname}: expected 200, received ${response.status}`);
    continue;
  }

  for (const expected of check.expected) {
    if (!body.includes(expected)) {
      failures.push(`${check.pathname}: missing expected Cluster experience text: ${expected}`);
    }
  }

  for (const forbidden of check.forbidden) {
    if (body.includes(forbidden)) {
      failures.push(`${check.pathname}: leaked single-Spawn demonstrator copy: ${forbidden}`);
    }
  }
}

for (const pathname of nonDemonstratorPaths) {
  const response = await fetch(`${baseUrl}${pathname}`, { redirect: "manual" });
  const body = normalizeHtml(await response.text());

  if (response.status !== 200) {
    failures.push(`${pathname}: expected 200, received ${response.status}`);
    continue;
  }
  if (body.includes("KNOWLEDGE CLUSTER · DEMONSTRATOR")) {
    failures.push(`${pathname}: non-demonstrator module unexpectedly rendered the Cluster enhancement`);
  }
}

if (failures.length > 0) {
  console.error("Knowledge Cluster product smoke failed:\n" + failures.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}

console.log("Knowledge Cluster product smoke passed: Spawn + Room Economy render distinct bilingual five-facet experiences, and the other six modules stay unenhanced.");
