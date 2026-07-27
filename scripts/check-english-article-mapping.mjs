import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const libDirectory = path.join(root, "src", "lib");
const registryFiles = fs.readdirSync(libDirectory)
  .filter((name) =>
    name === "english-articles.ts"
    || /^english-[a-z0-9-]+-registry-\d+\.ts$/.test(name)
  )
  .sort();
const numberedContentFiles = fs.readdirSync(libDirectory)
  .filter((name) =>
    /^english-[a-z0-9-]+-content-\d+(?:-published)?\.ts$/.test(name)
  )
  .sort();
const records = [];
const failures = [];

for (const fileName of registryFiles) {
  const source = fs.readFileSync(
    path.join(libDirectory, fileName),
    "utf8",
  );
  const hrefMatches = [...source.matchAll(
    /["']?href["']?\s*:\s*["'](\/en\/blog\/[a-z0-9-]+)["']/g,
  )];
  const chineseMatches = [...source.matchAll(
    /["']?chinesePath["']?\s*:\s*["'](\/blog\/[a-z0-9-]+)["']/g,
  )];

  if (hrefMatches.length !== chineseMatches.length) {
    failures.push(
      `${fileName}: href 数量 ${hrefMatches.length} 与 chinesePath 数量 ${chineseMatches.length} 不一致`,
    );
    continue;
  }

  for (let index = 0; index < hrefMatches.length; index += 1) {
    records.push({
      fileName,
      href: hrefMatches[index][1],
      chinesePath: chineseMatches[index][1],
    });
  }
}

function findDuplicates(key) {
  const grouped = new Map();

  for (const record of records) {
    const value = record[key];
    const current = grouped.get(value) || [];
    current.push(record.fileName);
    grouped.set(value, current);
  }

  return [...grouped.entries()]
    .filter(([, files]) => files.length > 1);
}

for (const [href, files] of findDuplicates("href")) {
  failures.push(`英文路径重复 ${href}: ${files.join(", ")}`);
}

for (const [chinesePath, files] of findDuplicates("chinesePath")) {
  failures.push(`中文来源路径重复 ${chinesePath}: ${files.join(", ")}`);
}

for (const record of records) {
  const slug = record.chinesePath.slice("/blog/".length);
  const markdownPath = path.join(
    root,
    "content",
    "posts",
    `${slug}.md`,
  );
  const staticPagePath = path.join(
    root,
    "src",
    "app",
    "blog",
    slug,
    "page.tsx",
  );

  if (
    !fs.existsSync(markdownPath)
    && !fs.existsSync(staticPagePath)
  ) {
    failures.push(
      `${record.fileName}: 中文来源不存在 ${record.chinesePath}`,
    );
  }
}

const routeSource = fs.readFileSync(
  path.join(root, "src", "app", "(en)", "en", "blog", "[slug]", "page.tsx"),
  "utf8",
);
const completeRegistrySource = fs.readFileSync(
  path.join(root, "src", "lib", "english-articles-complete.ts"),
  "utf8",
);

for (const fileName of registryFiles.filter((name) => name !== "english-articles.ts")) {
  const stem = fileName.replace(/\.ts$/, "");
  if (!completeRegistrySource.includes(`./${stem}`)) {
    failures.push(`统一英文登记未导入 ${fileName}`);
  }
}

for (const fileName of numberedContentFiles) {
  const stem = fileName.replace(/\.ts$/, "");
  if (!routeSource.includes(`@/lib/${stem}`)) {
    failures.push(`英文动态路由未导入 ${fileName}`);
  }
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`ERROR: ${failure}`);
  }
  console.error(`\n英文文章映射检查失败：${failures.length} 项。`);
  process.exit(1);
}

console.log(
  `英文文章映射检查通过：${records.length} 条中英文配对、${registryFiles.length} 个登记文件、${numberedContentFiles.length} 个动态内容批次；路径唯一、来源存在且统一接入完整。`,
);
