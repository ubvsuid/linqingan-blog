const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

const articles = [
  {
    path: "/en/blog/screeps-lab-run-reaction",
    chinesePath: "/blog/screeps-lab-run-reaction",
    headline:
      "Run One Lab Reaction Without Guessing Which Store Change Was Yours",
    seoTitle:
      "Screeps runReaction(): Verify One Owned Lab Reaction",
    query: "runReaction",
    modifiedDate: "2026-08-14",
    signals: [
      "exclusiveWindow",
      "verified-exact-reaction",
      "state-changed-ambiguous",
      "inputADelta",
      "inputBDelta",
      "Live shared-input, exclusive-window and exact three-Store delta test",
    ],
  },
  {
    path: "/en/blog/screeps-lab-boost-creep",
    chinesePath: "/blog/screeps-lab-boost-creep",
    headline:
      "Boost One Creep and Prove Which Body Parts Changed",
    seoTitle:
      "Screeps boostCreep(): Verify Exact Body Part Changes",
    query: "boostCreep",
    modifiedDate: "2026-08-14",
    signals: [
      "request.creepId",
      "expectedIndexes",
      "verified-exact-boost",
      "ERR_NOT_FOUND",
      "body-identity-mismatch",
      "Live Creep replacement, part-order, exclusive-window and Lab Store delta test",
    ],
  },
  {
    path: "/en/blog/screeps-factory-produce",
    chinesePath: "/blog/screeps-factory-produce",
    headline:
      "Produce One Commodity Without Confusing Hauling with Production",
    seoTitle:
      "Screeps Factory.produce(): Verify One Production Batch",
    query: "Factory.produce",
    modifiedDate: "2026-08-01",
    signals: [
      "permanent-level-mismatch",
      "operate-effect-missing",
      "verified-exact-batch",
      "componentDeltas",
      "ERR_BUSY",
      "Live level assignment, effect expiry, exclusive hauling and exact batch delta test",
    ],
  },
];

const failures = [];

for (const article of articles) {
  const response = await fetch(
    `${baseUrl}${article.path}`,
    { redirect: "manual" },
  );
  const body = await response.text();

  if (response.status !== 200) {
    failures.push(
      `${article.path}: expected 200, received ${response.status}`,
    );
    continue;
  }

  const canonical =
    `https://www.linqingan.com${article.path}`;
  const chinese =
    `https://www.linqingan.com${article.chinesePath}`;

  for (const expected of [
    article.headline,
    article.seoTitle,
    "Verification status",
    "Screeps Console test",
    "Live multi-tick verification",
    "Pending",
    ...article.signals,
    `rel="canonical" href="${canonical}"`,
    `rel="alternate" hrefLang="en" href="${canonical}"`,
    `rel="alternate" hrefLang="zh-CN" href="${chinese}"`,
    `rel="alternate" hrefLang="x-default" href="${canonical}"`,
    `href="#use-this-guide"`,
    `<h2 id="use-this-guide">Use this guide when</h2>`,
    `"@type":"BlogPosting"`,
    `"dateModified":"${article.modifiedDate}"`,
  ]) {
    if (!body.includes(expected)) {
      failures.push(
        `${article.path}: missing “${expected}”`,
      );
    }
  }

  for (const prohibited of [
    `"@type":"FAQPage"`,
    `href="#quick-answer"`,
    `<h2 id="faq">`,
  ]) {
    if (body.includes(prohibited)) {
      failures.push(
        `${article.path}: still contains “${prohibited}”`,
      );
    }
  }

  const searchResponse = await fetch(
    `${baseUrl}/en/search?q=${encodeURIComponent(
      article.query,
    )}`,
    { redirect: "manual" },
  );
  const searchBody = await searchResponse.text();

  if (searchResponse.status !== 200) {
    failures.push(
      `/en/search?q=${article.query}: received ${searchResponse.status}`,
    );
  } else if (!searchBody.includes(article.seoTitle)) {
    failures.push(
      `/en/search?q=${article.query}: missing “${article.seoTitle}”`,
    );
  }
}

const blogResponse = await fetch(
  `${baseUrl}/en/blog-index.json`,
  { redirect: "manual" },
);
const blogBody = await blogResponse.text();

if (blogResponse.status !== 200) {
  failures.push(
    `/en/blog-index.json: received ${blogResponse.status}`,
  );
} else {
  for (const article of articles) {
    if (!blogBody.includes(article.seoTitle)) {
      failures.push(
        `/en/blog-index.json: missing “${article.seoTitle}”`,
      );
    }
  }
}

const sitemapResponse = await fetch(
  `${baseUrl}/sitemap.xml`,
  { redirect: "manual" },
);
const sitemapBody = await sitemapResponse.text();

if (sitemapResponse.status !== 200) {
  failures.push(
    `/sitemap.xml: received ${sitemapResponse.status}`,
  );
} else {
  for (const article of articles) {
    const expected =
      `https://www.linqingan.com${article.path}`;
    if (!sitemapBody.includes(expected)) {
      failures.push(
        `/sitemap.xml: missing ${expected}`,
      );
    }
  }
}

if (failures.length > 0) {
  failures.forEach((failure) =>
    console.error(`ERROR: ${failure}`),
  );
  console.error(
    `\nDeep Lab and Factory production smoke failed: ${failures.length} issue(s).`,
  );
  process.exit(1);
}

console.log(
  "Deep Lab and Factory production smoke passed: 3 existing pages, exact reaction/boost/factory signatures, Pending live evidence, Canonical, hreflang, BlogPosting, search, and Sitemap.",
);