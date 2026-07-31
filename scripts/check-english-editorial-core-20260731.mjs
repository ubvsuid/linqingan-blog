import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = process.cwd();
const dataSource = readFileSync(
  join(root, "src/lib/english-editorial-core-published-20260731.ts"),
  "utf8",
);
const encodedMatch = dataSource.match(
  /const encodedEditorialCoreData = "([A-Za-z0-9+/=]+)";/,
);
if (!encodedMatch) throw new Error("Embedded core editorial payload is missing.");
const data = JSON.parse(
  gunzipSync(Buffer.from(encodedMatch[1], "base64")).toString("utf8"),
);
const expected = {
  "screeps-memory-basics": {
    path: "/en/blog/screeps-memory-basics",
    chinesePath: "/blog/screeps-memory-basics",
    beforeScore: 90,
  },
  "screeps-spawncreep-return-codes": {
    path: "/en/blog/screeps-spawncreep-return-codes",
    chinesePath: "/blog/screeps-spawncreep-return-codes",
    beforeScore: 91,
  },
  "screeps-cpu-getused-bucket": {
    path: "/en/blog/screeps-cpu-getused-bucket",
    chinesePath: "/blog/screeps-cpu-getused-bucket",
    beforeScore: 92,
  },
};
const scoreMinimums = {
  technicalAccuracy: 22,
  searchIntent: 17,
  originalValue: 13,
  englishQuality: 11,
  evidenceTransparency: 7,
};
const banned = [
  "in today's fast-paced world",
  "in this comprehensive guide",
  "whether you are a beginner or an expert",
  "let's dive in",
  "delve into",
  "unlock the power of",
  "seamlessly",
  "game-changing",
  "it is important to note that",
  "by following these steps",
];
const failures = [];
const slugs = Object.keys(data.articles);
if (slugs.length !== 3 || slugs.some((slug) => !expected[slug])) {
  failures.push(`Expected exactly three selected existing articles, received: ${slugs.join(", ")}`);
}
const titles = new Set();
const intents = new Set();
let javascriptBlocks = 0;

for (const [slug, article] of Object.entries(data.articles)) {
  const audit = data.audits[slug];
  const identity = expected[slug];
  if (!identity) continue;
  if (article.slug !== slug || article.path !== identity.path || article.chinesePath !== identity.chinesePath) {
    failures.push(`${slug}: route or Chinese mapping changed`);
  }
  if (article.publishedAt !== "2026-07-25") failures.push(`${slug}: datePublished changed`);
  if (article.finalScore < 96 || audit.finalScore < 96) failures.push(`${slug}: score below 96`);
  if (audit.beforeScore !== identity.beforeScore) failures.push(`${slug}: before score record changed`);
  for (const [component, minimum] of Object.entries(scoreMinimums)) {
    if (audit.components[component] < minimum) failures.push(`${slug}: ${component} below ${minimum}`);
  }
  const computed = Object.values(audit.components).reduce((sum, value) => sum + value, 0);
  if (computed !== audit.finalScore || computed !== 98) failures.push(`${slug}: component score does not total 98`);
  if (article.faq.length !== 0) failures.push(`${slug}: redundant FAQ data remains`);
  if (!article.articleHtml.includes('<h2 id="use-this-guide">')) failures.push(`${slug}: missing use boundary`);
  if (!article.articleHtml.includes('<h2 id="official-docs">')) failures.push(`${slug}: missing official documentation`);
  if (!article.articleHtml.includes("https://docs.screeps.com/")) failures.push(`${slug}: missing official Screeps source`);
  const verification = Object.fromEntries(article.verification);
  if (verification["Screeps Console test"] !== "Pending") failures.push(`${slug}: Console status is not Pending`);
  if (verification["Live multi-tick verification"] !== "Pending") failures.push(`${slug}: live status is not Pending`);
  if (!String(verification["Evidence level"]).includes("static analysis only")) failures.push(`${slug}: evidence level is unclear`);
  if (titles.has(article.title)) failures.push(`${slug}: duplicate title`);
  if (intents.has(article.searchIntent)) failures.push(`${slug}: duplicate search intent`);
  titles.add(article.title);
  intents.add(article.searchIntent);
  const lower = `${article.title}\n${article.headline}\n${article.description}\n${article.articleHtml}`.toLowerCase();
  for (const phrase of banned) {
    if (lower.includes(phrase)) failures.push(`${slug}: prohibited phrase “${phrase}”`);
  }
  const headingIds = new Set([...article.articleHtml.matchAll(/<h[2-6] id="([^"]+)"/g)].map((match) => match[1]));
  for (const [id] of article.toc) {
    if (!headingIds.has(id)) failures.push(`${slug}: TOC target #${id} is missing`);
  }
  const blocks = [...article.articleHtml.matchAll(/<pre><code class="language-javascript">([\s\S]*?)<\/code><\/pre>/g)];
  for (const [index, match] of blocks.entries()) {
    javascriptBlocks += 1;
    const path = join(tmpdir(), `english-editorial-core-${slug}-${index}.js`);
    const code = match[1]
      .replaceAll("&lt;", "<")
      .replaceAll("&gt;", ">")
      .replaceAll("&amp;", "&")
      .replaceAll("&quot;", '"')
      .replaceAll("&#39;", "'");
    writeFileSync(path, code);
    try {
      execFileSync(process.execPath, ["--check", path], { stdio: "pipe" });
    } catch (error) {
      failures.push(`${slug}: JavaScript block ${index + 1} failed node --check: ${error.message}`);
    } finally {
      unlinkSync(path);
    }
  }
}

if (javascriptBlocks !== 10) failures.push(`Expected 10 JavaScript blocks, received ${javascriptBlocks}`);
const publication = readFileSync(join(root, "src/lib/english-editorial-published-20260731.ts"), "utf8");
const registry = readFileSync(join(root, "src/lib/english-articles-complete.ts"), "utf8");
const packageJson = readFileSync(join(root, "package.json"), "utf8");
for (const slug of slugs) {
  if (!registry.includes(`"/en/blog/${slug}"`)) failures.push(`${slug}: complete registry override missing`);
}
if (!publication.includes("englishEditorialCorePublished20260731")) failures.push("Core editorial publication is not integrated");
if (!packageJson.includes("englisheditorialcore20260731check")) failures.push("Dedicated gate is not wired into package scripts");
for (const required of [
  "Local variables inside <code>module.exports.loop</code>",
  "Module or <code>global</code> heap data",
  "optional <code>memory</code> field is documented as <code>any</code>",
  "dryRunResult",
  "spawnResult",
  "The Simulation always reports <code>0</code>",
  "end - start",
  "Bucket is scheduling context, not proof of optimization",
]) {
  if (!JSON.stringify(data.articles).includes(required)) failures.push(`Missing technical boundary: ${required}`);
}

if (failures.length) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  console.error(`\nCore English editorial gate failed: ${failures.length} item(s).`);
  process.exit(1);
}
console.log(`Core English editorial gate passed: 3 existing pages, ${javascriptBlocks} JavaScript blocks, stable URLs, distinct intent, Pending live evidence, synchronized metadata, and 98-point internal scores.`);
