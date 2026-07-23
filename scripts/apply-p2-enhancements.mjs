import fs from "node:fs";

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function write(filePath, source) {
  fs.writeFileSync(filePath, source);
}

function replaceOnce(source, before, after, marker, label) {
  if (source.includes(marker)) return source;
  if (!source.includes(before)) {
    throw new Error(`Unable to apply ${label}: expected source shape not found`);
  }
  return source.replace(before, after);
}

function insertBeforeHeading(source, heading, block, marker, label) {
  if (source.includes(marker)) return source;
  const index = source.indexOf(heading);
  if (index < 0) throw new Error(`Unable to apply ${label}: heading not found`);
  return `${source.slice(0, index)}${block}\n\n${source.slice(index)}`;
}

function patchSearchSuggestions() {
  const filePath = "src/components/site-search.tsx";
  let source = read(filePath);

  source = replaceOnce(
    source,
    `];\n\nfunction normalize(value: string): string {`,
    `];\n\nconst popularSearches = [\n  "Creep 不移动",\n  "ERR_NOT_IN_RANGE",\n  "Spawn 失败",\n  "Memory 保存目标",\n  "CPU bucket",\n  "Link transferEnergy",\n];\n\nfunction normalize(value: string): string {`,
    "const popularSearches = [",
    "popular search shortcuts",
  );

  source = replaceOnce(
    source,
    `  }, [activeType, normalizedQuery, rankedResults]);\n\n  useEffect(() => {`,
    `  }, [activeType, normalizedQuery, rankedResults]);\n\n  const suggestions = useMemo(\n    () => normalizedQuery ? rankedResults.slice(0, 6) : [],\n    [normalizedQuery, rankedResults],\n  );\n\n  useEffect(() => {`,
    "const suggestions = useMemo(",
    "live search suggestions",
  );

  source = replaceOnce(
    source,
    `      </label>\n\n      <div className="site-search-filters" aria-label="筛选搜索结果">`,
    `      </label>\n\n      <div className="site-search-suggestions" aria-label={normalizedQuery ? "搜索联想" : "热门搜索"}>\n        <span>{normalizedQuery ? "联想" : "热门"}</span>\n        <div>\n          {(normalizedQuery ? suggestions : popularSearches).map((item) => {\n            const label = typeof item === "string"\n              ? item\n              : item.title.replace(/｜.*$/, "").replace(/（.*$/, "");\n            const key = typeof item === "string" ? item : item.id;\n            return (\n              <button key={key} type="button" onClick={() => updateQuery(label)}>\n                {label}\n              </button>\n            );\n          })}\n        </div>\n      </div>\n\n      <div className="site-search-filters" aria-label="筛选搜索结果">`,
    "site-search-suggestions",
    "search suggestion UI",
  );

  source = replaceOnce(
    source,
    `        .site-search-filters { display: flex; flex-wrap: wrap; gap: 8px; }`,
    `        .site-search-suggestions { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 12px; align-items: start; color: var(--muted); font-size: 12px; }\n        .site-search-suggestions > span { padding-top: 10px; font-weight: 700; }\n        .site-search-suggestions > div { display: flex; flex-wrap: wrap; gap: 8px; }\n        .site-search-suggestions button { min-height: 36px; border: 1px solid var(--border); border-radius: 999px; padding: 0 12px; background: var(--surface); color: var(--foreground); cursor: pointer; }\n        .site-search-suggestions button:hover { border-color: var(--foreground); }\n        .site-search-filters { display: flex; flex-wrap: wrap; gap: 8px; }`,
    ".site-search-suggestions {",
    "search suggestion styles",
  );

  write(filePath, source);
}

function patchArticleRevisionCard() {
  const filePath = "src/app/blog/[slug]/page.tsx";
  let source = read(filePath);

  source = replaceOnce(
    source,
    `import { ArticleEnhancements } from "@/components/article-enhancements";`,
    `import { ArticleEnhancements } from "@/components/article-enhancements";\nimport { ArticleRevisionCard } from "@/components/article-revision-card";`,
    "ArticleRevisionCard",
    "article revision import",
  );

  source = replaceOnce(
    source,
    `          </section>\n\n          {isBeginnerPost ? (`,
    `          </section>\n\n          <ArticleRevisionCard slug={post.slug} />\n\n          {isBeginnerPost ? (`,
    "<ArticleRevisionCard slug={post.slug}",
    "article revision card",
  );

  write(filePath, source);
}

function patchHomeDiscovery() {
  const filePath = "src/app/page.tsx";
  let source = read(filePath);

  source = replaceOnce(
    source,
    `import { HomeLearningActions } from "@/components/home-learning-actions";`,
    `import { HomeLearningActions } from "@/components/home-learning-actions";\nimport { HomeMaintenancePanel } from "@/components/home-maintenance-panel";`,
    "HomeMaintenancePanel",
    "home maintenance import",
  );

  source = replaceOnce(
    source,
    `      <section className={styles.quickSection} aria-labelledby="home-quick-title">`,
    `      <Container>\n        <HomeMaintenancePanel />\n      </Container>\n\n      <section className={styles.quickSection} aria-labelledby="home-quick-title">`,
    "<HomeMaintenancePanel />",
    "home maintenance panel",
  );

  source = replaceOnce(
    source,
    `  {\n    href: "/tools/creep-body-calculator",\n    eyebrow: "BODY TOOL",`,
    `  {\n    href: "/tools/room-diagnostics",\n    eyebrow: "ROOM CHECK",\n    title: "诊断房间运行",\n    description: "检查 Spawn、角色、Energy、Controller、工地和 CPU 风险。",\n  },\n  {\n    href: "/tools/creep-body-calculator",\n    eyebrow: "BODY TOOL",`,
    `href: "/tools/room-diagnostics"`,
    "home diagnostics shortcut",
  );

  write(filePath, source);
}

function patchKnowledgeTools() {
  const filePath = "src/app/knowledge/page.tsx";
  let source = read(filePath);

  source = replaceOnce(
    source,
    `const referenceTools = [\n  {\n    eyebrow: "BODY CALCULATOR",`,
    `const referenceTools = [\n  {\n    eyebrow: "ROOM DIAGNOSTICS",\n    title: "房间运行诊断",\n    description: "按 Spawn、角色、Energy、Controller、工地和 CPU 快照定位常见风险。",\n    href: "/tools/room-diagnostics",\n    count: "已上线",\n  },\n  {\n    eyebrow: "BODY CALCULATOR",`,
    "ROOM DIAGNOSTICS",
    "knowledge diagnostics tool",
  );

  const plannedStart = source.indexOf("const plannedTools = [");
  const plannedEnd = source.indexOf("\n];", plannedStart);
  if (plannedStart >= 0 && plannedEnd >= 0 && !source.includes("真实房间截图证据")) {
    const replacement = `const plannedTools = [\n  {\n    title: "常用 API 快速查询",\n    description: "整理新手和基础工程阶段真正会使用的对象、方法、参数与返回值。",\n  },\n  {\n    title: "真实房间截图证据",\n    description: "只使用实际 Screeps 房间、Console 或主循环记录，不用生成图冒充真实运行画面。",\n  },\n];`;
    source = `${source.slice(0, plannedStart)}${replacement}${source.slice(plannedEnd + 3)}`;
  }

  source = source.replace(
    "查询术语、错误码、标签、验证方法、Creep 身体计算器和全部站内内容。",
    "查询术语、错误码、标签、验证方法、房间诊断、Creep 身体计算器和全部站内内容。",
  );

  write(filePath, source);
}

function patchSearchDocuments() {
  const filePath = "src/lib/search.ts";
  let source = read(filePath);

  source = replaceOnce(
    source,
    `  },\n];\n\nexport function getSearchDocuments`,
    `  },\n  {\n    id: "tool:room-diagnostics",\n    type: "工具",\n    title: "Screeps 房间运行诊断",\n    description: "输入 Spawn、角色、Energy、Controller、工地和 CPU 快照，生成按严重程度排序的诊断结果。",\n    href: "/tools/room-diagnostics",\n    meta: "免费工具 · 不连接游戏账号",\n    keywords: [\n      "房间诊断",\n      "断代",\n      "Harvester",\n      "Hauler",\n      "ticksToDowngrade",\n      "CPU bucket",\n      "energyAvailable",\n    ],\n    text: "Screeps room diagnostics Spawn Creep Energy Controller construction sites CPU bucket emergency recovery",\n  },\n];\n\nexport function getSearchDocuments`,
    "tool:room-diagnostics",
    "diagnostics search document",
  );

  write(filePath, source);
}

function patchBodyPresets() {
  const filePath = "src/components/creep-body-calculator.tsx";
  let source = read(filePath);

  const oldPresets = `const presets: Array<{ label: string; counts: Partial<BodyCounts> }> = [\n  { label: "基础工人", counts: { WORK: 1, CARRY: 1, MOVE: 1 } },\n  { label: "运输者", counts: { CARRY: 4, MOVE: 2 } },\n  { label: "升级者", counts: { WORK: 5, CARRY: 1, MOVE: 3 } },\n  { label: "侦察者", counts: { MOVE: 1 } },\n  { label: "近战单位", counts: { TOUGH: 2, ATTACK: 2, MOVE: 2 } },\n];`;
  const newPresets = `const presets: Array<{\n  label: string;\n  description: string;\n  energy: number;\n  counts: Partial<BodyCounts>;\n}> = [\n  { label: "200 基础工人", description: "采集、运输、建造的最低通用身体", energy: 200, counts: { WORK: 1, CARRY: 1, MOVE: 1 } },\n  { label: "300 采集者", description: "两个 WORK，适合早期固定采集", energy: 300, counts: { WORK: 2, CARRY: 1, MOVE: 1 } },\n  { label: "300 运输者", description: "4 CARRY + 2 MOVE，平地满载较均衡", energy: 300, counts: { CARRY: 4, MOVE: 2 } },\n  { label: "550 建设者", description: "3 WORK + 2 CARRY + 3 MOVE", energy: 550, counts: { WORK: 3, CARRY: 2, MOVE: 3 } },\n  { label: "650 升级者", description: "5 WORK，适合稳定供能的 Controller", energy: 650, counts: { WORK: 5, CARRY: 1, MOVE: 2 } },\n  { label: "800 道路运输", description: "10 CARRY + 6 MOVE，满载道路运输", energy: 800, counts: { CARRY: 10, MOVE: 6 } },\n  { label: "560 近战守卫", description: "4 TOUGH + 4 ATTACK + 4 MOVE", energy: 560, counts: { TOUGH: 4, ATTACK: 4, MOVE: 4 } },\n  { label: "侦察者", description: "只用于获取视野，不承担战斗", energy: 50, counts: { MOVE: 1 } },\n];`;
  source = replaceOnce(source, oldPresets, newPresets, "description: \"采集、运输", "expanded body presets");

  source = replaceOnce(
    source,
    `  function applyPreset(partial: Partial<BodyCounts>) {\n    setCounts(createCounts(partial));\n  }`,
    `  function applyPreset(preset: (typeof presets)[number]) {\n    setCounts(createCounts(preset.counts));\n    setEnergyBudget(preset.energy);\n  }`,
    "function applyPreset(preset:",
    "preset budget application",
  );

  source = replaceOnce(
    source,
    `          {presets.map((preset) => (\n            <button key={preset.label} type="button" onClick={() => applyPreset(preset.counts)}>\n              {preset.label}\n            </button>\n          ))}`,
    `          {presets.map((preset) => (\n            <button key={preset.label} type="button" onClick={() => applyPreset(preset)} title={preset.description}>\n              <strong>{preset.label}</strong>\n              <small>{preset.description}</small>\n            </button>\n          ))}`,
    "<small>{preset.description}</small>",
    "preset descriptions",
  );

  source = replaceOnce(
    source,
    `        .body-presets { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 28px; }\n        .body-presets button, .body-stepper button, .body-code button { min-height: 42px; border: 1px solid var(--border); border-radius: 999px; padding: 0 14px; background: var(--background); color: var(--foreground); cursor: pointer; }`,
    `        .body-presets { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px; margin-top: 28px; }\n        .body-presets button { display: grid; gap: 5px; min-height: 72px; align-content: center; border: 1px solid var(--border); border-radius: 15px; padding: 11px 14px; background: var(--background); color: var(--foreground); text-align: left; cursor: pointer; }\n        .body-presets button strong { font-size: 13px; }\n        .body-presets button small { color: var(--muted); font-size: 11px; line-height: 1.4; }\n        .body-stepper button, .body-code button { min-height: 42px; border: 1px solid var(--border); border-radius: 999px; padding: 0 14px; background: var(--background); color: var(--foreground); cursor: pointer; }`,
    ".body-presets button strong",
    "preset card styles",
  );

  source = source.replace(
    `.body-presets button:hover, .body-stepper button:hover:not(:disabled), .body-code button:hover:not(:disabled)`,
    `.body-presets button:hover, .body-stepper button:hover:not(:disabled), .body-code button:hover:not(:disabled)`,
  );

  source = replaceOnce(
    source,
    `        @media (max-width: 720px) { .body-calculator { grid-template-columns: 1fr; } .body-results { position: static; } }`,
    `        @media (max-width: 720px) { .body-calculator { grid-template-columns: 1fr; } .body-results { position: static; } }\n        @media (max-width: 560px) { .body-presets { grid-template-columns: 1fr; } }`,
    "@media (max-width: 560px) { .body-presets",
    "preset mobile styles",
  );

  write(filePath, source);
}

function patchRoutesAndSitemap() {
  const checkPath = "scripts/content-check.mjs";
  let check = read(checkPath);
  check = replaceOnce(
    check,
    `  "/tools/creep-body-calculator",\n  "/feed.xml",`,
    `  "/tools/creep-body-calculator",\n  "/tools/room-diagnostics",\n  "/feed.xml",`,
    `"/tools/room-diagnostics"`,
    "known diagnostics route",
  );
  write(checkPath, check);

  const sitemapPath = "src/app/sitemap.ts";
  let sitemap = read(sitemapPath);
  sitemap = sitemap.replace('glossary: "2026-07-18"', 'glossary: "2026-07-23"');
  sitemap = sitemap.replace('screepsErrors: "2026-07-18"', 'screepsErrors: "2026-07-23"');
  sitemap = sitemap.replace('creepBodyCalculator: "2026-07-22"', 'creepBodyCalculator: "2026-07-23"');
  sitemap = replaceOnce(
    sitemap,
    `  creepBodyCalculator: "2026-07-23",\n};`,
    `  creepBodyCalculator: "2026-07-23",\n  roomDiagnostics: "2026-07-23",\n};`,
    "roomDiagnostics:",
    "diagnostics sitemap date",
  );
  sitemap = replaceOnce(
    sitemap,
    `    {\n      url: \`${"${siteConfig.url}"}/tools/creep-body-calculator\`,\n      lastModified: new Date(staticPageDates.creepBodyCalculator),\n      changeFrequency: "monthly",\n      priority: 0.86,\n    },`,
    `    {\n      url: \`${"${siteConfig.url}"}/tools/room-diagnostics\`,\n      lastModified: new Date(staticPageDates.roomDiagnostics),\n      changeFrequency: "monthly",\n      priority: 0.88,\n    },\n    {\n      url: \`${"${siteConfig.url}"}/tools/creep-body-calculator\`,\n      lastModified: new Date(staticPageDates.creepBodyCalculator),\n      changeFrequency: "monthly",\n      priority: 0.86,\n    },`,
    "/tools/room-diagnostics",
    "diagnostics sitemap entry",
  );
  write(sitemapPath, sitemap);
}

function patchArticleDiagrams() {
  const items = [
    {
      filePath: "content/posts/screeps-creep-working-state.md",
      heading: "## 适用边界",
      marker: "/diagrams/creep-working-state.svg",
      block: `## 状态转换图\n\n![Creep 在取能状态与工作状态之间切换的流程图：空载转为取能，满载转为工作，部分装载保持当前状态](/diagrams/creep-working-state.svg)\n\n图中只表达本文的两阶段状态边界，不代表完整任务调度系统。`,
    },
    {
      filePath: "content/posts/screeps-link-transfer-energy.md",
      heading: "## 返回值排查",
      marker: "/diagrams/link-energy-flow.svg",
      block: `## Link 网络流程图\n\n![Source Link 经过统一调度模块向 Controller Link 或 Storage Link 发送 Energy 的流程图](/diagrams/link-energy-flow.svg)\n\n流程图强调固定 ID、同房间、cooldown、目标容量和每 tick 统一调度。它不是具体房间截图，真实 Link 位置仍以自己的房间布局为准。`,
    },
    {
      filePath: "content/posts/screeps-observer-observe-room.md",
      heading: "## 离线模拟结果",
      marker: "/diagrams/observer-two-tick.svg",
      block: `## 两 tick 时序图\n\n![Observer 在 tick N 提交观察请求，并在 tick N 加 1 从 Game.rooms 读取目标房间的时序图](/diagrams/observer-two-tick.svg)\n\n这张图解释 API 时序，不冒充真实房间画面。正式验证仍需要保存实际 requestedAt、目标房间和后续 tick 结果。`,
    },
  ];

  for (const item of items) {
    let source = read(item.filePath);
    source = insertBeforeHeading(source, item.heading, item.block, item.marker, item.filePath);
    source = source.replace('updatedAt: "2026-07-22"', 'updatedAt: "2026-07-23"');
    write(item.filePath, source);
  }
}

function patchChangelog() {
  const filePath = "src/lib/changelog.ts";
  let source = read(filePath);
  source = replaceOnce(
    source,
    `export const changelogEntries: ChangelogEntry[] = [\n`,
    `export const changelogEntries: ChangelogEntry[] = [\n  {\n    id: "2026-07-23-p2-discovery-tools",\n    date: "2026-07-23",\n    type: "网站",\n    title: "完成 P2 内容发现、图示与诊断工具升级",\n    summary:\n      "增加搜索联想、热门问题与最近修正、文章级修订原因、房间运行诊断、更多术语和错误码文章入口、角色身体预设，以及三张可维护的技术流程图。真实游戏截图仍只接受实际房间或 Console 证据。",\n    links: [\n      { label: "使用房间诊断", href: "/tools/room-diagnostics" },\n      { label: "使用站内搜索", href: "/search" },\n      { label: "查看术语表", href: "/glossary" },\n    ],\n  },\n  {\n    id: "2026-07-23-article-revision-reasons",\n    date: "2026-07-23",\n    type: "内容",\n    title: "重点文章开始公开修订原因",\n    summary:\n      "高风险与近期修正文章会显示本次修改原因、具体变化和日期，帮助读者区分普通更新时间与实质技术修订。",\n    links: [{ label: "查看 Tower 维修文章", href: "/blog/screeps-tower-repair-threshold" }],\n  },\n`,
    "2026-07-23-p2-discovery-tools",
    "P2 changelog entries",
  );
  write(filePath, source);
}

patchSearchSuggestions();
patchArticleRevisionCard();
patchHomeDiscovery();
patchKnowledgeTools();
patchSearchDocuments();
patchBodyPresets();
patchRoutesAndSitemap();
patchArticleDiagrams();
patchChangelog();

console.log("P2 discovery, revision, glossary, preset, diagram and diagnostics enhancements applied.");
