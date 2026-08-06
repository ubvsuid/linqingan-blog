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
  "src/lib/english-discovery-topic-overrides-20260806.ts",
  "src/lib/english-article-browser.ts",
  "src/lib/sitemaps.ts",
  "src/components/english-article-browser.tsx",
  "src/components/english-article-browser.module.css",
  "src/components/english-article-query-input.tsx",
  "src/app/(en)/en/blog-index.json/route.ts",
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
  ["src/lib/sitemaps.ts", "englishTags", "English topic Sitemap entries"],
  ["src/lib/sitemaps.ts", ".filter((tag) => tag.count >= 3)", "English topic Sitemap threshold"],
  ["src/app/(en)/en/tags/[tag]/page.tsx", "index: tag.count >= 3", "English thin-topic noindex threshold"],
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

function extractTopicMappings(source, objectName) {
  const block = source.match(new RegExp(`const ${objectName}:[\\s\\S]*?= \\{([\\s\\S]*?)\\n\\};`))
    ?? source.match(new RegExp(`export const ${objectName} = \\{([\\s\\S]*?)\\n\\} as const;`));
  if (!block) return null;

  return [...block[1].matchAll(/"(\/en\/blog\/[^"]+)": \[([^\]]*)\]/g)].map((match) => [
    match[1],
    [...match[2].matchAll(/"([^"]+)"/g)].map((topic) => topic[1]),
  ]);
}

const discoverySource = fs.readFileSync(path.join(root, "src/lib/english-discovery.ts"), "utf8");
const primaryMappings = extractTopicMappings(discoverySource, "articleTagSlugOverrides");
const supplementalSource = fs.readFileSync(
  path.join(root, "src/lib/english-discovery-topic-overrides-20260806.ts"),
  "utf8",
);
const supplementalMappings = extractTopicMappings(
  supplementalSource,
  "additionalArticleTagSlugOverrides",
);

if (!primaryMappings) {
  failures.push("English article topic override map is missing.");
} else if (!supplementalMappings) {
  failures.push("Supplemental English article topic override map is missing.");
} else {
  const topicCounts = new Map([...primaryMappings, ...supplementalMappings]);
  for (const href of hrefs) {
    const topics = topicCounts.get(href);
    if (!topics) {
      failures.push(`English article lacks an explicit topic mapping: ${href}`);
      continue;
    }
    if (topics.length < 2 || topics.length > 4) {
      failures.push(`English article must have 2-4 curated topics: ${href} has ${topics.length}`);
    }
    if (new Set(topics).size !== topics.length) {
      failures.push(`English article has duplicate curated topics: ${href}`);
    }
  }
}
if (discoverySource.includes("tagRules.filter((rule) => rule.terms.some")) failures.push("English topics still depend on broad keyword matching.");
const browserSource = fs.readFileSync(path.join(root, "src/components/english-article-browser.tsx"), "utf8");
if (browserSource.includes("Score {article.finalScore}")) failures.push("English article browser still exposes internal scores.");
if (browserSource.includes('"use client"')) failures.push("English article browser must remain a Server Component.");
if (browserSource.includes("<style")) failures.push("English article browser still contains component-local styles.");

if (failures.length > 0) {
  for (const failure of failures) console.error(`ERROR: ${failure}`);
  console.error(`\nEnglish discovery check failed: ${failures.length} issue(s).`);
  process.exit(1);
}

console.log(
  `English discovery check passed: ${records.length} paired English/Chinese records, curated topic archives, thin-topic index thresholds, RSS, reciprocal hreflang, related guides, and article share images are present. Semantic registry/content pairing is additionally enforced by englishmappingcheck.`,
);
