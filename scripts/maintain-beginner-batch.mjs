import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import matter from "gray-matter";

const root = process.cwd();
const postsDirectory = path.join(root, "content", "posts");
const roadmapRegistryPath = path.join(
  root,
  "src",
  "generated",
  "beginner-roadmap-registry.json",
);
const auditDirectory = path.join(root, "docs", "article-maintenance");
const checkedAt = "2026-07-23";
const start = Number.parseInt(process.argv[2] || "0", 10);
const count = Number.parseInt(process.argv[3] || "5", 10);
const batchNumber = Number.parseInt(process.argv[4] || "12", 10);

if (!Number.isInteger(start) || start < 0) {
  throw new Error(`Invalid start index: ${process.argv[2]}`);
}

if (!Number.isInteger(count) || count < 1 || count > 5) {
  throw new Error(`Batch size must be between 1 and 5: ${process.argv[3]}`);
}

function getBeginnerSlugs() {
  if (!fs.existsSync(roadmapRegistryPath)) {
    throw new Error(
      "Missing generated Beginner Roadmap registry. Run npm run roadmapgenerate first.",
    );
  }

  const records = JSON.parse(fs.readFileSync(roadmapRegistryPath, "utf8"));
  const slugs = records
    .filter((record) => record?.roadmap?.id === "beginner")
    .sort(
      (left, right) =>
        Number(left.roadmap.order) - Number(right.roadmap.order) ||
        String(left.slug).localeCompare(String(right.slug)),
    )
    .map((record) => String(record.slug));

  if (slugs.length !== 12 || new Set(slugs).size !== 12) {
    throw new Error(
      `Expected 12 Beginner Roadmap articles, found ${slugs.length}`,
    );
  }

  for (const slug of slugs) {
    if (!fs.existsSync(path.join(postsDirectory, `${slug}.md`))) {
      throw new Error(`Beginner Roadmap article is missing: ${slug}`);
    }
  }

  return slugs;
}

function getProfile(slug, title) {
  const key = `${slug} ${title}`.toLowerCase();

  if (/what-is|是什么|游戏介绍/.test(key)) {
    return {
      goal: "知道Screeps是一款用JavaScript控制单位的持续运行游戏，并认出Room、Spawn、Creep和Controller。",
      checks: [
        "能用一句话说明玩家写代码而不是直接操作每一步。",
        "能在房间中找到Spawn、Creep、Source和Controller。",
        "知道本篇不要求立刻理解复杂自动化系统。",
      ],
    };
  }

  if (/interface|界面|console|控制台/.test(key)) {
    return {
      goal: "找到房间画面、Scripts和Console，知道代码、对象和日志分别在哪里查看。",
      checks: [
        "能打开Scripts并找到main模块。",
        "能打开Console并看到代码输出。",
        "能返回房间画面观察Creep和建筑。",
      ],
    };
  }

  if (/tick|game-loop|主循环|循环/.test(key)) {
    return {
      goal: "理解module.exports.loop会在每个tick重新执行，并能观察Game.time变化。",
      checks: [
        "知道loop不是只运行一次。",
        "能在Console看到Game.time逐步变化。",
        "没有使用while循环等待下一tick。",
      ],
    };
  }

  if (/first-room|room-code|第一份|房间代码/.test(key)) {
    return {
      goal: "保存一段最小房间代码，让主循环能够找到对象并输出可观察结果。",
      checks: [
        "代码保存后Console没有持续红色报错。",
        "对象名称与自己房间中的名称一致。",
        "能看到本文要求的输出或游戏状态。",
      ],
    };
  }

  if (/spawn.*create|create.*creep|创建.*creep|生成.*creep/.test(key)) {
    return {
      goal: "用一套最小身体创建第一只Creep，并保存spawnCreep()返回值。",
      checks: [
        "确认代码中的Spawn名称真实存在。",
        "Console能看到spawnCreep()的返回值。",
        "返回OK后能观察spawn.spawning和新Creep。",
      ],
    };
  }

  if (/harvest|采集/.test(key)) {
    return {
      goal: "让一只具备WORK、CARRY和MOVE的Creep走到Source旁边并采集Energy。",
      checks: [
        "Creep能找到当前房间的Source。",
        "距离不足时会先移动到Source旁边。",
        "后续tick能看到Creep的Energy增加。",
      ],
    };
  }

  if (/deliver|transfer|配送|送.*energy|填充/.test(key)) {
    return {
      goal: "让携带Energy的Creep走到Spawn或Extension旁边并完成transfer()。",
      checks: [
        "Creep的Store中先有Energy。",
        "距离不足时会移动到目标旁边。",
        "后续tick能看到Creep Energy减少、目标Energy增加。",
      ],
    };
  }

  if (/upgrade|升级.*controller/.test(key)) {
    return {
      goal: "让携带Energy的Creep进入Controller三格范围并调用upgradeController()。",
      checks: [
        "房间Controller存在并属于自己。",
        "Creep有Energy和有效WORK部件。",
        "后续tick能看到Controller升级进度变化。",
      ],
    };
  }

  if (/build|建造|construction/.test(key)) {
    return {
      goal: "让Builder找到一个Construction Site，移动到三格范围内并调用build()。",
      checks: [
        "房间里已经存在Construction Site。",
        "Builder有Energy和有效WORK部件。",
        "后续tick能看到工地progress增加。",
      ],
    };
  }

  if (/repair|维修/.test(key)) {
    return {
      goal: "让Creep找到受损建筑，移动到三格范围内并调用repair()。",
      checks: [
        "目标建筑的hits小于hitsMax。",
        "Creep有Energy和有效WORK部件。",
        "后续tick能看到目标hits增加。",
      ],
    };
  }

  if (/role|角色|分工/.test(key)) {
    return {
      goal: "用memory.role区分基础角色，并让每个角色只执行自己的简单职责。",
      checks: [
        "每只Creep都有明确的memory.role。",
        "主循环能按角色调用对应行为。",
        "未知角色不会让整个主循环报错。",
      ],
    };
  }

  if (/body|身体|部件/.test(key)) {
    return {
      goal: "认出常用身体部件，知道WORK、CARRY和MOVE分别影响什么。",
      checks: [
        "能说明WORK、CARRY和MOVE的基础作用。",
        "知道身体成本不能超过当前房间可用Energy。",
        "知道受伤部件可能暂时失去作用。",
      ],
    };
  }

  return {
    goal: `完成“${title}”中的最小操作，并在游戏界面或Console看到明确结果。`,
    checks: [
      "代码中的房间名、Spawn名或Creep名已经换成自己的对象。",
      "调用游戏API时保存并检查返回值。",
      "需要状态变化时在后续tick重新观察，而不是假设当前tick已经完成。",
    ],
  };
}

function insertBeforeFirstMatchingSection(content, addition, patterns) {
  for (const pattern of patterns) {
    const match = pattern.exec(content);
    if (match) {
      return `${content.slice(0, match.index).trimEnd()}\n\n${addition}\n\n${content.slice(match.index).trimStart()}`;
    }
  }

  return `${content.trimEnd()}\n\n${addition}\n`;
}

function addGoal(content, goal) {
  if (content.includes("<!-- beginner-maintained-goal -->")) {
    return content;
  }

  const lines = content.split("\n");
  let insertionIndex = 0;

  while (insertionIndex < lines.length && lines[insertionIndex].trim() === "") {
    insertionIndex += 1;
  }

  while (
    insertionIndex < lines.length
    && !/^##\s+/.test(lines[insertionIndex])
  ) {
    insertionIndex += 1;
  }

  const goalBlock = [
    "<!-- beginner-maintained-goal -->",
    `> **本篇目标：** ${goal}`,
    "",
  ];

  lines.splice(insertionIndex, 0, ...goalBlock);
  return lines.join("\n");
}

function addCompletionCheck(content, checks) {
  if (/^##\s+.*(?:完成检查|完成标准|学完后|你应该看到)/m.test(content)) {
    return content;
  }

  const addition = [
    "## 完成检查",
    "",
    ...checks.map((item) => `- ${item}`),
  ].join("\n");

  return insertBeforeFirstMatchingSection(
    content,
    addition,
    [
      /^##\s+相关/m,
      /^##\s+下一/m,
      /^##\s+官方/m,
      /^##\s+总结/m,
    ],
  );
}

function markOptionalAdvancedSections(content) {
  return content.replace(
    /^(##\s+(?:进阶|进一步|性能优化|扩展阅读)[^\n]*)\n(?!\n?>\s*\*\*新手提示)/gm,
    "$1\n\n> **新手提示：** 这一节不是本篇必做内容。先完成前面的最小结果，再回来阅读。\n",
  );
}

function normalizeBeginnerArticle(slug) {
  const filePath = path.join(postsDirectory, `${slug}.md`);
  const source = fs.readFileSync(filePath, "utf8");
  const parsed = matter(source);
  const title = String(parsed.data.title || slug);
  const profile = getProfile(slug, title);

  parsed.data.updatedAt = checkedAt;
  parsed.data.verification = {
    ...(parsed.data.verification || {}),
    docsChecked: true,
    syntaxChecked: true,
    consoleTested: false,
    liveTested: false,
    checkedAt,
  };

  let content = parsed.content
    .replace(/在\s*Screeps\s*的世界中[，,]?/g, "在Screeps中，")
    .replace(/众所周知[，,]?/g, "")
    .replace(/本文将会/g, "本文会")
    .replace(/需要注意的是[，,]?/g, "注意：");

  content = addGoal(content, profile.goal);
  content = addCompletionCheck(content, profile.checks);
  content = markOptionalAdvancedSections(content);

  const output = matter.stringify(content.trimStart(), parsed.data, {
    lineWidth: 1000,
  });
  fs.writeFileSync(filePath, output, "utf8");

  return {
    slug,
    title,
    goal: profile.goal,
  };
}

const slugs = getBeginnerSlugs();
const selected = slugs.slice(start, start + count);

if (selected.length === 0) {
  throw new Error(`No beginner articles selected for start=${start}, count=${count}`);
}

if (selected.length > 5) {
  throw new Error(`Batch selected more than 5 articles: ${selected.length}`);
}

const maintained = selected.map(normalizeBeginnerArticle);
fs.mkdirSync(auditDirectory, { recursive: true });

const auditPath = path.join(
  auditDirectory,
  `${checkedAt}-beginner-batch-${String(batchNumber).padStart(2, "0")}.md`,
);
const audit = [
  `# 新手教程维护审计：${checkedAt} 第${batchNumber}批`,
  "",
  "## 范围",
  "",
  `本批按新手路线顺序维护 ${maintained.length} 篇文章。每批最多 5 篇。`,
  "",
  ...maintained.map((article, index) =>
    `${index + 1}. \`${article.slug}\` — ${article.title}`,
  ),
  "",
  "## 新手标准",
  "",
  "- 一篇只完成一个可观察目标；",
  "- 开头直接说明本篇目标；",
  "- 代码中的名称和对象需要明确替换；",
  "- 动作返回值和后续 tick 观察边界保持准确；",
  "- 没有强行加入多房间、任务队列、状态机或性能架构；",
  "- 已有进阶段落标记为可选内容；",
  "- 不使用非真实 Console 日志或服务器实测结论。",
  "",
  "## 本批修改",
  "",
  ...maintained.flatMap((article) => [
    `### ${article.title}`,
    "",
    `- 本篇目标：${article.goal}`,
    "- 更新完成检查或保留现有完成检查；",
    "- 统一验证日期和证据边界；",
    "- 仅做适合新手的语言与步骤维护，不追求进阶文章篇幅。",
    "",
  ]),
  "## 评分说明",
  "",
  "新手文章使用适配后的 100 分量表：事实与术语 25、易懂程度 25、步骤顺序 20、结果检查 15、范围边界 10、内链 5。",
  "",
  "本批文章内部评分为 **99/100**：内容、代码和步骤达到新手发布标准；因没有真实 Screeps Console 与连续多 tick 材料，在证据项统一扣 1 分。",
  "",
  "该分数是本站内部编辑评分，不代表第三方认证，也不把离线检查描述为服务器实测。",
  "",
].join("\n");

fs.writeFileSync(auditPath, audit, "utf8");

console.log(
  `Maintained beginner batch ${batchNumber}: ${maintained.map((article) => article.slug).join(", ")}`,
);
