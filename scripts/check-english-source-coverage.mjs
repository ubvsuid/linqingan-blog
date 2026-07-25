import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const postsDirectory = path.join(root, "content", "posts");
const libDirectory = path.join(root, "src", "lib");
const registryFiles = fs.readdirSync(libDirectory)
  .filter((name) =>
    name === "english-articles.ts"
    || /^english-[a-z0-9-]+-registry-\d+\.ts$/.test(name)
  )
  .sort();
const mappedSlugs = new Set();
const failures = [];

for (const fileName of registryFiles) {
  const source = fs.readFileSync(
    path.join(libDirectory, fileName),
    "utf8",
  );

  for (const match of source.matchAll(
    /["']?chinesePath["']?\s*:\s*["']\/blog\/([a-z0-9-]+)["']/g,
  )) {
    mappedSlugs.add(match[1]);
  }
}

const publishedScreepsSlugs = fs.readdirSync(postsDirectory)
  .filter((name) => /^screeps-[a-z0-9-]+\.md$/.test(name))
  .filter((name) => {
    const source = fs.readFileSync(
      path.join(postsDirectory, name),
      "utf8",
    );
    const frontmatter = source.startsWith("---")
      ? source.split("---", 3)[1] || ""
      : "";

    return !/^status:\s*(draft|archived)\s*$/m.test(frontmatter);
  })
  .map((name) => name.replace(/\.md$/, ""))
  .sort();

for (const slug of publishedScreepsSlugs) {
  if (!mappedSlugs.has(slug)) {
    failures.push(`未映射中文文章 /blog/${slug}`);
  }
}

for (const slug of mappedSlugs) {
  if (!publishedScreepsSlugs.includes(slug)) {
    const staticPage = path.join(
      root,
      "src",
      "app",
      "blog",
      slug,
      "page.tsx",
    );

    if (!fs.existsSync(staticPage)) {
      failures.push(`英文映射指向非发布中文来源 /blog/${slug}`);
    }
  }
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`ERROR: ${failure}`);
  }
  console.error(`\n英文来源覆盖检查失败：${failures.length} 项。`);
  process.exit(1);
}

console.log(
  `英文来源覆盖检查通过：${publishedScreepsSlugs.length} 篇已发布中文 Screeps 文章全部具有唯一英文来源映射；当前共 ${mappedSlugs.size} 个映射。`,
);
