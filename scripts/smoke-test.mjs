const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

const checks = [
  ["/", ["构建，运行，迭代", "Screeps 知识库", "篇文章", "个知识模块", "已经遇到问题？", "计算 Creep 身体"]],
  ["/about", ["临清安", "/profile-avatar.webp", "篇专题文章", "公开建设项目", "查看建设日志"]],
  ["/beginner", ["Screeps 新手入门", "12"]],
  ["/blog", ["全部文章", "篇"]],
  ["/changelog", ["更新日志", "新增独立更新日志", "合并资料中心与项目页面"]],
  ["/knowledge", ["Screeps 知识库", "查询与工具", "Creep 身体计算器", "选择你要解决的问题"]],
  ["/tools/creep-body-calculator", ["Creep 身体计算器", "选择身体部件", "计算结果", "复制身体数组"]],
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
  ["/blog/screeps-introduction", ["Screeps 是什么", "发布于", "验证状态"]],
  ["/blog/screeps-memory-basics", ["Screeps Memory 是什么", "本文最后测试于 2026 年 7 月"]],
  ["/blog/screeps-creep-withdraw-container-energy", ["Creep.withdraw 怎么用", "资料核对日期：2026-07-18"]],
  ["/blog/screeps-tower-auto-attack-hostiles", ["Tower 怎么自动攻击敌人", "资料核对日期：2026-07-18"]],
  ["/blog/screeps-controller-activate-safe-mode", ["Safe Mode 怎么开启", "资料核对日期：2026-07-18"]],
  ["/blog/screeps-spawn-renew-creep", ["renewCreep() 怎么用", "资料核对日期：2026-07-18"]],
  ["/blog/screeps-dynamic-creep-body-energy", ["离线模拟结果", "Node.js 24 离线模拟", "真实 Screeps Console 与主循环仍待环境验证"]],
  ["/blog/screeps-clean-dead-creep-memory", ["离线模拟结果", "删除 2 个死亡名称", "真实 Screeps Console 与主循环仍待环境验证"]],
  ["/blog/screeps-construction-site-progress", ["离线模拟结果", "超过总量保护", "仍为待环境验证"]],
  ["/blog/screeps-tower-repair-threshold", ["为什么要先检查敌人", "离线模拟结果", "真实 Tower 行为"]],
  ["/blog/screeps-spawn-emergency-recovery", ["离线模拟结果", "Energy 为 200", "多 tick 恢复过程仍待环境验证"]],
  ["/blog/screeps-game-get-object-by-id", ["Game.getObjectById() 怎么配合 Memory 保存目标", "Game.getObjectById API", "null"]],
  ["/blog/screeps-power-spawn-process-power", ["processPower() 怎么处理 Power", "Screeps Console", "待测试"]],
  ["/en/beginner", ["Learn Screeps in twelve focused lessons", "LESSON 01", "LESSON 12", "Complete beginner sequence published"]],
  ["/en/blog", ["Practical Screeps articles", "What Is Screeps and What Do You Actually Do in It?", "How to Combine Your First Screeps Room Loop"]],
  ["/en/blog/screeps-introduction", ["What Is Screeps and What Do You Actually Do in It?", "Chinese source", "Read in full", "Publication status", "Ready"]],
  ["/en/blog/screeps-first-room", ["How to Find Your First Screeps Room and Its Core Objects", "State impact", "Read-only", "Screeps Console", "Pending"]],
  ["/en/blog/screeps-tick-game-loop", ["What Is a Screeps Tick", "Game-loop model", "Checked", "Tick interval", "Server-dependent"]],
  ["/en/blog/screeps-creep-harvest-energy", ["How to Make Your First Screeps Creep Harvest Energy", "Chinese source", "Read in full", "Screeps Console", "Pending"]],
  ["/en/blog/screeps-transfer-energy-to-spawn", ["How to Make a Screeps Creep Deliver Energy to a Spawn", "Offline state logic", "Passed", "Live multi-tick test", "Pending"]],
  ["/en/blog/screeps-creep-body-parts", ["Why Your Screeps Creep Cannot Harvest, Carry, or Move", "Offline calculation", "Passed", "Live room inspection", "Pending"]],
  ["/en/blog/screeps-spawn-creep", ["How to Make a Screeps Spawn Create a New Creep", "Offline branch review", "Passed", "Live spawn cycle", "Pending"]],
  ["/en/blog/screeps-creep-roles", ["Why Multiple Screeps Creeps Need Simple Roles", "Role terminology", "Player-defined", "Live role behavior", "Pending"]],
  ["/en/blog/screeps-upgrade-controller", ["How to Make a Screeps Creep Upgrade the Room Controller", "API range and codes", "Checked", "Live multi-tick test", "Pending"]],
  ["/en/blog/screeps-first-extension", ["How to Build Your First Screeps Extension", "RCL and constants", "Checked", "Live construction test", "Pending"]],
  ["/en/blog/screeps-build-repair", ["How to Make a Screeps Creep Build and Repair Automatically", "Offline priority review", "Passed", "Live multi-tick test", "Pending"]],
  ["/en/blog/screeps-first-room-code", ["How to Combine Your First Screeps Room Loop", "Offline branch review", "Passed", "Live room test", "Pending"]],
  ["/sitemap.xml", ["https://www.linqingan.com/knowledge", "https://www.linqingan.com/tools/creep-body-calculator", "https://www.linqingan.com/verification", "https://www.linqingan.com/changelog", "https://www.linqingan.com/blog/screeps-memory-basics", "https://www.linqingan.com/blog/screeps-clean-dead-creep-memory", "https://www.linqingan.com/tags/basic-engineering", "https://www.linqingan.com/about", "https://www.linqingan.com/en/blog/screeps-introduction", "https://www.linqingan.com/en/blog/screeps-first-room-code"]],
];

const assetChecks = [
  ["/opengraph-image", "image/"],
  ["/knowledge/opengraph-image", "image/"],
  ["/beginner/opengraph-image", "image/"],
  ["/tools/creep-body-calculator/opengraph-image", "image/"],
];

const redirectChecks = [
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

  if (pathname !== "/sitemap.xml" && !body.includes("https://www.linqingan.com")) {
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
  if (response.status !== 200) {
    failures.push(`${pathname}: 预期 200，实际 ${response.status}`);
  }
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

const searchResponse = await fetch(`${baseUrl}/search`);
const searchBody = await searchResponse.text();
if (!/<meta[^>]+name="robots"[^>]+content="[^"]*noindex[^"]*"/i.test(searchBody)) {
  failures.push("/search: 缺少 noindex");
}

const sitemapResponse = await fetch(`${baseUrl}/sitemap.xml`);
const sitemapBody = await sitemapResponse.text();
const sitemapUrls = [
  ...new Set(
    [...sitemapBody.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) =>
      match[1].replaceAll("&amp;", "&"),
    ),
  ),
];

function evenlySample(values, limit) {
  if (values.length <= limit) return values;
  return Array.from({ length: limit }, (_, index) =>
    values[Math.floor(index * values.length / limit)],
  );
}

const sitemapPaths = sitemapUrls.map((url) => new URL(url).pathname);
if (sitemapPaths.includes("/search")) failures.push("/search: 不应出现在 Sitemap");
if (sitemapPaths.includes("/resources")) failures.push("/resources: 已合并，不应出现在 Sitemap");
if (sitemapPaths.some((pathname) => pathname === "/projects" || pathname.startsWith("/projects/"))) {
  failures.push("/projects: 已合并，不应出现在 Sitemap");
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
if (thinTagResponse.status !== 200) {
  failures.push(`${thinTagPath}: 薄标签页预期保留 200，实际 ${thinTagResponse.status}`);
}
if (!/<meta[^>]+name="robots"[^>]+content="[^"]*noindex[^"]*"/i.test(thinTagBody)) {
  failures.push(`${thinTagPath}: 薄标签页缺少 noindex`);
}
if (sitemapPaths.includes(thinTagPath)) {
  failures.push(`${thinTagPath}: 薄标签页不应出现在 Sitemap`);
}

for (let index = 0; index < sitemapUrls.length; index += 10) {
  const batch = sitemapUrls.slice(index, index + 10);
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
  for (const failure of failures) console.error(`ERROR: ${failure}`);
  console.error(`\n冒烟测试失败：${failures.length} 项。`);
  process.exit(1);
}

console.log(`冒烟测试通过：${checks.length} 个关键页面，${sitemapUrls.length} 个 Sitemap URL。`);
