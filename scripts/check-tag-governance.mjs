import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

const root = process.cwd();
const postsDirectory = path.join(root, "content", "posts");
const fixedTagSlugs = JSON.parse(
  fs.readFileSync(path.join(root, "src", "lib", "tag-slugs.json"), "utf8"),
);
const canonicalTagNames = JSON.parse(
  fs.readFileSync(path.join(root, "src", "lib", "tag-canonical-names.json"), "utf8"),
);
const coreTagSlugs = JSON.parse(
  fs.readFileSync(path.join(root, "src", "lib", "core-tag-slugs.json"), "utf8"),
);
const nextConfig = fs.readFileSync(path.join(root, "next.config.ts"), "utf8");

const MAX_UNIQUE_TAGS = 100;
const MAX_PUBLIC_TAGS = 65;
const MAX_SINGLETON_TAGS = 70;
const deprecatedCanonicalSlugs = new Set([
  "energy-resource",
  "debugging-tools",
  "screeps-game-api",
]);
const canonicalRedirects = [
  ["/tags/energy-resource", "/tags/energy"],
  ["/tags/debugging-tools", "/tags/debugging"],
  ["/tags/screeps-game-api", "/tags/game-api"],
];

function tagToSlug(tag) {
  const normalized = String(tag).normalize("NFKC").trim();
  if (fixedTagSlugs[normalized]) return fixedTagSlugs[normalized];
  return normalized
    .toLocaleLowerCase("zh-CN")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const counts = new Map();
const namesBySlug = new Map();
const failures = [];

for (const fileName of fs.readdirSync(postsDirectory).filter((name) => name.endsWith(".md"))) {
  const source = fs.readFileSync(path.join(postsDirectory, fileName), "utf8");
  const { data } = matter(source);
  const tags = Array.isArray(data.tags) ? data.tags : [];

  if (tags.length > 5) {
    failures.push(`${fileName}: 标签超过 5 个`);
  }

  for (const tag of tags) {
    const slug = tagToSlug(tag);
    if (!slug) continue;
    counts.set(slug, (counts.get(slug) ?? 0) + 1);
    const names = namesBySlug.get(slug) ?? new Set();
    names.add(String(tag));
    namesBySlug.set(slug, names);
  }
}

if (new Set(coreTagSlugs).size !== coreTagSlugs.length) {
  failures.push("核心标签配置存在重复 slug");
}
if (coreTagSlugs.length > 30) {
  failures.push(`核心标签超过 30 个：当前 ${coreTagSlugs.length} 个`);
}

for (const slug of coreTagSlugs) {
  const count = counts.get(slug) ?? 0;
  if (count < 2) {
    failures.push(`核心标签 ${slug} 只有 ${count} 篇文章，应至少连接 2 篇`);
  }
}

for (const [slug, names] of namesBySlug) {
  if (names.size > 1 && !canonicalTagNames[slug]) {
    failures.push(
      `标签 ${slug} 对应多个名称但没有 canonical display name：${[...names].join("、")}`,
    );
  }
}

for (const [slug, canonicalName] of Object.entries(canonicalTagNames)) {
  if (!counts.has(slug)) {
    failures.push(`canonical tag name 指向未使用 slug：${slug}`);
  }
  if (typeof canonicalName !== "string" || canonicalName.trim().length === 0) {
    failures.push(`canonical tag name 无效：${slug}`);
  }
}

for (const [tagName, slug] of Object.entries(fixedTagSlugs)) {
  if (deprecatedCanonicalSlugs.has(slug)) {
    failures.push(`标签 ${tagName} 仍指向已废弃 slug：${slug}`);
  }
}

for (const [source, destination] of canonicalRedirects) {
  if (
    !nextConfig.includes(`source: "${source}"`)
    || !nextConfig.includes(`destination: "${destination}"`)
  ) {
    failures.push(`缺少标签规范化 301：${source} -> ${destination}`);
  }
}

const uniqueTagCount = counts.size;
const singletonCount = [...counts.values()].filter((count) => count === 1).length;
const publicTagCount = [...counts.values()].filter((count) => count >= 2).length;

if (uniqueTagCount > MAX_UNIQUE_TAGS) {
  failures.push(`唯一标签达到 ${uniqueTagCount} 个，超过治理上限 ${MAX_UNIQUE_TAGS} 个`);
}
if (publicTagCount > MAX_PUBLIC_TAGS) {
  failures.push(`多文章标签达到 ${publicTagCount} 个，超过治理上限 ${MAX_PUBLIC_TAGS} 个`);
}
if (singletonCount > MAX_SINGLETON_TAGS) {
  failures.push(`单篇标签达到 ${singletonCount} 个，超过治理上限 ${MAX_SINGLETON_TAGS} 个`);
}

if (failures.length > 0) {
  console.error(`标签治理检查失败：\n${failures.map((item) => `- ${item}`).join("\n")}`);
  process.exit(1);
}

console.log(
  `标签治理检查通过：${coreTagSlugs.length} 个核心标签，${publicTagCount} 个多文章标签，` +
    `${singletonCount} 个单篇标签，唯一标签共 ${uniqueTagCount} 个；` +
    `上限分别为 ${MAX_PUBLIC_TAGS}/${MAX_SINGLETON_TAGS}/${MAX_UNIQUE_TAGS}，canonical 301 已锁定。`,
);
