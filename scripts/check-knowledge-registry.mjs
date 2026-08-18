import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

const root = process.cwd();
const postsDirectory = path.join(root, "content", "posts");
const migrationMetadataDirectory = path.join(root, "content", "knowledge-metadata");
const moduleRegistryPath = path.join(root, "src", "lib", "knowledge-module-registry.ts");
const errors = [];

const difficultyValues = new Set(["beginner", "intermediate", "advanced"]);
const keywordRoleValues = new Set(["owner", "supporting"]);
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const parityContracts = [
  {
    label: "Memory / Engineering",
    moduleId: "memory-engineering",
    nextModuleId: "spawn-lifecycle",
    expected: [
      ["screeps-memory-basics", "state-basics", 10],
      ["screeps-clean-dead-creep-memory", "state-basics", 20],
      ["screeps-creep-working-state", "state-basics", 30],
      ["screeps-game-get-object-by-id", "objects-modules", 40],
      ["screeps-modules-require", "objects-modules", 50],
      ["screeps-rawmemory-segments", "advanced-storage-cache", 60],
      ["screeps-intershardmemory-sync", "advanced-storage-cache", 70],
      ["screeps-rawmemory-foreign-segment", "advanced-storage-cache", 80],
      ["screeps-global-cache", "advanced-storage-cache", 90],
    ],
    stageCounts: new Map([
      ["state-basics", 3],
      ["objects-modules", 2],
      ["advanced-storage-cache", 4],
    ]),
  },
  {
    label: "Spawn",
    moduleId: "spawn-lifecycle",
    nextModuleId: "room-economy",
    expected: [
      ["screeps-spawncreep-return-codes", "create-queue", 10],
      ["screeps-spawn-exit-blocked-directions", "create-queue", 20],
      ["screeps-dynamic-creep-body-energy", "create-queue", 30],
      ["screeps-room-energyavailable-stuck", "create-queue", 40],
      ["screeps-multi-spawn-queue", "create-queue", 50],
      ["screeps-creep-prespawn-replacement", "replacement-retirement", 60],
      ["screeps-spawn-renew-creep", "replacement-retirement", 70],
      ["screeps-spawn-recycle-creep", "replacement-retirement", 80],
      ["screeps-spawn-emergency-recovery", "emergency-recovery", 90],
    ],
    stageCounts: new Map([
      ["create-queue", 5],
      ["replacement-retirement", 3],
      ["emergency-recovery", 1],
    ]),
  },
  {
    label: "Room Economy",
    moduleId: "room-economy",
    nextModuleId: "movement-vision",
    expected: [
      ["screeps-store-capacity-api", "store-container", 10],
      ["screeps-creep-withdraw-container-energy", "store-container", 20],
      ["screeps-container-decay-repair-deadline", "store-container", 30],
      ["screeps-creep-pickup-dropped-energy", "resource-recovery", 40],
      ["screeps-tombstone-ruin-recovery", "resource-recovery", 50],
      ["screeps-select-source-by-path", "resource-recovery", 60],
      ["screeps-storage-energy-usage", "room-storage-transfer", 70],
      ["screeps-link-transfer-energy", "room-storage-transfer", 80],
      ["screeps-terminal-send-resources", "interroom-minerals", 90],
      ["screeps-mineral-extractor-harvest", "interroom-minerals", 100],
    ],
    stageCounts: new Map([
      ["store-container", 3],
      ["resource-recovery", 3],
      ["room-storage-transfer", 2],
      ["interroom-minerals", 2],
    ]),
  },
  {
    label: "Movement / Vision",
    moduleId: "movement-vision",
    nextModuleId: "controller-control",
    expected: [
      ["screeps-err-not-in-range", "common-errors", 10],
      ["screeps-moveto-not-moving", "common-errors", 20],
      ["screeps-err-no-path", "common-errors", 30],
      ["screeps-pathfinder-costmatrix", "path-costs", 40],
      ["screeps-map-find-route", "path-costs", 50],
      ["screeps-roomposition-distance", "path-costs", 60],
      ["screeps-move-fatigue-body-ratio", "path-costs", 70],
      ["screeps-room-visibility", "vision-visualization", 80],
      ["screeps-observer-observe-room", "vision-visualization", 90],
      ["screeps-roomvisual-debug", "vision-visualization", 100],
    ],
    stageCounts: new Map([
      ["common-errors", 3],
      ["path-costs", 4],
      ["vision-visualization", 3],
    ]),
  },
  {
    label: "Controller",
    moduleId: "controller-control",
    nextModuleId: "construction-defense",
    expected: [
      ["screeps-upgrader-controller-link-not-upgrading", "fixed-upgrade", 10],
      ["screeps-controller-activate-safe-mode", "safety-lifecycle", 20],
      ["screeps-controller-downgrade", "safety-lifecycle", 30],
      ["screeps-reserve-vs-claim-controller", "reservation-claim", 40],
    ],
    stageCounts: new Map([
      ["fixed-upgrade", 1],
      ["safety-lifecycle", 2],
      ["reservation-claim", 1],
    ]),
  },
  {
    label: "Construction / Defense",
    moduleId: "construction-defense",
    nextModuleId: "market-advanced-resources",
    expected: [
      ["screeps-room-create-construction-site", "construction-management", 10],
      ["screeps-construction-site-progress", "construction-management", 20],
      ["screeps-construction-site-remove", "construction-management", 30],
      ["screeps-structure-destroy", "construction-management", 40],
      ["screeps-tower-auto-attack-hostiles", "tower-actions", 50],
      ["screeps-tower-repair-threshold", "tower-actions", 60],
      ["screeps-tower-heal-creeps", "tower-actions", 70],
      ["screeps-rampart-set-public", "defense-structures", 80],
      ["screeps-wall-rampart-repair-limit", "defense-structures", 90],
      ["screeps-nuker-launch-checklist", "defense-structures", 100],
    ],
    stageCounts: new Map([
      ["construction-management", 4],
      ["tower-actions", 3],
      ["defense-structures", 3],
    ]),
  },
  {
    label: "Market / Advanced Resources",
    moduleId: "market-advanced-resources",
    nextModuleId: "operations-debugging",
    expected: [
      ["screeps-market-deal", "market-operations", 10],
      ["screeps-market-create-order", "market-operations", 20],
      ["screeps-market-order-maintenance", "market-operations", 30],
      ["screeps-lab-run-reaction", "lab-boost", 40],
      ["screeps-lab-boost-creep", "lab-boost", 50],
      ["screeps-factory-produce", "production-power", 60],
      ["screeps-power-spawn-process-power", "production-power", 70],
    ],
    stageCounts: new Map([
      ["market-operations", 3],
      ["lab-boost", 2],
      ["production-power", 2],
    ]),
  },
];

function addError(message) {
  errors.push(message);
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validateMetadata(data, sourcePath) {
  const hasKnowledge = data.knowledge !== undefined;
  const hasSeo = data.seo !== undefined;

  if (!hasKnowledge && !hasSeo) return null;
  if (hasKnowledge !== hasSeo) {
    addError(`${sourcePath}: knowledge 与 seo 必须同时声明`);
    return null;
  }
  if (!isRecord(data.knowledge)) {
    addError(`${sourcePath}: knowledge 必须是对象`);
    return null;
  }
  if (!isRecord(data.seo)) {
    addError(`${sourcePath}: seo 必须是对象`);
    return null;
  }

  const { knowledge, seo } = data;
  if (typeof knowledge.module !== "string" || !slugPattern.test(knowledge.module)) {
    addError(`${sourcePath}: knowledge.module 必须是小写 slug`);
  }
  if (typeof knowledge.stage !== "string" || !slugPattern.test(knowledge.stage)) {
    addError(`${sourcePath}: knowledge.stage 必须是小写 slug`);
  }
  if (!Number.isInteger(knowledge.order) || knowledge.order <= 0) {
    addError(`${sourcePath}: knowledge.order 必须是正整数`);
  }
  if (!difficultyValues.has(knowledge.difficulty)) {
    addError(`${sourcePath}: knowledge.difficulty 无效`);
  }
  if (typeof seo.primaryKeyword !== "string" || seo.primaryKeyword.trim() === "") {
    addError(`${sourcePath}: seo.primaryKeyword 必须是非空字符串`);
  }
  if (typeof seo.searchIntent !== "string" || seo.searchIntent.trim() === "") {
    addError(`${sourcePath}: seo.searchIntent 必须是非空字符串`);
  }
  if (!keywordRoleValues.has(seo.keywordRole)) {
    addError(`${sourcePath}: seo.keywordRole 无效`);
  }

  return { knowledge, seo };
}

function readJson(filePath) {
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (!isRecord(parsed)) {
      addError(`${filePath}: migration sidecar 必须是 JSON 对象`);
      return null;
    }
    return parsed;
  } catch (error) {
    addError(`${filePath}: JSON 解析失败：${String(error)}`);
    return null;
  }
}

const records = [];
const articleFiles = fs
  .readdirSync(postsDirectory)
  .filter((fileName) => fileName.endsWith(".md"))
  .sort();

for (const fileName of articleFiles) {
  const slug = fileName.replace(/\.md$/, "");
  const articlePath = path.join(postsDirectory, fileName);
  const { data } = matter(fs.readFileSync(articlePath, "utf8"));
  if (data.draft === true) continue;

  const inline = validateMetadata(data, articlePath);
  const sidecarPath = path.join(migrationMetadataDirectory, `${slug}.json`);
  const hasSidecar = fs.existsSync(sidecarPath);

  if (inline && hasSidecar) {
    addError(`${slug}: frontmatter 与 migration sidecar 同时存在，违反单一 Source of Truth`);
    continue;
  }

  const sidecarData = hasSidecar ? readJson(sidecarPath) : null;
  const sidecar = sidecarData ? validateMetadata(sidecarData, sidecarPath) : null;
  const metadata = inline ?? sidecar;
  if (!metadata) continue;

  records.push({ slug, ...metadata, source: inline ? "frontmatter" : "migration-sidecar" });
}

if (fs.existsSync(migrationMetadataDirectory)) {
  for (const fileName of fs.readdirSync(migrationMetadataDirectory).filter((name) => name.endsWith(".json"))) {
    const slug = fileName.replace(/\.json$/, "");
    if (!fs.existsSync(path.join(postsDirectory, `${slug}.md`))) {
      addError(`${fileName}: migration sidecar 没有对应文章`);
    }
  }
}

const ownerByKeyword = new Map();
for (const record of records) {
  if (record.seo.keywordRole !== "owner") continue;
  const key = record.seo.primaryKeyword.normalize("NFKC").trim().toLowerCase();
  const previous = ownerByKeyword.get(key);
  if (previous) {
    addError(`Keyword Owner 冲突：${record.seo.primaryKeyword} 同时属于 ${previous} 与 ${record.slug}`);
  } else {
    ownerByKeyword.set(key, record.slug);
  }
}

const moduleRegistrySource = fs.readFileSync(moduleRegistryPath, "utf8");
const paritySummaries = [];

for (const contract of parityContracts) {
  const moduleRecords = records
    .filter((record) => record.knowledge.module === contract.moduleId)
    .sort((left, right) => left.knowledge.order - right.knowledge.order || left.slug.localeCompare(right.slug));

  if (moduleRecords.length !== contract.expected.length) {
    addError(`${contract.label} parity 数量错误：预期 ${contract.expected.length}，实际 ${moduleRecords.length}`);
  }

  for (let index = 0; index < contract.expected.length; index += 1) {
    const expected = contract.expected[index];
    const actual = moduleRecords[index];
    if (!actual) continue;

    if (
      actual.slug !== expected[0] ||
      actual.knowledge.stage !== expected[1] ||
      actual.knowledge.order !== expected[2]
    ) {
      addError(
        `${contract.label} parity #${index + 1} 失败：预期 ${expected.join(" / ")}，实际 ${actual.slug} / ${actual.knowledge.stage} / ${actual.knowledge.order}`,
      );
    }
  }

  for (const [stage, expectedCount] of contract.stageCounts) {
    const actualCount = moduleRecords.filter((record) => record.knowledge.stage === stage).length;
    if (actualCount !== expectedCount) {
      addError(`${contract.label} stage ${stage} 数量错误：预期 ${expectedCount}，实际 ${actualCount}`);
    }
  }

  const orders = moduleRecords.map((record) => record.knowledge.order);
  if (new Set(orders).size !== orders.length) {
    addError(`${contract.label} parity 存在重复 knowledge.order`);
  }

  const moduleStart = moduleRegistrySource.indexOf(`id: "${contract.moduleId}"`);
  const nextModuleStart = moduleRegistrySource.indexOf(`id: "${contract.nextModuleId}"`);
  if (moduleStart < 0 || nextModuleStart < 0 || nextModuleStart <= moduleStart) {
    addError(`knowledge-module-registry.ts 无法定位 ${contract.label} module block`);
  } else {
    const moduleBlock = moduleRegistrySource.slice(moduleStart, nextModuleStart);
    if (!moduleBlock.includes('articleSource: "metadata"')) {
      addError(`${contract.label} module 尚未切换到 metadata articleSource`);
    }
    for (const [slug] of contract.expected) {
      if (moduleBlock.includes(`"${slug}"`)) {
        addError(`${contract.label} module 仍硬编码文章 slug：${slug}`);
      }
    }
  }

  const stageSummary = [...contract.stageCounts.values()].join("/");
  paritySummaries.push(
    `${contract.label} ${moduleRecords.length}/${contract.expected.length} (${stageSummary})`,
  );
}

if (errors.length > 0) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  console.error(`\nKnowledge registry check failed: ${errors.length} issue(s).`);
  process.exit(1);
}

console.log(
  `Knowledge registry check passed: ${records.length} metadata article(s), ${paritySummaries.join(", ")}, Keyword Owner conflicts 0.`,
);
