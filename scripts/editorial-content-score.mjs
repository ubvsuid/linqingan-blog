import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const prohibitedPhrases = [
  "In today's fast-paced world",
  "In this comprehensive guide",
  "Whether you are a beginner or an expert",
  "Let's dive in",
  "Delve into",
  "Unlock the power of",
  "Seamlessly",
  "Game-changing",
  "It is important to note that",
  "By following these steps",
];

function decodeHtmlEntities(value) {
  return value
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

export function extractJavaScriptBlocks(html) {
  return [...html.matchAll(
    /<pre><code class="language-javascript">([\s\S]*?)<\/code><\/pre>/g,
  )].map((match) => decodeHtmlEntities(match[1]));
}

export function checkJavaScriptBlocks({
  articleKey,
  html,
  tempDirectory,
  addFailure,
}) {
  const codeBlocks = extractJavaScriptBlocks(html);
  let codeSyntaxPassed = true;

  for (const [index, code] of codeBlocks.entries()) {
    const filePath = path.join(
      tempDirectory,
      `${articleKey}-${index + 1}.js`,
    );
    fs.writeFileSync(filePath, code, "utf8");
    const check = spawnSync(
      process.execPath,
      ["--check", filePath],
      { encoding: "utf8" },
    );

    if (check.status !== 0) {
      codeSyntaxPassed = false;
      addFailure(
        `${articleKey}: JavaScript block ${index + 1} failed syntax check\n${check.stderr}`,
      );
    }
  }

  return { codeBlocks, codeSyntaxPassed };
}

function containsEvery(value, signals) {
  return signals.every((signal) => value.includes(signal));
}

function scoreDimension(name, checks, articleKey, addFailure) {
  let total = 0;

  for (const [points, passed, label] of checks) {
    if (passed) {
      total += points;
    } else {
      addFailure(`${articleKey}: ${name} rubric failed — ${label}`);
    }
  }

  return total;
}

export function scoreEditorialArticle({
  articleKey,
  article,
  expected,
  codeBlocks,
  codeSyntaxPassed,
  registrySynchronized,
  offlinePassed,
  addFailure,
}) {
  const tocIds = article.toc.map(([id]) => id);
  const headingIds = new Set(
    [...article.articleHtml.matchAll(/<h[23] id="([^"]+)"/g)]
      .map((match) => match[1]),
  );
  const verification = new Map(article.verification);
  const html = article.articleHtml;
  const allTocHeadingsPresent = tocIds.every((id) => headingIds.has(id));
  const noEmptyLinks = !/<a(?:\s[^>]*)?>\s*<\/a>|href=""/i.test(html);
  const noProhibitedPhrase = prohibitedPhrases.every(
    (phrase) => !html.includes(phrase),
  );
  const evidencePending =
    verification.get("Screeps Console test") === "Pending"
    && verification.get("Live multi-tick verification") === "Pending"
    && verification.get("Genuine room or Console screenshots") === "Pending";
  const hasPolicyBoundary =
    [...verification.keys()].some(
      (label) => label.toLowerCase().includes("policy boundary"),
    )
    || (expected.policyBoundarySignals ?? []).some(
      (signal) => html.includes(signal),
    );
  const hasIntentHandoff =
    html.includes('id="choose-another-guide"')
    || containsEvery(
      html,
      expected.intentHandoffSignals ?? [],
    );

  const score = {
    technical: scoreDimension("technical", [
      [5, containsEvery(html, expected.signals), "required technical signals"],
      [4, containsEvery(html, expected.identitySignals), "exact operation identity"],
      [4, codeBlocks.length >= expected.minCodeBlocks, "executable example count"],
      [3, codeSyntaxPassed, "JavaScript syntax"],
      [3, html.includes("https://docs.screeps.com/"), "official Screeps sources"],
      [2, html.includes("ERR_"), "return-code boundaries"],
      [
        2,
        html.includes("pending")
          && html.includes("submittedAt")
          && html.includes("Game.time"),
        "current-tick and later-tick lifecycle",
      ],
    ], articleKey, addFailure),
    intent: scoreDimension("intent", [
      [4, article.title === expected.title, "title"],
      [3, article.headline === expected.headline, "headline"],
      [
        3,
        typeof article.searchIntent === "string"
          && article.searchIntent.length >= 60,
        "specific search intent",
      ],
      [3, article.toc[0]?.[0] === "use-this-guide", "first intent section"],
      [3, html.includes('id="use-this-guide"'), "visible use-case section"],
      [2, Array.isArray(article.faq) && article.faq.length === 0, "no synthetic FAQ"],
    ], articleKey, addFailure),
    original: scoreDimension("original", [
      [4, containsEvery(html, expected.originalSignals), "batch-specific implementation"],
      [3, containsEvery(html, expected.stateSignals), "explicit failure states"],
      [
        3,
        html.includes('id="production-notes"')
          || html.includes('id="production-adaptation"'),
        "production adaptation",
      ],
      [2, hasPolicyBoundary, "project-policy boundary"],
      [2, offlinePassed, "offline boundary cases"],
    ], articleKey, addFailure),
    english: scoreDimension("english", [
      [4, noProhibitedPhrase, "prohibited generic phrasing"],
      [
        3,
        typeof article.description === "string"
          && article.description.length >= 90
          && article.description.length <= 240,
        "specific description length",
      ],
      [
        3,
        !html.includes('<h2 id="faq">')
          && Array.isArray(article.faq)
          && article.faq.length === 0,
        "mechanical FAQ removal",
      ],
      [
        2,
        new Set(article.toc.map(([, label]) => label)).size
          === article.toc.length,
        "unique section labels",
      ],
    ], articleKey, addFailure),
    structure: scoreDimension("structure", [
      [
        3,
        article.toc.length >= 10
          && new Set(tocIds).size === tocIds.length,
        "unique TOC",
      ],
      [2, allTocHeadingsPresent, "TOC and heading alignment"],
      [2, codeBlocks.length >= expected.minCodeBlocks, "code distribution"],
      [
        2,
        (
          html.includes('id="return-codes"')
          || html.includes('id="failure-states"')
        )
          && html.includes('id="official-docs"'),
        "failure and source sections",
      ],
      [1, hasIntentHandoff, "intent handoff"],
    ], articleKey, addFailure),
    evidence: scoreDimension("evidence", [
      [3, evidencePending, "honest Pending evidence"],
      [2, html.includes("https://docs.screeps.com/"), "official documentation"],
      [2, containsEvery(html, expected.identitySignals), "actor-target identity"],
      [
        1,
        Array.isArray(article.verification)
          && article.verification.length >= 8,
        "visible verification table",
      ],
    ], articleKey, addFailure),
    seo: scoreDimension("seo", [
      [
        2,
        article.primaryKeyword === expected.primaryKeyword
          && (
            article.title.toLowerCase().includes(
              expected.primaryKeyword.split(" ")[1].toLowerCase(),
            )
            || article.description.toLowerCase().includes(
              expected.primaryKeyword.split(" ")[1].toLowerCase(),
            )
          ),
        "primary keyword alignment",
      ],
      [
        2,
        Array.isArray(article.keywords) && article.keywords.length >= 5,
        "keyword coverage",
      ],
      [2, registrySynchronized, "registry synchronization"],
      [
        2,
        article.title.length >= 35
          && article.description.length >= 90
          && article.searchIntent.length >= 60,
        "metadata specificity",
      ],
    ], articleKey, addFailure),
    accessibility: scoreDimension("accessibility", [
      [2, allTocHeadingsPresent, "navigable heading IDs"],
      [1, html.includes('<div class="table-scroll"><table>'), "scrollable tables"],
      [1, noEmptyLinks, "non-empty links"],
      [
        1,
        codeBlocks.length > 0
          && html.includes('<code class="language-javascript">'),
        "labeled code blocks",
      ],
    ], articleKey, addFailure),
  };

  return {
    ...score,
    total: Object.values(score).reduce((sum, value) => sum + value, 0),
  };
}
