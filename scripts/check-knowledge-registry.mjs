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

const spawnPilot = [
  ["screeps-spawncreep-return-codes", "create-queue", 10],
  ["screeps-spawn-exit-blocked-directions", "create-queue", 20],
  ["screeps-dynamic-creep-body-energy", "create-queue", 30],
  ["screeps-room-energyavailable-stuck", "create-queue", 40],
  ["screeps-multi-spawn-queue", "create-queue", 50],
  ["screeps-creep-prespawn-replacement", "replacement-retirement", 60],
  ["screeps-spawn-renew-creep", "replacement-retirement", 70],
  ["screeps-spawn-recycle-creep", "replacement-retirement", 80],
  ["screeps-spawn-emergency-recovery", "emergency-recovery", 90],
];

const movementPilot = [
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

function sortedModuleRecords(records, moduleId) {
  return records
    .filter((record) => record.knowledge.module === moduleId)
    .sort((left, right) => left.knowledge.order - right.knowledge.order || left.slug.localeCompare(right.slug));
}

function validateParity(label, records, expectedRows, expectedStageCounts) {
  if (records.length !== expectedRows.length) {
    addError(`${label} pilot 数量错误：预期 ${expectedRows.length}，实际 ${records.length}`);
  }

  for (let index = 0; index < expectedRows.length; index += 1) {
    const expected = expectedRows[index];
    const actual = records[index];
    if (!actual) continue;

    if (
      actual.slug !== expected[0] ||
      actual.knowledge.stage !== expected[1] ||
      actual.knowledge.order !== expected[2]
    ) {
      addError(
        `${label} parity #${index + 1} 失败：预期 ${expected.join(" / ")}，实际 ${actual.slug} / ${actual.knowledge.stage} / ${actual.knowledge.order}`,
      );
    }
  }

  for (const [stage, expectedCount] of expectedStageCounts) {
    const actualCount = records.filter((record) => record.knowledge.stage === stage).length;
    if (actualCount !== expectedCount) {
      addError(`${label} stage ${stage} 数量错误：预期 ${expectedCount}，实际 ${actualCount}`);
    }
  }

  const orders = records.map((record) => record.knowledge.order);
  if (new Set(orders).size !== orders.length) {
    addError(`${label} pilot 存在重复 knowledge.order`);
  }
}

function validateMetadataModuleBlock(moduleRegistrySource, label, moduleId, nextModuleId, expectedRows) {
  const moduleStart = moduleRegistrySource.indexOf(`id: "${moduleId}"`);
  const nextModuleStart = moduleRegistrySource.indexOf(`id: "${nextModuleId}"`);
  if (moduleStart < 0 || nextModuleStart < 0 || nextModuleStart <= moduleStart) {
    addError(`knowledge-module-registry.ts 无法定位 ${label} module block`);
    return;
  }

  const moduleBlock = moduleRegistrySource.slice(moduleStart, nextModuleStart);
  if (!moduleBlock.includes('articleSource: "metadata"')) {
    addError(`${label} module 尚未切换到 metadata articleSource`);
  }
  for (const [slug] of expectedRows) {
    if (moduleBlock.includes(`"${slug}"`)) {
      addError(`${label} module 仍硬编码文章 slug：${slug}`);
    }
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

const spawnRecords = sortedModuleRecords(records, "spawn-lifecycle");
const movementRecords = sortedModuleRecords(records, "movement-vision");

validateParity(
  "Spawn",
  spawnRecords,
  spawnPilot,
  new Map([
    ["create-queue", 5],
    ["replacement-retirement", 3],
    ["emergency-recovery", 1],
  ]),
);

validateParity(
  "Movement",
  movementRecords,
  movementPilot,
  new Map([
    ["common-errors", 3],
    ["path-costs", 4],
    ["vision-visualization", 3],
  ]),
);

const moduleRegistrySource = fs.readFileSync(moduleRegistryPath, "utf8");
validateMetadataModuleBlock(
  moduleRegistrySource,
  "Spawn",
  "spawn-lifecycle",
  "room-economy",
  spawnPilot,
);
validateMetadataModuleBlock(
  moduleRegistrySource,
  "Movement",
  "movement-vision",
  "controller-control",
  movementPilot,
);

if (errors.length > 0) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  console.error(`\nKnowledge registry check failed: ${errors.length} issue(s).`);
  process.exit(1);
}

console.log(
  `Knowledge registry check passed: ${records.length} metadata article(s), Spawn parity ${spawnRecords.length}/${spawnPilot.length}, Movement parity ${movementRecords.length}/${movementPilot.length}, Keyword Owner conflicts 0.`,
);
