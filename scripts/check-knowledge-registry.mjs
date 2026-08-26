import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const postsDirectory = path.join(root, "content", "posts");
const migrationMetadataDirectory = path.join(root, "content", "knowledge-metadata");
const identityRegistryPath = path.join(root, "content", "knowledge-identities.json");
const generatedRegistryPath = path.join(root, "src", "generated", "knowledge-article-registry.json");
const moduleRegistryPath = path.join(root, "src", "lib", "knowledge-module-registry.ts");
const errors = [];

const difficultyValues = new Set(["beginner", "intermediate", "advanced"]);
const keywordRoleValues = new Set(["owner", "supporting"]);
const sourceValues = new Set(["migration-sidecar", "frontmatter"]);
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const contentIdPattern = /^article_[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const contentGroupIdPattern = /^group_[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function addError(message) {
  errors.push(message);
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeKeyword(value) {
  return String(value).normalize("NFKC").trim().toLowerCase();
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    addError(`${filePath}: JSON 解析失败：${String(error)}`);
    return null;
  }
}

function parseModuleSchema(source) {
  const schema = new Map();
  const matches = [...source.matchAll(/^    id: "([a-z0-9-]+)",$/gm)];

  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const moduleId = match[1];
    const start = match.index ?? 0;
    const end = matches[index + 1]?.index ?? source.length;
    const block = source.slice(start, end);
    const stages = new Set(
      [...block.matchAll(/\{ id: "([a-z0-9-]+)", title:/g)].map((item) => item[1]),
    );

    if (!block.includes('articleSource: "metadata"')) {
      addError(`${moduleId}: Knowledge module 必须使用 metadata articleSource`);
    }
    if (/\blegacySlugs\s*:/.test(block)) {
      addError(`${moduleId}: metadata module 不得重新声明 legacySlugs`);
    }
    if (/\blegacy(?:From|To)\s*:/.test(block)) {
      addError(`${moduleId}: metadata module 不得重新声明 legacy stage range`);
    }
    if (stages.size === 0) {
      addError(`${moduleId}: 没有可用的 learning stage`);
    }

    schema.set(moduleId, stages);
  }

  if (schema.size === 0) {
    addError("knowledge-module-registry.ts 未解析到任何 Knowledge module");
  }

  return schema;
}

if (!fs.existsSync(generatedRegistryPath)) {
  addError("缺少生成后的 knowledge-article-registry.json，请先运行 knowledgegenerate");
}
if (!fs.existsSync(identityRegistryPath)) {
  addError("缺少 content/knowledge-identities.json");
}

const moduleRegistrySource = fs.readFileSync(moduleRegistryPath, "utf8");
const moduleSchema = parseModuleSchema(moduleRegistrySource);
const records = fs.existsSync(generatedRegistryPath) ? readJson(generatedRegistryPath) : [];
const identityDocument = fs.existsSync(identityRegistryPath) ? readJson(identityRegistryPath) : null;

if (!Array.isArray(records)) {
  addError("knowledge-article-registry.json 必须是数组");
}
if (!isRecord(identityDocument) || identityDocument?.schemaVersion !== 1 || !Array.isArray(identityDocument?.records)) {
  addError("knowledge-identities.json 必须是 schemaVersion=1 且包含 records 数组");
}

const publishedSlugs = new Set(
  fs
    .readdirSync(postsDirectory)
    .filter((name) => name.endsWith(".md"))
    .map((name) => name.replace(/\.md$/, "")),
);

const identityBySlug = new Map();
const identitySlugByContentId = new Map();
const identitySlugByContentGroupId = new Map();
for (const identity of Array.isArray(identityDocument?.records) ? identityDocument.records : []) {
  if (!isRecord(identity)) {
    addError("Content Identity record 必须是对象");
    continue;
  }
  const { slug, contentId, contentGroupId } = identity;
  if (typeof slug !== "string" || !slugPattern.test(slug)) {
    addError(`Content Identity slug 无效：${String(slug)}`);
    continue;
  }
  if (identityBySlug.has(slug)) {
    addError(`Content Identity 重复 slug：${slug}`);
  } else {
    identityBySlug.set(slug, identity);
  }
  if (typeof contentId !== "string" || !contentIdPattern.test(contentId)) {
    addError(`${slug}: contentId 必须是 article_ + UUID`);
  } else {
    const previousSlug = identitySlugByContentId.get(contentId);
    if (previousSlug) addError(`Content Identity 重复 contentId：${contentId} 同时属于 ${previousSlug} 与 ${slug}`);
    else identitySlugByContentId.set(contentId, slug);
  }
  if (typeof contentGroupId !== "string" || !contentGroupIdPattern.test(contentGroupId)) {
    addError(`${slug}: contentGroupId 必须是 group_ + UUID`);
  } else {
    const previousSlug = identitySlugByContentGroupId.get(contentGroupId);
    if (previousSlug) addError(`Content Identity 重复 contentGroupId：${contentGroupId} 同时属于 ${previousSlug} 与 ${slug}`);
    else identitySlugByContentGroupId.set(contentGroupId, slug);
  }
  if (!publishedSlugs.has(slug)) {
    addError(`${slug}: Content Identity 没有对应文章`);
  }
}

const seenSlugs = new Set();
const seenContentIds = new Set();
const ownerByKeyword = new Map();
const ordersByModule = new Map();
const countsByModule = new Map();
const countsByModuleStage = new Map();

for (const record of Array.isArray(records) ? records : []) {
  if (!isRecord(record)) {
    addError("Knowledge registry record 必须是对象");
    continue;
  }

  const { contentId, contentGroupId, slug, knowledge, seo, source } = record;
  if (typeof slug !== "string" || !slugPattern.test(slug)) {
    addError(`Knowledge record slug 无效：${String(slug)}`);
    continue;
  }
  if (seenSlugs.has(slug)) {
    addError(`Knowledge registry 重复 slug：${slug}`);
  }
  seenSlugs.add(slug);

  if (typeof contentId !== "string" || !contentIdPattern.test(contentId)) {
    addError(`${slug}: generated contentId 无效`);
  } else if (seenContentIds.has(contentId)) {
    addError(`${slug}: generated contentId 重复：${contentId}`);
  } else {
    seenContentIds.add(contentId);
  }
  if (typeof contentGroupId !== "string" || !contentGroupIdPattern.test(contentGroupId)) {
    addError(`${slug}: generated contentGroupId 无效`);
  }

  const identity = identityBySlug.get(slug);
  if (!identity) {
    addError(`${slug}: generated registry 没有对应 Content Identity`);
  } else {
    if (identity.contentId !== contentId) {
      addError(`${slug}: generated contentId 与 Content Identity Source of Truth 不一致`);
    }
    if (identity.contentGroupId !== contentGroupId) {
      addError(`${slug}: generated contentGroupId 与 Content Identity Source of Truth 不一致`);
    }
  }

  if (!publishedSlugs.has(slug)) {
    addError(`${slug}: Knowledge registry 没有对应文章`);
  }
  if (!isRecord(knowledge) || !isRecord(seo)) {
    addError(`${slug}: knowledge 与 seo 必须是对象`);
    continue;
  }
  if (!sourceValues.has(source)) {
    addError(`${slug}: source 必须是 migration-sidecar 或 frontmatter`);
  }

  const moduleId = knowledge.module;
  const stageId = knowledge.stage;
  if (typeof moduleId !== "string" || !moduleSchema.has(moduleId)) {
    addError(`${slug}: knowledge.module 不存在：${String(moduleId)}`);
  } else {
    const stages = moduleSchema.get(moduleId);
    if (typeof stageId !== "string" || !stages.has(stageId)) {
      addError(`${slug}: ${moduleId} 中不存在 knowledge.stage：${String(stageId)}`);
    }
  }

  if (!Number.isInteger(knowledge.order) || knowledge.order <= 0) {
    addError(`${slug}: knowledge.order 必须是正整数`);
  }
  if (!difficultyValues.has(knowledge.difficulty)) {
    addError(`${slug}: knowledge.difficulty 无效`);
  }
  if (typeof seo.primaryKeyword !== "string" || seo.primaryKeyword.trim() === "") {
    addError(`${slug}: seo.primaryKeyword 必须是非空字符串`);
  }
  if (typeof seo.searchIntent !== "string" || seo.searchIntent.trim() === "") {
    addError(`${slug}: seo.searchIntent 必须是非空字符串`);
  }
  if (!keywordRoleValues.has(seo.keywordRole)) {
    addError(`${slug}: seo.keywordRole 无效`);
  }

  if (typeof moduleId === "string" && Number.isInteger(knowledge.order)) {
    const orders = ordersByModule.get(moduleId) ?? new Map();
    const previous = orders.get(knowledge.order);
    if (previous) {
      addError(`${moduleId}: knowledge.order ${knowledge.order} 同时属于 ${previous} 与 ${slug}`);
    } else {
      orders.set(knowledge.order, slug);
    }
    ordersByModule.set(moduleId, orders);
  }

  if (typeof moduleId === "string" && typeof stageId === "string") {
    countsByModule.set(moduleId, (countsByModule.get(moduleId) ?? 0) + 1);
    const stageKey = `${moduleId}/${stageId}`;
    countsByModuleStage.set(stageKey, (countsByModuleStage.get(stageKey) ?? 0) + 1);
  }

  if (seo.keywordRole === "owner" && typeof seo.primaryKeyword === "string") {
    const key = normalizeKeyword(seo.primaryKeyword);
    const previous = ownerByKeyword.get(key);
    if (previous) {
      addError(`Keyword Owner 冲突：${seo.primaryKeyword} 同时属于 ${previous} 与 ${slug}`);
    } else {
      ownerByKeyword.set(key, slug);
    }
  }
}

for (const [slug] of identityBySlug) {
  if (!seenSlugs.has(slug)) {
    addError(`${slug}: Content Identity 没有对应的已发布 Knowledge registry record`);
  }
}
for (const slug of seenSlugs) {
  if (!identityBySlug.has(slug)) {
    addError(`${slug}: Knowledge registry 缺少 Content Identity`);
  }
}

if (fs.existsSync(migrationMetadataDirectory)) {
  for (const fileName of fs.readdirSync(migrationMetadataDirectory).filter((name) => name.endsWith(".json"))) {
    const slug = fileName.replace(/\.json$/, "");
    if (!fs.existsSync(path.join(postsDirectory, `${slug}.md`))) {
      addError(`${fileName}: migration sidecar 没有对应文章`);
    }
  }
}

for (const [moduleId, stages] of moduleSchema) {
  const moduleCount = countsByModule.get(moduleId) ?? 0;
  if (moduleCount === 0) {
    addError(`${moduleId}: metadata module 没有任何文章`);
  }
  for (const stageId of stages) {
    const count = countsByModuleStage.get(`${moduleId}/${stageId}`) ?? 0;
    if (count === 0) {
      addError(`${moduleId}/${stageId}: learning stage 不能为空`);
    }
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  console.error(`\nKnowledge registry check failed: ${errors.length} issue(s).`);
  process.exit(1);
}

const moduleSummary = [...moduleSchema.keys()]
  .map((moduleId) => `${moduleId}=${countsByModule.get(moduleId) ?? 0}`)
  .join(", ");
console.log(
  `Knowledge registry check passed: ${records.length} article(s), ${identityBySlug.size} Content Identity V1 record(s), ${moduleSchema.size} module(s), ${moduleSummary}, Keyword Owner conflicts 0.`,
);
