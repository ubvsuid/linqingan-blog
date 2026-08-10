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
    pathname: "/tools/spawn-queue-replacement-planner",
    title: "Spawn 队列与替换规划器",
    structuredType: "SoftwareApplication",
    canonical: "https://www.linqingan.com/tools/spawn-queue-replacement-planner",
    alternate: "https://www.linqingan.com/en/tools/spawn-queue-replacement-planner",
  },
  {
    pathname: "/tools/hauling-throughput-planner",
    title: "运输吞吐量规划器",
    structuredType: "SoftwareApplication",
    canonical: "https://www.linqingan.com/tools/hauling-throughput-planner",
    alternate: "https://www.linqingan.com/en/tools/hauling-throughput-planner",
  },
  {
    pathname: "/tools/tower-damage-heal-repair-calculator",
    title: "Tower 伤害、治疗与维修计算器",
    structuredType: "SoftwareApplication",
    canonical: "https://www.linqingan.com/tools/tower-damage-heal-repair-calculator",
    alternate: "https://www.linqingan.com/en/tools/tower-damage-heal-repair-calculator",
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
  {
    pathname: "/en/tools/spawn-queue-replacement-planner",
    title: "Spawn Queue and Replacement Planner",
    structuredType: "SoftwareApplication",
    canonical: "https://www.linqingan.com/en/tools/spawn-queue-replacement-planner",
    alternate: "https://www.linqingan.com/tools/spawn-queue-replacement-planner",
  },
  {
    pathname: "/en/tools/hauling-throughput-planner",
    title: "Hauling Throughput Planner",
    structuredType: "SoftwareApplication",
    canonical: "https://www.linqingan.com/en/tools/hauling-throughput-planner",
    alternate: "https://www.linqingan.com/tools/hauling-throughput-planner",
  },
  {
    pathname: "/en/tools/tower-damage-heal-repair-calculator",
    title: "Tower Damage, Heal, and Repair Calculator",
    structuredType: "SoftwareApplication",
    canonical: "https://www.linqingan.com/en/tools/tower-damage-heal-repair-calculator",
    alternate: "https://www.linqingan.com/tools/tower-damage-heal-repair-calculator",
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

for (const pathname of pages.filter((page) => !page.pathname.startsWith("/en/")).map((page) => page.pathname)) {
  if (!chineseSitemap.includes(`https://www.linqingan.com${pathname}`)) failures.push(`${pathname}: missing from Chinese Sitemap`);
}

for (const pathname of pages.filter((page) => page.pathname.startsWith("/en/")).map((page) => page.pathname)) {
  if (!englishSitemap.includes(`https://www.linqingan.com${pathname}`)) failures.push(`${pathname}: missing from English Sitemap`);
}

const chineseSearchCases = [
  { query: "Spawn", expected: "/tools/spawn-queue-replacement-planner", label: "Chinese Spawn search" },
  { query: "hauling", expected: "/tools/hauling-throughput-planner", label: "Chinese hauling search" },
  { query: "Tower", expected: "/tools/tower-damage-heal-repair-calculator", label: "Chinese Tower search" },
];

for (const searchCase of chineseSearchCases) {
  const response = await fetch(`${baseUrl}/api/search?q=${encodeURIComponent(searchCase.query)}&limit=40`);
  if (response.status !== 200) {
    failures.push(`${searchCase.label} API returned ${response.status}`);
    continue;
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    failures.push(`${searchCase.label} API did not return JSON`);
    continue;
  }

  if (!Array.isArray(payload?.results) || !payload.results.some((result) => result.href === searchCase.expected)) {
    failures.push(`${searchCase.label} does not expose ${searchCase.expected}`);
  }
}

const englishSearchCases = [
  { pathname: "/en/search?q=Spawn", expected: "/en/tools/spawn-queue-replacement-planner", label: "English Spawn search" },
  { pathname: "/en/search?q=hauling", expected: "/en/tools/hauling-throughput-planner", label: "English hauling search" },
  { pathname: "/en/search?q=Tower", expected: "/en/tools/tower-damage-heal-repair-calculator", label: "English Tower search" },
];

for (const searchCase of englishSearchCases) {
  const body = await fetch(`${baseUrl}${searchCase.pathname}`).then((response) => response.text());
  if (!body.includes(searchCase.expected)) failures.push(`${searchCase.label} does not expose ${searchCase.expected}`);
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`ERROR: ${failure}`);
  console.error(`Planning tool smoke test failed: ${failures.length} issue(s).`);
  process.exit(1);
}

console.log(`Planning tool smoke test passed: ${pages.length} bilingual tool and hub pages validated.`);
