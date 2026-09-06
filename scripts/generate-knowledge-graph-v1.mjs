import fs from "node:fs";
import path from "node:path";

import { loadContentIdentityRegistry } from "./lib/content-identity-registry.mjs";
import { loadEnglishContentIdentityReadiness } from "./lib/knowledge-graph-durable-identities.mjs";

const root = process.cwd();
const outputPath = path.join(root, "src/generated/knowledge-graph-v1.json");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}
function json(relativePath) {
  return JSON.parse(read(relativePath));
}
function objectFromBrace(source, braceIndex) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let index = braceIndex; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(braceIndex, index + 1);
    }
  }
  return null;
}
function field(source, name) {
  const match = source.match(
    new RegExp(`["']?${name}["']?\\s*:\\s*["']([^"']+)["']`),
  );
  return match?.[1] ?? null;
}
function quotedArrayField(source, name) {
  const match = source.match(
    new RegExp(`${name}\\s*:\\s*\\[([\\s\\S]*?)\\]`),
  );
  if (!match) return [];
  return [...match[1].matchAll(/["']([^"']+)["']/g)].map(
    (item) => item[1],
  );
}
function collectObjectBlocksByField(relativePath, fieldName) {
  const source = read(relativePath);
  const pattern = new RegExp(
    `["']?${fieldName}["']?\\s*:\\s*["']([^"']+)["']`,
    "g",
  );
  const records = [];
  for (const match of source.matchAll(pattern)) {
    const brace = source.lastIndexOf("{", match.index);
    const block = brace >= 0 ? objectFromBrace(source, brace) : null;
    if (block) records.push({ value: match[1], block });
  }
  return records;
}

const graph = {
  schemaVersion: 1,
  generatedFrom: "authoritative-source-adapters",
  runtimeEvidenceMode: "accepted-only-runtime-adapter",
  nodes: [],
  edges: [],
  unmapped: [],
};
const nodeIds = new Set();
const edgeIds = new Set();

function addNode(node) {
  if (nodeIds.has(node.id)) {
    throw new Error(`duplicate graph node ${node.id}`);
  }
  nodeIds.add(node.id);
  graph.nodes.push(node);
}
function addEdge(from, relation, to, provenance) {
  if (!nodeIds.has(from) || !nodeIds.has(to)) {
    graph.unmapped.push({
      source: provenance,
      locator: `${from}|${relation}|${to}`,
      reason: "edge endpoint is missing",
    });
    return;
  }
  const id = `${from}|${relation}|${to}`;
  if (edgeIds.has(id)) return;
  edgeIds.add(id);
  graph.edges.push({ id, from, to, relation, provenance });
}

const contentIdentities = loadContentIdentityRegistry(root);
const chineseByPath = new Map(
  contentIdentities.records.map((record) => [`/blog/${record.slug}`, record]),
);
const knowledge = json("src/generated/knowledge-article-registry.json");
const beginner = json("src/generated/beginner-roadmap-registry.json");

for (const record of knowledge) {
  addNode({
    id: record.contentId,
    type: "Article",
    title: record.seo?.primaryKeyword ?? record.slug,
    href: `/blog/${record.slug}`,
    locale: "zh",
    source: "src/generated/knowledge-article-registry.json",
  });
}
for (const record of beginner) {
  addNode({
    id: record.contentId,
    type: "BeginnerLesson",
    title: record.seo?.primaryKeyword ?? record.slug,
    href: `/blog/${record.slug}`,
    locale: "zh",
    source: "src/generated/beginner-roadmap-registry.json",
  });
}

const english = loadEnglishContentIdentityReadiness(root);
const englishByHref = new Map();
for (const record of english.records) {
  englishByHref.set(record.href, record);
  addNode({
    id: record.contentId,
    type: "Article",
    title: record.href.split("/").at(-1),
    href: record.href,
    locale: "en",
    source: record.sourceContentId
      ? "src/lib/english-articles-complete.ts#source-derived"
      : "content/english-standalone-identities.json",
  });
}

const apiBlocks = collectObjectBlocksByField(
  "src/lib/screeps-api-reference.ts",
  "id",
);
for (const { value: id, block } of apiBlocks) {
  addNode({
    id: `api:${id}`,
    type: "API",
    title: field(block, "signature") ?? id,
    locale: "neutral",
    source: "src/lib/screeps-api-reference.ts",
  });
}

const returnCodeBlocks = collectObjectBlocksByField(
  "src/lib/screeps-errors.ts",
  "name",
);
for (const { value: name } of returnCodeBlocks) {
  addNode({
    id: `return-code:${name}`,
    type: "ReturnCode",
    title: name,
    locale: "neutral",
    source: "src/lib/screeps-errors.ts",
  });
}

const symptomBlocks = collectObjectBlocksByField(
  "src/lib/screeps-diagnostic-symptoms.ts",
  "id",
);
for (const { value: id, block } of symptomBlocks) {
  const title = field(block, "zhTitle");
  if (!title) continue;
  addNode({
    id: `symptom:${id}`,
    type: "Symptom",
    title,
    locale: "zh",
    source: "src/lib/screeps-diagnostic-symptoms.ts",
  });
}

const toolBlocks = collectObjectBlocksByField(
  "src/lib/tool-catalog.ts",
  "toolId",
);
const toolBySlug = new Map();
for (const { value: toolId, block } of toolBlocks) {
  const slug = field(block, "slug");
  if (!slug) throw new Error(`Tool ${toolId} has no slug`);
  toolBySlug.set(slug, toolId);
  addNode({
    id: toolId,
    type: "Tool",
    title: field(block, "zhTitle") ?? slug,
    href: `/tools/${slug}`,
    locale: "zh",
    source: "src/lib/tool-catalog.ts",
  });
}

const experimentBlocks = collectObjectBlocksByField(
  "src/lib/tick-lab-experiments.ts",
  "experimentId",
);
for (const { value: experimentId, block } of experimentBlocks) {
  addNode({
    id: experimentId,
    type: "TickLabExperiment",
    title: field(block, "key") ?? experimentId,
    href: "/tick-lab",
    locale: "neutral",
    source: "src/lib/tick-lab-experiments.ts",
  });
}

const associations = json("content/article-language-associations.json");
const englishByChinesePath = new Map(
  associations.records.map((record) => [record.chinesePath, record.englishPath]),
);

for (const association of associations.records) {
  const zh = chineseByPath.get(association.chinesePath);
  const en = englishByHref.get(association.englishPath);
  if (!zh || !en) {
    graph.unmapped.push({
      source: "content/article-language-associations.json",
      locator: `${association.chinesePath}|${association.englishPath}`,
      reason: "counterpart identity is missing",
    });
    continue;
  }
  addEdge(
    zh.contentId,
    "relatedTo",
    en.contentId,
    "content/article-language-associations.json",
  );
  addEdge(
    en.contentId,
    "relatedTo",
    zh.contentId,
    "content/article-language-associations.json",
  );
}

function sequenceKey(record) {
  if (record.knowledge) {
    return `knowledge:${record.knowledge.module}:${record.knowledge.stage}`;
  }
  if (record.roadmap) {
    return `roadmap:${record.roadmap.id}:${record.roadmap.stage}`;
  }
  return null;
}
function sequenceOrder(record) {
  return record.knowledge?.order ?? record.roadmap?.order ?? 0;
}

const sequences = new Map();
for (const record of [...knowledge, ...beginner]) {
  const key = sequenceKey(record);
  if (!key) continue;
  const list = sequences.get(key) ?? [];
  list.push(record);
  sequences.set(key, list);
}
for (const [key, records] of sequences) {
  const ordered = [...records].sort(
    (a, b) =>
      sequenceOrder(a) - sequenceOrder(b) || a.slug.localeCompare(b.slug),
  );
  for (let index = 0; index < ordered.length - 1; index += 1) {
    addEdge(
      ordered[index].contentId,
      "prerequisiteOf",
      ordered[index + 1].contentId,
      `registry-order:${key}`,
    );
  }
}

for (const { value: id, block } of apiBlocks) {
  for (const returnCodeName of quotedArrayField(block, "returnCodeNames")) {
    addEdge(
      `api:${id}`,
      "returns",
      `return-code:${returnCodeName}`,
      "src/lib/screeps-api-reference.ts#returnCodeNames",
    );
  }

  const guideHref = field(block, "guideHref");
  if (guideHref?.startsWith("/blog/")) {
    const article = chineseByPath.get(guideHref);
    if (article) {
      addEdge(
        article.contentId,
        "explains",
        `api:${id}`,
        "src/lib/screeps-api-reference.ts#guideHref",
      );
      const englishHref = englishByChinesePath.get(guideHref);
      const englishArticle = englishHref
        ? englishByHref.get(englishHref)
        : null;
      if (englishArticle) {
        addEdge(
          englishArticle.contentId,
          "usesApi",
          `api:${id}`,
          "content/article-language-associations.json#counterpart-api",
        );
      }
    } else {
      graph.unmapped.push({
        source: "src/lib/screeps-api-reference.ts",
        locator: guideHref,
        reason: "guideHref has no Article identity",
      });
    }
  }
}

for (const { value: id, block } of symptomBlocks) {
  if (!field(block, "zhTitle")) continue;

  for (const apiId of quotedArrayField(block, "directApiEntryIds")) {
    addEdge(
      `symptom:${id}`,
      "involvesApi",
      `api:${apiId}`,
      "src/lib/screeps-diagnostic-symptoms.ts#directApiEntryIds",
    );
  }
  for (const errorName of quotedArrayField(block, "errorNames")) {
    addEdge(
      `symptom:${id}`,
      "relatedTo",
      `return-code:${errorName}`,
      "src/lib/screeps-diagnostic-symptoms.ts#errorNames",
    );
  }
  for (const match of block.matchAll(
    /zhHref\s*:\s*["']\/tools\/([a-z0-9-]+)["']/g,
  )) {
    const toolId = toolBySlug.get(match[1]);
    if (toolId) {
      addEdge(
        `symptom:${id}`,
        "solvedBy",
        toolId,
        "src/lib/screeps-diagnostic-symptoms.ts#tools",
      );
    }
  }
  for (const match of block.matchAll(
    /zhHref\s*:\s*["'](\/blog\/[a-z0-9-]+)["']/g,
  )) {
    const article = chineseByPath.get(match[1]);
    if (article) {
      addEdge(
        `symptom:${id}`,
        "solvedBy",
        article.contentId,
        "src/lib/screeps-diagnostic-symptoms.ts#guides",
      );
    }
  }
  for (const match of block.matchAll(
    /enHref\s*:\s*["'](\/en\/blog\/[a-z0-9-]+)["']/g,
  )) {
    const article = englishByHref.get(match[1]);
    if (article) {
      addEdge(
        `symptom:${id}`,
        "solvedBy",
        article.contentId,
        "src/lib/screeps-diagnostic-symptoms.ts#guides",
      );
    }
  }
}

const experimentApiMap = new Map([
  ["creep-transfer", "creep-transfer"],
  ["spawn-creep", "spawn-spawn-creep"],
  ["cpu-bucket", "game-cpu-get-used"],
]);
for (const { value: experimentId, block } of experimentBlocks) {
  const key = field(block, "key");
  const apiId = key ? experimentApiMap.get(key) : null;
  if (apiId) {
    addEdge(
      `api:${apiId}`,
      "testedBy",
      experimentId,
      "src/lib/tick-lab-experiments.ts#experiment-key-contract",
    );
  }
}

graph.nodes.sort(
  (a, b) => a.type.localeCompare(b.type) || a.id.localeCompare(b.id),
);
graph.edges.sort(
  (a, b) =>
    a.from.localeCompare(b.from) ||
    a.relation.localeCompare(b.relation) ||
    a.to.localeCompare(b.to),
);
graph.unmapped.sort(
  (a, b) =>
    a.source.localeCompare(b.source) || a.locator.localeCompare(b.locator),
);

const serialized = `${JSON.stringify(graph, null, 2)}\n`;

if (process.argv.includes("--check")) {
  if (
    !fs.existsSync(outputPath) ||
    fs.readFileSync(outputPath, "utf8") !== serialized
  ) {
    console.error(
      "Knowledge Graph V1 generated artifact is stale or missing. Run node scripts/generate-knowledge-graph-v1.mjs.",
    );
    process.exit(1);
  }
  console.log(
    `[knowledge-graph-generate] PASS: generated artifact is current (${graph.nodes.length} nodes / ${graph.edges.length} edges / ${graph.unmapped.length} unmapped).`,
  );
} else {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, serialized);
  console.log(
    `[knowledge-graph-generate] wrote src/generated/knowledge-graph-v1.json (${graph.nodes.length} nodes / ${graph.edges.length} edges / ${graph.unmapped.length} unmapped).`,
  );
}
