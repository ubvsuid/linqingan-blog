const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

const pages = [
  {
    pathname: "/tools",
    title: "计算、诊断与规划工具",
    structuredType: "CollectionPage",
    canonical: "https://www.linqingan.com/tools",
    alternate: "https://www.linqingan.com/en/tools",
  },
  {
    pathname: "/tools/market-terminal-cost-calculator",
    title: "Market 与 Terminal 成本计算器",
    structuredType: "SoftwareApplication",
    canonical: "https://www.linqingan.com/tools/market-terminal-cost-calculator",
    alternate: "https://www.linqingan.com/en/tools/market-terminal-cost-calculator",
  },
  {
    pathname: "/tools/controller-downgrade-planner",
    title: "Controller 降级与 Upgrader 规划器",
    structuredType: "SoftwareApplication",
    canonical: "https://www.linqingan.com/tools/controller-downgrade-planner",
    alternate: "https://www.linqingan.com/en/tools/controller-downgrade-planner",
  },
  {
    pathname: "/tools/lab-reaction-boost-planner",
    title: "Lab 反应与 Boost 规划器",
    structuredType: "SoftwareApplication",
    canonical: "https://www.linqingan.com/tools/lab-reaction-boost-planner",
    alternate: "https://www.linqingan.com/en/tools/lab-reaction-boost-planner",
  },
  {
    pathname: "/en/tools",
    title: "Calculate, diagnose, and plan safely",
    structuredType: "CollectionPage",
    canonical: "https://www.linqingan.com/en/tools",
    alternate: "https://www.linqingan.com/tools",
  },
  {
    pathname: "/en/tools/market-terminal-cost-calculator",
    title: "Market and Terminal Cost Calculator",
    structuredType: "SoftwareApplication",
    canonical: "https://www.linqingan.com/en/tools/market-terminal-cost-calculator",
    alternate: "https://www.linqingan.com/tools/market-terminal-cost-calculator",
  },
  {
    pathname: "/en/tools/controller-downgrade-planner",
    title: "Controller Downgrade and Upgrader Planner",
    structuredType: "SoftwareApplication",
    canonical: "https://www.linqingan.com/en/tools/controller-downgrade-planner",
    alternate: "https://www.linqingan.com/tools/controller-downgrade-planner",
  },
  {
    pathname: "/en/tools/lab-reaction-boost-planner",
    title: "Lab Reaction and Boost Planner",
    structuredType: "SoftwareApplication",
    canonical: "https://www.linqingan.com/en/tools/lab-reaction-boost-planner",
    alternate: "https://www.linqingan.com/tools/lab-reaction-boost-planner",
  },
];

const failures = [];

for (const page of pages) {
  const response = await fetch(`${baseUrl}${page.pathname}`);
  const body = await response.text();

  if (response.status !== 200) {
    failures.push(`${page.pathname}: expected 200, received ${response.status}`);
    continue;
  }
  if (!body.includes(page.title)) failures.push(`${page.pathname}: missing visible title ${page.title}`);
  if (!body.includes(`\"@type\":\"${page.structuredType}\"`)) failures.push(`${page.pathname}: missing ${page.structuredType} structured data`);
  if (!body.includes(`rel=\"canonical\" href=\"${page.canonical}\"`)) failures.push(`${page.pathname}: canonical mismatch`);
  if (!body.includes(page.alternate)) failures.push(`${page.pathname}: missing bilingual alternate URL`);
  if (/name=\"robots\" content=\"[^\"]*noindex/i.test(body)) failures.push(`${page.pathname}: public tool must remain indexable`);
}

const [chineseSitemap, englishSitemap] = await Promise.all([
  fetch(`${baseUrl}/sitemap-zh.xml`).then((response) => response.text()),
  fetch(`${baseUrl}/sitemap-en.xml`).then((response) => response.text()),
]);

for (const pathname of [
  "/tools",
  "/tools/market-terminal-cost-calculator",
  "/tools/controller-downgrade-planner",
  "/tools/lab-reaction-boost-planner",
]) {
  if (!chineseSitemap.includes(`https://www.linqingan.com${pathname}`)) failures.push(`${pathname}: missing from Chinese Sitemap`);
}

for (const pathname of [
  "/en/tools",
  "/en/tools/market-terminal-cost-calculator",
  "/en/tools/controller-downgrade-planner",
  "/en/tools/lab-reaction-boost-planner",
]) {
  if (!englishSitemap.includes(`https://www.linqingan.com${pathname}`)) failures.push(`${pathname}: missing from English Sitemap`);
}

const [chineseSearch, englishSearch] = await Promise.all([
  fetch(`${baseUrl}/search?q=Terminal`).then((response) => response.text()),
  fetch(`${baseUrl}/en/search?q=Terminal`).then((response) => response.text()),
]);

if (!chineseSearch.includes("/tools/market-terminal-cost-calculator")) failures.push("Chinese search does not expose the Market and Terminal tool");
if (!englishSearch.includes("/en/tools/market-terminal-cost-calculator")) failures.push("English search does not expose the Market and Terminal tool");

if (failures.length > 0) {
  for (const failure of failures) console.error(`ERROR: ${failure}`);
  console.error(`Planning tool smoke test failed: ${failures.length} issue(s).`);
  process.exit(1);
}

console.log(`Planning tool smoke test passed: ${pages.length} bilingual tool and hub pages validated.`);
