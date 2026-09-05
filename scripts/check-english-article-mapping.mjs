import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const libDirectory = path.join(root, "src", "lib");
const associationPath = path.join(root, "content", "article-language-associations.json");
const associationPayload = fs.existsSync(associationPath)
  ? JSON.parse(fs.readFileSync(associationPath, "utf8"))
  : { records: [] };
const explicitAssociationByEnglish = new Map(
  (associationPayload.records ?? []).map((record) => [record.englishPath, record.chinesePath]),
);
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
const standaloneHrefs = [];
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

  if (chineseMatches.length === 0 && hrefMatches.length > 0 && fileName !== "english-articles.ts") {
    standaloneHrefs.push(...hrefMatches.map((match) => ({
      fileName,
      href: match[1],
    })));
    continue;
  }

  if (hrefMatches.length !== chineseMatches.length) {
    failures.push(
      `${fileName}: href 数量 ${hrefMatches.length} 与 chinesePath 数量 ${chineseMatches.length} 不一致；同一 registry 不应混合双语映射与英文原创记录`,
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

function findDuplicates(items, key) {
  const grouped = new Map();

  for (const record of items) {
    const value = record[key];
    const current = grouped.get(value) || [];
    current.push(record.fileName);
    grouped.set(value, current);
  }

  return [...grouped.entries()]
    .filter(([, files]) => files.length > 1);
}

const allEnglishRecords = [
  ...records.map(({ fileName, href }) => ({ fileName, href })),
  ...standaloneHrefs,
];

for (const [href, files] of findDuplicates(allEnglishRecords, "href")) {
  failures.push(`英文路径重复 ${href}: ${files.join(", ")}`);
}

for (const [chinesePath, files] of findDuplicates(records, "chinesePath")) {
  failures.push(`中文来源路径重复 ${chinesePath}: ${files.join(", ")}`);
}

for (const record of standaloneHrefs) {
  const slug = record.href.slice("/en/blog/".length);
  const staticPagePath = path.join(
    root,
    "src",
    "app",
    "(en)",
    "en",
    "blog",
    slug,
    "page.tsx",
  );

  if (!fs.existsSync(staticPagePath)) {
    failures.push(`${record.fileName}: 英文原创缺少静态页面 ${record.href}`);
    continue;
  }

  const staticPageSource = fs.readFileSync(staticPagePath, "utf8");
  const associatedChinesePath = explicitAssociationByEnglish.get(record.href);

  if (staticPageSource.includes("isBasedOn")) {
    failures.push(`${record.fileName}: 英文原创页面不应声明 isBasedOn ${record.href}`);
  }
  if (staticPageSource.includes('"zh-CN"') && !associatedChinesePath) {
    failures.push(`${record.fileName}: 英文原创页面声明了不存在的中文 alternate ${record.href}`);
  }
  if (associatedChinesePath && !staticPageSource.includes('"zh-CN"')) {
    failures.push(`${record.fileName}: 已存在显式中文 counterpart，但页面缺少 zh-CN alternate ${record.href}`);
  }
  if (associatedChinesePath) {
    const associatedSlug = associatedChinesePath.slice("/blog/".length);
    const markdownPath = path.join(root, "content", "posts", `${associatedSlug}.md`);
    const legacyStaticPagePath = path.join(root, "src", "app", "blog", associatedSlug, "page.tsx");
    if (!fs.existsSync(markdownPath) && !fs.existsSync(legacyStaticPagePath)) {
      failures.push(`${record.fileName}: 显式中文 counterpart 不存在 ${associatedChinesePath}`);
    }
  }
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
const bilingualRegistryPath = path.join(
  root,
  "src",
  "lib",
  "english-articles-complete-bilingual.ts",
);
const bilingualRegistrySource = fs.existsSync(bilingualRegistryPath)
  ? fs.readFileSync(bilingualRegistryPath, "utf8")
  : "";
const standaloneRegistryFiles = new Set(
  standaloneHrefs.map((record) => record.fileName),
);

for (const fileName of registryFiles.filter((name) => name !== "english-articles.ts")) {
  const stem = fileName.replace(/\.ts$/, "");
  const importedByComplete = completeRegistrySource.includes(`./${stem}`);
  const importedByBilingual = bilingualRegistrySource.includes(`./${stem}`);

  if (standaloneRegistryFiles.has(fileName)) {
    if (!importedByComplete) {
      failures.push(`统一英文登记未直接导入英文原创 ${fileName}`);
    }
    continue;
  }

  if (!importedByComplete && !importedByBilingual) {
    failures.push(`统一英文登记链未导入双语登记 ${fileName}`);
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
  `英文文章映射检查通过：${records.length} 条中英文配对、${standaloneHrefs.length} 条英文原创、${registryFiles.length} 个登记文件、${numberedContentFiles.length} 个动态内容批次；路径唯一、双语来源存在且统一接入完整。`,
);
