const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

const checks = [
  ["/", ["构建，运行，迭代", "Screeps 知识库", "60", "8 个主题组"]],
  ["/about", ["临清安", "/profile-avatar.webp"]],
  ["/beginner", ["Screeps 新手入门", "12"]],
  ["/blog", ["全部文章", "60"]],
  ["/knowledge", ["Screeps知识库", "知识库主题导航"]],
  ["/resources", ["资料中心", "站内搜索"]],
  ["/search", ["搜索整个网站", "错误码"]],
  ["/glossary", ["Screeps 术语表", "Memory"]],
  ["/screeps-errors", ["ERR_NOT_IN_RANGE", "建议排查顺序"]],
  ["/tags", ["文章标签", "Screeps"]],
  ["/tags/beginner", ["新手入门", "当前共有"]],
  ["/tags/basic-engineering", ["基础工程", "当前共有"]],
  ["/tags/common-questions", ["常见问题", "当前共有"]],
  ["/tags/debugging", ["错误排查", "当前共有"]],
  ["/tags/advanced-development", ["进阶开发", "当前共有"]],
  ["/projects", ["linqingan.com", "Screeps 中文新手学习路线"]],
  ["/projects/linqingan-com", ["当前成果", "建设时间线"]],
  ["/blog/screeps-introduction", ["发布于", "验证状态", "没有找到 Harvester1"]],
  ["/blog/screeps-memory-basics", ["Screeps Memory 是什么", "本文最后测试于 2026 年 7 月"]],
  ["/blog/screeps-creep-withdraw-container-energy", ["Creep.withdraw 怎么用", "资料核对日期：2026-07-18"]],
  ["/blog/screeps-tower-auto-attack-hostiles", ["Tower 怎么自动攻击敌人", "资料核对日期：2026-07-18"]],
  ["/blog/screeps-controller-activate-safe-mode", ["Safe Mode 怎么开启", "资料核对日期：2026-07-18"]],
  ["/blog/screeps-spawn-renew-creep", ["renewCreep() 怎么用", "资料核对日期：2026-07-18"]],
  ["/blog/screeps-clean-dead-creep-memory", ["清理死亡 Creep 的 Memory", "真实主循环", "待验证"]],
  ["/blog/screeps-game-get-object-by-id", ["Game.getObjectById() 怎么配合 Memory 保存目标", "Game.getObjectById API", "null"]],
  ["/blog/screeps-spawn-emergency-recovery", ["房间断代后如何自动恢复第一只采集者", "不会返回", "ERR_NOT_IN_RANGE"]],
  ["/blog/screeps-power-spawn-process-power", ["processPower() 怎么处理 Power", "Screeps Console", "待测试"]],
  ["/sitemap.xml", ["https://www.linqingan.com/knowledge", "https://www.linqingan.com/blog/screeps-memory-basics", "https://www.linqingan.com/blog/screeps-clean-dead-creep-memory", "https://www.linqingan.com/blog/screeps-power-spawn-process-power", "https://www.linqingan.com/tags/basic-engineering", "https://www.linqingan.com/about"]],
];

const redirectChecks = [
  ["/tags/新手入门", "/tags/beginner"],
  ["/tags/基础工程", "/tags/basic-engineering"],
  ["/tags/常见问题", "/tags/common-questions"],
  ["/tags/错误排查", "/tags/debugging"],
  ["/tags/进阶开发", "/tags/advanced-development"],
];

const metadataPaths = [
  "/",
  "/knowledge",
  "/tags/basic-engineering",
  "/blog/screeps-storage-energy-usage",
  "/projects/linqingan-com",
  "/resources",
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

  if (response.status !== 200) {
    failures.push(`${pathname}: 预期 200，实际 ${response.status}`);
    continue;
  }

  for (const expected of expectedTexts) {
    if (!body.includes(expected)) {
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
  if (response.status !== 301) {
    failures.push(`${source}: 预期 301，实际 ${response.status}`);
  }
  if (!location?.endsWith(destination)) {
    failures.push(`${source}: Location 预期指向 ${destination}，实际 ${location ?? "缺失"}`);
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

const sitemapResponse = await fetch(`${baseUrl}/sitemap.xml`);
const sitemapBody = await sitemapResponse.text();
const sitemapUrls = [
  ...new Set(
    [...sitemapBody.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) =>
      match[1].replaceAll("&amp;", "&"),
    ),
  ),
];

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

