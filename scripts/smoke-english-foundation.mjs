const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

const articles = [
  {
    path: "/en/blog/screeps-memory-basics",
    chinesePath: "/blog/screeps-memory-basics",
    headline: "How Screeps Memory Saves Creep Roles and Working State",
    verification: [
      "Chinese source article",
      "Reviewed in full",
      "JavaScript syntax",
      "Passed",
      "Screeps Console test",
      "Pending",
    ],
  },
  {
    path: "/en/blog/screeps-withdraw-container-energy",
    chinesePath: "/blog/screeps-creep-withdraw-container-energy",
    headline: "How to Make a Screeps Creep Withdraw Energy from a Container",
    verification: [
      "Chinese source article",
      "Reviewed in full",
      "JavaScript syntax",
      "Passed",
      "Screeps Console test",
      "Pending",
    ],
  },
  {
    path: "/en/blog/screeps-pickup-dropped-energy",
    chinesePath: "/blog/screeps-creep-pickup-dropped-energy",
    headline: "How to Make a Screeps Creep Pick Up Dropped Energy",
    verification: [
      "Chinese source article",
      "Reviewed in full",
      "JavaScript syntax",
      "Passed",
      "Live decay and competition test",
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
  console.error(`\n英文专题生产冒烟测试失败：${failures.length} 项。`);
  process.exit(1);
}

console.log(
  `英文专题生产冒烟测试通过：${articles.length} 篇文章、目录、Verification、Canonical、hreflang、文章目录与 Sitemap。`,
);
