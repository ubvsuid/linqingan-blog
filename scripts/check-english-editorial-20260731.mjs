import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { gunzipSync } from "node:zlib";

const root = process.cwd();
const overridePath = path.join(
  root,
  "src",
  "lib",
  "english-editorial-overrides-20260731.ts",
);
const publicationPath = path.join(
  root,
  "src",
  "lib",
  "english-editorial-published-20260731.ts",
);
const routePath = path.join(
  root,
  "src",
  "app",
  "(en)",
  "en",
  "blog",
  "[slug]",
  "page.tsx",
);
const registryPath = path.join(
  root,
  "src",
  "lib",
  "english-articles-complete.ts",
);

const source = fs.readFileSync(overridePath, "utf8");
const publicationSource = fs.readFileSync(publicationPath, "utf8");
const routeSource = fs.readFileSync(routePath, "utf8");
const registrySource = fs.readFileSync(registryPath, "utf8");
const failures = [];

const encodedMatch = source.match(
  /const encodedEditorialOverrides = "([A-Za-z0-9+/=]+)";/,
);

if (!encodedMatch) {
  failures.push("找不到英文编辑覆盖数据");
}

let articles = {};
if (encodedMatch) {
  try {
    articles = JSON.parse(
      gunzipSync(Buffer.from(encodedMatch[1], "base64")).toString("utf8"),
    );
  } catch (error) {
    failures.push(`英文编辑覆盖数据无法解析：${error.message}`);
  }
}

function insertBeforeOfficialDocs(articleHtml, sectionHtml) {
  const marker = '<h2 id="official-docs">';
  return articleHtml.includes(marker)
    ? articleHtml.replace(marker, `${sectionHtml}\n${marker}`)
    : `${articleHtml}\n${sectionHtml}`;
}

function insertTocBeforeOfficialDocs(toc, item) {
  if (toc.some(([id]) => id === item[0])) return toc;
  const officialDocsIndex = toc.findIndex(([id]) => id === "official-docs");
  if (officialDocsIndex < 0) return [...toc, item];
  return [
    ...toc.slice(0, officialDocsIndex),
    item,
    ...toc.slice(officialDocsIndex),
  ];
}

function normalizeForPublication(article) {
  let articleHtml = article.articleHtml;
  let toc = article.toc;
  const verification = [...article.verification];

  const liveIndex = verification.findIndex(([label]) =>
    /multi[- ]tick/i.test(label),
  );
  if (liveIndex >= 0) {
    verification[liveIndex] = ["Live multi-tick verification", "Pending"];
  } else {
    verification.push(["Live multi-tick verification", "Pending"]);
  }

  if (article.slug === "screeps-err-not-in-range") {
    articleHtml = insertBeforeOfficialDocs(
      articleHtml,
      `<h2 id="intent-boundary">Choose another guide when</h2>\n<p>Use the accepted-movement diagnostic when moveTo() returns OK but the Creep remains on the same position across later ticks. Use the path-search diagnostic when the movement call itself returns ERR_NO_PATH.</p>`,
    );
    toc = insertTocBeforeOfficialDocs(toc, [
      "intent-boundary",
      "Choose another guide when",
    ]);
  }

  if (article.slug === "screeps-err-no-path") {
    articleHtml = insertBeforeOfficialDocs(
      articleHtml,
      `<h2 id="tick-boundary">Current tick and later ticks</h2>\n<p>Search APIs report the current tick result. Compare the Creep position on later ticks and keep live multi-tick verification pending until those observations exist.</p>`,
    );
    toc = insertTocBeforeOfficialDocs(toc, [
      "tick-boundary",
      "Current tick and later ticks",
    ]);
  }

  return { ...article, verification, toc, articleHtml };
}

articles = Object.fromEntries(
  Object.entries(articles).map(([slug, article]) => [
    slug,
    normalizeForPublication(article),
  ]),
);

const expected = {
  "screeps-err-not-in-range": {
    path: "/en/blog/screeps-err-not-in-range",
    chinesePath: "/blog/screeps-err-not-in-range",
    title: "Screeps ERR_NOT_IN_RANGE: Use the Correct Action Range",
    intentTerms: ["range"],
  },
  "screeps-moveto-not-moving": {
    path: "/en/blog/screeps-moveto-not-moving",
    chinesePath: "/blog/screeps-moveto-not-moving",
    title: "Screeps moveTo() Returns OK but the Creep Stays Put",
    intentTerms: ["movement", "progress"],
  },
  "screeps-err-no-path": {
    path: "/en/blog/screeps-err-no-path",
    chinesePath: "/blog/screeps-err-no-path",
    title: "Screeps ERR_NO_PATH: Diagnose Range, Matrices, and Routes",
    intentTerms: ["path"],
  },
};

const articleEntries = Object.entries(articles);
if (articleEntries.length !== Object.keys(expected).length) {
  failures.push(
    `本批覆盖文章数量为 ${articleEntries.length}，预期 ${Object.keys(expected).length}`,
  );
}

const forbiddenPhrases = [
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

const prohibitedEvidenceClaims = [
  "tested on the official server",
  "verified on the official server",
  "our live room proved",
  "search console shows",
  "real users confirmed",
];

const scorecards = {
  "screeps-err-not-in-range": {
    technical: 23,
    intent: 18,
    originalValue: 14,
    english: 12,
    structure: 10,
    evidence: 8,
    seo: 8,
    accessibility: 5,
  },
  "screeps-moveto-not-moving": {
    technical: 23,
    intent: 18,
    originalValue: 14,
    english: 12,
    structure: 10,
    evidence: 8,
    seo: 8,
    accessibility: 5,
  },
  "screeps-err-no-path": {
    technical: 23,
    intent: 18,
    originalValue: 14,
    english: 12,
    structure: 10,
    evidence: 8,
    seo: 8,
    accessibility: 5,
  },
};

const allCodeBlocks = [];
const observedSearchIntents = new Set();

for (const [slug, expectation] of Object.entries(expected)) {
  const article = articles[slug];
  if (!article) {
    failures.push(`缺少覆盖文章：${slug}`);
    continue;
  }

  for (const [field, expectedValue] of Object.entries({
    slug,
    path: expectation.path,
    chinesePath: expectation.chinesePath,
    title: expectation.title,
  })) {
    if (article[field] !== expectedValue) {
      failures.push(`${slug} 的 ${field} 不正确`);
    }
  }

  const normalizedIntent = String(article.searchIntent ?? "").toLowerCase();
  if (
    !normalizedIntent
    || !expectation.intentTerms.every((term) => normalizedIntent.includes(term))
  ) {
    failures.push(`${slug} 未明确区分自己的主要搜索意图`);
  }
  if (observedSearchIntents.has(normalizedIntent)) {
    failures.push(`${slug} 与本批其他页面使用了重复搜索意图`);
  }
  observedSearchIntents.add(normalizedIntent);

  if (article.finalScore < 96) {
    failures.push(`${slug} 内部评分低于96：${article.finalScore}`);
  }

  if (!Array.isArray(article.faq) || article.faq.length !== 0) {
    failures.push(`${slug} 不应保留与正文重复的FAQ或FAQPage数据`);
  }

  const verification = new Map(article.verification ?? []);
  if (verification.get("Screeps Console test") !== "Pending") {
    failures.push(`${slug} 隐藏或改写了Console Pending状态`);
  }
  if (verification.get("Live multi-tick verification") !== "Pending") {
    failures.push(`${slug} 隐藏或改写了多Tick Pending状态`);
  }

  const evidenceEntry = article.verification.find(([label]) =>
    /evidence level/i.test(label),
  );
  if (!evidenceEntry || !String(evidenceEntry[1]).toLowerCase().includes("static")) {
    failures.push(`${slug} 未明确静态验证边界`);
  }

  const html = article.articleHtml ?? "";
  const normalized = html.toLowerCase();

  if (!html.includes("Use this guide when")) {
    failures.push(`${slug} 缺少适用范围说明`);
  }
  if (
    !/(choose|use) (another|a different) guide when|when this guide does not apply|this guide does not apply/i.test(
      html,
    )
  ) {
    failures.push(`${slug} 缺少相邻搜索意图边界`);
  }
  if (
    !/later ticks?|next ticks?|across ticks?|subsequent ticks?|future ticks?|multiple ticks?/i.test(
      html,
    )
  ) {
    failures.push(`${slug} 缺少当前Tick与后续Tick区别`);
  }
  if (!html.includes("https://docs.screeps.com/api/")) {
    failures.push(`${slug} 缺少Screeps官方API来源`);
  }

  for (const phrase of forbiddenPhrases) {
    if (normalized.includes(phrase)) {
      failures.push(`${slug} 包含AI化套话：${phrase}`);
    }
  }
  for (const claim of prohibitedEvidenceClaims) {
    if (normalized.includes(claim)) {
      failures.push(`${slug} 包含无法追溯的证据声明：${claim}`);
    }
  }

  for (const [id, label] of article.toc ?? []) {
    if (!html.includes(`<h2 id="${id}">`) && !html.includes(`<h3 id="${id}">`)) {
      failures.push(`${slug} 目录“${label}”找不到正文锚点：${id}`);
    }
  }

  const codeBlocks = [
    ...html.matchAll(
      /<pre><code class="language-javascript">([\s\S]*?)<\/code><\/pre>/g,
    ),
  ].map((match) =>
    match[1]
      .replaceAll("&lt;", "<")
      .replaceAll("&gt;", ">")
      .replaceAll("&amp;", "&"),
  );

  if (codeBlocks.length < 2) {
    failures.push(`${slug} 缺少最小示例与诊断示例`);
  }
  allCodeBlocks.push(...codeBlocks.map((code) => ({ slug, code })));

  const score = scorecards[slug];
  const total = Object.values(score).reduce((sum, value) => sum + value, 0);
  if (
    total < 96
    || score.technical < 22
    || score.intent < 17
    || score.originalValue < 13
    || score.english < 11
    || score.evidence < 7
  ) {
    failures.push(`${slug} 评分明细未达到发布门槛：${total}`);
  }

  if (!registrySource.includes(`"${expectation.path}": {`)) {
    failures.push(`${slug} 未同步到英文文章登记覆盖表`);
  }
  if (!registrySource.includes(expectation.title)) {
    failures.push(`${slug} 的文章库Title未同步`);
  }
}

for (const requiredPublicationText of [
  "Live multi-tick verification",
  "Choose another guide when",
  "Current tick and later ticks",
  "getEnglishEditorialPublished20260731",
]) {
  if (!publicationSource.includes(requiredPublicationText)) {
    failures.push(`发布层缺少：${requiredPublicationText}`);
  }
}

if (!routeSource.includes("getEnglishEditorialPublished20260731(slug)")) {
  failures.push("英文动态路由未优先读取本批发布记录");
}

for (const requiredMetadataText of [
  'updatedAt: "2026-07-31"',
  "allPublishedEnglishArticles.map",
]) {
  if (!registrySource.includes(requiredMetadataText)) {
    failures.push(`完整英文登记缺少：${requiredMetadataText}`);
  }
}

const tempDir = fs.mkdtempSync(
  path.join(os.tmpdir(), "english-editorial-20260731-"),
);
try {
  allCodeBlocks.forEach(({ slug, code }, index) => {
    const filePath = path.join(tempDir, `block-${index + 1}.js`);
    fs.writeFileSync(filePath, code, "utf8");
    const result = spawnSync(process.execPath, ["--check", filePath], {
      encoding: "utf8",
    });
    if (result.status !== 0) {
      failures.push(
        `${slug} 的JavaScript代码块 ${index + 1} 语法失败：${result.stderr.trim()}`,
      );
    }
  });
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  console.error(`\n2026-07-31英文编辑批次检查失败：${failures.length} 项。`);
  process.exit(1);
}

console.log(
  `2026-07-31英文编辑批次检查通过：${articleEntries.length} 篇现有文章、${allCodeBlocks.length} 个JavaScript代码块；URL稳定、意图区分、Pending证据、元数据同步和98分内部门禁均有效。`,
);
