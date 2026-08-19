import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

const root = process.cwd();
const postsDirectory = path.join(root, "content", "posts");
const roadmapMetadataDirectory = path.join(root, "content", "roadmap-metadata");
const sitePath = path.join(root, "src", "lib", "site.ts");
const errors = [];
const warnings = [];

const descriptionTemplatePhrases = [
  "附完整检查顺序",
  "最小代码和适用边界",
  "完整示例和失败边界",
  "按返回值和位置条件",
  "给出前提检查",
  "提供变量完整的最小示例",
];

const articleRules = {
  "screeps-storage-energy-usage": {
    forbidden: ["预测价格", "承诺收益", "订单", "市场操作", "交易 Energy"],
    required: ["room.storage", "Storage 与 Container", "withdraw", "transfer"],
  },
  "screeps-clean-dead-creep-memory": {
    forbidden: ["ERR_NOT_IN_RANGE", "cooldown", "目标容量"],
    required: ["Memory.creeps", "Game.creeps", "delete"],
  },
  "screeps-roomvisual-debug": {
    forbidden: [
      "一次性高影响动作",
      "市场操作",
      "交易 Energy",
      "保存动作返回值",
      "动作错误常量",
    ],
    required: ["每个 tick", "visual", "text", "circle", "line", "CPU"],
  },
  "screeps-tower-heal-creeps": {
    forbidden: ["ERR_NOT_IN_RANGE"],
    required: [
      "FIND_MY_CREEPS",
      "hitsMax",
      "tower.heal",
      "findClosestByRange",
      "ERR_NOT_OWNER",
      "ERR_NOT_ENOUGH_ENERGY",
      "ERR_INVALID_TARGET",
      "ERR_RCL_NOT_ENOUGH",
    ],
  },
  "screeps-rawmemory-segments": {
    forbidden: ["本 tick 写入后立即从目标 Segment 读取"],
    required: [
      "RawMemory.segments",
      "setActiveSegments",
      "下一 tick",
      "`0` 到 `99`",
      "最多请求 10",
      "undefined",
      "空字符串",
      "离线模拟",
      "JSON",
    ],
  },
  "screeps-pathfinder-costmatrix": {
    required: [
      "PathFinder.CostMatrix",
      "roomCallback",
      "return false",
      "return undefined",
      "search.incomplete",
      "255",
      "离线模拟",
    ],
  },
  "screeps-tower-repair-threshold": {
    required: [
      "FIND_HOSTILE_CREEPS",
      "FIND_MY_CREEPS",
      "TOWER_REPAIR_ENERGY_RESERVE",
      "TOWER_ENERGY_COST",
      "tower.repair",
      "Wall和Rampart",
      "离线模拟",
    ],
  },
  "screeps-structure-destroy": {
    required: [
      "ALLOWED_DESTROY_TYPES",
      "DESTROY_EXTENSION",
      "request.enabled = false",
      "structure.destroy",
      "ERR_BUSY",
      "离线模拟",
    ],
  },
  "screeps-lab-run-reaction": {
    required: ["runReaction", "REACTIONS", "cooldown", "ERR_RCL_NOT_ENOUGH"],
  },
  "screeps-lab-boost-creep": {
    required: ["boostCreep", "mineralType", "body", "ERR_RCL_NOT_ENOUGH"],
  },
  "screeps-factory-produce": {
    required: ["COMMODITIES", "produce", "cooldown", "level"],
  },
  "screeps-power-spawn-process-power": {
    required: ["processPower", "RESOURCE_POWER", "RESOURCE_ENERGY", "ERR_RCL_NOT_ENOUGH"],
  },
  "screeps-observer-observe-room": {
    required: [
      "observeRoom",
      "下一 tick",
      "Game.rooms",
      "Memory.observerState",
      "requestedAt",
      "ERR_RCL_NOT_ENOUGH",
      "离线模拟",
    ],
  },
  "screeps-market-deal": {
    required: [
      "Memory.market",
      "Game.market.credits",
      "calcTransactionCost",
      "result === OK",
      "失败后必须人工",
      "真实消耗 Credits",
    ],
  },
  "screeps-market-create-order": {
    required: [
      "Memory.market",
      "Game.market.orders",
      "result === OK",
      "失败后必须人工",
      "Credits 费用",
    ],
  },
  "screeps-terminal-send-resources": {
    required: [
      "Memory.terminal",
      "calcTransactionCost",
      "result === OK",
      "失败后必须人工",
      "真实发送",
    ],
  },
  "screeps-controller-activate-safe-mode": {
    required: [
      "Memory.safeModeRequest",
      "delete Memory.safeModeRequest",
      "失败后",
      "激活次数",
      "Console",
    ],
  },
  "screeps-nuker-launch-checklist": {
    required: [
      "Memory.nuker",
      "buildNukeConfirmation",
      "request.enabled = false",
      "NUKER_RANGE",
      "ERR_INVALID_TARGET",
      "result === OK",
      "失败后必须人工",
      "不可逆",
      "RESOURCE_GHODIUM",
      "离线模拟",
    ],
  },
};

const globalTemplateResidues = [
  "这段代码的重点不是架构，而是让每个可能为空的对象都有检查，并把关键调用结果保留下来。",
  "返回其他错误常量时，回到官方 API 对照当前对象、资源、容量、所有权和等待条件。",
  "这类代码最容易出错的地方不是",
  "遇到这个问题时，先不要继续增加",
  "本文只解决一件事",
  "不搭建大型框架",
  "先确认对象存在，再检查资源、容量、等待状态和所有权",
  "提供变量完整的最小示例、边界和验证清单",
];

const marketSlugs = new Set([
  "screeps-market-create-order",
  "screeps-market-deal",
  "screeps-terminal-send-resources",
]);

const marketBoundarySlugs = new Set([
  "screeps-lab-run-reaction",
]);

const knowledgeRoutes = [
  "/knowledge/memory-engineering",
  "/knowledge/spawn-lifecycle",
  "/knowledge/room-economy",
  "/knowledge/movement-vision",
  "/knowledge/controller-control",
  "/knowledge/construction-defense",
  "/knowledge/market-advanced-resources",
  "/knowledge/operations-debugging",
];

function addError(message) {
  errors.push(message);
}

function addWarning(message) {
  warnings.push(message);
}

function stripCodeAndLinks(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]+`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}

function chineseCount(value) {
  return value.match(/[\u3400-\u9fff]/g)?.length ?? 0;
}

function addOccurrence(map, text, fileName) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return;
  if (!map.has(normalized)) map.set(normalized, new Set());
  map.get(normalized).add(fileName);
}

function normalizeDescription(value) {
  const screepsObjects = [
    "Screeps", "RoomVisual", "PowerCreep", "Controller", "Structure", "Terminal",
    "Factory", "Observer", "Nuker", "Rampart", "Storage", "Source", "Spawn",
    "Tower", "Creep", "RoomPosition", "PathFinder", "RawMemory", "Memory",
    "Energy", "Lab", "Wall", "Flag", "Game", "CPU",
  ];

  let normalized = String(value ?? "").normalize("NFKC").toLowerCase();
  for (const objectName of screepsObjects) {
    normalized = normalized.replaceAll(objectName.toLowerCase(), "");
  }

  return normalized
    .replace(/[a-z][a-z0-9_.]*(?:\(\))?/gi, "")
    .replace(/[0-9０-９]/g, "")
    .replace(/[^\p{Script=Han}]/gu, "");
}

function bigramDice(left, right) {
  if (left.length < 2 || right.length < 2) return 0;

  const leftPairs = new Map();
  for (let index = 0; index < left.length - 1; index += 1) {
    const pair = left.slice(index, index + 2);
    leftPairs.set(pair, (leftPairs.get(pair) ?? 0) + 1);
  }

  let overlap = 0;
  for (let index = 0; index < right.length - 1; index += 1) {
    const pair = right.slice(index, index + 2);
    const remaining = leftPairs.get(pair) ?? 0;
    if (remaining > 0) {
      overlap += 1;
      leftPairs.set(pair, remaining - 1);
    }
  }

  return (2 * overlap) / (left.length + right.length - 2);
}

const files = fs
  .readdirSync(postsDirectory)
  .filter((fileName) => fileName.endsWith(".md"))
  .sort();

const slugs = new Set();
const titles = new Map();
const sentenceOccurrences = new Map();
const paragraphOccurrences = new Map();
const descriptionRecords = [];
const knownRoutes = new Set([
  "/",
  "/about",
  "/beginner",
  "/blog",
  "/knowledge",
  ...knowledgeRoutes,
  "/search",
  "/glossary",
  "/screeps-errors",
  "/tags",
  "/now",
  "/changelog",
  "/verification",
  "/tools/creep-body-calculator",
  "/tools/room-diagnostics",
  "/feed.xml",
]);

for (const fileName of files) {
  const slug = fileName.replace(/\.md$/, "");
  const filePath = path.join(postsDirectory, fileName);
  const source = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(source);
  const code = [...content.matchAll(/```(?:js|javascript)\s*\n([\s\S]*?)```/gi)]
    .map((match) => match[1])
    .join("\n");
  const plainContent = stripCodeAndLinks(content);

  if (source.includes("tokens truncated")) {
    addError(`${fileName}: 正文包含工具截断残留`);
  }

  for (const residue of globalTemplateResidues) {
    if (source.includes(residue)) {
      addError(`${fileName}: 正文包含批量模板句“${residue}”`);
    }
  }

  const rule = articleRules[slug];

  const p0OrderChecks = {
    "screeps-tower-repair-threshold": ["FIND_HOSTILE_CREEPS", "tower.repair"],
    "screeps-structure-destroy": ["request.enabled = false", "structure.destroy"],
    "screeps-nuker-launch-checklist": ["request.enabled = false", "nuker.launchNuke"],
    "screeps-observer-observe-room": ["Game.rooms[state.requestedRoom]", "observer.observeRoom"],
  };

  const orderCheck = p0OrderChecks[slug];
  if (orderCheck) {
    const [guardText, actionText] = orderCheck;
    const guardIndex = code.indexOf(guardText);
    const actionIndex = code.indexOf(actionText);
    if (guardIndex < 0 || actionIndex < 0 || guardIndex > actionIndex) {
      addError(`${fileName}: P0 安全顺序不正确，必须先出现“${guardText}”，再执行“${actionText}”`);
    }
  }

  if (rule) {
    for (const forbidden of rule.forbidden ?? []) {
      const matchingLines = content
        .split("\n")
        .filter((line) => line.includes(forbidden));
      const onlyExplicitNegation =
        slug === "screeps-tower-heal-creeps"
        && forbidden === "ERR_NOT_IN_RANGE"
        && matchingLines.length > 0
        && matchingLines.every((line) => /不会|不返回|不在/.test(line));

      if (matchingLines.length > 0 && !onlyExplicitNegation) {
        addError(`${fileName}: 出现与主题不符的“${forbidden}”`);
      }
    }

    for (const required of rule.required ?? []) {
      if (!content.includes(required)) {
        addError(`${fileName}: 缺少主题必需内容“${required}”`);
      }
    }
  }

  const marketScanText = plainContent.replace(/部件价格/g, "");
  const marketResidueLines = marketScanText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => /预测价格|承诺收益|订单|成交|市场操作/.test(line))
    .filter((line) => !/(?:与市场成交不同|不(?:属于|是|涉及|执行|包含).*市场操作|不(?:涉及|创建|提交|处理).*订单|不(?:进行|执行|涉及).*成交)/.test(line));

  if (
    !marketSlugs.has(slug)
    && !marketBoundarySlugs.has(slug)
    && marketResidueLines.length > 0
  ) {
    const excerpts = marketResidueLines.slice(0, 3).join("｜");
    addWarning(`${fileName}: 非市场文章出现疑似市场残留：${excerpts}`);
  }

  const rangeScanText = content
    .split("\n")
    .filter((line) => !/不会返回|不返回|不替代|区别/.test(line))
    .join("\n");
  if (/ERR_NOT_IN_RANGE/.test(rangeScanText)) {
    const hasRelevantAction = /\.(?:attack|build|claimController|dismantle|drop|harvest|heal|move|moveTo|pickup|rangedAttack|rangedHeal|repair|reserveController|transfer|transferEnergy|upgradeController|withdraw|renewCreep|recycleCreep|boostCreep|runReaction|observeRoom|launchNuke)\s*\(/.test(code);
    if (!hasRelevantAction && slug !== "screeps-err-not-in-range") {
      addWarning(`${fileName}: ERR_NOT_IN_RANGE 未与相关动作代码同时出现`);
    }
  }

  if (/cooldown/.test(plainContent)) {
    const hasWaitingObject = /\.cooldown|safeModeCooldown|STRUCTURE_(?:EXTRACTOR|FACTORY|LAB|LINK|NUKER|TERMINAL)/.test(content);
    if (!hasWaitingObject) {
      addWarning(`${fileName}: 提到 cooldown，但正文没有可核对的对应对象`);
    }
  }

  if (/Memory/i.test(data.title ?? "") && /目标容量/.test(plainContent)) {
    addWarning(`${fileName}: Memory 主题出现“目标容量”，请检查跨主题残留`);
  }

  if (/是什么|为什么/.test(data.title ?? "")) {
    const productionTerms = plainContent.match(/调度|任务队列|状态机|重试策略|生产级/g)?.length ?? 0;
    if (productionTerms >= 3) {
      addWarning(`${fileName}: 概念文章包含多段生产级调度内容`);
    }
  }

  const titleApis = [...String(data.title ?? "").matchAll(/([A-Za-z][A-Za-z0-9_.]+)\(\)/g)]
    .map((match) => match[1]);
  for (const api of titleApis) {
    const method = api.split(".").at(-1);
    if (!code.includes(`${method}(`)) {
      addWarning(`${fileName}: 标题核心 API ${api}() 没有出现在 JavaScript 代码块中`);
    }
  }

  const descriptionApis = [...String(data.description ?? "").matchAll(/([A-Za-z][A-Za-z0-9_.]+)\(\)/g)]
    .map((match) => match[1]);
  for (const api of descriptionApis) {
    const method = api.split(".").at(-1);
    if (!content.includes(method)) {
      addWarning(`${fileName}: description 提到的操作 ${api}() 没有出现在正文中`);
    }
  }

  const levelTwoHeadings = [...content.matchAll(/^##\s+(.+)$/gm)]
    .map((match) => match[1].trim());
  const duplicateHeadings = levelTwoHeadings.filter(
    (heading, index) => levelTwoHeadings.indexOf(heading) !== index,
  );
  if (duplicateHeadings.length > 0) {
    addError(`${fileName}: 二级标题重复 ${[...new Set(duplicateHeadings)].join(", ")}`);
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    addError(`${fileName}: slug 只能使用小写字母、数字和连字符`);
  }
  if (slugs.has(slug)) addError(`${fileName}: slug 重复`);
  slugs.add(slug);
  knownRoutes.add(`/blog/${slug}`);

  for (const field of ["title", "description", "publishedAt", "category"]) {
    if (typeof data[field] !== "string" || data[field].trim() === "") {
      addError(`${fileName}: 缺少 ${field}`);
    }
  }

  if (typeof data.title === "string") {
    const normalizedTitle = data.title.trim();
    const existing = titles.get(normalizedTitle);
    if (existing) addError(`${fileName}: 标题与 ${existing} 重复`);
    titles.set(normalizedTitle, fileName);
    if (normalizedTitle.length > 80) addWarning(`${fileName}: 标题超过 80 个字符`);
  }

  if (typeof data.description === "string") {
    const length = data.description.trim().length;
    if (length < 24) addWarning(`${fileName}: description 少于 24 个字符`);
    if (length > 180) addWarning(`${fileName}: description 超过 180 个字符`);
    for (const phrase of descriptionTemplatePhrases) {
      if (data.description.includes(phrase)) {
        addError(`${fileName}: description 包含模板式表达“${phrase}”`);
      }
    }
    descriptionRecords.push({
      fileName,
      normalized: normalizeDescription(data.description),
    });
  }

  if (!Array.isArray(data.tags) || data.tags.length < 3) {
    addError(`${fileName}: 需要 3 至 5 个可复用标签`);
  } else if (data.tags.length > 5) {
    addError(`${fileName}: 标签超过 5 个`);
  } else if (data.tags.some((tag) => typeof tag !== "string" || tag.trim() === "")) {
    addError(`${fileName}: 标签必须是非空字符串`);
  } else if (data.tags.some((tag) => tag === data.title || tag.length > 28)) {
    addWarning(`${fileName}: 存在标题式长标签，请确认是否可复用`);
  }

  if (!data.verification || typeof data.verification !== "object") {
    addError(`${fileName}: 缺少 verification 验证状态`);
  } else {
    for (const field of ["docsChecked", "syntaxChecked", "consoleTested", "liveTested"]) {
      if (typeof data.verification[field] !== "boolean") {
        addError(`${fileName}: verification.${field} 必须是布尔值`);
      }
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.verification.checkedAt ?? "")) {
      addError(`${fileName}: verification.checkedAt 必须使用 YYYY-MM-DD`);
    }

    const hasRuntimeEvidence = data.verification.consoleTested || data.verification.liveTested;
    if (hasRuntimeEvidence) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(data.verification.testedAt ?? "")) {
        addError(`${fileName}: 已标记运行验证时必须填写 verification.testedAt`);
      }
      for (const field of ["testEnvironment", "testResult"]) {
        if (typeof data.verification[field] !== "string" || data.verification[field].trim() === "") {
          addError(`${fileName}: 已标记运行验证时必须填写 verification.${field}`);
        }
      }
      if (/离线模拟|不是\s*Screeps\s*官方服务器/i.test(data.verification.testEnvironment ?? "")) {
        addError(`${fileName}: 已标记 Console/真实主循环验证时，测试环境不能仍写成离线模拟`);
      }
    } else {
      const hasOfflineEvidence = Boolean(
        data.verification.testedAt
        || data.verification.testEnvironment
        || data.verification.testResult,
      );

      if (hasOfflineEvidence) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(data.verification.testedAt ?? "")) {
          addError(`${fileName}: 有离线验证记录时必须填写 verification.testedAt`);
        }
        for (const field of ["testEnvironment", "testResult"]) {
          if (typeof data.verification[field] !== "string" || data.verification[field].trim() === "") {
            addError(`${fileName}: 有离线验证记录时必须填写 verification.${field}`);
          }
        }

        const environment = String(data.verification.testEnvironment ?? "");
        if (!environment.includes("离线模拟") || !/不是\s*Screeps\s*官方服务器/i.test(environment)) {
          addError(`${fileName}: 未标记运行验证时，验证环境必须明确写出“离线模拟”和“不是 Screeps 官方服务器”`);
        }
      }
    }
  }

  if (
    typeof data.updatedAt === "string"
    && typeof data.publishedAt === "string"
    && new Date(data.updatedAt).getTime() < new Date(data.publishedAt).getTime()
  ) {
    addError(`${fileName}: updatedAt 不能早于 publishedAt`);
  }

  const markdownImages = [...content.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)];
  for (const image of markdownImages) {
    if (!image[1].trim()) addError(`${fileName}: 图片缺少 ALT 文本`);
  }

  for (const paragraph of plainContent.split(/\n\s*\n/)) {
    const normalized = paragraph.replace(/^>\s*/gm, "").trim();
    if (chineseCount(normalized) >= 30) {
      addOccurrence(paragraphOccurrences, normalized, fileName);
    }
  }

  for (const sentence of plainContent.split(/(?<=[。！？])/u)) {
    const normalized = sentence.replace(/^>\s*/gm, "").trim();
    if (chineseCount(normalized) >= 30) {
      addOccurrence(sentenceOccurrences, normalized, fileName);
    }
  }
}

for (let leftIndex = 0; leftIndex < descriptionRecords.length; leftIndex += 1) {
  for (let rightIndex = leftIndex + 1; rightIndex < descriptionRecords.length; rightIndex += 1) {
    const left = descriptionRecords[leftIndex];
    const right = descriptionRecords[rightIndex];
    if (left.normalized.length < 12 || right.normalized.length < 12) continue;

    const similarity = bigramDice(left.normalized, right.normalized);
    const percent = Math.round(similarity * 100);
    if (similarity > 0.85) {
      addError(`${left.fileName} 与 ${right.fileName}: description 去除对象/API 后相似度 ${percent}%`);
    } else if (similarity > 0.75) {
      addWarning(`${left.fileName} 与 ${right.fileName}: description 去除对象/API 后相似度 ${percent}%`);
    }
  }
}

for (const [sentence, involvedFiles] of sentenceOccurrences) {
  if (involvedFiles.size >= 5) {
    addWarning(`重复句出现在 ${involvedFiles.size} 篇：${[...involvedFiles].join(", ")}；内容：${sentence}`);
  }
}

for (const [paragraph, involvedFiles] of paragraphOccurrences) {
  if (involvedFiles.size >= 3) {
    addWarning(`重复段落出现在 ${involvedFiles.size} 篇：${[...involvedFiles].join(", ")}；内容：${paragraph}`);
  }
}

for (const fileName of files) {
  const filePath = path.join(postsDirectory, fileName);
  const { content } = matter(fs.readFileSync(filePath, "utf8"));
  const internalLinks = [...content.matchAll(/\[[^\]]+\]\((\/[^)#?\s]+)(?:[?#][^)]*)?\)/g)];

  for (const match of internalLinks) {
    const href = match[1].replace(/\/$/, "") || "/";
    if (
      !knownRoutes.has(href)
      && !href.startsWith("/tags/")
      && !href.startsWith("/beginner/page/")
      && !href.startsWith("/blog/page/")
      && !href.startsWith("/diagrams/")
    ) {
      addError(`${fileName}: 内链可能不存在 ${href}`);
    }
  }
}

const beginnerSlugs = [];
if (!fs.existsSync(roadmapMetadataDirectory)) {
  addError("缺少 Beginner Roadmap metadata 目录");
} else {
  for (const fileName of fs
    .readdirSync(roadmapMetadataDirectory)
    .filter((name) => name.endsWith(".json"))
    .sort()) {
    const slug = fileName.replace(/\.json$/, "");
    try {
      const parsed = JSON.parse(
        fs.readFileSync(path.join(roadmapMetadataDirectory, fileName), "utf8"),
      );
      if (parsed?.roadmap?.id === "beginner") beginnerSlugs.push(slug);
    } catch (error) {
      addError(`${fileName}: Beginner Roadmap metadata 无法解析：${String(error)}`);
    }
  }
}

const duplicates = beginnerSlugs.filter(
  (slug, index) => beginnerSlugs.indexOf(slug) !== index,
);
if (duplicates.length > 0) {
  addError(`入门系列存在重复 slug：${duplicates.join(", ")}`);
}
if (beginnerSlugs.length !== 12) {
  addError(`入门系列应有 12 篇，实际为 ${beginnerSlugs.length}`);
}
for (const slug of beginnerSlugs) {
  if (!slugs.has(slug)) addError(`入门系列文章不存在：${slug}`);
}

const siteSource = fs.readFileSync(sitePath, "utf8");
if (siteSource.includes("林清安")) {
  addError("站点配置仍然包含旧姓名“林清安”");
}

for (const warning of warnings) console.warn(`WARN: ${warning}`);

if (errors.length > 0) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  console.error(`\n内容检查失败：${errors.length} 个错误，${warnings.length} 个提醒。`);
  process.exit(1);
}

console.log(`内容检查通过：${files.length} 篇文章，${warnings.length} 个提醒。`);
