const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

const articles = [
  {
    path: "/en/blog/screeps-renew-creep",
    chinesePath: "/blog/screeps-spawn-renew-creep",
    headline: "How to Use renewCreep() Safely in Screeps",
    verification: [
      "Chinese source article",
      "Reviewed in full",
      "Formula check",
      "TTL floor(600 / body size); Energy ceil(creep cost / 2.5 / body size)",
      "Safety boundary",
      "Renewal removes all Boosts and rejects Creeps with CLAIM parts",
      "Source correction",
      "Persistent renewing state keeps the mission active until targetTtl",
      "Screeps Console test",
      "Pending",
    ],
  },
  {
    path: "/en/blog/screeps-recycle-creep",
    chinesePath: "/blog/screeps-spawn-recycle-creep",
    headline: "How to Recycle a Creep Safely in Screeps",
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

  for (const expected of [article.headline, ...article.verification]) {
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
    `href="#quick-answer"`,
    `<h2 id="quick-answer">Quick answer</h2>`,
    `"@type":"BlogPosting"`,
    `"@type":"FAQPage"`,
  ]) {
    if (!body.includes(expected)) {
      failures.push(`${article.path}: 缺少页面信号 “${expected}”`);
    }
  }
}

const renewResponse = await fetch(`${baseUrl}/en/blog/screeps-renew-creep`);
const renewBody = await renewResponse.text();
for (const expected of [
  "creep.memory.renewing = true",
  "creep.memory.renewing = false",
  "renewMissionActive !== true",
  "a renewal mission must remember that it has started",
]) {
  if (!renewBody.includes(expected)) {
    failures.push(`/en/blog/screeps-renew-creep: 缺少续命状态修正 “${expected}”`);
  }
}

const recycleResponse = await fetch(`${baseUrl}/en/blog/screeps-recycle-creep`);
const recycleBody = await recycleResponse.text();
if (recycleBody.includes("if (spawn.spawning)")) {
  failures.push("/en/blog/screeps-recycle-creep: 错误套用了 Spawn 忙碌前置判断");
}
if (recycleBody.includes("creep.suicide();")) {
  failures.push("/en/blog/screeps-recycle-creep: 不应自动调用 creep.suicide()" );
}
for (const expected of [
  "request.enabled = false",
  "request.enabled = true",
  "spawn.recycleCreep(creep)",
]) {
  if (!recycleBody.includes(expected)) {
    failures.push(`/en/blog/screeps-recycle-creep: 缺少一次性请求流程 “${expected}”`);
  }
}

const blogResponse = await fetch(`${baseUrl}/en/blog`, { redirect: "manual" });
const blogBody = await blogResponse.text();
if (blogResponse.status !== 200) {
  failures.push(`/en/blog: 预期 200，实际 ${blogResponse.status}`);
} else {
  for (const article of articles) {
    if (!blogBody.includes(article.headline)) {
      failures.push(`/en/blog: 缺少新文章 “${article.headline}”`);
    }
  }
}

const searchResponse = await fetch(`${baseUrl}/en/search?q=creep`, {
  redirect: "manual",
});
const searchBody = await searchResponse.text();
if (searchResponse.status !== 200) {
  failures.push(`/en/search: 预期 200，实际 ${searchResponse.status}`);
} else {
  for (const article of articles) {
    if (!searchBody.includes(article.headline)) {
      failures.push(`/en/search: 缺少新文章 “${article.headline}”`);
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
  `第四批生命周期英文专题生产冒烟测试通过：${articles.length} 篇文章、续命状态修正、回收安全边界、Verification、Canonical、hreflang、JSON-LD、目录、搜索与 Sitemap。`,
);
