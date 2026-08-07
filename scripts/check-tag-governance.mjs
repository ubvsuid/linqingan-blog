import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

const root = process.cwd();
const postsDirectory = path.join(root, "content", "posts");
const fixedTagSlugs = JSON.parse(
  fs.readFileSync(path.join(root, "src", "lib", "tag-slugs.json"), "utf8"),
);
const coreTagSlugs = JSON.parse(
  fs.readFileSync(path.join(root, "src", "lib", "core-tag-slugs.json"), "utf8"),
);

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

for (const fileName of fs
  .readdirSync(postsDirectory)
  .filter((name) => name.endsWith(".md"))) {
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
  if (names.size > 4) {
    failures.push(
      `标签 ${slug} 聚合了过多名称：${[...names].join("、")}，应重新检查 canonical 边界`,
    );
  }
}

const uniqueTagCount = counts.size;
const singletonCount = [...counts.values()].filter((count) => count === 1).length;
const publicTagCount = [...counts.values()].filter((count) => count >= 2).length;
const indexableTagCount = [...counts.values()].filter((count) => count >= 3).length;

if (uniqueTagCount > 110) {
  failures.push(`唯一标签达到 ${uniqueTagCount} 个，超过当前治理上限 110 个`);
}
if (publicTagCount > 60) {
  failures.push(
    `可浏览标签归档达到 ${publicTagCount} 个，超过当前治理上限 60 个`,
  );
}
if (publicTagCount < coreTagSlugs.length) {
  failures.push(
    `可浏览标签归档 ${publicTagCount} 个少于核心标签 ${coreTagSlugs.length} 个`,
  );
}

const tagCenterSource = fs.readFileSync(
  path.join(root, "src", "app", "(zh)", "tags", "page.tsx"),
  "utf8",
);
if (!tagCenterSource.includes("getPublicTagRecords")) {
  failures.push("标签中心没有使用公开标签归档过滤器");
}

const tagArchiveSource = fs.readFileSync(
  path.join(root, "src", "app", "(zh)", "tags", "[tag]", "page.tsx"),
  "utf8",
);
for (const marker of [
  'record.count < 2',
  'permanentRedirect("/tags")',
  'noindex: record.count < 3',
]) {
  if (!tagArchiveSource.includes(marker)) {
    failures.push(`标签归档缺少治理边界：${marker}`);
  }
}

if (failures.length > 0) {
  console.error(
    `标签治理检查失败：\n${failures.map((item) => `- ${item}`).join("\n")}`,
  );
  process.exit(1);
}

console.log(
  `标签治理检查通过：${coreTagSlugs.length} 个核心标签，${publicTagCount} 个可浏览归档，` +
    `${indexableTagCount} 个可索引归档，${singletonCount} 个单篇描述标签，canonical 标签共 ${uniqueTagCount} 个。`,
);
