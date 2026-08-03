import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sitemapPath = path.join(root, "src/lib/sitemaps.ts");
const sitemapSource = fs.readFileSync(sitemapPath, "utf8");

const publicTools = [
  { route: "/tools", page: "src/app/(zh)/tools/page.tsx" },
  { route: "/tools/creep-body-calculator", page: "src/app/(zh)/tools/creep-body-calculator/page.tsx" },
  { route: "/tools/room-diagnostics", page: "src/app/(zh)/tools/room-diagnostics/page.tsx" },
  { route: "/tools/market-terminal-cost-calculator", page: "src/app/(zh)/tools/market-terminal-cost-calculator/page.tsx" },
  { route: "/tools/controller-downgrade-planner", page: "src/app/(zh)/tools/controller-downgrade-planner/page.tsx" },
  { route: "/tools/lab-reaction-boost-planner", page: "src/app/(zh)/tools/lab-reaction-boost-planner/page.tsx" },
  { route: "/tools/spawn-queue-replacement-planner", page: "src/app/(zh)/tools/spawn-queue-replacement-planner/page.tsx" },
  { route: "/tools/hauling-throughput-planner", page: "src/app/(zh)/tools/hauling-throughput-planner/page.tsx" },
  { route: "/tools/tower-damage-heal-repair-calculator", page: "src/app/(zh)/tools/tower-damage-heal-repair-calculator/page.tsx" },
  { route: "/en/tools", page: "src/app/(en)/en/tools/page.tsx" },
  { route: "/en/tools/creep-body-calculator", page: "src/app/(en)/en/tools/creep-body-calculator/page.tsx" },
  { route: "/en/tools/room-diagnostics", page: "src/app/(en)/en/tools/room-diagnostics/page.tsx" },
  { route: "/en/tools/market-terminal-cost-calculator", page: "src/app/(en)/en/tools/market-terminal-cost-calculator/page.tsx" },
  { route: "/en/tools/controller-downgrade-planner", page: "src/app/(en)/en/tools/controller-downgrade-planner/page.tsx" },
  { route: "/en/tools/lab-reaction-boost-planner", page: "src/app/(en)/en/tools/lab-reaction-boost-planner/page.tsx" },
  { route: "/en/tools/spawn-queue-replacement-planner", page: "src/app/(en)/en/tools/spawn-queue-replacement-planner/page.tsx" },
  { route: "/en/tools/hauling-throughput-planner", page: "src/app/(en)/en/tools/hauling-throughput-planner/page.tsx" },
  { route: "/en/tools/tower-damage-heal-repair-calculator", page: "src/app/(en)/en/tools/tower-damage-heal-repair-calculator/page.tsx" },
];

const failures = [];

for (const tool of publicTools) {
  const absolutePage = path.join(root, tool.page);
  if (!fs.existsSync(absolutePage)) {
    failures.push(`${tool.route}: 缺少公开工具页面 ${tool.page}`);
    continue;
  }

  const pageSource = fs.readFileSync(absolutePage, "utf8");
  if (!pageSource.includes("SoftwareApplication") && !pageSource.includes("CollectionPage")) {
    failures.push(`${tool.route}: 缺少 SoftwareApplication 或 CollectionPage 结构化数据`);
  }

  if (!sitemapSource.includes(tool.route)) {
    failures.push(`${tool.route}: 公开工具未加入 src/lib/sitemaps.ts`);
  }
}

const routePairsSource = fs.readFileSync(path.join(root, "src/lib/i18n.ts"), "utf8");
for (const chineseRoute of [
  "/tools",
  "/tools/creep-body-calculator",
  "/tools/room-diagnostics",
  "/tools/market-terminal-cost-calculator",
  "/tools/controller-downgrade-planner",
  "/tools/lab-reaction-boost-planner",
  "/tools/spawn-queue-replacement-planner",
  "/tools/hauling-throughput-planner",
  "/tools/tower-damage-heal-repair-calculator",
]) {
  if (!routePairsSource.includes(`\"${chineseRoute}\"`)) {
    failures.push(`${chineseRoute}: 缺少中英文 route pair`);
  }
}

if (failures.length > 0) {
  console.error(`公开工具索引检查失败：\n${failures.map((item) => `- ${item}`).join("\n")}`);
  process.exit(1);
}

console.log(`公开工具索引检查通过：${publicTools.length} 个中英文工具与工具中心页面均已进入 Sitemap、结构化数据和语言映射。`);
