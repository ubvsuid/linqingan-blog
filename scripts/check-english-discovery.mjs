import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const libDirectory = path.join(root, "src", "lib");
const failures = [];

const registryFiles = fs.readdirSync(libDirectory)
  .filter((name) => name === "english-articles.ts" || /^english-[a-z0-9-]+-registry-\d+\.ts$/.test(name))
  .sort();

const hrefs = [];
const chinesePaths = [];
for (const fileName of registryFiles) {
  const source = fs.readFileSync(path.join(libDirectory, fileName), "utf8");
  for (const match of source.matchAll(/\bhref\s*:\s*["'](\/en\/blog\/[a-z0-9-]+)["']/g)) hrefs.push(match[1]);
  for (const match of source.matchAll(/\bchinesePath\s*:\s*["'](\/blog\/[a-z0-9-]+)["']/g)) chinesePaths.push(match[1]);
}

function duplicates(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()].filter(([, count]) => count > 1).map(([value]) => value);
}

for (const href of duplicates(hrefs)) failures.push(`Duplicate English article href: ${href}`);
for (const chinesePath of duplicates(chinesePaths)) failures.push(`Duplicate Chinese source mapping: ${chinesePath}`);
if (hrefs.length === 0) failures.push("No published English article hrefs were discovered.");
if (hrefs.length !== chinesePaths.length) failures.push(`English href/source count mismatch: ${hrefs.length} hrefs vs ${chinesePaths.length} Chinese paths.`);

const requiredFiles = [
  "src/lib/english-discovery.ts",
  "src/components/english-article-browser.tsx",
  "src/app/en/tags/page.tsx",
  "src/app/en/tags/[tag]/page.tsx",
  "src/app/en/feed.xml/route.ts",
  "src/app/en/blog/[slug]/opengraph-image.tsx",
];
for (const relativePath of requiredFiles) {
  if (!fs.existsSync(path.join(root, relativePath))) failures.push(`Missing English discovery file: ${relativePath}`);
}

const assertions = [
  ["src/components/site-footer.tsx", "/en/feed.xml", "English footer RSS link"],
  ["src/components/site-footer.tsx", "/en/tags", "English footer topic link"],
  ["src/app/sitemap.ts", "englishTags", "English topic Sitemap entries"],
  ["src/app/blog/[slug]/layout.tsx", "hrefLang=\"en\"", "reciprocal English hreflang"],
  ["src/app/blog/[slug]/layout.tsx", "hrefLang=\"zh-CN\"", "reciprocal Chinese hreflang"],
  ["src/app/en/blog/[slug]/page.tsx", "/opengraph-image", "article-specific Open Graph image"],
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

if (failures.length > 0) {
  for (const failure of failures) console.error(`ERROR: ${failure}`);
  console.error(`\nEnglish discovery check failed: ${failures.length} issue(s).`);
  process.exit(1);
}

console.log(`English discovery check passed: ${hrefs.length} unique English article mappings, topic archives, RSS, reciprocal hreflang, related guides, and article share images are present.`);
