import fs from "node:fs";
import path from "node:path";

function text(value) { return String(value ?? "").trim(); }
function field(objectSource, name) {
  const match = objectSource.match(new RegExp(`["']?${name}["']?\\s*:\\s*["']([^"']*)["']`));
  return match?.[1] ?? null;
}
function objectFromBrace(source, braceIndex) {
  let depth = 0, quote = null, escaped = false;
  for (let index = braceIndex; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") { quote = char; continue; }
    if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(braceIndex, index + 1);
    }
  }
  return null;
}

export function extractEnglishArticleRecords(source, sourceName = "english-registry") {
  const records = [];
  const hrefPattern = /["']?href["']?\s*:\s*["'](\/en\/blog\/[a-z0-9-]+)["']/g;
  for (const match of source.matchAll(hrefPattern)) {
    const brace = source.lastIndexOf("{", match.index);
    const objectSource = brace >= 0 ? objectFromBrace(source, brace) : null;
    if (!objectSource) continue;
    const chinesePath = field(objectSource, "chinesePath");
    const title = field(objectSource, "title");
    const primaryKeyword = field(objectSource, "primaryKeyword");
    const searchIntent = field(objectSource, "searchIntent");
    if (!chinesePath || !title || !primaryKeyword || !searchIntent) continue;
    records.push({ href: match[1], chinesePath, title, primaryKeyword, searchIntent, sourceName });
  }
  return records;
}

export function extractEnglishOverrides(source) {
  const overrides = new Map();
  const pattern = /["'](\/en\/blog\/[a-z0-9-]+)["']\s*:\s*\{/g;
  for (const match of source.matchAll(pattern)) {
    const brace = source.indexOf("{", match.index);
    const objectSource = brace >= 0 ? objectFromBrace(source, brace) : null;
    if (!objectSource) continue;
    const override = {};
    for (const name of ["title", "primaryKeyword", "searchIntent"]) {
      const value = field(objectSource, name);
      if (value) override[name] = value;
    }
    if (Object.keys(override).length) overrides.set(match[1], override);
  }
  return overrides;
}

export function extractErrorCodeRecords(source) {
  return [...source.matchAll(/\{\s*name:\s*["']([^"']+)["']\s*,\s*value:\s*(-?\d+)/g)]
    .map((match) => ({ name: match[1], value: Number.parseInt(match[2], 10) }));
}

export function extractGlossaryRecords(source) {
  return [...source.matchAll(/\{\s*term:\s*["']([^"']+)["']\s*,\s*chinese:\s*["']([^"']+)["']/g)]
    .map((match) => ({ term: match[1], chinese: match[2] }));
}

export function glossaryAnchor(term) { return text(term).toLowerCase().replaceAll(" ", "-"); }

function discoverEnglishModules(completeSource) {
  const modules = new Set(["english-articles"]);
  for (const match of completeSource.matchAll(/from\s+["']\.\/([^"']+)["']/g)) {
    if (match[1].startsWith("english-") && match[1] !== "english-articles-complete") modules.add(match[1]);
  }
  return [...modules];
}

export function loadSiteAssetExtensions(root, zhArticleAssets) {
  const lib = path.join(root, "src", "lib");
  const completePath = path.join(lib, "english-articles-complete.ts");
  const completeSource = fs.readFileSync(completePath, "utf8");
  const recordsByHref = new Map();
  for (const moduleName of discoverEnglishModules(completeSource)) {
    const sourcePath = path.join(lib, `${moduleName}.ts`);
    if (!fs.existsSync(sourcePath)) continue;
    const source = fs.readFileSync(sourcePath, "utf8");
    for (const record of extractEnglishArticleRecords(source, `src/lib/${moduleName}.ts`)) recordsByHref.set(record.href, record);
  }
  const overrides = extractEnglishOverrides(completeSource);
  for (const [href, override] of overrides) {
    const record = recordsByHref.get(href);
    if (record) recordsByHref.set(href, { ...record, ...override });
  }

  const zhByPath = new Map(zhArticleAssets.map((asset) => [asset.path, asset]));
  const englishArticles = [...recordsByHref.values()].sort((a, b) => a.href.localeCompare(b.href)).map((record) => {
    const pair = zhByPath.get(record.chinesePath) ?? null;
    const slug = record.href.slice("/en/blog/".length);
    return {
      assetId: `en:article:${slug}`, assetType: "article", language: "en", path: record.href, canonicalPath: record.href,
      routeKind: "page", slug, title: record.title, contentSystem: pair?.contentSystem ?? "english",
      module: pair?.module ?? null, roadmap: pair?.roadmap ?? null, stage: pair?.stage ?? null, order: pair?.order ?? null,
      difficulty: pair?.difficulty ?? null, primaryKeyword: record.primaryKeyword, keywordRole: "owner", searchIntent: record.searchIntent,
      metadataSource: record.sourceName, sourceOfTruth: "src/lib/english-articles-complete.ts", parentPath: "/en",
      languagePairPath: record.chinesePath, languagePairAssetId: pair?.assetId ?? null,
    };
  });

  const errorSource = fs.readFileSync(path.join(lib, "screeps-errors.ts"), "utf8");
  const errorCodes = extractErrorCodeRecords(errorSource).map((record, index) => {
    const anchor = record.name.toLowerCase();
    return {
      assetId: `zh-CN:error-code:${anchor}`, assetType: "error-code", language: "zh-CN", path: `/screeps-errors#${anchor}`,
      canonicalPath: "/screeps-errors", routeKind: "fragment", slug: anchor, title: `${record.name} (${record.value})`, contentSystem: "reference",
      module: null, roadmap: null, stage: null, order: (index + 1) * 10, difficulty: null, primaryKeyword: null, keywordRole: null,
      searchIntent: null, metadataSource: "error-code-registry", sourceOfTruth: "src/lib/screeps-errors.ts", parentPath: "/screeps-errors",
    };
  });

  const glossarySource = fs.readFileSync(path.join(lib, "screeps-glossary.ts"), "utf8");
  const glossary = extractGlossaryRecords(glossarySource).map((record, index) => {
    const anchor = glossaryAnchor(record.term);
    return {
      assetId: `zh-CN:glossary-term:${anchor}`, assetType: "glossary-term", language: "zh-CN", path: `/glossary#${anchor}`,
      canonicalPath: "/glossary", routeKind: "fragment", slug: anchor, title: `${record.term}｜${record.chinese}`, contentSystem: "reference",
      module: null, roadmap: null, stage: null, order: (index + 1) * 10, difficulty: null, primaryKeyword: null, keywordRole: null,
      searchIntent: null, metadataSource: "glossary-registry", sourceOfTruth: "src/lib/screeps-glossary.ts", parentPath: "/glossary",
    };
  });

  return { englishArticles, errorCodes, glossary };
}
