const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

const articles = [
  {
    path: "/en/blog/screeps-renew-creep",
    chinesePath: "/blog/screeps-spawn-renew-creep",
    headline: "Renew a Creep Without Hiding Spawn Contention or Boost Loss",
    indexTitle: "Screeps renewCreep(): Coordinate Spawn Time and Verify TTL Gain",
    query: "renewCreep verification",
    tocId: "evidence-contract",
    tocHeading: "Start with the missing event",
    expectFaq: false,
    verification: [
      "Official engine",
      "Formula boundary",
      "Static code review",
      "Screeps Console test",
      "Pending",
    ],
    signals: [
      "createRenewalDispatcher",
      "usedSpawnIds",
      "usedCreepIds",
      "Memory.pendingRenewals",
      "expectedAddedTicks",
      "renewal-ttl-signature-mismatch",
      "renewal-observed-energy-confounded",
      "Live renewal, Boost removal, dual-Spawn contention and Energy-transfer verification",
    ],
  },
  {
    path: "/en/blog/screeps-recycle-creep",
    chinesePath: "/blog/screeps-spawn-recycle-creep",
    headline: "How to Recycle a Creep Safely in Screeps",
    indexTitle: "How to Recycle a Creep Safely in Screeps",
    query: "recycleCreep",
    tocId: "quick-answer",
    tocHeading: "Quick answer",
    expectFaq: true,
    verification: [
      "Chinese source article",
      "Reviewed in full",
      "Return boundary",
      "Up to 100% by remaining life; Energy capped at 125 per body part",
      "API distinction",
      "Current recycleCreep() docs do not require an idle Spawn or list ERR_BUSY",
      "Live recycling and resource-drop test",
      "Pending",
    ],
    signals: [
      "request.enabled = false",
      "request.enabled = true",
      "spawn.recycleCreep(creep)",
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

  for (const expected of [
    article.headline,
    ...article.verification,
    ...article.signals,
  ]) {
    if (!body.includes(expected)) {
      failures.push(`${article.path}: 缺少预期内容 “${expected}”`);
    }
  }

  const canonical = `https://www.linqingan.com${article.path}`;
  const chinese = `https://www.linqingan.com${article.chinesePath}`;

  for (const expected of [
    `rel="canonical" href="${canonical}"`,
    `rel="alternate" hrefLang="en" href="${canonical}"`,
    `rel="alternate" hrefLang="zh-CN" href="${chinese}"`,
    `rel="alternate" hrefLang="x-default" href="${canonical}"`,
    `href="#${article.tocId}"`,
    `<h2 id="${article.tocId}">${article.tocHeading}</h2>`,
    `"@type":"BlogPosting"`,
  ]) {
    if (!body.includes(expected)) {
      failures.push(`${article.path}: 缺少页面信号 “${expected}”`);
    }
  }

  if (body.includes(`"@type":"FAQPage"`) !== article.expectFaq) {
    failures.push(`${article.path}: FAQPage 预期不一致`);
  }

  const searchResponse = await fetch(
    `${baseUrl}/en/search?q=${encodeURIComponent(article.query)}`,
    { redirect: "manual" },
  );
  const searchBody = await searchResponse.text();
  if (searchResponse.status !== 200) {
    failures.push(`/en/search?q=${article.query}: 实际 ${searchResponse.status}`);
  } else if (!searchBody.includes(article.indexTitle)) {
    failures.push(`/en/search?q=${article.query}: 缺少 “${article.indexTitle}”`);
  }
}

const renewBody = await (await fetch(
  `${baseUrl}/en/blog/screeps-renew-creep`,
)).text();
for (const expected of [
  "creep.body.some(part => part.type === CLAIM)",
  "dispatcher.reserve(spawn, creep)",
  "Memory.pendingRenewals[creep.id]",
  "pending.before.ticksToLive",
  "pending.expectedAddedTicks",
  "event.event === EVENT_TRANSFER",
  "creep.memory.renewing = false",
  "does not create a Room event",
]) {
  if (!renewBody.includes(expected)) {
    failures.push(`/en/blog/screeps-renew-creep: 缺少续命证据边界 “${expected}”`);
  }
}

const recycleBody = await (await fetch(
  `${baseUrl}/en/blog/screeps-recycle-creep`,
)).text();
if (recycleBody.includes("if (spawn.spawning)")) {
  failures.push("/en/blog/screeps-recycle-creep: 错误套用了 Spawn 忙碌前置判断");
}
if (recycleBody.includes("creep.suicide();")) {
  failures.push("/en/blog/screeps-recycle-creep: 不应自动调用 creep.suicide()" );
}

const blogResponse = await fetch(`${baseUrl}/en/blog-index.json`, { redirect: "manual" });
const blogBody = await blogResponse.text();
if (blogResponse.status !== 200) {
  failures.push(`/en/blog-index.json: 预期 200，实际 ${blogResponse.status}`);
} else {
  for (const article of articles) {
    if (!blogBody.includes(article.indexTitle)) {
      failures.push(`/en/blog-index.json: 缺少文章 “${article.indexTitle}”`);
    }
  }
}

const sitemapResponse = await fetch(`${baseUrl}/sitemap.xml`, {
  redirect: "manual",
});
const sitemapBody = await sitemapResponse.text();
if (sitemapResponse.status !== 200) {
  failures.push(`/sitemap.xml: 预期 200，实际 ${sitemapResponse.status}`);
} else {
  for (const article of articles) {
    const expected = `https://www.linqingan.com${article.path}`;
    if (!sitemapBody.includes(expected)) {
      failures.push(`/sitemap.xml: 缺少 ${expected}`);
    }
  }
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`ERROR: ${failure}`);
  console.error(`\n第四批生命周期英文专题生产冒烟测试失败：${failures.length} 项。`);
  process.exit(1);
}

console.log(
  `第四批生命周期英文专题生产冒烟测试通过：${articles.length} 篇文章、续命精确TTL与Boost证据、回收安全边界、Verification、Canonical、hreflang、JSON-LD、目录、搜索与 Sitemap。`,
);
