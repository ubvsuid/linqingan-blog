import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import matter from "gray-matter";

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
// Knowledge model through knowledge-base.ts + knowledge-module-registry.ts +
// article metadata, so static simulations should inspect the same combined
// identity while modules migrate from legacy slug lists to metadata one at a
// time.
const knowledgeBasePath = path.join(root, "src", "lib", "knowledge-base.ts");
const knowledgeModuleRegistryPath = path.join(
  root,
  "src",
  "lib",
  "knowledge-module-registry.ts",
);
const postsDirectory = path.join(root, "content", "posts");
const migrationMetadataDirectory = path.join(
  root,
  "content",
  "knowledge-metadata",
);
const originalReadFileSync = fs.readFileSync;

const metadataKnowledgeSlugs = new Set();
if (fs.existsSync(migrationMetadataDirectory)) {
  for (const fileName of fs
    .readdirSync(migrationMetadataDirectory)
    .filter((name) => name.endsWith(".json"))) {
    metadataKnowledgeSlugs.add(fileName.replace(/\.json$/, ""));
  }
}
if (fs.existsSync(postsDirectory)) {
  for (const fileName of fs
    .readdirSync(postsDirectory)
    .filter((name) => name.endsWith(".md"))) {
    const source = originalReadFileSync(
      path.join(postsDirectory, fileName),
      "utf8",
    );
    const { data } = matter(source);
    if (
      data.draft !== true
      && data.knowledge
      && typeof data.knowledge === "object"
      && !Array.isArray(data.knowledge)
    ) {
      metadataKnowledgeSlugs.add(fileName.replace(/\.md$/, ""));
    }
  }
}

const combinedKnowledgeStaticSource = [
  originalReadFileSync(knowledgeBasePath, "utf8"),
  originalReadFileSync(knowledgeModuleRegistryPath, "utf8"),
  [...metadataKnowledgeSlugs]
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
