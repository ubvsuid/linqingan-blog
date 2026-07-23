import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sitemapPath = path.join(root, "src/app/sitemap.ts");
const sitemapSource = fs.readFileSync(sitemapPath, "utf8");

const publicTools = [
  {
    route: "/tools/creep-body-calculator",
    page: "src/app/tools/creep-body-calculator/page.tsx",
  },
  {
    route: "/tools/room-diagnostics",
    page: "src/app/tools/room-diagnostics/page.tsx",
  },
];

const failures = [];

for (const tool of publicTools) {
  if (!fs.existsSync(path.join(root, tool.page))) {
    failures.push(`${tool.route}: 缺少公开工具页面 ${tool.page}`);
  }

  if (!sitemapSource.includes(tool.route)) {
    failures.push(`${tool.route}: 公开工具未加入 src/app/sitemap.ts`);
  }
}

if (failures.length > 0) {
  console.error(`公开工具索引检查失败：\n${failures.map((item) => `- ${item}`).join("\n")}`);
  process.exit(1);
}

console.log(`公开工具索引检查通过：${publicTools.length} 个工具页面均已进入 Sitemap。`);
