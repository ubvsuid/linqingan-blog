
const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

const checks = [
  ["/", ["构建，运行，迭代", "Screeps"]],
  ["/about", ["临清安", "/profile-avatar.webp"]],
  ["/beginner", ["Screeps 新手入门", "12"]],
  ["/blog", ["全部文章", "60"]],
  ["/knowledge", ["Screeps知识库", "8 个主题组"]],
  ["/resources", ["资料中心", "站内搜索"]],
  ["/search", ["搜索整个网站", "错误码"]],
  ["/glossary", ["Screeps 术语表", "Memory"]],
  ["/screeps-errors", ["ERR_NOT_IN_RANGE", "建议排查顺序"]],
  ["/tags", ["文章标签", "Screeps"]],
  ["/projects", ["linqingan.com", "Screeps 中文新手学习路线"]],
  ["/projects/linqingan-com", ["当前成果", "建设时间线"]],
  ["/blog/screeps-introduction", ["发布于", "把这篇内容连接到下一步"]],
  ["/blog/screeps-memory-basics", ["Screeps Memory 是什么", "本文最后测试于 2026 年 7 月"]],
  ["/blog/screeps-creep-withdraw-container-energy", ["Creep.withdraw 怎么用", "资料核对日期：2026-07-18"]],
  ["/blog/screeps-tower-auto-attack-hostiles", ["Tower 怎么自动攻击敌人", "资料核对日期：2026-07-18"]],
  ["/blog/screeps-controller-activate-safe-mode", ["Safe Mode 怎么开启", "资料核对日期：2026-07-18"]],
  ["/blog/screeps-spawn-renew-creep", ["renewCreep() 怎么用", "资料核对日期：2026-07-18"]],
  ["/blog/screeps-clean-dead-creep-memory", ["清理死亡 Creep 的 Memory", "待 Screeps 环境验证"]],
  ["/blog/screeps-power-spawn-process-power", ["processPower() 怎么处理 Power", "待 Screeps 环境验证"]],
  ["/sitemap.xml", ["https://www.linqingan.com/knowledge", "https://www.linqingan.com/blog/screeps-memory-basics", "https://www.linqingan.com/blog/screeps-clean-dead-creep-memory", "https://www.linqingan.com/blog/screeps-power-spawn-process-power", "https://www.linqingan.com/about"]],
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

if (failures.length > 0) {
  for (const failure of failures) console.error(`ERROR: ${failure}`);
  console.error(`\n冒烟测试失败：${failures.length} 项。`);
  process.exit(1);
}

console.log(`冒烟测试通过：${checks.length} 个关键页面。`);

