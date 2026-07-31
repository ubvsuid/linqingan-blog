const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

const articles = [
  {
    path: "/en/blog/screeps-room-visibility",
    chinesePath: "/blog/screeps-room-visibility",
    headline: "Why Is Game.rooms[roomName] Undefined in Screeps?",
    listingTitle: "Why Is Game.rooms[roomName] Undefined in Screeps?",
    query: "Game.rooms",
    tocId: "quick-answer",
    tocHeading: "Quick answer",
    faqExpected: true,
    modifiedExpected: false,
    signals: [
      "Memory.rooms is not a live Room object",
      "status: 'room-not-visible'",
      "Live multi-tick visibility test",
      "Pending",
    ],
  },
  {
    path: "/en/blog/screeps-observer-observe-room",
    chinesePath: "/blog/screeps-observer-observe-room",
    headline:
      "Stop Multiple Observer Calls From Overwriting the Request You Track",
    listingTitle:
      "Screeps Observer: Coordinate One Final observeRoom() Call",
    query: "Observer",
    tocId: "use-this-guide",
    tocHeading: "Use this guide when",
    faqExpected: false,
    modifiedExpected: true,
    signals: [
      "createObservationPlan",
      "selectObservationRequest",
      "submitObservationPlan",
      "queued-in-plan",
      "Live multi-tick verification",
      "Pending",
    ],
  },
  {
    path: "/en/blog/screeps-pathfinder-costmatrix",
    chinesePath: "/blog/screeps-pathfinder-costmatrix",
    headline:
      "Build a CostMatrix Without Hiding the Real Path Failure",
    listingTitle:
      "Screeps CostMatrix: Static Costs, Traffic, and Incomplete Paths",
    query: "CostMatrix",
    tocId: "use-this-guide",
    tocHeading: "Use this guide when",
    faqExpected: false,
    modifiedExpected: true,
    signals: [
      "STRUCTURE_PORTAL",
      "staticCosts.clone()",
      "Math.max(current, 10)",
      "if (search.incomplete)",
      "return undefined",
      "Live multi-tick verification",
      "Pending",
    ],
  },
];

const failures = [];

for (const article of articles) {
  const response = await fetch(`${baseUrl}${article.path}`, {
    redirect: "manual",
  });
  const body = await response.text();

  if (response.status !== 200) {
    failures.push(`${article.path}: 预期 200，实际 ${response.status}`);
    continue;
  }

  const canonical = `https://www.linqingan.com${article.path}`;
  const chinese = `https://www.linqingan.com${article.chinesePath}`;

  for (const expected of [
    article.headline,
    "Verification status",
    "Chinese source article",
    "Reviewed in full",
    "Screeps Console test",
    ...article.signals,
    `rel="canonical" href="${canonical}"`,
    `rel="alternate" hrefLang="en" href="${canonical}"`,
    `rel="alternate" hrefLang="zh-CN" href="${chinese}"`,
    `rel="alternate" hrefLang="x-default" href="${canonical}"`,
    `href="#${article.tocId}"`,
    `<h2 id="${article.tocId}">${article.tocHeading}</h2>`,
    `"@type":"BlogPosting"`,
  ]) {
    if (!body.includes(expected)) {
      failures.push(`${article.path}: 缺少 “${expected}”`);
    }
  }

  if (
    body.includes(`"@type":"FAQPage"`)
    !== article.faqExpected
  ) {
    failures.push(`${article.path}: FAQPage expectation mismatch`);
  }

  if (
    article.modifiedExpected
    && !body.includes(`"dateModified":"2026-07-31"`)
  ) {
    failures.push(`${article.path}: 缺少 2026-07-31 dateModified`);
  }

  const searchResponse = await fetch(
    `${baseUrl}/en/search?q=${encodeURIComponent(article.query)}`,
    { redirect: "manual" },
  );
  const searchBody = await searchResponse.text();

  if (searchResponse.status !== 200) {
    failures.push(
      `/en/search?q=${article.query}: 实际 ${searchResponse.status}`,
    );
  } else if (!searchBody.includes(article.listingTitle)) {
    failures.push(
      `/en/search?q=${article.query}: 缺少 “${article.listingTitle}”`,
    );
  }
}

const observerBody = await (
  await fetch(
    `${baseUrl}/en/blog/screeps-observer-observe-room`,
  )
).text();

for (const expected of [
  "createObservationPlan",
  "selectObservationRequest",
  "submitObservationPlan",
  "plan.observerId !== observer.id",
  "if (result === OK)",
  "requested-last-tick-visible-now",
]) {
  if (!observerBody.includes(expected)) {
    failures.push(`Observer 页面缺少 “${expected}”`);
  }
}

if (
  observerBody.includes(
    "Memory.observerState = {\n      requestedRoom",
  )
) {
  failures.push(
    "Observer 页面仍可能在最终协调之前写入请求状态",
  );
}

const matrixBody = await (
  await fetch(
    `${baseUrl}/en/blog/screeps-pathfinder-costmatrix`,
  )
).text();

if (
  !matrixBody.includes("current < 255")
  || !matrixBody.includes("Math.max(current, 10)")
) {
  failures.push("CostMatrix 页面缺少保留硬障碍的软交通层");
}

if (
  matrixBody.includes("other.id !== movingCreepId")
  && matrixBody.includes("255\n      );")
) {
  failures.push(
    "CostMatrix 页面可能仍把所有当前 Creep 作为硬障碍",
  );
}

const blogResponse = await fetch(
  `${baseUrl}/en/blog-index.json`,
  { redirect: "manual" },
);
const blogBody = await blogResponse.text();

if (blogResponse.status !== 200) {
  failures.push(
    `/en/blog-index.json: 预期 200，实际 ${blogResponse.status}`,
  );
} else {
  for (const article of articles) {
    if (!blogBody.includes(article.listingTitle)) {
      failures.push(
        `/en/blog-index.json: 缺少 “${article.listingTitle}”`,
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
    `/sitemap.xml: 预期 200，实际 ${sitemapResponse.status}`,
  );
} else {
  for (const article of articles) {
    const expected =
      `https://www.linqingan.com${article.path}`;
    if (!sitemapBody.includes(expected)) {
      failures.push(`/sitemap.xml: 缺少 ${expected}`);
    }
  }
}

if (failures.length > 0) {
  failures.forEach((failure) =>
    console.error(`ERROR: ${failure}`),
  );
  console.error(
    `\n第七批英文视野与寻路生产冒烟测试失败：`
      + `${failures.length} 项。`,
  );
  process.exit(1);
}

console.log(
  "第七批英文视野与寻路生产冒烟测试通过："
    + "3 篇文章、Observer 单次最终提交、CostMatrix 工作流、"
    + "Verification、Canonical、hreflang、JSON-LD、"
    + "目录、搜索与 Sitemap。",
);
