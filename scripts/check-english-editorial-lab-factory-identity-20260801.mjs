import { execFileSync } from "node:child_process";
import {
  readFileSync,
  writeFileSync,
  unlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";

const root = process.cwd();
const overridePath =
  "src/lib/english-editorial-lab-factory-identity-overrides-20260801.ts";
const overrideSource = readFileSync(
  join(root, overridePath),
  "utf8",
);
const publication = readFileSync(
  join(
    root,
    "src/lib/english-editorial-published-20260731.ts",
  ),
  "utf8",
);
const registry = readFileSync(
  join(root, "src/lib/english-lab-factory-registry-11.ts"),
  "utf8",
);
const smoke = readFileSync(
  join(root, "scripts/smoke-english-lab-factory-11.mjs"),
  "utf8",
);
const packageJson = readFileSync(
  join(root, "package.json"),
  "utf8",
);
const audit = readFileSync(
  join(
    root,
    "docs/english-editorial-lab-factory-identity-batch-20260801.md",
  ),
  "utf8",
);

const encodedMatch = overrideSource.match(
  /const encodedEditorialOverrides = "([A-Za-z0-9+/=]+)";/,
);
if (!encodedMatch) {
  console.error(
    "ERROR: Encoded Lab and Factory editorial payload is missing",
  );
  process.exit(1);
}

const articles = JSON.parse(
  gunzipSync(
    Buffer.from(encodedMatch[1], "base64"),
  ).toString("utf8"),
);

const expected = {
  "screeps-lab-run-reaction": {
    path: "/en/blog/screeps-lab-run-reaction",
    chinesePath: "/blog/screeps-lab-run-reaction",
    publishedAt: "2026-07-26",
    title:
      "Screeps runReaction(): Verify One Owned Lab Reaction",
    headline:
      "Run One Lab Reaction Without Guessing Which Store Change Was Yours",
    readingTime: "14 min read",
    signals: [
      "inputADelta",
      "inputBDelta",
      "verified-exact-reaction",
      "state-changed-ambiguous",
      "exclusiveWindow",
    ],
  },
  "screeps-lab-boost-creep": {
    path: "/en/blog/screeps-lab-boost-creep",
    chinesePath: "/blog/screeps-lab-boost-creep",
    publishedAt: "2026-07-26",
    title:
      "Screeps boostCreep(): Verify Exact Body Part Changes",
    headline:
      "Boost One Creep and Prove Which Body Parts Changed",
    readingTime: "14 min read",
    signals: [
      "request.creepId",
      "expectedIndexes",
      "verified-exact-boost",
      "body-identity-mismatch",
      "ERR_NOT_FOUND",
    ],
  },
  "screeps-factory-produce": {
    path: "/en/blog/screeps-factory-produce",
    chinesePath: "/blog/screeps-factory-produce",
    publishedAt: "2026-07-26",
    title:
      "Screeps Factory.produce(): Verify One Production Batch",
    headline:
      "Produce One Commodity Without Confusing Hauling with Production",
    readingTime: "15 min read",
    signals: [
      "permanent-level-mismatch",
      "operate-effect-missing",
      "componentDeltas",
      "verified-exact-batch",
      "ERR_BUSY",
    ],
  },
};

const scorecard = {
  technical: 23,
  intent: 18,
  original: 14,
  english: 12,
  structure: 10,
  evidence: 8,
  seo: 8,
  accessibility: 5,
};
const finalScore = Object.values(scorecard).reduce(
  (sum, value) => sum + value,
  0,
);

const failures = [];
const articleMap = Object.fromEntries(
  articles.map((article) => [
    article.slug,
    article,
  ]),
);

if (
  articles.length !== 3
  || Object.keys(articleMap).length !== 3
) {
  failures.push(
    "Payload must contain exactly three unique articles",
  );
}

let tocCount = 0;
let javascriptCount = 0;

for (const [slug, rule] of Object.entries(expected)) {
  const article = articleMap[slug];

  if (!article) {
    failures.push(`${slug}: article missing`);
    continue;
  }

  for (const [field, expectedValue] of [
    ["path", rule.path],
    ["chinesePath", rule.chinesePath],
    ["publishedAt", rule.publishedAt],
    ["title", rule.title],
    ["headline", rule.headline],
    ["readingTime", rule.readingTime],
  ]) {
    if (article[field] !== expectedValue) {
      failures.push(
        `${slug}: ${field} changed or is unsynchronized`,
      );
    }
  }

  if (article.finalScore !== finalScore) {
    failures.push(
      `${slug}: final score must remain ${finalScore}`,
    );
  }

  if (
    !Array.isArray(article.faq)
    || article.faq.length !== 0
  ) {
    failures.push(`${slug}: FAQ data must be empty`);
  }

  if (
    !Array.isArray(article.toc)
    || article.toc.length < 10
  ) {
    failures.push(`${slug}: TOC is too thin`);
  } else {
    tocCount += article.toc.length;
  }

  const ids = [
    ...article.articleHtml.matchAll(
      /<h2 id="([^"]+)">/g,
    ),
  ].map((match) => match[1]);

  for (const [id] of article.toc) {
    if (!ids.includes(id)) {
      failures.push(
        `${slug}: TOC target #${id} is missing`,
      );
    }
  }

  for (const signal of rule.signals) {
    if (!article.articleHtml.includes(signal)) {
      failures.push(
        `${slug}: technical signal “${signal}” missing`,
      );
    }
  }

  for (const prohibited of [
    "<h2 id=\"quick-answer\">",
    "<h2 id=\"faq\">",
    "Frequently asked questions",
    "FAQPage",
    "In conclusion",
    "delve",
    "game-changer",
  ]) {
    if (article.articleHtml.includes(prohibited)) {
      failures.push(
        `${slug}: prohibited phrase “${prohibited}”`,
      );
    }
  }

  if (!article.articleHtml.includes("https://docs.screeps.com/")) {
    failures.push(
      `${slug}: official Screeps source missing`,
    );
  }

  const verification = Object.fromEntries(
    article.verification,
  );
  if (
    verification["Screeps Console test"]
      !== "Pending"
    || verification[
      "Live multi-tick verification"
    ] !== "Pending"
  ) {
    failures.push(
      `${slug}: live evidence must remain Pending`,
    );
  }

  const blocks = [
    ...article.articleHtml.matchAll(
      /<pre><code class="language-javascript">([\s\S]*?)<\/code><\/pre>/g,
    ),
  ];

  javascriptCount += blocks.length;

  for (const [index, match] of blocks.entries()) {
    const path = join(
      tmpdir(),
      `lab-factory-${slug}-${index}.js`,
    );
    writeFileSync(path, match[1], "utf8");

    try {
      execFileSync("node", ["--check", path], {
        stdio: "pipe",
      });
    } catch {
      failures.push(
        `${slug}: JavaScript block ${index + 1} failed node --check`,
      );
    } finally {
      unlinkSync(path);
    }
  }
}

if (tocCount !== 35) {
  failures.push(
    `Expected 35 TOC anchors, received ${tocCount}`,
  );
}

if (javascriptCount !== 17) {
  failures.push(
    `Expected 17 JavaScript blocks, received ${javascriptCount}`,
  );
}

for (const required of [
  "englishEditorialLabFactoryIdentityOverrides20260801",
  "./english-editorial-lab-factory-identity-overrides-20260801",
]) {
  if (!publication.includes(required)) {
    failures.push(
      `Publication integration missing “${required}”`,
    );
  }
}

for (const [slug, rule] of Object.entries(expected)) {
  for (const required of [
    rule.path,
    rule.chinesePath,
    rule.title,
    rule.readingTime,
    'updatedAt: "2026-08-01"',
    "finalScore: 98",
  ]) {
    if (!registry.includes(required)) {
      failures.push(
        `Registry missing ${slug} value “${required}”`,
      );
    }
  }

  if (!smoke.includes(rule.title)) {
    failures.push(
      `Production smoke missing ${slug} title`,
    );
  }
}

for (const required of [
  "englisheditoriallabfactoryidentity20260801check",
  "check-english-editorial-lab-factory-identity-20260801.mjs",
]) {
  if (!packageJson.includes(required)) {
    failures.push(
      `package.json integration missing “${required}”`,
    );
  }
}

for (const required of [
  "project-internal editorial scores",
  "not Google scores",
  "17 JavaScript blocks",
  "35 table-of-contents anchors",
  "real Screeps Console execution",
  "live multi-tick verification",
]) {
  if (!audit.includes(required)) {
    failures.push(
      `Audit record missing “${required}”`,
    );
  }
}

if (failures.length > 0) {
  failures.forEach((failure) =>
    console.error(`ERROR: ${failure}`),
  );
  console.error(
    `\nLab and Factory editorial gate failed: ${failures.length} issue(s).`,
  );
  process.exit(1);
}

console.log(
  `Lab and Factory editorial gate passed: 3 existing pages, ${javascriptCount} JavaScript blocks, ${tocCount} TOC anchors, exact operation identity, Pending live evidence, and ${finalScore}-point internal scores.`,
);
