const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

const checks = [
  ["/", ["构建，运行，迭代", "Screeps 知识库", "篇文章", "个知识模块", "常用查询工具", "计算 Creep 身体"]],
  ["/about", ["临清安", "/profile-avatar.webp", "篇专题文章", "公开建设项目", "查看建设日志"]],
  ["/beginner", ["Screeps 新手入门", "12"]],
  ["/blog", ["全部文章", "篇"]],
  ["/changelog", ["更新日志", "新增独立更新日志", "合并资料中心与项目页面"]],
  ["/knowledge", ["Screeps 知识库", "查询与工具", "Creep 身体计算器", "选择你要解决的问题"]],
  ["/tools/creep-body-calculator", ["Creep 身体计算器", "选择身体部件", "计算结果", "复制身体数组"]],
  ["/tools/room-diagnostics", ["房间运行诊断", "使用边界", "CPU 风险"]],
  ["/search", ["搜索整个网站", "筛选搜索结果", "身体计算器"]],
  ["/glossary", ["Screeps 术语表", "Memory"]],
  ["/screeps-errors", ["ERR_NOT_IN_RANGE", "建议排查顺序"]],
  ["/verification", ["文章验证方法", "五种验证状态", "离线模拟已通过", "真实主循环已验证"]],
  ["/tags", ["文章标签", "核心标签", "更多标签"]],
  ["/tags/beginner", ["新手入门", "当前共有"]],
  ["/tags/basic-engineering", ["基础工程", "当前共有"]],
  ["/tags/common-questions", ["常见问题", "当前共有"]],
  ["/tags/debugging", ["错误排查", "当前共有"]],
  ["/tags/advanced-development", ["进阶开发", "当前共有"]],
  ["/now", ["更新日志", "查看完整更新日志", "阶段性记录"]],
  ["/feed.xml", ["<rss", "linqingan.com"]],
  ["/blog/screeps-introduction", ["Screeps 是什么", "发布于", "查看验证详情"]],
  ["/blog/screeps-memory-basics", ["Screeps Memory 是什么", "测试环境", "Screeps Console", "待测试"]],
  ["/blog/screeps-creep-withdraw-container-energy", ["withdraw()", "查看验证详情", "测试环境"]],
  ["/blog/screeps-tower-auto-attack-hostiles", ["Tower 怎么自动攻击敌人", "FIND_HOSTILE_CREEPS", "测试环境"]],
  ["/blog/screeps-controller-activate-safe-mode", ["activateSafeMode()", "查看验证详情", "测试环境"]],
  ["/blog/screeps-spawn-renew-creep", ["renewCreep()", "查看验证详情", "测试环境"]],
  ["/blog/screeps-dynamic-creep-body-energy", ["离线模拟结果", "Node.js 24 离线模拟", "Screeps Console", "待测试"]],
  ["/blog/screeps-clean-dead-creep-memory", ["离线模拟结果", "Memory.creeps", "Screeps Console", "待测试"]],
  ["/blog/screeps-construction-site-progress", ["离线模拟结果", "progressTotal", "测试环境"]],
  ["/blog/screeps-tower-repair-threshold", ["FIND_HOSTILE_CREEPS", "离线模拟结果", "Tower Energy"]],
  ["/blog/screeps-spawn-emergency-recovery", ["离线模拟结果", "200 Energy", "dryRun"]],
  ["/blog/screeps-game-get-object-by-id", ["Game.getObjectById()", "Memory", "null"]],
  ["/blog/screeps-power-spawn-process-power", ["processPower()", "Screeps Console", "待测试"]],
  ["/en/beginner", ["Learn Screeps in twelve focused lessons", "LESSON 01", "LESSON 12", "Complete beginner sequence published"]],
  ["/en/blog", ["Practical Screeps articles", "Apply filters", "Publication standard", "Page 1 of"]],
  ["/en/blog-index.json", ["What Is Screeps? A Programming Strategy Game", "Screeps First Room Code: A Small Loop You Can Verify"]],
  ["/en/blog/screeps-introduction", ["What Is Screeps? How the Programming Strategy Game Works", "Chinese source", "Read in full", "Publication status", "Ready"]],
  ["/en/blog/screeps-first-room", ["How to Find Your First Screeps Room, Editor, and Console", "State impact", "Read-only", "Screeps Console", "Pending"]],
  ["/en/blog/screeps-tick-game-loop", ["What Is a Screeps Tick", "same-tick-intents", "return-code-evidence", "Screeps Console test", "Live multi-tick verification pending", "Pending"]],
  ["/en/blog/screeps-creep-harvest-energy", ["Screeps Harvest Energy Without the ERR_FULL Mistake", "Official engine source", "Screeps Console test", "Pending"]],
  ["/en/blog/screeps-transfer-energy-to-spawn", ["How to Make a Screeps Creep Deliver Energy to a Spawn", "Offline state logic", "Passed", "Live multi-tick test", "Pending"]],
  ["/en/blog/screeps-creep-body-parts", ["Why Your Screeps Creep Cannot Harvest, Carry, or Move", "Offline calculation", "Passed", "Live room inspection", "Pending"]],
  ["/en/blog/screeps-spawn-creep", ["How to Make a Screeps Spawn Create a New Creep", "Offline branch review", "Passed", "Live spawn cycle", "Pending"]],
  ["/en/blog/screeps-creep-roles", ["Why Multiple Screeps Creeps Need Simple Roles", "Role terminology", "player/project-defined", "invalid-role-result", "Screeps Console test", "Live multi-tick verification pending", "Pending"]],
  ["/en/blog/screeps-upgrade-controller", ["How to Make a Screeps Creep Upgrade the Room Controller", "API range and codes", "Checked", "Live multi-tick test", "Pending"]],
  ["/en/blog/screeps-first-extension", ["Build Your First Screeps Extension Without Missing a Blocked Site", "Official engine source", "Live boundary test", "Pending"]],
  ["/en/blog/screeps-build-repair", ["Run a Screeps Builder Without Hiding Build, Repair, or Controller Errors", "Official engine source", "Live multi-tick verification", "Pending"]],
  ["/en/blog/screeps-first-room-code", ["Combine Your First Screeps Room Loop Without Hiding Failure States", "Technical correction", "Spawning, role execution, Energy phase, current-tick acceptance, later-tick outcomes, and emergency recovery are separated", "Live multi-tick verification", "Pending", "trySpawnFirstMissing", "spawn-dry-run-rejected"]],
  ["/sitemap.xml", ["https://www.linqingan.com/sitemap-zh.xml", "https://www.linqingan.com/sitemap-en.xml", "<sitemapindex"]],
  ["/sitemap-zh.xml", ["https://www.linqingan.com/knowledge", "https://www.linqingan.com/tools/creep-body-calculator", "https://www.linqingan.com/changelog", "https://www.linqingan.com/blog/screeps-memory-basics", "https://www.linqingan.com/tags/basic-engineering"]],
  ["/sitemap-en.xml", ["https://www.linqingan.com/en", "https://www.linqingan.com/en/beginner", "https://www.linqingan.com/en/blog/screeps-introduction", "https://www.linqingan.com/en/blog/screeps-first-room-code"]],
];

const assetChecks = [
  ["/opengraph-image", "image/"],
  ["/knowledge/opengraph-image", "image/"],
  ["/beginner/opengraph-image", "image/"],
  ["/tools/creep-body-calculator/opengraph-image", "image/"],
  ["/tools/room-diagnostics/opengraph-image", "image/"],
  ["/blog/screeps-memory-basics/opengraph-image", "image/"],
];

const redirectChecks = [
  ["/changelog/page/2", "/changelog"],
  ["/tags/新手入门", "/tags/beginner"],
  ["/tags/基础工程", "/tags/basic-engineering"],
  ["/tags/常见问题", "/tags/common-questions"],
  ["/tags/错误排查", "/tags/debugging"],
  ["/tags/进阶开发", "/tags/advanced-development"],
  ["/resources", "/knowledge#reference-tools"],
  ["/projects", "/about#public-projects"],
  ["/projects/linqingan-com", "/about#public-projects"],
];

const metadataPaths = [
  "/",
  "/beginner",
  "/changelog",
  "/knowledge",
  "/tools/creep-body-calculator",
  "/tools/room-diagnostics",
  "/tags/basic-engineering",
  "/blog/screeps-storage-energy-usage",
  "/about",
  "/verification",
  "/en/beginner",
  "/en/blog/screeps-introduction",
  "/en/blog/screeps-spawn-creep",
  "/en/blog/screeps-first-room-code",
];

const requiredEnglishBeginnerPaths = [
  "/en/blog/screeps-introduction",
  "/en/blog/screeps-first-room",
  "/en/blog/screeps-tick-game-loop",
  "/en/blog/screeps-creep-harvest-energy",
  "/en/blog/screeps-transfer-energy-to-spawn",
  "/en/blog/screeps-creep-body-parts",
  "/en/blog/screeps-spawn-creep",
  "/en/blog/screeps-creep-roles",
  "/en/blog/screeps-upgrade-controller",
  "/en/blog/screeps-first-extension",
  "/en/blog/screeps-build-repair",
  "/en/blog/screeps-first-room-code",
];

async function waitForServer() {
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    try {
      const response = await fetch(baseUrl, { redirect: "manual" });
      if (response.status >= 200 && response.status < 500) return;
    } catch {
      // Server may still be starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`服务器未在预期时间内启动：${baseUrl}`);
}

function extractLocs(xml) {
  return [
    ...new Set(
      [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) =>
        match[1].replaceAll("&amp;", "&"),
      ),
    ),
  ];
}

function evenlySample(values, limit) {
  if (values.length <= limit) return values;
  return Array.from({ length: limit }, (_, index) =>
    values[Math.floor(index * values.length / limit)],
  );
}

await waitForServer();

const failures = [];

for (const [pathname, expectedTexts] of checks) {
  const response = await fetch(`${baseUrl}${pathname}`, { redirect: "manual" });
  const body = await response.text();
  const searchableBody = body.replace(/<!--.*?-->/g, "");

  if (response.status !== 200) {
    failures.push(`${pathname}: 预期 200，实际 ${response.status}`);
    continue;
  }

  for (const expected of expectedTexts) {
    if (!searchableBody.includes(expected)) {
      failures.push(`${pathname}: 缺少预期内容 “${expected}”`);
    }
  }

  if (body.includes("林清安")) {
    failures.push(`${pathname}: 仍然出现旧姓名“林清安”`);
  }

  if (pathname.startsWith("/blog/") && body.includes("本文最后测试于")) {
    failures.push(`${pathname}: 仍然使用可能误导的“本文最后测试于”表述`);
  }

  if (
    !pathname.endsWith(".xml") &&
    !pathname.endsWith(".json") &&
    !body.includes("https://www.linqingan.com")
  ) {
    failures.push(`${pathname}: 未找到统一主域名信号`);
  }
}

for (const [source, destination] of redirectChecks) {
  const response = await fetch(`${baseUrl}${source}`, { redirect: "manual" });
  const location = response.headers.get("location");
  if (![301, 308].includes(response.status)) {
    failures.push(`${source}: 预期永久重定向，实际 ${response.status}`);
  }
  if (!location?.endsWith(destination)) {
    failures.push(`${source}: Location 预期指向 ${destination}，实际 ${location ?? "缺失"}`);
  }
}

for (const [pathname, expectedContentType] of assetChecks) {
  const response = await fetch(`${baseUrl}${pathname}`, { redirect: "manual" });
  if (response.status !== 200) failures.push(`${pathname}: 预期 200，实际 ${response.status}`);
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.startsWith(expectedContentType)) {
    failures.push(`${pathname}: Content-Type 预期 ${expectedContentType}*，实际 ${contentType || "缺失"}`);
  }
}

for (const pathname of metadataPaths) {
  const response = await fetch(`${baseUrl}${pathname}`);
  const body = await response.text();
  if (!/<meta[^>]+property="og:image"[^>]+content="[^"]+"/i.test(body)) {
    failures.push(`${pathname}: 缺少 og:image`);
  }
  if (!/<meta[^>]+name="twitter:image"[^>]+content="[^"]+"/i.test(body)) {
    failures.push(`${pathname}: 缺少 twitter:image`);
  }
}

const securityResponse = await fetch(baseUrl);
const enforcedCsp = securityResponse.headers.get("content-security-policy") ?? "";
const globalReportOnly = securityResponse.headers.get("content-security-policy-report-only") ?? "";
if (!enforcedCsp.includes("default-src 'self'") || !enforcedCsp.includes("object-src 'none'")) {
  failures.push("Security headers: missing the enforced Content-Security-Policy.");
}
if (globalReportOnly) {
  failures.push("Security headers: the strict Report-Only candidate must not run on every route.");
}

const cspCanaryResponse = await fetch(`${baseUrl}/en/verification`);
const cspReportOnly = cspCanaryResponse.headers.get("content-security-policy-report-only") ?? "";
if (
  !cspReportOnly.includes("default-src 'self'")
  || !cspReportOnly.includes("object-src 'none'")
  || !cspReportOnly.includes("style-src-attr 'none'")
  || cspReportOnly.includes("script-src 'self' 'unsafe-inline'")
) {
  failures.push("/en/verification: missing the stricter Report-Only CSP canary.");
}

const searchResponse = await fetch(`${baseUrl}/search`);
const searchBody = await searchResponse.text();
if (!/<meta[^>]+name="robots"[^>]+content="[^"]*noindex[^"]*"/i.test(searchBody)) {
  failures.push("/search: 缺少 noindex");
}

const fullIndexResponse = await fetch(`${baseUrl}/api/search-index`);
if (fullIndexResponse.status !== 200) {
  failures.push(`/api/search-index: 预期 200，实际 ${fullIndexResponse.status}`);
} else {
  try {
    const payload = await fullIndexResponse.json();
    if (!Array.isArray(payload) || payload.length === 0) {
      failures.push("/api/search-index: 应返回非空搜索文档数组");
    }
  } catch {
    failures.push("/api/search-index: 返回内容不是有效 JSON");
  }
}

const missingResponse = await fetch(`${baseUrl}/audit-page-that-does-not-exist`, { redirect: "manual" });
const missingBody = await missingResponse.text();
if (missingResponse.status !== 404) failures.push(`/404: 预期 404，实际 ${missingResponse.status}`);
if (!missingBody.includes("页面不存在｜临清安")) failures.push("/404: 缺少独立页面标题");
const hasHomeCanonical = missingBody.includes(`rel="canonical" href="https://www.linqingan.com"`) || missingBody.includes(`rel="canonical" href="https://www.linqingan.com/"`);
if (hasHomeCanonical) failures.push("/404: 不应把不存在页面 canonical 到首页");

const robotsResponse = await fetch(`${baseUrl}/robots.txt`);
const robotsBody = await robotsResponse.text();
if (!robotsBody.includes("Sitemap: https://www.linqingan.com/sitemap.xml")) {
  failures.push("/robots.txt: 应声明 Sitemap 索引");
}

const sitemapIndexResponse = await fetch(`${baseUrl}/sitemap.xml`);
const sitemapIndexBody = await sitemapIndexResponse.text();
const sitemapDocumentUrls = extractLocs(sitemapIndexBody);
const expectedSitemapDocuments = [
  "https://www.linqingan.com/sitemap-zh.xml",
  "https://www.linqingan.com/sitemap-en.xml",
];
for (const requiredSitemap of expectedSitemapDocuments) {
  if (!sitemapDocumentUrls.includes(requiredSitemap)) {
    failures.push(`/sitemap.xml: 缺少 ${requiredSitemap}`);
  }
}
if (!sitemapIndexBody.includes("<sitemapindex")) failures.push("/sitemap.xml: 根文档不是 Sitemap 索引");

const sitemapUrls = [];
const sitemapUrlGroups = new Map();
for (const sitemapDocumentUrl of expectedSitemapDocuments) {
  const pathname = new URL(sitemapDocumentUrl).pathname;
  const response = await fetch(`${baseUrl}${pathname}`);
  const body = await response.text();
  if (response.status !== 200) {
    failures.push(`${pathname}: 预期 200，实际 ${response.status}`);
    continue;
  }
  const urls = extractLocs(body);
  sitemapUrlGroups.set(pathname, urls);
  sitemapUrls.push(...urls);
}

const uniqueSitemapUrls = [...new Set(sitemapUrls)];
const sitemapPaths = uniqueSitemapUrls.map((url) => new URL(url).pathname);
const chineseSitemapPaths = (sitemapUrlGroups.get("/sitemap-zh.xml") ?? []).map((url) => new URL(url).pathname);
const englishSitemapPaths = (sitemapUrlGroups.get("/sitemap-en.xml") ?? []).map((url) => new URL(url).pathname);

if (sitemapPaths.includes("/search")) failures.push("/search: 不应出现在 Sitemap");
if (sitemapPaths.includes("/resources")) failures.push("/resources: 已合并，不应出现在 Sitemap");
if (sitemapPaths.some((pathname) => pathname === "/projects" || pathname.startsWith("/projects/"))) {
  failures.push("/projects: 已合并，不应出现在 Sitemap");
}
if (sitemapPaths.some((pathname) => pathname.startsWith("/blog/page/"))) {
  failures.push("/blog/page/*: 文章深层分页不应出现在 Sitemap");
}
if (sitemapPaths.some((pathname) => pathname.startsWith("/changelog/page/"))) {
  failures.push("/changelog/page/*: 更新日志分页不应出现在 Sitemap");
}
if (chineseSitemapPaths.some((pathname) => pathname === "/en" || pathname.startsWith("/en/"))) {
  failures.push("/sitemap-zh.xml: 不应包含英文 URL");
}
if (englishSitemapPaths.some((pathname) => pathname !== "/en" && !pathname.startsWith("/en/"))) {
  failures.push("/sitemap-en.xml: 不应包含中文 URL");
}

for (const requiredPath of [
  "/verification",
  "/changelog",
  "/tools/creep-body-calculator",
  "/en/beginner",
  "/en/blog",
  ...requiredEnglishBeginnerPaths,
]) {
  if (!sitemapPaths.includes(requiredPath)) failures.push(`${requiredPath}: 应出现在 Sitemap`);
}

const sampledPaths = [
  ...evenlySample(sitemapPaths.filter((pathname) => pathname.startsWith("/blog/")), 5),
  ...evenlySample(sitemapPaths.filter((pathname) => pathname.startsWith("/tags/")), 5),
  ...evenlySample(sitemapPaths.filter((pathname) => pathname.startsWith("/en/blog/")), 5),
];

for (const pathname of sampledPaths) {
  const response = await fetch(`${baseUrl}${pathname}`, { redirect: "manual" });
  const body = await response.text();
  if (response.status !== 200) {
    failures.push(`${pathname}: 抽样页面预期 200，实际 ${response.status}`);
  } else if (!/<title>[^<]+<\/title>/i.test(body)) {
    failures.push(`${pathname}: 抽样页面缺少有效标题`);
  }
}

const thinTagPath = "/tags/roomvisual";
const thinTagResponse = await fetch(`${baseUrl}${thinTagPath}`);
const thinTagBody = await thinTagResponse.text();
if (thinTagResponse.status !== 200) failures.push(`${thinTagPath}: 薄标签页预期保留 200，实际 ${thinTagResponse.status}`);
if (!/<meta[^>]+name="robots"[^>]+content="[^"]*noindex[^"]*"/i.test(thinTagBody)) {
  failures.push(`${thinTagPath}: 薄标签页缺少 noindex`);
}
if (sitemapPaths.includes(thinTagPath)) failures.push(`${thinTagPath}: 薄标签页不应出现在 Sitemap`);

for (let index = 0; index < uniqueSitemapUrls.length; index += 10) {
  const batch = uniqueSitemapUrls.slice(index, index + 10);
  const results = await Promise.all(
    batch.map(async (url) => {
      const parsed = new URL(url);
      const response = await fetch(`${baseUrl}${parsed.pathname}${parsed.search}`, {
        redirect: "manual",
      });
      return { url, status: response.status };
    }),
  );

  for (const result of results) {
    if (result.status !== 200) {
      failures.push(`Sitemap URL ${result.url}: 预期 200，实际 ${result.status}`);
    }
  }
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  console.error(`\n冒烟测试失败：${failures.length} 项。`);
  process.exit(1);
}

console.log(`冒烟测试通过：${checks.length} 个关键页面，2 个子 Sitemap，${uniqueSitemapUrls.length} 个可索引 URL。`);