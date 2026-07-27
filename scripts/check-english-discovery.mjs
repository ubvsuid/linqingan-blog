import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const libDirectory = path.join(root, "src", "lib");
const postsDirectory = path.join(root, "content", "posts");
const failures = [];

const registryFiles = fs.readdirSync(libDirectory)
  .filter((name) => name === "english-articles.ts" || /^english-[a-z0-9-]+-registry-\d+\.ts$/.test(name))
  .sort();

const records = [];
for (const fileName of registryFiles) {
  const source = fs.readFileSync(path.join(libDirectory, fileName), "utf8");
  for (const match of source.matchAll(
    /\{[\s\S]*?["']?href["']?\s*:\s*["'](\/en\/blog\/[a-z0-9-]+)["'][\s\S]*?["']?chinesePath["']?\s*:\s*["'](\/blog\/[a-z0-9-]+)["'][\s\S]*?\}/g,
  )) {
    records.push({ href: match[1], chinesePath: match[2], fileName });
  }
}

function duplicateValues(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()].filter(([, count]) => count > 1).map(([value]) => value);
}

const hrefs = records.map((record) => record.href);
const chinesePaths = records.map((record) => record.chinesePath);

for (const href of duplicateValues(hrefs)) failures.push(`Duplicate English article href: ${href}`);
for (const chinesePath of duplicateValues(chinesePaths)) failures.push(`Duplicate Chinese source mapping: ${chinesePath}`);
if (records.length === 0) failures.push("No paired English article records were discovered.");

for (const record of records) {
  const chineseSlug = record.chinesePath.slice("/blog/".length);
  const chinesePost = path.join(postsDirectory, `${chineseSlug}.md`);
  const chineseStaticPage = path.join(root, "src", "app", "(zh)", "blog", chineseSlug, "page.tsx");
  if (!fs.existsSync(chinesePost) && !fs.existsSync(chineseStaticPage)) {
    failures.push(
      `English pair ${record.href} points to missing Chinese source ${record.chinesePath} in ${record.fileName}`,
    );
  }

  const englishSlug = record.href.slice("/en/blog/".length);
  const englishStaticPage = path.join(root, "src", "app", "(en)", "en", "blog", englishSlug, "page.tsx");
  const englishDynamicPage = path.join(root, "src", "app", "(en)", "en", "blog", "[slug]", "page.tsx");
  if (!fs.existsSync(englishStaticPage) && !fs.existsSync(englishDynamicPage)) {
    failures.push(`English pair lacks a route for ${record.href} in ${record.fileName}`);
  }
}

const requiredFiles = [
  "src/lib/english-discovery.ts",
  "src/components/english-article-browser.tsx",
  "src/app/(en)/en/tags/page.tsx",
  "src/app/(en)/en/tags/[tag]/page.tsx",
  "src/app/(en)/en/feed.xml/route.ts",
  "src/app/(en)/en/blog/[slug]/opengraph-image.tsx",
  "src/app/(en)/en/blog/screeps-creep-body-parts/opengraph-image.tsx",
];
for (const relativePath of requiredFiles) {
  if (!fs.existsSync(path.join(root, relativePath))) failures.push(`Missing English discovery file: ${relativePath}`);
}

const assertions = [
  ["src/components/site-footer.tsx", "/en/feed.xml", "English footer RSS link"],
  ["src/components/site-footer.tsx", "/en/tags", "English footer topic link"],
  ["src/app/(zh)/sitemap.ts", "englishTags", "English topic Sitemap entries"],
  ["src/app/(zh)/blog/[slug]/layout.tsx", "hrefLang=\"en\"", "reciprocal English hreflang"],
  ["src/app/(zh)/blog/[slug]/layout.tsx", "hrefLang=\"zh-CN\"", "reciprocal Chinese hreflang"],
  ["src/app/(en)/en/blog/[slug]/page.tsx", "/opengraph-image", "article-specific Open Graph image"],
  ["src/components/english-article-page.tsx", "getRelatedEnglishArticles", "related English guides"],
  ["src/components/english-article-page.tsx", "/en/tags/", "clickable English topic links"],
];

for (const [relativePath, expected, label] of assertions) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    failures.push(`Missing file for ${label}: ${relativePath}`);
    continue;
  }
  const source = fs.readFileSync(absolutePath, "utf8");
  if (!source.includes(expected)) failures.push(`Missing ${label} in ${relativePath}`);
}


const discoverySource = fs.readFileSync(path.join(root, "src/lib/english-discovery.ts"), "utf8");
if (discoverySource.includes("tagRules.filter((rule) => rule.terms.some")) failures.push("English topics still depend on broad keyword matching.");
const browserSource = fs.readFileSync(path.join(root, "src/components/english-article-browser.tsx"), "utf8");
if (browserSource.includes("Score {article.finalScore}")) failures.push("English article browser still exposes internal scores.");

if (failures.length > 0) {
  for (const failure of failures) console.error(`ERROR: ${failure}`);
  console.error(`\nEnglish discovery check failed: ${failures.length} issue(s).`);
  process.exit(1);
}

console.log(
  `English discovery check passed: ${records.length} paired English/Chinese records, topic archives, RSS, reciprocal hreflang, related guides, and article share images are present. Semantic registry/content pairing is additionally enforced by englishmappingcheck.`,
);
