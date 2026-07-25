import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const scanRoots = ["src", "content"];
const allowedExtensions = new Set([".ts", ".tsx", ".md", ".mjs"]);
const ignoredFiles = new Set([
  path.join("src", "app", "sitemap.ts"),
  "next.config.ts",
]);
const retiredPaths = ["/resources", "/projects"];
const exactRoutes = new Set([
  "/",
  "/about",
  "/beginner",
  "/blog",
  "/changelog",
  "/feed.xml",
  "/glossary",
  "/knowledge",
  "/now",
  "/screeps-errors",
  "/search",
  "/tags",
  "/tools/creep-body-calculator",
  "/tools/room-diagnostics",
  "/verification",
  "/en",
  "/en/about",
  "/en/beginner",
  "/en/blog",
  "/en/blog/screeps-introduction",
  "/en/blog/screeps-first-room",
  "/en/blog/screeps-tick-game-loop",
  "/en/blog/screeps-creep-harvest-energy",
  "/en/blog/screeps-transfer-energy-to-spawn",
  "/en/blog/screeps-creep-body-parts",
  "/en/blog/screeps-spawn-creep",
  "/en/blog/screeps-creep-roles",
  "/en/blog/screeps-upgrade-controller",
  "/en/blog/screeps-first-extension",
  "/en/blog/screeps-build-repair",
  "/en/blog/screeps-first-room-code",
  "/en/blog/screeps-remove-construction-site",
  "/en/glossary",
  "/en/knowledge",
  "/en/screeps-errors",
  "/en/search",
  "/en/tools",
  "/en/tools/creep-body-calculator",
  "/en/tools/room-diagnostics",
  "/en/verification",
]);

const englishRegistryPaths = [
  path.join(root, "src", "lib", "english-articles.ts"),
  path.join(root, "src", "lib", "english-foundation-registry-2.ts"),
  path.join(root, "src", "lib", "english-spawn-registry-3.ts"),
  path.join(root, "src", "lib", "english-lifecycle-registry-4.ts"),
  path.join(root, "src", "lib", "english-movement-registry-5.ts"),
  path.join(root, "src", "lib", "english-movement-registry-6.ts"),
  path.join(root, "src", "lib", "english-vision-registry-7.ts"),
  path.join(root, "src", "lib", "english-runtime-registry-8.ts"),
  path.join(root, "src", "lib", "english-observability-registry-9.ts"),
  path.join(root, "src", "lib", "english-market-registry-10.ts"),
  path.join(root, "src", "lib", "english-lab-factory-registry-11.ts"),
];
for (const englishRegistryPath of englishRegistryPaths) {
  if (!fs.existsSync(englishRegistryPath)) continue;
  const registrySource = fs.readFileSync(englishRegistryPath, "utf8");
  for (const match of registrySource.matchAll(
    /["']?href["']?\s*:\s*["'](\/en\/blog\/[a-z0-9-]+)["']/g,
  )) {
    exactRoutes.add(match[1]);
  }
}

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    return allowedExtensions.has(path.extname(entry.name)) ? [fullPath] : [];
  });
}

function normalizeHref(value) {
  return value.split(/[?#]/)[0].replace(/\/$/, "") || "/";
}

function routeExists(href) {
  if (exactRoutes.has(href)) return true;
  if (/^\/blog\/[a-z0-9-]+$/.test(href)) {
    return fs.existsSync(path.join(root, "content", "posts", `${href.slice(6)}.md`));
  }
  if (/^\/knowledge\/[a-z0-9-]+$/.test(href)) return true;
  if (/^\/tags\/[a-z0-9-]+$/.test(href)) return true;
  if (/^\/(blog|now|changelog)\/page\/[2-9][0-9]*$/.test(href)) return true;
  return false;
}

function hasPageForRoute(route) {
  const pagePath = path.join(root, "src", "app", ...route.slice(1).split("/"), "page.tsx");
  if (fs.existsSync(pagePath)) return true;

  if (/^\/en\/blog\/[a-z0-9-]+$/.test(route)) {
    return fs.existsSync(
      path.join(root, "src", "app", "en", "blog", "[slug]", "page.tsx"),
    );
  }

  return false;
}

const errors = [];
for (const route of exactRoutes) {
  if (route === "/" || route === "/feed.xml") continue;
  if (!hasPageForRoute(route)) {
    errors.push(`已登记路由缺少页面文件 ${route}`);
  }
}

for (const scanRoot of scanRoots) {
  const directory = path.join(root, scanRoot);
  if (!fs.existsSync(directory)) continue;

  for (const filePath of walk(directory)) {
    const relativePath = path.relative(root, filePath);
    if (ignoredFiles.has(relativePath)) continue;
    const source = fs.readFileSync(filePath, "utf8");
    const candidates = [
      ...source.matchAll(/(?:href=|href:\s*)["'](\/[^"']*)["']/g),
      ...source.matchAll(/\[[^\]]+\]\((\/[^)\s]+)\)/g),
    ].map((match) => match[1]);

    for (const candidate of candidates) {
      const href = normalizeHref(candidate);
      if (retiredPaths.some((retired) => href === retired || href.startsWith(`${retired}/`))) {
        errors.push(`${relativePath}: 仍然链接到已合并页面 ${candidate}`);
        continue;
      }
      if (!routeExists(href)) errors.push(`${relativePath}: 内链目标不存在 ${candidate}`);
    }
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  console.error(`\n组件与数据内链检查失败：${errors.length} 项。`);
  process.exit(1);
}

console.log(
  `组件与数据内链检查通过：${exactRoutes.size} 个静态或动态路由已登记，未发现旧页面链接或未知站内目标。`,
);
