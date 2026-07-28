import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const scanRoots = ["src", "content"];
const allowedExtensions = new Set([".ts", ".tsx", ".md", ".mjs"]);
const ignoredFiles = new Set([
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
  "/sitemap.xml",
  "/sitemap-zh.xml",
  "/sitemap-en.xml",
  "/tags",
  "/tools/creep-body-calculator",
  "/tools/room-diagnostics",
  "/verification",
  "/en",
  "/en/about",
  "/en/beginner",
  "/en/blog",
  "/en/changelog",
  "/en/feed.xml",
  "/en/license",
  "/en/roadmap",
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
  "/en/blog/screeps-memory-write-safety",
  "/en/glossary",
  "/en/knowledge",
  "/en/screeps-errors",
  "/en/search",
  "/en/tags",
  "/en/tools",
  "/en/tools/creep-body-calculator",
  "/en/tools/room-diagnostics",
  "/en/verification",
]);

const englishLibDirectory = path.join(root, "src", "lib");
const englishRegistryPaths = fs.readdirSync(englishLibDirectory)
  .filter((name) =>
    name === "english-articles.ts"
    || /^english-[a-z0-9-]+-registry-\d+\.ts$/.test(name)
  )
  .sort()
  .map((name) => path.join(englishLibDirectory, name));

for (const englishRegistryPath of englishRegistryPaths) {
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
  if (/^\/en\/tags\/[a-z0-9-]+$/.test(href)) return true;
  if (/^\/(blog|now|changelog)\/page\/[2-9][0-9]*$/.test(href)) return true;
  if (/^\/diagrams\/[a-z0-9-]+\.svg$/.test(href)) {
    return fs.existsSync(path.join(root, "public", href.slice(1)));
  }
  return false;
}

function hasPageForRoute(route) {
  const routeParts = route.slice(1).split("/").filter(Boolean);
  const routeRoot = routeParts[0] === "en"
    ? path.join(root, "src", "app", "(en)")
    : path.join(root, "src", "app", "(zh)");
  const pagePath = path.join(routeRoot, ...routeParts, "page.tsx");
  if (fs.existsSync(pagePath)) return true;

  const routePath = path.join(routeRoot, ...routeParts, "route.ts");
  if (fs.existsSync(routePath)) return true;

  if (/^\/en\/blog\/[a-z0-9-]+$/.test(route)) {
    return fs.existsSync(path.join(root, "src", "app", "(en)", "en", "blog", "[slug]", "page.tsx"));
  }

  return false;
}

const errors = [];
for (const route of exactRoutes) {
  if (route === "/") continue;
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
  `组件与数据内链检查通过：${exactRoutes.size} 个静态、重定向或动态路由已登记，自动发现 ${englishRegistryPaths.length} 个英文登记文件，未发现旧页面链接或未知站内目标。`,
);
