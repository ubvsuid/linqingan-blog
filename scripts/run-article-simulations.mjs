import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

await import("./simulate-core-articles.mjs");

const root = process.cwd();
const simulationsDirectory = path.join(
  root,
  "scripts",
  "article-simulations",
);

if (!fs.existsSync(simulationsDirectory)) {
  console.log("扩展文章模拟：当前没有额外批次文件。");
  process.exit(0);
}

const files = fs
  .readdirSync(simulationsDirectory)
  .filter((fileName) => fileName.endsWith(".mjs"))
  .sort();

// Temporary migration bridge for older article simulations that inspect the
// Knowledge source as plain text. Runtime code already resolves the public
// Knowledge model through the module registry + generated article registry, so
// static simulations should inspect that same generated identity while modules
// migrate from legacy slug lists to metadata one at a time.
const knowledgeBasePath = path.join(root, "src", "lib", "knowledge-base.ts");
const knowledgeModuleRegistryPath = path.join(
  root,
  "src",
  "lib",
  "knowledge-module-registry.ts",
);
const generatedKnowledgeRegistryPath = path.join(
  root,
  "src",
  "generated",
  "knowledge-article-registry.json",
);
const originalReadFileSync = fs.readFileSync;

const generatedRegistry = JSON.parse(
  originalReadFileSync(generatedKnowledgeRegistryPath, "utf8"),
);
if (!Array.isArray(generatedRegistry)) {
  throw new Error("Generated Knowledge article registry 必须是数组");
}

const metadataKnowledgeSlugs = generatedRegistry.map((record) => {
  if (!record || typeof record !== "object" || typeof record.slug !== "string") {
    throw new Error("Generated Knowledge article registry 包含无效 slug 记录");
  }
  return record.slug;
});

const combinedKnowledgeStaticSource = [
  originalReadFileSync(knowledgeBasePath, "utf8"),
  originalReadFileSync(knowledgeModuleRegistryPath, "utf8"),
  metadataKnowledgeSlugs
    .sort()
    .map((slug) => JSON.stringify(slug))
    .join("\n"),
].join("\n");

function isKnowledgeBaseRead(target) {
  if (typeof target !== "string") return false;
  return path.resolve(target) === knowledgeBasePath;
}

fs.readFileSync = function readFileSyncWithKnowledgeRegistry(target, options) {
  if (!isKnowledgeBaseRead(target)) {
    return originalReadFileSync(target, options);
  }

  const encoding =
    typeof options === "string"
      ? options
      : options && typeof options === "object"
        ? options.encoding
        : null;

  return encoding
    ? combinedKnowledgeStaticSource
    : Buffer.from(combinedKnowledgeStaticSource, "utf8");
};

try {
  for (const fileName of files) {
    const fileUrl = pathToFileURL(
      path.join(simulationsDirectory, fileName),
    ).href;
    await import(`${fileUrl}?v=${Date.now()}`);
  }
} finally {
  fs.readFileSync = originalReadFileSync;
}

console.log(`扩展文章模拟通过：${files.length} 个批次文件。`);
